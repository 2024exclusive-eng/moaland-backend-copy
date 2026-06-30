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
             mission.max_enroll AS maxEnroll,
             mission.point AS point,
             mission.mission_contents AS missionContent,
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

    // is_public 필터 (기본값: 공개된 미션만 조회)
    conditions.push('mission.is_public = 1');

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

    // deadline_days 필터 추가 (마감임박 캠페인)
    if (filters.deadline_days !== undefined) {
      const days = parseInt(filters.deadline_days);
      if (!isNaN(days) && days > 0) {
        conditions.push('mission.enroll_end_date >= UTC_TIMESTAMP()');
        conditions.push('mission.enroll_end_date <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY)');
        queryParams.push(days);
      }
    }

    // region 필터 추가
    if (filters.region) {
      conditions.push('mission.region = ?');
      queryParams.push(filters.region);
    }

    // search 필터 추가 (title, brand 검색)
    if (filters.search) {
      conditions.push('(mission.title LIKE ? OR mission.brand LIKE ?)');
      queryParams.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // 필터 조건이 있을 경우 WHERE 절 추가
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // 정렬 옵션
    if (filters.sort === 'deadline') {
      query += ' ORDER BY mission.enroll_end_date ASC';
    } else {
      query += ' ORDER BY mission.id DESC';
    }

    query += ' LIMIT ? OFFSET ?';
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
        additional_info, guideline, is_recommended, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        1
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
        WHERE select_date > UTC_TIMESTAMP()
      `;
    } else if (type === 'select') {
      query = `
        SELECT COUNT(*) AS count
        FROM mission
        WHERE select_date <= UTC_TIMESTAMP()
          AND mission_end_date > UTC_TIMESTAMP()
          AND (SELECT COUNT(*)
               FROM mission_enroll
               WHERE mission_enroll.mission_id = mission.id
                 AND (mission_enroll.status = 'select' OR mission_enroll.status = 'complete')) < mission.max_enroll
      `;
    } else if (type === 'selected') {
      query = `
        SELECT COUNT(*) AS count
        FROM mission
        WHERE select_date <= UTC_TIMESTAMP()
          AND mission_end_date <= UTC_TIMESTAMP()
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
        WHERE select_date <= UTC_TIMESTAMP()
          AND mission_end_date <= UTC_TIMESTAMP()
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

    // Create base query with computed status using cascading priority logic
    let query = `
      SELECT mission_with_status.*
      FROM (
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
               (SELECT COUNT(DISTINCT mission_enroll.id)
                FROM mission_enroll
                WHERE mission_enroll.mission_id = mission.id
                  AND (mission_enroll.status = 'selected' OR mission_enroll.status = 'completed')) AS selectedParticipantCount,
               (SELECT COUNT(DISTINCT mission_enroll.id)
                FROM mission_enroll
                WHERE mission_enroll.mission_id = mission.id
                  AND mission_enroll.status = 'applied') AS appliedParticipantCount,
               CASE
                 WHEN mission.enroll_start_date IS NOT NULL AND DATE(UTC_TIMESTAMP()) < DATE(mission.enroll_start_date) THEN 'opening_soon'
                 WHEN mission.enroll_start_date IS NOT NULL AND mission.enroll_end_date IS NOT NULL
                   AND DATE(UTC_TIMESTAMP()) >= DATE(mission.enroll_start_date)
                   AND DATE(UTC_TIMESTAMP()) <= DATE(mission.enroll_end_date) THEN 'applying'
                 WHEN mission.select_date IS NOT NULL AND DATE(UTC_TIMESTAMP()) = DATE(mission.select_date) THEN 'application_deadline'
                 WHEN mission.mission_start_date IS NOT NULL AND mission.mission_end_date IS NOT NULL
                   AND DATE(UTC_TIMESTAMP()) >= DATE(mission.mission_start_date)
                   AND DATE(UTC_TIMESTAMP()) <= DATE(mission.mission_end_date) THEN 'in_progress'
                 WHEN mission.content_start_date IS NOT NULL AND mission.content_end_date IS NOT NULL
                   AND DATE(UTC_TIMESTAMP()) >= DATE(mission.content_start_date)
                   AND DATE(UTC_TIMESTAMP()) <= DATE(mission.content_end_date) THEN 'registration_deadline'
                 WHEN mission.content_end_date IS NOT NULL AND mission.enroll_end_date IS NOT NULL
                   AND DATE(UTC_TIMESTAMP()) > DATE(mission.content_end_date)
                   AND DATE(UTC_TIMESTAMP()) > DATE(mission.enroll_end_date) THEN 'end'
                 ELSE 'opening_soon'
               END AS computed_status,
               CASE
                 WHEN (SELECT COUNT(*) FROM mission_enroll me
                        WHERE me.mission_id = mission.id
                          AND me.status IN ('selected','completed','rewarded')) = 0
                   THEN 'waiting'
                 WHEN (SELECT COUNT(*) FROM mission_enroll me
                        WHERE me.mission_id = mission.id
                          AND me.status = 'applied') = 0
                   THEN 'completed'
                 ELSE 'in_selection'
               END AS computed_selection_status
        FROM mission
      ) AS mission_with_status
    `;

    let countQuery = `
      SELECT COUNT(*) AS total
      FROM (
        SELECT mission.id AS missionId,
               mission.select_date AS selectDate,
               mission.content_end_date AS contentEndDate,
               CASE
                 WHEN mission.enroll_start_date IS NOT NULL AND DATE(UTC_TIMESTAMP()) < DATE(mission.enroll_start_date) THEN 'opening_soon'
                 WHEN mission.enroll_start_date IS NOT NULL AND mission.enroll_end_date IS NOT NULL
                   AND DATE(UTC_TIMESTAMP()) >= DATE(mission.enroll_start_date)
                   AND DATE(UTC_TIMESTAMP()) <= DATE(mission.enroll_end_date) THEN 'applying'
                 WHEN mission.select_date IS NOT NULL AND DATE(UTC_TIMESTAMP()) = DATE(mission.select_date) THEN 'application_deadline'
                 WHEN mission.mission_start_date IS NOT NULL AND mission.mission_end_date IS NOT NULL
                   AND DATE(UTC_TIMESTAMP()) >= DATE(mission.mission_start_date)
                   AND DATE(UTC_TIMESTAMP()) <= DATE(mission.mission_end_date) THEN 'in_progress'
                 WHEN mission.content_start_date IS NOT NULL AND mission.content_end_date IS NOT NULL
                   AND DATE(UTC_TIMESTAMP()) >= DATE(mission.content_start_date)
                   AND DATE(UTC_TIMESTAMP()) <= DATE(mission.content_end_date) THEN 'registration_deadline'
                 WHEN mission.content_end_date IS NOT NULL AND mission.enroll_end_date IS NOT NULL
                   AND DATE(UTC_TIMESTAMP()) > DATE(mission.content_end_date)
                   AND DATE(UTC_TIMESTAMP()) > DATE(mission.enroll_end_date) THEN 'end'
                 ELSE 'opening_soon'
               END AS computed_status,
               CASE
                 WHEN (SELECT COUNT(*) FROM mission_enroll me
                        WHERE me.mission_id = mission.id
                          AND me.status IN ('selected','completed','rewarded')) = 0
                   THEN 'waiting'
                 WHEN (SELECT COUNT(*) FROM mission_enroll me
                        WHERE me.mission_id = mission.id
                          AND me.status = 'applied') = 0
                   THEN 'completed'
                 ELSE 'in_selection'
               END AS computed_selection_status,
               mission.category AS category,
               mission.social AS social,
               mission.region AS region,
               mission.title AS title,
               mission.brand AS brand,
               mission.is_recommended AS isRecommended
        FROM mission
      ) AS mission_with_status
    `;

    const conditions = [];
    const queryParams = [];
    const countParams = [];

    // Status filter (Mission lifecycle) - using computed status
    if (filters.status) {
      const statuses = filters.status.split(',').map(s => s.trim());
      const placeholders = statuses.map(() => '?').join(',');
      conditions.push(`mission_with_status.computed_status IN (${placeholders})`);
      queryParams.push(...statuses);
      countParams.push(...statuses);
    }

    // Selection status filter - using computed selection status
    if (filters.selection_status) {
      const selectionStatuses = filters.selection_status.split(',').map(s => s.trim());
      const placeholders = selectionStatuses.map(() => '?').join(',');
      conditions.push(`mission_with_status.computed_selection_status IN (${placeholders})`);
      queryParams.push(...selectionStatuses);
      countParams.push(...selectionStatuses);
    }

    // Region filter (simple IN clause)
    if (filters.region) {
      const regions = filters.region.split(',').map(r => r.trim());
      const placeholders = regions.map(() => '?').join(',');
      conditions.push(`mission_with_status.region IN (${placeholders})`);
      queryParams.push(...regions);
      countParams.push(...regions);
    }

    // Category filter (simple IN clause)
    if (filters.category) {
      const categories = filters.category.split(',').map(c => c.trim());
      const placeholders = categories.map(() => '?').join(',');
      conditions.push(`mission_with_status.category IN (${placeholders})`);
      queryParams.push(...categories);
      countParams.push(...categories);
    }

    // Social filter (FIND_IN_SET for comma-separated values in DB)
    if (filters.social) {
      const socials = filters.social.split(',').map(s => s.trim());
      const socialConditions = socials.map(() => 'FIND_IN_SET(?, mission_with_status.social) > 0');
      conditions.push(`(${socialConditions.join(' OR ')})`);
      queryParams.push(...socials);
      countParams.push(...socials);
    }

    // Search filter
    if (filters.search) {
      conditions.push('(mission_with_status.title LIKE ? OR mission_with_status.brand LIKE ?)');
      queryParams.push(`%${filters.search}%`, `%${filters.search}%`);
      countParams.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.is_recommended !== undefined) {
      conditions.push('mission_with_status.isRecommended = ?');
      const isRecommended = filters.is_recommended === 'true' || filters.is_recommended === true ? 1 : 0;
      queryParams.push(isRecommended);
      countParams.push(isRecommended)
    }

    // Apply conditions
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY mission_with_status.missionId DESC LIMIT ? OFFSET ?';
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
 * Admin Flow Mapping (independent counts - missions can be counted in multiple categories):
 * - totalMissions: Total number of all missions
 * - mustSelectToday: "Application deadline" - missions where select_date is TODAY
 * - delayedEnrollments: Missions past select_date, before content deadline, with no participants selected yet
 * - inProgress: "In Progress" + "Registration Deadline" - missions during mission/content periods (excluding enrollment period)
 *
 * Note: Counts are independent. A mission can be counted in both 'delayed' AND 'inProgress'.
 */
export const GetMissionStatistics = async () => {
  try {
    // Separate queries for safety and clarity - independent counts (no cascading)
    const [totalMissionsResult] = await pool.query(`
      SELECT COUNT(*) as count
      FROM mission
    `);

    const [mustSelectTodayResult] = await pool.query(`
      SELECT COUNT(*) as count
      FROM (
        SELECT
          CASE
            WHEN select_date IS NOT NULL AND DATE(UTC_TIMESTAMP()) = DATE(select_date) THEN 'mustSelectToday'
            ELSE 'other'
          END AS admin_status
        FROM mission
      ) AS mission_statuses
      WHERE admin_status = 'mustSelectToday'
    `);

    const [delayedResult] = await pool.query(`
      SELECT COUNT(*) as count
      FROM mission
      WHERE select_date IS NOT NULL AND content_end_date IS NOT NULL
        AND DATE(UTC_TIMESTAMP()) > DATE(select_date)
        AND DATE(UTC_TIMESTAMP()) <= DATE(content_end_date)
        AND (SELECT COUNT(*)
             FROM mission_enroll
             WHERE mission_enroll.mission_id = mission.id
               AND mission_enroll.status = 'selected') = 0
    `);

    const [inProgressResult] = await pool.query(`
      SELECT COUNT(*) as count
      FROM mission
      WHERE (enroll_start_date IS NULL OR enroll_end_date IS NULL
            OR DATE(UTC_TIMESTAMP()) NOT BETWEEN DATE(enroll_start_date) AND DATE(enroll_end_date))
        AND ((mission_start_date IS NOT NULL AND mission_end_date IS NOT NULL
              AND DATE(UTC_TIMESTAMP()) >= DATE(mission_start_date)
              AND DATE(UTC_TIMESTAMP()) <= DATE(mission_end_date))
          OR (content_start_date IS NOT NULL AND content_end_date IS NOT NULL
              AND DATE(UTC_TIMESTAMP()) >= DATE(content_start_date)
              AND DATE(UTC_TIMESTAMP()) <= DATE(content_end_date)))
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
    // Status counts - mirroring frontend cascading priority logic
    const [statusCounts] = await pool.query(`
      SELECT
        SUM(CASE WHEN status = 'opening_soon' THEN 1 ELSE 0 END) AS opening_soon,
        SUM(CASE WHEN status = 'applying' THEN 1 ELSE 0 END) AS applying,
        SUM(CASE WHEN status = 'application_deadline' THEN 1 ELSE 0 END) AS application_deadline,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN status = 'registration_deadline' THEN 1 ELSE 0 END) AS registration_deadline,
        SUM(CASE WHEN status = 'end_count' THEN 1 ELSE 0 END) AS end_count
      FROM (
        SELECT
          CASE
            -- Priority 1: 오픈예정 (Opening Soon)
            WHEN enroll_start_date IS NOT NULL AND DATE(UTC_TIMESTAMP()) < DATE(enroll_start_date) THEN 'opening_soon'

            -- Priority 2: 신청중 (Applying)
            WHEN enroll_start_date IS NOT NULL AND enroll_end_date IS NOT NULL
              AND DATE(UTC_TIMESTAMP()) >= DATE(enroll_start_date)
              AND DATE(UTC_TIMESTAMP()) <= DATE(enroll_end_date) THEN 'applying'

            -- Priority 3: 신청마감 (Application Deadline)
            WHEN select_date IS NOT NULL AND DATE(UTC_TIMESTAMP()) = DATE(select_date) THEN 'application_deadline'

            -- Priority 4: 진행중 (In Progress)
            WHEN mission_start_date IS NOT NULL AND mission_end_date IS NOT NULL
              AND DATE(UTC_TIMESTAMP()) >= DATE(mission_start_date)
              AND DATE(UTC_TIMESTAMP()) <= DATE(mission_end_date) THEN 'in_progress'

            -- Priority 5: 등록마감 (Registration Deadline)
            WHEN content_start_date IS NOT NULL AND content_end_date IS NOT NULL
              AND DATE(UTC_TIMESTAMP()) >= DATE(content_start_date)
              AND DATE(UTC_TIMESTAMP()) <= DATE(content_end_date) THEN 'registration_deadline'

            -- Priority 6: 종료 (Ended)
            WHEN content_end_date IS NOT NULL AND enroll_end_date IS NOT NULL
              AND DATE(UTC_TIMESTAMP()) > DATE(content_end_date)
              AND DATE(UTC_TIMESTAMP()) > DATE(enroll_end_date) THEN 'end_count'

            -- Default: 오픈예정 (Opening Soon)
            ELSE 'opening_soon'
          END AS status
        FROM mission
      ) AS mission_statuses
    `);

    // Selection status counts - based on applicant selection headcount
    const [selectionStatusCounts] = await pool.query(`
      SELECT
        SUM(CASE WHEN selection_status = 'waiting' THEN 1 ELSE 0 END) AS waiting,
        SUM(CASE WHEN selection_status = 'in_selection' THEN 1 ELSE 0 END) AS in_selection,
        SUM(CASE WHEN selection_status = 'completed' THEN 1 ELSE 0 END) AS completed
      FROM (
        SELECT
          CASE
            WHEN (SELECT COUNT(*) FROM mission_enroll me
                   WHERE me.mission_id = mission.id
                     AND me.status IN ('selected','completed','rewarded')) = 0
              THEN 'waiting'
            WHEN (SELECT COUNT(*) FROM mission_enroll me
                   WHERE me.mission_id = mission.id
                     AND me.status = 'applied') = 0
              THEN 'completed'
            ELSE 'in_selection'
          END AS selection_status
        FROM mission
      ) AS mission_selection_statuses
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
        in_selection: selectionStatusCounts[0].in_selection || 0,
        completed: selectionStatusCounts[0].completed || 0,
      },
      region: regionCountsObj,
      category: categoryCountsObj,
      social: socialCounts,
    };
  } catch (e) {
    throw e;
  }
};