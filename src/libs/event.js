import pool from '../utils/pool.js';

/**
 * @function GetEventList
 * @param {obj} filters - page, item, is_active
 * @returns {Promise([obj] | null)} {data, paging}
 */
export const GetEventList = async filters => {
  try {
    const itemsPerPage = Number(filters?.item ? filters.item : 30);
    const currentPage = filters?.page ? parseInt(filters.page) : 1;
    const offset = (currentPage - 1) * itemsPerPage;

    let query = `SELECT id, name, thumbnail_path AS thumbnailPath, link, is_active AS isActive, created, updated FROM event`;
    const queryParams = [];
    const conditions = [];

    // is_active filter
    if (filters.is_active) {
      conditions.push('is_active = ?');
      queryParams.push(filters.is_active);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created DESC LIMIT ? OFFSET ?';
    queryParams.push(itemsPerPage, offset);

    // Count query
    let countQuery = 'SELECT COUNT(id) AS total FROM event';
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
 * @function GetEventById
 * @param {number} id
 * @returns {Promise(obj | null)}
 */
export const GetEventById = async id => {
  try {
    const [data] = await pool.query(
      `SELECT id, name, thumbnail_path AS thumbnailPath, link, is_active AS isActive, created, updated FROM event WHERE id = ?`,
      [id],
    );

    return data.length ? data[0] : null;
  } catch (e) {
    throw e;
  }
};

/**
 * @function InsertEvent
 * @param {string} name
 * @param {string} thumbnailPath
 * @param {string} link
 * @returns {Promise(insertId)}
 */
export const InsertEvent = async (name, thumbnailPath, link) => {
  try {
    const [result] = await pool.query(`INSERT INTO event (name, thumbnail_path, link) VALUES (?, ?, ?)`, [
      name,
      thumbnailPath,
      link,
    ]);

    return result.insertId;
  } catch (e) {
    throw e;
  }
};

/**
 * @function ModifyEvent
 * @param {number} id
 * @param {string} name
 * @param {string} thumbnailPath
 * @param {string} link
 * @param {string} isActive
 * @returns {Promise(affectedRows)}
 */
export const ModifyEvent = async (id, name, thumbnailPath, link, isActive) => {
  try {
    const [result] = await pool.query(
      `UPDATE event SET name = ?, thumbnail_path = ?, link = ?, is_active = ? WHERE id = ?`,
      [name, thumbnailPath, link, isActive, id],
    );

    return result.affectedRows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function DeleteEvent
 * @param {number} id
 * @returns {Promise(affectedRows)}
 */
export const DeleteEvent = async id => {
  try {
    const [result] = await pool.query(`DELETE FROM event WHERE id = ?`, [id]);

    return result.affectedRows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function ToggleEventActive
 * @param {number} id
 * @param {string} isActive - 'Y' or 'N'
 * @returns {Promise(affectedRows)}
 */
export const ToggleEventActive = async (id, isActive) => {
  try {
    const [result] = await pool.query(`UPDATE event SET is_active = ? WHERE id = ?`, [isActive, id]);

    return result.affectedRows;
  } catch (e) {
    throw e;
  }
};
