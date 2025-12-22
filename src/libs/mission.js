import pool from '../utils/pool.js';

/**
 * @function GetMissionList
 * @param {obj} filters - 페이지네이션 및 필터링을 위한 파라미터 (page, item, category, social)
 * @returns {Promise([obj] | null)} {missionData, paging}
 */
export const GetMissionList = async filters => {
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

    // 필터 조건을 total count 조회 쿼리에 추가
    let countQuery = 'SELECT count(id) AS total FROM mission';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const [totalResult] = await pool.query(countQuery, queryParams.slice(0, queryParams.length - 2)); // LIMIT와 OFFSET을 제외한 파라미터만 전달
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
export const GetMissionByMissionId = async missionId => {
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
              mission.content_start_date AS contentStartDate,
              mission.content_end_date AS contentEndDate,
              mission.social AS social,
              mission.region AS region,
              mission.address AS address,
              mission.latitude AS latitude,
              mission.longitude AS longitude,
              mission.point AS point,
              mission.max_enroll AS maxEnroll,
              mission.brand AS brand,
              mission.title AS title,
              mission.thumbnail_img AS thumbnailImg,
              mission.detail_img AS detailImg,
              mission.goods_contents AS goodsContents,
              mission.mission_contents AS missionContents,
              mission.additional_info AS additionalInfo,
              mission.guideline AS guideline,
              (SELECT COUNT(mission_enroll.id)
               FROM mission_enroll
               WHERE mission_enroll.mission_id = mission.id) AS enrollCount
       FROM mission
       WHERE mission.id = ?`,
      [missionId],
    );

    return missionDetail.length ? missionDetail[0] : null;
  } catch (e) {
    throw e;
  }
};

/**
 * @function DeleteMission
 * @param {number} missionId
 * @returns {Promise<boolean>}
 */
export const DeleteMission = async missionId => {
  try {
    const [result] = await pool.query('DELETE FROM mission WHERE id = ?', [missionId]);

    return result.affectedRows > 0;
  } catch (e) {
    throw e;
  }
};

/**
 * @function InsertMission
 * @param {obj} missionData - 생성할 미션의 데이터
 * @returns {Promise<number>} 생성된 미션의 ID
 */
export const InsertMission = async missionData => {
  try {
    const {
      category,
      enrollStartDate,
      enrollEndDate,
      selectDate,
      paymentDate,
      missionStartDate,
      missionEndDate,
      contentStartDate,
      contentEndDate,
      social,
      region,
      address,
      latitude,
      longitude,
      point,
      maxEnroll,
      brand,
      title,
      thumbnailImg,
      detailImg,
      goodsContents,
      missionContents,
      additionalInfo,
      guideline,
    } = missionData;

    const [result] = await pool.query(
      `INSERT INTO mission (
        category, enroll_start_date, enroll_end_date, select_date, payment_date,
        mission_start_date, mission_end_date, content_start_date, content_end_date,
        social, region, address, latitude, longitude, point, max_enroll,
        brand, title, thumbnail_img, detail_img, goods_contents, mission_contents,
        additional_info, guideline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category,
        enrollStartDate,
        enrollEndDate,
        selectDate,
        paymentDate,
        missionStartDate,
        missionEndDate,
        contentStartDate,
        contentEndDate,
        social,
        region,
        address,
        latitude,
        longitude,
        point,
        maxEnroll,
        brand,
        title,
        thumbnailImg,
        detailImg,
        goodsContents,
        missionContents,
        additionalInfo,
        guideline,
      ],
    );

    return result.insertId;
  } catch (e) {
    throw e;
  }
};

/**
 * @function UpdateMission
 * @param {number} missionId - 업데이트할 미션의 ID
 * @param {obj} missionData - 업데이트할 미션의 데이터
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
export const UpdateMission = async (missionId, missionData) => {
  try {
    const {
      category,
      enrollStartDate,
      enrollEndDate,
      selectDate,
      paymentDate,
      missionStartDate,
      missionEndDate,
      contentStartDate,
      contentEndDate,
      social,
      region,
      address,
      latitude,
      longitude,
      point,
      maxEnroll,
      brand,
      title,
      thumbnailImg,
      detailImg,
      goodsContents,
      missionContents,
      additionalInfo,
      guideline,
    } = missionData;

    const [result] = await pool.query(
      `UPDATE mission SET
        category = ?,
        enroll_start_date = ?,
        enroll_end_date = ?,
        select_date = ?,
        payment_date = ?,
        mission_start_date = ?,
        mission_end_date = ?,
        content_start_date = ?,
        content_end_date = ?,
        social = ?,
        region = ?,
        address = ?,
        latitude = ?,
        longitude = ?,
        point = ?,
        max_enroll = ?,
        brand = ?,
        title = ?,
        thumbnail_img = ?,
        detail_img = ?,
        goods_contents = ?,
        mission_contents = ?,
        additional_info = ?,
        guideline = ?
      WHERE id = ?`,
      [
        category,
        enrollStartDate,
        enrollEndDate,
        selectDate,
        paymentDate,
        missionStartDate,
        missionEndDate,
        contentStartDate,
        contentEndDate,
        social,
        region,
        address,
        latitude,
        longitude,
        point,
        maxEnroll,
        brand,
        title,
        thumbnailImg,
        detailImg,
        goodsContents,
        missionContents,
        additionalInfo,
        guideline,
        missionId,
      ],
    );

    return result.affectedRows > 0;
  } catch (e) {
    throw e;
  }
};
// Update GetMissionCountByStatus function

// Update GetMissionListByStatus function

/**
 * @function GetMissionCountByStatus
 * @param {string} type - 미션 상태 타입 (new, select, selected, complete)
 * @returns {Promise<number>} 미션들의 갯수
 */
