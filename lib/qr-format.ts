export type QrDownloadFormat = "png" | "svg";

export function buildQrFilename(
  shortCode: string,
  timestamp: number,
  format: QrDownloadFormat
): string {
  return `qr-code-${shortCode}-${timestamp}.${format}`;
}

export function formatQrDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
