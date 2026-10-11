"use client";

import React, { useState } from "react";
import { Sprout, RefreshCw, AlertTriangle, UserCheck } from "lucide-react";
import { api } from "@/lib/api";

interface HeaderProps {
  currentRole?: string;
  onRoleChange?: (role: string) => void;
  onRefresh?: () => void;
}

export function Header({ currentRole = "farmer", onRoleChange, onRefresh }: HeaderProps) {
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
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-green-700 text-white shadow-xs shrink-0">
            <Sprout className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
              ResiLokal
              <span className="text-[10px] sm:text-xs font-normal text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-200">
                Trawas
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-gray-500 hidden sm:block">
              Peramalan Pasokan, Permintaan & Perencanaan Cerdas Rantai Pasok Singkong
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Quick Seed Button */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium text-green-800 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 transition-colors cursor-pointer disabled:opacity-50"
            title="Muat ulang dataset simulasi Trawas lengkap"
          >
            <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${seeding ? "animate-spin text-green-700" : ""}`} />
            <span>{seeding ? "Memuat..." : "Reset Demo"}</span>
          </button>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md border border-gray-200">
            <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 shrink-0" />
            <span className="text-[11px] sm:text-xs text-gray-500">Peran:</span>
            <select
              value={currentRole}
              onChange={(e) => onRoleChange && onRoleChange(e.target.value)}
              className="text-[11px] sm:text-xs font-semibold text-green-800 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="farmer">Petani</option>
              <option value="buyer">UMKM</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
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
