import { Router } from 'express';
import * as translate from '../../controllers/admin/translate.js';

const router = Router();

router.post('/address', translate.TranslateAddress); // Translate address to target language

export default router;
