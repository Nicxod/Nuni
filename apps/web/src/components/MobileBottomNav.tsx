"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Boxes,
  Scale,
  Menu,
  X,
  TrendingUp,
  Users,
  CheckCircle2,
  Receipt,
  Store,
  Calculator,
  FileText,
  Sprout,
} from "lucide-react";

const mainNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Jadwal Panen", href: "/harvest-plans", icon: Calendar },
  { name: "Stok Batch", href: "/inventory", icon: Boxes },
  { name: "AI Gap", href: "/forecast/gap", icon: Scale },
];

const allNavItems = [
  { name: "Dashboard Utama", href: "/dashboard", icon: LayoutDashboard },
  { name: "Forecast Pasokan Panen", href: "/forecast/supply", icon: TrendingUp },
  { name: "Forecast Permintaan Pasar", href: "/forecast/demand", icon: Users },
  { name: "Supply-Demand Gap (AI)", href: "/forecast/gap", icon: Scale },
  { name: "Rencana Lahan & Panen", href: "/harvest-plans", icon: Calendar },
  { name: "Inventaris Batch Stok", href: "/inventory", icon: Boxes },
  { name: "Tindakan Cerdas Stok (AI)", href: "/stock-actions", icon: CheckCircle2 },
  { name: "Transaksi & Riwayat", href: "/transactions", icon: Receipt },
  { name: "Direktori Pembeli", href: "/buyers", icon: Store },
  { name: "Kalkulator Pengolahan", href: "/processing-calculator", icon: Calculator },
  { name: "Laporan & Ringkasan", href: "/reports", icon: FileText },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Drawer Overlay for Mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl border-t border-gray-200 animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center text-white">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Menu ResiLokal</h3>
                  <p className="text-[10px] text-gray-500">Pilih modul rantai pasok singkong</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer"
                aria-label="Tutup menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Nav Grid */}
            <div className="p-4 overflow-y-auto grid grid-cols-2 gap-2 text-xs">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors cursor-pointer min-h-[48px] ${
                      isActive
                        ? "bg-green-700 text-white border-green-800 font-bold shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-green-50 hover:text-green-800 font-medium"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-green-700"}`} />
                    <span className="truncate leading-tight text-[11px]">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center text-[10px] text-gray-500">
              ResiLokal • Rantai Pasok Singkong Trawas, Mojokerto
            </div>
          </div>
        </div>
      )}

      {/* Sticky Mobile Bottom Navigation Bar (Thumb-zone friendly) */}
      <nav
        aria-label="Navigasi Bawah Layar HP"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1 flex items-center justify-around shadow-lg h-16"
      >
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                isActive ? "text-green-700 font-bold" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-green-700" : "text-gray-500"}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
            </Link>
          );
        })}

        {/* More Menu Drawer Trigger */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-lg transition-colors cursor-pointer ${
            drawerOpen ? "text-green-700 font-bold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Menu className="w-5 h-5 text-gray-500" />
          <span className="text-[10px] mt-0.5 tracking-tight">Semua</span>
        </button>
      </nav>
    </>
  );
}
