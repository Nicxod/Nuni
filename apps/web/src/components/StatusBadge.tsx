import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "gap" | "origin" | "batch" | "recommendation" | "transaction";
}

export function StatusBadge({ status, type = "origin" }: StatusBadgeProps) {
  const norm = status.toLowerCase();

  if (type === "origin" || norm === "simulation" || norm === "simulasi") {
    return (
      <span className="badge-simulasi inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        SIMULASI
      </span>
    );
  }

  if (type === "gap") {
    if (norm === "surplus") {
      return (
        <span className="badge-surplus">
          Surplus (Pasokan Berlebih)
        </span>
      );
    }
    if (norm === "deficit" || norm === "defisit") {
      return (
        <span className="badge-deficit">
          Defisit (Kurang Pasokan)
        </span>
      );
    }
    if (norm === "balanced" || norm === "seimbang") {
      return (
        <span className="badge-balanced">
          Seimbang
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-300">
        Data Terbatas
      </span>
    );
  }

  if (type === "recommendation") {
    if (norm === "pending") {
      return <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Menunggu Persetujuan</span>;
    }
    if (norm === "approved") {
      return <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Disetujui</span>;
    }
    if (norm === "rejected") {
      return <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Ditolak</span>;
    }
    if (norm === "completed") {
      return <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Selesai</span>;
    }
  }

  if (type === "batch") {
    if (norm === "available") {
      return <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Tersedia</span>;
    }
    if (norm === "allocated") {
      return <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Dialokasikan</span>;
    }
    if (norm === "processing") {
      return <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">Sedang Olah</span>;
    }
    if (norm === "spoiled" || norm === "rusak") {
      return <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Rusak</span>;
    }
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
      {status}
    </span>
  );
}
