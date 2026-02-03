"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCreateFieldErrors } from "@/lib/qr-validation";

interface Folder {
  id: string;
  name: string;
}

interface QrCreateFormProps {
  destinationUrl: string;
  name: string;
  folderId: string;
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  fieldErrors?: QrCreateFieldErrors;
  submitLabel: string;
  cancelLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onDestinationUrlChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onFolderChange: (value: string) => void;
}

export function QrCreateForm({
  destinationUrl,
  name,
  folderId,
  folders,
  isLoading,
  error,
  fieldErrors,
  submitLabel,
  cancelLabel,
  onSubmit,
  onCancel,
  onDestinationUrlChange,
  onNameChange,
  onFolderChange,
}: QrCreateFormProps) {
  return (
    <form onSubmit={onSubmit}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="destinationUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Destination URL <span className="text-red-500">*</span>
          </label>
          <Input
            id="destinationUrl"
            type="url"
            value={destinationUrl}
            onChange={(e) => onDestinationUrlChange(e.target.value)}
            placeholder="https://example.com"
            required
            disabled={isLoading}
            className={fieldErrors?.destinationUrl ? "border-red-500" : ""}
          />
          {fieldErrors?.destinationUrl && (
            <p className="mt-1 text-sm text-red-600">
              {fieldErrors.destinationUrl}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            The URL where your QR code will redirect to
          </p>
        </div>

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
            placeholder="My QR Code"
            disabled={isLoading}
            className={fieldErrors?.name ? "border-red-500" : ""}
          />
          {fieldErrors?.name && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            A friendly name to help you identify this QR code
          </p>
        </div>

        {folders.length > 0 && (
          <div>
            <label
              htmlFor="folder"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Folder <span className="text-gray-400">(optional)</span>
            </label>
            <select
              id="folder"
              value={folderId}
              onChange={(e) => onFolderChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? "Creating..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
