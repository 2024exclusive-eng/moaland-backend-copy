import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';

/**
 * @function PostInquiry
 * @description 문의하기
 * @returns {obj}
 */
export const PostInquiry = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetInquiry
 * @description 문의 리스트 조회
 * @returns {obj}
 */
export const GetInquiry = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetInquiryDetail
 * @description 문의 리스트 상세조회
 * @returns {obj}
 */
export const GetInquiryDetail = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};
