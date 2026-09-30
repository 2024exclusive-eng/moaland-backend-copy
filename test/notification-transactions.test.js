import test from 'node:test';import assert from 'node:assert/strict';
import pool from '../src/utils/pool.js';
import {setVisit,changeStatus} from '../src/libs/notifications.js';
import {UpdateMissionContent,InsertMissionEnroll} from '../src/libs/missionEnroll.js';
process.env.NOTIFICATIONS_ENABLED='true';process.env.NOTIFICATION_SEND_ENABLED='true';
function fixture({status='selected',link=null}={}){
 const calls=[];const e={id:5,mission_id:2,user_id:3,owner_admin_id:7,status,link};let visit={enroll_id:5,revision:1,confirmed_visit_at:new Date('2030-10-10T03:00:00Z'),completed_at:null,timezone:'Asia/Seoul'};
 const db={async beginTransaction(){calls.push('begin');},async commit(){calls.push('commit');},async rollback(){calls.push('rollback');},release(){calls.push('release');},async query(sql,args=[]){calls.push({sql,args});
 if(sql.includes('FROM mission_enroll e'))return [[{...e}]];
 if(sql.startsWith('SELECT * FROM notification_visit'))return [[{...visit}]];
 if(sql.startsWith('SELECT id FROM mission_enroll'))return [[{id:5}]];
 if(sql.startsWith('SELECT b.user_id'))return [[{user_id:8,admin_id:7}]];
 if(sql.startsWith('UPDATE notification_visit SET confirmed_visit_at')){visit={...visit,confirmed_visit_at:args[0],completed_at:args[1],timezone:args[2],revision:visit.revision+1};}
 if(sql.startsWith('UPDATE notification_visit SET revision'))visit.revision++;
 if(sql.startsWith('UPDATE mission_enroll SET status'))e.status=args[0];
 if(sql.startsWith('INSERT INTO mission_enroll'))return [{insertId:5}];
 return [{affectedRows:1}];}};
 pool.getConnection=async()=>db;return {calls,db};
}
test('changed visit cancels old reminders and creates exactly six with new revision in one transaction',async()=>{const f=fixture();await setVisit(5,{visitAt:'2030-10-11T12:00+09:00',completedAt:null,timezone:'Asia/Seoul'},{admin:{id:7,role:'advertiser'}});const inserts=f.calls.filter(c=>c.sql?.startsWith('INSERT IGNORE INTO notification_job'));assert.equal(inserts.length,7);assert.equal(inserts.filter(c=>['visit_3d','visit_1d','visit_1h','review'].includes(c.args[4])).length,6);assert.ok(inserts.every(c=>c.args[5]===2));assert.ok(f.calls.some(c=>c.sql?.includes("reason='replanned'")));assert.equal(f.calls.at(-2),'commit');});
test('unchanged visit does not requeue, repeated approval does not notify twice',async()=>{const f=fixture();await setVisit(5,{visitAt:'2030-10-10T12:00+09:00',completedAt:null,timezone:'Asia/Seoul'},{admin:{id:7,role:'advertiser'}});assert.equal(f.calls.some(c=>c.sql?.includes('INSERT IGNORE INTO notification_job')),false);await changeStatus(5,'selected');assert.equal(f.calls.some(c=>c.sql?.includes('INSERT IGNORE INTO notification_job')),false);});
test('new approval queues result and reminders in committed transaction',async()=>{const f=fixture({status:'applied'});await changeStatus(5,'selected');const rows=f.calls.filter(c=>c.sql?.startsWith('INSERT IGNORE INTO notification_job'));assert.equal(rows.length,7);assert.equal(rows[0].args[4],'approved');assert.equal(f.calls.at(-2),'commit');});
test('URL submission and remaining review cancellation commit together',async()=>{const f=fixture();await UpdateMissionContent({missionId:2,userId:3,links:{Xiaohongshu:'https://xhslink.com/test'}});const update=f.calls.findIndex(c=>c.sql?.includes('SET link ='));const cancel=f.calls.findIndex(c=>c.sql?.includes("reason='review_submitted'"));assert.ok(cancel>update);assert.ok(f.calls.indexOf('commit')>cancel);});
test('application queue is inserted on caller transaction, not a separate connection',async()=>{const f=fixture({status:'applied'});await InsertMissionEnroll(2,3,'name','https://example.com','wx','2030-10-10','2030-10-11','', 'wechat_mp',f.db);assert.equal(f.calls.filter(c=>c.sql?.startsWith('INSERT IGNORE INTO notification_job')).length,1);assert.equal(f.calls.includes('commit'),false);});
test.after(async()=>{await pool.end();});
