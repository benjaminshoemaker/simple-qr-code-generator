"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Free",
    description: "Static QR codes forever",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Unlimited static QR codes",
      "PNG and SVG downloads",
      "No account required",
      "Never expires",
    ],
    cta: "Use Now",
    ctaLink: "/",
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For individuals and small teams",
    monthlyPrice: 5,
    annualPrice: 36,
    features: [
      "Up to 10 dynamic QR codes",
      "Change destination anytime",
      "Basic scan analytics",
      "Folders for organization",
      "Never expires",
    ],
    cta: "Sign Up",
    ctaLink: "/signup?plan=pro",
    highlighted: true,
  },
  {
    name: "Business",
    description: "For growing businesses",
    monthlyPrice: 15,
    annualPrice: 120,
    features: [
      "Unlimited dynamic QR codes",
      "Change destination anytime",
      "Advanced analytics with CSV export",
      "Folders and tags",
      "Priority support",
      "Never expires",
    ],
    cta: "Sign Up",
    ctaLink: "/signup?plan=business",
    highlighted: false,
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            Simple, honest pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            No hidden fees. No hostage codes. Your QR codes work forever.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-12 flex justify-center items-center gap-4">
          <span className={`text-sm ${!isAnnual ? "text-gray-900 font-medium" : "text-gray-500"}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isAnnual ? "bg-gray-900" : "bg-gray-200"
            }`}
            role="switch"
            aria-checked={isAnnual}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAnnual ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-sm ${isAnnual ? "text-gray-900 font-medium" : "text-gray-500"}`}>
            Annual
            <span className="ml-1 text-green-600 font-medium">(Save 40%)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          {tiers.map((tier) => {
            const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
            const period = isAnnual ? "/year" : "/month";

            return (
              <div
                key={tier.name}
                className={`rounded-2xl p-8 ${
                  tier.highlighted
                    ? "bg-gray-900 text-white ring-4 ring-gray-900"
                    : "bg-white border border-gray-200"
                }`}
              >
                <h3
                  className={`text-lg font-semibold ${
                    tier.highlighted ? "text-white" : "text-gray-900"
                  }`}
                >
                  {tier.name}
                </h3>
                <p
                  className={`mt-1 text-sm ${tier.highlighted ? "text-gray-300" : "text-gray-500"}`}
                >
                  {tier.description}
                </p>
                <div className="mt-6">
                  <span
                    className={`text-4xl font-bold ${
                      tier.highlighted ? "text-white" : "text-gray-900"
                    }`}
                  >
                    ${price}
                  </span>
                  {price > 0 && (
                    <span className={tier.highlighted ? "text-gray-300" : "text-gray-500"}>
                      {period}
                    </span>
                  )}
                </div>

                <ul className="mt-8 space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <span className={`mr-2 ${tier.highlighted ? "text-green-400" : "text-green-500"}`}>
                        &#10003;
                      </span>
                      <span className={tier.highlighted ? "text-gray-200" : "text-gray-600"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link href={tier.ctaLink}>
                    <Button
                      variant={tier.highlighted ? "outline" : "primary"}
                      className={`w-full ${
                        tier.highlighted
                          ? "bg-white text-gray-900 hover:bg-gray-100 border-white"
                          : ""
                      }`}
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ / Trust Section */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-gray-900">What happens if I cancel?</h3>
              <p className="mt-2 text-gray-600">
                Your dynamic QR codes continue to work. You just won&apos;t be able to edit them or
                view new analytics. We never hold your printed materials hostage.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Do static QR codes really stay free?</h3>
              <p className="mt-2 text-gray-600">
                Yes, forever. Static QR codes are generated entirely in your browser. We
                don&apos;t host them, so there&apos;s no cost to us.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Can I upgrade or downgrade anytime?</h3>
              <p className="mt-2 text-gray-600">
                Absolutely. Upgrades take effect immediately, and downgrades happen at the end of
                your billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">What payment methods do you accept?</h3>
              <p className="mt-2 text-gray-600">
                We accept all major credit cards through Stripe. Your payment information is never
                stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
