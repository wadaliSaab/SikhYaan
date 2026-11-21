/*
  Warnings:

  - The `status` column on the `GyaanAttempt` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `answer` on the `GyaanAttemptAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `GyaanQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `GyaanQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `explanation` on the `GyaanQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `GyaanQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `GyaanQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `GyaanTest` table. All the data in the column will be lost.
  - You are about to drop the column `instructions` on the `GyaanTest` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `GyaanTest` table. All the data in the column will be lost.
  - You are about to drop the column `questionCount` on the `GyaanTest` table. All the data in the column will be lost.
  - You are about to drop the column `timePerQuestion` on the `GyaanTest` table. All the data in the column will be lost.
  - The `difficulty` column on the `GyaanTest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `GyaanTest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `GyaanTestCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GyaanTestQuestion` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[attemptId,order]` on the table `GyaanAttemptAnswer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[testId,order]` on the table `GyaanQuestion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categorySnapshot` to the `GyaanAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `difficultySnapshot` to the `GyaanAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationMinutesSnapshot` to the `GyaanAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `GyaanAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionCount` to the `GyaanAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `testTitleSnapshot` to the `GyaanAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `GyaanAttempt` table without a default value. This is not possible if the table is not empty.
  - Made the column `score` on table `GyaanAttempt` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalMarks` on table `GyaanAttempt` required. This step will fail if there are existing NULL values in that column.
  - Made the column `percentage` on table `GyaanAttempt` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `marksPossible` to the `GyaanAttemptAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `GyaanAttemptAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionTextSnapshot` to the `GyaanAttemptAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionTypeSnapshot` to the `GyaanAttemptAnswer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `GyaanQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `testId` to the `GyaanQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `GyaanQuestion` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `GyaanQuestion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `category` to the `GyaanTest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationMinutes` to the `GyaanTest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GyaanTestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GyaanQuestionType" AS ENUM ('MCQ', 'FILL', 'IMAGE');

-- CreateEnum
CREATE TYPE "GyaanDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "GyaanAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT', 'ABANDONED');

-- DropForeignKey
ALTER TABLE "GyaanAttemptAnswer" DROP CONSTRAINT "GyaanAttemptAnswer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "GyaanQuestion" DROP CONSTRAINT "GyaanQuestion_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "GyaanTest" DROP CONSTRAINT "GyaanTest_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "GyaanTestQuestion" DROP CONSTRAINT "GyaanTestQuestion_questionId_fkey";

-- DropForeignKey
ALTER TABLE "GyaanTestQuestion" DROP CONSTRAINT "GyaanTestQuestion_testId_fkey";

-- DropIndex
DROP INDEX "GyaanAttempt_testId_status_idx";

-- DropIndex
DROP INDEX "GyaanAttempt_userId_createdAt_idx";

-- DropIndex
DROP INDEX "GyaanAttemptAnswer_attemptId_questionId_key";

-- DropIndex
DROP INDEX "GyaanQuestion_categoryId_isActive_idx";

-- DropIndex
DROP INDEX "GyaanQuestion_type_idx";

-- DropIndex
DROP INDEX "GyaanTest_categoryId_status_idx";

-- AlterTable
ALTER TABLE "GyaanAttempt" ADD COLUMN     "categorySnapshot" TEXT NOT NULL,
ADD COLUMN     "correctAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "difficultySnapshot" "GyaanDifficulty" NOT NULL,
ADD COLUMN     "durationMinutesSnapshot" INTEGER NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "questionCount" INTEGER NOT NULL,
ADD COLUMN     "testTitleSnapshot" TEXT NOT NULL,
ADD COLUMN     "timeTakenSeconds" INTEGER,
ADD COLUMN     "unansweredAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "wrongAnswers" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "GyaanAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
ALTER COLUMN "score" SET NOT NULL,
ALTER COLUMN "score" SET DEFAULT 0,
ALTER COLUMN "totalMarks" SET NOT NULL,
ALTER COLUMN "percentage" SET NOT NULL,
ALTER COLUMN "percentage" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "GyaanAttemptAnswer" DROP COLUMN "answer",
ADD COLUMN     "answerText" TEXT,
ADD COLUMN     "answeredAt" TIMESTAMP(3),
ADD COLUMN     "correctAnswerSnapshot" TEXT,
ADD COLUMN     "correctOptionIndexSnapshot" INTEGER,
ADD COLUMN     "imageMediaIdSnapshot" TEXT,
ADD COLUMN     "imageUrlSnapshot" TEXT,
ADD COLUMN     "marksPossible" INTEGER NOT NULL,
ADD COLUMN     "optionsSnapshot" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "order" INTEGER NOT NULL,
ADD COLUMN     "questionTextSnapshot" TEXT NOT NULL,
ADD COLUMN     "questionTypeSnapshot" "GyaanQuestionType" NOT NULL,
ADD COLUMN     "selectedOptionIndex" INTEGER,
ALTER COLUMN "questionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "GyaanQuestion" DROP COLUMN "categoryId",
DROP COLUMN "content",
DROP COLUMN "explanation",
DROP COLUMN "isActive",
DROP COLUMN "prompt",
ADD COLUMN     "correctAnswer" TEXT,
ADD COLUMN     "correctOptionIndex" INTEGER,
ADD COLUMN     "imageMediaId" TEXT,
ADD COLUMN     "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "order" INTEGER NOT NULL,
ADD COLUMN     "testId" TEXT NOT NULL,
ADD COLUMN     "text" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "GyaanQuestionType" NOT NULL;

-- AlterTable
ALTER TABLE "GyaanTest" DROP COLUMN "categoryId",
DROP COLUMN "instructions",
DROP COLUMN "isActive",
DROP COLUMN "questionCount",
DROP COLUMN "timePerQuestion",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "durationMinutes" INTEGER NOT NULL,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "GyaanDifficulty" NOT NULL DEFAULT 'BEGINNER',
DROP COLUMN "status",
ADD COLUMN     "status" "GyaanTestStatus" NOT NULL DEFAULT 'DRAFT';

-- DropTable
DROP TABLE "GyaanTestCategory";

-- DropTable
DROP TABLE "GyaanTestQuestion";

-- CreateIndex
CREATE INDEX "GyaanAttempt_userId_startedAt_idx" ON "GyaanAttempt"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "GyaanAttempt_testId_startedAt_idx" ON "GyaanAttempt"("testId", "startedAt");

-- CreateIndex
CREATE INDEX "GyaanAttempt_userId_testId_idx" ON "GyaanAttempt"("userId", "testId");

-- CreateIndex
CREATE INDEX "GyaanAttempt_status_expiresAt_idx" ON "GyaanAttempt"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "GyaanAttemptAnswer_questionId_idx" ON "GyaanAttemptAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "GyaanAttemptAnswer_attemptId_order_key" ON "GyaanAttemptAnswer"("attemptId", "order");

-- CreateIndex
CREATE INDEX "GyaanQuestion_testId_idx" ON "GyaanQuestion"("testId");

-- CreateIndex
CREATE INDEX "GyaanQuestion_imageMediaId_idx" ON "GyaanQuestion"("imageMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "GyaanQuestion_testId_order_key" ON "GyaanQuestion"("testId", "order");

-- CreateIndex
CREATE INDEX "GyaanTest_status_category_idx" ON "GyaanTest"("status", "category");

-- AddForeignKey
ALTER TABLE "GyaanQuestion" ADD CONSTRAINT "GyaanQuestion_imageMediaId_fkey" FOREIGN KEY ("imageMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GyaanQuestion" ADD CONSTRAINT "GyaanQuestion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "GyaanTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GyaanAttemptAnswer" ADD CONSTRAINT "GyaanAttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "GyaanQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
