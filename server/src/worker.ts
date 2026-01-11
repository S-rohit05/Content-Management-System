import cron from 'node-cron';
import { prisma } from './lib/prisma';
import { LessonStatus, ProgramStatus } from '@prisma/client';

console.log('👷 Worker started...');

// Run every minute
cron.schedule('* * * * *', async () => {
    console.log('⏰ Running scheduled publishing job...');
    try {
        await publishScheduledLessons();
    } catch (error) {
        console.error('❌ Error in worker job:', error);
    }
});

async function publishScheduledLessons() {
    const now = new Date();

    // 1. Find and Updated Scheduled Lessons using SKIP LOCKED for concurrency safety
    // We use $queryRawUnsafe because $queryRaw requires template literals which can be tricky with dynamic updates,
    // but here we have fixed constants so it's fine.
    // We return the updated lesson IDs and Term IDs to handle Program updates.

    // Note: Prisma Enum handling in raw queries can be tricky, casting often needed.
    // We'll select IDs first then update via Prisma to be safe, OR use raw update.
    // Raw update is safer for atomicity with SKIP LOCKED.

    const updatedLessons = await prisma.$queryRaw<Array<{ id: string, term_id: string }>>`
    UPDATE "lessons"
    SET "status" = 'PUBLISHED', "published_at" = ${now}, "updated_at" = ${now}
    WHERE "id" IN (
      SELECT "id"
      FROM "lessons"
      WHERE "status" = 'SCHEDULED'
        AND "publish_at" <= ${now}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING "id", "term_id"
  `;

    if (updatedLessons.length > 0) {
        console.log(`✅ Published ${updatedLessons.length} lessons.`);

        // 2. Update parent Programs if needed
        // "A Program automatically becomes published when it has >= 1 published lesson"

        // Get unique program IDs affected
        const termIds = updatedLessons.map(l => l.term_id);
        const terms = await prisma.term.findMany({
            where: { id: { in: termIds } },
            select: { programId: true }
        });

        const programIds = [...new Set(terms.map(t => t.programId))];

        for (const programId of programIds) {
            // Check if program is already published
            const program = await prisma.program.findUnique({ where: { id: programId } });

            if (program && program.status !== ProgramStatus.PUBLISHED) {
                await prisma.program.update({
                    where: { id: programId },
                    data: {
                        status: ProgramStatus.PUBLISHED,
                        publishedAt: program.publishedAt || now, // Set only if not already set (though logic says it becomes published, so checking status != PUBLISHED implies publishedAt might be null or we strictly set it on first publish)
                        // Req: "set program.published_at only once (first publish)"
                    }
                });
                console.log(`🚀 Auto-published Program ${programId}`);
            }
        }
    } else {
        console.log('💤 No lessons to publish.');
    }
}
