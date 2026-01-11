import { Router } from 'express';
import { getCatalogPrograms, getCatalogProgram, getCatalogLesson } from '../controllers/catalogController';

const router = Router();

router.get('/programs', getCatalogPrograms);
router.get('/programs/:id', getCatalogProgram);
router.get('/lessons/:id', getCatalogLesson);

export default router;
