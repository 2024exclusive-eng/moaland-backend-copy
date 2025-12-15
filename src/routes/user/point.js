import { Router } from 'express';
import { LoginCheck } from '../../middlewares/auth.js';
import * as point from '../../controllers/user/point.js';

const router = Router();

router.get('/', LoginCheck, point.GetPoint); // 포인트 내역 조회
router.post('/withdrawal', LoginCheck, point.WithdrawalPoint); // 포인트 출금 신청


export default router;
