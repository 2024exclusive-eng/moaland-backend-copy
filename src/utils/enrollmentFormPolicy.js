export const categories=['restaurant','Hospital','Beauty','Culture','Stay','Massage','Others'];
export const channels=['web','wechat_mp'];
export const fieldTypes=['text','textarea','number','date','url','select','multi'];
export function formError(code,field){const e=new Error(code);e.status=code==='FORM_CHANGED'?409:400;e.field=field;return e;}
export function validateScope(channel,category){if(!channels.includes(channel)||!categories.includes(category))throw formError('INVALID_FORM_SCOPE');}
const text=(s,max)=>typeof s==='string'&&s.trim().length>0&&Array.from(s).length<=max;
export function validateFields(fields){
 if(!Array.isArray(fields)||fields.length>30)throw formError('INVALID_FORM_FIELDS');
 const ids=new Set();return fields.map(f=>{
 if(!f||!/^f_[a-zA-Z0-9_]{1,60}$/.test(f.id)||ids.has(f.id)||!fieldTypes.includes(f.type)||typeof f.required!=='boolean'||!text(f.labelKo,100)||!text(f.labelZh,100))throw formError('INVALID_FORM_FIELDS');ids.add(f.id);
 const out={id:f.id,type:f.type,required:f.required,labelKo:f.labelKo.trim(),labelZh:f.labelZh.trim()};
 if(['select','multi'].includes(f.type)){
 if(!Array.isArray(f.options)||!f.options.length||f.options.length>30)throw formError('INVALID_FORM_OPTIONS');
 const optionIds=new Set();out.options=f.options.map(o=>{if(!o||!/^o_[a-zA-Z0-9_]{1,60}$/.test(o.id)||optionIds.has(o.id)||!text(o.labelKo,100)||!text(o.labelZh,100))throw formError('INVALID_FORM_OPTIONS');optionIds.add(o.id);return {id:o.id,labelKo:o.labelKo.trim(),labelZh:o.labelZh.trim()};});
 }
 return out;
 });
}
export function validateAnswers(form,body){
 if(body.formVersion!==form.version)throw formError('FORM_CHANGED');
 const input=body.answers;if(!input||typeof input!=='object'||Array.isArray(input)||Buffer.byteLength(JSON.stringify(input),'utf8')>24000)throw formError('INVALID_FORM_ANSWERS');
 const known=new Set(form.fields.map(f=>f.id));if(Object.keys(input).some(k=>!known.has(k)))throw formError('UNKNOWN_FORM_FIELD');
 const answers={};for(const f of form.fields){
 let v=input[f.id];const empty=v==null||v===''||(Array.isArray(v)&&!v.length);
 if(empty){if(f.required)throw formError('FORM_FIELD_REQUIRED',f.id);continue;}
 if(f.type==='multi'){
 if(!Array.isArray(v)||v.length>f.options.length||new Set(v).size!==v.length||v.some(x=>!f.options.some(o=>o.id===x)))throw formError('INVALID_FORM_VALUE',f.id);
 answers[f.id]=v;continue;
 }
 if(typeof v!=='string'||Array.from(v).length>(f.type==='textarea'?2000:500))throw formError('INVALID_FORM_VALUE',f.id);
 v=v.trim();if(!v){if(f.required)throw formError('FORM_FIELD_REQUIRED',f.id);continue;}
 if(f.type==='select'&&!f.options.some(o=>o.id===v))throw formError('INVALID_FORM_VALUE',f.id);
 if(f.type==='number'&&(!/^-?\d+(\.\d+)?$/.test(v)||!Number.isFinite(Number(v))))throw formError('INVALID_FORM_VALUE',f.id);
 if(f.type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))throw formError('INVALID_FORM_VALUE',f.id);
 if(f.type==='url'){try{if(!['http:','https:'].includes(new URL(v).protocol))throw 0;}catch{throw formError('INVALID_FORM_VALUE',f.id);}}
 answers[f.id]=v;
 }
 return answers;
}
