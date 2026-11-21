import React from "react";
import AppText from "@/components/ui/AppText";

export type AuthMode = "login" | "register";

type AuthTabsProps = {
  value: AuthMode;
  onChange: (mode: AuthMode) => void;
};

const tabs: AuthMode[] = ["login", "register"];

export default function AuthTabs({ value, onChange }: AuthTabsProps) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-premium/70 p-1">
      {tabs.map((mode) => {
        const isActive = value === mode;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`rounded-md py-1 transition-colors ${
              isActive ? "bg-premium shadow-sm" : "hover:bg-premium/50"
            }`}
          >
            <AppText
              as="span"
              variant="body"
              className={`text-xs capitalize ${
                isActive ? "text-text-primary" : "text-text-secondary"
              }`}
            >
              {mode}
            </AppText>
          </button>
        );
      })}
    </div>
  );
}