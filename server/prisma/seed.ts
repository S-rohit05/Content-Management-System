import { PrismaClient, Role, ProgramStatus, LessonStatus, ContentType, AssetVariant, ProgramAssetType, LessonAssetType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 0. Clean Database (Delete in correct order)
    console.log('🧹 Cleaning database...');
    try {
        await prisma.lessonAsset.deleteMany();
        console.log('Deleted LessonAssets');
        await prisma.programAsset.deleteMany();
        console.log('Deleted ProgramAssets');
        await prisma.lesson.deleteMany();
        console.log('Deleted Lessons');
        await prisma.term.deleteMany();
        console.log('Deleted Terms');
        await prisma.program.deleteMany();
        console.log('Deleted Programs');
        await prisma.topic.deleteMany();
        console.log('Deleted Topics');
    } catch (e: any) {
        console.error('❌ Error during cleanup:');
        console.error(JSON.stringify(e, null, 2));
        throw e;
    }
    // Users are kept or upserted

    // 1. Create Users
    const password = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: { email: 'admin@example.com', password, role: Role.ADMIN },
    });

    const editor = await prisma.user.upsert({
        where: { email: 'editor@example.com' },
        update: {},
        create: { email: 'editor@example.com', password, role: Role.EDITOR },
    });

    // Viewer
    await prisma.user.upsert({
        where: { email: 'viewer@example.com' },
        update: {},
        create: { email: 'viewer@example.com', password, role: Role.VIEWER },
    });

    // 2. Create Topics
    const webDev = await prisma.topic.create({ data: { name: 'Web Development' } });
    const arts = await prisma.topic.create({ data: { name: 'Arts & Media' } });

    // 3. Program 1: Full Stack (Multi-Language)
    console.log('Creating Program 1...');
    const p1 = await prisma.program.create({
        data: {
            title: 'Full Stack Web Development',
            description: 'Master React, Node.js, and Modern Web Architecture.',
            languagePrimary: 'en',
            languagesAvailable: ['en', 'hi'],
            status: ProgramStatus.PUBLISHED,
            publishedAt: new Date(),
            topics: { connect: [{ id: webDev.id }] },
            assets: {
                create: [
                    { language: 'en', variant: AssetVariant.PORTRAIT, assetType: ProgramAssetType.POSTER, url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=800&fit=crop' },
                    { language: 'en', variant: AssetVariant.LANDSCAPE, assetType: ProgramAssetType.POSTER, url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop' },
                    // Hindi Assets
                    { language: 'hi', variant: AssetVariant.PORTRAIT, assetType: ProgramAssetType.POSTER, url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=800&fit=crop' },
                ],
            },
        },
    });

    // P1 Term 1
    const t1 = await prisma.term.create({
        data: { programId: p1.id, termNumber: 1, title: 'Frontend Fundamentals', description: 'HTML, CSS, JS' },
    });

    // P1 Term 1 Lessons
    // L1: Published, Multi-lang
    await prisma.lesson.create({
        data: {
            termId: t1.id,
            lessonNumber: 1,
            title: 'HTML Structure & Semantics',
            contentType: ContentType.VIDEO,
            durationMs: 900000, // 15 mins
            contentLanguagePrimary: 'en',
            contentLanguagesAvailable: ['en', 'hi'],
            contentUrlsByLanguage: {
                en: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                hi: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
            },
            status: LessonStatus.PUBLISHED,
            publishedAt: new Date(),
            assets: {
                create: [
                    { language: 'en', variant: AssetVariant.PORTRAIT, assetType: LessonAssetType.THUMBNAIL, url: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=400&h=600&fit=crop' },
                    { language: 'en', variant: AssetVariant.LANDSCAPE, assetType: LessonAssetType.THUMBNAIL, url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&h=400&fit=crop' },
                ],
            },
        },
    });

    // L2: Published, Single Lang
    await prisma.lesson.create({
        data: {
            termId: t1.id,
            lessonNumber: 2,
            title: 'CSS Grid & Flexbox',
            contentType: ContentType.VIDEO,
            durationMs: 1200000, // 20 mins
            contentLanguagePrimary: 'en',
            contentLanguagesAvailable: ['en'],
            contentUrlsByLanguage: { en: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
            status: LessonStatus.PUBLISHED,
            publishedAt: new Date(),
            assets: {
                create: [
                    { language: 'en', variant: AssetVariant.PORTRAIT, assetType: LessonAssetType.THUMBNAIL, url: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=600&fit=crop' },
                    { language: 'en', variant: AssetVariant.LANDSCAPE, assetType: LessonAssetType.THUMBNAIL, url: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=600&h=400&fit=crop' },
                ],
            },
        },
    });

    // L3: Scheduled (Demo)
    await prisma.lesson.create({
        data: {
            termId: t1.id,
            lessonNumber: 3,
            title: 'JavaScript Basics (Live in 2m)',
            contentType: ContentType.VIDEO,
            durationMs: 600000,
            contentLanguagePrimary: 'en',
            contentLanguagesAvailable: ['en'],
            contentUrlsByLanguage: { en: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
            status: LessonStatus.SCHEDULED,
            publishAt: new Date(Date.now() + 120000), // 2 mins
            assets: {
                create: [
                    { language: 'en', variant: AssetVariant.PORTRAIT, assetType: LessonAssetType.THUMBNAIL, url: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=600&fit=crop' },
                    { language: 'en', variant: AssetVariant.LANDSCAPE, assetType: LessonAssetType.THUMBNAIL, url: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&h=400&fit=crop' },
                ],
            },
        },
    });

    // P1 Term 2
    const t2 = await prisma.term.create({
        data: { programId: p1.id, termNumber: 2, title: 'Backend API', description: 'Node & Express' },
    });

    // L4: Draft
    await prisma.lesson.create({
        data: {
            termId: t2.id,
            lessonNumber: 1,
            title: 'Node.js Runtime',
            contentType: ContentType.ARTICLE,
            durationMs: 300000,
            contentLanguagePrimary: 'en',
            contentLanguagesAvailable: ['en'],
            contentUrlsByLanguage: { en: 'https://nodejs.org' },
            status: LessonStatus.DRAFT,
            assets: {
                create: [
                    { language: 'en', variant: AssetVariant.PORTRAIT, assetType: LessonAssetType.THUMBNAIL, url: 'https://images.unsplash.com/photo-1627398242454-45aa433ec778?w=400&h=600&fit=crop' },
                    { language: 'en', variant: AssetVariant.LANDSCAPE, assetType: LessonAssetType.THUMBNAIL, url: 'https://images.unsplash.com/photo-1627398242454-45aa433ec778?w=600&h=400&fit=crop' },
                ]
            }
        },
    });


    // 4. Program 2: Cinematography
    console.log('Creating Program 2...');
    const p2 = await prisma.program.create({
        data: {
            title: 'Cinematography Masterclass',
            description: 'How to create a movie from script to screen.',
            languagePrimary: 'en',
            languagesAvailable: ['en'],
            status: ProgramStatus.PUBLISHED,
            publishedAt: new Date(),
            topics: { connect: [{ id: arts.id }] },
            assets: {
                create: [
                    { language: 'en', variant: AssetVariant.PORTRAIT, assetType: ProgramAssetType.POSTER, url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=800&fit=crop' },
                    { language: 'en', variant: AssetVariant.LANDSCAPE, assetType: ProgramAssetType.POSTER, url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=600&fit=crop' },
                ],
            },
        },
    });

    const p2t1 = await prisma.term.create({
        data: { programId: p2.id, termNumber: 1, title: 'The Basics' },
    });

    // L5
    await prisma.lesson.create({
        data: {
            termId: p2t1.id,
            lessonNumber: 1,
            title: 'Camera Angles',
            contentType: ContentType.VIDEO,
            durationMs: 600000,
            contentLanguagePrimary: 'en',
            contentLanguagesAvailable: ['en'],
            contentUrlsByLanguage: { en: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
            status: LessonStatus.PUBLISHED,
            publishedAt: new Date(),
            assets: {
                create: [
                    { language: 'en', variant: AssetVariant.PORTRAIT, assetType: LessonAssetType.THUMBNAIL, url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=600&fit=crop' },
                    { language: 'en', variant: AssetVariant.LANDSCAPE, assetType: LessonAssetType.THUMBNAIL, url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e63?w=600&h=400&fit=crop' },
                ],
            },
        },
    });

    // L6
    await prisma.lesson.create({
        data: {
            termId: p2t1.id,
            lessonNumber: 2,
            title: 'Lighting Setup',
            contentType: ContentType.VIDEO,
            durationMs: 800000,
            contentLanguagePrimary: 'en',
            contentLanguagesAvailable: ['en'],
            contentUrlsByLanguage: { en: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
            status: LessonStatus.PUBLISHED,
            publishedAt: new Date(),
            assets: {
                create: [
                    { language: 'en', variant: AssetVariant.PORTRAIT, assetType: LessonAssetType.THUMBNAIL, url: 'https://images.unsplash.com/photo-1517849645529-1783354bd843?w=400&h=600&fit=crop' },
                    { language: 'en', variant: AssetVariant.LANDSCAPE, assetType: LessonAssetType.THUMBNAIL, url: 'https://images.unsplash.com/photo-1517849645529-1783354bd843?w=600&h=400&fit=crop' },
                ],
            },
        },
    });

    console.log('✅ Seed processing finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
