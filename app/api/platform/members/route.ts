import {
  listMembersController,
  memberActionController,
} from "@/server/controllers/settings/member.controller";

export const GET = listMembersController;
export const POST = memberActionController;