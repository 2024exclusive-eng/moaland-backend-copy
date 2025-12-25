import { Router } from 'express';
import * as event from '../../controllers/admin/event.js';

const router = Router();

router.get('/', event.GetEventList); // Get all events with pagination
router.get('/:id', event.GetEventById); // Get event by ID
router.post('/', event.CreateOrUpdateEvent); // Create or update event
router.delete('/:id', event.DeleteEvent); // Delete event by ID
router.patch('/:id/toggle', event.ToggleEventActive); // Toggle event active status

export default router;
