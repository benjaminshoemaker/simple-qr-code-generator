"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

interface QRGeneratorProps {
  className?: string;
}

// Create a simple store for the QR data URL
function createQRStore() {
  let dataUrl = "";
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => dataUrl,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setDataUrl: (url: string) => {
      dataUrl = url;
      listeners.forEach((l) => l());
    },
  };
}

const qrStore = createQRStore();

export function QRGenerator({ className }: QRGeneratorProps) {
  const [url, setUrl] = useState("");
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>("M");
  const [size, setSize] = useState(256);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const qrDataUrl = useSyncExternalStore(qrStore.subscribe, qrStore.getSnapshot, qrStore.getSnapshot);

  // Generate QR code when dependencies change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!url || !canvas) {
      qrStore.setDataUrl("");
      return;
    }

    let cancelled = false;

    QRCode.toCanvas(canvas, url, {
      width: size,
      errorCorrectionLevel: errorCorrection,
      margin: 2,
    })
      .then(() => {
        if (!cancelled && canvas) {
          const dataUrl = canvas.toDataURL("image/png");
          qrStore.setDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          qrStore.setDataUrl("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, size, errorCorrection]);

  return (
    <div className={className}>
      <div className="space-y-4">
        <div>
          <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-1">
            Enter URL
          </label>
          <Input
            id="url-input"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="error-correction"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Error Correction
            </label>
            <Select
              id="error-correction"
              value={errorCorrection}
              onChange={(e) => setErrorCorrection(e.target.value as ErrorCorrectionLevel)}
            >
              <option value="L">Low (L) - 7%</option>
              <option value="M">Medium (M) - 15%</option>
              <option value="Q">Quartile (Q) - 25%</option>
              <option value="H">High (H) - 30%</option>
            </Select>
          </div>

          <div>
            <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
              Size
            </label>
            <Select id="size" value={size} onChange={(e) => setSize(Number(e.target.value))}>
              <option value={128}>128 × 128</option>
              <option value={256}>256 × 256</option>
              <option value={512}>512 × 512</option>
              <option value={1024}>1024 × 1024</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <div
          className="bg-white p-4 rounded-lg border border-gray-200"
          style={{ minHeight: size + 32, minWidth: size + 32 }}
        >
          {url ? (
            <canvas ref={canvasRef} />
          ) : (
            <div
              className="flex items-center justify-center text-gray-400"
              style={{ width: size, height: size }}
            >
              Enter a URL to generate QR code
            </div>
          )}
        </div>

        {qrDataUrl && <p className="mt-2 text-sm text-gray-500">QR code ready for download</p>}
      </div>
    </div>
  );
}
