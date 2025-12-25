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
             mission.is_recommended AS isRecommended,
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

    // is_recommended 필터 추가
    if (filters.is_recommended !== undefined) {
      conditions.push('mission.is_recommended = ?');
      // Convert string 'true'/'false' or boolean to 1/0
      const isRecommended = filters.is_recommended === 'true' || filters.is_recommended === true ? 1 : 0;
      queryParams.push(isRecommended);
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
              mission.is_recommended AS isRecommended,
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
      isRecommended,
    } = missionData;

    const [result] = await pool.query(
      `INSERT INTO mission (
        category, enroll_start_date, enroll_end_date, select_date, payment_date,
        mission_start_date, mission_end_date, content_start_date, content_end_date,
        social, region, address, latitude, longitude, point, max_enroll,
        brand, title, thumbnail_img, detail_img, goods_contents, mission_contents,
        additional_info, guideline, is_recommended
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        isRecommended ? 1 : 0,
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
      isRecommended,
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
        guideline = ?,
        is_recommended = ?
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
        isRecommended ? 1 : 0,
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
 * @param {obj} filters - 필터링 및 페이지네이션 파라미터
 * @param {string} filters.status - 미션 상태 (comma-separated): opening_soon, applying, application_deadline, in_progress, registration_deadline, end
 * @param {string} filters.selection_status - 선정 상태 (comma-separated): waiting, selection_date, delayed, completed, selection_deadline
 * @param {string} filters.region - 지역 (comma-separated): Seoul, Busan, Jeju, Other
 * @param {string} filters.category - 카테고리 (comma-separated): restaurant, Hospital, Beauty, Culture, Stay, Massage
 * @param {string} filters.social - 소셜 플랫폼 (comma-separated): Xiaohongshu, Douyin, Dajongdienping, Instagram, YouTube
 * @param {string} filters.search - 검색어 (title, brand)
 * @param {number} filters.page - 페이지 번호
 * @param {number} filters.item - 페이지당 아이템 수
 * @returns {Promise([obj] | null)} {missionData, paging}
 */
export const GetMissionListByStatus = async (filters = {}) => {
  try {
    const itemsPerPage = Number(filters?.item ? filters.item : 30);
    const currentPage = filters?.page ? parseInt(filters.page) : 1;
    const offset = (currentPage - 1) * itemsPerPage;

    let query = `
      SELECT mission.id AS missionId,
             mission.category AS category,
             mission.enroll_start_date AS enrollStartDate,
             mission.enroll_end_date AS enrollEndDate,
             mission.content_start_date AS contentStartDate,
             mission.content_end_date AS contentEndDate,
             mission.social AS social,
             mission.region AS region,
             mission.point AS point,
             mission.max_enroll AS maxEnroll,
             mission.brand AS brand,
             mission.title AS title,
             mission.is_public AS is_public,
             mission.is_recommended AS isRecommended,
             mission.thumbnail_img AS thumbnailImg,
             mission.created,
             mission.select_date AS selectDate,
             mission.payment_date AS paymentDate,
             mission.mission_start_date AS missionStartDate,
             mission.mission_end_date AS missionEndDate,
             (SELECT COUNT(mission_enroll.id)
              FROM mission_enroll
              WHERE mission_enroll.mission_id = mission.id) AS enrollCount,
             (SELECT COUNT(mission_enroll.id)
              FROM mission_enroll
              WHERE mission_enroll.mission_id = mission.id
                AND mission_enroll.status = 'selected') AS selectedParticipantCount
      FROM mission
    `;

    let countQuery = 'SELECT COUNT(*) AS total FROM mission';
    const conditions = [];
    const queryParams = [];
    const countParams = [];

    // Status filter (Mission lifecycle)
    if (filters.status) {
      const statuses = filters.status.split(',').map(s => s.trim());
      const statusConditions = [];

      statuses.forEach(status => {
        switch (status) {
          case 'opening_soon':
            statusConditions.push('NOW() < mission.enroll_start_date');
            break;
          case 'applying':
            statusConditions.push('NOW() BETWEEN mission.enroll_start_date AND mission.enroll_end_date');
            break;
          case 'application_deadline':
            statusConditions.push('DATE(mission.select_date) = CURDATE()');
            break;
          case 'in_progress':
            statusConditions.push('NOW() BETWEEN mission.mission_start_date AND mission.mission_end_date');
            break;
          case 'registration_deadline':
            statusConditions.push('NOW() BETWEEN mission.content_start_date AND mission.content_end_date');
            break;
          case 'end':
            statusConditions.push('NOW() > mission.content_end_date');
            break;
        }
      });

      if (statusConditions.length > 0) {
        conditions.push(`(${statusConditions.join(' OR ')})`);
      }
    }

    // Selection status filter
    if (filters.selection_status) {
      const selectionStatuses = filters.selection_status.split(',').map(s => s.trim());
      const selectionConditions = [];

      selectionStatuses.forEach(status => {
        switch (status) {
          case 'waiting':
            selectionConditions.push('(mission.select_date IS NULL OR NOW() < mission.select_date)');
            break;
          case 'selection_date':
            selectionConditions.push('DATE(mission.select_date) = CURDATE()');
            break;
          case 'delayed':
            selectionConditions.push(`(
              NOW() > mission.select_date
              AND NOW() < mission.content_end_date
              AND (SELECT COUNT(*) FROM mission_enroll WHERE mission_enroll.mission_id = mission.id AND mission_enroll.status = 'selected') = 0
            )`);
            break;
          case 'completed':
            selectionConditions.push(`(
              NOW() > mission.select_date
              AND NOW() < mission.content_end_date
              AND (SELECT COUNT(*) FROM mission_enroll WHERE mission_enroll.mission_id = mission.id AND mission_enroll.status = 'selected') > 0
            )`);
            break;
          case 'selection_deadline':
            selectionConditions.push('NOW() > mission.content_end_date');
            break;
        }
      });

      if (selectionConditions.length > 0) {
        conditions.push(`(${selectionConditions.join(' OR ')})`);
      }
    }

    // Region filter (simple IN clause)
    if (filters.region) {
      const regions = filters.region.split(',').map(r => r.trim());
      const placeholders = regions.map(() => '?').join(',');
      conditions.push(`mission.region IN (${placeholders})`);
      queryParams.push(...regions);
      countParams.push(...regions);
    }

    // Category filter (simple IN clause)
    if (filters.category) {
      const categories = filters.category.split(',').map(c => c.trim());
      const placeholders = categories.map(() => '?').join(',');
      conditions.push(`mission.category IN (${placeholders})`);
      queryParams.push(...categories);
      countParams.push(...categories);
    }

    // Social filter (FIND_IN_SET for comma-separated values in DB)
    if (filters.social) {
      const socials = filters.social.split(',').map(s => s.trim());
      const socialConditions = socials.map(() => 'FIND_IN_SET(?, mission.social) > 0');
      conditions.push(`(${socialConditions.join(' OR ')})`);
      queryParams.push(...socials);
      countParams.push(...socials);
    }

    // Search filter
    if (filters.search) {
      conditions.push('(mission.title LIKE ? OR mission.brand LIKE ?)');
      queryParams.push(`%${filters.search}%`, `%${filters.search}%`);
      countParams.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.is_recommended !== undefined) {
      conditions.push('mission.is_recommended = ?');
      const isRecommended = filters.is_recommended === 'true' || filters.is_recommended === true ? 1 : 0;
      queryParams.push(isRecommended);
      countParams.push(isRecommended)
    }

    // Apply conditions
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY mission.id DESC LIMIT ? OFFSET ?';
    queryParams.push(itemsPerPage, offset);

    const [totalResult] = await pool.query(countQuery, countParams);
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
 * @function UpdatePublicMission
 * @param {number} missionId
 * @param {boolean} payload
 * @returns {Promise([obj] | null)}
 */
export const UpdatePublicMission = async (missionId, payload) => {
  try {
    const result = await pool.query(
      `UPDATE mission
       SET is_public = ?
       WHERE mission.id = ?`,
      [Number(payload), missionId]
    );
    return result;
  } catch (e) {
    throw e;
  }
};

/**
 * @function UpdateRecommendedMission
 * @param {number} missionId
 * @param {boolean} isRecommended - true or false
 * @returns {Promise<affectedRows>}
 */
export const UpdateRecommendedMission = async (missionId, isRecommended) => {
  try {
    const [result] = await pool.query(
      `UPDATE mission
       SET is_recommended = ?
       WHERE id = ?`,
      [isRecommended ? 1 : 0, missionId]
    );
    return result.affectedRows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function GetMissionStatistics
 * @description Get global mission statistics based on admin workflow
 * @returns {Promise<obj>} Statistics object with totalMissions, mustSelectToday, delayedEnrollments, and inProgress counts
 *
 * Admin Flow Mapping:
 * - totalMissions: Total number of all missions
 * - mustSelectToday: "Application deadline" - missions where select_date is TODAY
 * - delayedEnrollments: Missions past select_date but no participants selected yet
 * - inProgress: "In Progress" + "Registration Deadline" - missions during mission/content periods
 */
export const GetMissionStatistics = async () => {
  try {
    const [totalMissionsResult] = await pool.query(`
      SELECT COUNT(*) as count
      FROM mission
    `);

    const [mustSelectTodayResult] = await pool.query(`
      SELECT COUNT(*) as count
      FROM mission
      WHERE DATE(select_date) = CURDATE()
    `);

    const [delayedResult] = await pool.query(`
      SELECT COUNT(*) as count
      FROM mission
      WHERE DATE(select_date) < CURDATE()
        AND (SELECT COUNT(*)
             FROM mission_enroll
             WHERE mission_enroll.mission_id = mission.id
               AND mission_enroll.status = 'selected') = 0
    `);

    const [inProgressResult] = await pool.query(`
      SELECT COUNT(*) as count
      FROM mission
      WHERE (CURDATE() BETWEEN DATE(mission_start_date) AND DATE(mission_end_date))
         OR (CURDATE() BETWEEN DATE(content_start_date) AND DATE(content_end_date))
    `);

    return {
      totalMissions: totalMissionsResult[0].count,
      mustSelectToday: mustSelectTodayResult[0].count,
      delayedEnrollments: delayedResult[0].count,
      inProgress: inProgressResult[0].count,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * @function GetMissionFilterCounts
 * @description Get counts for all filter options to display in the UI
 * @returns {Promise<obj>} Object with counts for each filter category
 */
export const GetMissionFilterCounts = async () => {
  try {
    // Status counts
    const [statusCounts] = await pool.query(`
      SELECT
        SUM(CASE WHEN NOW() < enroll_start_date THEN 1 ELSE 0 END) AS opening_soon,
        SUM(CASE WHEN NOW() BETWEEN enroll_start_date AND enroll_end_date THEN 1 ELSE 0 END) AS applying,
        SUM(CASE WHEN DATE(select_date) = CURDATE() THEN 1 ELSE 0 END) AS application_deadline,
        SUM(CASE WHEN NOW() BETWEEN mission_start_date AND mission_end_date THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN NOW() BETWEEN content_start_date AND content_end_date THEN 1 ELSE 0 END) AS registration_deadline,
        SUM(CASE WHEN NOW() > content_end_date THEN 1 ELSE 0 END) AS end_count
      FROM mission
    `);

    // Selection status counts
    const [selectionStatusCounts] = await pool.query(`
      SELECT
        SUM(CASE WHEN select_date IS NULL OR NOW() < select_date THEN 1 ELSE 0 END) AS waiting,
        SUM(CASE WHEN DATE(select_date) = CURDATE() THEN 1 ELSE 0 END) AS selection_date,
        SUM(CASE WHEN NOW() > select_date AND NOW() < content_end_date AND (SELECT COUNT(*) FROM mission_enroll WHERE mission_enroll.mission_id = mission.id AND mission_enroll.status = 'selected') = 0 THEN 1 ELSE 0 END) AS \`delayed\`,
        SUM(CASE WHEN NOW() > select_date AND NOW() < content_end_date AND (SELECT COUNT(*) FROM mission_enroll WHERE mission_enroll.mission_id = mission.id AND mission_enroll.status = 'selected') > 0 THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN NOW() > content_end_date THEN 1 ELSE 0 END) AS selection_deadline
      FROM mission
    `);

    // Region counts
    const [regionCounts] = await pool.query(`
      SELECT region, COUNT(*) as count
      FROM mission
      WHERE region IS NOT NULL
      GROUP BY region
    `);

    // Category counts
    const [categoryCounts] = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM mission
      WHERE category IS NOT NULL
      GROUP BY category
    `);

    // Social counts (using FIND_IN_SET)
    const socialPlatforms = ['Xiaohongshu', 'Douyin', 'Dajongdienping', 'Instagram', 'YouTube'];
    const socialCounts = {};

    for (const platform of socialPlatforms) {
      const [result] = await pool.query(`
        SELECT COUNT(*) as count
        FROM mission
        WHERE FIND_IN_SET(?, social) > 0
      `, [platform]);
      socialCounts[platform] = result[0].count;
    }

    // Format region counts as object
    const regionCountsObj = {};
    regionCounts.forEach(row => {
      regionCountsObj[row.region] = row.count;
    });

    // Format category counts as object
    const categoryCountsObj = {};
    categoryCounts.forEach(row => {
      categoryCountsObj[row.category] = row.count;
    });

    return {
      status: {
        opening_soon: statusCounts[0].opening_soon || 0,
        applying: statusCounts[0].applying || 0,
        application_deadline: statusCounts[0].application_deadline || 0,
        in_progress: statusCounts[0].in_progress || 0,
        registration_deadline: statusCounts[0].registration_deadline || 0,
        end: statusCounts[0].end_count || 0,
      },
      selection_status: {
        waiting: selectionStatusCounts[0].waiting || 0,
        selection_date: selectionStatusCounts[0].selection_date || 0,
        delayed: selectionStatusCounts[0].delayed || 0,
        completed: selectionStatusCounts[0].completed || 0,
        selection_deadline: selectionStatusCounts[0].selection_deadline || 0,
      },
      region: regionCountsObj,
      category: categoryCountsObj,
      social: socialCounts,
    };
  } catch (e) {
    throw e;
  }
};