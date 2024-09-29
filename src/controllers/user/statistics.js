import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';

/**
 * @function GetStatistics
 * @description 사용자 분석 조회
 * @returns {obj}
 */
export const GetStatistics = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};
