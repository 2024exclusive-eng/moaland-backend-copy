import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';

/**
 * @function GetProfileForLink
 * @description 프로필 조회 (링크 조회)
 * @returns {obj}
 */
export const GetProfileForLink = async (req, res, next) => {
  try {

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

    return res.status(200).json({ success: true });
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


