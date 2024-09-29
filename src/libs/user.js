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
    const [user] = await pool.query(`SELECT id, email, link FROM user WHERE id = ?`, [userId]);
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
export const UpdateUserPassword = async (txPool, { email, password }) => {
  try {
    const conn = txPool ?? pool;
    const [data] = await conn.query(`UPDATE user SET password = ? WHERE email = ?`, [password, email]);
    return data.affectedRows;
  } catch (e) {
    throw e;
  }
};
