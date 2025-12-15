import pool from '../utils/pool.js';

/**
 * @function GetUserBlockClickByDate
 * @param {number} userId - 사용자 ID
 * @param {string} date - 기준 날짜 (YYYY-MM-DD)
 * @returns {Promise<object>}
 */
export const GetUserBlockClickByDate = async (userId, date) => {
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
        IFNULL(SUM(ubc.click), 0) AS click
      FROM DateRange dr
      LEFT JOIN (
        SELECT ubc.click, ubc.date
        FROM user_block_click ubc
        INNER JOIN user_block ub ON ubc.block_id = ub.id
        WHERE ub.user_id = ?
      ) AS ubc
      ON dr.date = ubc.date
      GROUP BY dr.date
      ORDER BY dr.date DESC;
    `, [date, date, userId]
    );

    return data;
  } catch (e) {
    throw e;
  }
};



/**
 * @function GetUserBlockClickRank
 * @param {object} txPool - 트랜잭션 풀
 * @param {object} params - 함수 파라미터
 * @returns {Promise<number>}
 */
export const GetUserBlockClickRank = async (userId, date) => {
  try {
    const [data] = await pool.query(
      `
      SELECT 
      ubc.block_id, 
      ubc.click,
      ub.block_type,
      ub.block_attr
      FROM user_block_click ubc
      INNER JOIN user_block ub ON ubc.block_id = ub.id
      WHERE ubc.date = ? AND ub.user_id = ?
      ORDER BY ubc.click DESC 
      LIMIT 10;
    `, [date, userId]
    );

    return data;
  } catch (e) {
    throw e;
  }
};














/**
 * @function UpdateUserBlockClick
 * @param {object} txPool - 트랜잭션 풀
 * @param {object} params - 함수 파라미터
 * @returns {Promise<number>}
 */
export const UpdateUserBlockClick = async (txPool, {
  blockId,
  today
}) => {
  try {
    const conn = txPool ?? pool;
    const [data] = await conn.query(
      `INSERT INTO user_block_click (block_id, date, click) 
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE click = click + 1`,
      [
        blockId, today
      ]
    );

    return data.insertId;
  } catch (e) {
    throw e;
  }
};