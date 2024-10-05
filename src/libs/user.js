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
