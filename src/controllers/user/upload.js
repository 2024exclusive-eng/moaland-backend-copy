import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import { uploadS3 } from '../../utils/s3.js';

/**
 * @function UploadImage
 * @description 업로드 이미지
 * @param {string} req.query.folder - 업로드할 폴더명 (default: "user")
 * @returns {obj}
 */
export const UploadUserImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(200).json({ success: false, error: EC('NEED_IMAGE') });

    const folder = req?.query?.folder || "user";
    const s3Info = await uploadS3(req.file, folder);
    return res.status(200).json({ success: true, data: { uri: s3Info.uri, key: s3Info.key } });
  } catch (e) {
    return next(e);
  }
};

