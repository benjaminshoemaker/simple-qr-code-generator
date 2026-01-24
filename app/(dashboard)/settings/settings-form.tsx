"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage, getApiFieldError } from "@/lib/errors";

type SettingsUser = {
  id: string;
  email: string;
  name: string | null;
};

export function SettingsForm({
  user,
  providers,
}: {
  user: SettingsUser;
  providers: string[];
}) {
  const toast = useToast();
  const [name, setName] = useState(user.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string }>({});

  const handleSave = async () => {
    setError(null);
    setFieldErrors({});
    setIsSaving(true);

    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const message = getApiErrorMessage(data) || "Failed to update settings";
        setError(message);
        setFieldErrors({
          name: getApiFieldError(data, "name") || undefined,
        });
        toast.error(message);
        return;
      }

      toast.success("Settings updated");
    } catch {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input value={user.email} disabled />
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
            className={fieldErrors.name ? "border-red-500" : ""}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Connected providers
            </p>
          </div>

          {providers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {providers.map((provider) => (
                <span
                  key={provider}
                  className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full"
                >
                  {formatProvider(provider)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No OAuth providers connected.
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
          <Link
            href="/billing"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Go to billing
          </Link>

          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatProvider(provider: string): string {
  switch (provider) {
    case "google":
      return "Google";
    default:
      return provider;
  }
}

