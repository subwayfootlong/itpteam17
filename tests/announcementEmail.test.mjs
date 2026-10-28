import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { database, seed, loadModule, routeMocks, memberId } from './helpers/emailHarness.mjs';

process.env.APP_URL='https://portal.example.test';
const request=(method,body)=>new Request('https://portal.example.test/api/admin/announcements',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const count=async(db,table)=>(await db.query(`select count(*)::int n from ${table}`)).rows[0].n;
const publish=async(db,audience='all',tiers=[])=> (await db.query("insert into announcements(title,content,status,audience_type,eligible_tiers) values ('Title','Summary','published',$1,$2) returning id",[audience,tiers])).rows[0].id;

test('actual admin routes: draft, publication, edits, audience edit, archive and republish',async()=>{
  const db=await database();
  try {
    await seed(db,{role:'admin'});
    let inApp=0;
    const mocks={...routeMocks(db),'@/lib/notifications':{notifyAnnouncementPublished:async()=>{inApp++;}}};
    const create=loadModule('app/api/admin/announcements/route.ts',mocks);
    const edit=loadModule('app/api/admin/announcements/[id]/route.ts',mocks);
    assert.equal((await create.POST(request('POST',{title:'Draft',content:'Body',status:'draft'}))).status,201);
    assert.equal(await count(db,'announcement_email_publications'),0);
    const id=(await db.query('select id from announcements')).rows[0].id;
    const context={params:Promise.resolve({id})};
    assert.equal((await edit.PATCH(request('PATCH',{status:'published'}),context)).status,200);
    assert.equal(await count(db,'announcement_email_publications'),1);assert.equal(inApp,1);
    await edit.PATCH(request('PATCH',{title:'Edited'}),context);
    assert.equal(await count(db,'announcement_email_publications'),1);assert.equal(inApp,1);
    await edit.PATCH(request('PATCH',{audience_type:'selected_tiers',eligible_tiers:['basic']}),context);
    assert.equal(await count(db,'announcement_email_publications'),1);assert.equal(inApp,2); // Existing in-app audience behaviour.
    await edit.PATCH(request('PATCH',{status:'archived'}),context);
    assert.equal(inApp,2);
    await edit.PATCH(request('PATCH',{status:'published'}),context);
    assert.equal(await count(db,'announcement_email_publications'),1);assert.equal(inApp,3);
    assert.equal((await create.POST(request('POST',{title:'Direct',content:'Body',status:'published'}))).status,201);
    assert.equal(await count(db,'announcement_email_publications'),2);assert.equal(inApp,4);
    await db.exec('begin');await publish(db);await db.exec('rollback');
    assert.equal(await count(db,'announcement_email_publications'),2);
    await db.exec("alter table announcements add constraint blocked_title check(title <> 'Fail')");
    assert.equal((await create.POST(request('POST',{title:'Fail',content:'Body',status:'published'}))).status,500);
    assert.equal(await count(db,'announcement_email_publications'),2);
    await db.exec("update users set role='member'");
    assert.equal((await create.POST(request('POST',{title:'No',content:'Body',status:'published'}))).status,403);
    assert.equal((await edit.PATCH(request('PATCH',{status:'published'}),context)).status,403);
    const anonymous=loadModule('app/api/admin/announcements/route.ts',{...mocks,...routeMocks(db,{authenticated:false})});
    assert.equal((await anonymous.POST(request('POST',{title:'No',content:'Body',status:'published'}))).status,401);
  } finally {await db.close();}
});

test('recipient selection honours role, active status, expiry, original/current tier and consent',async()=>{
  const db=await database();
  try {
    await seed(db);
    for(let i=1;i<=7;i++) {
      const id=`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`;
      await db.query('insert into users(id,email,role,membership_tier,membership_status,expiry_date) values ($1,$2,$3,$4,$5,$6)',
        [id,`user${i}@example.test`,i===1?'admin':'member',i===2?'ordinary':'basic',i===3?'suspended':'active',i===4?'2000-01-01':null]);
      await db.query('insert into notification_preferences(user_id,email_enabled) values($1,$2)',[id,i!==5]);
    }
    const id=await publish(db,'selected_tiers',['basic']);
    await db.exec("update users set created_at=now()+interval '1 hour' where email='user7@example.test'");
    await db.query("update announcements set audience_type='all',eligible_tiers='{}' where id=$1",[id]);
    // Turning on after publication is not consent for this old message.
    await db.exec("update notification_preferences set email_enabled=true where not email_enabled");
    const worker=loadModule('lib/transactionalEmail.ts',routeMocks(db));
    assert.equal(await worker.expandNextAnnouncementEmail(),'expanded');
    assert.equal(await worker.expandNextAnnouncementEmail(),'idle');
    assert.equal(await count(db,'email_outbox'),2); // Main member and eligible #6.
    await db.query("update announcements set audience_type='all',eligible_tiers='{}',title='Edited' where id=$1",[id]);
    assert.equal(await worker.expandNextAnnouncementEmail(),'idle');
    assert.equal(await count(db,'email_outbox'),2);
    const sent=[];
    const deps={...worker.emailDeliveryDependencies,send:async(...args)=>{sent.push(args);}};
    assert.equal(await worker.deliverNextEmail(deps),'sent');
    assert.equal(await worker.deliverNextEmail(deps),'sent');
    assert.equal(await worker.deliverNextEmail(deps),'idle');
    assert.deepEqual(sent.map(s=>s[0]).sort(),['member@example.test','user6@example.test']);
    for(const mail of sent) {assert.match(mail[2],/Summary/);assert.match(mail[4],/PERGAS/);assert.match(mail[2],/https:\/\/portal.example.test\/member\/community/);}
    await db.query("update announcements set status='archived' where id=$1",[id]);
    await db.query("update announcements set status='published' where id=$1",[id]);
    assert.equal(await worker.expandNextAnnouncementEmail(),'idle');
    assert.equal(await count(db,'email_outbox'),2);
  } finally {await db.close();}
});

test('delivery rechecks audience, opt-out and archive; SMTP retry uses same job identity',async()=>{
  const db=await database();
  try {
    await seed(db);
    const worker=loadModule('lib/transactionalEmail.ts',routeMocks(db));
    const sent=[];let fail=false;
    const deps={...worker.emailDeliveryDependencies,send:async(...args)=>{sent.push(args);if(fail)throw Error('SMTP failed');}};
    const first=await publish(db);await worker.expandNextAnnouncementEmail();
    await db.query("update announcements set eligible_tiers='{ordinary}',audience_type='selected_tiers' where id=$1",[first]);
    assert.equal(await worker.deliverNextEmail(deps),'skipped');
    const second=await publish(db);await worker.expandNextAnnouncementEmail();
    await db.exec('update notification_preferences set email_enabled=false');
    assert.equal(await worker.deliverNextEmail(deps),'skipped');
    await db.exec('update notification_preferences set email_enabled=true');
    const third=await publish(db);await worker.expandNextAnnouncementEmail();
    await db.query("update announcements set status='archived' where id=$1",[third]);
    assert.equal(await worker.deliverNextEmail(deps),'skipped');
    await publish(db);await worker.expandNextAnnouncementEmail();
    fail=true;assert.equal(await worker.deliverNextEmail(deps),'retry');
    await db.exec("update email_outbox set available_at=now()-interval '1 second' where status='pending'");
    fail=false;assert.equal(await worker.deliverNextEmail(deps),'sent');
    assert.equal(await worker.deliverNextEmail(deps),'idle');
    assert.equal(sent.length,2);assert.equal(sent[0][3],sent[1][3]);
    assert.equal((await db.query('select count(*)::int n from email_outbox where status=\'skipped\'')).rows[0].n,3);
    assert.ok(second);
  } finally {await db.close();}
});

test('fanout is bounded to 100, recoverable after crashes and idempotent',async()=>{
  const db=await database();
  try {
    await db.exec(`insert into users(id,email,first_name) select ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
      'member'||n||'@example.test','Member' from generate_series(1,205) n;
      insert into notification_preferences(user_id,email_enabled) select id,true from users;`);
    await publish(db);
    const claim=(await db.query('select * from claim_announcement_email_batch()')).rows[0];
    assert.equal((await db.query('select * from claim_announcement_email_batch()')).rows.length,0);
    await db.exec("update announcement_email_publications set lease_until=now()-interval '1 second'");
    const worker=loadModule('lib/transactionalEmail.ts',routeMocks(db));
    await worker.expandNextAnnouncementEmail();assert.equal(await count(db,'email_outbox'),100);
    assert.equal((await db.query('select finish_announcement_email_batch($1,$2,$3,$4,true) ok',[claim.source_id,claim.lease_token,[],null])).rows[0].ok,false);
    await worker.expandNextAnnouncementEmail();assert.equal(await count(db,'email_outbox'),200);
    await worker.expandNextAnnouncementEmail();assert.equal(await count(db,'email_outbox'),205);
    assert.equal(await worker.expandNextAnnouncementEmail(),'idle');
    // Replaying the campaign intentionally cannot duplicate outbox rows.
    await db.exec("update announcement_email_publications set status='pending',cursor_id=null");
    await worker.expandNextAnnouncementEmail();assert.equal(await count(db,'email_outbox'),205);
    await db.exec('set role authenticated');
    await assert.rejects(db.query('select * from announcement_email_publications'));
    await assert.rejects(db.query('select * from claim_announcement_email_batch()'));
    await db.exec('reset role');
  } finally {await db.close();}
});

test('migration does not send historical published/archived announcements; drafts still publish',async()=>{
  const db=await database({announcements:false});
  try {
    await seed(db);await publish(db);
    await db.exec("insert into announcements(title,status) values ('Old archived','archived'),('Existing draft','draft')");
    await db.exec(fs.readFileSync('docs/supabase-announcement-email.sql','utf8'));
    await db.exec(fs.readFileSync('docs/supabase-announcement-email.sql','utf8'));
    const worker=loadModule('lib/transactionalEmail.ts',routeMocks(db));
    assert.equal(await worker.expandNextAnnouncementEmail(),'idle');
    await db.exec("update announcements set status='published' where status='archived'");
    assert.equal(await worker.expandNextAnnouncementEmail(),'idle');
    await db.exec("update announcements set status='published' where status='draft'");
    assert.equal(await worker.expandNextAnnouncementEmail(),'expanded');
    assert.equal(await count(db,'email_outbox'),1);
  } finally {await db.close();}
});

test('announcement HTML escapes names, title and summary, with plain text and preferences',()=>{
  const {announcementAlertEmail}=loadModule('lib/transactionalEmailTemplates.ts');
  const message=announcementAlertEmail('<img onerror=x>',{id:memberId,title:'<script>x</script>\r\nInjected',content:'<b>Notice</b> & '+ 'word '.repeat(200)});
  assert.doesNotMatch(message.subject,/[\r\n]/);assert.doesNotMatch(message.html,/<script>|<img/);
  assert.match(message.html,/&lt;script&gt;/);assert.match(message.html,/Notice &amp;/);
  assert.match(message.text,/Manage RSVP confirmation and announcement emails/);
  assert.ok(message.text.length<1000);
});
