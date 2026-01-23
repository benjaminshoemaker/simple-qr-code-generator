"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/tag-input";
import QRCode from "qrcode";

interface QRCodeData {
  id: string;
  shortCode: string;
  shortUrl: string;
  destinationUrl: string;
  name: string | null;
  folderId: string | null;
  isActive: boolean;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Folder {
  id: string;
  name: string;
}

interface QREditFormProps {
  qrCode: QRCodeData;
  folders: Folder[];
}

// QR code store for managing async generation
function createQRStore() {
  let snapshot = { dataUrl: "", svgString: "" };
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setData: (png: string, svg: string) => {
      if (snapshot.dataUrl !== png || snapshot.svgString !== svg) {
        snapshot = { dataUrl: png, svgString: svg };
        listeners.forEach((l) => l());
      }
    },
  };
}

const qrStore = createQRStore();

export function QREditForm({ qrCode, folders }: QREditFormProps) {
  const router = useRouter();
  const [destinationUrl, setDestinationUrl] = useState(qrCode.destinationUrl);
  const [name, setName] = useState(qrCode.name || "");
  const [folderId, setFolderId] = useState(qrCode.folderId || "");
  const [isActive, setIsActive] = useState(qrCode.isActive);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const qrData = useSyncExternalStore(qrStore.subscribe, qrStore.getSnapshot, qrStore.getSnapshot);

  // Generate QR code preview on mount
  useEffect(() => {
    const generateQR = async () => {
      try {
        const [pngUrl, svgStr] = await Promise.all([
          QRCode.toDataURL(qrCode.shortUrl, {
            width: 256,
            margin: 2,
            errorCorrectionLevel: "M",
          }),
          QRCode.toString(qrCode.shortUrl, {
            type: "svg",
            margin: 2,
            errorCorrectionLevel: "M",
          }),
        ]);
        qrStore.setData(pngUrl, svgStr);
      } catch (err) {
        console.error("Failed to generate QR code:", err);
      }
    };

    generateQR();
  }, [qrCode.shortUrl]);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/qr/${qrCode.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationUrl,
          name: name || null,
          folderId: folderId || null,
          isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update QR code");
        return;
      }

      setSuccess("QR code updated successfully");
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/qr/${qrCode.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete QR code");
        setShowDeleteConfirm(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setShowDeleteConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrCode.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = (format: "png" | "svg") => {
    const timestamp = Date.now();
    const filename = `qr-code-${qrCode.shortCode}-${timestamp}.${format}`;

    if (format === "png" && qrData.dataUrl) {
      const link = document.createElement("a");
      link.download = filename;
      link.href = qrData.dataUrl;
      link.click();
    } else if (format === "svg" && qrData.svgString) {
      const blob = new Blob([qrData.svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - QR code preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
            {qrData.dataUrl ? (
              <img
                src={qrData.dataUrl}
                alt="QR Code"
                className="w-full aspect-square border rounded-lg mb-4"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-400">Loading...</span>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Short URL</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded flex-1 truncate">
                  {qrCode.shortUrl}
                </code>
                <button
                  onClick={handleCopyUrl}
                  className="p-1.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
                  title="Copy URL"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleDownload("png")}
                disabled={!qrData.dataUrl}
              >
                PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleDownload("svg")}
                disabled={!qrData.svgString}
              >
                SVG
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
              <div className="flex justify-between mb-1">
                <span>Total Scans</span>
                <span className="font-medium text-gray-900">{qrCode.scanCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Created</span>
                <span>{formatDate(qrCode.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Edit form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Edit QR Code
            </h1>

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
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isSaving}
                />
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
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My QR Code"
                  disabled={isSaving}
                />
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
                    onChange={(e) => setFolderId(e.target.value)}
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

              <TagInput qrCodeId={qrCode.id} />

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                      disabled={isSaving}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Active
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-14">
                  When disabled, scanning this QR code will show a &quot;gone&quot; page
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving || isLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                Delete QR Code
              </Button>

              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete QR Code?
            </h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. The short URL will stop working immediately.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDelete}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
