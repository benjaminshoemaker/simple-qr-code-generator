import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="py-4 px-6">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Simple QR
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        {children}
      </main>
      <footer className="py-4 px-6 text-center text-sm text-gray-500">
        <p>Simple QR - No hostage codes.</p>
      </footer>
    </div>
  );
}
