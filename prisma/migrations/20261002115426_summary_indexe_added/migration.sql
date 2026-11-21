-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN     "summary" TEXT;

-- CreateIndex
CREATE INDEX "ContentBlock_contentItemId_idx" ON "ContentBlock"("contentItemId");

-- CreateIndex
CREATE INDEX "ContentItem_parentId_idx" ON "ContentItem"("parentId");

-- CreateIndex
CREATE INDEX "GalleryItem_contentBlockId_idx" ON "GalleryItem"("contentBlockId");

-- CreateIndex
CREATE INDEX "HomeSectionItem_contentItemId_idx" ON "HomeSectionItem"("contentItemId");
