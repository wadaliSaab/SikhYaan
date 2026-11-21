export type UserRole = "guest" | "learner" | "contributor" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string; 
  avatarUrl: string | null;
};