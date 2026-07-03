import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import * as Faq from '../../libs/faq.js';

/**
 * @function GetFaqList
 * @description Get FAQ list with pagination and filters
 * @returns {obj}
 */
export const GetFaqList = async (req, res, next) => {
  try {
    const { page, item, type, is_active, title } = req.query;
    const data = await Faq.GetFaqList({ page, item, type, is_active, title });

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetFaqById
 * @description Get FAQ by ID
 * @returns {obj}
 */
export const GetFaqById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Faq.GetFaqById(id);

    if (!data) {
      throw { status: 404, code: EC.NOT_FOUND, message: 'FAQ not found' };
    }

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function CreateOrUpdateFaq
 * @description Create new FAQ or update existing one
 * @returns {obj}
 */
export const CreateOrUpdateFaq = async (req, res, next) => {
  try {
    const { id, type, title, titleCn, answer, answerCn, displayOrder, isActive } = req.body;

    // Validate required fields
    if (!type || !['faq', 'service_guide', 'terms_of_use', 'privacy_policy'].includes(type)) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Invalid FAQ type' };
    }

    if (!title || !answer) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Title and answer are required' };
    }

    if (id) {
      // Update existing FAQ
      const existingFaq = await Faq.GetFaqById(id);
      if (!existingFaq) {
        throw { status: 404, code: EC.NOT_FOUND, message: 'FAQ not found' };
      }

      await Faq.ModifyFaq(id, type, title, titleCn, answer, answerCn, displayOrder || 0, isActive || 'Y');
      return res.status(200).json({ success: true, message: 'FAQ updated successfully' });
    } else {
      // Create new FAQ
      const insertId = await Faq.InsertFaq(type, title, titleCn, answer, answerCn, displayOrder || 0);
      return res.status(201).json({ success: true, data: { id: insertId }, message: 'FAQ created successfully' });
    }
  } catch (e) {
    return next(e);
  }
};

/**
 * @function DeleteFaq
 * @description Delete FAQ by ID
 * @returns {obj}
 */
export const DeleteFaq = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingFaq = await Faq.GetFaqById(id);
    if (!existingFaq) {
      throw { status: 404, code: EC.NOT_FOUND, message: 'FAQ not found' };
    }

    await Faq.DeleteFaq(id);

    return res.status(200).json({ success: true, message: 'FAQ deleted successfully' });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function ToggleFaqActive
 * @description Toggle FAQ active status
 * @returns {obj}
 */
export const ToggleFaqActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isActive || !['Y', 'N'].includes(isActive)) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Invalid isActive value (Y or N)' };
    }

    const existingFaq = await Faq.GetFaqById(id);
    if (!existingFaq) {
      throw { status: 404, code: EC.NOT_FOUND, message: 'FAQ not found' };
    }

    await Faq.ToggleFaqActive(id, isActive);

    return res.status(200).json({ success: true, message: 'FAQ status updated successfully' });
  } catch (e) {
    return next(e);
  }
};
