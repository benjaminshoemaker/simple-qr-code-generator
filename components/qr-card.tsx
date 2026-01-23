"use client";

import Link from "next/link";
import { useState } from "react";

interface QRCardProps {
  id: string;
  shortCode: string;
  shortUrl: string;
  destinationUrl: string;
  name: string | null;
  scanCount: number;
  isActive: boolean;
  createdAt: string;
}

export function QRCard({
  id,
  shortCode,
  shortUrl,
  destinationUrl,
  name,
  scanCount,
  isActive,
  createdAt,
}: QRCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/qr/${id}`}
              className="text-lg font-medium text-gray-900 hover:text-blue-600 truncate"
            >
              {name || shortCode}
            </Link>
            {!isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                Inactive
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <code className="text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {shortCode}
            </code>
            <button
              onClick={handleCopyUrl}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Copy short URL"
            >
              {copied ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <p className="text-sm text-gray-500 truncate" title={destinationUrl}>
            → {truncateUrl(destinationUrl)}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-gray-900">{scanCount}</div>
          <div className="text-xs text-gray-500">scans</div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Created {formatDate(createdAt)}
        </span>
        <Link
          href={`/qr/${id}`}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
