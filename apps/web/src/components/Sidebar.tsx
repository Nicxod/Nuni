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
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard Utama", href: "/dashboard", icon: LayoutDashboard },
  { name: "Forecast Pasokan Panen", href: "/forecast/supply", icon: TrendingUp },
  { name: "Forecast Permintaan Pasar", href: "/forecast/demand", icon: Users },
  { name: "Supply-Demand Gap", href: "/forecast/gap", icon: Scale },
  { name: "Rencana Lahan & Panen", href: "/harvest-plans", icon: Calendar },
  { name: "Inventaris Batch Stok", href: "/inventory", icon: Boxes },
  { name: "Tindakan Cerdas Stok", href: "/stock-actions", icon: CheckCircle2 },
  { name: "Transaksi & Riwayat", href: "/transactions", icon: Receipt },
  { name: "Direktori Pembeli", href: "/buyers", icon: Store },
  { name: "Kalkulator Pengolahan", href: "/processing-calculator", icon: Calculator },
  { name: "Laporan & Ringkasan", href: "/reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0 min-h-[calc(100vh-80px)]">
      <div className="p-4 border-b border-gray-100">
        <div className="text-[13px] font-bold text-gray-900 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span>
          ResiLokal
        </div>
        <span className="text-[10px] font-semibold tracking-wider text-gray-400 block mt-0.5">
          Rantai Pasok Singkong Trawas
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
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
        <p>Pola musiman: Kemarau vs Hujan</p>
      </div>
    </aside>
  );
}
