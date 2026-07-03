import { Router } from 'express';
import * as banner from '../../controllers/admin/banner.js';

const router = Router();

router.get('/', banner.GetBannerList); // Get all banners with pagination
router.get('/:id', banner.GetBannerById); // Get banner by ID
router.post('/', banner.CreateOrUpdateBanner); // Create or update banner
router.post('/reorder', banner.ReorderBanners); // Reorder banners
router.delete('/:id', banner.DeleteBanner); // Delete banner by ID
router.patch('/:id/toggle', banner.ToggleBannerActive); // Toggle banner active status

export default router;
