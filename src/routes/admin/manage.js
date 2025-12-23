import { Router } from 'express';
import * as manage from "../../controllers/admin/manage.js";

const router = Router();
router.get('/user', manage.GetUserList); // 사용자 리스트 조회
router.get('/user/status', manage.GetUserStatus);
router.get('/user/:id', manage.GetUserDetail); // 사용자 상세 조회

export default router;
