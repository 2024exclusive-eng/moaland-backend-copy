import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { normalizePoi } from '../../utils/amap.js';
const route=Router();
const configured=()=>!!process.env.AMAP_WEB_SERVICE_KEY;
const jsReady=()=>process.env.AMAP_JS_ENABLED!=='false' && !!(process.env.AMAP_JS_KEY && process.env.AMAP_JS_SECURITY_CODE);
const fail=(res,status,code,msg)=>res.status(status).json({success:false,error:{code,msg}});
const signature=value=>createHmac('sha256',process.env.AMAP_JS_SECURITY_CODE).update(value).digest('hex');
route.get('/config',(req,res)=>{
  let ticket=null;
  if(jsReady()){const value=String(Date.now()+3600000)+'-'+req.admin.id;ticket=value+'-'+signature(value);}
  res.set('Cache-Control','no-store').json({success:true,data:{searchReady:configured(),mapMessage:process.env.AMAP_JS_ENABLED==='false'?'지도 미리보기를 일시적으로 이용할 수 없습니다.':null,jsKey:jsReady()?process.env.AMAP_JS_KEY:null,ticket}});
});
route.get('/places',async(req,res)=>{
  if(!configured())return fail(res,503,'AMAP_NOT_CONFIGURED','고덕지도 검색 키를 설정한 후 이용할 수 있습니다.');
  if(typeof req.query.keywords!=='string'||req.query.keywords.trim().length<2||req.query.keywords.length>100)return fail(res,400,'AMAP_QUERY_INVALID','검색어를 2~100자로 입력해 주세요.');
  if(req.query.region!=null&&(typeof req.query.region!=='string'||req.query.region.length>50))return fail(res,400,'AMAP_REGION_INVALID','도시명을 확인해 주세요.');
  const params=new URLSearchParams({key:process.env.AMAP_WEB_SERVICE_KEY,keywords:req.query.keywords.trim(),page_size:'10',page_num:'1',output:'JSON'});
  if(req.query.region?.trim()){params.set('region',req.query.region.trim());params.set('city_limit','true');}
  try {
    const response=await fetch('https://restapi.amap.com/v5/place/text?'+params,{signal:AbortSignal.timeout(8000)});
    const body=await response.json();
    if(['10003','10004','10044','10045'].includes(String(body.infocode)))return fail(res,429,'AMAP_QUOTA_EXCEEDED','고덕지도 검색 한도를 초과했습니다. 관리자에게 할당량 확인을 요청해 주세요.');
    if(!response.ok||body.status!=='1')return fail(res,502,'AMAP_SEARCH_FAILED','고덕지도 검색을 사용할 수 없습니다. 잠시 후 다시 시도하거나 키 설정을 확인해 주세요.');
    res.set('Cache-Control','no-store').json({success:true,data:(Array.isArray(body.pois)?body.pois:[]).map(normalizePoi).filter(Boolean)});
  }catch{return fail(res,502,'AMAP_UNAVAILABLE','고덕지도 연결이 지연되고 있습니다. 다시 시도해 주세요.');}
});
export const amapProxy=Router();
amapProxy.get('/:ticket/_AMapService/*',async(req,res)=>{
  if(!jsReady())return res.sendStatus(503);
  const match=/^(\d{13}-\d+)-([a-f0-9]{64})$/.exec(req.params.ticket||'');
  if(!match||Number(match[1].split('-')[0])<Date.now()||!timingSafeEqual(Buffer.from(match[2]),Buffer.from(signature(match[1]))))return res.sendStatus(403);
  const path='/'+req.params[0];
  if(!/^\/v[345]\/[a-zA-Z0-9/_-]+$/.test(path)||req.originalUrl.length>6000)return res.sendStatus(400);
  const url=new URL(path,path==='/v4/map/styles'?'https://webapi.amap.com':'https://restapi.amap.com');
  for(const [k,v] of Object.entries(req.query)){if(typeof v!=='string')return res.sendStatus(400);url.searchParams.set(k,v);}
  url.searchParams.set('key',process.env.AMAP_JS_KEY);url.searchParams.set('jscode',process.env.AMAP_JS_SECURITY_CODE);
  try {const upstream=await fetch(url,{signal:AbortSignal.timeout(8000),redirect:'error'});res.set('Cache-Control','private,max-age=300');res.type(upstream.headers.get('content-type')||'application/json');res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));}catch{res.sendStatus(502);}
});
export default route;
