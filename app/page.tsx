import Link from "next/link";
import { QRGenerator } from "@/components/qr-generator";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Simple QR
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
              >
                Sign up
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
                No hostage codes.
              </h1>
              <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                Free QR codes that actually stay free. Static codes forever, dynamic codes you own.
                No surprise fees after you print.
              </p>
            </div>
          </div>
        </section>

        {/* QR Generator Section */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Generate a free QR code
              </h2>
              <QRGenerator />
            </div>
          </div>
        </section>

        {/* Value Proposition Section */}
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Static QR Codes</h3>
                <p className="mt-2 text-gray-600">Free forever</p>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">&#10003;</span>
                    <span className="text-gray-600">Generate unlimited QR codes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">&#10003;</span>
                    <span className="text-gray-600">Download as PNG or SVG</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">&#10003;</span>
                    <span className="text-gray-600">No account required</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">&#10003;</span>
                    <span className="text-gray-600">No expiration, ever</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900">Dynamic QR Codes</h3>
                <p className="mt-2 text-gray-600">Starting at $5/month</p>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">&#10003;</span>
                    <span className="text-gray-600">Change destination URL anytime</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">&#10003;</span>
                    <span className="text-gray-600">Track scans with analytics</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">&#10003;</span>
                    <span className="text-gray-600">Organize with folders and tags</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">&#10003;</span>
                    <span className="text-gray-600">
                      <strong>Never expires</strong> - your code, your control
                    </span>
                  </li>
                </ul>
                <Link
                  href="/pricing"
                  className="inline-block mt-6 bg-gray-900 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800"
                >
                  View pricing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Us Section */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Simple QR?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">&#128275;</div>
                <h3 className="text-lg font-semibold text-gray-900">No Lock-In</h3>
                <p className="mt-2 text-gray-600">
                  Your QR codes work forever. We never hold your printed materials hostage.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">&#128176;</div>
                <h3 className="text-lg font-semibold text-gray-900">Transparent Pricing</h3>
                <p className="mt-2 text-gray-600">
                  No hidden fees. No surprise charges. What you see is what you pay.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">&#9889;</div>
                <h3 className="text-lg font-semibold text-gray-900">Fast & Reliable</h3>
                <p className="mt-2 text-gray-600">
                  Edge-deployed redirects for instant scans, anywhere in the world.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-sm">Simple QR - No hostage codes.</p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/pricing" className="hover:text-gray-900">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
