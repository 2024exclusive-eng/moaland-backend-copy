import pool from '../utils/pool.js';

/**
 * @function GetAdminOneById
 * @param {obj}
 * @returns {Promise(obj | null)} user
 */
export const GetAdminOneById = async admin => {
  try {
    const [user] = await pool.query(`SELECT id, admin, pw, name FROM admin WHERE admin = ?`, [admin]);
    return user.length ? user[0] : null;
  } catch (e) {
    throw e;
  }
};