"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignupValidationErrors } from "@/lib/auth-validation";

interface SignupFieldsProps {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  isLoading: boolean;
  error: string | null;
  validationErrors: SignupValidationErrors;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClearError: (field: keyof SignupValidationErrors) => void;
}

export function SignupFields({
  email,
  password,
  confirmPassword,
  name,
  isLoading,
  error,
  validationErrors,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onClearError,
}: SignupFieldsProps) {
  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name <span className="text-gray-400">(optional)</span>
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Your name"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              onEmailChange(e.target.value);
              onClearError("email");
            }}
            placeholder="you@example.com"
            required
            disabled={isLoading}
            className={validationErrors.email ? "border-red-500" : ""}
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              onPasswordChange(e.target.value);
              onClearError("password");
            }}
            placeholder="Create a password"
            required
            disabled={isLoading}
            className={validationErrors.password ? "border-red-500" : ""}
          />
          {validationErrors.password && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.password}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            8+ characters with uppercase, lowercase, and number
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              onConfirmPasswordChange(e.target.value);
              onClearError("confirmPassword");
            }}
            placeholder="Confirm your password"
            required
            disabled={isLoading}
            className={validationErrors.confirmPassword ? "border-red-500" : ""}
          />
          {validationErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Sign up"}
        </Button>
      </form>
    </>
  );
}
