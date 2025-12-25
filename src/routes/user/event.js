import { Router } from 'express';
import * as event from '../../controllers/user/event.js';

const router = Router();

router.get('/', event.GetActiveEvents); // Get active events with pagination
router.get('/:id', event.GetEventById); // Get event by ID

export default router;
