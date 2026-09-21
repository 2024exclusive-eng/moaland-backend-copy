import { Router } from 'express';
import pool from '../utils/pool.js';
import { sign } from '../utils/jwt.js';
import * as Mission from '../libs/mission.js';
import { InsertUserProfile } from '../libs/userProfile.js';
import { mpError, isWechatVisible } from '../utils/wechat.js';
const router = Router();
router.post('/mp/login', async (req, res, next) => {
  const { openid, unionid } = req.body;
  if (typeof openid !== 'string' || !/^[A-Za-z0-9_-]{10,64}$/.test(openid) || (unionid != null && (typeof unionid !== 'string' || unionid.length > 64))) return mpError(res, 'INVALID_WECHAT_ID');
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    // Unique oauth index serializes concurrent first logins without creating duplicate profiles.
    const [insert] = await conn.query(`INSERT INTO user (oauth_type, oauth_id, wx_unionid, signup_channel) VALUES ('WECHAT_MP', ?, ?, 'wechat_mp') ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), wx_unionid=COALESCE(VALUES(wx_unionid),wx_unionid)`, [openid, unionid ?? null]);
    const [rows] = await conn.query(`SELECT id, is_delete FROM user WHERE oauth_type='WECHAT_MP' AND oauth_id=? FOR UPDATE`, [openid]);
    const user = rows[0];
    if (!user || user.is_delete === 'Y') { await conn.rollback(); return mpError(res, 'ACCOUNT_DISABLED', 403); }
    const [profiles] = await conn.query('SELECT user_id FROM user_profile WHERE user_id=?', [user.id]);
    if (!profiles.length) await InsertUserProfile(conn, { userId: user.id });
    const accessToken = await sign({ service: 'USER', tokenType: 'ACCESSTOKEN', id: user.id, channel: 'wechat_mp' });
    await conn.commit();
    res.json({ success: true, data: { userId: user.id, accessToken, isNew: insert.affectedRows === 1 && !profiles.length } });
  } catch (e) { if (conn) await conn.rollback(); next(e); } finally { conn?.release(); }
});
router.get('/mp/missions', async (req, res, next) => {
  try { res.json({ success: true, data: await Mission.GetMissionList({ ...req.query, channel: 'wechat_mp' }) }); } catch (e) { next(e); }
});
router.get('/mp/missions/:id', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) return mpError(res, 'MISSION_NOT_FOUND', 404);
    const mission = await Mission.GetMissionByMissionId(req.params.id);
    if (!isWechatVisible(mission)) return mpError(res, 'MISSION_NOT_FOUND', 404);
    res.json({ success: true, data: mission });
  } catch (e) { next(e); }
});
router.get('/mp/identity', async (req, res, next) => {
  try {
    if (!req.decoded || req.decoded.service !== 'USER') return mpError(res, 'UNAUTHORIZED', 401);
    const [rows] = await pool.query("SELECT oauth_id AS openid FROM user WHERE id=? AND oauth_type='WECHAT_MP' AND is_delete='N'", [req.decoded.id]);
    if (!rows.length) return mpError(res, 'UNAUTHORIZED', 401);
    res.json({ success: true, data: rows[0] });
  } catch (e) { next(e); }
});
export default router;
