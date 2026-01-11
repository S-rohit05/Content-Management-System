-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'ARTICLE');

-- CreateEnum
CREATE TYPE "AssetVariant" AS ENUM ('PORTRAIT', 'LANDSCAPE', 'SQUARE', 'BANNER');

-- CreateEnum
CREATE TYPE "ProgramAssetType" AS ENUM ('POSTER');

-- CreateEnum
CREATE TYPE "LessonAssetType" AS ENUM ('THUMBNAIL', 'SUBTITLE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "language_primary" TEXT NOT NULL,
    "languages_available" TEXT[],
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "term_number" INTEGER NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "term_id" TEXT NOT NULL,
    "lesson_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "duration_ms" INTEGER,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "content_language_primary" TEXT NOT NULL,
    "content_languages_available" TEXT[],
    "content_urls_by_language" JSONB NOT NULL,
    "subtitle_languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subtitle_urls_by_language" JSONB,
    "status" "LessonStatus" NOT NULL DEFAULT 'DRAFT',
    "publish_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_assets" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "variant" "AssetVariant" NOT NULL,
    "asset_type" "ProgramAssetType" NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "program_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_assets" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "variant" "AssetVariant" NOT NULL,
    "asset_type" "LessonAssetType" NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "lesson_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProgramToTopic" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "topics_name_key" ON "topics"("name");

-- CreateIndex
CREATE INDEX "programs_status_language_primary_published_at_idx" ON "programs"("status", "language_primary", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "terms_program_id_term_number_key" ON "terms"("program_id", "term_number");

-- CreateIndex
CREATE INDEX "lessons_status_publish_at_idx" ON "lessons"("status", "publish_at");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_term_id_lesson_number_key" ON "lessons"("term_id", "lesson_number");

-- CreateIndex
CREATE UNIQUE INDEX "program_assets_program_id_language_variant_asset_type_key" ON "program_assets"("program_id", "language", "variant", "asset_type");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_assets_lesson_id_language_variant_asset_type_key" ON "lesson_assets"("lesson_id", "language", "variant", "asset_type");

-- CreateIndex
CREATE UNIQUE INDEX "_ProgramToTopic_AB_unique" ON "_ProgramToTopic"("A", "B");

-- CreateIndex
CREATE INDEX "_ProgramToTopic_B_index" ON "_ProgramToTopic"("B");

-- AddForeignKey
ALTER TABLE "terms" ADD CONSTRAINT "terms_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_assets" ADD CONSTRAINT "program_assets_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_assets" ADD CONSTRAINT "lesson_assets_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramToTopic" ADD CONSTRAINT "_ProgramToTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramToTopic" ADD CONSTRAINT "_ProgramToTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
