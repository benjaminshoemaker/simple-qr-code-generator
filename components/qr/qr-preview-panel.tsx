"use client";

import { Button } from "@/components/ui/button";
import { formatQrDate, QrDownloadFormat } from "@/lib/qr-format";

interface QrPreviewPanelProps {
  shortUrl: string;
  scanCount: number;
  createdAt: string;
  dataUrl: string;
  svgString: string;
  copied: boolean;
  onCopyUrl: () => void;
  onDownload: (format: QrDownloadFormat) => void;
}

export function QrPreviewPanel({
  shortUrl,
  scanCount,
  createdAt,
  dataUrl,
  svgString,
  copied,
  onCopyUrl,
  onDownload,
}: QrPreviewPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
      {dataUrl ? (
        <img
          src={dataUrl}
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
            {shortUrl}
          </code>
          <button
            onClick={onCopyUrl}
            className="p-1.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
            title="Copy URL"
          >
            {copied ? (
              <svg
                className="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
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
          onClick={() => onDownload("png")}
          disabled={!dataUrl}
        >
          PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onDownload("svg")}
          disabled={!svgString}
        >
          SVG
        </Button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
        <div className="flex justify-between mb-1">
          <span>Total Scans</span>
          <span className="font-medium text-gray-900">{scanCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Created</span>
          <span>{formatQrDate(createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
