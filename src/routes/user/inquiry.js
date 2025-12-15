import { Router } from 'express';
import { LoginCheck } from '../../middlewares/auth.js';
import * as inquiry from '../../controllers/user/inquiry.js';

const router = Router();

router.post('/', inquiry.PostInquiry); // 문의하기
router.get('/', LoginCheck, inquiry.GetInquiry); // 문의 리스트 조회
router.delete('/:id', LoginCheck, inquiry.DeleteInquiry); // 문의 삭제

export default router;
