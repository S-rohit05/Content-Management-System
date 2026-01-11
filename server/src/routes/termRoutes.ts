import { Router } from 'express';
import { createTerm, updateTerm, deleteTerm, createTermSchema, updateTermSchema } from '../controllers/termController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);
router.use(requireRole(['ADMIN', 'EDITOR']));

router.post('/', validate(createTermSchema), createTerm);
router.put('/:id', validate(updateTermSchema), updateTerm);
router.delete('/:id', deleteTerm);

export default router;
