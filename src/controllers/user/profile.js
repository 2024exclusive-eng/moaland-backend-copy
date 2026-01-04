import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import { isEmpty } from '../../utils/common.js';
import * as UserProfile from '../../libs/userProfile.js';
import * as UserBlock from '../../libs/userBlock.js';
import * as UserStatistics from '../../libs/userStatistics.js';
import * as UserBlockClock from '../../libs/userBlockClick.js';
import * as User from '../../libs/user.js';
import moment from 'moment';

/**
 * @function GetProfileForLink
 * @description 프로필 조회 (링크 조회)
 * @returns {obj}
 */
export const GetProfileForLink = async (req, res, next) => {
  try {
    const { link } = req.params

    const user = await User.GetUserOneByLink(link);
    const userId = user ? user.id : -1;

    const profile = await UserProfile.GetUserProfile(userId);
    const block = await UserBlock.GetUserBlock(userId);

    if (userId != -1)
      await UserStatistics.UpdateUserStatisticsViews(null, { userId, today: moment().format('YYYY-MM-DD') })

    return res.status(200).json({ success: true, profile, block });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function ClickProfileBlock
 * @description 프로필 블럭 클릭
 * @returns {obj}
 */
export const ClickProfileBlock = async (req, res, next) => {
  try {
    const { block } = req.params;

    await UserBlockClock.UpdateUserBlockClick(null, { blockId: block, today: moment().format('YYYY-MM-DD') });

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetMyProfile
 * @description 프로필 조회 (내 정보 조회)
 * @returns {obj}
 */
export const GetMyProfile = async (req, res, next) => {
  try {
    const userId = req.decoded.id;

    const profile = await UserProfile.GetUserProfile(userId);
    const block = await UserBlock.GetUserBlockForMyProfile(userId);
    const my = await User.GetUserOneByUserId(userId);

    return res.status(200).json({ success: true, profile, block, my });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function ModifyMyProfile
 * @description 프로필 수정
 * @returns {obj}
 */
export const ModifyMyProfile = async (req, res, next) => {
  try {
    const userId = req.decoded.id;
    const { name,
      description,
      layout,
      profileImg,
      profileBackgroundImage,
      isButton,
      buttonText,
      buttonUrl,
      email
    } = req.body;

    // 유효성 검사
    // if (isEmpty(name)) return res.status(200).json({ success: false, error: EC('NEED_TITLE') });

    // if (layout === 'LAYOUT_BASIC' || layout === 'LAYOUT_BLUR') {
    //   if (isEmpty(profileImg)) return res.status(200).json({ success: false, error: EC('NEED_PROFILE_IMAGE') });
    // }

    // if (layout === 'LAYOUT_BLUR' || layout === 'LAYOUT_BLUR_NONE_PROFILE') {
    //   if (isEmpty(profileBackgroundImage)) return res.status(200).json({ success: false, error: EC('NEED_PROFILE_BACKGROUND_IMAGE') });
    // }

    // if (isButton === 'Y') {
    //   if (isEmpty(buttonText)) return res.status(200).json({ success: false, error: EC('NEED_PROFILE_BUTTON_TEXT') });
    //   if (isEmpty(buttonUrl)) return res.status(200).json({ success: false, error: EC('NEED_PROFILE_BUTTON_URL') });
    // }

    // 이메일 변경 시 중복 확인
    if (!isEmpty(email)) {
      const existingUser = await User.GetUserOneByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(200).json({ success: false, error: EC('DUPLICATED_EMAIL') });
      }
      await User.UpdateUserEmail(null, { userId, email });
    }

    // 프로필 업데이트
    await UserProfile.UpdateUserProfile(null, {
      userId,
      name,
      description: description ? description : null,
      layout: isEmpty(layout) ? 'COLOLAYOUT_BASICR' : layout,
      profileImg: profileImg ? profileImg : null,
      profileBackgroundImage: profileBackgroundImage ? profileBackgroundImage : null,
      isButton: isButton ?? "N",
      buttonText: buttonText ?? null,
      buttonUrl: buttonUrl ?? null,
    })

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function ModifyMyProfileDesign
 * @description 프로필 디자인 수정
 * @returns {obj}
 */
export const ModifyMyProfileDesign = async (req, res, next) => {
  try {
    const userId = req.decoded.id;
    const {
      backgroundType,
      backgroundImg,
      backgroundColor,
      effect,
      blockBackgroundColor,
      blockTextFont,
      blockLayout
    } = req.body;

    // 유효성 검사
    if (isEmpty(backgroundType)) return res.status(200).json({ success: false, error: EC('NEED_DESIGN_BACKGROUND_TYPE') });

    if (backgroundType === 'IMGAGE' && isEmpty(backgroundImg)) {
      return res.status(200).json({ success: false, error: EC('NEED_DESIGN_BACKGROUND_IMAGE') });
    }

    if (backgroundType === 'COLOR' && isEmpty(backgroundColor)) {
      return res.status(200).json({ success: false, error: EC('NEED_DESIGN_BACKGROUND_COLOR') });
    }

    if (isEmpty(blockBackgroundColor)) return res.status(200).json({ success: false, error: EC('NEED_DESIGN_BLOCK_BACKGROUND_COLOR') });
    if (isEmpty(blockTextFont)) return res.status(200).json({ success: false, error: EC('NEED_DESIGN_BLOCK_TEXT_FONT') });

    // 프로필 디자인 업데이트
    await UserProfile.UpdateUserProfileDesign(null, {
      userId,
      backgroundType: isEmpty(backgroundType) ? 'COLOR' : backgroundType,
      backgroundImg: backgroundImg ?? null,
      backgroundColor: backgroundColor ?? null,
      effect: effect ?? null,
      blockBackgroundColor: blockBackgroundColor ?? null,
      blockTextFont: blockTextFont ?? null,
      blockLayout: isEmpty(blockLayout) ? 'LAYOUT_CIRCLE' : blockLayout
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function ModifyMyProfileBlock
 * @description 프로필 블럭 수정
 * @returns {obj}
 */
export const ModifyMyProfileBlock = async (req, res, next) => {
  let conn = null;
  try {
    let index = 0;
    const userId = req.decoded.id;
    const { block } = req.body;

    // 트랜젝션 시작
    conn = await pool.getConnection();
    await conn.beginTransaction();

    for (const item of block) {
      let error = null;
      if (item?.blockType === "LINK") {
        error = VerifyLinkBlock(item?.blockAttr);
      } else if (item?.blockType === "TEXT") {
        error = VerifyTextBlock(item?.blockAttr);
      } else if (item?.blockType === "IMAGE") {
        error = VerifyImageBlock(item?.blockAttr);
      } else if (item?.blockType === "VIDEO") {
        error = VerifyVideoBlock(item?.blockAttr);
      } else if (item?.blockType === "DIVIDER") {
        error = VerifyDividerBlock(item?.blockAttr);
      } else if (item?.blockType === "CALENDAR") {
        error = VerifyCalendarBlock(item?.blockAttr);
      } else if (item?.blockType === "MAP") {
        error = VerifyMapBlock(item?.blockAttr);
      } else if (item?.blockType === "SNS") {
        error = VerifySnsBlock(item?.blockAttr);
      } else if (item?.blockType === "INQUIRY") {
        error = VerifyInquiryBlock(item?.blockAttr);
      }
      // 이슈 발생 시
      if (error) {
        if (conn) await conn.rollback();
        return res.status(200).json({ success: false, index, error });
      }
      // 이슈 없으면 저장
      const isDisplay = item?.isDisplay ?? 'Y';
      const blockType = item?.blockType;
      const blockAttr = JSON.stringify(item?.blockAttr);

      if (item?.id) {
        // id가 있으면 기존 블록 수정
        await UserBlock.UpdateUserBlock(conn, {
          userId,
          blockId: item.id,
          isDisplay,
          blockType,
          blockOrder: index,
          blockAttr
        });
      } else {
        // id가 없으면 새로운 블록 삽입
        await UserBlock.InsertUserBlock(conn, {
          userId,
          isDisplay,
          blockType,
          blockOrder: index,
          blockAttr
        });
      }

      index++;
    }


    // 트랜젝션 커밋
    await conn.commit();
    return res.status(200).json({ success: true });
  } catch (e) {
    if (conn) await conn.rollback();
    return next(e);
  } finally {
    if (conn) conn.release();
  }
};

/**
 * @function DeleteMyProfileBlock
 * @description 프로필 블럭 삭제
 * @returns {obj}
 */
export const DeleteMyProfileBlock = async (req, res, next) => {
  try {
    const userId = req.decoded.id;
    const { block } = req.params;

    await UserBlock.DeleteUserBlock(null, { userId, blockId: block });

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};


/**
 * 블록 Verify Functions
 */

// 링크블록
const VerifyLinkBlock = (attr) => {
  if (!attr?.link) return EC('NEED_BLOCK_LINK_LINK');
  if (!attr?.title) return EC('NEED_BLOCK_LINK_TITLE');
  if (!attr?.layout) return EC('NEED_BLOCK_LINK_LAYOUT');
  if ((attr?.layout === 'LAYOUT_IMAGE' || attr?.layout === 'LAYOUT_THUBMAIL') && !attr?.image)
    return EC('NEED_BLOCK_LINK_IMAGE');
  return null;
}
// 텍스트블록
const VerifyTextBlock = (attr) => {
  if (!attr?.title) return EC('NEED_BLOCK_TEXT_TITLE');
  if (!attr?.align) return EC('NEED_BLOCK_TEXT_ALIGN');
  return null;
}
// 이미지블록
const VerifyImageBlock = (attr) => {
  if (!attr?.images || !Array.isArray(attr.images) || attr.images.length === 0)
    return EC('NEED_BLOCK_IMAGE_LIST');
  if (!attr?.layout) return EC('NEED_BLOCK_IMAGE_LAYOUT');
  return null;
}
// 비디오블록
const VerifyVideoBlock = (attr) => {
  if (!attr?.url) return EC('NEED_BLOCK_VIDEO_URL');
  return null;
}
// 구분블록
const VerifyDividerBlock = (attr) => {
  if (!attr?.type) return EC('NEED_BLOCK_DIVIDER_TYPE');
  if (!attr?.margin) return EC('NEED_BLOCK_DIVIDER_MARGIN');
  return null;
}
// 캘린더블록
const VerifyCalendarBlock = (attr) => {
  if (!attr?.schedules || !Array.isArray(attr.schedules) || attr.schedules.length === 0)
    return EC('NEED_BLOCK_SCHEDULE_LIST');
  for (const schedule of attr.schedules) {
    if (!schedule?.title) return EC('NEED_BLOCK_SCHEDULE_TITLE');
    if (!schedule?.startDate) return EC('NEED_BLOCK_SCHEDULE_START_DATE');
    if (!schedule?.endDate) return EC('NEED_BLOCK_SCHEDULE_END_DATE');
  }
  return null;
}
// 지도블록
const VerifyMapBlock = (attr) => {
  if (!attr?.address) return EC('NEED_BLOCK_MAP_ADDRESS');
  if (!attr?.latitude) return EC('NEED_BLOCK_MAP_LATITUDE');
  if (!attr?.longitude) return EC('NEED_BLOCK_MAP_LONGITUDE');
  return null;
}
// 소셜블록
const VerifySnsBlock = (attr) => {
  if (!attr?.sns || !Array.isArray(attr.sns) || attr.sns.length === 0)
    return EC('NEED_BLOCK_SNS_LIST');
  for (const sns of attr.sns) {
    if (!sns?.link) return EC('NEED_BLOCK_SNS_LINK');
    if (!sns?.title) return EC('NEED_BLOCK_SNS_TITLE');
  }
  if (!attr?.layout) return EC('NEED_BLOCK_SNS_LAYOUT');
  return null;
}
// 문의블록
const VerifyInquiryBlock = (attr) => {
  if (!attr?.inquiry || !Array.isArray(attr.inquiry) || attr.inquiry.length === 0)
    return EC('NEED_BLOCK_INQUIRY_LIST');
  for (const inquiry of attr.inquiry) {
    if (!inquiry?.form) return EC('NEED_BLOCK_INQUIRY_FORM');
    if (!inquiry?.title) return EC('NEED_BLOCK_INQUIRY_TITLE');
  }
  return null;
}