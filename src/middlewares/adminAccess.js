import pool from '../utils/pool.js';
import { isSuperAdmin, positiveId } from '../utils/adminPolicy.js';
export function SuperAdminOnly(req, res, next) {
  if (!isSuperAdmin(req.admin))
    return res
      .status(403)
      .json({
        success: false,
        error: {
          code: 'ADMIN_FORBIDDEN',
          msg: '슈퍼관리자만 사용할 수 있습니다.',
        },
      });
  next();
}
export async function MissionAccess(req, res, next) {
  try {
    const id = req.params.id ?? req.params.missionId;
    if (id === 'new') return next();
    const [rows] = await pool.query(
      'SELECT id, owner_admin_id AS ownerAdminId FROM mission WHERE id=?',
      [positiveId(id)]
    );
    if (
      !rows.length ||
      (!isSuperAdmin(req.admin) &&
        Number(rows[0].ownerAdminId) !== Number(req.admin.id))
    )
      return res
        .status(404)
        .json({
          success: false,
          error: {
            code: 'MISSION_NOT_FOUND',
            msg: '캠페인을 찾을 수 없습니다.',
          },
        });
    req.missionOwner = rows[0].ownerAdminId;
    next();
  } catch (e) {
    next(e);
  }
}
export async function EnrollmentAccess(req, res, next) {
  try {
    if (
      !['applied', 'selected', 'rejected', 'completed', 'rewarded'].includes(
        req.params.type
      ) ||
      (!isSuperAdmin(req.admin) &&
        !['applied', 'selected', 'rejected'].includes(req.params.type))
    )
      return res
        .status(403)
        .json({
          success: false,
          error: {
            code: 'ADMIN_FORBIDDEN',
            msg: '허용되지 않은 선정 처리입니다.',
          },
        });
    const [rows] = await pool.query(
      'SELECT m.owner_admin_id AS ownerAdminId, e.status FROM mission_enroll e JOIN mission m ON m.id=e.mission_id WHERE e.id=?',
      [positiveId(req.params.enrollId)]
    );
    if (
      !rows.length ||
      (!isSuperAdmin(req.admin) &&
        Number(rows[0].ownerAdminId) !== Number(req.admin.id))
    )
      return res
        .status(404)
        .json({
          success: false,
          error: {
            code: 'ENROLLMENT_NOT_FOUND',
            msg: '신청 내역을 찾을 수 없습니다.',
          },
        });
    if (
      !isSuperAdmin(req.admin) &&
      ['completed', 'rewarded'].includes(rows[0].status)
    )
      return res
        .status(403)
        .json({
          success: false,
          error: {
            code: 'ADMIN_FORBIDDEN',
            msg: '검수 완료된 신청 내역은 슈퍼관리자만 변경할 수 있습니다.',
          },
        });
    next();
  } catch (e) {
    next(e);
  }
}
