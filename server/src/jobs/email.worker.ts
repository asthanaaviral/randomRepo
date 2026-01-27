import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { prisma } from '../shared/infrastructure/prisma';
import { redisConnection } from '../shared/infrastructure/redis';
import { config } from '../config/env';
import Redis from 'ioredis';

// Separate Redis instance for Rate Limiting
const redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
});

// Configure Ethereal Transporter
const createTransporter = async () => {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
};

let transporter: nodemailer.Transporter;

// Initialize transporter once
(async () => {
    try {
        transporter = await createTransporter();
        console.log('Ethereal Transporter Ready');
    } catch (err) {
        console.error('Failed to create transporter', err);
    }
})();

interface EmailJobData {
    emailId: string;
    senderId: string;
}

const worker = new Worker<EmailJobData>(
    'email-queue',
    async (job: Job<EmailJobData>) => {
        const { emailId, senderId } = job.data;

        // 1. Fetch Sender and Email
        const sender = await prisma.sender.findUnique({ where: { id: senderId } });
        const email = await prisma.scheduledEmail.findUnique({ where: { id: emailId } });

        if (!sender || !email) {
            console.error(`Job ${job.id}: Sender or Email not found`);
            return;
        }

        if (email.status === 'SENT') {
            console.log(`Job ${job.id}: Email already sent`);
            return;
        }

        // 2. Rate Limiting Logic 
        const currentHour = new Date().toISOString().slice(0, 13);
        const rateKey = `rate_limit:${senderId}:${currentHour}`;

        const currentCount = await redis.incr(rateKey);
        
        if (currentCount === 1) {
            await redis.expire(rateKey, 3600 + 60);
        }

        if (currentCount > sender.hourlyQuota) {
            console.warn(`Sender ${senderId} rate limit exceeded (${currentCount}/${sender.hourlyQuota}). Rescheduling...`);

            // Update status to THROTTLED
            await prisma.scheduledEmail.update({
                where: { id: emailId },
                data: { status: 'THROTTLED' }
            });

            // Calculate delay until next hour
            const now = new Date();
            const nextHour = new Date(now);
            nextHour.setHours(nextHour.getHours() + 1);
            nextHour.setMinutes(0, 0, 0);
            const delay = nextHour.getTime() - now.getTime();
            await job.moveToDelayed(Date.now() + delay, job.token);
            return;
        }

        // 3. Send Email
        try {
            const info = await transporter.sendMail({
                from: `"${sender.name}" <${sender.email}>`,
                to: email.recipient,
                subject: email.subject,
                text: email.body,
                html: `<p>${email.body}</p>`,
            });

            console.log(`Message sent: ${info.messageId}`);
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);

            // 4. Update DB
            await prisma.scheduledEmail.update({
                where: { id: emailId },
                data: {
                    status: 'SENT',
                    updatedAt: new Date()
                }
            });

            // 5. Global Throttling
            if (config.email.minDelay > 0) {
                await new Promise(resolve => setTimeout(resolve, config.email.minDelay));
            }

        } catch (error) {
            console.error('Failed to send email:', error);

            await prisma.scheduledEmail.update({
                where: { id: emailId },
                data: { status: 'FAILED' }
            });

            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: config.email.concurrency,
        limiter: {
            max: 100,
            duration: 1000,
        }
    }
);

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});

export default worker;
