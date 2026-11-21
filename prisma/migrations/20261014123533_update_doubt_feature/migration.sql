-- DropIndex
DROP INDEX "Doubt_createdAt_idx";

-- AlterTable
ALTER TABLE "Doubt" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referencedContentItemId" TEXT;

-- AlterTable
ALTER TABLE "Reply" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentReplyId" TEXT,
ADD COLUMN     "replyToId" TEXT;

-- CreateTable
CREATE TABLE "DoubtBookmark" (
    "userId" TEXT NOT NULL,
    "doubtId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoubtBookmark_pkey" PRIMARY KEY ("userId","doubtId")
);

-- CreateTable
CREATE TABLE "ReplyLike" (
    "userId" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplyLike_pkey" PRIMARY KEY ("userId","replyId")
);

-- CreateTable
CREATE TABLE "GyaanTestCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GyaanTestCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GyaanQuestion" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "explanation" TEXT,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GyaanQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GyaanTest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "timePerQuestion" INTEGER NOT NULL,
    "instructions" JSONB NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GyaanTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GyaanTestQuestion" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "GyaanTestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GyaanAttempt" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in-progress',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,
    "totalMarks" INTEGER,
    "percentage" DOUBLE PRECISION,

    CONSTRAINT "GyaanAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GyaanAttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "marksAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GyaanAttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoubtBookmark_userId_createdAt_idx" ON "DoubtBookmark"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DoubtBookmark_doubtId_idx" ON "DoubtBookmark"("doubtId");

-- CreateIndex
CREATE INDEX "ReplyLike_replyId_createdAt_idx" ON "ReplyLike"("replyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GyaanTestCategory_name_key" ON "GyaanTestCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GyaanTestCategory_slug_key" ON "GyaanTestCategory"("slug");

-- CreateIndex
CREATE INDEX "GyaanTestCategory_isActive_idx" ON "GyaanTestCategory"("isActive");

-- CreateIndex
CREATE INDEX "GyaanQuestion_categoryId_isActive_idx" ON "GyaanQuestion"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "GyaanQuestion_createdById_idx" ON "GyaanQuestion"("createdById");

-- CreateIndex
CREATE INDEX "GyaanQuestion_type_idx" ON "GyaanQuestion"("type");

-- CreateIndex
CREATE INDEX "GyaanTest_categoryId_status_idx" ON "GyaanTest"("categoryId", "status");

-- CreateIndex
CREATE INDEX "GyaanTest_createdById_idx" ON "GyaanTest"("createdById");

-- CreateIndex
CREATE INDEX "GyaanTest_createdAt_idx" ON "GyaanTest"("createdAt");

-- CreateIndex
CREATE INDEX "GyaanTestQuestion_testId_sortOrder_idx" ON "GyaanTestQuestion"("testId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "GyaanTestQuestion_testId_questionId_key" ON "GyaanTestQuestion"("testId", "questionId");

-- CreateIndex
CREATE INDEX "GyaanAttempt_userId_createdAt_idx" ON "GyaanAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GyaanAttempt_testId_status_idx" ON "GyaanAttempt"("testId", "status");

-- CreateIndex
CREATE INDEX "GyaanAttemptAnswer_attemptId_idx" ON "GyaanAttemptAnswer"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "GyaanAttemptAnswer_attemptId_questionId_key" ON "GyaanAttemptAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "Doubt_isActive_isPinned_createdAt_idx" ON "Doubt"("isActive", "isPinned", "createdAt");

-- CreateIndex
CREATE INDEX "Doubt_isActive_isResolved_createdAt_idx" ON "Doubt"("isActive", "isResolved", "createdAt");

-- CreateIndex
CREATE INDEX "Doubt_referencedContentItemId_idx" ON "Doubt"("referencedContentItemId");

-- CreateIndex
CREATE INDEX "DoubtCategory_isActive_name_idx" ON "DoubtCategory"("isActive", "name");

-- CreateIndex
CREATE INDEX "DoubtLike_doubtId_createdAt_idx" ON "DoubtLike"("doubtId", "createdAt");

-- CreateIndex
CREATE INDEX "Reply_parentReplyId_createdAt_idx" ON "Reply"("parentReplyId", "createdAt");

-- CreateIndex
CREATE INDEX "Reply_replyToId_idx" ON "Reply"("replyToId");

-- CreateIndex
CREATE INDEX "Reply_doubtId_isPinned_createdAt_idx" ON "Reply"("doubtId", "isPinned", "createdAt");

-- AddForeignKey
ALTER TABLE "Doubt" ADD CONSTRAINT "Doubt_referencedContentItemId_fkey" FOREIGN KEY ("referencedContentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Reply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtBookmark" ADD CONSTRAINT "DoubtBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtBookmark" ADD CONSTRAINT "DoubtBookmark_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "Doubt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplyLike" ADD CONSTRAINT "ReplyLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplyLike" ADD CONSTRAINT "ReplyLike_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GyaanQuestion" ADD CONSTRAINT "GyaanQuestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GyaanTestCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GyaanQuestion" ADD CONSTRAINT "GyaanQuestion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GyaanTest" ADD CONSTRAINT "GyaanTest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GyaanTestCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GyaanTest" ADD CONSTRAINT "GyaanTest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GyaanTestQuestion" ADD CONSTRAINT "GyaanTestQuestion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "GyaanTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GyaanTestQuestion" ADD CONSTRAINT "GyaanTestQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "GyaanQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GyaanAttempt" ADD CONSTRAINT "GyaanAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "GyaanTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GyaanAttempt" ADD CONSTRAINT "GyaanAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GyaanAttemptAnswer" ADD CONSTRAINT "GyaanAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "GyaanAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GyaanAttemptAnswer" ADD CONSTRAINT "GyaanAttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "GyaanQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
