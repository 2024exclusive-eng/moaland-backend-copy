import pool from '../utils/pool.js';

/**
 * @function GetBannerList
 * @param {obj} filters - type, page, item
 * @returns {Promise([obj] | null)} {data, paging}
 */
export const GetBannerList = async filters => {
  try {
    const itemsPerPage = Number(filters?.item ? filters.item : 30);
    const currentPage = filters?.page ? parseInt(filters.page) : 1;
    const offset = (currentPage - 1) * itemsPerPage;

    let query = `SELECT id, type, name, thumbnail_path AS thumbnailPath, link, is_active AS isActive, created, updated FROM banner`;
    const queryParams = [];
    const conditions = [];

    // type filter (home | right_banner)
    if (filters.type) {
      conditions.push('type = ?');
      queryParams.push(filters.type);
    }

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
    let countQuery = 'SELECT COUNT(id) AS total FROM banner';
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
 * @function GetBannerById
 * @param {number} id
 * @returns {Promise(obj | null)}
 */
export const GetBannerById = async id => {
  try {
    const [data] = await pool.query(
      `SELECT id, type, name, thumbnail_path AS thumbnailPath, link, is_active AS isActive, created, updated FROM banner WHERE id = ?`,
      [id],
    );

    return data.length ? data[0] : null;
  } catch (e) {
    throw e;
  }
};

/**
 * @function InsertBanner
 * @param {string} type
 * @param {string} name
 * @param {string} thumbnailPath
 * @param {string} link
 * @returns {Promise(insertId)}
 */
export const InsertBanner = async (type, name, thumbnailPath, link) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO banner (type, name, thumbnail_path, link) VALUES (?, ?, ?, ?)`,
      [type, name, thumbnailPath, link],
    );

    return result.insertId;
  } catch (e) {
    throw e;
  }
};

/**
 * @function ModifyBanner
 * @param {number} id
 * @param {string} type
 * @param {string} name
 * @param {string} thumbnailPath
 * @param {string} link
 * @param {string} isActive
 * @returns {Promise(affectedRows)}
 */
export const ModifyBanner = async (id, type, name, thumbnailPath, link, isActive) => {
  try {
    const [result] = await pool.query(
      `UPDATE banner SET type = ?, name = ?, thumbnail_path = ?, link = ?, is_active = ? WHERE id = ?`,
      [type, name, thumbnailPath, link, isActive, id],
    );

    return result.affectedRows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function DeleteBanner
 * @param {number} id
 * @returns {Promise(affectedRows)}
 */
export const DeleteBanner = async id => {
  try {
    const [result] = await pool.query(`DELETE FROM banner WHERE id = ?`, [id]);

    return result.affectedRows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function ToggleBannerActive
 * @param {number} id
 * @param {string} isActive - 'Y' or 'N'
 * @returns {Promise(affectedRows)}
 */
export const ToggleBannerActive = async (id, isActive) => {
  try {
    const [result] = await pool.query(`UPDATE banner SET is_active = ? WHERE id = ?`, [isActive, id]);

    return result.affectedRows;
  } catch (e) {
    throw e;
  }
};
