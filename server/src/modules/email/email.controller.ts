import { Request, Response } from 'express';
import { prisma } from '../../shared/infrastructure/prisma';
import { emailQueue } from '../../jobs/queues';

export const scheduleEmail = async (req: Request, res: Response) => {
    try {
        const { senderId, recipients, subject, body, sendAt, delay, hourlyLimit } = req.body;

        // Validate Sender
        const sender = await prisma.sender.findUnique({ where: { id: senderId } });
        if (!sender) {
            return res.status(404).json({ error: 'Sender not found' });
        }

        // Validate Recipients
        const recipientList = Array.isArray(recipients) ? recipients : [recipients];
        if (recipientList.length === 0) {
            return res.status(400).json({ error: 'No recipients provided' });
        }

        let baseTime = sendAt ? new Date(sendAt).getTime() : Date.now();
        const baseDelay = Math.max(0, baseTime - Date.now());

        // Calculate interval
        let intervalMs = 0;
        if (hourlyLimit && hourlyLimit > 0) {
            intervalMs = Math.max(intervalMs, (3600 * 1000) / hourlyLimit);
        }
        if (delay && delay > 0) {
            intervalMs = Math.max(intervalMs, delay * 1000);
        }

        const jobs = [];

        for (let i = 0; i < recipientList.length; i++) {
            const recipientEmail = recipientList[i];
            const emailDelay = baseDelay + (i * intervalMs);
            const scheduledFor = new Date(Date.now() + emailDelay);

            // Save to DB
            const scheduledEmail = await prisma.scheduledEmail.create({
                data: {
                    recipient: recipientEmail,
                    subject,
                    body,
                    sendAt: scheduledFor,
                    senderId,
                    status: 'PENDING',
                }
            });

            // Add to BullMQ
            const job = await emailQueue.add('send-email', {
                emailId: scheduledEmail.id,
                senderId: sender.id
            }, {
                delay: emailDelay,
                jobId: scheduledEmail.id,
                removeOnComplete: true,
                removeOnFail: false,
            });

            // Update with Job ID
            await prisma.scheduledEmail.update({
                where: { id: scheduledEmail.id },
                data: { jobId: job.id }
            });

            jobs.push({ id: scheduledEmail.id, recipient: recipientEmail, scheduledAt: scheduledFor });
        }

        res.status(201).json({
            message: `Scheduled ${jobs.length} emails`,
            jobs
        });

    } catch (error) {
        console.error('Schedule Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const getScheduledEmails = async (req: Request, res: Response) => {
    try {
        const { status, senderEmail } = req.query;
        // Build filter object 
        const where: any = {};
        if (status) {
            where.status = String(status).toUpperCase();
        }
        if (senderEmail) {
            where.sender = { email: String(senderEmail) };
        }

        const emails = await prisma.scheduledEmail.findMany({
            where: where as any, 
            include: { sender: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json(emails);
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
};
