import { Router } from 'express';
import { getUsers, createUser, deleteUser, createUserSchema } from '../controllers/userController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication and ADMIN role
router.use(authenticate, requireRole(['ADMIN']));

router.get('/', getUsers);
router.post('/', validate(createUserSchema), createUser);
router.delete('/:id', deleteUser);

export default router;
