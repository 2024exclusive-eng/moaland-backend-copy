import pool from '../utils/pool.js';

/**
 * @function CheckUserMissionEnroll
 * @param {obj}
 * @returns {Promise([obj] | null)} 
 */
export const CheckUserMissionEnroll = async (missionId, userId) => {
  try {
    const [result] = await pool.query(
      `SELECT COUNT(*) AS enrolled 
       FROM mission_enroll 
       WHERE mission_enroll.mission_id = ? AND mission_enroll.user_id = ?`,
      [missionId, userId]
    );

    return result[0].enrolled > 0;
  } catch (e) {
    throw e;
  }
};

/**
 * @function GetMissionEnrollCount
 * @param {obj}
 * @returns {Promise([obj] | null)} 
 */
export const GetMissionEnrollCount = async (missionId) => {
  try {
    const [result] = await pool.query(
      `SELECT COUNT(*) AS currentEnrollCount
       FROM mission_enroll
       WHERE mission_id = ?`,
      [missionId]
    );

    return result[0].currentEnrollCount;
  } catch (e) {
    throw e;
  }
};

export const GetMissionListByUserId = async ({ page, item, type, userId }) => {
  try {
    const itemsPerPage = Number(item ? item : 30);
    const currentPage = page ? parseInt(page) : 1;
    const offset = (currentPage - 1) * itemsPerPage;

    // 기본 type이 비어 있으면 "enroll"로 설정
    type = type === "" ? "enroll" : type;

    // type이 complete인 경우 point 타입도 함께 조회하기 위해 OR 조건 추가
    const statusCondition = type === "complete" ? `(mission_enroll.status = 'complete' OR mission_enroll.status = 'point')` : `mission_enroll.status = ?`;

    const [totalResult] = await pool.query(
      `SELECT COUNT(*) AS totalCount
       FROM mission_enroll 
       WHERE mission_enroll.user_id = ? 
       AND ${statusCondition}`,
      type === "complete" ? [userId] : [userId, type]
    );

    const totalItems = totalResult[0].totalCount;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const [data] = await pool.query(
      `SELECT mission.id AS missionId, 
              mission.category AS category, 
              mission.enroll_start_date AS enrollStartDate, 
              mission.enroll_end_date AS enrollEndDate, 
              mission.select_date AS selectDate,
              mission.payment_date AS paymentDate,
              mission.mission_start_date AS missionStartDate,
              mission.mission_end_date AS missionEndDate,
              mission.social AS social, 
              mission.point AS point, 
              mission.max_enroll AS maxEnroll, 
              mission.brand AS brand, 
              mission.title AS title, 
              mission.thumbnail_img AS thumbnailImg,
              mission_enroll.id AS enrollId,
              mission_enroll.name AS userName,
              mission_enroll.address AS address,
              mission_enroll.status AS status,
              mission_enroll.link AS link,
              mission_enroll.link_updated AS linkUpdated,
              mission_enroll.created AS created
       FROM mission_enroll 
       INNER JOIN mission ON mission_enroll.mission_id = mission.id
       WHERE mission_enroll.user_id = ? 
       AND ${statusCondition}
       ORDER BY mission_enroll.created DESC
       LIMIT ? OFFSET ?`,
      type === "complete" ? [userId, itemsPerPage, offset] : [userId, type, itemsPerPage, offset]
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
 * @function InsertMissionEnroll
 * @param {obj}
 * @returns {Promise([obj] | null)} 
 */
export const InsertMissionEnroll = async (missionId, userId) => {
  try {
    const [data] = await pool.query(
      `INSERT INTO mission_enroll (mission_id, user_id) VALUES (?, ?)`,
      [missionId, userId]
    );

    return data.insertId;
  } catch (e) {
    throw e;
  }
};

/**
 * @function DeleteMissionEnroll
 * @param {obj}
 * @returns {Promise([obj] | null)} 
 */
export const DeleteMissionEnroll = async (missionId, userId) => {
  try {
    const result = await pool.query(
      `DELETE FROM mission_enroll 
       WHERE mission_id = ? AND user_id = ?`,
      [missionId, userId]
    );

    return result;
  } catch (e) {
    throw e;
  }
};

/**
 * @function UpdateMissionContent
 * @param {obj}
 * @returns {Promise([obj] | null)} 
 */
export const UpdateMissionContent = async ({ missionId, userId, link }) => {
  try {
    const result = await pool.query(
      `UPDATE mission_enroll 
       SET link = ?, link_updated = NOW()
       WHERE mission_id = ? AND user_id = ? AND status = 'select'`,
      [link, missionId, userId]
    );
    return result;
  } catch (e) {
    throw e;
  }
};