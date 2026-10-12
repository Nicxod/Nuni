"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RefreshCw, AlertTriangle, UserCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useRole } from "@/context/RoleContext";

interface HeaderProps {
  currentRole?: string;
  onRoleChange?: (role: string) => void;
  onRefresh?: () => void;
}

export function Header({ onRoleChange, onRefresh }: HeaderProps) {
  const { role, setRole } = useRole();
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setSeedMessage(null);
      const res = await api.seedSystem();
      setSeedMessage(res.message || "Data simulasi Trawas berhasil dimuat ulang.");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setSeedMessage("Gagal memuat: " + err.message);
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedMessage(null), 5000);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-xs">
      {/* Simulation Notice Banner */}
      <div className="bg-amber-500 text-amber-950 px-3 sm:px-4 py-1 text-[11px] sm:text-xs font-semibold flex items-center justify-between border-b border-amber-600 gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-950 shrink-0" />
          <span className="truncate sm:whitespace-normal">
            LINGKUNGAN SIMULASI TRAWAS: Data hasil panen, harga & transaksi berstatus SIMULASI.
          </span>
        </div>
        <span className="bg-amber-700 text-white text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
          SIMULASI
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-6 py-2.5 gap-2 sm:gap-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group cursor-pointer">
          <img
            src="/logo.png"
            alt="ResiLokal — Lokal Tangguh, Renyah Sampai Tujuan"
            className="h-8 sm:h-10 w-auto object-contain shrink-0"
          />
          <span className="text-[10px] sm:text-xs font-semibold text-green-800 bg-green-50 px-2 py-0.5 rounded-md border border-green-200 hidden lg:inline-block">
            Trawas, Mojokerto
          </span>
        </Link>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Quick Seed Button */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium text-green-800 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 transition-colors cursor-pointer disabled:opacity-50"
            title="Muat ulang dataset simulasi Trawas lengkap"
          >
            <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${seeding ? "animate-spin text-green-700" : ""}`} />
            <span>{seeding ? "Memuat..." : "Reset Data Simulasi"}</span>
          </button>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-gray-200">
            <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 shrink-0" />
            <span className="text-[11px] sm:text-xs text-gray-500 font-medium hidden sm:inline">Peran:</span>
            <select
              value={role}
              onChange={(e) => {
                const newRole = e.target.value as any;
                setRole(newRole);
                if (onRoleChange) onRoleChange(newRole);
              }}
              className="text-[11px] sm:text-xs font-bold text-green-800 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="all">✨ Mode Eksplorasi (Semua Fitur)</option>
              <option value="farmer">🌾 Petani / Poktan</option>
              <option value="buyer">🏭 Pembeli / UMKM</option>
              <option value="admin">⚖️ Admin / Koordinator</option>
              <option value="viewer">🔍 Peneliti / Pengawas</option>
            </select>
          </div>
        </div>
      </div>

      {seedMessage && (
        <div className="bg-emerald-50 text-emerald-800 border-t border-emerald-200 px-4 py-1.5 text-xs font-medium flex items-center justify-between">
          <span>✓ {seedMessage}</span>
          <button onClick={() => setSeedMessage(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold">×</button>
        </div>
      )}
    </header>
  );
}
