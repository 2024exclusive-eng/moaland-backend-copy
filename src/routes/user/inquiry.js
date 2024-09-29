import { Router } from 'express';
import { LoginCheck } from '../../middlewares/auth.js';
import * as inquiry from '../../controllers/user/inquiry.js';

const router = Router();

router.post('/', inquiry.PostInquiry); // 문의하기
router.get('/', LoginCheck, inquiry.GetInquiry); // 문의 리스트 조회
router.get('/detail', LoginCheck, inquiry.GetInquiryDetail); // 문의 리스트 상세조회

export default router;
