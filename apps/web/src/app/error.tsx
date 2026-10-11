"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ResiLokal page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center space-y-4">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Terjadi Kendala Memuat Halaman
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Data sedang disinkronkan dari database Supabase ResiLokal Trawas.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 bg-gray-50 rounded-lg text-left text-xs font-mono text-gray-700 max-h-24 overflow-y-auto border border-gray-200">
            {error.message}
          </div>
        )}

        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Muat Ulang
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
