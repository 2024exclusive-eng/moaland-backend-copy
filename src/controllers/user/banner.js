import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import * as Banner from '../../libs/banner.js';

/**
 * @function GetActiveBanners
 * @description Get active banners (for frontend display)
 * @returns {obj}
 */
export const GetActiveBanners = async (req, res, next) => {
  try {
    const { type } = req.query; // home | right_banner

    // Fetch only active banners
    const data = await Banner.GetBannerList({ type, is_active: 'Y', item: 100 });

    return res.status(200).json({ success: true, data: data.data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetBannerById
 * @description Get banner details by ID
 * @returns {obj}
 */
export const GetBannerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Banner.GetBannerById(id);

    if (!data || data.isActive !== 'Y') {
      throw { status: 404, code: EC.NOT_FOUND, message: 'Banner not found' };
    }

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};
