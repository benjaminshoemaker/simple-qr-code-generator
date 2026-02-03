"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/tag-input";

interface Folder {
  id: string;
  name: string;
}

interface QrEditPanelProps {
  qrCodeId: string;
  destinationUrl: string;
  name: string;
  folderId: string;
  folders: Folder[];
  isActive: boolean;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  fieldErrors: {
    destinationUrl?: string;
    name?: string;
    folderId?: string;
  };
  onDestinationUrlChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onFolderChange: (value: string) => void;
  onActiveChange: (value: boolean) => void;
  onRequestDelete: () => void;
  onSave: () => void;
}

export function QrEditPanel({
  qrCodeId,
  destinationUrl,
  name,
  folderId,
  folders,
  isActive,
  isSaving,
  isLoading,
  error,
  success,
  fieldErrors,
  onDestinationUrlChange,
  onNameChange,
  onFolderChange,
  onActiveChange,
  onRequestDelete,
  onSave,
}: QrEditPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit QR Code</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="destinationUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Destination URL
          </label>
          <Input
            id="destinationUrl"
            type="url"
            value={destinationUrl}
            onChange={(e) => onDestinationUrlChange(e.target.value)}
            placeholder="https://example.com"
            disabled={isSaving}
            className={fieldErrors.destinationUrl ? "border-red-500" : ""}
          />
          {fieldErrors.destinationUrl && (
            <p className="mt-1 text-sm text-red-600">
              {fieldErrors.destinationUrl}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Change where this QR code redirects to
          </p>
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
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="My QR Code"
            disabled={isSaving}
            className={fieldErrors.name ? "border-red-500" : ""}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        {folders.length > 0 && (
          <div>
            <label
              htmlFor="folder"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Folder
            </label>
            <select
              id="folder"
              value={folderId}
              onChange={(e) => onFolderChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving}
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

        <TagInput qrCodeId={qrCodeId} />

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => onActiveChange(e.target.checked)}
                className="sr-only peer"
                disabled={isSaving}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
          <p className="mt-1 text-xs text-gray-500 ml-14">
            When disabled, scanning this QR code will show a &quot;gone&quot;
            page
          </p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onRequestDelete}
          disabled={isSaving || isLoading}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          Delete QR Code
        </Button>

        <Button variant="primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
