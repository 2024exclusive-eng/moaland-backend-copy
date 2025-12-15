import pool from '../utils/pool.js';

/**
 * @function GetNotice
 * @param {obj}
 * @returns {Promise([obj] | null)} {noticeData, Paging}
 */
export const GetNotice = async paging => {
  try {
    const itemsPerPage = Number(paging?.item ? paging.item : 30);
    const currentPage = paging?.page ? parseInt(paging.page) : 1;
    const offset = (currentPage - 1) * itemsPerPage;

    const [totalResult] = await pool.query(`SELECT count(id) AS total FROM notice`);
    const totalItems = totalResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const [data] = await pool.query(
      `SELECT notice.id, notice.title, notice.contents, notice.created FROM notice
      ORDER BY id DESC LIMIT ? OFFSET ?`,
      [itemsPerPage, offset],
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
 * @function GetNoticeById
 * @param {number} id
 * @returns {Promise(obj | null)}
 */
export const GetNoticeById = async id => {
  try {
    const [data] = await pool.query(`SELECT id, title, contents, created FROM notice WHERE id = ?`, [id]);
   
    return data.length ? data[0] : null;
  } catch (e) {
    throw e;
  }
};

/**
 * @function ModifyNotice
 * @param {obj}
 * @returns {Promise([obj] | null)}
 */
export const ModifyNotice = async (id, title, contents) => {
  try {
    const data = await pool.query(`UPDATE notice SET title = ?, contents = ? WHERE id = ?`, [title, contents, id]);

    return data.affectedRows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function InsertNotice
 * @param {obj}
 * @returns {Promise([obj] | null)}
 */
export const InsertNotice = async (title, contents) => {
  try {
    const data = await pool.query(`INSERT INTO notice (title, contents) VALUES (?, ?)`, [title, contents]);

    return data.insertId;
  } catch (e) {
    throw e;
  }
};

/**
 * @function DeleteNotice
 * @param {number} id
 * @returns {Promise(number | null)}
 */
export const DeleteNotice = async id => {
  try {
    const data = await pool.query(`DELETE FROM notice WHERE id = ?`, [id]);

    return data.affectedRows;
  } catch (e) {
    throw e;
  }
};