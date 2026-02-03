"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QrDeleteModal } from "@/components/qr/qr-delete-modal";
import { QrEditPanel } from "@/components/qr/qr-edit-panel";
import { QrPreviewPanel } from "@/components/qr/qr-preview-panel";
import QRCode from "qrcode";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage, getApiFieldError } from "@/lib/errors";
import { buildQrFilename, QrDownloadFormat } from "@/lib/qr-format";

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
  const toast = useToast();
  const [destinationUrl, setDestinationUrl] = useState(qrCode.destinationUrl);
  const [name, setName] = useState(qrCode.name || "");
  const [folderId, setFolderId] = useState(qrCode.folderId || "");
  const [isActive, setIsActive] = useState(qrCode.isActive);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    destinationUrl?: string;
    name?: string;
    folderId?: string;
  }>({});
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const qrData = useSyncExternalStore(
    qrStore.subscribe,
    qrStore.getSnapshot,
    qrStore.getSnapshot
  );

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
    setFieldErrors({});
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

      const data = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const message = getApiErrorMessage(data) || "Failed to update QR code";
        setError(message);
        setFieldErrors({
          destinationUrl: getApiFieldError(data, "destinationUrl") || undefined,
          name: getApiFieldError(data, "name") || undefined,
          folderId: getApiFieldError(data, "folderId") || undefined,
        });
        toast.error(message);
        return;
      }

      setSuccess("QR code updated successfully");
      toast.success("QR code updated");
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
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
        const data = (await response.json().catch(() => null)) as unknown;
        const message = getApiErrorMessage(data) || "Failed to delete QR code";
        setError(message);
        toast.error(message);
        setShowDeleteConfirm(false);
        return;
      }

      toast.success("QR code deleted");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
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

  const handleDownload = (format: QrDownloadFormat) => {
    const timestamp = Date.now();
    const filename = buildQrFilename(qrCode.shortCode, timestamp, format);

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
          <QrPreviewPanel
            shortUrl={qrCode.shortUrl}
            scanCount={qrCode.scanCount}
            createdAt={qrCode.createdAt}
            dataUrl={qrData.dataUrl}
            svgString={qrData.svgString}
            copied={copied}
            onCopyUrl={handleCopyUrl}
            onDownload={handleDownload}
          />
        </div>

        {/* Right column - Edit form */}
        <div className="lg:col-span-2">
          <QrEditPanel
            qrCodeId={qrCode.id}
            destinationUrl={destinationUrl}
            name={name}
            folderId={folderId}
            folders={folders}
            isActive={isActive}
            isSaving={isSaving}
            isLoading={isLoading}
            error={error}
            success={success}
            fieldErrors={fieldErrors}
            onDestinationUrlChange={setDestinationUrl}
            onNameChange={setName}
            onFolderChange={setFolderId}
            onActiveChange={setIsActive}
            onRequestDelete={() => setShowDeleteConfirm(true)}
            onSave={handleSave}
          />
        </div>
      </div>

      <QrDeleteModal
        isOpen={showDeleteConfirm}
        isLoading={isLoading}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
