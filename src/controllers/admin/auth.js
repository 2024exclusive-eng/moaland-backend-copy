import * as jwt from '../../utils/jwt.js';
import * as Admin from '../../libs/admin.js';
import bcrypt from "bcryptjs";
import EC from '../../utils/error.js';

/**
 * @function Login
 * @description 사용자 로그인
 * @returns {obj}
 */
export const Login = async (req, res, next) => {
  try {
    const { admin, pw } = req.body;

    console.log(bcrypt.hashSync(pw, 10));

    // 사용자 확인
    const user = await Admin.GetAdminOneById(admin);
    if (!user || !bcrypt.compareSync(pw, user.pw))
      return res.status(200).json({ success: false, error: EC('ADMIN_AUTH_NOT_MATCH_INFO') });

    delete user.pw

    // 토큰 생성
    const accessToken = await jwt.sign(
      {
        service: "ADMIN",
        tokenType: "ACCESSTOKEN",
        id: user.id,
      }
    );

    return res.status(200).json({
      success: true,
      userInfo: user,
      accessToken
    });

  } catch (e) {
    return next(e);
  }
};