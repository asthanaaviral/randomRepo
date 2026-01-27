import { Queue } from 'bullmq';
import { redisConnection } from '../shared/infrastructure/redis';

export const emailQueue = new Queue('email-queue', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});
