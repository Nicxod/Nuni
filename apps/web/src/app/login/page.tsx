"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, Lock, Mail, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("petani@resilokal.id");
  const [password, setPassword] = useState("petanipassword123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.login({ email, password });
      if (typeof window !== "undefined") {
        localStorage.setItem("cassavaflow_token", res.access_token);
        localStorage.setItem("cassavaflow_user", JSON.stringify(res.user));
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Gagal login.");
    } finally {
      setLoading(false);
    }
  };

  const setQuickAccount = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Simulation Banner */}
      <div className="max-w-md w-full mx-auto mb-4 bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-900 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
        <span>Lingkungan Uji Coba Model Trawas (Semua data berstatus SIMULASI).</span>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-700 text-white shadow-md">
            <Sprout className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-3 text-center text-xl font-bold tracking-tight text-gray-900">
          Masuk ke ResiLokal
        </h2>
        <p className="mt-1 text-center text-xs text-gray-500">
          Platform Cerdas Peramalan Pasokan & Kebutuhan Singkong Trawas
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-6 shadow-sm border border-gray-200 rounded-xl space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Alamat Email:</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Kata Sandi:</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Sistem"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Pilih Akun Demo Cepat (1-Klik):
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQuickAccount("petani@resilokal.id", "petanipassword123")}
                className="p-2 border border-gray-200 hover:border-green-400 rounded-lg text-left bg-gray-50/50 hover:bg-green-50/50 transition-colors cursor-pointer"
              >
                <strong className="block text-gray-900 text-[11px]">1. Petani / Poktan</strong>
                <span className="text-[10px] text-gray-500">Kelompok Tani Trawas</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickAccount("pembeli@resilokal.id", "pembelipassword123")}
                className="p-2 border border-gray-200 hover:border-green-400 rounded-lg text-left bg-gray-50/50 hover:bg-green-50/50 transition-colors cursor-pointer"
              >
                <strong className="block text-gray-900 text-[11px]">2. Pembeli / UMKM</strong>
                <span className="text-[10px] text-gray-500">UMKM Keripik Barokah</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickAccount("admin@resilokal.id", "adminpassword123")}
                className="p-2 border border-gray-200 hover:border-green-400 rounded-lg text-left bg-gray-50/50 hover:bg-green-50/50 transition-colors cursor-pointer"
              >
                <strong className="block text-gray-900 text-[11px]">3. Administrator</strong>
                <span className="text-[10px] text-gray-500">Pengelola Rantai Pasok</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickAccount("viewer@resilokal.id", "viewerpassword123")}
                className="p-2 border border-gray-200 hover:border-green-400 rounded-lg text-left bg-gray-50/50 hover:bg-green-50/50 transition-colors cursor-pointer"
              >
                <strong className="block text-gray-900 text-[11px]">4. Analis / Viewer</strong>
                <span className="text-[10px] text-gray-500">Pemantauan & Laporan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
