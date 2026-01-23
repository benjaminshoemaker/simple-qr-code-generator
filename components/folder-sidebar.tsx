"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Folder {
  id: string;
  name: string;
  qrCount: number;
}

interface FolderSidebarProps {
  folders: Folder[];
  currentFolderId?: string | null;
}

export function FolderSidebar({ folders, currentFolderId }: FolderSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = (folderId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (folderId) {
      params.set("folderId", folderId);
    } else {
      params.delete("folderId");
    }
    params.delete("page"); // Reset pagination when changing folders
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create folder");
        return;
      }

      setNewFolderName("");
      setIsCreating(false);
      // Refresh the page to show the new folder
      window.location.reload();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Delete folder "${folderName}"? QR codes in this folder will be moved to "All QR Codes".`)) {
      return;
    }

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete folder");
        return;
      }

      window.location.reload();
    } catch {
      alert("An unexpected error occurred");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Folders</h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="text-gray-400 hover:text-gray-600"
          title="Create folder"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateFolder} className="mb-4">
          {error && (
            <p className="text-xs text-red-600 mb-2">{error}</p>
          )}
          <div className="flex gap-2">
            <Input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              disabled={isLoading}
              className="text-sm"
            />
            <Button type="submit" variant="primary" size="sm" disabled={isLoading || !newFolderName.trim()}>
              {isLoading ? "..." : "Add"}
            </Button>
          </div>
        </form>
      )}

      <nav className="space-y-1">
        <Link
          href={buildUrl(null)}
          className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
            !currentFolderId
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            All QR Codes
          </span>
        </Link>

        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`group flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
              currentFolderId === folder.id
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Link
              href={buildUrl(folder.id)}
              className="flex items-center gap-2 flex-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="truncate">{folder.name}</span>
              <span className="text-xs text-gray-400">({folder.qrCount})</span>
            </Link>
            <button
              onClick={() => handleDeleteFolder(folder.id, folder.name)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
              title="Delete folder"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </nav>
    </div>
  );
}
