import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import * as Banner from '../../libs/banner.js';

/**
 * @function GetBannerList
 * @description Get banner list with pagination and filters
 * @returns {obj}
 */
export const GetBannerList = async (req, res, next) => {
  try {
    const { page, item, type, is_active } = req.query;
    const data = await Banner.GetBannerList({ page, item, type, is_active });

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetBannerById
 * @description Get banner by ID
 * @returns {obj}
 */
export const GetBannerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Banner.GetBannerById(id);

    if (!data) {
      throw { status: 404, code: EC.NOT_FOUND, message: 'Banner not found' };
    }

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function CreateOrUpdateBanner
 * @description Create new banner or update existing one
 * @returns {obj}
 */
export const CreateOrUpdateBanner = async (req, res, next) => {
  try {
    const { id, type, name, thumbnailPath, link, order, isActive, linkType } = req.body;

    // Validate required fields
    if (!type || !['home', 'right_banner'].includes(type)) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Invalid banner type' };
    }

    if (!name || !thumbnailPath) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Name and thumbnail path are required' };
    }

    // 'wechat' banners open the member-page WeChat QR popup (no URL needed).
    const bannerLinkType = linkType === 'wechat' ? 'wechat' : 'url';
    const bannerLink = bannerLinkType === 'wechat' ? null : link || null;

    if (id) {
      // Update existing banner
      const existingBanner = await Banner.GetBannerById(id);
      if (!existingBanner) {
        throw { status: 404, code: EC.NOT_FOUND, message: 'Banner not found' };
      }

      await Banner.ModifyBanner(id, type, name, thumbnailPath, bannerLink, order ?? existingBanner.order, isActive || 'Y', bannerLinkType);
      return res.status(200).json({ success: true, message: 'Banner updated successfully' });
    } else {
      // Create new banner - get next order if not provided (only for home type)
      const bannerOrder = type === 'home' ? (order ?? await Banner.GetNextOrder(type)) : (order ?? 0);
      const insertId = await Banner.InsertBanner(type, name, thumbnailPath, bannerLink, bannerOrder, bannerLinkType);
      return res.status(201).json({ success: true, data: { id: insertId }, message: 'Banner created successfully' });
    }
  } catch (e) {
    return next(e);
  }
};

/**
 * @function DeleteBanner
 * @description Delete banner by ID
 * @returns {obj}
 */
export const DeleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingBanner = await Banner.GetBannerById(id);
    if (!existingBanner) {
      throw { status: 404, code: EC.NOT_FOUND, message: 'Banner not found' };
    }

    await Banner.DeleteBanner(id);

    return res.status(200).json({ success: true, message: 'Banner deleted successfully' });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function ToggleBannerActive
 * @description Toggle banner active status
 * @returns {obj}
 */
export const ToggleBannerActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isActive || !['Y', 'N'].includes(isActive)) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Invalid isActive value (Y or N)' };
    }

    const existingBanner = await Banner.GetBannerById(id);
    if (!existingBanner) {
      throw { status: 404, code: EC.NOT_FOUND, message: 'Banner not found' };
    }

    await Banner.ToggleBannerActive(id, isActive);

    return res.status(200).json({ success: true, message: 'Banner status updated successfully' });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function ReorderBanners
 * @description Reorder banners by updating display_order
 * @returns {obj}
 */
export const ReorderBanners = async (req, res, next) => {
  try {
    const { banners } = req.body;

    // Validate input
    if (!banners || !Array.isArray(banners) || banners.length === 0) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Banners array is required' };
    }

    // Validate each banner object has id and order, and is a home type banner
    for (const banner of banners) {
      if (!banner.id || banner.order === undefined) {
        throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Each banner must have id and order' };
      }

      // Verify banner exists and is home type
      const existingBanner = await Banner.GetBannerById(banner.id);
      if (!existingBanner) {
        throw { status: 404, code: EC.NOT_FOUND, message: `Banner with id ${banner.id} not found` };
      }
      if (existingBanner.type !== 'home') {
        throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Reorder is only available for home type banners' };
      }
    }

    await Banner.ReorderBanners(banners);

    return res.status(200).json({ success: true, message: 'Banners reordered successfully' });
  } catch (e) {
    return next(e);
  }
};
