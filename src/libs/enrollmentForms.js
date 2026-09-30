import pool from '../utils/pool.js';
import {validateScope,validateFields,formError} from '../utils/enrollmentFormPolicy.js';
export const formsEnabled=()=>process.env.ENROLLMENT_FORMS_ENABLED==='true';
const parse=v=>typeof v==='string'?JSON.parse(v):v;
export async function getForm(channel,category,db=pool,lock=false){
 validateScope(channel,category);if(!formsEnabled())return null;
 const [rows]=await db.query(`SELECT version,fields FROM enrollment_form WHERE channel=? AND category=?${lock?' FOR UPDATE':''}`,[channel,category]);
 return rows.length&&rows[0].version>0?{channel,category,version:rows[0].version,fields:parse(rows[0].fields)}:null;
}
export async function saveForm(channel,category,body,adminId){
 validateScope(channel,category);const fields=validateFields(body.fields);
 if(!Number.isSafeInteger(body.version)||body.version<0)throw formError('FORM_CHANGED');
 const db=await pool.getConnection();try{await db.beginTransaction();
 await db.query("INSERT IGNORE INTO enrollment_form(channel,category,fields) VALUES(?,?,'[]')",[channel,category]);
 const [[old]]=await db.query('SELECT version FROM enrollment_form WHERE channel=? AND category=? FOR UPDATE',[channel,category]);
 if(old.version!==body.version)throw formError('FORM_CHANGED');
 const version=old.version+1;await db.query('UPDATE enrollment_form SET fields=?,version=?,updated_by=?,updated=UTC_TIMESTAMP() WHERE channel=? AND category=?',[JSON.stringify(fields),version,adminId,channel,category]);await db.commit();return {channel,category,version,fields};
 }catch(e){await db.rollback();throw e;}finally{db.release();}
}
export async function storeAnswers(db,enrollId,form,answers){await db.query('INSERT INTO enrollment_form_answer(enroll_id,channel,category,version,snapshot,answers) VALUES(?,?,?,?,?,?)',[enrollId,form.channel,form.category,form.version,JSON.stringify(form.fields),JSON.stringify(answers)]);}
export async function readAnswers(enrollId,admin){
 const [[row]]=await pool.query('SELECT e.id,m.owner_admin_id FROM mission_enroll e JOIN mission m ON m.id=e.mission_id WHERE e.id=?',[enrollId]);
 if(!row||(admin.role!=='super_admin'&&Number(row.owner_admin_id)!==Number(admin.id))){const e=formError('NOT_FOUND');e.status=404;throw e;}
 if(!formsEnabled())return null;
 const [[r]]=await pool.query('SELECT channel,category,version,snapshot,answers FROM enrollment_form_answer WHERE enroll_id=?',[enrollId]);
 return r?{...r,snapshot:parse(r.snapshot),answers:parse(r.answers)}:null;
}
