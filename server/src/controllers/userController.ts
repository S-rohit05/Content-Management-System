import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        role: z.nativeEnum(Role),
    }),
});

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch users' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { email, password, role } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ code: 'CONFLICT', message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, role },
            select: { id: true, email: true, role: true, createdAt: true },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete user' });
    }
};
