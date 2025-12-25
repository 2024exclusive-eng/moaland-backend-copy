import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import * as Faq from '../../libs/faq.js';

/**
 * @function GetActiveFaqs
 * @description Get active FAQs by type (for frontend display)
 * @returns {obj}
 */
export const GetActiveFaqs = async (req, res, next) => {
  try {
    const { type, page, item } = req.query;

    // Validate type
    if (type && !['faq', 'service_guide', 'terms_of_use', 'privacy_policy'].includes(type)) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Invalid FAQ type' };
    }

    // Fetch only active FAQs
    const data = await Faq.GetFaqList({ type, page, item, is_active: 'Y' });

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetFaqById
 * @description Get FAQ details by ID
 * @returns {obj}
 */
export const GetFaqById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Faq.GetFaqById(id);

    if (!data || data.isActive !== 'Y') {
      throw { status: 404, code: EC.NOT_FOUND, message: 'FAQ not found' };
    }

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};
