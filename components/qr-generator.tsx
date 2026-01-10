"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

interface QRGeneratorProps {
  className?: string;
}

// Create a simple store for the QR data URL
function createQRStore() {
  let dataUrl = "";
  let svgString = "";
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => ({ dataUrl, svgString }),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setData: (png: string, svg: string) => {
      dataUrl = png;
      svgString = svg;
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

  const { dataUrl: qrDataUrl, svgString: qrSvgString } = useSyncExternalStore(
    qrStore.subscribe,
    qrStore.getSnapshot,
    qrStore.getSnapshot
  );

  // Generate QR code when dependencies change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!url || !canvas) {
      qrStore.setData("", "");
      return;
    }

    let cancelled = false;

    const options = {
      width: size,
      errorCorrectionLevel: errorCorrection,
      margin: 2,
    };

    Promise.all([
      QRCode.toCanvas(canvas, url, options),
      QRCode.toString(url, { ...options, type: "svg" as const }),
    ])
      .then(([, svgStr]) => {
        if (!cancelled && canvas) {
          const pngDataUrl = canvas.toDataURL("image/png");
          qrStore.setData(pngDataUrl, svgStr);
        }
      })
      .catch(() => {
        if (!cancelled) {
          qrStore.setData("", "");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, size, errorCorrection]);

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;

    const timestamp = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-code-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSVG = () => {
    if (!qrSvgString) return;

    const timestamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([qrSvgString], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = svgUrl;
    link.download = `qr-code-${timestamp}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(svgUrl);
  };

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

        {qrDataUrl && (
          <div className="mt-4 flex gap-3">
            <Button onClick={handleDownloadPNG} variant="primary">
              Download PNG
            </Button>
            <Button onClick={handleDownloadSVG} variant="outline">
              Download SVG
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
