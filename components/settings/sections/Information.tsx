"use client";

import { useRouter } from "next/navigation";
import { Info, User } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
import Card from "../Card";
import IconCircle from "../IconCircle";
import AppText from "@/components/ui/AppText";


const GUEST_ID = "GUEST-48291";

type Role = "guest" | "learner" | "contributor" | "admin";

export default function Information({ role }: { role: Role }) {
  const router = useRouter();

  return (
    <section className="space-y-3 flex flex-col ">
      <AppText variant="title" as="h2">Information</AppText>
       {role === "guest" ? (
        <Card
          icon={<IconCircle icon={User} tone="gold" />}
          value={GUEST_ID}
          title="Your guest ID"
          description="Login or register to ask doubts, take tests and contribute."
        >
          <div className="flex gap-2">
            <AppButton onClick={() => router.push("/auth")}>Login</AppButton>
            <AppButton variant="outline" onClick={() => router.push("/auth")}>Register</AppButton>
          </div>
        </Card>
      ) : (
        <Card
          icon={<IconCircle icon={Info} tone="slate" />}
          title="About this platform"
          description="Learn Sikh history, ask doubts, take Gyaan tests and contribute content."
        />
      )}
   
    </section>
   
  );
}