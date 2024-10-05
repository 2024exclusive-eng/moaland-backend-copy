import pool from '../utils/pool.js';

/**
 * @function GetUserBlock
 * @param {object} txPool - 트랜잭션 풀
 * @param {object} params - 함수 파라미터
 * @param {number} params.userId - 생성된 사용자의 ID
 * @returns {Promise<number>}
 */
export const GetUserBlock = async (userId) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id,
        block_type AS blockType,
        block_attr AS blockAttr
       FROM user_block
       WHERE user_id = ? AND is_display = 'Y'
       ORDER BY block_order`,
      [userId]
    );

    return rows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function GetUserBlockForMyProfile
 * @param {object} txPool - 트랜잭션 풀
 * @param {object} params - 함수 파라미터
 * @param {number} params.userId - 생성된 사용자의 ID
 * @returns {Promise<number>}
 */
export const GetUserBlockForMyProfile = async (userId) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id,
        block_type AS blockType,
        block_attr AS blockAttr,
        is_display AS isDisplay
       FROM user_block
       WHERE user_id = ?
       ORDER BY block_order`,
      [userId]
    );

    return rows;
  } catch (e) {
    throw e;
  }
};
