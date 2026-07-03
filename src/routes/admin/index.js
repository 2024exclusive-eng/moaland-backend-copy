import express from 'express';

import authRoute from './auth.js';
import missionRoute from './mission.js';
import manageRoute from './manage.js';
import noticeRoute from './notice.js';
import bannerRoute from './banner.js';
import eventRoute from './event.js';
import faqRoute from './faq.js';
import translateRoute from './translate.js';
import * as upload from "../../controllers/admin/upload.js";

import { AdminLoginCheck } from "../../middlewares/auth.js";
import multer from "multer";

const uploadStorage = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '/tmp')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  })
});
const route = express.Router();

// // 인증 이전
route.use('/auth', authRoute);

// // 인증 이후
route.use(AdminLoginCheck);
route.use('/mission', missionRoute);
route.use('/manage', manageRoute);
route.use('/notice', noticeRoute);
route.use('/banner', bannerRoute);
route.use('/event', eventRoute);
route.use('/faq', faqRoute);
route.use('/translate', translateRoute);
route.post('/image', AdminLoginCheck, uploadStorage.single("file"), upload.UploadUserImage); // 업로드 이미지

export default route;
