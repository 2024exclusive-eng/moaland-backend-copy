import pool from '../../utils/pool.js';
import * as jwt from '../../utils/jwt.js';
import * as oauth from '../../utils/oauth.js';
import * as User from '../../libs/user.js';
import * as UserProfile from '../../libs/userProfile.js';
import bcrypt from "bcryptjs";
import EC from '../../utils/error.js';
import { getRandomString, isEmpty } from '../../utils/common.js';
import { SendVerificationCode, VerifyVerificationCode } from '../../utils/mailgun.js';
import axios from 'axios';

const LINE_CLIENT_ID = "2006628274";
const LINE_CLIENT_SECRET = "b487c9e56b9aa886bfb27bab77bca4bf";

/**
 * @function Login
 * @description 사용자 로그인
 * @returns {obj}
 */
export const Login = async (req, res, next) => {
  let conn = null;
  try {
    // const { type } = req.query;
    const { email, password, lineAccessToken, type } = req.body;

    if (type === 'line') {
      // 라인 로그인 진행
      const profileResponse = await axios.get('https://api.line.me/v2/profile', {
        headers: {
          Authorization: `Bearer ${lineAccessToken}`,
        },
      });
      console.log(profileResponse);
      const { userId } = profileResponse.data;
      const user = await User.GetUserOneByOauthId('LINE', userId);

      if (!user) {
        // 트랜젝션 시작
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 사용자 생성
        const newUserId = await User.InsertUserForOauth(conn, { oauthType: 'LINE', oauthId: userId });

        // 사용자 프로필 생성
        await UserProfile.InsertUserProfile(conn, { userId: newUserId });

        // 토큰 생성
        const accessToken = await jwt.sign(
          {
            service: "USER",
            tokenType: "ACCESSTOKEN",
            id: newUserId,
          }
        );
        await conn.commit();

        return res.status(200).json({
          success: true,
          userInfo: {
            id: newUserId, email, link: null
          },
          accessToken
        });
      }

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
    if (conn) await conn.rollback();
    return next(e);
  } finally {
    if (conn) conn.release();
  }
};

/**
 * @function Join
 * @description 사용자 회원가입
 * @returns {obj}
 */
export const Join = async (req, res, next) => {
  let conn = null;
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


      // 트랜젝션 시작
      conn = await pool.getConnection();
      await conn.beginTransaction();

      // 사용자 생성
      const newUserId = await User.InsertUserForEmail(conn, { email, password: bcrypt.hashSync(password, 10) })

      // 사용자 프로필 생성
      await UserProfile.InsertUserProfile(conn, { userId: newUserId });

      // 토큰 생성
      const accessToken = await jwt.sign(
        {
          service: "USER",
          tokenType: "ACCESSTOKEN",
          id: newUserId,
        }
      );
      await conn.commit();

      return res.status(200).json({
        success: true,
        userInfo: {
          id: newUserId, email, link: null
        },
        accessToken
      });
    }
    return res.status(200).json({ success: true });
  } catch (e) {
    if (conn) await conn.rollback();
    return next(e);
  } finally {
    if (conn) conn.release();
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
  let conn = null;
  try {
    const userId = req.decoded.id;
    const { link } = req.body;

    // 링크 입력 확인
    if (isEmpty(link)) return res.status(200).json({ success: false, error: EC('NEED_LINK') });

    // 링크 중복 확인
    const existUser = await User.GetUserOneByLink(link);
    if (existUser) return res.status(200).json({ success: false, error: EC('DUPLICATED_LINK') });

    // 트랜젝션 시작
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await User.UpdateUserLink(conn, { userId, link })

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
    await User.UpdateUserPasswordByEmail(null, { email, password: bcrypt.hashSync(password, 10) })

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
    let conn = null;
    try {
      const userId = req.decoded.id;
      const { account, depositor } = req.body;

      // 계좌 & 예금주 입력 확인
      if (isEmpty(account)) return res.status(200).json({ success: false, error: EC('NEED_ACCOUNT') });
      if (isEmpty(depositor)) return res.status(200).json({ success: false, error: EC('NEED_DEPOSITOR') });

      // 트랜젝션 시작
      conn = await pool.getConnection();
      await conn.beginTransaction();

      await User.UpdateUserAccount(conn, { userId, account, depositor })

      // 트랜젝션 커밋
      await conn.commit();
      return res.status(200).json({ success: true });
    } catch (e) {
      if (conn) await conn.rollback();
      return next(e);
    } finally {
      if (conn) conn.release();
    }
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
  let conn = null;
  try {
    const userId = req.decoded.id;
    const { password } = req.body;

    // 비밀번호 입력 확인
    if (isEmpty(password)) return res.status(200).json({ success: false, error: EC('NEED_PASSWORD') });

    // 트랜젝션 시작
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await User.UpdateUserPassword(conn, { userId, password: bcrypt.hashSync(password, 10) })

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
 * @function Secession
 * @description 회원 탈퇴
 * @returns {obj}
 */
export const Secession = async (req, res, next) => {
  try {
    const userId = req.decoded.id;

    await User.DeleteUser(null, { userId });

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};
