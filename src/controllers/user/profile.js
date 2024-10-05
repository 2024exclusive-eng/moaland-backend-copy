import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import { isEmpty } from '../../utils/common.js';
import * as UserProfile from '../../libs/userProfile.js';
import * as UserBlock from '../../libs/userBlock.js';
import * as User from '../../libs/user.js';

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

    return res.status(200).json({ success: true, profile, block });
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
    const { name, description, layout, profileImg, profileBackgroundImage } = req.body;

    // 유효성 검사
    if (isEmpty(name)) return res.status(200).json({ success: false, error: EC('NEED_TITLE') });

    if (layout === 'LAYOUT_BASIC' || layout === 'LAYOUT_BLUR') {
      if (isEmpty(profileImg)) return res.status(200).json({ success: false, error: EC('NEED_PROFILE_IMAGE') });
    }

    if (layout === 'LAYOUT_BLUR' || layout === 'LAYOUT_BLUR_NONE_PROFILE') {
      if (isEmpty(profileBackgroundImage)) return res.status(200).json({ success: false, error: EC('NEED_PROFILE_BACKGROUND_IMAGE') });
    }

    // 프로필 업데이트
    await UserProfile.UpdateUserProfile(null, {
      userId,
      name,
      description: description ? description : null,
      layout: isEmpty(layout) ? 'COLOLAYOUT_BASICR' : layout,
      profileImg: profileImg ? profileImg : null,
      profileBackgroundImage: profileBackgroundImage ? profileBackgroundImage : null,
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
      isButton,
      buttonText,
      buttonBackgroundColor,
      buttonTextColor,
      buttonTextFont,
      buttonLayout
    } = req.body;

    // 유효성 검사
    if (isEmpty(backgroundType)) return res.status(200).json({ success: false, error: EC('NEED_DESIGN_BACKGROUND_TYPE') });

    if (backgroundType === 'IMGAGE' && isEmpty(backgroundImg)) {
      return res.status(200).json({ success: false, error: EC('NEED_DESIGN_BACKGROUND_IMAGE') });
    }

    if (backgroundType === 'COLOR' && isEmpty(backgroundColor)) {
      return res.status(200).json({ success: false, error: EC('NEED_DESIGN_BACKGROUND_COLOR') });
    }

    if (isButton === 'Y') {
      if (isEmpty(buttonText)) return res.status(200).json({ success: false, error: EC('NEED_DESIGN_BUTTON_TEXT') });
      if (isEmpty(buttonBackgroundColor)) return res.status(200).json({ success: false, error: EC('NEED_DESIGN_BUTTON_BACKGROUND_COLOR') });
      if (isEmpty(buttonTextColor)) return res.status(200).json({ success: false, error: EC('NEED_DESIGN_BUTTON_TEXT_COLOR') });
      if (isEmpty(buttonTextFont)) return res.status(200).json({ success: false, error: EC('NEED_DESIGN_BUTTON_TEXT_FONT') });
    }

    // 프로필 디자인 업데이트
    await UserProfile.UpdateUserProfileDesign(null, {
      userId,
      backgroundType: isEmpty(backgroundType) ? 'COLOR' : backgroundType,
      backgroundImg: backgroundImg ?? null,
      backgroundColor: backgroundColor ?? null,
      effect: effect ?? null,
      isButton: isButton ?? 'Y',
      buttonText: buttonText ?? null,
      buttonBackgroundColor: buttonBackgroundColor ?? null,
      buttonTextColor: buttonTextColor ?? null,
      buttonTextFont: buttonTextFont ?? null,
      buttonLayout: isEmpty(buttonLayout) ? 'LAYOUT_CIRCLE' : buttonLayout
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
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function DeleteMyProfileBlock
 * @description 프로필 블럭 삭제
 * @returns {obj}
 */
export const DeleteMyProfileBlock = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};




