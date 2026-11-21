import { cookies } from "next/headers";
import { getCurrentUser } from "@/src/lib/auth/session";

export async function getloggedUser() {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    return null;
  }

  return getCurrentUser(sessionToken);
}