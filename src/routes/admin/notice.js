import { Router } from 'express';
import * as notice from '../../controllers/admin/notice.js';

const router = Router();
router.get('/', notice.GetNotice); // 공지사항 조회
router.get('/:id', notice.GetNoticeById); // 공지사항 ID로 조회
router.post('/', notice.PostNotice); // 공지사항 생성 또는 수정
router.delete('/:id', notice.DeleteNotice); // 공지사항 ID로 삭제

export default router;
