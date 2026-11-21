import { presignGet } from "@/src/lib/b2";

const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL;


const WORKER_FILE = /^(media|doubts)\/[\w-]+\.(jpg|png|webp)$/;

export async function mediaUrl(fileKey: string): Promise<string> {
  if (MEDIA_URL && WORKER_FILE.test(fileKey)) {
    return `${MEDIA_URL}/${fileKey}`;
  }
  return presignGet(fileKey);
}

type StoredFile = { fileKey: string };


export async function withUrl<T extends StoredFile>(file: T) {
  return { ...file, url: await mediaUrl(file.fileKey) };
}

export async function withUrlOrNull<T extends StoredFile>(
  file: T | null | undefined,
) {
  return file ? withUrl(file) : null;
}