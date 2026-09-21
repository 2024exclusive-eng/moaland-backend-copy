import bcrypt from 'bcryptjs';
import pool from '../utils/pool.js';
import { InsertMission } from './mission.js';
import {
  accountInput,
  adminError,
  monthKey,
  positiveId,
  isSuperAdmin,
} from '../utils/adminPolicy.js';
export const ADMIN_FIELDS =
  'id, admin, name, role, is_active AS isActive, company_name AS companyName, contact_email AS contactEmail, monthly_limit AS monthlyLimit, token_version AS tokenVersion';
export async function adminSession(id) {
  const [rows] = await pool.query(
    `SELECT ${ADMIN_FIELDS} FROM admin WHERE id=?`,
    [id]
  );
  return rows[0] || null;
}
export async function usage(admin, db = pool, month = monthKey()) {
  const [rows] = await db.query(
    'SELECT used FROM admin_campaign_usage WHERE admin_id=? AND month_key=?',
    [admin.id, month]
  );
  const used = Number(rows[0]?.used || 0),
    limit = admin.monthlyLimit === null ? null : Number(admin.monthlyLimit);
  return {
    month,
    timezone: 'Asia/Seoul',
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
  };
}
export async function listAccounts(query = {}) {
  const page = Math.max(1, Math.min(10000, Number.parseInt(query.page) || 1)),
    item = 20;
  const month = query.month || monthKey();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw adminError('INVALID_MONTH', '조회 월을 확인해 주세요.');
  const search = String(query.search || '').slice(0, 120);
  const args = [`%${search}%`, `%${search}%`, `%${search}%`];
  const where =
    'WHERE (a.admin LIKE ? OR a.name LIKE ? OR a.company_name LIKE ?)';
  const [count] = await pool.query(
    `SELECT COUNT(*) AS total FROM admin a ${where}`,
    args
  );
  const [rows] = await pool.query(
    `SELECT a.id,a.admin,a.name,a.role,a.is_active AS isActive,a.company_name AS companyName,a.contact_email AS contactEmail,a.monthly_limit AS monthlyLimit,COALESCE(u.used,0) AS used FROM admin a LEFT JOIN admin_campaign_usage u ON u.admin_id=a.id AND u.month_key=? ${where} ORDER BY a.id DESC LIMIT ? OFFSET ?`,
    [month, ...args, item, (page - 1) * item]
  );
  return {
    data: rows,
    month,
    paging: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(count[0].total / item)),
      totalItems: Number(count[0].total),
    },
  };
}
export async function saveAccount(actor, id, body) {
  const create = id === 'new',
    input = accountInput(body, create);
  const target = create ? null : positiveId(id);
  if (
    !create &&
    target === Number(actor.id) &&
    (input.role !== 'super_admin' || !input.isActive)
  )
    throw adminError(
      'SELF_LOCKOUT',
      '본인의 슈퍼관리자 권한과 활성 상태는 해제할 수 없습니다.'
    );
  const hashed = input.password ? await bcrypt.hash(input.password, 12) : null;
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    await db.query('SELECT id FROM admin_security_lock WHERE id=1 FOR UPDATE');
    // Re-check the actor under the same lock used by all account updates.
    const [actors] = await db.query(
      'SELECT role,is_active FROM admin WHERE id=? FOR UPDATE',
      [actor.id]
    );
    if (
      !actors.length ||
      actors[0].role !== 'super_admin' ||
      !actors[0].is_active
    )
      throw adminError('ADMIN_FORBIDDEN', '관리 권한이 없습니다.', 403);
    let saved = target;
    if (create) {
      const [result] = await db.query(
        'INSERT INTO admin (admin,pw,name,role,is_active,company_name,contact_email,monthly_limit) VALUES (?,?,?,?,?,?,?,?)',
        [
          input.admin,
          hashed,
          input.name,
          input.role,
          input.isActive,
          input.companyName,
          input.contactEmail,
          input.monthlyLimit,
        ]
      );
      saved = result.insertId;
    } else {
      const [current] = await db.query(
        'SELECT id,role,is_active FROM admin WHERE id=? FOR UPDATE',
        [target]
      );
      if (!current.length)
        throw adminError('ADMIN_NOT_FOUND', '관리자를 찾을 수 없습니다.', 404);
      if (
        current[0].role === 'super_admin' &&
        current[0].is_active &&
        (input.role !== 'super_admin' || !input.isActive)
      ) {
        const [remaining] = await db.query(
          "SELECT COUNT(*) AS total FROM admin WHERE role='super_admin' AND is_active=1 AND id<>?",
          [target]
        );
        if (Number(remaining[0].total) < 1)
          throw adminError(
            'LAST_SUPER_ADMIN',
            '활성 슈퍼관리자를 최소 한 명 유지해야 합니다.'
          );
      }
      await db.query(
        'UPDATE admin SET name=?,role=?,is_active=?,company_name=?,contact_email=?,monthly_limit=?,token_version=token_version+?' +
          (hashed ? ',pw=?' : '') +
          ' WHERE id=?',
        [
          input.name,
          input.role,
          input.isActive,
          input.companyName,
          input.contactEmail,
          input.monthlyLimit,
          hashed ||
          input.role !== current[0].role ||
          input.isActive !== Number(current[0].is_active)
            ? 1
            : 0,
          ...(hashed ? [hashed] : []),
          target,
        ]
      );
    }
    await db.commit();
    return saved;
  } catch (e) {
    await db.rollback();
    if (e.code === 'ER_DUP_ENTRY')
      throw adminError('ADMIN_DUPLICATE', '이미 사용 중인 아이디입니다.', 409);
    throw e;
  } finally {
    db.release();
  }
}
export async function createCampaign(actor, body) {
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const [rows] = await db.query(
      `SELECT ${ADMIN_FIELDS} FROM admin WHERE id=? FOR UPDATE`,
      [actor.id]
    );
    const current = rows[0];
    if (
      !current ||
      !current.isActive ||
      Number(current.tokenVersion) !== Number(actor.tokenVersion)
    )
      throw adminError(
        'ADMIN_DISABLED',
        '계정 상태가 변경되었습니다. 다시 로그인해 주세요.',
        401
      );
    const month = monthKey();
    const budget = await usage(current, db, month);
    if (
      !isSuperAdmin(current) &&
      budget.limit !== null &&
      budget.used >= budget.limit
    )
      throw adminError(
        'MONTHLY_LIMIT_REACHED',
        '이번 달 캠페인 등록 한도를 모두 사용했습니다.',
        409
      );
    const data = {
      ...body,
      isRecommended: isSuperAdmin(current) ? body.isRecommended : false,
    };
    const id = await InsertMission(data, db);
    await db.query('UPDATE mission SET owner_admin_id=? WHERE id=?', [
      current.id,
      id,
    ]);
    await db.query(
      'INSERT INTO admin_campaign_usage (admin_id,month_key,used) VALUES (?,?,1) ON DUPLICATE KEY UPDATE used=used+1',
      [current.id, month]
    );
    await db.commit();
    return id;
  } catch (e) {
    await db.rollback();
    throw e;
  } finally {
    db.release();
  }
}
export async function assignCampaign(missionId, ownerId) {
  const owner = ownerId === null ? null : positiveId(ownerId);
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    if (owner !== null) {
      const [rows] = await db.query(
        'SELECT id FROM admin WHERE id=? AND is_active=1 FOR UPDATE',
        [owner]
      );
      if (!rows.length)
        throw adminError(
          'ADMIN_NOT_FOUND',
          '활성 관리자 계정을 선택해 주세요.'
        );
    }
    const [result] = await db.query(
      'UPDATE mission SET owner_admin_id=? WHERE id=?',
      [owner, positiveId(missionId)]
    );
    if (!result.affectedRows)
      throw adminError('MISSION_NOT_FOUND', '캠페인을 찾을 수 없습니다.', 404);
    await db.commit();
  } catch (e) {
    await db.rollback();
    throw e;
  } finally {
    db.release();
  }
}
