"use client";
import React, { useState } from "react";
import { Sailboat, Pencil } from "lucide-react";
import AppText from "@/components/ui/AppText";
import type { Role } from "./RoleSelector";
import RoleSelector from "./RoleSelector";
import type { AuthMode } from "./AuthTabs";
import AuthTabs from "./AuthTabs";
import AuthForm from "./AuthForm";
export default function SikhYaanAuthPage() {
  const [role, setRole] = useState<Role>("learner");
  const [mode, setMode] = useState<AuthMode>("login");
  return (
    <div className="w-full  max-w-lg  md:max-w-4xl lg:max-w-5xl sm:p-0  p-3 mx-auto   ">
      <div className="rounded-lg border border-primary/20  bg-premium overflow-hidden flex   shadow-sm">
        {/* Left image panel */}

        <div className="relative w-full md:max-w-1/2 h-140 md:block hidden">
          <img
            src="/authpage_img.png"
            alt="Sikh community"
            onError={(e) =>
              ((e.target as HTMLImageElement).style.display = "none")
            }
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Right auth panel */}

        <div className="relative w-full lg:w-1/2 p-3 sm:p-4 flex flex-col gap-2 bg-linear-to-br from-[#f6f1e4] to-[#f0e2c0] overflow-hidden">
          <img
            src="/Auth_img.jpg"
            alt=""
            onError={(e) =>
              ((e.target as HTMLImageElement).style.display = "none")
            }
            className="absolute top-0 right-0 w-2/3 h-32 object-cover opacity-30 pointer-events-none"
          />

          <div className="relative z-10  flex   flex-col  gap-4 px-1 sm:px-4 py-2">
            <div className="flex flex-col  gap-1 text-center sm:text-left mb-4">
              <AppText as="h1" variant="heading" className="text-text-primary">
                Welcome to SikhYaan
              </AppText>
              <AppText variant="meta2" className="text-accent/55 ">
                Discover, learn and connect with Sikh heritage. Choose your role
                to continue.
              </AppText>
            </div>

            <RoleSelector value={role} onChange={setRole} />

            <AuthTabs value={mode} onChange={setMode} />

            <AuthForm mode={mode} role={role} onSwitchMode={setMode} />
          </div>
        </div>
      </div>
    </div>
  );
}
