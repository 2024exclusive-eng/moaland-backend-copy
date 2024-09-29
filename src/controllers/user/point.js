import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';

/**
 * @function GetPoint
 * @description 포인트 내역 조회
 * @returns {obj}
 */
export const GetPoint = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function WithdrawalPoint
 * @description 포인트 출금 신청
 * @returns {obj}
 */
export const WithdrawalPoint = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};
