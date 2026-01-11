import { Router } from 'express';
import { getLesson, createLesson, updateLesson, deleteLesson, createLessonSchema, updateLessonSchema } from '../controllers/lessonController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/:id', getLesson);
router.post('/', requireRole(['ADMIN', 'EDITOR']), validate(createLessonSchema), createLesson);
router.put('/:id', requireRole(['ADMIN', 'EDITOR']), validate(updateLessonSchema), updateLesson);
router.delete('/:id', requireRole(['ADMIN', 'EDITOR']), deleteLesson);

export default router;