export const GetMissionCountByStatus = async type => {
  try {
    let query = '';
    const queryParams = [];

    if (type === 'new') {
      query = `
        SELECT COUNT(*) AS count
        FROM mission
        WHERE select_date > NOW()
      `;
    } else if (type === 'select') {
      query = `
        SELECT COUNT(*) AS count
        FROM mission
        WHERE select_date <= NOW()
          AND mission_end_date > NOW()
          AND (SELECT COUNT(*) 
               FROM mission_enroll 
               WHERE mission_enroll.mission_id = mission.id 
                 AND (mission_enroll.status = 'select' OR mission_enroll.status = 'complete')) < mission.max_enroll
      `;
    } else if (type === 'selected') {
      query = `
        SELECT COUNT(*) AS count
        FROM mission
        WHERE select_date <= NOW()
          AND mission_end_date <= NOW()
          AND (SELECT COUNT(*) 
               FROM mission_enroll 
               WHERE mission_enroll.mission_id = mission.id 
                 AND (mission_enroll.status = 'select' OR mission_enroll.status = 'complete')) >= mission.max_enroll
          AND EXISTS (SELECT 1 
                      FROM mission_enroll 
                      WHERE mission_enroll.mission_id = mission.id 
                        AND mission_enroll.status = 'select')
      `;
    } else if (type === 'complete') {
      query = `
        SELECT COUNT(*) AS count
        FROM mission
        WHERE select_date <= NOW()
          AND mission_end_date <= NOW()
          AND (SELECT COUNT(*) 
               FROM mission_enroll 
               WHERE mission_enroll.mission_id = mission.id 
                 AND (mission_enroll.status = 'select' OR mission_enroll.status = 'complete')) >= mission.max_enroll
          AND NOT EXISTS (SELECT 1 
                          FROM mission_enroll 
                          WHERE mission_enroll.mission_id = mission.id 
                            AND mission_enroll.status != 'complete')
      `;
    } else {
      throw new Error('Invalid type');
    }

    const [result] = await pool.query(query, queryParams);
    return result[0].count;
  } catch (e) {
    throw e;
  }
};

/**
 * @function GetMissionListByStatus
 * @param {string} type - 미션 상태 타입 (new, select, selected, complete)
 * @param {obj} filters - 페이지네이션 및 필터링을 위한 파라미터 (page, item)
 * @returns {Promise([obj] | null)} {missionData, paging}
 */
export const GetMissionListByStatus = async (type, filters = {}) => {
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
             mission.created,
             mission.select_date AS selectDate,
             mission.payment_date AS paymentDate,
             mission.mission_start_date AS missionStartDate,
             mission.mission_end_date AS missionEndDate,
             (SELECT COUNT(mission_enroll.id)
              FROM mission_enroll
              WHERE mission_enroll.mission_id = mission.id) AS enrollCount
      FROM mission
    `;

    let countQuery = 'SELECT COUNT(*) AS total FROM mission';
    const conditions = [];

    // Only add conditions if type is provided and not empty
    if (type && type !== '') {
      if (type === 'new') {
        conditions.push('select_date > NOW()');
      } else if (type === 'select') {
        conditions.push(`
          select_date <= NOW()
          AND mission_end_date > NOW()
          AND (SELECT COUNT(*)
               FROM mission_enroll
               WHERE mission_enroll.mission_id = mission.id
                 AND (mission_enroll.status = 'select' OR mission_enroll.status = 'complete')) < mission.max_enroll
        `);
      } else if (type === 'selected') {
        conditions.push(`
          select_date <= NOW()
          AND mission_end_date <= NOW()
          AND EXISTS (SELECT 1
                      FROM mission_enroll
                      WHERE mission_enroll.mission_id = mission.id
                        AND mission_enroll.status != 'complete')
        `);
      } else if (type === 'complete') {
        conditions.push(`
          select_date <= NOW()
          AND mission_end_date <= NOW()
          AND NOT EXISTS (SELECT 1
                          FROM mission_enroll
                          WHERE mission_enroll.mission_id = mission.id
                            AND mission_enroll.status != 'complete')
        `);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY mission.id ASC LIMIT ? OFFSET ?';

    const [totalResult] = await pool.query(countQuery);
    const totalItems = totalResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const [data] = await pool.query(query, [itemsPerPage, offset]);

    const [mustSelectTodayResult] = await pool.query(`
      SELECT COUNT(*) as count
      FROM mission
      WHERE DATE(select_date) = CURDATE()
    `);

    const [delayedResult] = await pool.query(`
      SELECT COUNT(*) as count
      FROM mission_enroll
      WHERE status = 'delayed'
    `);

    const [inProgressResult] = await pool.query(`
      SELECT COUNT(*) as count
      FROM mission
      WHERE NOW() BETWEEN mission_start_date AND mission_end_date
    `);

    return {
      data,
      paging: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
      },
      statistics: {
        mustSelectToday: mustSelectTodayResult[0].count,
        delayedEnrollments: delayedResult[0].count,
        inProgress: inProgressResult[0].count,
      },
    };
  } catch (e) {
    throw e;
  }
};
