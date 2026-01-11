import app from './app';
import { prisma } from './lib/prisma';

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        // Check DB connection
        await prisma.$connect();
        console.log('✅ Connected to Database');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error starting server:', error);
        process.exit(1);
    }
}

start();
