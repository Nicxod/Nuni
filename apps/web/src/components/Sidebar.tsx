"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Scale,
  Calendar,
  Boxes,
  CheckCircle2,
  Receipt,
  Store,
  Calculator,
  FileText,
  Compass,
  Truck,
  Megaphone,
} from "lucide-react";
import { useRole } from "@/context/RoleContext";

const navigationItems = [
  { name: "Dashboard Utama", href: "/dashboard", icon: LayoutDashboard },
  { name: "Forecast Pasokan Panen", href: "/forecast/supply", icon: TrendingUp },
  { name: "Forecast Permintaan Pasar", href: "/forecast/demand", icon: Users },
  { name: "Supply-Demand Gap", href: "/forecast/gap", icon: Scale },
  { name: "Rencana Lahan & Panen", href: "/harvest-plans", icon: Calendar },
  { name: "Inventaris Batch Stok", href: "/inventory", icon: Boxes },
  { name: "Tindakan Cerdas Stok", href: "/stock-actions", icon: CheckCircle2 },
  { name: "Pelacakan & Klaim Remuk", href: "/delivery-claims", icon: Truck },
  { name: "Transaksi & Riwayat", href: "/transactions", icon: Receipt },
  { name: "Direktori Pembeli", href: "/buyers", icon: Store },
  { name: "Otomasi Pemasaran", href: "/marketing-automation", icon: Megaphone },
  { name: "Kalkulator Pengolahan", href: "/processing-calculator", icon: Calculator },
  { name: "Laporan & Ringkasan", href: "/reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, config, isPathAllowed, setRole } = useRole();

  const visibleItems = navigationItems.filter((item) => isPathAllowed(item.href));

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0 min-h-[calc(100vh-80px)]">
      {/* Brand & Active Role Banner */}
      <div className="p-4 border-b border-gray-100 space-y-2.5">
        <Link href="/dashboard" className="flex items-center justify-between group cursor-pointer">
          <img
            src="/logo.png"
            alt="ResiLokal"
            className="h-8.5 w-auto object-contain"
          />
          <span className="text-[10px] font-semibold text-green-800 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
            Trawas
          </span>
        </Link>

        {/* Dynamic Role Badge */}
        <div className={`p-2.5 rounded-lg border text-xs ${config.color}`}>
          <div className="flex items-center justify-between font-bold text-[11px]">
            <span>{config.shortLabel}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/70 uppercase tracking-wide">
              {visibleItems.length}/{navigationItems.length} Fitur
            </span>
          </div>
          <p className="text-[10px] opacity-90 mt-1 leading-snug">
            {config.description}
          </p>
          {role !== "all" && (
            <button
              onClick={() => setRole("all")}
              className="mt-2 text-[10px] font-bold flex items-center gap-1 underline cursor-pointer hover:opacity-80"
            >
              <Compass className="w-3 h-3" />
              Buka Semua (Mode Eksplorasi)
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Menu Akses Peran:
        </div>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? "bg-green-700 text-white font-semibold shadow-xs"
                  : "text-gray-700 hover:bg-green-50 hover:text-green-800"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-gray-500"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100 bg-gray-50/70 text-[11px] text-gray-500">
        <p className="font-semibold text-gray-700">Trawas, Kab. Mojokerto</p>
        <p className="text-[10px] text-gray-400">Simulasi Rantai Pasok Berkelanjutan</p>
      </div>
    </aside>
  );
}
