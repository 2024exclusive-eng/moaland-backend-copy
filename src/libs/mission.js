import pool from '../utils/pool.js';

/**
 * @function GetMissionList
 * @param {obj} filters - 페이지네이션 및 필터링을 위한 파라미터 (page, item, category, social)
 * @returns {Promise([obj] | null)} {missionData, paging}
 */
export const GetMissionList = async (filters) => {
  try {
    const itemsPerPage = Number(filters?.item ? filters.item : 30);
    const currentPage = filters?.page ? parseInt(filters.page) : 1;
    const offset = (currentPage - 1) * itemsPerPage;

    let query = `
      SELECT mission.id AS missionId, 
             mission.category AS category, 
             mission.enroll_start_date AS enrollStartDate, 
             mission.enroll_end_date AS enrollEndDate, 
             mission.social AS social, 
             mission.point AS point, 
             mission.max_enroll AS maxEnroll, 
             mission.brand AS brand, 
             mission.title AS title, 
             mission.thumbnail_img AS thumbnailImg,
             (SELECT COUNT(mission_enroll.id) 
              FROM mission_enroll 
              WHERE mission_enroll.mission_id = mission.id) AS enrollCount
      FROM mission
    `;

    const queryParams = [];
    const conditions = [];

    // category 필터 추가
    if (filters.category) {
      conditions.push('mission.category = ?');
      queryParams.push(filters.category);
    }

    // social 필터 추가
    if (filters.social) {
      conditions.push('mission.social = ?');
      queryParams.push(filters.social);
    }

    // 필터 조건이 있을 경우 WHERE 절 추가
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY mission.id DESC LIMIT ? OFFSET ?';
    queryParams.push(itemsPerPage, offset);

    const [totalResult] = await pool.query(`SELECT count(id) AS total FROM mission`);
    const totalItems = totalResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const [data] = await pool.query(query, queryParams);

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
 * @function GetMissionByMissionId
 * @param {obj} missionId 
 * @returns {Promise([obj] | null)} 
 */
export const GetMissionByMissionId = async (missionId) => {
  try {
    const [missionDetail] = await pool.query(
      `SELECT mission.id AS missionId, 
              mission.category AS category, 
              mission.enroll_start_date AS enrollStartDate, 
              mission.enroll_end_date AS enrollEndDate, 
              mission.select_date AS selectDate,
              mission.payment_date AS paymentDate,
              mission.mission_start_date AS missionStartDate,
              mission.mission_end_date AS missionEndDate,
              mission.social AS social, 
              mission.caution AS caution,
              mission.point AS point, 
              mission.max_enroll AS maxEnroll, 
              mission.brand AS brand, 
              mission.title AS title, 
              mission.goods_contents AS goodsContents,
              mission.mission_contents AS missionContents,
              (SELECT COUNT(mission_enroll.id) 
               FROM mission_enroll 
               WHERE mission_enroll.mission_id = mission.id) AS enrollCount
       FROM mission
       WHERE mission.id = ?`,
      [missionId]
    );

    return missionDetail.length ? missionDetail[0] : null;
  } catch (e) {
    throw e;
  }
};