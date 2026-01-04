import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import * as Notice from '../../libs/notice.js';

/**
 * @function GetNotice
 * @description 공지사항 조회
 * @returns {obj}
 */
export const GetNotice = async (req, res, next) => {
  try {
    const { page, item } = req.query;
    const data = await Notice.GetNotice({ page, item });

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetNoticeById
 * @description Get notice details by ID
 * @returns {obj}
 */
export const GetNoticeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Notice.GetNoticeById(id);

    if (!data) {
      throw { status: 404, code: EC.NOT_FOUND, message: 'Notice not found' };
    }

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};
