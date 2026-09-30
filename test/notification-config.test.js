import test from 'node:test';
import assert from 'node:assert/strict';
import {templates,templateData,reminders} from '../src/utils/notificationPolicy.js';
import {recordSubscriptions,runWorker} from '../src/libs/notifications.js';
import pool from '../src/utils/pool.js';
test('all supplied field keys map to populated values with exact date and time formats',()=>{
 const c=templates({});
 const values={title:'活动',status:'报名成功',time:'2026-10-15 14:00',remark:'请准时到访',address:'上海',brand:'门店',taskType:'提交评价',deadline:'2026-10-20 18:00'};
 const keys={approved:['thing18','phrase1','time20','thing5'],visit_3d:['thing2','time8','thing10','thing11'],visit_1d:['thing2','time14','thing10','thing4'],visit_1h:['thing2','date3','thing6','thing1'],review:['thing1','thing2','time16','thing11']};
 for(const [kind,t] of Object.entries(c)){assert.deepEqual(Object.keys(templateData(t,values)),keys[kind]);}
 assert.equal(templateData(c.visit_1h,values).date3.value,'2026年10月15日 14:00');
 assert.equal(templateData(c.approved,values).time20.value,'2026-10-15 14:00');
 assert.throws(()=>templateData(c.visit_1h,{...values,time:'2026-02-30 14:00'}));
 assert.equal(templateData(c.approved,{...values,title:'中'.repeat(21)}).thing18.value,'中'.repeat(19)+'…');
 assert.equal(templateData(c.approved,{...values,title:'中'.repeat(20)}).thing18.value,'中'.repeat(20));
});
test('phrases filter non Han characters, use unicode characters, and reject an empty result',()=>{
 assert.equal(templateData({fields:{phrase1:'s'}},{s:'选A中123成功啦呀'}).phrase1.value,'选中成功啦');
 assert.equal(Array.from(templateData({fields:{thing1:'s'}},{s:'😀'.repeat(30)}).thing1.value).length,20);
 assert.throws(()=>templateData({fields:{phrase1:'s'}},{s:'OK123'}),/TEMPLATE_VALUE_REQUIRED/);
});
test('each visit offset selects its own template and unconfirmed time cannot schedule',()=>{
 const jobs=reminders({confirmed_visit_at:'2030-10-10T03:00Z'},new Date('2030-10-01'));
 assert.deepEqual(jobs.slice(0,3).map(j=>[j.kind,j.due.toISOString()]),[['visit_3d','2030-10-07T03:00:00.000Z'],['visit_1d','2030-10-09T03:00:00.000Z'],['visit_1h','2030-10-10T02:00:00.000Z']]);
 assert.deepEqual(reminders({visit_at:'2030-10-10T03:00Z'},new Date('2030-10-01')),[]);
});
function dbFor(owner=3,status='selected',confirmed=true){const calls=[];const db={beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release(){},query:async(sql,args)=>{calls.push({sql,args});if(sql.includes('FROM mission_enroll'))return [[{id:7,user_id:owner,status}]];if(sql.includes('SELECT * FROM notification_visit'))return [[{confirmed_visit_at:confirmed?'2030-10-10T12:00Z':null,completed_at:null}]];return [{affectedRows:1}];}};pool.getConnection=async()=>db;return calls;}
test('subscription belongs to one enrollment and signup never unblocks existing enrollments',async()=>{
 process.env.WX_NOTIFICATION_TEMPLATES=JSON.stringify({approved:{id:'a',fields:{thing1:'title'}}});
 let calls=dbFor();await recordSubscriptions(3,{a:'accept'},{enrollId:7,phase:'application'});
 const update=calls.find(c=>c.sql.startsWith('UPDATE notification_job'));assert.deepEqual(update.args,[3,7,'approved']);assert.match(update.sql,/enroll_id=\?/);
 calls=dbFor();await recordSubscriptions(3,{a:'accept'},{enrollId:0,phase:'signup'});assert.equal(calls.some(c=>c.sql.startsWith('UPDATE notification_job')),false);
 calls=dbFor(8);await assert.rejects(recordSubscriptions(3,{a:'accept'},{enrollId:7,phase:'application'}),/NOT_FOUND/);assert.equal(calls.some(c=>c.sql.startsWith('INSERT')),false);
 await assert.rejects(recordSubscriptions(3,{a:'accept'},{enrollId:7,phase:'signup'}),/INVALID_SUBSCRIPTIONS/);
});
test('explicit send off prevents even a database connection',async()=>{
 process.env.NOTIFICATIONS_ENABLED='true';process.env.NOTIFICATION_SEND_ENABLED='false';pool.getConnection=()=>assert.fail('must not access database');
 assert.deepEqual(await runWorker(()=>assert.fail('must not send')),{enabled:false});
});
test.after(async()=>{await pool.end();});

test('visit consent requires selection, saved visit, matching phase and matching template group',async()=>{
 process.env.WX_NOTIFICATION_TEMPLATES=JSON.stringify({approved:{id:'a',fields:{}},visit_3d:{id:'v',fields:{}}});
 dbFor();await recordSubscriptions(3,{v:'accept'},{enrollId:7,phase:'visit_confirm'});
 dbFor(3,'applied');await assert.rejects(recordSubscriptions(3,{v:'accept'},{enrollId:7,phase:'visit_confirm'}),/INVALID_ENROLLMENT_STATUS/);
 dbFor(3,'selected',false);await assert.rejects(recordSubscriptions(3,{v:'accept'},{enrollId:7,phase:'visit_confirm'}),/INVALID_ENROLLMENT_STATUS/);
 dbFor();await assert.rejects(recordSubscriptions(3,{v:'accept'},{enrollId:7,phase:'application'}),/INVALID_SUBSCRIPTIONS/);
 dbFor();await assert.rejects(recordSubscriptions(3,{a:'accept'},{enrollId:7,phase:'visit_confirm'}),/INVALID_SUBSCRIPTIONS/);
});
