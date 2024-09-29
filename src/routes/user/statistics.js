import { Router } from 'express';
import { LoginCheck } from '../../middlewares/auth.js';
import * as statistics from '../../controllers/user/statistics.js';

const router = Router();

router.get('/', LoginCheck, statistics.GetStatistics); // 사용자 분석 조회

export default router;
