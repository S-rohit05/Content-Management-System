import { Router } from 'express';
import { login, loginSchema, signup, signupSchema } from '../controllers/authController';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/signup', validate(signupSchema), signup);

export default router;
