-- AlterEnum
ALTER TYPE "public"."NotificationType" ADD VALUE 'MENTION';

-- CreateTable
CREATE TABLE "public"."user_mentions" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "mentionedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_mentions_commentId_idx" ON "public"."user_mentions"("commentId");

-- CreateIndex
CREATE INDEX "user_mentions_mentionedUserId_idx" ON "public"."user_mentions"("mentionedUserId");

-- CreateIndex
CREATE INDEX "user_mentions_createdAt_idx" ON "public"."user_mentions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_mentions_commentId_mentionedUserId_key" ON "public"."user_mentions"("commentId", "mentionedUserId");

-- AddForeignKey
ALTER TABLE "public"."user_mentions" ADD CONSTRAINT "user_mentions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."task_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_mentions" ADD CONSTRAINT "user_mentions_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
