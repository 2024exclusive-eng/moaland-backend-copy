import pool from '../../utils/pool.js';
import * as jwt from '../../utils/jwt.js';
import * as oauth from '../../utils/oauth.js';
import { getRandomString } from '../../utils/common.js';
import EC from '../../utils/error.js';

/**
 * @function Login
 * @description 사용자 로그인
 * @returns {obj}
 */
export const Login = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function Join
 * @description 사용자 회원가입
 * @returns {obj}
 */
export const Join = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function VerifyEmail
 * @description 이메일 인증코드 전송
 * @returns {obj}
 */
export const VerifyEmail = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function VerifyEmailCheck
 * @description 이메일 인증코드 확인
 * @returns {obj}
 */
export const VerifyEmailCheck = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function SetLink
 * @description 링크 주소 설정
 * @returns {obj}
 */
export const SetLink = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function VerifyEmailForFindpw
 * @description 비밀번호 변경 이메일 인증코드 전송
 * @returns {obj}
 */
export const VerifyEmailForFindpw = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function VerifyEmailCheckForFindpw
 * @description 비밀번호 변경 이메일 인증코드 확인
 * @returns {obj}
 */
export const VerifyEmailCheckForFindpw = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function FindPw
 * @description 비밀번호 변경(비밀번호찾기 시)
 * @returns {obj}
 */
export const FindPw = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function ChangeAccount
 * @description 계좌정보 변경
 * @returns {obj}
 */
export const ChangeAccount = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function ChangePw
 * @description 비밀번호 변경(비밀번호변경 시)
 * @returns {obj}
 */
export const ChangePw = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function Secession
 * @description 회원 탈퇴
 * @returns {obj}
 */
export const Secession = async (req, res, next) => {
  try {

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};
