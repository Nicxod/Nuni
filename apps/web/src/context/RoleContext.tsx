"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "all" | "farmer" | "buyer" | "admin" | "viewer";

export interface RoleConfig {
  id: UserRole;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  color: string;
  allowedPaths: string[];
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  all: {
    id: "all",
    label: "✨ Mode Eksplorasi (Semua Fitur)",
    shortLabel: "Akses Lengkap",
    badge: "Semua Fitur Aktif",
    description: "Seluruh 11 modul terbuka tanpa batasan untuk koordinator ekosistem rantai pasok.",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    allowedPaths: [
      "/dashboard",
      "/harvest-plans",
      "/inventory",
      "/forecast/supply",
      "/forecast/demand",
      "/forecast/gap",
      "/stock-actions",
      "/processing-calculator",
      "/transactions",
      "/buyers",
      "/reports",
    ],
  },
  farmer: {
    id: "farmer",
    label: "🌾 Petani / Poktan",
    shortLabel: "Petani",
    badge: "Kelompok Tani Trawas",
    description: "Fokus pada pendaftaran lahan tanam, pencatatan panen & pantauan pasokan lokal.",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    allowedPaths: [
      "/dashboard",
      "/harvest-plans",
      "/inventory",
      "/forecast/supply",
    ],
  },
  buyer: {
    id: "buyer",
    label: "🏭 Pembeli / UMKM",
    shortLabel: "UMKM / Pembeli",
    badge: "Mitra Industri & UMKM",
    description: "Fokus pada kalkulator nilai tambah olahan, riwayat transaksi & pemesanan singkong.",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    allowedPaths: [
      "/dashboard",
      "/processing-calculator",
      "/transactions",
      "/buyers",
      "/forecast/demand",
    ],
  },
  admin: {
    id: "admin",
    label: "⚖️ Admin / Koordinator",
    shortLabel: "Koordinator",
    badge: "Koperasi & Rantai Pasok",
    description: "Otoritas penuh koordinasi supply-demand gap, persetujuan tindakan stok & audit.",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    allowedPaths: [
      "/dashboard",
      "/forecast/gap",
      "/stock-actions",
      "/reports",
      "/buyers",
      "/harvest-plans",
      "/inventory",
      "/transactions",
      "/processing-calculator",
      "/forecast/supply",
      "/forecast/demand",
    ],
  },
  viewer: {
    id: "viewer",
    label: "🔍 Peneliti / Pengawas",
    shortLabel: "Pengawas",
    badge: "Mode Pantau / Audit",
    description: "Akses pemantauan analitik, grafik peramalan dan transparansi laporan rantai pasok.",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    allowedPaths: [
      "/dashboard",
      "/forecast/supply",
      "/forecast/demand",
      "/forecast/gap",
      "/reports",
    ],
  },
};

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  config: RoleConfig;
  isPathAllowed: (path: string) => boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: "all",
  setRole: () => {},
  config: ROLE_CONFIGS.all,
  isPathAllowed: () => true,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("resilokal_role") as UserRole;
      if (saved && ROLE_CONFIGS[saved]) {
        setRoleState(saved);
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem("resilokal_role", newRole);
    } catch {
      // ignore
    }
  };

  const isPathAllowed = (path: string) => {
    if (role === "all") return true;
    const allowed = ROLE_CONFIGS[role]?.allowedPaths || [];
    return allowed.some((p) => path === p || path.startsWith(p + "/"));
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        config: ROLE_CONFIGS[role] || ROLE_CONFIGS.all,
        isPathAllowed,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
