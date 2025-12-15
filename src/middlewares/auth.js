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
    req.decoded = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ success: false, msg: 'Session expired' });
  }
};

export const LoginCheck = async (req, res, next) => {
  if (!req.decoded) return res.status(403).json({ success: false, msg: 'Permission Denided' });
  next();
};

export const AdminLoginCheck = async (req, res, next) => {
  if (!req.decoded || req.decoded.service !== 'ADMIN') {
    return res.status(403).json({ success: false, msg: 'Permission Denied' });
  }
  next();
};