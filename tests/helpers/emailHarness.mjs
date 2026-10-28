import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';

const require = createRequire(import.meta.url);
export const memberId = '11111111-1111-4111-8111-111111111111';
export const eventId = '22222222-2222-4222-8222-222222222222';

export async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create table users (id uuid primary key, email text, role text default 'member', first_name text, last_name text,
      phone text, organization text, membership_tier text default 'basic', membership_status text default 'active',
      expiry_date date, profile_image_url text);
    create table events (id uuid primary key, title text, event_date date, start_time time, end_time time, venue text,
      capacity integer, spots_available integer, status text default 'published', external_rsvp_url text,
      audience_type text default 'all', eligible_tiers text[] default '{}', show_locked_preview boolean default false);
    create table event_registrations (id uuid primary key default gen_random_uuid(), event_id uuid references events(id),
      user_id uuid references users(id), status text, registered_at timestamptz default now(), rejection_message text,
      unique(event_id, user_id));
    create table analytics_events(id uuid default gen_random_uuid(), user_id uuid, event_type text, target_id uuid, category text, metadata jsonb);
    create table notification_preferences (user_id uuid primary key references users(id), benefit_enabled boolean default true,
      announcement_enabled boolean default true, event_enabled boolean default true, updated_at timestamptz default now());
    create table announcements (id uuid primary key default gen_random_uuid(), title text, content text, status text default 'draft',
      category text, image_url text, poll_enabled boolean, poll_question text, audience_type text default 'all',
      eligible_tiers text[] default '{}', show_locked_preview boolean default false);
  `);
  await db.exec(fs.readFileSync('docs/supabase-transactional-email.sql', 'utf8'));
  return db;
}

export async function seed(db, { optedIn = true, role = 'member', external = false } = {}) {
  await db.query('insert into users(id,email,role,first_name,last_name) values ($1,$2,$3,$4,$5)', [memberId,'member@example.test',role,'Test','Member']);
  await db.query('insert into notification_preferences(user_id,email_enabled) values ($1,$2)', [memberId,optedIn]);
  await db.query("insert into events(id,title,event_date,start_time,end_time,venue,capacity,spots_available,external_rsvp_url) values ($1,'Community event','2099-12-01','10:00','12:00','Pergas',10,10,$2)", [eventId, external ? 'https://example.test/external' : null]);
}

// Small PostgREST adapter: exercises the actual SQL triggers/functions and actual TS handlers.
export function supabase(db) {
  const api = { from(table) {
    let operation = 'select', payload, columns = null, filters = [], order = '', single = false;
    const builder = new Proxy({}, { get(_, method) {
      if (method === 'then') return (resolve, reject) => execute().then(resolve, reject);
      return (...args) => {
        if (method === 'select') columns = args[0];
        if (['insert','update','upsert','delete'].includes(method)) { operation = method; payload = args[0]; }
        if (['eq','neq','gt','lte'].includes(method)) filters.push([args[0], method === 'eq' ? '=' : method === 'neq' ? '<>' : method === 'gt' ? '>' : '<=', args[1]]);
        if (method === 'order') order = ` order by ${args[0]} ${args[1]?.ascending === false ? 'desc' : 'asc'}`;
        if (['maybeSingle','single'].includes(method)) single = true;
        return builder;
      };
    } });
    async function execute() {
      try {
        const values = [];
        const param = v => { values.push(v); return `$${values.length}`; };
        let sql;
        if (operation === 'select') sql = `select ${columns || '*'} from ${table}`;
        else if (operation === 'delete') sql = `delete from ${table}`;
        else if (operation === 'update') sql = `update ${table} set ${Object.entries(payload).map(([k,v]) => `${k}=${param(v)}`).join(',')}`;
        else {
          const rows = Array.isArray(payload) ? payload : [payload], keys = Object.keys(rows[0]);
          sql = `insert into ${table} (${keys.join(',')}) values ${rows.map(r => `(${keys.map(k=>param(r[k])).join(',')})`).join(',')}`;
          if (operation === 'upsert') sql += ` on conflict (user_id) do update set ${keys.filter(k=>k!=='user_id').map(k=>`${k}=excluded.${k}`).join(',')}`;
        }
        if (filters.length) sql += ' where ' + filters.map(([k,op,v])=>`${k} ${op} ${param(v)}`).join(' and ');
        if (operation === 'select') sql += order;
        else if (columns) sql += ` returning ${columns}`;
        const result = await db.query(sql, values);
        const rows = JSON.parse(JSON.stringify(result.rows));
        return { data: single ? rows[0] ?? null : rows, error: null };
      } catch (error) { return { data: null, error: { code: error.code, message: 'Test database failure' } }; }
    }
    return builder;
  }, rpc(name, args = {}) {
    const promise = (async () => {
      try {
        const values = Object.values(args);
        const params = Object.keys(args).map((k,i)=>`${k} => $${i+1}`).join(',');
        const result = await db.query(`select * from ${name}(${params})`, values);
        const scalar = name.startsWith('finish_');
        return { data: scalar ? result.rows[0]?.[name] : result.rows, error: null };
      } catch (error) { return { data: null, error: { code: error.code, message: 'Test RPC failure' } }; }
    })();
    promise.abortSignal = () => promise;
    return promise;
  } };
  return api;
}

export function loadModule(filename, mocks = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file,module);
    const code = ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
    } }).outputText;
    const localRequire = name => {
      const resolved = name.startsWith('@/') ? path.resolve(name.slice(2)) : name.startsWith('.') ? path.resolve(path.dirname(file),name) : null;
      const key = resolved ? '@/' + path.relative(process.cwd(),resolved).split(path.sep).join('/') : name;
      if (key in mocks) return mocks[key];
      if (name === 'server-only') return {};
      return resolved ? load(resolved+'.ts') : require(name);
    };
    vm.runInNewContext(code,{ module,exports:module.exports,require:localRequire,process,Buffer,URL,Response,Request,AbortSignal,
      setTimeout,clearTimeout,console },{filename:file});
    return module.exports;
  }
  return load(filename);
}

export function routeMocks(db, { authenticated = true } = {}) {
  return {
    'next/server': { NextResponse: Response },
    'next/headers': { cookies: async () => ({ get: () => authenticated ? { value: 'session' } : undefined }) },
    '@/lib/auth': { verifyAccessToken: () => ({ sub: memberId, email: 'member@example.test' }) },
    '@/lib/supabaseServer': { supabaseAdmin: supabase(db) },
    '@/lib/email': { sendEmail: async () => {} },
  };
}
