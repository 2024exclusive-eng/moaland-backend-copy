import pool from '../utils/pool.js';

/**
 * @function GetTotalPoint
 * @param {obj}
 * @returns {Promise([obj] | null)}
 */
export const GetTotalPoint = async userId => {
  try {
    const [data] = await pool.query(
      `SELECT SUM(point) AS totalPoints
       FROM point 
       WHERE user_id = ?`,
      [userId]
    );

    return data[0].totalPoints || 0;

  } catch (e) {
    throw e;
  }
};

/**
 * @function GetExpectedPoint
 * @param {obj}
 * @returns {Promise([obj] | null)}
 */
export const GetExpectedPoint = async userId => {
  try {
    const [data] = await pool.query(
      `SELECT SUM(mission.point) AS expectedPoints
      FROM mission_enroll 
      INNER JOIN mission ON mission_enroll.mission_id = mission.id
      WHERE mission_enroll.user_id = ? 
      AND mission_enroll.status = 'point'`,
      [userId]
    );

    return data[0].expectedPoints || 0;

  } catch (e) {
    throw e;
  }
};

/**
 * @function GetPointList
 * @param {obj}
 * @returns {Promise([obj] | null)} {noticeData, Paging}
 */
export const GetPointList = async ({ userId, page, item, type }) => {
  try {
    const itemsPerPage = Number(item ? item : 30);
    const currentPage = page ? parseInt(page) : 1;
    const offset = (currentPage - 1) * itemsPerPage;

    // 전체 포인트 수 계산
    const [totalResult] = await pool.query(
      `SELECT COUNT(*) AS total 
       FROM haru.point 
       WHERE user_id = ? 
       AND type = ?`,
      [userId, type]
    );

    const totalItems = totalResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // 포인트 내역 데이터 조회
    const [data] = await pool.query(
      `SELECT id, user_id AS userId, mission_id AS missionId, type, withdrawal_status AS withdrawalStatus, 
              point, created
       FROM haru.point 
       WHERE user_id = ? 
       AND type = ?
       ORDER BY created DESC 
       LIMIT ? OFFSET ?`,
      [userId, type, itemsPerPage, offset]
    );

    return {
      data,
      paging: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
      },
    };
  } catch (e) {
    throw e;
  }
};

/**
 * @function WithdrawalPoint
 * @description 사용자 포인트 인출 처리
 * @param {number} userId - 사용자 ID
 * @returns {Promise}
 */
export const WithdrawalPoint = async (userId, point) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO haru.point (user_id, type, withdrawal_status, point)
       VALUES (?, 'withdrawal', 'pending', ?)`,
      [userId, point]
    );

    return result.insertId;
  } catch (e) {
    throw e;
  }
};