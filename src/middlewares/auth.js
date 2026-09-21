import {adminSession} from '../libs/adminManagement.js';
import pool from '../utils/pool.js';
import * as jwt from '../utils/jwt.js';

export default async (req, res, next) => {
  try {
    let token = req.get('Authorization');
    if (token !== undefined && token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    } else {
      return next();
    }
    const decoded = await jwt.verify(token);
    if (decoded.channel === 'wechat_mp' && !req.isInternal) return res.status(403).json({ success: false, error: { code: 'MP_RELAY_REQUIRED' } });
    req.decoded = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ success: false, msg: 'Session expired' });
  }
};

export const LoginCheck = async (req, res, next) => {
  try {
  if (!req.decoded || req.decoded.service !== 'USER') return res.status(403).json({ success: false, msg: 'Permission Denided' });
  const [users] = await pool.query("SELECT id FROM user WHERE id=? AND is_delete='N'", [req.decoded.id]);
  if (!users.length) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  next();
  } catch(e) { next(e); }
};

export const AdminLoginCheck = async (req,res,next) => {
 try {
  if(!req.decoded || req.decoded.service!=='ADMIN')return res.status(401).json({success:false,error:{code:'ADMIN_LOGIN_REQUIRED'}});
  const admin=await adminSession(req.decoded.id);
  if(!admin||!Number(admin.isActive)||Number(admin.tokenVersion)!==Number(req.decoded.tokenVersion||0))return res.status(401).json({success:false,error:{code:'ADMIN_SESSION_EXPIRED'}});
  if(!['super_admin','advertiser'].includes(admin.role))return res.status(403).json({success:false,error:{code:'ADMIN_FORBIDDEN'}});
  req.admin=admin;next();
 }catch(e){next(e);}
};
