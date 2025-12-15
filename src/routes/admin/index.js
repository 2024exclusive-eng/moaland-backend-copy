import express from 'express';

import authRoute from './auth.js';
import missionRoute from './mission.js';
import manageRoute from './manage.js';
import noticeRoute from './notice.js';
import * as upload from "../../controllers/admin/upload.js";

import { AdminLoginCheck } from "../../middlewares/auth.js";
import multer from "multer";

const uploadStorage = multer({ storage: multer.diskStorage({}) });
const route = express.Router();

// // 인증 이전
route.use('/auth', authRoute);

// // 인증 이후
route.use(AdminLoginCheck);
route.use('/mission', missionRoute);
route.use('/manage', manageRoute);
route.use('/notice', noticeRoute);
route.post('/image', AdminLoginCheck, uploadStorage.single("file"), upload.UploadUserImage); // 업로드 이미지

export default route;
