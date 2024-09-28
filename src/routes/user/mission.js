import { Router } from 'express';
import { LoginCheck } from '../../middlewares/auth.js';
import * as dashboard from '../../controllers/user/dashboard.js';

const router = Router();

router.get('/', dashboard.GetServiceDashboard);

export default router;
