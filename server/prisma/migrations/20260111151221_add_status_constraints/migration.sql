-- Add constraint to programs: If status is 'PUBLISHED', published_at must not be null
ALTER TABLE "programs" ADD CONSTRAINT "programs_status_published_at_check" 
CHECK ("status" != 'PUBLISHED' OR "published_at" IS NOT NULL);

-- Add constraint to lessons: If status is 'PUBLISHED', published_at must not be null
-- Note: Lessons have both 'publish_at' (scheduled) and 'published_at' (actual). 
-- This check ensures that if it is officially PUBLISHED, it has a published date.
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_status_published_at_check" 
CHECK ("status" != 'PUBLISHED' OR "published_at" IS NOT NULL);