import test from 'node:test';import assert from 'node:assert/strict';
import {validateFields,validateAnswers,validateScope} from '../src/utils/enrollmentFormPolicy.js';
import {getForm,saveForm,readAnswers} from '../src/libs/enrollmentForms.js';
import {EnrollMission} from '../src/controllers/user/mission.js';
import {SuperAdminOnly} from '../src/middlewares/adminAccess.js';
import pool from '../src/utils/pool.js';
const field={id:'f_name',type:'text',labelKo:'이름',labelZh:'姓名',required:true};
const form={version:1,fields:[field]};
test('bilingual fields, stable IDs and option IDs are validated; zero fields supported',()=>{
 assert.deepEqual(validateFields([]),[]);assert.deepEqual(validateFields([field]),[field]);
 for(const f of [{...field,labelZh:''},{...field,type:'script'},{...field,id:'__proto__'}])assert.throws(()=>validateFields([f]));
 assert.throws(()=>validateFields([field,field]));assert.throws(()=>validateFields([{...field,type:'select',options:[]}]))
 assert.throws(()=>validateScope('web','unknown'));assert.throws(()=>validateScope('fake','Culture'));
});
test('required, optional, stale version, unknown fields and invalid choices fail closed',()=>{
 assert.throws(()=>validateAnswers(form,{formVersion:0,answers:{}}),/FORM_CHANGED/);
 assert.throws(()=>validateAnswers(form,{formVersion:1,answers:{}}),/FORM_FIELD_REQUIRED/);
 assert.throws(()=>validateAnswers(form,{formVersion:1,answers:{f_name:'n',f_other:'x'}}),/UNKNOWN_FORM_FIELD/);
 assert.deepEqual(validateAnswers({...form,fields:[{...field,required:false}]},{formVersion:1,answers:{}}),{});
 const multi={...form,fields:[{...field,type:'multi',options:[{id:'o_a',labelKo:'하나',labelZh:'一'}]}]};
 assert.deepEqual(validateAnswers(multi,{formVersion:1,answers:{f_name:['o_a']}}),{f_name:['o_a']});
 for(const v of [['o_b'],['o_a','o_a'],'o_a'])assert.throws(()=>validateAnswers(multi,{formVersion:1,answers:{f_name:v}}));
});
test('dates, URLs and numbers are validated on server',()=>{
 for(const [type,value] of [['date','2026-02-30'],['url','javascript:alert(1)'],['number','NaN']])assert.throws(()=>validateAnswers({...form,fields:[{...field,type}]},{formVersion:1,answers:{f_name:value}}));
 assert.equal(validateAnswers({...form,fields:[{...field,type:'number'}]},{formVersion:1,answers:{f_name:'0'}}).f_name,'0');
});
test('settings are shared by category and optimistic saves reject lost updates',async()=>{
 process.env.ENROLLMENT_FORMS_ENABLED='true';const calls=[];let rolled=false;
 const db={beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{rolled=true;},release(){},query:async(sql,args)=>{calls.push({sql,args});if(sql.startsWith('SELECT version'))return [[{version:2,fields:JSON.stringify([field])}]];return [{affectedRows:1}];}};
 pool.getConnection=async()=>db;await assert.rejects(saveForm('web','Culture',{version:1,fields:[field]},1),/FORM_CHANGED/);assert.equal(rolled,true);assert.equal(calls.some(c=>c.sql.startsWith('UPDATE')),false);
 const r=await getForm('wechat_mp','Culture',db);assert.equal(r.channel,'wechat_mp');assert.deepEqual(calls.at(-1).args,['web','Culture']);
 const web=await getForm('web','Culture',db);assert.deepEqual(web.fields,r.fields);assert.equal(web.version,r.version);
 calls.length=0;const saved=await saveForm('wechat_mp','Culture',{version:2,fields:[field]},1);
 assert.equal(saved.version,3);assert.equal(calls.find(c=>c.sql.startsWith('UPDATE')).args[3],'web');
});
test('advertiser cannot change schemas or read another owner answer',async()=>{
 let status;SuperAdminOnly({admin:{role:'advertiser'}},{status(s){status=s;return this;},json(){}},()=>assert.fail());assert.equal(status,403);
 pool.query=async()=>[[{id:5,owner_admin_id:9}]];await assert.rejects(readAnswers(5,{id:8,role:'advertiser'}),/NOT_FOUND/);
});
test('dynamic submission skips removed legacy required fields and snapshots answers in same transaction',async()=>{
 process.env.ENROLLMENT_FORMS_ENABLED='true';process.env.NOTIFICATIONS_ENABLED='false';const calls=[];
 const mission={category:'Culture',maxEnroll:10,enrollStartDate:new Date(Date.now()-86400000),enrollEndDate:new Date(Date.now()+86400000)};
 const query=async(sql,args)=>{calls.push({sql,args});if(sql.includes('FROM mission\n'))return [[mission]];if(sql.includes('SELECT version,fields'))return [[{version:1,fields:JSON.stringify([field])}]];if(sql.includes('AS enrolled'))return [[{enrolled:0}]];if(sql.includes('AS currentEnrollCount'))return [[{currentEnrollCount:0}]];if(sql.startsWith('INSERT INTO mission_enroll'))return [{insertId:11}];return [{affectedRows:1}];};
 const db={query,beginTransaction:async()=>{},commit:async()=>calls.push('commit'),rollback:async()=>{},release(){}};pool.query=query;pool.getConnection=async()=>db;
 let response;const res={status(){return this;},json(body){response=body;return this;}};
 await EnrollMission({params:{missionId:1},decoded:{id:3},clientChannel:'web',body:{formVersion:1,answers:{f_name:'홍길동'}}},res,e=>{throw e;});
 assert.equal(response.success,true);const snapshot=calls.find(c=>c.sql?.startsWith('INSERT INTO enrollment_form_answer'));assert.equal(snapshot.args[0],11);assert.deepEqual(JSON.parse(snapshot.args[4]),[field]);assert.deepEqual(JSON.parse(snapshot.args[5]),{f_name:'홍길동'});assert.ok(calls.indexOf(snapshot)<calls.indexOf('commit'));
});
test.after(async()=>{await pool.end();});
