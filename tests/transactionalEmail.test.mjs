import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { database, seed, loadModule, routeMocks, supabase, memberId, eventId } from './helpers/emailHarness.mjs';

process.env.APP_URL = 'https://portal.example.test';
const req = (method='POST', body={eventId}, url='https://portal.example.test/api/events/rsvp') =>
  new Request(url,{ method, ...(method !== 'GET' ? {headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {}) });

test('RSVP routes: success, duplicate, rejection/reactivation, cancellation and failed insert', async () => {
  const db = await database();
  try {
    await seed(db);
    const route = loadModule('app/api/events/rsvp/route.ts',routeMocks(db));
    assert.equal((await route.POST(req())).status,200);
    assert.equal((await db.query('select count(*)::int n from email_outbox')).rows[0].n,1);
    assert.equal((await route.POST(req())).status,400);
    assert.equal((await db.query('select count(*)::int n from email_outbox')).rows[0].n,1);
    await db.exec("update event_registrations set status='rejected'");
    assert.equal((await route.POST(req())).status,200);
    assert.equal((await db.query('select count(*)::int n from email_outbox')).rows[0].n,2);
    assert.equal((await route.DELETE(req('DELETE'))).status,200);
    assert.equal((await db.query('select count(*)::int n from email_outbox')).rows[0].n,2);
    await db.exec("alter table event_registrations add constraint test_failure check (status <> 'registered')");
    assert.equal((await route.POST(req())).status,500);
    assert.equal((await db.query('select count(*)::int n from email_outbox')).rows[0].n,2);
  } finally { await db.close(); }
});

test('RSVP eligibility/capacity/auth failures and external redirect never queue', async () => {
  const db=await database();
  try {
    await seed(db,{external:true});
    const route=loadModule('app/api/events/rsvp/route.ts',routeMocks(db));
    assert.equal((await route.GET(req('GET',null,`https://portal.example.test/api/events/rsvp?eventId=${eventId}`))).status,302);
    assert.equal((await db.query('select count(*)::int n from email_outbox')).rows[0].n,0);
    // Even a direct POST against an external event must not produce a confirmation.
    assert.equal((await route.POST(req())).status,200);
    assert.equal((await db.query('select count(*)::int n from email_outbox')).rows[0].n,0);
    await db.exec("delete from event_registrations; update events set external_rsvp_url=null,spots_available=0");
    assert.equal((await route.POST(req())).status,400);
    await db.exec("update users set membership_status='suspended'");
    assert.equal((await route.POST(req())).status,403);
    await db.exec("update users set role='admin'");
    assert.equal((await route.POST(req())).status,403);
    const anonymous=loadModule('app/api/events/rsvp/route.ts',routeMocks(db,{authenticated:false}));
    assert.equal((await anonymous.POST(req())).status,401);
    assert.equal((await db.query('select count(*)::int n from email_outbox')).rows[0].n,0);
  } finally {await db.close();}
});

test('email preferences persist, default off, validate booleans and ignore client user IDs',async()=>{
  const db=await database();
  try {
    await seed(db,{optedIn:false});
    const prefs=loadModule('app/api/member/notification-preferences/route.ts',routeMocks(db));
    const get=async()=> (await (await prefs.GET()).json()).preferences;
    assert.equal((await get()).email,false);
    assert.equal((await prefs.PATCH(req('PATCH',{email:'yes'}))).status,400);
    assert.equal((await prefs.PATCH(req('PATCH',{email:true,user_id:eventId}))).status,200);
    assert.equal((await get()).email,true);
    assert.equal((await db.query('select count(*)::int n from notification_preferences')).rows[0].n,1);
    await prefs.PATCH(req('PATCH',{announcement:false}));
    assert.equal((await get()).email,true);
    await prefs.PATCH(req('PATCH',{email:false}));
    assert.equal((await get()).announcement,false);
    const fresh=loadModule('app/api/member/notification-preferences/route.ts',routeMocks(db));
    assert.equal((await (await fresh.GET()).json()).preferences.email,false);
    await loadModule('app/api/events/rsvp/route.ts',routeMocks(db)).POST(req());
    assert.equal((await db.query('select count(*)::int n from email_outbox')).rows[0].n,0);
    await db.exec("update users set role='admin'");
    assert.equal((await fresh.PATCH(req('PATCH',{email:true}))).status,403);
    assert.equal((await loadModule('app/api/member/notification-preferences/route.ts',routeMocks(db,{authenticated:false})).GET()).status,401);
  } finally {await db.close();}
});

test('SQL migration is rerunnable; rollback, claims, lease recovery and retry cap are durable',async()=>{
  const db=await database();
  try {
    await db.exec(fs.readFileSync('docs/supabase-transactional-email.sql','utf8'));
    await seed(db);
    await db.exec(`begin; insert into event_registrations(event_id,user_id,status) values ('${eventId}','${memberId}','registered'); rollback;`);
    assert.equal((await db.query('select count(*)::int n from email_outbox')).rows[0].n,0);
    await loadModule('app/api/events/rsvp/route.ts',routeMocks(db)).POST(req());
    const claim=async()=> (await db.query('select * from claim_transactional_email()')).rows[0];
    const first=await claim(); assert.ok(first);
    assert.equal(await claim(),undefined);
    await db.exec("update email_outbox set lease_until=now()-interval '1 second'");
    const recovered=await claim(); assert.notEqual(recovered.lease_token,first.lease_token);
    assert.equal((await db.query("select finish_transactional_email($1,$2,'sent') ok",[first.id,first.lease_token])).rows[0].ok,false);
    await db.query("select finish_transactional_email($1,$2,'retry')",[recovered.id,recovered.lease_token]);
    assert.equal(await claim(),undefined); // Backoff enforced.
    for(let i=0;i<3;i++) {
      await db.exec("update email_outbox set available_at=now()-interval '1 second'");
      const job=await claim();
      await db.query("select finish_transactional_email($1,$2,'retry')",[job.id,job.lease_token]);
    }
    assert.equal((await db.query('select status from email_outbox')).rows[0].status,'failed');
    assert.equal(await claim(),undefined);
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from email_outbox'));
    await assert.rejects(db.query('select * from claim_transactional_email()'));
    await db.exec('reset role');
  } finally {await db.close();}
});

test('delivery SMTP failure retries without changing registration; sent job deduplicated',async()=>{
  const db=await database();
  try {
    await seed(db);
    await loadModule('app/api/events/rsvp/route.ts',routeMocks(db)).POST(req());
    const worker=loadModule('lib/transactionalEmail.ts',routeMocks(db));
    let attempts=0, message;
    const deps={...worker.emailDeliveryDependencies,send:async(...args)=>{attempts++;message=args;if(attempts===1)throw Error('SMTP secret detail');}};
    assert.equal(await worker.deliverNextEmail(deps),'retry');
    assert.equal((await db.query('select status from event_registrations')).rows[0].status,'registered');
    assert.equal((await db.query('select last_error from email_outbox')).rows[0].last_error,'delivery_failed');
    await db.exec("update email_outbox set available_at=now()-interval '1 second'");
    assert.equal(await worker.deliverNextEmail(deps),'sent');
    assert.equal(await worker.deliverNextEmail(deps),'idle');
    assert.equal(attempts,2);
    assert.equal(message[0],'member@example.test');
    assert.match(message[2],/Test Member/); assert.match(message[2],/Community event/);
    assert.match(message[2],/Singapore time/); assert.match(message[2],/Pergas/);
    assert.doesNotMatch(message[2],/token=|password|otp_hash/);
  } finally {await db.close();}
});

test('delivery rechecks opt-out, cancellation and current account email',async()=>{
  for(const change of ['optout','cancel','email']) {
    const db=await database();
    try {
      await seed(db); await loadModule('app/api/events/rsvp/route.ts',routeMocks(db)).POST(req());
      if(change==='optout') await db.exec('update notification_preferences set email_enabled=false');
      if(change==='cancel') await db.exec('delete from event_registrations');
      if(change==='email') await db.exec("update users set email='current@example.test'");
      const worker=loadModule('lib/transactionalEmail.ts',routeMocks(db));
      let recipient;
      const result=await worker.deliverNextEmail({...worker.emailDeliveryDependencies,send:async(to)=>{recipient=to;}});
      assert.equal(result,change==='email'?'sent':'skipped');
      assert.equal(recipient,change==='email'?'current@example.test':undefined);
    } finally {await db.close();}
  }
});

test('email template escapes untrusted content and uses trusted portal links',()=>{
  const templates=loadModule('lib/transactionalEmailTemplates.ts');
  const content=templates.rsvpConfirmationEmail('<img src=x onerror=alert(1)>',{id:eventId,title:'<script>alert(1)</script>',event_date:'2099-12-01',start_time:null,end_time:null,venue:'A & B'});
  assert.doesNotMatch(content.html,/<script>|<img/);
  assert.match(content.html,/&lt;script&gt;/); assert.match(content.html,/A &amp; B/);
  assert.match(content.text,/<script>/); // Plain text is not interpreted as HTML.
  process.env.APP_URL='javascript:alert(1)';
  assert.throws(()=>templates.portalEmailUrl('/member'));
  process.env.APP_URL='https://portal.example.test';
});

test('worker rejects missing/wrong secrets before accessing queue',async()=>{
  process.env.TRANSACTIONAL_EMAIL_WORKER_SECRET='test-secret-with-at-least-32-characters';
  const worker=loadModule('app/api/internal/transactional-emails/route.ts',{'@/lib/supabaseServer':{supabaseAdmin:{rpc:()=>{throw Error('Must not query');}}},'@/lib/email':{sendEmail:async()=>{}}});
  for(const headers of [{},{authorization:'Bearer wrong'}]) {
    const res=await worker.POST(new Request('https://example.test/worker',{method:'POST',headers}));
    assert.equal(res.status,401);
  }
});

test('existing SMTP transport sends HTML/text, one recipient, sanitises failure and closes',async()=>{
  Object.assign(process.env,{SMTP_HOST:'smtp.example.test',SMTP_PORT:'587',SMTP_USER:'test',SMTP_PASSWORD:'test',EMAIL_FROM:'pergas@example.test'});
  let mail,closed=0;
  const sender=loadModule('lib/email.ts',{nodemailer:{createTransport:()=>({sendMail:async(value)=>{mail=value;return {accepted:['ok'],rejected:[]};},close:()=>{closed++;}})}});
  await sender.sendEmail('member@example.test','Subject','Text','stable-id','<p>HTML</p>');
  assert.equal(mail.to.length,1); assert.equal(mail.html,'<p>HTML</p>');assert.equal(mail.text,'Text');assert.equal(closed,1);
  const failed=loadModule('lib/email.ts',{nodemailer:{createTransport:()=>({sendMail:async()=>{throw Error('SMTP_PASSWORD sensitive');},close:()=>{closed++;}})}});
  await assert.rejects(failed.sendEmail('member@example.test','Subject','Text','stable-id'),/Email delivery failed/);
  assert.equal(closed,2);
});
