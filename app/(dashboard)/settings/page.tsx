import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const accountRows = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(eq(accounts.userId, user.id));

  const providers = Array.from(new Set(accountRows.map((a) => a.provider))).sort();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage your account and connected providers.
        </p>
      </div>

      <SettingsForm
        user={{ id: user.id, email: user.email, name: user.name }}
        providers={providers}
      />
    </div>
  );
}

