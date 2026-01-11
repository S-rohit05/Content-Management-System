import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export const createTermSchema = z.object({
    body: z.object({
        programId: z.string().uuid(),
        termNumber: z.number().int().positive(),
        title: z.string().optional(),
        description: z.string().optional(),
    }),
});

export const updateTermSchema = z.object({
    body: z.object({
        termNumber: z.number().int().positive().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
    }),
});

export const createTerm = async (req: Request, res: Response) => {
    const { programId, termNumber, title, description } = req.body;
    try {
        const term = await prisma.term.create({
            data: { programId, termNumber, title, description },
        });
        res.json(term);
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create term' });
    }
};

export const updateTerm = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { termNumber, title, description } = req.body;
    try {
        const term = await prisma.term.update({
            where: { id },
            data: { termNumber, title, description },
        });
        res.json(term);
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update term' });
    }
};

export const deleteTerm = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.term.delete({ where: { id } });
        res.json({ message: 'Term deleted' });
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete term' });
    }
};
