import { ConnectionOptions } from 'bullmq';
import { config } from '../../config/env';

export const redisConnection: ConnectionOptions = {
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null,
};
