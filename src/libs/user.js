import pool from '../utils/pool.js';

/**
 * @function GetUserOneByEmail
 * @param {obj}
 * @returns {Promise(obj | null)} user
 */
export const GetUserOneByEmail = async email => {
  try {
    const [user] = await pool.query(`SELECT id, email, link, password FROM user WHERE email = ?`, [email]);
    return user.length ? user[0] : null;
  } catch (e) {
    throw e;
  }
};


/**
 * @function GetUserOneByOauthId
 * @param {obj}
 * @returns {Promise(obj | null)} user
 */
export const GetUserOneByOauthId = async (type, oauthId) => {
  try {
    const [user] = await pool.query(`SELECT id, email, link, oauth_type AS oauthType, account, depositor FROM user WHERE oauth_type = ? AND oauth_id = ?`, [type, oauthId]);
    return user.length ? user[0] : null;
  } catch (e) {
    throw e;
  }
};

/**
 * @function GetUserList
 * @param {obj}
 * @returns {Promise(obj | null)} user
 */
export const GetUserList = async (paging, search) => {
  try {
    const itemsPerPage = Number(paging?.item ? paging.item : 30);
    const currentPage = paging?.page ? parseInt(paging.page) : 1;
    const offset = (currentPage - 1) * itemsPerPage;

    let query = `SELECT id, email, link, oauth_type AS oauthType, account, depositor FROM user`;
    let countQuery = `SELECT count(id) AS total FROM user`;
    let queryParams = [];
    let countParams = [];

    if (search) {
      query += ` WHERE email LIKE ? OR link LIKE ?`;
      countQuery += ` WHERE email LIKE ? OR link LIKE ?`;
      queryParams.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    queryParams.push(itemsPerPage, offset);
    
    const [totalResult] = await pool.query(countQuery, countParams);
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
 * @function GetUserOneById
 * @param {number} userId
 * @returns {Promise(obj | null)} user
 */
export const GetUserOneById = async id => {
  try {
    const [user] = await pool.query(
      `SELECT id, email, link, oauth_type AS oauthType, account, depositor, password, created, updated
       FROM user
       WHERE id = ?`,
      [id]
    );
    return user.length ? user[0] : null;
  } catch (e) {
    throw e;
  }
};

/**
 * @function GetUserOneByUserId
 * @param {obj}
 * @returns {Promise(obj | null)} user
 */
export const GetUserOneByUserId = async userId => {
  try {
    const [user] = await pool.query(`SELECT id, email, link, oauth_type AS oauthType, account, depositor FROM user WHERE id = ?`, [userId]);
    return user.length ? user[0] : null;
  } catch (e) {
    throw e;
  }
};

/**
 * @function GetUserOneByLink
 * @param {obj}
 * @returns {Promise(obj | null)} user
 */
export const GetUserOneByLink = async link => {
  try {
    const [user] = await pool.query(`SELECT id, email, link FROM user WHERE link = ?`, [link]);
    return user.length ? user[0] : null;
  } catch (e) {
    throw e;
  }
};

/**
 * @function InsertUserForEmail
 * @param {obj}
 * @returns {Promise(number)}
 */
export const InsertUserForEmail = async (txPool, { email, password }) => {
  try {
    const conn = txPool ?? pool;

    const [data] = await conn.query(
      `INSERT INTO user (email, password) VALUE (?, ?)`, [email, password]
    );
    return data.insertId;
  } catch (e) {
    throw e;
  }
};


/**
 * @function InsertUserForOauth
 * @param {obj}
 * @returns {Promise(number)}
 */
export const InsertUserForOauth = async (txPool, { oauthId, oauthType }) => {
  try {
    const conn = txPool ?? pool;

    const [data] = await conn.query(
      `INSERT INTO user (oauth_id, oauth_type) VALUE (?, ?)`, [oauthId, oauthType]
    );
    return data.insertId;
  } catch (e) {
    throw e;
  }
};


/**
 * @function UpdateUserPasswordByEmail
 * @param {obj}
 * @returns {Promise(number)}
 */
export const UpdateUserPasswordByEmail = async (txPool, { email, password }) => {
  try {
    const conn = txPool ?? pool;
    const [data] = await conn.query(`UPDATE user SET password = ? WHERE email = ?`, [password, email]);
    return data.affectedRows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function UpdateUserLink
 * @param {obj}
 * @returns {Promise(number)}
 */
export const UpdateUserLink = async (txPool, { userId, link }) => {
  try {
    const conn = txPool ?? pool;
    const [data] = await conn.query(`UPDATE user SET link = ? WHERE id = ?`, [link, userId]);
    return data.affectedRows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function UpdateUserAccount
 * @param {obj}
 * @returns {Promise(number)}
 */
export const UpdateUserAccount = async (txPool, { userId, account, depositor }) => {
  try {
    const conn = txPool ?? pool;
    const [data] = await conn.query(`UPDATE user SET account = ?, depositor = ? WHERE id = ?`, [account, depositor, userId]);
    return data.affectedRows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function UpdateUserPassword
 * @param {obj}
 * @returns {Promise(number)}
 */
export const UpdateUserPassword = async (txPool, { userId, password }) => {
  try {
    const conn = txPool ?? pool;
    const [data] = await conn.query(`UPDATE user SET password = ? WHERE id = ?`, [password, userId]);
    return data.affectedRows;
  } catch (e) {
    throw e;
  }
};

/**
 * @function DeleteUser
 * @param {object} param
 * @returns {Promise<number>}
 */
export const DeleteUser = async (txPool, { userId }) => {
  try {
    const conn = txPool ?? pool;

    const [data] = await conn.query(
      `UPDATE user
       SET
         email = CASE WHEN email IS NOT NULL THEN CONCAT('DELETE_', email) ELSE email END,
         oauth_id = CASE WHEN oauth_id IS NOT NULL THEN CONCAT('DELETE_', oauth_id) ELSE oauth_id END,
         link = CASE WHEN link IS NOT NULL THEN CONCAT('DELETE_', link) ELSE link END,
         is_delete = 'Y'
       WHERE id = ?`,
      [userId]
    );

    return data.affectedRows;
  } catch (e) {
    throw e;
  }
};
