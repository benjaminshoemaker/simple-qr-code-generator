"use client";

interface BillingStatusBannerProps {
  success: boolean;
  canceled: boolean;
}

export function BillingStatusBanner({
  success,
  canceled,
}: BillingStatusBannerProps) {
  if (!success && !canceled) return null;

  return (
    <>
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">
            Thank you for subscribing! Your subscription is now active.
          </p>
        </div>
      )}
      {canceled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Checkout was canceled. You can try again when you&apos;re ready.
          </p>
        </div>
      )}
    </>
  );
}
