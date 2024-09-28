import express from 'express';

import adminRoute from './admin/index.js';
import userRoute from './user/index.js';

const route = express.Router();

route.use('/user', userRoute);
route.use('/admin', adminRoute);

/**
 * @description Common Routers
 */
route.get('/common/version', (req, res, next) => {
  return res.status(200).json({
    success: true,
    version: process.env.npm_package_version,
    msg: `API Test: ${process.env.VERSION}`,
  });
});
route.post('/common/upload/image', async (req, res, next) => {
  return res.status(200).json({ success: true });
});
export default route;
