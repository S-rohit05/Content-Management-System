import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { LessonStatus, ContentType, AssetVariant, LessonAssetType } from '@prisma/client';

export const createLessonSchema = z.object({
    body: z.object({
        termId: z.string().uuid(),
        lessonNumber: z.number().int().positive(),
        title: z.string().min(1),
        description: z.string().optional(),
        contentType: z.nativeEnum(ContentType),
        durationMs: z.number().int().nonnegative().optional(),
        contentLanguagePrimary: z.string().length(2),
        contentLanguagesAvailable: z.array(z.string().length(2)),
        contentUrlsByLanguage: z.record(z.string().url()),
    }),
});

export const updateLessonSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        lessonNumber: z.number().int().positive().optional(),
        durationMs: z.number().int().nonnegative().optional(),
        contentLanguagesAvailable: z.array(z.string().length(2)).optional(),
        contentUrlsByLanguage: z.record(z.string().url()).optional(),
        status: z.nativeEnum(LessonStatus).optional(),
        publishAt: z.string().datetime().optional().nullable(),
        isPaid: z.boolean().optional(),
        subtitleLanguages: z.array(z.string().length(2)).optional(),
        subtitleUrlsByLanguage: z.record(z.string().url()).optional(),
        assets: z.array(z.object({
            language: z.string().length(2),
            variant: z.nativeEnum(AssetVariant),
            url: z.string().url(),
        })).optional(),
    }),
});

export const getLesson = async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;

    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id },
            include: {
                assets: true,
                term: true
            },
        });
        if (!lesson) return res.status(404).json({ code: 'NOT_FOUND', message: 'Lesson not found' });

        // Visibility Check
        if (user?.role === 'VIEWER' && lesson.status !== 'PUBLISHED') {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Access denied' });
        }

        // Calculate Next/Prev Lesson
        // 1. Fetch all lessons in the program (lightweight)
        const allLessons = await prisma.lesson.findMany({
            where: {
                term: { programId: lesson.term.programId },
                ...(user?.role === 'VIEWER' ? { status: 'PUBLISHED' } : {})
            },
            select: {
                id: true,
                title: true, // Useful for tooltips if needed
                lessonNumber: true,
                term: {
                    select: { termNumber: true }
                }
            },
            orderBy: [
                { term: { termNumber: 'asc' } },
                { lessonNumber: 'asc' }
            ]
        });

        // 2. Find current index
        const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
        const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
        const nextLesson = currentIndex !== -1 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

        res.json({
            ...lesson,
            prevLessonId: prevLesson?.id || null,
            nextLessonId: nextLesson?.id || null
        });
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch lesson' });
    }
};

export const createLesson = async (req: Request, res: Response) => {
    const { termId, lessonNumber, title, description, contentType, durationMs, contentLanguagePrimary, contentLanguagesAvailable, contentUrlsByLanguage } = req.body;
    try {
        const lesson = await prisma.lesson.create({
            data: {
                termId,
                lessonNumber,
                title,
                description,
                contentType,
                durationMs,
                contentLanguagePrimary,
                contentLanguagesAvailable: contentLanguagesAvailable || [contentLanguagePrimary],
                contentUrlsByLanguage,
            },
        });
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create lesson' });
    }
};

export const updateLesson = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { assets, ...data } = req.body;

    try {
        const lesson = await prisma.$transaction(async (tx) => {
            await tx.lesson.update({
                where: { id },
                data: {
                    ...data,
                    publishAt: data.publishAt ? new Date(data.publishAt) : undefined,
                },
            });

            if (assets) {
                // 1. Get existing assets to identify what to delete
                const existingAssets = await tx.lessonAsset.findMany({
                    where: { lessonId: id },
                    select: { language: true, variant: true, assetType: true }
                });

                // 2. Identify assets to keep/update from the incoming payload (only THUMBNAILS are managed here for now)
                // Note: If we support other asset types in future, filter by assetType 'THUMBNAIL'
                const incomingKeys = new Set(assets.map((a: any) => `${a.language}-${a.variant}-${LessonAssetType.THUMBNAIL}`));

                // 3. Delete assets that are in DB but NOT in incoming payload
                // We only delete THUMBNAILS because this payload is specific to thumbnails in the editor
                // If we had other types, we'd need to be careful not to delete them if they aren't in the payload
                for (const existing of existingAssets) {
                    if (existing.assetType === LessonAssetType.THUMBNAIL) {
                        const key = `${existing.language}-${existing.variant}-${existing.assetType}`;
                        if (!incomingKeys.has(key)) {
                            await tx.lessonAsset.delete({
                                where: {
                                    lessonId_language_variant_assetType: {
                                        lessonId: id,
                                        language: existing.language,
                                        variant: existing.variant,
                                        assetType: existing.assetType
                                    }
                                }
                            });
                        }
                    }
                }

                // 4. Upsert incoming assets
                for (const asset of assets) {
                    await tx.lessonAsset.upsert({
                        where: {
                            lessonId_language_variant_assetType: {
                                lessonId: id,
                                language: asset.language,
                                variant: asset.variant,
                                assetType: LessonAssetType.THUMBNAIL,
                            }
                        },
                        create: {
                            lessonId: id,
                            language: asset.language,
                            variant: asset.variant,
                            assetType: LessonAssetType.THUMBNAIL,
                            url: asset.url
                        },
                        update: { url: asset.url }
                    });
                }
            }

            // Validation for Publishing
            // We fetch the latest state of the lesson including assets to validate
            const updatedLesson = await tx.lesson.findUnique({ where: { id }, include: { assets: true } });

            if (updatedLesson?.status === 'PUBLISHED') {
                // Check 1: Content URL for primary language
                if (!updatedLesson.contentUrlsByLanguage || !(updatedLesson.contentLanguagePrimary in (updatedLesson.contentUrlsByLanguage as Record<string, string>))) {
                    throw new Error('VALIDATION_ERROR: Missing content URL for primary language');
                }

                // Check 2: Required Assets (Portrait & Landscape Thumbnails)
                const hasPortrait = updatedLesson.assets.some(a => a.assetType === 'THUMBNAIL' && a.variant === 'PORTRAIT' && a.language === updatedLesson.contentLanguagePrimary);
                const hasLandscape = updatedLesson.assets.some(a => a.assetType === 'THUMBNAIL' && a.variant === 'LANDSCAPE' && a.language === updatedLesson.contentLanguagePrimary);

                if (!hasPortrait || !hasLandscape) {
                    throw new Error('VALIDATION_ERROR: Missing required thumbnails (Portrait and Landscape) for primary language');
                }
            }

            return updatedLesson;
        });
        res.json(lesson);
    } catch (error: any) {
        console.error('Update Lesson Error:', error); // Debug logging
        if (error.message && error.message.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ code: 'VALIDATION_ERROR', message: error.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update lesson' });
    }
};

export const deleteLesson = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.lesson.delete({ where: { id } });
        res.json({ message: 'Lesson deleted' });
    } catch (error) {
        res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete lesson' });
    }
};
