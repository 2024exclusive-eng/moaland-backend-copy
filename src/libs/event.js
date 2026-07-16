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

    let query = `SELECT id, name, thumbnail_path AS thumbnailPath, link, link_type AS linkType, \`order\`, contents, contents_cn AS contentsCn, is_active AS isActive, created, updated FROM event`;
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

    query += ' ORDER BY `order` ASC, id ASC LIMIT ? OFFSET ?';
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
      `SELECT id, name, thumbnail_path AS thumbnailPath, link, link_type AS linkType, \`order\`, contents, contents_cn AS contentsCn, is_active AS isActive, created, updated FROM event WHERE id = ?`,
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
export const InsertEvent = async (name, thumbnailPath, link, linkType = 'url', contents = null, contentsCn = null, order = 0) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO event (name, thumbnail_path, link, link_type, contents, contents_cn, \`order\`) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, thumbnailPath, link, linkType, contents, contentsCn, order],
    );

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
export const ModifyEvent = async (id, name, thumbnailPath, link, isActive, linkType = 'url', contents = null, contentsCn = null) => {
  try {
    const [result] = await pool.query(
      `UPDATE event SET name = ?, thumbnail_path = ?, link = ?, is_active = ?, link_type = ?, contents = ?, contents_cn = ? WHERE id = ?`,
      [name, thumbnailPath, link, isActive, linkType, contents, contentsCn, id],
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

/**
 * @function ReorderEvents
 * @param {Array} eventOrders - Array of {id, order} objects
 * @returns {Promise(boolean)}
 */
export const ReorderEvents = async eventOrders => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const event of eventOrders) {
      await conn.query(`UPDATE event SET \`order\` = ? WHERE id = ?`, [event.order, event.id]);
    }

    await conn.commit();
    return true;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

/**
 * @function GetNextOrder
 * @returns {Promise(number)} Next available order
 */
export const GetNextOrder = async () => {
  try {
    const [result] = await pool.query(`SELECT COALESCE(MAX(\`order\`), 0) + 1 AS nextOrder FROM event`);

    return result[0].nextOrder;
  } catch (e) {
    throw e;
  }
};
