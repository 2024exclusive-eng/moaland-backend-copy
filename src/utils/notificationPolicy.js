import {readFileSync} from 'node:fs';
export const KINDS = ['approved','visit_3d','visit_1d','visit_1h','review'];
export const enabled = () => process.env.NOTIFICATIONS_ENABLED === 'true';
export function templates(env=process.env) {
  let raw; try { raw=JSON.parse(env.WX_NOTIFICATION_TEMPLATES || readFileSync(env.WX_NOTIFICATION_TEMPLATES_FILE || new URL('../../config/notification-templates.json',import.meta.url),'utf8')); } catch { return {}; }
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
  return Object.fromEntries(KINDS.filter(k=>raw[k]?.id && typeof raw[k].id==='string' && raw[k].id.length<=128 && raw[k].fields && typeof raw[k].fields==='object' && !Array.isArray(raw[k].fields)).map(k=>[k,raw[k]]));
}
export function hasReview(link) {
  try { const value=typeof link==='string'?JSON.parse(link):link; return !!value && Object.values(value).some(v=>typeof v==='string' && /^https?:\/\//i.test(v)); } catch { return false; }
}
export function reminders(visit,now=new Date(),basis='scheduled') {
  const jobs=[]; const at=visit.confirmed_visit_at && new Date(visit.confirmed_visit_at).getTime();
  if(at) for(const hours of [72,24,1]) { const due=at-hours*3600000; if(due>+now) jobs.push({kind:({72:'visit_3d',24:'visit_1d',1:'visit_1h'})[hours],step:String(hours),due:new Date(due),expires:new Date(Math.min(at,due+3600000))}); }
  const base=basis==='completed'?visit.completed_at:visit.confirmed_visit_at;
  if(base) for(const days of [2,3,5]) { const due=+new Date(base)+days*86400000; if(due>+now) jobs.push({kind:'review',step:String(days),due:new Date(due),expires:new Date(due+86400000)}); }
  return jobs;
}
export function eligibility(job,enroll,visit,recipient,admin) {
  if(!enroll || !recipient || recipient.is_delete!=='N')return 'account_or_enrollment_removed';
  if(job.recipient_admin_id && (!admin || !Number(admin.is_active) || !(admin.role==='super_admin'||Number(enroll.owner_admin_id)===Number(admin.id))))return 'admin_access_removed';
  if(['visit_3d','visit_1d','visit_1h','review','approved'].includes(job.kind) && enroll.status!=='selected')return 'not_selected';
  if(['visit_3d','visit_1d','visit_1h','review'].includes(job.kind) && Number(job.revision)!==Number(visit?.revision))return 'schedule_changed';
  if(job.kind.startsWith('visit_') && visit?.completed_at)return 'visit_completed';
  if(job.kind==='review' && hasReview(enroll.link))return 'review_submitted';
  return null;
}
export function templateData(template,values) {
 const data={};
 if(template.pendingFields && Object.keys(template.fields).length!==template.pendingFields.length)throw new Error('TEMPLATE_MAPPING_INVALID');
 for(const [field,source] of Object.entries(template.fields)) {
  if(!/^(thing|time|date|character_string|phrase|number|amount|phone_number|name)\d+$/.test(field)||!(source in values))throw new Error('TEMPLATE_MAPPING_INVALID');
  const limit=field.startsWith('phrase')?5:field.startsWith('thing')?20:field.startsWith('name')?10:32;
  let value=String(values[source] ?? '');
  if(field.startsWith('phrase'))value=Array.from(value).filter(c=>/\p{Script=Han}/u.test(c)).join('');
  const chars=Array.from(value);
  value=field.startsWith('thing')&&chars.length>20?chars.slice(0,19).join('')+'…':chars.slice(0,limit).join('');
  if(/^(time|date)\d+$/.test(field)){
   if(!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value))throw new Error('TEMPLATE_TIME_INVALID');
   timestamp(value.replace(' ','T')+':00Z');
   if(field.startsWith('date'))value=value.replace(/^(\d{4})-(\d{2})-(\d{2}) /,'$1年$2月$3日 ');
  }
  if(!value.trim())throw new Error('TEMPLATE_VALUE_REQUIRED');
  data[field]={value};
 }
 if(!Object.keys(data).length)throw new Error('TEMPLATE_MAPPING_INVALID');
 return data;
}
export function timestamp(value) {
 if(value===null)return null;
 if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d{1,3})?)?(Z|[+-]\d\d:\d\d)$/.test(value)||!Number.isFinite(Date.parse(value)))throw new Error('INVALID_VISIT_TIME');
 const [year,month,day]=value.slice(0,10).split('-').map(Number);
 const calendar=new Date(Date.UTC(year,month-1,day));
 if(calendar.getUTCFullYear()!==year||calendar.getUTCMonth()!==month-1||calendar.getUTCDate()!==day||Number(value.slice(11,13))>23)throw new Error('INVALID_VISIT_TIME');
 return new Date(value);
}
