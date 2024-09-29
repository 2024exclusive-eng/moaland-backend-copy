import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';

/**
 * @function UploadImage
 * @description 업로드 이미지
 * @returns {obj}
 */
export const UploadImage = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};
