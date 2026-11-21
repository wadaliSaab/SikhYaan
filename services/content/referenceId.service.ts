import { apiClient } from "../api-client";

export type GenerateReferenceIdData = {
  title: string;
  parentId?: string;
  id?: string;
};

export type GenerateReferenceIdResponse = {
  referenceId: string;
};

const REFERENCE_ID_ENDPOINT = "/api/content/referenceId";

export async function generateReferenceId(
  data: GenerateReferenceIdData
): Promise<GenerateReferenceIdResponse> {
  return apiClient<GenerateReferenceIdResponse>(
    REFERENCE_ID_ENDPOINT,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}