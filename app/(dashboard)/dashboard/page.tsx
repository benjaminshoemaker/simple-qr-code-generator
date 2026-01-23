import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My QR Codes</h1>
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No QR codes yet
        </h3>
        <p className="text-gray-600 mb-6">
          {session?.user?.name
            ? `Welcome, ${session.user.name}! `
            : "Welcome! "}
          Create your first dynamic QR code to get started.
        </p>
        <p className="text-sm text-gray-500">
          Dynamic QR codes require an active subscription. Visit the billing
          page to upgrade your plan.
        </p>
      </div>
    </div>
  );
}
