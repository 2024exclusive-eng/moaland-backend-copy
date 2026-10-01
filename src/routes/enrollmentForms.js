import {Router} from 'express';
import {SuperAdminOnly} from '../middlewares/adminAccess.js';
import {getForm,saveForm,readAnswers,formsEnabled} from '../libs/enrollmentForms.js';
import {GetMissionByMissionId} from '../libs/mission.js';
import {isWechatVisible} from '../utils/wechat.js';
export const formWrap=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(e){if(e.status)return res.status(e.status).json({success:false,error:{code:e.message,field:e.field}});next(e);}};
export const adminForms=Router();
adminForms.get('/answers/:id',formWrap(async(req,res)=>res.json({success:true,data:await readAnswers(req.params.id,req.admin)})));
adminForms.use(SuperAdminOnly);
adminForms.get('/:category',formWrap(async(req,res)=>res.set('Cache-Control','no-store').json({success:true,data:await getForm('web',req.params.category),enabled:formsEnabled()})));
adminForms.put('/:category',formWrap(async(req,res)=>{if(!formsEnabled())return res.status(503).json({success:false,error:{code:'FORMS_NOT_ENABLED'}});res.json({success:true,data:await saveForm('web',req.params.category,req.body,req.admin.id)});}));
// Compatibility endpoints use the same category schema for both clients.
adminForms.get('/:channel/:category',formWrap(async(req,res)=>res.json({success:true,data:await getForm(req.params.channel,req.params.category),enabled:formsEnabled()})));
adminForms.put('/:channel/:category',formWrap(async(req,res)=>{if(!formsEnabled())return res.status(503).json({success:false,error:{code:'FORMS_NOT_ENABLED'}});res.json({success:true,data:await saveForm(req.params.channel,req.params.category,req.body,req.admin.id)});}));
export const missionForm=formWrap(async(req,res)=>{
 if(!formsEnabled())return res.json({success:true,data:null});
 const m=await GetMissionByMissionId(req.params.missionId);const channel=req.clientChannel==='wechat_mp'?'wechat_mp':'web';
 if(!m||(channel==='wechat_mp'&&!isWechatVisible(m)))return res.status(404).json({success:false,error:{code:'MISSION_NOT_FOUND'}});
 res.set('Cache-Control','no-store').json({success:true,data:await getForm(channel,m.category)});
});
