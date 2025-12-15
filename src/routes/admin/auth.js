import { Router } from "express";
import * as auth from "../../controllers/admin/auth.js";

const router = Router();
router.post("/login", auth.Login); // 관리자 로그인

export default router;