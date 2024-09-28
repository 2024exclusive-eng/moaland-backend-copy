import express from 'express';

import authRoute from './auth.js';
import missionRoute from './mission.js';
import noticeRoute from './notice.js';
import profileRoute from './profile.js';
import inquiryRoute from './inquiry.js';
import statisticsRoute from './statistics.js';
import pointRoute from './point.js';
import uploadRoute from './upload.js';

const route = express.Router();
route.use('/auth', authRoute);
route.use('/mission', missionRoute);
route.use('/notice', noticeRoute);
route.use('/profile', profileRoute);
route.use('/inquiry', inquiryRoute);
route.use('/statistics', statisticsRoute);
route.use('/point', pointRoute);
route.use('/upload', uploadRoute);

export default route;
