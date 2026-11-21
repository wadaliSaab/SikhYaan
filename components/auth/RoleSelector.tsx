import React from "react";
import { GraduationCap, Users, ShieldCheck } from "lucide-react";
import AppText from "@/components/ui/AppText";

export type Role = "learner" | "contributor" | "admin";

type RoleOption = {
  key: Role;
  icon: React.ElementType;
  label: string;
  description: string;
};

const roles: RoleOption[] = [
  {
    key: "learner",
    icon: GraduationCap,
    label: "As Learner",
    description: "Explore, learn and take tests",
  },
  {
    key: "contributor",
    icon: Users,
    label: "As Contributor",
    description: "Share knowledge, add content",
  },
  {
    key: "admin",
    icon: ShieldCheck,
    label: "As Admin",
    description: "Manage platform and users",
  },
];

type RoleSelectorProps = {
  value: Role;
  onChange: (role: Role) => void;
};

export default function RoleSelector({
  value,
  onChange,
}: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {roles.map((role) => {
        const Icon = role.icon;
        const isActive = value === role.key;

        return (
          <button
            key={role.key}
            type="button"
            onClick={() => onChange(role.key)}
            className={
              `flex  lg:flex-row flex-col items-center sm:gap-2 p-2  gap-1 rounded-xl border sm:px-4 lg:py-3 text-center transition-colors ${
                isActive
                  ? "border-primary bg-primary/8"
                  : "border-primary/30 bg-premium hover:border-primary/60"
              }`
            }
          >
            <Icon
              className={
                `w-4 h-4 ${
                  isActive ? "text-primary" : "text-accent/90"
                }`
              }
            />

            <AppText
              as="span"
              variant="body"
              className={
                `sm:text-2xs text-3xs  ${
                  isActive ? "text-primary" : "text-accent/75"
                }`
              }
            >
              {role.label}
            </AppText>

          </button>
        );
      })}
    </div>
  );
}