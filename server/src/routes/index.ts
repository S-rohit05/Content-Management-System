import { Router } from 'express';
import authRoutes from './authRoutes';
import topicRoutes from './topicRoutes';
import programRoutes from './programRoutes';
import termRoutes from './termRoutes';
import lessonRoutes from './lessonRoutes';
import catalogRoutes from './catalogRoutes';
import userRoutes from './userRoutes';

import uploadRoutes from './uploadRoutes';

export const apiRoutes = Router();

apiRoutes.get('/', (req, res) => {
    res.json({ message: 'CMS API v1' });
});

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/topics', topicRoutes);
apiRoutes.use('/programs', programRoutes);
apiRoutes.use('/terms', termRoutes);
apiRoutes.use('/lessons', lessonRoutes);
apiRoutes.use('/catalog', catalogRoutes);
apiRoutes.use('/users', userRoutes);
apiRoutes.use('/upload', uploadRoutes);
