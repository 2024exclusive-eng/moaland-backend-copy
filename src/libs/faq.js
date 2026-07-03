import pool from '../utils/pool.js';

/**
 * @function GetFaqList
 * @param {obj} filters - type, page, item, is_active, title
 * @returns {Promise([obj] | null)} {data, paging}
 */
export const GetFaqList = async filters => {
  try {
    const itemsPerPage = Number(filters?.item ? filters.item : 30);
    const currentPage = filters?.page ? parseInt(filters.page) : 1;
    const offset = (currentPage - 1) * itemsPerPage;

    let query = `SELECT id, type, title, title_cn AS titleCn, answer, answer_cn AS answerCn, display_order AS displayOrder, is_active AS isActive, created, updated FROM faq`;
    const queryParams = [];
    const conditions = [];

    // type filter (faq | service_guide | terms_of_use | privacy_policy)
    if (filters.type) {
      conditions.push('type = ?');
      queryParams.push(filters.type);
    }

    // is_active filter
    if (filters.is_active) {
      conditions.push('is_active = ?');
      queryParams.push(filters.is_active);
    }

    // title search filter
    if (filters.title) {
      conditions.push('title LIKE ?');
      queryParams.push(`%${filters.title}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY display_order ASC, id ASC LIMIT ? OFFSET ?';
    queryParams.push(itemsPerPage, offset);

    // Count query
    let countQuery = 'SELECT COUNT(id) AS total FROM faq';
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
 * @function GetFaqById
 * @param {number} id
 * @returns {Promise(obj | null)}
 */
export const GetFaqById = async id => {
  try {
    const [data] = await pool.query(
      `SELECT id, type, title, title_cn AS titleCn, answer, answer_cn AS answerCn, display_order AS displayOrder, is_active AS isActive, created, updated FROM faq WHERE id = ?`,
      [id],
    );

    return data.length ? data[0] : null;
  } catch (e) {
    throw e;
  }
};

/**
 * @function InsertFaq
 * @param {string} type
 * @param {string} title
 * @param {string} answer
 * @param {number} displayOrder
 * @returns {Promise(insertId)}
 */
export const InsertFaq = async (type, title, titleCn, answer, answerCn, displayOrder = 0) => {
  try {
    const [result] = await pool.query(`INSERT INTO faq (type, title, title_cn, answer, answer_cn, display_order) VALUES (?, ?, ?, ?, ?, ?)`, [
      type,
      title,
      titleCn || null,
      answer,
      answerCn || null,
      displayOrder,
    ]);

    return result.insertId;
  } catch (e) {
    throw e;
  }
};

/**
 * @function ModifyFaq
 * @param {number} id
 * @param {string} type
 * @param {string} title
 * @param {string} answer
 * @param {number} displayOrder
 * @param {string} isActive
 * @returns {Promise(affectedRows)}
 */
export const ModifyFaq = async (id, type, title, titleCn, answer, answerCn, displayOrder, isActive) => {
  try {
    const [result] = await pool.query(
      `UPDATE faq SET type = ?, title = ?, title_cn = ?, answer = ?, answer_cn = ?, display_order = ?, is_active = ? WHERE id = ?`,
      [type, title, titleCn || null, answer, answerCn || null, displayOrder, isActive, id],
    );

    return result.affectedRows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function DeleteFaq
 * @param {number} id
 * @returns {Promise(affectedRows)}
 */
export const DeleteFaq = async id => {
  try {
    const [result] = await pool.query(`DELETE FROM faq WHERE id = ?`, [id]);

    return result.affectedRows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function ToggleFaqActive
 * @param {number} id
 * @param {string} isActive - 'Y' or 'N'
 * @returns {Promise(affectedRows)}
 */
export const ToggleFaqActive = async (id, isActive) => {
  try {
    const [result] = await pool.query(`UPDATE faq SET is_active = ? WHERE id = ?`, [isActive, id]);

    return result.affectedRows;
  } catch (e) {
    throw e;
  }
};
