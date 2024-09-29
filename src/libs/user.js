import pool from '../utils/pool.js';

/**
 * @function GetUserOneByEmail
 * @param {obj}
 * @returns {Promise(obj | null)} user
 */
export const GetUserOneByEmail = async email => {
  try {
    const [user] = await pool.query(`SELECT id FROM user WHERE email = ?`, [email]);
    return user.length ? user[0] : null;
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
