import { Router } from 'express';
import { LoginCheck } from '../../middlewares/auth.js';
import * as upload from '../../controllers/user/upload.js';
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
const router = Router();

router.post('/image', LoginCheck, uploadStorage.single("image"), upload.UploadUserImage); // 업로드 이미지

export default router;
