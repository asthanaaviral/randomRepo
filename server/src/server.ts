import app from './app';
import { config } from './config/env';
import { logger } from './shared/utils/logger';
import './jobs/email.worker';

const startServer = async () => {
    try {
        app.listen(config.port, () => {
            logger.info(`Server is running on port ${config.port}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
