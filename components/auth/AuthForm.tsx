"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  User,
  ArrowRight,
  Loader2,
} from "lucide-react";

import AppText from "@/components/ui/AppText";
import AppButton from "@/components/ui/AppButton";

import InputField from "./InputField";
import type { Role } from "./RoleSelector";
import type { AuthMode } from "./AuthTabs";

import { ApiError } from "@/services/api-client";
import { registerUser, loginUser } from "@/services/auth.service";
import { registerSchema, loginSchema } from "@/schemas/auth.schema";

type AuthFormProps = {
  mode: AuthMode;
  role: Role;
  onSwitchMode: (mode: AuthMode) => void;
};

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function AuthForm({ mode, role, onSwitchMode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const isRegister = mode === "register";

  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  }

  function clearServerError() {
    setServerError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    
    if (isSubmitting) return;

    setFieldErrors({});
    setServerError("");

    
    if (!isRegister) {
      const validation = loginSchema.safeParse({
        email,
        password,
        role,
      });

      if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;

        setFieldErrors({
          email: errors.email?.[0],
          password: errors.password?.[0],
        });

        return;
      }

      setIsSubmitting(true);

      try {
        const result = await loginUser(validation.data);

        console.log("Login successful:", result);

        setServerError("");
          window.location.replace("/");
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.code === "INVALID_CREDENTIALS") {
            setServerError("Invalid email or password");
            return;
          }

          if (error.code === "ACCOUNT_INACTIVE") {
            setServerError("Your account is inactive");
            return;
          }

          if (error.code === "ROLE_ACCESS_DENIED") {
            setServerError(error.message);
            return;
          }
        }

        setServerError("Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    // ---------- Register ----------
    const validation = registerSchema.safeParse({
      name,
      email,
      password,
      role,
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;

      setFieldErrors({
        name: errors.name?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
      });

      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({
        confirmPassword: "Passwords do not match",
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerUser(validation.data);

      console.log("Registration successful:", result);

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setFieldErrors({});
      setServerError("");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "EMAIL_ALREADY_EXISTS") {
          setFieldErrors({
            email: error.message,
          });

          return;
        }
      }

      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      {/* Name */}
      {isRegister && (
        <InputField
          icon={User}
          placeholder="Full name"
          value={name}
          error={fieldErrors.name}
          onChange={(event) => {
            clearFieldError("name");
            clearServerError();
            setName(event.target.value);
          }}
        />
      )}

      {/* Email */}
      <InputField
        icon={Mail}
        type="email"
        placeholder="Email address"
        value={email}
        error={fieldErrors.email}
        onChange={(event) => {
          clearFieldError("email");
          clearServerError();
          setEmail(event.target.value);
        }}
      />

      {/* Password */}
      <InputField
        icon={Lock}
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        value={password}
        error={fieldErrors.password}
        onChange={(event) => {
          clearFieldError("password");
          clearServerError();
          setPassword(event.target.value);
        }}
        trailing={
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((value) => !value)}
            className="text-text-secondary shrink-0"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        }
      />

      {/* Confirm Password */}
      {isRegister && (
        <InputField
          icon={Lock}
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirm password"
          value={confirmPassword}
          error={fieldErrors.confirmPassword}
          onChange={(event) => {
            clearFieldError("confirmPassword");
            clearServerError();
            setConfirmPassword(event.target.value);
          }}
          trailing={
            <button
              type="button"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="text-text-secondary shrink-0"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />
      )}

      {/* Forgot Password */}
      {!isRegister && (
        <div className="flex items-center justify-end flex-wrap gap-2">
          <AppText as="span" variant="meta">
            Forgot password?
          </AppText>
        </div>
      )}

      {/* Submit */}
      <AppButton
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-2.5 transition-all duration-150 active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isRegister ? (
          <UserPlus className="w-4 h-4" />
        ) : (
          <LogIn className="w-4 h-4" />
        )}

        {isSubmitting
          ? isRegister
            ? "Creating account..."
            : "Logging in..."
          : isRegister
            ? `Register as ${displayRole}`
            : `Login as ${displayRole}`}
      </AppButton>

      {/* General Server Error */}
      {serverError && (
        <AppText variant="meta" className="text-warning text-center">
          {serverError}
        </AppText>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-premium/70" />

        <AppText variant="small" className="text-text-secondary">
          OR
        </AppText>

        <div className="h-px flex-1 bg-premium/70" />
      </div>

      {/* Switch Login / Register */}
      <div className="flex items-center justify-center gap-2">
        <AppText variant="caption" className="text-primary font-normal">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
        </AppText>

        <button
          type="button"
          onClick={() => onSwitchMode(isRegister ? "login" : "register")}
          className="flex items-center gap-1"
        >
          <AppText as="span" variant="label">
            {isRegister ? "Login here" : "Register here"}
          </AppText>

          <ArrowRight className="w-3 h-3 text-accent" />
        </button>
      </div>
    </form>
  );
}