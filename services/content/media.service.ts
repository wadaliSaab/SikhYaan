import { apiClient } from "../api-client";

export type UploadUrlResponse = { uploadUrl: string; fileKey: string };
export type ConfirmedMedia = { id: string; url: string };

const UPLOAD_URL_ENDPOINT = "/api/content/media/upload/url";
const CONFIRM_ENDPOINT = "/api/content/media/upload/verify";

export function getUploadUrl(file: File) {
  return apiClient<UploadUrlResponse>(UPLOAD_URL_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, mimeType: file.type, size: file.size }),
  });
}

export function confirmUpload(fileKey: string, fileName: string) {
  return apiClient<ConfirmedMedia>(CONFIRM_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ fileKey, fileName }),
  });
}