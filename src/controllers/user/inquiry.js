import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import * as UserInquiry from '../../libs/userInquiry.js';
import { isEmpty } from '../../utils/common.js';


/**
 * @function PostInquiry
 * @description 문의하기
 * @returns {obj}
 */
export const PostInquiry = async (req, res, next) => {
  try {
    const { blockId, title, contents, name, lineId, agreementMarketing } = req.body;

    // 유효성 검사
    if (isEmpty(blockId)) return res.status(200).json({ success: false, error: EC('NEED_INQUIRY_BLOCK_ID') });
    if (isEmpty(title)) return res.status(200).json({ success: false, error: EC('NEED_INQUIRY_TITLE') });
    if (isEmpty(contents)) return res.status(200).json({ success: false, error: EC('NEED_INQUIRY_CONTENTS') });
    if (isEmpty(name)) return res.status(200).json({ success: false, error: EC('NEED_INQUIRY_NAME') });
    if (isEmpty(lineId)) return res.status(200).json({ success: false, error: EC('NEED_INQUIRY_LINE_ID') });

    // 문의 데이터 삽입
    await UserInquiry.InsertInquiry(null, { blockId, title, contents, name, lineId, agreementMarketing: agreementMarketing === "Y" ? "Y" : "N" })

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
    const userId = req.decoded.id;
    const { page, item } = req.query;

    const data = await UserInquiry.GetInquiryList(userId, page, item);

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function DeleteInquiry
 * @description 문의 삭제
 * @returns {obj}
 */
export const DeleteInquiry = async (req, res, next) => {
  try {
    const userId = req.decoded.id;
    const { id } = req.params;

    await UserInquiry.DeleteInquiry(null, { userId, inquiryId: id })

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};
