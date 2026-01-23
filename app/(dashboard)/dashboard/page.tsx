import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { qrCodes, folders } from "@/lib/db/schema";
import { eq, desc, asc, sql, and, isNull } from "drizzle-orm";
import { QRCard } from "@/components/qr-card";
import { FolderSidebar } from "@/components/folder-sidebar";
import { buildShortUrl } from "@/lib/qr";
import Link from "next/link";

interface DashboardPageProps {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    folderId?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user?.id) {
    return null; // Layout handles redirect
  }

  const page = Math.max(1, parseInt(params.page || "1", 10));
  const sort = params.sort || "createdAt";
  const order = params.order || "desc";
  const folderId = params.folderId || null;
  const limit = 12;
  const offset = (page - 1) * limit;

  // Build order clause
  const orderColumn = sort === "scanCount" ? qrCodes.scanCount : qrCodes.createdAt;
  const orderDirection = order === "asc" ? asc(orderColumn) : desc(orderColumn);

  // Build where conditions
  const whereConditions = [eq(qrCodes.userId, session.user.id)];
  if (folderId) {
    if (folderId === "none") {
      whereConditions.push(isNull(qrCodes.folderId));
    } else {
      whereConditions.push(eq(qrCodes.folderId, folderId));
    }
  }

  // Fetch QR codes
  const codes = await db
    .select()
    .from(qrCodes)
    .where(and(...whereConditions))
    .orderBy(orderDirection)
    .limit(limit)
    .offset(offset);

  // Get total count for current filter
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(qrCodes)
    .where(and(...whereConditions));

  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  // Get all QR codes count (for total display)
  const allCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(qrCodes)
    .where(eq(qrCodes.userId, session.user.id));
  const allTotal = Number(allCountResult[0]?.count || 0);

  // Fetch user's folders
  const userFolders = await db
    .select({
      id: folders.id,
      name: folders.name,
      qrCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${qrCodes}
        WHERE ${qrCodes.folderId} = ${folders.id}
      )`,
    })
    .from(folders)
    .where(eq(folders.userId, session.user.id))
    .orderBy(folders.name);

  // Transform for display
  const qrCodesData = codes.map((code) => ({
    id: code.id,
    shortCode: code.shortCode,
    shortUrl: buildShortUrl(code.shortCode),
    destinationUrl: code.destinationUrl,
    name: code.name,
    scanCount: code.scanCount,
    isActive: code.isActive,
    createdAt: code.createdAt.toISOString(),
  }));

  const foldersData = userFolders.map((f) => ({
    id: f.id,
    name: f.name,
    qrCount: f.qrCount,
  }));

  const buildQueryString = (newParams: Record<string, string | undefined>) => {
    const merged = { ...params, ...newParams };
    const searchParams = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value && key !== "page") {
        searchParams.set(key, value);
      }
    });
    if (newParams.page && newParams.page !== "1") {
      searchParams.set("page", newParams.page);
    }
    const qs = searchParams.toString();
    return qs ? `?${qs}` : "";
  };

  return (
    <div className="flex gap-6">
      {/* Folder sidebar */}
      {(foldersData.length > 0 || allTotal > 0) && (
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <Suspense fallback={<div className="h-40 bg-gray-100 rounded-lg animate-pulse" />}>
            <FolderSidebar folders={foldersData} currentFolderId={folderId} />
          </Suspense>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My QR Codes</h1>
          <Link
            href="/qr/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New
          </Link>
        </div>

        {allTotal === 0 ? (
          // Empty state - no QR codes at all
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes yet</h3>
            <p className="text-gray-600 mb-6">
              {session.user.name ? `Welcome, ${session.user.name}! ` : "Welcome! "}
              Create your first dynamic QR code to get started.
            </p>
            <Link
              href="/qr/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First QR Code
            </Link>
          </div>
        ) : total === 0 && folderId ? (
          // Empty state for folder filter
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">This folder is empty</h3>
            <p className="text-gray-600 mb-6">
              Move QR codes to this folder or create a new one.
            </p>
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View all QR codes
            </Link>
          </div>
        ) : (
          <>
            {/* Sort controls */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <span className="text-sm text-gray-500">Sort by:</span>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard${buildQueryString({ sort: "createdAt", order: sort === "createdAt" && order === "desc" ? "asc" : "desc", folderId: folderId || undefined })}`}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    sort === "createdAt"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Date Created {sort === "createdAt" && (order === "desc" ? "↓" : "↑")}
                </Link>
                <Link
                  href={`/dashboard${buildQueryString({ sort: "scanCount", order: sort === "scanCount" && order === "desc" ? "asc" : "desc", folderId: folderId || undefined })}`}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    sort === "scanCount"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Scan Count {sort === "scanCount" && (order === "desc" ? "↓" : "↑")}
                </Link>
              </div>
              <span className="ml-auto text-sm text-gray-500">
                {total} QR code{total !== 1 ? "s" : ""}
                {folderId && ` in folder`}
              </span>
            </div>

            {/* QR code grid */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {qrCodesData.map((qr) => (
                <QRCard
                  key={qr.id}
                  id={qr.id}
                  shortCode={qr.shortCode}
                  shortUrl={qr.shortUrl}
                  destinationUrl={qr.destinationUrl}
                  name={qr.name}
                  scanCount={qr.scanCount}
                  isActive={qr.isActive}
                  createdAt={qr.createdAt}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/dashboard${buildQueryString({ page: String(page - 1), sort, order, folderId: folderId || undefined })}`}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}

                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>

                {page < totalPages && (
                  <Link
                    href={`/dashboard${buildQueryString({ page: String(page + 1), sort, order, folderId: folderId || undefined })}`}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
