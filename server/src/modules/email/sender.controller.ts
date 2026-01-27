import { Request, Response } from 'express';
import { prisma } from '../../shared/infrastructure/prisma';

export const createSender = async (req: Request, res: Response) => {
    try {
        const { name, email, hourlyQuota } = req.body;
        const sender = await prisma.sender.create({
            data: { name, email, hourlyQuota: hourlyQuota || 100 }
        });
        res.status(201).json(sender);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Failed to create sender' });
    }
};

export const listSenders = async (req: Request, res: Response) => {
    const senders = await prisma.sender.findMany();
    res.json(senders);
};
