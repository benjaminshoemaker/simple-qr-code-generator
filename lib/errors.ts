export type ApiErrorResponse = {
  error?: unknown;
  code?: unknown;
  details?: unknown;
};

export function getApiErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  if (!("error" in data)) return null;
  const value = (data as { error?: unknown }).error;
  return typeof value === "string" ? value : null;
}

export function getZodFieldError(details: unknown, field: string): string | null {
  if (!details || typeof details !== "object") return null;

  if (!("fieldErrors" in details)) return null;
  const fieldErrors = (details as { fieldErrors?: unknown }).fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") return null;

  const value = (fieldErrors as Record<string, unknown>)[field];
  if (!Array.isArray(value) || value.length === 0) return null;

  const first = value[0];
  return typeof first === "string" ? first : null;
}

export function getApiFieldError(data: unknown, field: string): string | null {
  if (!data || typeof data !== "object") return null;
  if (!("details" in data)) return null;
  return getZodFieldError((data as { details?: unknown }).details, field);
}

