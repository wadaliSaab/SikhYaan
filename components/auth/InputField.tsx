import React, { useState } from "react";

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ElementType;
  trailing?: React.ReactNode;
  error?: string;
};

export default function InputField({
  icon: Icon,
  trailing,
  error,
  onFocus,
  onBlur,
  ...props
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const showError = Boolean(error) && !focused;

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border bg-premium px-3 py-2 ${
        error ? "border-warning/60" : "border-primary/25"
      }`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 mt-1 ${
          error ? "text-error" : "text-text-secondary"
        }`}
      />

      <div className="relative flex-1 min-w-0">
        {showError && (
          <div
            role="alert"
            className="pointer-events-none absolute inset-0 flex items-center text-sm text-warning truncate"
          >
            <span className="truncate">{error}</span>
          </div>
        )}

        <input
          {...props}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          aria-invalid={Boolean(error)}
          className={`w-full min-w-0 bg-transparent text-sm outline-none ${
            showError
              ? "text-transparent caret-transparent placeholder:text-transparent"
              : "text-accent placeholder:text-text-secondary"
          }`}
        />
      </div>

      {trailing && <div className="shrink-0 mt-1">{trailing}</div>}
    </div>
  );
}