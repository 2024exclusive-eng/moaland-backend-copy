import { Router } from 'express';
import { LoginCheck } from '../../middlewares/auth.js';
import * as profile from '../../controllers/user/profile.js';

const router = Router();

router.get('/link/:link', profile.GetProfileForLink); // 프로필 조회 (링크 조회)
router.get('/', LoginCheck, profile.GetMyProfile); // 프로필 조회 (내 정보 조회)
router.put('/', LoginCheck, profile.ModifyMyProfile); // 프로필 수정
router.put('/design', LoginCheck, profile.ModifyMyProfileDesign); // 프로필 디자인 수정
router.put('/block', LoginCheck, profile.ModifyMyProfileBlock); // 프로필 블럭 수정
router.delete('/block', LoginCheck, profile.DeleteMyProfileBlock); // 프로필 블럭 삭제

export default router;
