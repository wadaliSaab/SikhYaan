import React from "react";

import GyaanTestOverview from "@/components/gyaanTest/overview/GyaanTestOverview";

export default function Home() {
  return (
    <div className="bg-background/65 w-screen  h-dvh min-w-0 flex flex-col overflow-y-auto hide-scrollbar ">
      <GyaanTestOverview viewMode="user" canCreateTest={true} />
    </div>
  );
}
