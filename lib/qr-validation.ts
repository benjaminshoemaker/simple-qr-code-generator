export type QrCreateFieldErrors = {
  destinationUrl?: string;
  name?: string;
  folderId?: string;
};

export function validateQrCreate(destinationUrl: string): QrCreateFieldErrors {
  const trimmed = destinationUrl.trim();
  if (!trimmed) {
    return { destinationUrl: "Destination URL is required" };
  }

  try {
    new URL(trimmed);
  } catch {
    return { destinationUrl: "Please enter a valid URL" };
  }

  return {};
}
