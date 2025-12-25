import pool from '../../utils/pool.js';
import EC from '../../utils/error.js';
import * as Event from '../../libs/event.js';

/**
 * @function GetEventList
 * @description Get event list with pagination and filters
 * @returns {obj}
 */
export const GetEventList = async (req, res, next) => {
  try {
    const { page, item, is_active } = req.query;
    const data = await Event.GetEventList({ page, item, is_active });

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function GetEventById
 * @description Get event by ID
 * @returns {obj}
 */
export const GetEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Event.GetEventById(id);

    if (!data) {
      throw { status: 404, code: EC.NOT_FOUND, message: 'Event not found' };
    }

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function CreateOrUpdateEvent
 * @description Create new event or update existing one
 * @returns {obj}
 */
export const CreateOrUpdateEvent = async (req, res, next) => {
  try {
    const { id, name, thumbnailPath, link, isActive } = req.body;

    // Validate required fields
    if (!name) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Name is required' };
    }

    if (id) {
      // Update existing event
      const existingEvent = await Event.GetEventById(id);
      if (!existingEvent) {
        throw { status: 404, code: EC.NOT_FOUND, message: 'Event not found' };
      }

      await Event.ModifyEvent(id, name, thumbnailPath || null, link || null, isActive || 'Y');
      return res.status(200).json({ success: true, message: 'Event updated successfully' });
    } else {
      // Create new event
      const insertId = await Event.InsertEvent(name, thumbnailPath || null, link || null);
      return res.status(201).json({ success: true, data: { id: insertId }, message: 'Event created successfully' });
    }
  } catch (e) {
    return next(e);
  }
};

/**
 * @function DeleteEvent
 * @description Delete event by ID
 * @returns {obj}
 */
export const DeleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingEvent = await Event.GetEventById(id);
    if (!existingEvent) {
      throw { status: 404, code: EC.NOT_FOUND, message: 'Event not found' };
    }

    await Event.DeleteEvent(id);

    return res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (e) {
    return next(e);
  }
};

/**
 * @function ToggleEventActive
 * @description Toggle event active status
 * @returns {obj}
 */
export const ToggleEventActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isActive || !['Y', 'N'].includes(isActive)) {
      throw { status: 400, code: EC.INVALID_PARAMETER, message: 'Invalid isActive value (Y or N)' };
    }

    const existingEvent = await Event.GetEventById(id);
    if (!existingEvent) {
      throw { status: 404, code: EC.NOT_FOUND, message: 'Event not found' };
    }

    await Event.ToggleEventActive(id, isActive);

    return res.status(200).json({ success: true, message: 'Event status updated successfully' });
  } catch (e) {
    return next(e);
  }
};
