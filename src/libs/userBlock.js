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

/**
 * @function UpdateUserBlock
 * @param {object} txPool - 트랜잭션 풀
 * @param {object} params - 함수 파라미터
 * @param {number} params.userId - 사용자 ID
 * @param {number} params.blockId - 수정할 블록의 ID
 * @param {string} params.isDisplay - 블록의 표시 여부
 * @param {string} params.blockType - 블록의 타입
 * @param {number} params.blockOrder - 블록의 순서
 * @param {object} params.blockAttr - 블록의 속성 (JSON 형식)
 * @returns {Promise<number>} - 수정된 행 수 반환
 */
export const UpdateUserBlock = async (txPool, { userId, blockId, isDisplay, blockType, blockOrder, blockAttr }) => {
  try {
    const conn = txPool ?? pool;

    const [data] = await conn.query(
      `UPDATE user_block
       SET is_display = ?, block_type = ?, block_order = ?, block_attr = ?
       WHERE id = ? AND user_id = ?`,
      [isDisplay, blockType, blockOrder, blockAttr, blockId, userId]
    );

    return data.affectedRows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function InsertUserBlock
 * @param {object} txPool - 트랜잭션 풀
 * @param {object} params - 함수 파라미터
 * @param {number} params.userId - 사용자 ID
 * @param {string} params.isDisplay - 블록의 표시 여부
 * @param {string} params.blockType - 블록의 타입
 * @param {number} params.blockOrder - 블록의 순서
 * @param {object} params.blockAttr - 블록의 속성 (JSON 형식)
 * @returns {Promise<number>} - 삽입된 블록의 ID 반환
 */
export const InsertUserBlock = async (txPool, { userId, isDisplay, blockType, blockOrder, blockAttr }) => {
  try {
    const conn = txPool ?? pool;

    const [data] = await conn.query(
      `INSERT INTO user_block (user_id, is_display, block_type, block_order, block_attr)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, isDisplay, blockType, blockOrder, blockAttr]
    );

    return data.insertId;
  } catch (e) {
    throw e;
  }
};
