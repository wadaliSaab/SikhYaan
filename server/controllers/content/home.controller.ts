import { getHomeItems } from "@/server/services/content/home.service";
import { successResponse } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/handle-error";


export async function getHomeController() {
  try {
    return successResponse(await getHomeItems(), "Home loaded", 200);
  } catch (error) {
    return handleError(error, "Load home error:");
  }
}