import pool from '../utils/pool.js';

/**
 * @function GetNotice
 * @param {obj} filters - page, item, title
 * @returns {Promise([obj] | null)} {noticeData, Paging}
 */
export const GetNotice = async filters => {
  try {
    const itemsPerPage = Number(filters?.item ? filters.item : 30);
    const currentPage = filters?.page ? parseInt(filters.page) : 1;
    const offset = (currentPage - 1) * itemsPerPage;

    let query = `SELECT notice.id, notice.title, notice.contents, notice.created FROM notice`;
    const queryParams = [];
    const conditions = [];

    // title search filter
    if (filters?.title) {
      conditions.push('title LIKE ?');
      queryParams.push(`%${filters.title}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    queryParams.push(itemsPerPage, offset);

    // Count query
    let countQuery = 'SELECT COUNT(id) AS total FROM notice';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const [totalResult] = await pool.query(countQuery, queryParams.slice(0, queryParams.length - 2));
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