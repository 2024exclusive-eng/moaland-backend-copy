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
 * @function GetUserMissionEnroll
 * @param {number} missionId
 * @param {number} userId
 * @returns {Promise(obj | null)} Enrollment details or null if not enrolled
 */
export const GetUserMissionEnroll = async (missionId, userId) => {
  try {
    const [result] = await pool.query(
      `SELECT
         id AS enrollId,
         mission_id AS missionId,
         user_id AS userId,
         name,
         status,
         link,
         link_updated AS linkUpdated,
         created
       FROM mission_enroll
       WHERE mission_id = ? AND user_id = ?`,
      [missionId, userId]
    );

    return result.length > 0 ? result[0] : null;
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

    // Default to 'selected' if no type provided
    type = type === "" || !type ? "selected" : type;

    let statusCondition;
    let additionalCondition = '';
    let queryParams;
    let countParams;

    if (type === "applied") {
      // User has applied but not yet selected
      statusCondition = `mission_enroll.status = 'applied'`;
      queryParams = [userId, itemsPerPage, offset];
      countParams = [userId];
    } else if (type === "selected") {
      // User has been selected but hasn't submitted content yet
      statusCondition = `mission_enroll.status = 'selected'`;
      additionalCondition = ` AND mission_enroll.link IS NULL`;
      queryParams = [userId, itemsPerPage, offset];
      countParams = [userId];
    } else if (type === "registered") {
      // User has submitted content link but not yet completed/rewarded
      statusCondition = `mission_enroll.link IS NOT NULL`;
      additionalCondition = ` AND mission_enroll.status NOT IN ('completed', 'rewarded')`;
      queryParams = [userId, itemsPerPage, offset];
      countParams = [userId];
    } else if (type === "ended") {
      // Mission ended (content_end_date passed) OR status is completed/rewarded
      // Falls back to enroll_end_date when content_end_date is NULL
      statusCondition = `(mission_enroll.status IN ('completed', 'rewarded') OR (mission.content_end_date IS NOT NULL AND mission.content_end_date < UTC_TIMESTAMP()) OR (mission.content_end_date IS NULL AND mission.enroll_end_date < UTC_TIMESTAMP()))`;
      queryParams = [userId, itemsPerPage, offset];
      countParams = [userId];
    } else {
      // Fallback: direct status match for any other status
      statusCondition = `mission_enroll.status = ?`;
      queryParams = [userId, type, itemsPerPage, offset];
      countParams = [userId, type];
    }

    const [totalResult] = await pool.query(
      `SELECT COUNT(*) AS totalCount
       FROM mission_enroll
       INNER JOIN mission ON mission_enroll.mission_id = mission.id
       WHERE mission_enroll.user_id = ?
       AND ${statusCondition}${additionalCondition}`,
      countParams
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
              mission.content_start_date AS contentStartDate,
              mission.content_end_date AS contentEndDate,
              mission.social AS social,
              mission.point AS point,
              mission.max_enroll AS maxEnroll,
              mission.brand AS brand,
              mission.title AS title,
              mission.thumbnail_img AS thumbnailImg,
              mission.goods_contents AS goodsContents,
              mission_enroll.id AS enrollId,
              mission_enroll.name AS userName,
              mission_enroll.status AS status,
              mission_enroll.link AS link,
              mission_enroll.link_updated AS linkUpdated,
              mission_enroll.visit_datetime_start AS visitDatetimeStart,
              mission_enroll.visit_datetime_end AS visitDatetimeEnd,
              mission_enroll.instagram_link AS instagramLink,
              mission_enroll.wechat_id AS wechatId,
              mission_enroll.memo AS memo,
              mission_enroll.created AS created,
              (SELECT COUNT(*)
               FROM mission_enroll AS me
               WHERE me.mission_id = mission.id) AS enrollCount
       FROM mission_enroll
       INNER JOIN mission ON mission_enroll.mission_id = mission.id
       WHERE mission_enroll.user_id = ?
       AND ${statusCondition}${additionalCondition}
       ORDER BY mission_enroll.created DESC
       LIMIT ? OFFSET ?`,
      queryParams
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
 * @param {number} missionId
 * @param {number} userId
 * @param {string} name
 * @param {string} instagramLink
 * @param {string} wechatId
 * @param {string} visitDatetimeStart - ISO datetime string for visit start
 * @param {string} visitDatetimeEnd - ISO datetime string for visit end
 * @param {string} memo - Optional notes
 * @returns {Promise<number>} - Returns insertId
 */
export const InsertMissionEnroll = async (missionId, userId, name, instagramLink, wechatId, visitDatetimeStart, visitDatetimeEnd, memo) => {
  try {
    const [data] = await pool.query(
      `INSERT INTO mission_enroll (mission_id, user_id, name, instagram_link, wechat_id, visit_datetime_start, visit_datetime_end, memo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [missionId, userId, name, instagramLink, wechatId, visitDatetimeStart, visitDatetimeEnd, memo]
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
 * @param {number} missionId
 * @param {number} userId
 * @param {object} links - JSON object with platform URLs: {Xiaohongshu: "url", Instagram: "url"}
 * @returns {Promise([obj] | null)}
 * @description Updates content links without changing status.
 *              Status flow: selected -> (link submitted) -> admin marks as completed/rewarded
 */
export const UpdateMissionContent = async ({ missionId, userId, links }) => {
  try {
    const linksJson = JSON.stringify(links);

    // Only update link, don't change status (admin will mark as completed later)
    const result = await pool.query(
      `UPDATE mission_enroll
       SET link = ?, link_updated = NOW()
       WHERE mission_id = ? AND user_id = ? AND status = 'selected'`,
      [linksJson, missionId, userId]
    );

    return result;
  } catch (e) {
    throw e;
  }
};

/**
 * @function GetUsersByMissionId
 * @param {number} missionId
 * @returns {Promise([obj] | null)} 
 */
export const GetUsersByMissionId = async (missionId) => {
  try {
    const [result] = await pool.query(
      `SELECT mission_enroll.id AS missionEnrollId,
              mission_enroll.user_id AS userId,
              mission_enroll.name,
              mission_enroll.status,
              mission_enroll.wechat_id,
              mission_enroll.instagram_link,
              mission_enroll.visit_datetime_start,
              mission_enroll.visit_datetime_end,
              mission_enroll.memo,
              mission_enroll.link,
              mission_enroll.link_updated AS linkUpdated,
              mission_enroll.created,
              user.email,
              user.deleted,
              user.is_delete,
              user.link AS userLink,
              user.oauth_type AS oauthType
       FROM mission_enroll
       INNER JOIN user ON mission_enroll.user_id = user.id
       WHERE mission_enroll.mission_id = ?`,
      [missionId]
    );

    return result;
  } catch (e) {
    throw e;
  }
};

/**
 * @function UpdateMissionEnrollStatus
 * @param {number} enrollId
 * @param {string} type
 * @returns {Promise([obj] | null)} 
 */
export const UpdateMissionEnrollStatus = async (enrollId, type) => {
  try {
    const result = await pool.query(
      `UPDATE mission_enroll 
       SET status = ? 
       WHERE id = ?`,
      [type, enrollId]
    );
    return result;
  } catch (e) {
    throw e;
  }
};