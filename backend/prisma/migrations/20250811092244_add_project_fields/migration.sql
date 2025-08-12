-- CreateEnum
CREATE TYPE "public"."ProjectCategory" AS ENUM ('DEV', 'SEO', 'AI', 'SOCIAL_MEDIA', 'GRAPHICS', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('TODO', 'DOING', 'WAITING_FOR_APPROVAL', 'STALLED', 'CANCELLED', 'WAITING_ON_CLIENT', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."projects" ADD COLUMN     "category" "public"."ProjectCategory" NOT NULL DEFAULT 'DEV',
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" "public"."ProjectStatus" NOT NULL DEFAULT 'TODO';

-- CreateIndex
CREATE INDEX "projects_category_idx" ON "public"."projects"("category");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "public"."projects"("status");

-- CreateIndex
CREATE INDEX "projects_startDate_idx" ON "public"."projects"("startDate");

-- CreateIndex
CREATE INDEX "projects_endDate_idx" ON "public"."projects"("endDate");
