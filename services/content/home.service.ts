import { apiClient } from "../api-client";

export type HomeChild = {
  id: string;
  title: string;
  referenceId: string;
  imageUrl: string | null;
};

export type HomeItem = HomeChild & {
  summary: string | null;
  layout: string;
  itemVariant: string;
  mediaRatio: string;
  children: HomeChild[];
};

export const getHome = () => apiClient<HomeItem[]>("/api/content/home");