import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { ProgramStatus, AssetVariant, ProgramAssetType } from '@prisma/client';

export const createProgramSchema = z.object({
    body: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        languagePrimary: z.string().length(2),
        languagesAvailable: z.array(z.string().length(2)),
    }),
});

export const updateProgramSchema = z.object({
    body: z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        languagePrimary: z.string().length(2).optional(),
        languagesAvailable: z.array(z.string().length(2)).optional(),
        status: z.nativeEnum(ProgramStatus).optional(),
        topicIds: z.array(z.string()).optional(),
        assets: z.array(z.object({
            language: z.string().length(2),
            variant: z.nativeEnum(AssetVariant),
            url: z.string().url(),
        })).optional(),
    }),
});

export const getPrograms = async (req: Request, res: Response) => {
    const { status, language, topic } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (language) where.languagePrimary = language;
    if (topic) where.topics = { some: { name: topic as string } };

    try {
        const programs = await prisma.program.findMany({
            where,
            include: {
                topics: true,
                assets: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(programs);
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch programs' });
    }
};

export const getProgram = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;
    const isViewer = user?.role === 'VIEWER';

    try {
        const program = await prisma.program.findUnique({
            where: { id },
            include: {
                topics: true,
                assets: true,
                terms: {
                    include: {
                        lessons: {
                            where: isViewer ? { status: 'PUBLISHED' } : undefined,
                            include: {
                                assets: true,
                            },
                        },
                    },
                    orderBy: { termNumber: 'asc' },
                },
            },
        });
        if (!program) return res.status(404).json({ code: 'NOT_FOUND', message: 'Program not found' });
        res.json(program);
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch program' });
    }
};

export const createProgram = async (req: Request, res: Response) => {
    const { title, description, languagePrimary, languagesAvailable } = req.body;
    try {
        const program = await prisma.program.create({
            data: {
                title,
                description,
                languagePrimary,
                languagesAvailable: languagesAvailable || [languagePrimary],
            },
        });
        res.json(program);
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create program' });
    }
};

export const updateProgram = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { topicIds, assets, ...data } = req.body;

    try {
        // Transaction to handle updates
        const program = await prisma.$transaction(async (tx) => {
            // 1. Update basic fields
            let updated = await tx.program.update({
                where: { id },
                data: {
                    ...data,
                    topics: topicIds ? {
                        set: topicIds.map((id: string) => ({ id })),
                    } : undefined,
                },
            });

            // 2. Update assets if provided
            if (assets) {
                // Delete existing assets for simplicity in this MVP approach or upsert
                // Requirement says "normalized tables".
                // Strategy: Delete all for this program and recreate? No, that loses IDs.
                // Better: Upsert by composite unique key.
                for (const asset of assets) {
                    await tx.programAsset.upsert({
                        where: {
                            programId_language_variant_assetType: {
                                programId: id,
                                language: asset.language,
                                variant: asset.variant,
                                assetType: ProgramAssetType.POSTER,
                            }
                        },
                        create: {
                            programId: id,
                            language: asset.language,
                            variant: asset.variant,
                            assetType: ProgramAssetType.POSTER,
                            url: asset.url
                        },
                        update: {
                            url: asset.url
                        }
                    });
                }
            }

            // Validation for Publishing (Media Assets)
            const updatedProgram = await tx.program.findUnique({
                where: { id },
                include: { topics: true, assets: true }
            });

            if (updatedProgram?.status === 'PUBLISHED') {
                const languagePrimary = updatedProgram.languagePrimary;

                // Requirement: Must have Portrait and Landscape posters for primary language
                const hasPortrait = updatedProgram.assets.some(a =>
                    a.assetType === ProgramAssetType.POSTER &&
                    a.variant === AssetVariant.PORTRAIT &&
                    a.language === languagePrimary
                );

                const hasLandscape = updatedProgram.assets.some(a =>
                    a.assetType === ProgramAssetType.POSTER &&
                    a.variant === AssetVariant.LANDSCAPE &&
                    a.language === languagePrimary
                );

                if (!hasPortrait || !hasLandscape) {
                    throw new Error('VALIDATION_ERROR: Cannot publish. Missing required posters (Portrait and Landscape) for default language.');
                }
            }

            return updatedProgram;
        });

        res.json(program);
    } catch (error: any) {
        console.error('Update Program Error:', error);
        if (error.message && error.message.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ code: 'VALIDATION_ERROR', message: error.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update program' });
    }
};
