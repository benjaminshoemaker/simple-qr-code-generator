"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrCreateForm } from "@/components/qr/qr-create-form";
import QRCode from "qrcode";
import { buildQrFilename, QrDownloadFormat } from "@/lib/qr-format";
import { QrCreateFieldErrors, validateQrCreate } from "@/lib/qr-validation";

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

interface Folder {
  id: string;
  name: string;
}

export default function CreateQRPage() {
  const router = useRouter();
  const [destinationUrl, setDestinationUrl] = useState("");
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<QrCreateFieldErrors>({});
  const [createdQR, setCreatedQR] = useState<{
    id: string;
    shortCode: string;
    shortUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const qrData = useSyncExternalStore(qrStore.subscribe, qrStore.getSnapshot, qrStore.getSnapshot);

  // Load folders on mount
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const response = await fetch("/api/folders");
        if (response.ok) {
          const data = await response.json();
          setFolders(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load folders:", err);
      }
    };
    loadFolders();
  }, []);

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
      const validationErrors = validateQrCreate(destinationUrl);
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        setError("Please fix the highlighted fields");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationUrl,
          name: name || undefined,
          folderId: folderId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create QR code");
        return;
      }

      setCreatedQR({
        id: data.id,
        shortCode: data.shortCode,
        shortUrl: data.shortUrl,
      });
    } catch {
      setError("An unexpected error occurred");
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

  const handleDownload = (format: QrDownloadFormat) => {
    if (!createdQR) return;

    const timestamp = Date.now();
    const filename = buildQrFilename(createdQR.shortCode, timestamp, format);

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

  const handleCreateAnother = () => {
    setDestinationUrl("");
    setName("");
    setFolderId("");
    setCreatedQR(null);
    qrStore.setData("", "");
  };

  return (
    <div className="max-w-2xl mx-auto">
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

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {createdQR ? "QR Code Created!" : "Create New QR Code"}
        </h1>

        {createdQR ? (
          // Success state with QR preview
          <div className="text-center">
            {qrData.dataUrl && (
              <div className="mb-6">
                <img
                  src={qrData.dataUrl}
                  alt="Generated QR Code"
                  className="mx-auto w-64 h-64 border rounded-lg"
                />
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Your short URL:</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-lg font-mono text-blue-600 bg-blue-50 px-4 py-2 rounded">
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
              <Button variant="outline" onClick={handleCreateAnother}>
                Create Another
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
          <QrCreateForm
            destinationUrl={destinationUrl}
            name={name}
            folderId={folderId}
            folders={folders}
            isLoading={isLoading}
            error={error}
            fieldErrors={fieldErrors}
            submitLabel="Create QR Code"
            cancelLabel="Cancel"
            onSubmit={handleSubmit}
            onCancel={() => router.push("/dashboard")}
            onDestinationUrlChange={setDestinationUrl}
            onNameChange={setName}
            onFolderChange={setFolderId}
          />
        )}
      </div>
    </div>
  );
}
