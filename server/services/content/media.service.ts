import crypto from "crypto";
import prisma from "../../../src/lib/prisma";
import { presignUpload, presignGet, headFile, deleteFile } from "../../../src/lib/b2";
import { AppError } from "../../utils/app-error";
import { Prisma } from "../../../src/generated/prisma/client";

const MB = 1024 * 1024;
const DAY = 24 * 60 * 60 * 1000;

const ALLOWED = {
  "image/jpeg": { type: "IMAGE", ext: "jpg", max: 5 * MB },
  "image/png": { type: "IMAGE", ext: "png", max: 5 * MB },
  "image/webp": { type: "IMAGE", ext: "webp", max: 5 * MB },
  "application/pdf": { type: "PDF", ext: "pdf", max: 20 * MB },
} as const;

function getRule(mimeType: string) {
  const rule = ALLOWED[mimeType as keyof typeof ALLOWED];
  if (!rule) throw new AppError("FILE_TYPE_NOT_ALLOWED", "Only JPG, PNG, WEBP or PDF allowed", 400);
  return rule;
}

// upload url 
export async function createUploadUrl(input: { mimeType: string; size: number }) {
  const rule = getRule(input.mimeType);
  if (input.size > rule.max) {
    throw new AppError("FILE_TOO_LARGE", `Max size is ${rule.max / MB} MB`, 400);
  }

  const fileKey = `media/${crypto.randomUUID()}.${rule.ext}`; 
  const uploadUrl = await presignUpload(fileKey, input.mimeType);

  return { uploadUrl, fileKey };
}

// confirm upload
export async function confirmUpload(input: { fileKey: string; fileName: string }) {
  const file = await headFile(input.fileKey).catch(() => {
    throw new AppError("FILE_NOT_FOUND", "File was not uploaded", 400);
  });

  const rule = getRule(file.mimeType);
  if (file.size > rule.max) throw new AppError("FILE_TOO_LARGE", "File is too large", 400);

  const media = await prisma.media.create({
    data: {
      type: rule.type,
      fileKey: input.fileKey,
      fileName: input.fileName,
      mimeType: file.mimeType,
      size: file.size,
    },
  });

  return { id: media.id, type: media.type, url: await presignGet(media.fileKey) };
}


const unused = {
  heroFor: null,
  userAvatar: null,
  block: { none: {} },
  galleryItems: { none: {} },
  doubtImages: { none: {} },
  gyaanQuestions: { none: {} },
  gyaanAttemptImages: { none: {} },
} satisfies Prisma.MediaWhereInput;

export async function cleanupOrphanMedia() {
  const orphans = await prisma.media.findMany({
    where: { createdAt: { lt: new Date(Date.now() - DAY) }, ...unused },
    orderBy: { createdAt: "asc" },
    select: { id: true, fileKey: true },
    take: 200,
  });

  let deleted = 0;

  for (const m of orphans) {
    try {
     
      const { count } = await prisma.media.deleteMany({ where: { id: m.id, ...unused } });
      if (!count) continue;

      await deleteFile(m.fileKey);
      deleted++;
    } catch (error) {
      console.error("Cleanup failed for", m.fileKey, error);
    }
  }

  return { found: orphans.length, deleted };
}