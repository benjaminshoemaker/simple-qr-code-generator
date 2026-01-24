"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRCode from "qrcode";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage, getApiFieldError } from "@/lib/errors";

interface QRCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders?: { id: string; name: string }[];
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

export function QRCreateModal({ isOpen, onClose, folders = [] }: QRCreateModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [destinationUrl, setDestinationUrl] = useState("");
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    destinationUrl?: string;
    name?: string;
    folderId?: string;
  }>({});
  const [createdQR, setCreatedQR] = useState<{
    id: string;
    shortCode: string;
    shortUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const qrData = useSyncExternalStore(qrStore.subscribe, qrStore.getSnapshot, qrStore.getSnapshot);

  // Generate QR code preview when URL changes
  useEffect(() => {
    if (!createdQR?.shortUrl) {
      qrStore.setData("", "");
      return;
    }

    const generateQR = async () => {
      try {
        const [pngUrl, svgStr] = await Promise.all([
          QRCode.toDataURL(createdQR.shortUrl, {
            width: 256,
            margin: 2,
            errorCorrectionLevel: "M",
          }),
          QRCode.toString(createdQR.shortUrl, {
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
  }, [createdQR?.shortUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const response = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationUrl,
          name: name || undefined,
          folderId: folderId || undefined,
        }),
      });

      const data = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const message = getApiErrorMessage(data) || "Failed to create QR code";
        setError(message);
        setFieldErrors({
          destinationUrl: getApiFieldError(data, "destinationUrl") || undefined,
          name: getApiFieldError(data, "name") || undefined,
          folderId: getApiFieldError(data, "folderId") || undefined,
        });
        toast.error(message);
        return;
      }

      const created = data as {
        id?: unknown;
        shortCode?: unknown;
        shortUrl?: unknown;
      };

      if (
        !created ||
        typeof created.id !== "string" ||
        typeof created.shortCode !== "string" ||
        typeof created.shortUrl !== "string"
      ) {
        throw new Error("Invalid create QR response");
      }

      toast.success("QR code created");
      setCreatedQR({
        id: created.id,
        shortCode: created.shortCode,
        shortUrl: created.shortUrl,
      });
    } catch {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!createdQR?.shortUrl) return;
    try {
      await navigator.clipboard.writeText(createdQR.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = (format: "png" | "svg") => {
    if (!createdQR) return;

    const timestamp = Date.now();
    const filename = `qr-code-${createdQR.shortCode}-${timestamp}.${format}`;

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

  const handleClose = () => {
    setDestinationUrl("");
    setName("");
    setFolderId("");
    setError(null);
    setCreatedQR(null);
    qrStore.setData("", "");
    onClose();
    if (createdQR) {
      router.refresh(); // Refresh the list if a QR was created
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {createdQR ? "QR Code Created!" : "Create New QR Code"}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {createdQR ? (
            // Success state with QR preview
            <div className="text-center">
              {qrData.dataUrl && (
                <div className="mb-6">
                  <img
                    src={qrData.dataUrl}
                    alt="Generated QR Code"
                    className="mx-auto w-48 h-48 border rounded-lg"
                  />
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Your short URL:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-lg font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded">
                    {createdQR.shortUrl}
                  </code>
                  <button
                    onClick={handleCopyUrl}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Copy URL"
                  >
                    {copied ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-center mb-6">
                <Button
                  variant="outline"
                  onClick={() => handleDownload("png")}
                  disabled={!qrData.dataUrl}
                >
                  Download PNG
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownload("svg")}
                  disabled={!qrData.svgString}
                >
                  Download SVG
                </Button>
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push(`/qr/${createdQR.id}`)}
                >
                  View Details
                </Button>
              </div>
            </div>
          ) : (
            // Creation form
            <form onSubmit={handleSubmit}>
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
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://example.com"
                    required
                    disabled={isLoading}
                    className={fieldErrors.destinationUrl ? "border-red-500" : ""}
                  />
                  {fieldErrors.destinationUrl && (
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
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My QR Code"
                    disabled={isLoading}
                    className={fieldErrors.name ? "border-red-500" : ""}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.name}
                    </p>
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
                      onChange={(e) => setFolderId(e.target.value)}
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
                <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create QR Code"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
