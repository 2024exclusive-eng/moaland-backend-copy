import pool from '../utils/pool.js';

/**
 * @function InsertInquiry
 * @param {obj}
 * @returns {Promise(number)}
 */
export const InsertInquiry = async (txPool, { blockId, title, contents, name, lineId, agreementMarketing }) => {
  try {
    const conn = txPool ?? pool;

    const [data] = await conn.query(
      `INSERT INTO user_inquiry (user_block_id, title, contents, name, line_id, agreement_marketing) VALUE (?, ?, ?, ?, ?, ?)`,
      [blockId, title, contents, name, lineId, agreementMarketing]
    );
    return data.insertId;
  } catch (e) {
    throw e;
  }
};

/**
 * @function GetInquiryList
 * @param {obj}
 * @returns {Promise(number)}
 */
export const GetInquiryList = async (userId, page, item) => {
  try {
    const itemsPerPage = Number(item ? item : 30);
    const currentPage = page ? parseInt(page) : 1;
    const offset = (currentPage - 1) * itemsPerPage;

    // 전체 문의 수 조회
    const [totalResult] = await pool.query(
      `SELECT COUNT(user_inquiry.id) AS total
      FROM user_inquiry
      INNER JOIN user_block ON user_inquiry.user_block_id = user_block.id
      WHERE user_block.user_id = ?`,
      [userId]
    );
    const totalItems = totalResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // 문의 리스트 조회
    const [data] = await pool.query(
      `SELECT user_inquiry.id, user_inquiry.title, user_inquiry.contents, user_inquiry.name, user_inquiry.line_id, user_inquiry.user_block_id
       FROM user_inquiry
       INNER JOIN user_block ON user_inquiry.user_block_id = user_block.id
       WHERE user_block.user_id = ?
       ORDER BY user_inquiry.id DESC
       LIMIT ? OFFSET ?`,
      [userId, itemsPerPage, offset]
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
 * @function DeleteInquiry
 * @param {object} param
 * @returns {Promise<number>}
 */
export const DeleteInquiry = async (txPool, { userId, inquiryId }) => {
  try {
    const conn = txPool ?? pool;

    const [result] = await conn.query(
      `DELETE user_inquiry
       FROM user_inquiry
       INNER JOIN user_block ON user_inquiry.user_block_id = user_block.id
       WHERE user_inquiry.id = ? AND user_block.user_id = ?`,
      [inquiryId, userId]
    );

    return result.affectedRows;
  } catch (e) {
    throw e;
  }
};