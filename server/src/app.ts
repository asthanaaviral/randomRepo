import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import emailRoutes from './modules/email/email.routes';

const app: Application = express();

app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
)

app.use(express.json());

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', emailRoutes);

// Global Error Handler placeholder
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
