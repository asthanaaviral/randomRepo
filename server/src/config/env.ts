import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
    port: process.env.PORT || 3000,
    databaseUrl: process.env.DATABASE_URL,
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    email: {
        concurrency: parseInt(process.env.EMAIL_CONCURRENCY || '5'),
        minDelay: parseInt(process.env.MIN_DELAY_MS || '1000'),
    }
};
