import {
    PrismaClient,
    Role,
    ProgramStatus,
    LessonStatus,
    ContentType,
    AssetVariant,
    ProgramAssetType,
    LessonAssetType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ---------------------------------------------------------------------------
    // CLEANUP
    // ---------------------------------------------------------------------------
    await prisma.lessonAsset.deleteMany();
    await prisma.programAsset.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.term.deleteMany();
    await prisma.program.deleteMany();
    await prisma.topic.deleteMany();

    // ---------------------------------------------------------------------------
    // USERS
    // ---------------------------------------------------------------------------
    const password = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: { email: 'admin@example.com', password, role: Role.ADMIN },
    });

    await prisma.user.upsert({
        where: { email: 'editor@example.com' },
        update: {},
        create: { email: 'editor@example.com', password, role: Role.EDITOR },
    });

    // ---------------------------------------------------------------------------
    // TOPICS
    // ---------------------------------------------------------------------------
    const csTopic = await prisma.topic.create({ data: { name: 'Computer Science' } });
    const aiTopic = await prisma.topic.create({ data: { name: 'Artificial Intelligence' } });
    const webTopic = await prisma.topic.create({ data: { name: 'Web Development' } });

    // ===========================================================================
    // PROGRAM 1 — Computer Science Fundamentals
    // ===========================================================================
    const csProgram = await prisma.program.create({
        data: {
            title: 'Computer Science Fundamentals',
            description:
                'Learn the foundational concepts of algorithms, data structures, and computational thinking.',
            languagePrimary: 'en',
            languagesAvailable: ['en'],
            status: ProgramStatus.PUBLISHED,
            updatedAt: new Date(Date.now() + 10000), // Force top sort
            publishedAt: new Date(),
            topics: { connect: [{ id: csTopic.id }] },
            assets: {
                create: [
                    {
                        language: 'en',
                        variant: AssetVariant.PORTRAIT,
                        assetType: ProgramAssetType.POSTER,
                        url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4',
                    },
                    {
                        language: 'en',
                        variant: AssetVariant.LANDSCAPE,
                        assetType: ProgramAssetType.POSTER,
                        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
                    },
                ],
            },
        },
    });

    const csTerm = await prisma.term.create({
        data: { programId: csProgram.id, termNumber: 1, title: 'Algorithm Basics' },
    });

    // Lesson 1: Big O (Multi-lang + Assets)
    await prisma.lesson.create({
        data: {
            termId: csTerm.id,
            lessonNumber: 1,
            title: 'Big O Notation',
            description:
                'Understand time and space complexity and how Big O notation evaluates algorithm efficiency.',
            contentType: ContentType.VIDEO,
            durationMs: 720000,
            contentLanguagePrimary: 'en',
            contentLanguagesAvailable: ['en', 'hi'],
            contentUrlsByLanguage: {
                en: 'https://www.youtube.com/watch?v=__vX2sjlpXU',
                hi: 'https://www.youtube.com/watch?v=9TlHvipP5yA',
            },
            status: LessonStatus.PUBLISHED,
            publishedAt: new Date(),
            assets: {
                create: [
                    {
                        language: 'en',
                        variant: AssetVariant.PORTRAIT,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
                    },
                    {
                        language: 'en',
                        variant: AssetVariant.LANDSCAPE,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd',
                    },
                ],
            },
        },
    });

    // Lesson 2: Sorting (Assets)
    await prisma.lesson.create({
        data: {
            termId: csTerm.id,
            lessonNumber: 2,
            title: 'Sorting Algorithms',
            description:
                'Learn how common sorting algorithms work and compare their performance characteristics.',
            contentType: ContentType.VIDEO,
            durationMs: 900000,
            contentLanguagePrimary: 'en',
            contentLanguagesAvailable: ['en'],
            contentUrlsByLanguage: {
                en: 'https://www.youtube.com/watch?v=kgBjXUE_Nwc',
            },
            status: LessonStatus.PUBLISHED,
            publishedAt: new Date(),
            assets: {
                create: [
                    {
                        language: 'en',
                        variant: AssetVariant.PORTRAIT,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://plus.unsplash.com/premium_photo-1701113010437-1709c96aa539?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGFpJTIwbWx8ZW58MHx8MHx8fDA%3D'
                    },
                    {
                        language: 'en',
                        variant: AssetVariant.LANDSCAPE,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://images.unsplash.com/photo-1526378722484-bd91ca387e72',
                    },
                ],
            },
        },
    });

    const csTerm2 = await prisma.term.create({
        data: { programId: csProgram.id, termNumber: 2, title: 'Advanced Data Structures' },
    });

    // Scheduled Lesson (Demo: Publishes in 2 mins)
    await prisma.lesson.create({
        data: {
            termId: csTerm2.id,
            lessonNumber: 1,
            title: 'Self-Balancing Trees',
            description: 'Introduction to AVL and Red-Black trees. This lesson is scheduled to go live soon.',
            contentType: ContentType.VIDEO,
            durationMs: 1200000,
            contentLanguagePrimary: 'en',
            contentLanguagesAvailable: ['en'],
            contentUrlsByLanguage: {
                en: 'https://www.youtube.com/watch?v=rcCn558_tx8',
            },
            status: LessonStatus.SCHEDULED,
            publishAt: new Date(Date.now() + 120000), // 2 minutes from now
            assets: {
                create: [
                    {
                        language: 'en',
                        variant: AssetVariant.PORTRAIT,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713',
                    },
                    {
                        language: 'en',
                        variant: AssetVariant.LANDSCAPE,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713',
                    },
                ],
            },
        },
    });

    // ===========================================================================
    // PROGRAM 2 — Applied AI & Machine Learning
    // ===========================================================================
    const aiProgram = await prisma.program.create({
        data: {
            title: 'Applied AI & Machine Learning',
            description:
                'A hands-on introduction to machine learning concepts and neural networks.',
            languagePrimary: 'en',
            languagesAvailable: ['en'],
            status: ProgramStatus.PUBLISHED,
            publishedAt: new Date(),
            topics: { connect: [{ id: aiTopic.id }] },
            assets: {
                create: [
                    {
                        language: 'en',
                        variant: AssetVariant.PORTRAIT,
                        assetType: ProgramAssetType.POSTER,
                        url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
                    },
                    {
                        language: 'en',
                        variant: AssetVariant.LANDSCAPE,
                        assetType: ProgramAssetType.POSTER,
                        url: 'https://plus.unsplash.com/premium_photo-1701113010437-1709c96aa539?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGFpJTIwbWx8ZW58MHx8MHx8fDA%3D',
                    },
                ],
            },
        },
    });

    const aiTerm = await prisma.term.create({
        data: { programId: aiProgram.id, termNumber: 1, title: 'Neural Networks' },
    });

    // Lesson 1: Perceptrons (Assets)
    await prisma.lesson.create({
        data: {
            termId: aiTerm.id,
            lessonNumber: 1,
            title: 'Perceptrons',
            description:
                'Learn how perceptrons act as the building blocks of neural networks.',
            contentType: ContentType.VIDEO,
            durationMs: 750000,
            contentLanguagePrimary: 'en',
            contentLanguagesAvailable: ['en'],
            contentUrlsByLanguage: {
                en: 'https://www.youtube.com/watch?v=ntKn5TPHHAk',
            },
            status: LessonStatus.PUBLISHED,
            publishedAt: new Date(),
            assets: {
                create: [
                    {
                        language: 'en',
                        variant: AssetVariant.PORTRAIT,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://images.unsplash.com/photo-1555255707-c07966088b7b',
                    },
                    {
                        language: 'en',
                        variant: AssetVariant.LANDSCAPE,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
                    },
                ],
            },
        },
    });

    // Lesson 2: Backpropagation (Multi-lang + Assets)
    await prisma.lesson.create({
        data: {
            termId: aiTerm.id,
            lessonNumber: 2,
            title: 'Backpropagation',
            description:
                'Understand how neural networks learn by propagating error gradients.',
            contentType: ContentType.VIDEO,
            durationMs: 950000,
            contentLanguagePrimary: 'en',
            contentLanguagesAvailable: ['en', 'hi'],
            contentUrlsByLanguage: {
                en: 'https://www.youtube.com/watch?v=Ilg3gGewQ5U',
                hi: 'https://www.youtube.com/watch?v=QYlC3a2U6nU',
            },
            status: LessonStatus.PUBLISHED,
            publishedAt: new Date(),
            assets: {
                create: [
                    {
                        language: 'en',
                        variant: AssetVariant.PORTRAIT,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31',
                    },
                    {
                        language: 'en',
                        variant: AssetVariant.LANDSCAPE,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
                    },
                ],
            },
        },
    });

    // ===========================================================================
    // PROGRAM 3 — Modern Web Development
    // ===========================================================================
    const webProgram = await prisma.program.create({
        data: {
            title: 'Modern Web Development',
            description:
                'Learn how modern web applications are built using HTML, CSS, JavaScript, and frameworks.',
            languagePrimary: 'en',
            languagesAvailable: ['en'],
            status: ProgramStatus.PUBLISHED,
            publishedAt: new Date(),
            topics: { connect: [{ id: webTopic.id }] },
            assets: {
                create: [
                    {
                        language: 'en',
                        variant: AssetVariant.PORTRAIT,
                        assetType: ProgramAssetType.POSTER,
                        url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
                    },
                    {
                        language: 'en',
                        variant: AssetVariant.LANDSCAPE,
                        assetType: ProgramAssetType.POSTER,
                        url: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f',
                    },
                ],
            },
        },
    });

    const webTerm = await prisma.term.create({
        data: { programId: webProgram.id, termNumber: 1, title: 'Frontend Foundations' },
    });

    // Lesson 1: Web Basics (Assets)
    await prisma.lesson.create({
        data: {
            termId: webTerm.id,
            lessonNumber: 1,
            title: 'How the Web Works',
            description:
                'Understand how browsers, servers, and HTTP work together to deliver web applications.',
            contentType: ContentType.VIDEO,
            durationMs: 600000,
            contentLanguagePrimary: 'en',
            contentLanguagesAvailable: ['en'],
            contentUrlsByLanguage: {
                en: 'https://www.youtube.com/watch?v=guvsH5OFizE',
            },
            status: LessonStatus.PUBLISHED,
            publishedAt: new Date(),
            assets: {
                create: [
                    {
                        language: 'en',
                        variant: AssetVariant.PORTRAIT,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://images.unsplash.com/photo-1547658719-da2b51169166',
                    },
                    {
                        language: 'en',
                        variant: AssetVariant.LANDSCAPE,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://images.unsplash.com/photo-1547658719-da2b51169166',
                    },
                ],
            },
        },
    });

    // Lesson 2: React Intro (Assets)
    await prisma.lesson.create({
        data: {
            termId: webTerm.id,
            lessonNumber: 2,
            title: 'Introduction to React',
            description:
                'Learn the basics of React and how component-based UIs are built.',
            contentType: ContentType.VIDEO,
            durationMs: 840000,
            contentLanguagePrimary: 'en',
            contentLanguagesAvailable: ['en'],
            contentUrlsByLanguage: {
                en: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
            },
            status: LessonStatus.PUBLISHED,
            publishedAt: new Date(),
            assets: {
                create: [
                    {
                        language: 'en',
                        variant: AssetVariant.PORTRAIT,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
                    },
                    {
                        language: 'en',
                        variant: AssetVariant.LANDSCAPE,
                        assetType: LessonAssetType.THUMBNAIL,
                        url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
                    },
                ],
            },
        },
    });

    console.log('✅ Seed completed successfully');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
