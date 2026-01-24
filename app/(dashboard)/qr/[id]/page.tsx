import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { qrCodes, folders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildShortUrl } from "@/lib/qr";
import { QREditForm } from "./qr-edit-form";
import { AnalyticsChart } from "@/components/analytics-chart";

interface QRDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QRDetailPage({ params }: QRDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Fetch QR code
  const qrCode = await db.query.qrCodes.findFirst({
    where: eq(qrCodes.id, id),
  });

  if (!qrCode) {
    notFound();
  }

  // Check ownership
  if (qrCode.userId !== session.user.id) {
    notFound();
  }

  // Fetch user's folders
  const userFolders = await db
    .select({
      id: folders.id,
      name: folders.name,
    })
    .from(folders)
    .where(eq(folders.userId, session.user.id));

  // Transform for display
  const qrCodeData = {
    id: qrCode.id,
    shortCode: qrCode.shortCode,
    shortUrl: buildShortUrl(qrCode.shortCode),
    destinationUrl: qrCode.destinationUrl,
    name: qrCode.name,
    folderId: qrCode.folderId,
    isActive: qrCode.isActive,
    scanCount: qrCode.scanCount,
    createdAt: qrCode.createdAt.toISOString(),
    updatedAt: qrCode.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-8">
      <QREditForm
        qrCode={qrCodeData}
        folders={userFolders}
      />
      <AnalyticsChart qrCodeId={qrCodeData.id} />
    </div>
  );
}
