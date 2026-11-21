import { Lock } from "lucide-react";
import AppText from "@/components/ui/AppText";

type Props = { message?: string };

export default function PermissionNotice({
  message = "You need permission to view this. Please log in as a contributor.",
}: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-white/60 p-8 text-center">
      <Lock className="h-6 w-6 text-primary" />
      <AppText>{message}</AppText>
    </div>
  );
}