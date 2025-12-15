import pool from '../../utils/pool.js';
import * as jwt from '../../utils/jwt.js';
import * as authService from '../../utils/oauth.js';
import * as User from '../../libs/user.js';
import * as UserInfo from '../../libs/userInfo.js';
import * as EventPoint from '../../libs/eventPoint.js';
import * as Config from '../../libs/config.js';
import { getRandomString } from '../../utils/common.js';
import EC from '../../utils/error.js';

/**
 * @function Login
 * @description 사용자 로그인 함수 (소셜 또는 지갑)
 * @returns {obj}
 */
export const Login = async (req, res, next) => {
  try {
    const { oauthCode, oauthType, address, message, signed } = req.body;
    const { type } = req.params;

    let user = null;

    if (type === 'social') {
      // 구글 oauth ID 조회
      const oauth = await authService.GetOauthId('GOOGLE', oauthCode);
      user = await User.GetUserOneBySocialId(oauth.id ?? '', oauthType);

      // 시용자가 없을 때
      if (!user)
        return res.status(200).json({
          success: false,
          error: EC('NO_USER'),
          id: oauth.id,
          email: oauth.email,
          type,
        });
    } else if (type === 'wallet') {
      if (await authService.VerifySigned(address, message, signed)) user = await User.GetUserOneByAddressId(address);

      // 시용자가 없을 때
      if (!user)
        return res.status(200).json({
          success: false,
          error: EC('NO_USER'),
          address,
          message,
          signed,
          type,
        });
    }

    // 토큰 생성
    const accessToken = await jwt.sign({ service: 'USER', tokenType: 'accessToken', id: user.id });

    return res.status(200).json({ success: true, accessToken });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function Join
 * @description 사용자 회원가입 함수 (소셜 또는 지갑)
 * @returns {obj}
 */
export const Join = async (req, res, next) => {
  let conn = null;
  try {
    const { oauthCode, oauthType, address, message, signed, nickname } = req.body;
    const { type } = req.params;
    const { referral } = req.query;

    const config = await Config.GetConfigList();

    // 닉네임 중복검사
    const existUser = await User.GetUserOneByNickname(nickname);
    if (existUser) return res.status(200).json({ success: false, error: EC('DUPLICATED_NICKNAME') });

    // 트랜젝션 시작
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 사용자 저장
    let clientId = 0;
    if (type === 'social') {
      const oauth = await authService.GetOauthId('GOOGLE', oauthCode);
      clientId = await User.InsertUserForSocial(conn, { oauthId: oauth.id, oauthType, nickname });
    } else if (type === 'wallet') {
      if (await authService.VerifySigned(address, message, signed)) {
        clientId = await User.InsertUserForWallet(conn, { address, nickname });
        await EventPoint.InsertPoint(conn, {
          userId: clientId,
          pointTypeCode: 'E0012',
          transactionType: 'deposit',
          point: parseInt(config.EVENT_WALLET_CONNECT_POINT),
        });
      }
    }

    // 레퍼럴 조회 및 코드생성 후 추가정보 저장
    const referralUser = referral ? await UserInfo.GetUserOneByReferralCode(referral) : null;
    const referralCode = getRandomString(10);
    await User.InsertUserInfo(conn, {
      id: clientId,
      referralUser: referralUser ? referralUser.user_id : null,
      referralCode,
    });

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
 * @function WalletConnect
 * @description 사용자 지갑연동 함수
 * @returns {obj}
 */
export const WalletConnect = async (req, res, next) => {
  let conn = null;

  try {
    const { address, message, signed } = req.body;
    const userId = req.decoded.id;
    console.log(address, message, signed);
    const config = await Config.GetConfigList();

    // 사용자 연결 확인
    const user = await User.GetUserOneByUserId(userId);
    if (user.address) return res.status(200).json({ success: false, error: EC('ALREADY_CONNECTED') });

    // 주소 중복검사
    const existUser = await User.GetUserOneByAddress(address);
    if (existUser) return res.status(200).json({ success: false, error: EC('DUPLICATED_ADDRESS') });

    // 트랜젝션 시작
    conn = await pool.getConnection();
    await conn.beginTransaction();

    if (await authService.VerifySigned(address, message, signed)) {
      await User.UpdateUserAddress(conn, { id: userId, address });

      await EventPoint.InsertPoint(conn, {
        userId,
        pointTypeCode: 'E0012',
        transactionType: 'deposit',
        point: parseInt(config.EVENT_WALLET_CONNECT_POINT),
      });
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
 * @function GetUserProfile
 * @description 사용자 프로필 내용 반환 함수
 * @returns {obj}
 */
export const GetUserProfile = async (req, res, next) => {
  try {
    const userId = req.decoded.id;
    const user = await User.GetUserOneByUserId(userId);

    if (user.profileImg) user.profileImg = `${process.env.CLOUD_FLARE_URL}/${user.profileImg}`;

    return res.status(200).json({ success: true, data: user });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function ModifyUserProfile
 * @description 사용자 프로필 내용 변경 함수
 * @returns {obj}
 */
export const ModifyUserProfile = async (req, res, next) => {
  try {
    // WIP - 기능 구현

    return res.status(200).json({ success: true });
  } catch (e) {
    return next(e);
  }
};
