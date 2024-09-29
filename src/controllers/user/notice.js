import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';

/**
 * @function GetNotice
 * @description 공지사항 조회
 * @returns {obj}
 */
export const GetNotice = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};
