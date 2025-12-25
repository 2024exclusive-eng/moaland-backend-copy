import { Router } from 'express';
import * as faq from '../../controllers/user/faq.js';

const router = Router();

router.get('/', faq.GetActiveFaqs); // Get active FAQs (filterable by type: faq | service_guide | terms_of_use | privacy_policy)
router.get('/:id', faq.GetFaqById); // Get FAQ by ID

export default router;
