import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import * as Event from '../../libs/event.js';

/**
 * @function GetActiveEvents
 * @description Get active events (for frontend display)
 * @returns {obj}
 */
export const GetActiveEvents = async (req, res, next) => {
  try {
    const { page, item } = req.query;

    // Fetch only active events
    const data = await Event.GetEventList({ page, item, is_active: 'Y' });

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetEventById
 * @description Get event details by ID
 * @returns {obj}
 */
export const GetEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Event.GetEventById(id);

    if (!data || data.isActive !== 'Y') {
      throw { status: 404, code: EC.NOT_FOUND, message: 'Event not found' };
    }

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};
