import pool from '../utils/pool.js';

/**
 * @function UpdateUserStatisticsViews
 * @param {object} txPool - 트랜잭션 풀
 * @param {object} params - 함수 파라미터
 * @returns {Promise<number>}
 */
export const UpdateUserStatisticsViews = async (txPool, {
  userId,
  today
}) => {
  try {
    const conn = txPool ?? pool;
    const [data] = await conn.query(
      `INSERT INTO user_statistics (user_id, date, views) 
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE views = views + 1`,
      [
        userId, today
      ]
    );

    return data.insertId;
  } catch (e) {
    throw e;
  }
};

/**
 * @function GetUserStatisticsByDate
 * @param {number} userId - 사용자 ID
 * @param {string} date - 기준 날짜 (YYYY-MM-DD)
 * @returns {Promise<object>}
 */
export const GetUserStatisticsByDate = async (userId, date) => {
  try {
    const [data] = await pool.query(
      `
      WITH RECURSIVE DateRange AS (
        SELECT ? AS date
        UNION ALL
        SELECT date - INTERVAL 1 DAY
        FROM DateRange
        WHERE date > ? - INTERVAL 10 DAY
      )
      SELECT 
        dr.date,
        IFNULL(SUM(us.views), 0) AS views
      FROM DateRange dr
      LEFT JOIN user_statistics us ON dr.date = us.date AND us.user_id = ?
      GROUP BY dr.date
      ORDER BY dr.date DESC;
    `, [date, date, userId]
    );

    return data;
  } catch (e) {
    throw e;
  }
};
