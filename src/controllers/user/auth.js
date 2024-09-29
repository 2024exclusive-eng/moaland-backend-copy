import pool from '../../utils/pool.js';
import * as jwt from '../../utils/jwt.js';
import * as oauth from '../../utils/oauth.js';
import * as User from '../../libs/user.js';
import bcrypt from "bcryptjs";
import EC from '../../utils/error.js';
import { getRandomString, isEmpty } from '../../utils/common.js';
import { SendVerificationCode, VerifyVerificationCode } from '../../utils/mailgun.js';

/**
 * @function Login
 * @description 사용자 로그인
 * @returns {obj}
 */
export const Login = async (req, res, next) => {
  try {
    const { type } = req.query;
    const { email, password } = req.body;

    if (type === 'line') {
      // 라인 로그인 진행

    } else {
      // 사용자 확인
      const user = await User.GetUserOneByEmail(email);
      if (!user || !bcrypt.compareSync(password, user.password))
        return res.status(200).json({ success: false, error: EC('NOT_MATCH_LOGIN_INFO') });

      delete user.password

      // 토큰 생성
      const accessToken = await jwt.sign(
        {
          service: "USER",
          tokenType: "ACCESSTOKEN",
          id: user.id,
        }
      );

      return res.status(200).json({
        success: true,
        userInfo: user,
        accessToken
      });
    }
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
    const { type } = req.query;
    const { verify, code, email, password } = req.body;

    if (type === 'line') {
      // 라인 로그인 진행

    } else {
      // 비밀번호 입력 확인
      if (isEmpty(password)) return res.status(200).json({ success: false, error: EC('NEED_PASSWORD') });

      // 사용자 확인
      const verified = await VerifyVerificationCode(verify, code, email);
      if (verified) return res.status(200).json({ success: false, error: verified });

      // 사용자 생성
      const newUserId = await User.InsertUserForEmail(null, { email, password: bcrypt.hashSync(password, 10) })
      const user = await User.GetUserOneByUserId(newUserId);

      // 토큰 생성
      const accessToken = await jwt.sign(
        {
          service: "USER",
          tokenType: "ACCESSTOKEN",
          id: user.id,
        }
      );

      return res.status(200).json({
        success: true,
        userInfo: user,
        accessToken
      });
    }
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
    const { email } = req.body;

    const existUser = await User.GetUserOneByEmail(email);
    if (existUser) return res.status(200).json({ success: false, error: EC('DUPLICATED_EMAIL') });
    const verify = await SendVerificationCode(email);

    return res.status(200).json({ success: true, verify });
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
    const { verify, code, email } = req.body;

    const verified = await VerifyVerificationCode(verify, code, email);
    if (verified) return res.status(200).json({ success: false, error: verified });

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
    const { email } = req.body;

    const existUser = await User.GetUserOneByEmail(email);
    if (!existUser) return res.status(200).json({ success: false, error: EC('NO_USER_BY_EMAIL') });
    const verify = await SendVerificationCode(email);

    return res.status(200).json({ success: true, verify });
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
    const { verify, code, email } = req.body;

    const verified = await VerifyVerificationCode(verify, code, email);
    if (verified) return res.status(200).json({ success: false, error: verified });

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
    const { verify, code, email, password } = req.body;

    // 비밀번호 입력 확인
    if (isEmpty(password)) return res.status(200).json({ success: false, error: EC('NEED_PASSWORD') });

    // 메일 인증 확인
    const verified = await VerifyVerificationCode(verify, code, email);
    if (verified) return res.status(200).json({ success: false, error: verified });

    // 비밀번호 변경
    await User.UpdateUserPassword(null, { email, password: bcrypt.hashSync(password, 10) })

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
