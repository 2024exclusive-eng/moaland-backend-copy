import { Router } from 'express';
import * as banner from '../../controllers/user/banner.js';

const router = Router();

router.get('/', banner.GetActiveBanners); // Get active banners (filterable by type: home | right_banner)
router.get('/:id', banner.GetBannerById); // Get banner by ID

export default router;
