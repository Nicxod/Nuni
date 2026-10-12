"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useRole, UserRole } from "@/context/RoleContext";
import { ShieldAlert, Compass, ArrowRight, LayoutDashboard } from "lucide-react";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const PATH_ROLE_HINTS: Record<string, { name: string; roles: string[]; recommendedRole: UserRole }> = {
  "/harvest-plans": { name: "Rencana Lahan & Panen", roles: ["Petani / Poktan", "Admin"], recommendedRole: "farmer" },
  "/inventory": { name: "Inventaris Batch Stok", roles: ["Petani / Poktan", "Admin"], recommendedRole: "farmer" },
  "/forecast/supply": { name: "Forecast Pasokan Panen", roles: ["Petani / Poktan", "Admin", "Pengawas"], recommendedRole: "farmer" },
  "/forecast/demand": { name: "Forecast Permintaan Pasar", roles: ["Pembeli / UMKM", "Admin", "Pengawas"], recommendedRole: "buyer" },
  "/forecast/gap": { name: "Supply-Demand Gap (AI)", roles: ["Admin", "Pengawas"], recommendedRole: "admin" },
  "/stock-actions": { name: "Tindakan Cerdas Stok (AI)", roles: ["Admin / Koordinator"], recommendedRole: "admin" },
  "/processing-calculator": { name: "Kalkulator Pengolahan", roles: ["Pembeli / UMKM", "Admin"], recommendedRole: "buyer" },
  "/transactions": { name: "Transaksi & Riwayat", roles: ["Pembeli / UMKM", "Admin"], recommendedRole: "buyer" },
  "/buyers": { name: "Direktori Pembeli", roles: ["Pembeli / UMKM", "Admin"], recommendedRole: "buyer" },
  "/delivery-claims": { name: "Pelacakan & Klaim Remuk", roles: ["Pembeli / UMKM", "Admin", "Pengawas"], recommendedRole: "buyer" },
  "/marketing-automation": { name: "Otomasi Pemasaran", roles: ["Pembeli / UMKM", "Petani / Poktan", "Admin"], recommendedRole: "admin" },
  "/reports": { name: "Laporan & Ringkasan", roles: ["Admin / Koordinator", "Pengawas"], recommendedRole: "admin" },
};

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const { role, config, isPathAllowed, setRole } = useRole();

  const isAllowed = isPathAllowed(pathname);

  // Find hint for current route if restricted
  const matchingHintKey = Object.keys(PATH_ROLE_HINTS).find(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const hint = matchingHintKey ? PATH_ROLE_HINTS[matchingHintKey] : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header
        onRefresh={() => {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
      />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-3.5 sm:p-6 pb-22 md:pb-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          {!isAllowed ? (
            <div className="max-w-2xl mx-auto my-8 bg-white border border-amber-200 rounded-2xl shadow-sm p-6 sm:p-8 text-center space-y-6">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-full">
                  Hak Akses Peran Terbatas
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Modul di Luar Lingkup Peran Saat Ini
                </h2>
                <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  Anda sedang dalam peran <strong className="text-gray-900">{config.label}</strong>.
                  {hint ? (
                    <>
                      {" "}Halaman <strong className="text-green-800">{hint.name}</strong> dikhususkan untuk peran:{" "}
                      <span className="font-semibold text-gray-800">{hint.roles.join(", ")}</span>.
                    </>
                  ) : (
                    " Halaman ini tidak termasuk dalam cakupan peran Anda."
                  )}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 text-left border border-gray-200 space-y-2">
                <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <span>💡 Hak Akses Peran Pengguna:</span>
                </div>
                <p>
                  Sistem ResiLokal mengelompokkan modul kerja berdasarkan peran operasional di lapangan (Petani, Pembeli/UMKM, Admin).
                  Untuk menjelajahi modul ini, Anda dapat beralih peran di bagian atas atau mengaktifkan <strong>Mode Akses Lengkap</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setRole("all")}
                  className="w-full sm:w-auto px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  ✨ Buka Semua (Akses Lengkap)
                </button>

                {hint && (
                  <button
                    onClick={() => setRole(hint.recommendedRole)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Beralih ke {hint.roles[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

