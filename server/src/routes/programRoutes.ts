import { Router } from 'express';
import { getPrograms, getProgram, createProgram, updateProgram, deleteProgram, createProgramSchema, updateProgramSchema } from '../controllers/programController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getPrograms);
router.get('/:id', getProgram);
router.post('/', requireRole(['ADMIN', 'EDITOR']), validate(createProgramSchema), createProgram);
router.put('/:id', requireRole(['ADMIN', 'EDITOR']), validate(updateProgramSchema), updateProgram);
router.delete('/:id', requireRole(['ADMIN']), deleteProgram);

export default router;
