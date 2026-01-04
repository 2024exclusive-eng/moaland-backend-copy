import { Router } from 'express';
import * as notice from '../../controllers/user/notice.js';

const router = Router();

router.get('/', notice.GetNotice); // 공지사항 조회
router.get('/:id', notice.GetNoticeById); // Get notice by ID

export default router;
