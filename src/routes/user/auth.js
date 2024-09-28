import { Router } from "express";
import { LoginCheck } from "../../middlewares/auth.js";
import * as auth from "../../controllers/user/auth.js";

const router = Router();

router.post("/login/:type", auth.Login); // 사용자 로그인
router.post("/join/:type", auth.Join); // 사용자 회원가입
router.post("/email/verify", auth.VerifyEmail); // 이메일 인증코드 전송
router.post("/email/verify/check", auth.VerifyEmailCheck); // 이메일 인증코드 확인
router.post("/link", LoginCheck, auth.SetLink); // 링크 주소 설정
router.post("/findpw/email/verify", auth.VerifyEmailForFindpw); // 비밀번호 변경 이메일 인증코드 전송
router.post("/findpw/email/verify/check", auth.VerifyEmailCheckForFindpw); // 비밀번호 변경 이메일 인증코드 확인
router.put("/findpw", auth.FindPw); // 비밀번호 변경(비밀번호찾기 시)
router.put("/account", LoginCheck, auth.ChangeAccount); // 계좌정보 변경
router.put("/changepw", LoginCheck, auth.ChangePw); // 비밀번호 변경(비밀번호변경 시)
router.delete("/secession", LoginCheck, auth.Secession); // 회원 탈퇴

export default router;