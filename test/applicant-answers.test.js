import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../src/utils/pool.js';
import {GetUsersByMissionId} from '../src/libs/missionEnroll.js';

test('campaign applicant query attaches original answers in one scoped query and preserves source channel', async()=>{
 process.env.ENROLLMENT_FORMS_ENABLED='true';let calls=0;
 const fields=[{id:'f_name',labelKo:'성함',labelZh:'姓名',type:'text'}];
 pool.query=async(sql,args)=>{calls++;assert.match(sql,/LEFT JOIN enrollment_form_answer form ON form.enroll_id = mission_enroll.id/);assert.match(sql,/WHERE mission_enroll.mission_id = \?/);assert.deepEqual(args,[55]);return [[
  {missionEnrollId:1,channel:'web',formVersion:2,formSnapshot:JSON.stringify(fields),formAnswers:'{"f_name":"test"}'},
  {missionEnrollId:2,channel:'wechat_mp',formVersion:1,formSnapshot:fields,formAnswers:{f_name:'测试'}},
  {missionEnrollId:3,channel:'web',formVersion:null,formSnapshot:null,formAnswers:null}
 ]];};
 const users=await GetUsersByMissionId(55);assert.equal(calls,1);
 assert.deepEqual(users[0].enrollmentForm,{version:2,fields,answers:{f_name:'test'}});
 assert.equal(users[1].channel,'wechat_mp');assert.equal(users[1].enrollmentForm.answers.f_name,'测试');
 assert.equal(users[2].enrollmentForm,null);assert.equal('formAnswers' in users[0],false);
});
test('disabled forms retain legacy records without requiring form table',async()=>{
 process.env.ENROLLMENT_FORMS_ENABLED='false';pool.query=async sql=>{assert.doesNotMatch(sql,/enrollment_form_answer/);return [[{missionEnrollId:3,name:'legacy',channel:'web'}]];};
 const [user]=await GetUsersByMissionId(55);assert.equal(user.name,'legacy');assert.equal(user.enrollmentForm,null);
});
test.after(async()=>{await pool.end();});
