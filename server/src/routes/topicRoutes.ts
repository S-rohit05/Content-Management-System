import { Router } from 'express';
import { getTopics, createTopic, createTopicSchema } from '../controllers/topicController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getTopics);
router.post('/', requireRole(['ADMIN', 'EDITOR']), validate(createTopicSchema), createTopic);

export default router;
