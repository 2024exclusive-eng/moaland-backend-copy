import test from 'node:test';
import assert from 'node:assert/strict';
import {reminders,eligibility,hasReview,timestamp,templateData} from '../src/utils/notificationPolicy.js';
import pool from '../src/utils/pool.js';
import {runWorker,queue,setVisit,changeStatus} from '../src/libs/notifications.js';
const now=new Date('2026-10-01T00:00:00Z'), visit={confirmed_visit_at:'2026-10-10T03:00:00Z',revision:2};
test('six reminders use exact visit time and explicit review basis',()=>{const jobs=reminders(visit,now);assert.equal(jobs.length,6);assert.equal(jobs[0].due.toISOString(),'2026-10-07T03:00:00.000Z');assert.equal(jobs[2].due.toISOString(),'2026-10-10T02:00:00.000Z');assert.equal(jobs[5].due.toISOString(),'2026-10-15T03:00:00.000Z');assert.equal(reminders(visit,now,'completed').length,3);assert.equal(reminders({...visit,completed_at:'2026-10-11T00:00:00Z'},now,'completed')[3].due.toISOString(),'2026-10-13T00:00:00.000Z');});
test('past reminders are not delivered in a burst',()=>{assert.equal(reminders(visit,new Date('2026-10-20')).length,0);});
test('timezone is required and equivalent Korean/Chinese times match',()=>{assert.throws(()=>timestamp('2026-10-10T12:00'));assert.equal(+timestamp('2026-10-10T12:00+09:00'),+timestamp('2026-10-10T11:00+08:00'));});
test('review, deletion, rejection and stale schedules suppress dispatch',()=>{const j={kind:'review',revision:2};const e={status:'selected',link:null};const u={is_delete:'N'};assert.equal(eligibility(j,e,visit,u),null);assert.equal(eligibility(j,{...e,link:'{"Xiaohongshu":"https://xhslink.com/1"}'},visit,u),'review_submitted');assert.equal(eligibility(j,e,{revision:3},u),'schedule_changed');assert.equal(eligibility(j,{status:'rejected'},visit,u),'not_selected');assert.equal(eligibility(j,e,visit,{is_delete:'Y'}),'account_or_enrollment_removed');assert.equal(eligibility(j,null,visit,u),'account_or_enrollment_removed');assert.equal(hasReview('{}'),false);});
test('advertisers cannot receive other owners events or disabled accounts',()=>{const j={kind:'application',recipient_admin_id:2};const e={owner_admin_id:3};assert.equal(eligibility(j,e,null,{is_delete:'N'},{id:2,role:'advertiser',is_active:1}),'admin_access_removed');assert.equal(eligibility(j,e,null,{is_delete:'N'},{id:2,role:'super_admin',is_active:1}),null);});
test('template mappings only use configured fields and bounded Chinese text',()=>{assert.equal(templateData({fields:{thing1:'title'}},{title:'中'.repeat(30)}).thing1.value.length,20);assert.throws(()=>templateData({fields:{thing1:'secret'}},{title:'x'}));});
function fakeWorker({link=null,status='selected',sendState='pending',sub='accept',lock=1,channel='wechat',kind='review'}={}) {
 const job={id:1,enroll_id:5,recipient_user_id:3,kind,channel,revision:2,state:sendState};const calls=[];
 const db={release(){},async query(sql,args=[]){calls.push({sql,args});
 if(sql.includes('GET_LOCK'))return [[{acquired:lock}]];
 if(sql.includes('RELEASE_LOCK'))return [[{released:1}]];
 if(sql.startsWith('SELECT * FROM notification_job'))return [[...(job.state==='pending'?[job]:[])]];
 if(sql.includes('FROM mission_enroll e'))return [[{id:5,mission_id:7,status,link,title:'测试',user_id:3}]];
 if(sql.startsWith('SELECT * FROM notification_visit'))return [[{...visit}]];
 if(sql.includes('SELECT oauth_id'))return [[{oauth_id:'test-openid',oauth_type:'WECHAT_MP',is_delete:'N'}]];
 if(sql.includes('SELECT choice'))return [[{choice:sub}]];
 if(sql.startsWith("UPDATE notification_job SET state='sending'")){job.state='sending';return [{affectedRows:1}];}
 if(sql.startsWith('UPDATE notification_job j JOIN')){job.state='sending';return [{affectedRows:1}];}
 if(sql.startsWith('UPDATE notification_job SET state=?')){job.state=args[0];job.reason=args[1];return [{affectedRows:1}];}
 if(sql.startsWith('UPDATE notification_job'))return [{affectedRows:0}];
 throw new Error('Unexpected SQL: '+sql);
 }};pool.getConnection=async()=>db;return {job,calls};
}
process.env.NOTIFICATIONS_ENABLED='true';process.env.NOTIFICATION_SEND_ENABLED='true';process.env.WX_NOTIFICATION_TEMPLATES=JSON.stringify({review:{id:'review-template',fields:{thing1:'title'}}});
test('worker marks before send, sends once and does not send completed reviews',async()=>{const f=fakeWorker();let sent=0;await runWorker(async()=>{assert.equal(f.job.state,'sending');sent++;return {errcode:0};});await runWorker(async()=>{sent++;return {errcode:0};});assert.equal(sent,1);assert.equal(f.job.state,'sent');const g=fakeWorker({link:'{"Xiaohongshu":"https://xhslink.com/1"}'});await runWorker(()=>assert.fail('must not send'));assert.equal(g.job.state,'cancelled');});
test('ambiguous network response is never automatically resent',async()=>{const f=fakeWorker();await runWorker(async()=>{throw new Error('timeout');});assert.equal(f.job.state,'uncertain');await runWorker(()=>assert.fail('no retry'));});
test('denied subscription stops without attempting delivery',async()=>{const f=fakeWorker({sub:'reject'});await runWorker(()=>assert.fail('no delivery'));assert.equal(f.job.state,'blocked');assert.equal(f.job.reason,'subscription_required');});
test('provider exhausted subscription is blocked, no uncontrolled retries',async()=>{const f=fakeWorker();await runWorker(async()=>({errcode:43101}));assert.equal(f.job.state,'blocked');await runWorker(()=>assert.fail('no retry'));});
test('another worker lock prevents all dispatch',async()=>{fakeWorker({lock:0});const r=await runWorker(()=>assert.fail());assert.equal(r.busy,true);});
test('admin events queue only one WeCom job with deterministic key',async()=>{const queries=[];await queue({query:async(sql,args)=>{queries.push({sql,args});return [{affectedRows:1}];}},{id:5,user_id:3,owner_admin_id:2},'application','created');assert.equal(queries.length,1);assert.match(queries[0].sql,/INSERT IGNORE/);assert.equal(queries[0].args[0],'5:application:created:wecom');assert.equal(queries[0].args[8],'wecom');});
test('schedule mutation enforces ownership before writing',async()=>{let writes=0;const db={beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release(){},query:async(sql)=>{if(sql.startsWith('SELECT'))return [[{id:5,user_id:3,owner_admin_id:7,status:'selected'}]];writes++;return [{}];}};pool.getConnection=async()=>db;await assert.rejects(setVisit(5,{visitAt:'2026-10-10T12:00+09:00',completedAt:null},{admin:{id:8,role:'advertiser'}}),/NOT_FOUND/);assert.equal(writes,0);});
test.after(async()=>{await pool.end();});

test('admin worker sends WeCom without mini template or subscription consent',async()=>{const f=fakeWorker({kind:'application',channel:'wecom',sub:'reject',status:'applied'});await runWorker(async message=>{assert.equal(message.channel,'wecom');assert.equal(message.template_id,undefined);assert.equal(message.touser,undefined);assert.match(message.content,/新报名/);return {errcode:0};});assert.equal(f.job.state,'sent');assert.equal(f.calls.some(c=>c.sql.includes('SELECT choice')),false);});
