import pool from '../utils/pool.js';

/**
 * @function InsertUserProfile
 * @param {object} txPool - 트랜잭션 풀
 * @param {object} params - 함수 파라미터
 * @param {number} params.userId - 생성된 사용자의 ID
 * @returns {Promise<number>}
 */
export const InsertUserProfile = async (txPool, { userId }) => {
  try {
    const conn = txPool ?? pool;

    const [data] = await conn.query(
      `INSERT INTO user_profile (user_id) VALUES (?)`,
      [userId]
    );

    return data.insertId;
  } catch (e) {
    throw e;
  }
};