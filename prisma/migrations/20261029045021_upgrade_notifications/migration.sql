/*
  Warnings:

  - Added the required column `title` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CONTENT_ADDED', 'TEST_ADDED', 'DOUBT_REPLY', 'REPLY_TO_REPLY', 'DOUBT_RESOLVED', 'DOUBT_PINNED', 'NEW_DOUBT', 'ROLE_REQUEST', 'ROLE_APPROVED', 'ROLE_DECLINED', 'SYSTEM');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "contentItemId" TEXT,
ADD COLUMN     "replyId" TEXT,
ADD COLUMN     "roleRequestId" TEXT,
ADD COLUMN     "testId" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- CreateTable
CREATE TABLE "NotificationRead" (
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("userId","notificationId")
);

-- CreateIndex
CREATE INDEX "NotificationRead_notificationId_idx" ON "NotificationRead"("notificationId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_testId_fkey" FOREIGN KEY ("testId") REFERENCES "GyaanTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_roleRequestId_fkey" FOREIGN KEY ("roleRequestId") REFERENCES "RoleRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
