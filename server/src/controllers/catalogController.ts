import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ProgramStatus, LessonStatus } from '@prisma/client';

// Helper for caching headers
const setCache = (res: Response, seconds: number = 60) => {
    res.set('Cache-Control', `public, max-age=${seconds}, s-maxage=${seconds}`);
};

export const getCatalogPrograms = async (req: Request, res: Response) => {
    const { language, topic, cursor, limit = '10' } = req.query;
    const take = parseInt(limit as string) || 10;

    const where: any = {
        status: ProgramStatus.PUBLISHED,
        terms: {
            some: {
                lessons: {
                    some: { status: LessonStatus.PUBLISHED }
                }
            }
        }
    };

    if (language) where.languagePrimary = language;
    if (topic) where.topics = { some: { name: topic as string } };

    try {
        const programs = await prisma.program.findMany({
            where,
            take,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor as string } : undefined,
            include: {
                topics: true,
                assets: true,
            },
            orderBy: { publishedAt: 'desc' },
        });

        setCache(res, 60);
        res.json(programs);
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch catalog programs' });
    }
};

export const getCatalogProgram = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const program = await prisma.program.findUnique({
            where: { id, status: ProgramStatus.PUBLISHED },
            include: {
                topics: true,
                assets: true,
                terms: {
                    include: {
                        lessons: {
                            where: { status: LessonStatus.PUBLISHED },
                            include: { assets: true }, // Include thumbnails
                            orderBy: { lessonNumber: 'asc' },
                        },
                    },
                    orderBy: { termNumber: 'asc' },
                },
            },
        });

        if (!program) return res.status(404).json({ code: 'NOT_FOUND', message: 'Program not found' });

        setCache(res, 300);
        res.json(program);
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch catalog program' });
    }
};

export const getCatalogLesson = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id, status: LessonStatus.PUBLISHED },
            include: { assets: true },
        });

        if (!lesson) return res.status(404).json({ code: 'NOT_FOUND', message: 'Lesson not found' });

        setCache(res, 3600); // Lessons change detailed less often
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch catalog lesson' });
    }
};
