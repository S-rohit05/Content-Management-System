import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './lib/prisma';
import { randomUUID } from 'crypto';
import { apiRoutes } from './routes';

const app = express();

// Middleware
// Middleware
app.use(cors());

// Request ID & JSON Logger
app.use((req: any, res: any, next) => {
    req.id = (req.headers['x-request-id'] as string) || randomUUID();
    res.setHeader('X-Request-Id', req.id);

    // Log request
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(JSON.stringify({
            level: 'info',
            timestamp: new Date().toISOString(),
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
            userAgent: req.headers['user-agent'],
            ip: req.ip
        }));
    });
    next();
});
app.use(express.json({ limit: '10mb' }));

// Serve static files from 'uploads' directory
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Adjust Helmet to allow images from self
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Root Route
app.get('/', (req, res) => {
    res.json({ message: 'CMS API Server is running 🚀', documentation: '/api' });
});

// Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            db: 'connected'
        });
    } catch (error) {
        console.error('Health Check Failed:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            message: 'Database connection failed'
        });
    }
});

// Error Handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong!' });
});

export default app;
