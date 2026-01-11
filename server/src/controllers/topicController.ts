import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export const createTopicSchema = z.object({
    body: z.object({
        name: z.string().min(1),
    }),
});

export const getTopics = async (req: Request, res: Response) => {
    try {
        const topics = await prisma.topic.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(topics);
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch topics' });
    }
};

export const createTopic = async (req: Request, res: Response) => {
    const { name } = req.body;
    try {
        const topic = await prisma.topic.create({
            data: { name },
        });
        res.json(topic);
    } catch (error) {
        res.status(409).json({ code: 'CONFLICT', message: 'Topic already exists' });
    }
};
