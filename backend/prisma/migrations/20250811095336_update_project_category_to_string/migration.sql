/*
  Warnings:

  - The `category` column on the `projects` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."projects" DROP COLUMN "category",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'DEV';

-- DropEnum
DROP TYPE "public"."ProjectCategory";

-- CreateIndex
CREATE INDEX "projects_category_idx" ON "public"."projects"("category");
