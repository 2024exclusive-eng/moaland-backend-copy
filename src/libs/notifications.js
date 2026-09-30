import pool from '../utils/pool.js';
import {enabled,templates,reminders,eligibility,templateData,timestamp,KINDS} from '../utils/notificationPolicy.js';
export async function transaction(fn) { const db=await pool.getConnection();try{await db.beginTransaction();const result=await fn(db);await db.commit();return result;}catch(e){await db.rollback();throw e;}finally{db.release();} }
export async function queue(db,e,kind,key,revision=0,due=new Date(),expires=new Date(Date.now()+86400000)) {
 if(!enabled())return;
 const channel=['application','schedule'].includes(kind)?'wecom':'wechat';
 await db.query(`INSERT IGNORE INTO notification_job(event_key,enroll_id,recipient_user_id,recipient_admin_id,kind,revision,due_at,expires_at,channel) VALUES(?,?,?,?,?,?,?,?,?)`,[`${e.id}:${kind}:${key}:${channel}`,e.id,e.user_id,null,kind,revision,due,expires,channel]);
}
export async function enrollment(db,id,lock=false) {
 const [rows]=await db.query(`SELECT e.*,m.owner_admin_id,m.title_cn,m.title,m.brand,m.address_cn,m.address,m.content_end_date,m.mission_start_date FROM mission_enroll e JOIN mission m ON m.id=e.mission_id WHERE e.id=?${lock?' FOR UPDATE':''}`,[id]);return rows[0];
}
export async function plan(db,e,visit) {
 await db.query("UPDATE notification_job SET state='cancelled',reason='replanned' WHERE enroll_id=? AND kind IN ('visit_3d','visit_1d','visit_1h','review') AND state IN ('pending','blocked')",[e.id]);
 if(e.status!=='selected')return;
 for(const job of reminders(visit,new Date(),process.env.NOTIFICATION_REVIEW_BASIS||'scheduled'))await queue(db,e,job.kind,`${visit.revision}:${job.step}`,visit.revision,job.due,job.expires);
}
export async function applied(db,id) {if(!enabled())return; const e=await enrollment(db,id);if(e)await queue(db,e,'application','created');}
export async function changeStatus(id,status) {
 return transaction(async db=>{const e=await enrollment(db,id,true);if(!e)return;await db.query('UPDATE mission_enroll SET status=? WHERE id=?',[status,id]);if(!enabled()||e.status===status)return;
 await db.query("UPDATE notification_job SET state='cancelled',reason='status_changed' WHERE enroll_id=? AND kind IN ('approved','visit_3d','visit_1d','visit_1h','review') AND state IN ('pending','blocked')",[id]);
 await db.query('INSERT IGNORE INTO notification_visit(enroll_id) VALUES(?)',[id]);
 await db.query('UPDATE notification_visit SET revision=revision+1 WHERE enroll_id=?',[id]);
 const [[visit]]=await db.query('SELECT * FROM notification_visit WHERE enroll_id=?',[id]);
 if(status==='selected'){e.status=status;await queue(db,e,'approved',String(visit.revision),visit.revision);await plan(db,e,visit);}
 });
}
export async function setVisit(id,body,actor) {
 const visitAt=timestamp(body.confirmedVisitAt !== undefined ? body.confirmedVisitAt : body.visitAt),completedAt=timestamp(body.completedAt);
 const timezone=body.timezone||'Asia/Seoul';if(!['Asia/Seoul','Asia/Shanghai'].includes(timezone))throw new Error('INVALID_TIMEZONE');
 if(completedAt && (!visitAt || +completedAt>Date.now()))throw new Error('INVALID_COMPLETED_TIME');
 return transaction(async db=>{const e=await enrollment(db,id,true);if(!e||!(actor.admin?(actor.admin.role==='super_admin'||Number(actor.admin.id)===Number(e.owner_admin_id)):Number(actor.userId)===Number(e.user_id)))throw new Error('NOT_FOUND');
 if(!['applied','selected'].includes(e.status))throw new Error('INVALID_ENROLLMENT_STATUS');
 if(!actor.admin && completedAt)throw new Error('ADMIN_REQUIRED');
 await db.query('INSERT IGNORE INTO notification_visit(enroll_id) VALUES(?)',[id]);
 const [[old]]=await db.query('SELECT * FROM notification_visit WHERE enroll_id=? FOR UPDATE',[id]);
 if(!actor.admin && old.completed_at)throw new Error('VISIT_ALREADY_COMPLETED');
 if((old.confirmed_visit_at?+new Date(old.confirmed_visit_at):null)===(visitAt?+visitAt:null)&&(old.completed_at?+new Date(old.completed_at):null)===(completedAt?+completedAt:null)&&old.timezone===timezone)return old;
 await db.query('UPDATE notification_visit SET confirmed_visit_at=?,completed_at=?,timezone=?,revision=revision+1 WHERE enroll_id=?',[visitAt,completedAt,timezone,id]);
 const visit={confirmed_visit_at:visitAt,completed_at:completedAt,timezone,revision:old.revision+1};
 await queue(db,e,'schedule',String(visit.revision),visit.revision);await plan(db,e,visit);return visit;
 });
}
export async function visitInfo(id,actor) {
 const e=await enrollment(pool,id);if(!e||!(actor.admin?(actor.admin.role==='super_admin'||Number(actor.admin.id)===Number(e.owner_admin_id)):Number(actor.userId)===Number(e.user_id)))throw new Error('NOT_FOUND');
 const [[visit]]=await pool.query('SELECT * FROM notification_visit WHERE enroll_id=?',[id]);
 const [jobs]=await pool.query('SELECT id,kind,due_at,state,reason,sent_at FROM notification_job WHERE enroll_id=? ORDER BY id DESC LIMIT 50',[id]);
 return {visit:visit||{confirmed_visit_at:null,completed_at:null,timezone:'Asia/Seoul'},jobs:actor.admin?jobs:[],status:e.status};
}
export async function recordSubscriptions(userId,choices,{enrollId=0,phase='signup',decision}={}) {
 const allowed=new Set(Object.values(templates()).map(t=>t.id));
 enrollId=Number(enrollId);
 if(!Number.isSafeInteger(enrollId)||enrollId<0||!['signup','application','visit_confirm'].includes(phase)||((phase==='signup')!==(enrollId===0)))throw new Error('INVALID_SUBSCRIPTIONS');
 if(!choices||typeof choices!=='object'||Array.isArray(choices)||Object.keys(choices).length>3)throw new Error('INVALID_SUBSCRIPTIONS');
 for(const [id,choice] of Object.entries(choices))if(!allowed.has(id)||!['accept','reject','ban'].includes(choice))throw new Error('INVALID_SUBSCRIPTIONS');
 decision=decision|| (Object.values(choices).includes('accept')?'accepted':'declined');
 if(!['accepted','declined','deferred'].includes(decision))throw new Error('INVALID_SUBSCRIPTIONS');
 await transaction(async db=>{
 if(enrollId){const e=await enrollment(db,enrollId,true);if(!e||Number(e.user_id)!==Number(userId))throw new Error('NOT_FOUND');
 if(phase==='visit_confirm'){
 const [[visit]]=await db.query('SELECT * FROM notification_visit WHERE enroll_id=?',[enrollId]);
 if(e.status!=='selected'||!visit?.confirmed_visit_at||visit.completed_at)throw new Error('INVALID_ENROLLMENT_STATUS');
 }}
 const allowedKinds=phase==='visit_confirm'?['visit_3d','visit_1d','visit_1h']:['approved','review'];
 const phaseIds=new Set(allowedKinds.map(k=>templates()[k]?.id).filter(Boolean));
 if(Object.keys(choices).some(id=>!phaseIds.has(id)))throw new Error('INVALID_SUBSCRIPTIONS');
 await db.query('INSERT INTO notification_consent_event(user_id,enroll_id,phase,decision,choices) VALUES(?,?,?,?,?)',[userId,enrollId,phase,decision,JSON.stringify(choices)]);
 if(decision==='declined'&&!Object.keys(choices).length)await db.query("UPDATE notification_enrollment_subscription SET choice='reject',updated=UTC_TIMESTAMP() WHERE user_id=? AND enroll_id=? AND phase=?",[userId,enrollId,phase]);
 for(const [id,choice] of Object.entries(choices)){
 await db.query('INSERT INTO notification_enrollment_subscription(user_id,enroll_id,template_id,phase,choice,updated) VALUES(?,?,?,?,?,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE phase=VALUES(phase),choice=VALUES(choice),updated=VALUES(updated)',[userId,enrollId,id,phase,choice]);
 if(choice==='accept'&&enrollId)for(const kind of KINDS.filter(k=>templates()[k]?.id===id))await db.query("UPDATE notification_job SET state='pending',reason=NULL WHERE recipient_user_id=? AND enroll_id=? AND kind=? AND state='blocked' AND reason IN ('subscription_required','43101') AND expires_at>UTC_TIMESTAMP()",[userId,enrollId,kind]);
 }
 });
}
export async function runWorker(send,limit=50) {
 if(!enabled()||process.env.NOTIFICATION_SEND_ENABLED!=='true')return {enabled:false};const db=await pool.getConnection();let locked=false;let processed=0;const started=Date.now();
 try{const [[lock]]=await db.query("SELECT GET_LOCK('kviewo-notifications',0) AS acquired");if(!lock.acquired)return {busy:true};locked=true;
 await db.query("UPDATE notification_job SET state='uncertain',reason='worker_interrupted' WHERE state='sending'");
 await db.query("UPDATE notification_job SET state='expired',reason='deadline_passed' WHERE state IN ('pending','blocked') AND expires_at<=UTC_TIMESTAMP()");
 for(const kind of [...Object.keys(templates()),'application','schedule'])await db.query("UPDATE notification_job SET state='pending',reason=NULL WHERE state='blocked' AND reason IN ('configuration_required','template_mapping_invalid','-1000') AND kind=? AND expires_at>UTC_TIMESTAMP()",[kind]);
 const [jobs]=await db.query("SELECT * FROM notification_job WHERE state='pending' AND due_at<=UTC_TIMESTAMP() ORDER BY due_at,id LIMIT ?",[limit]);
 for(const job of jobs){
 if(Date.now()-started>7000)break;
 const e=await enrollment(db,job.enroll_id);const [[visit]]=await db.query('SELECT * FROM notification_visit WHERE enroll_id=?',[job.enroll_id]);
 const [[user]]=await db.query("SELECT oauth_id,is_delete,oauth_type FROM user WHERE id=?",[job.recipient_user_id]);
 if(['application','schedule'].includes(job.kind)&&job.channel!=='wecom'){await finish(db,job.id,'cancelled','channel_migration');continue;}
 let admin;if(job.recipient_admin_id){[[admin]]=await db.query('SELECT id,role,is_active FROM admin WHERE id=?',[job.recipient_admin_id]);const [[binding]]=await db.query('SELECT user_id FROM notification_admin_binding WHERE admin_id=?',[job.recipient_admin_id]);if(Number(binding?.user_id)!==Number(job.recipient_user_id))admin=null;}
 const invalid=eligibility(job,e,visit,user,admin);
 if(invalid){await finish(db,job.id,'cancelled',invalid);continue;}
 if(job.channel==='wecom'){
 if(!['application','schedule'].includes(job.kind)){await finish(db,job.id,'cancelled','invalid_channel');continue;}
 const [claim]=await db.query(`UPDATE notification_job j JOIN mission_enroll e ON e.id=j.enroll_id JOIN user u ON u.id=j.recipient_user_id LEFT JOIN notification_visit v ON v.enroll_id=e.id SET j.state='sending',j.reason=NULL WHERE j.id=? AND j.state='pending' AND u.is_delete='N' AND (j.kind<>'schedule' OR j.revision=v.revision)`,[job.id]);
 if(!claim.affectedRows)continue;
 try{const result=await send({jobId:String(job.id),channel:'wecom',content:`${job.kind==='application'?'新报名':'到访时间变更'}\n活动：${Array.from(e.title_cn||e.title||'').slice(0,80).join('')}\n报名编号：${e.id}\n请登录管理后台查看。`});await finish(db,job.id,result.errcode===0?'sent':result.errcode===-1000?'blocked':'failed',result.errcode===0?null:String(result.errcode));}catch{await finish(db,job.id,'uncertain','delivery_unknown');}processed++;continue;
 }
 const template=templates()[job.kind];
 if(!template||user.oauth_type!=='WECHAT_MP'){await finish(db,job.id,'blocked','configuration_required');continue;}
 const [[sub]]=await db.query('SELECT choice FROM notification_enrollment_subscription WHERE user_id=? AND enroll_id=? AND template_id=?',[job.recipient_user_id,job.enroll_id,template.id]);
 if(sub?.choice!=='accept'){await finish(db,job.id,'blocked','subscription_required');continue;}
 const date=visit?.confirmed_visit_at||(job.kind==='approved'?e.mission_start_date:null);const time=date?new Intl.DateTimeFormat('sv-SE',{timeZone:visit?.timezone||'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(date)):'';
 let data;try{data=templateData(template,{title:e.title_cn||e.title,brand:e.brand,name:e.name,time,address:e.address_cn||e.address,taskType:'提交评价',deadline:e.content_end_date?new Intl.DateTimeFormat('sv-SE',{timeZone:visit?.timezone||'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(e.content_end_date)):'',status:job.kind==='approved'?'报名成功':job.kind==='review'?'待提交':'待查看',remark:job.kind==='review'?'请提交体验内容链接':'请查看活动详情',enrollId:String(e.id)});}catch{await finish(db,job.id,'blocked','template_mapping_invalid');continue;}
 // Mark before network I/O. Ambiguous transport failures are never auto-retried.
 const [claimed]=await db.query(`UPDATE notification_job j JOIN mission_enroll e ON e.id=j.enroll_id JOIN user u ON u.id=j.recipient_user_id LEFT JOIN notification_visit v ON v.enroll_id=e.id
 SET j.state='sending',j.reason=NULL WHERE j.id=? AND j.state='pending' AND u.is_delete='N'
 AND (j.kind NOT IN ('approved','visit_3d','visit_1d','visit_1h','review') OR e.status='selected')
 AND (j.kind NOT IN ('visit_3d','visit_1d','visit_1h','review') OR j.revision=v.revision)
 AND (j.kind<>'review' OR e.link IS NULL OR e.link='' OR e.link='{}')
 AND (j.kind NOT IN ('visit_3d','visit_1d','visit_1h') OR v.completed_at IS NULL)
 AND EXISTS(SELECT 1 FROM notification_enrollment_subscription s WHERE s.user_id=j.recipient_user_id AND s.enroll_id=j.enroll_id AND s.template_id=? AND s.choice='accept')`,[job.id,template.id]);
 if(!claimed.affectedRows)continue;
 try{const result=await send({jobId:String(job.id),touser:user.oauth_id,template_id:template.id,page:'pages/enrolls/index',data});
 if(result.errcode===0)await finish(db,job.id,'sent',null);else await finish(db,job.id,[43101,-1000].includes(result.errcode)?'blocked':'failed',String(result.errcode||'provider_rejected'));
 }catch{await finish(db,job.id,'uncertain','delivery_unknown');}processed++;
 }
 return {processed};
 }finally{try{if(locked)await db.query("SELECT RELEASE_LOCK('kviewo-notifications')");}finally{db.release();}}
}
async function finish(db,id,state,reason){await db.query("UPDATE notification_job SET state=?,reason=?,sent_at=IF(?='sent',UTC_TIMESTAMP(),sent_at) WHERE id=?",[state,reason,state,id]);}
export async function sendThroughRelay(message){
 if(!process.env.MP_RELAY_URL||!process.env.INTERNAL_API_KEY)throw new Error('RELAY_NOT_CONFIGURED');
 const r=await fetch(new URL('/internal/notifications/send',process.env.MP_RELAY_URL),{method:'POST',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json','X-Internal-Key':process.env.INTERNAL_API_KEY},body:JSON.stringify(message)});
 if(!r.ok)throw new Error('RELAY_SEND_FAILED');return r.json();
}
