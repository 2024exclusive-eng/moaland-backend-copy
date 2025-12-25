import { Router } from 'express';
import * as faq from '../../controllers/admin/faq.js';

const router = Router();

router.get('/', faq.GetFaqList); // Get all FAQs with pagination and filters
router.get('/:id', faq.GetFaqById); // Get FAQ by ID
router.post('/', faq.CreateOrUpdateFaq); // Create or update FAQ
router.delete('/:id', faq.DeleteFaq); // Delete FAQ by ID
router.patch('/:id/toggle', faq.ToggleFaqActive); // Toggle FAQ active status

export default router;
