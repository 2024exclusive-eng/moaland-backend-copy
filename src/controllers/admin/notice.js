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
    const { page, item, title } = req.query;
    const data = await Notice.GetNotice({ page, item, title });

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetNoticeById
 * @description 공지사항 ID로 조회
 * @returns {obj}
 */
export const GetNoticeById = async (req, res, next) => {
  try {
    console.log("testsett")
    const { id } = req.params;
    const data = await Notice.GetNoticeById(id);
    console.log(data)
    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function PostNotice
 * @description 공지사항 생성 또는 수정
 * @returns {obj}
 */
export const PostNotice = async (req, res, next) => {
  try {
    const { id, title, contents } = req.body;
    
    if (id) {
      await Notice.ModifyNotice(id, title, contents);
    } else {
      await Notice.InsertNotice(title, contents);
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function DeleteNotice
 * @description 공지사항 삭제
 * @returns {obj}
 */
export const DeleteNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notice.DeleteNotice(id);

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};