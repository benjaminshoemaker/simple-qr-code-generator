"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          An unexpected error occurred. Try again, or return home.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button type="button" variant="primary" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-100 h-10 px-4 text-sm"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

