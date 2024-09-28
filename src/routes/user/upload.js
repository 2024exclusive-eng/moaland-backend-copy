import { Router } from 'express';
import { LoginCheck } from '../../middlewares/auth.js';
import * as upload from '../../controllers/user/upload.js';

const router = Router();

router.post('/image', LoginCheck, upload.UploadImage); // 업로드 이미지

export default router;
