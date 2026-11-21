/*
  Warnings:

  - You are about to drop the column `imageUrlSnapshot` on the `GyaanAttemptAnswer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GyaanAttemptAnswer" DROP COLUMN "imageUrlSnapshot";

-- CreateIndex
CREATE INDEX "GyaanAttemptAnswer_imageMediaIdSnapshot_idx" ON "GyaanAttemptAnswer"("imageMediaIdSnapshot");

-- AddForeignKey
ALTER TABLE "GyaanAttemptAnswer" ADD CONSTRAINT "GyaanAttemptAnswer_imageMediaIdSnapshot_fkey" FOREIGN KEY ("imageMediaIdSnapshot") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
