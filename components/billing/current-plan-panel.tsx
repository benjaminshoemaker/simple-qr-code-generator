"use client";

interface CurrentPlanPanelProps {
  subscription: {
    plan: "pro" | "business";
    status: string;
    currentPeriodEnd: string;
  };
  usage: {
    count: number;
    limit: number | null;
  };
  loading: string | null;
  onManageSubscription: () => void;
  onUpgrade: () => void;
}

export function CurrentPlanPanel({
  subscription,
  usage,
  loading,
  onManageSubscription,
  onUpgrade,
}: CurrentPlanPanelProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 capitalize">
            {subscription.plan}
          </p>
          <p className="text-sm text-gray-500">
            Status:{" "}
            <span
              className={
                subscription.status === "active"
                  ? "text-green-600"
                  : "text-yellow-600"
              }
            >
              {subscription.status}
            </span>
          </p>
          <p className="text-sm text-gray-500">
            Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={onManageSubscription}
          disabled={loading === "portal"}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading === "portal" ? "Loading..." : "Manage Subscription"}
        </button>
      </div>

      {usage.limit && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Usage</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((usage.count / usage.limit) * 100, 100)}%`,
                }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {usage.count} / {usage.limit} QR codes
            </span>
          </div>
          {usage.count >= usage.limit && (
            <p className="mt-2 text-sm text-orange-600">
              You&apos;ve reached your limit. Upgrade to Business for unlimited
              codes.
            </p>
          )}
        </div>
      )}

      {subscription.plan === "pro" && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            Need more? Upgrade to Business for unlimited QR codes.
          </p>
          <button
            onClick={onUpgrade}
            disabled={loading === "business"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading === "business" ? "Loading..." : "Upgrade to Business"}
          </button>
        </div>
      )}
    </div>
  );
}
