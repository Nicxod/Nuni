"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Scale,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Boxes,
  Users,
  AlertCircle,
  HelpCircle,
  CloudRain,
  Sun,
  Snowflake,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { FeatureGuide } from "@/components/FeatureGuide";
import { api } from "@/lib/api";
import { GapAnalysisResponse } from "@/types";

export default function GapAnalysisPage() {
  const [gapData, setGapData] = useState<GapAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [seasonFilter, setSeasonFilter] = useState<"all" | "rainy" | "dry">("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getGapAnalysis();
      setGapData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rawPeriods = gapData?.periods || [];
  const filteredPeriods = rawPeriods.filter((p: any) => {
    if (seasonFilter === "all") return true;
    return p.season === seasonFilter;
  });

  const chartData = filteredPeriods.map((p: any, idx: number) => {
    const rawLabel = p.period_label || p.period || p.period_start || `W${idx + 1}`;
    const name = typeof rawLabel === "string" ? rawLabel.replace("Minggu ", "W") : `W${idx + 1}`;
    const supplyKg = Number(p.projected_available_supply_kg || p.projected_supply_kg || 0);
    const demandKg = Number(p.forecast_demand_kg || p.remaining_forecast_demand_kg || 0);
    const netGapKg = Number(p.projected_gap_kg ?? p.net_gap_kg ?? 0);
    const bufferPreserveKg = Number(p.buffer_preservation_kg || 0);
    const bufferReleaseKg = Number(p.buffer_release_kg || 0);

    return {
      name,
      season: p.season === "rainy" ? "🌧️ Hujan" : "☀️ Kemarau",
      "Pasokan Panen Umbi (kg)": supplyKg,
      "Permintaan Keripik (kg)": demandKg,
      "Net Gap Alami (kg)": netGapKg,
      "Simpan Umbi Awetan (kg)": bufferPreserveKg,
      "Rilis Umbi Awetan (kg)": bufferReleaseKg,
    };
  });

  // Calculate aggregate seasonal totals
  const totalPreserveKg = rawPeriods.reduce((acc, p: any) => acc + Number(p.buffer_preservation_kg || 0), 0);
  const totalReleaseKg = rawPeriods.reduce((acc, p: any) => acc + Number(p.buffer_release_kg || 0), 0);
  const rainyCount = rawPeriods.filter((p: any) => p.season === "rainy").length;
  const dryCount = rawPeriods.filter((p: any) => p.season === "dry").length;

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Keseimbangan Panen & Kebutuhan Pasar (Supply–Demand Gap)
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Penyeimbang Cadangan Umbi Musim Hujan & Kemarau: Preservasi saat surplus panen raya & rilis cadangan saat musim kemarau.
            </p>
          </div>

          <Link
            href="/stock-actions"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Buka Rekomendasi Tindakan Stok
          </Link>
        </div>

        {/* Feature Guide */}
        <FeatureGuide
          title="Panduan Skema Peramalan Musiman & Cadangan Penyangga Umbi"
          badge="Seasonal Tuber Buffer Scheme"
          howToRead={[
            {
              title: "Dilema Musim Hujan vs Musim Kemarau",
              desc: "Di musim hujan panen umbi melimpah namun serapan keripik stabil (surplus berisiko busuk dalam 48 jam). Di musim kemarau panen lokal anjlok sementara wisatawan memborong keripik (defisit bahan baku).",
            },
            {
              title: "Mengapa Disimpan sebagai Umbi (Bukan Tepung)?",
              desc: "UMKM keripik membutuhkan bentuk fisik umbi untuk digoreng. Jika semua dijadikan tepung, pabrik keripik akan kehabisan bahan baku di musim kemarau. Umbi diawetkan dengan teknik irisan blansir beku (tahan 6 bulan).",
            },
            {
              title: "Net Gap Alami vs Penyeimbangan Buffer",
              desc: "Garis biru menunjukkan gap sebelum intervensi. Batang 'Simpan Umbi Awetan' menyerap surplus musim hujan, sedangkan 'Rilis Umbi Awetan' menambal defisit musim kemarau.",
            },
          ]}
          howToAddOrAct={[
            {
              title: "Saat Musim Hujan (Surplus Panen Raya)",
              desc: "Buka menu 'Rekomendasi Tindakan Stok' lalu setujui 'Preservasi Umbi Musim Hujan' untuk memotong irisan, memblansir, dan menyimpan di Cold Storage Koperasi.",
            },
            {
              title: "Saat Musim Kemarau (Defisit Pasokan)",
              desc: "Sistem otomatis merekomendasikan 'Rilis Cadangan Umbi Awetan' dari Cold Storage ke UMKM Keripik Barokah agar produksi tidak terhenti dan harga tetap terjangkau.",
            },
            {
              title: "Simulasi Berdasarkan Musim",
              desc: "Gunakan tombol filter di bawah untuk melihat detail periode Musim Hujan, Musim Kemarau, atau siklus tahunan lengkap.",
            },
          ]}
          roleTarget="Modul ini dijalankan oleh Koordinator Koperasi Trawas dan Pengelola Rantai Pasok untuk memastikan bahan baku UMKM Keripik stabil sepanjang tahun dan zero food loss bagi petani."
        />

        {/* Core Seasonal Scheme Infographic Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Rainy Season */}
          <div className="bg-gradient-to-br from-blue-50/80 via-white to-sky-50/50 border border-blue-200 rounded-xl p-4 text-xs space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <CloudRain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">🌧️ Skenario Musim Hujan</h4>
                  <p className="text-[11px] text-blue-700 font-medium">Panen Umbi Melimpah, Permintaan Keripik Normal</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-full uppercase">
                Surplus Umbi (+{totalPreserveKg.toLocaleString("id-ID")} kg)
              </span>
            </div>

            <div className="space-y-1.5 text-gray-700 leading-relaxed text-[11px]">
              <p>
                <strong>Tantangan Lapangan:</strong> Umbi singkong melimpah ruah, namun permintaan keripik UMKM memiliki kapasitas serap terbatas. Singkong segar berisiko busuk dalam 48 jam (*Postharvest Physiological Deterioration*).
              </p>
              <div className="p-2 bg-blue-100/60 rounded-lg border border-blue-200 text-blue-950 font-medium">
                ❄️ <strong>Rekomendasi Cerdas AI:</strong> Jangan biarkan busuk dan jangan dipaksa jadi tepung! <strong>Awetkan sebagian umbi segar</strong> dengan metode <em>Irisan Blansir Beku (Blanch-Frozen Slices)</em> di Cold Storage Koperasi Trawas (tahan 6 bulan) sebagai tabungan bahan baku keripik.
              </div>
            </div>
          </div>

          {/* Card 2: Dry Season */}
          <div className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 border border-amber-200 rounded-xl p-4 text-xs space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">☀️ Skenario Musim Kemarau</h4>
                  <p className="text-[11px] text-amber-800 font-medium">Panen Umbi Anjlok, Permintaan Keripik Tinggi (Wisatawan)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-full uppercase">
                Defisit Ditambal (-{totalReleaseKg.toLocaleString("id-ID")} kg)
              </span>
            </div>

            <div className="space-y-1.5 text-gray-700 leading-relaxed text-[11px]">
              <p>
                <strong>Tantangan Lapangan:</strong> Tanah pegunungan mengeras membuat panen umbi lokal seret, sementara musim liburan memicu lonjakan permintaan keripik singkong dari wisatawan Trawas.
              </p>
              <div className="p-2 bg-amber-100/60 rounded-lg border border-amber-200 text-amber-950 font-medium">
                📦 <strong>Rekomendasi Cerdas AI:</strong> Buka gudang cadangan penyangga! <strong>Keluarkan umbi awetan</strong> dari Cold Storage Koperasi untuk menyuplai UMKM Keripik. Bahan baku tidak putus, harga terkontrol, dan pabrik tetap beroperasi stabil!
              </div>
            </div>
          </div>
        </div>

        {/* Season Filter Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 text-xs shadow-xs">
          <div className="flex items-center gap-2 font-semibold text-gray-700">
            <span>Filter Skenario Musim:</span>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                onClick={() => setSeasonFilter("all")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  seasonFilter === "all"
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                🔄 Semua Siklus (8 Minggu)
              </button>
              <button
                onClick={() => setSeasonFilter("rainy")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  seasonFilter === "rainy"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-500 hover:text-blue-700"
                }`}
              >
                🌧️ Musim Hujan (Surplus Panen Umbi)
              </button>
              <button
                onClick={() => setSeasonFilter("dry")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  seasonFilter === "dry"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-gray-500 hover:text-amber-800"
                }`}
              >
                ☀️ Musim Kemarau (Defisit Panen Lokal)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-600">
            <div>
              <span className="text-gray-400">Total Direkomendasikan Diawetkan:</span>{" "}
              <strong className="text-blue-700 font-bold">+{totalPreserveKg.toLocaleString("id-ID")} kg</strong>
            </div>
            <div>
              <span className="text-gray-400">Total Dirilis ke UMKM Keripik:</span>{" "}
              <strong className="text-amber-800 font-bold">{totalReleaseKg.toLocaleString("id-ID")} kg</strong>
            </div>
          </div>
        </div>

        {/* Combined Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Visualisasi Neraca Pasokan, Permintaan & Penyangga Cadangan Umbi
              </h3>
              <p className="text-[11px] text-gray-500">
                Memperlihatkan bagaimana cadangan umbi yang diawetkan di musim hujan dialirkan keluar untuk menambal defisit di musim kemarau.
              </p>
            </div>
            <span className="text-xs text-gray-400 font-medium">Satuan: Kilogram (kg)</span>
          </div>

          {/* Layperson chart reading tip */}
          <div className="mb-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-[11px] text-gray-700 leading-relaxed flex flex-wrap items-center gap-3">
            <span className="font-bold text-gray-900 flex items-center gap-1">💡 Cara Cepat Membaca:</span>
            <span className="inline-flex items-center gap-1 text-green-800"><span className="w-2.5 h-2.5 rounded-sm bg-[#15803D] inline-block"></span> Panen Petani</span>
            <span className="inline-flex items-center gap-1 text-amber-900"><span className="w-2.5 h-2.5 rounded-sm bg-[#B45309] inline-block"></span> Kebutuhan Keripik</span>
            <span className="inline-flex items-center gap-1 text-blue-800"><span className="w-2.5 h-2.5 rounded-sm bg-[#0284C7] inline-block"></span> Simpan Awetan (Hujan)</span>
            <span className="inline-flex items-center gap-1 text-amber-800"><span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] inline-block"></span> Rilis Cadangan (Kemarau)</span>
            <span className="inline-flex items-center gap-1 text-rose-700 font-semibold"><span className="w-4 border-b-2 border-dashed border-[#EF4444] inline-block"></span> Selisih Alami (Net Gap)</span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: 8, fontSize: 12, border: "1px solid #E2E8F0" }}
                  formatter={(val: any) => [`${Number(val).toLocaleString("id-ID")} kg`]}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="Pasokan Panen Umbi (kg)" fill="#15803D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Permintaan Keripik (kg)" fill="#B45309" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Simpan Umbi Awetan (kg)" fill="#0284C7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rilis Umbi Awetan (kg)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Net Gap Alami (kg)" stroke="#EF4444" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Gap Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Rincian Perhitungan Gap & Aliran Cadangan Umbi per Periode
              </h3>
              <p className="text-[11px] text-gray-500">
                Kalkulasi stok umbi segar dan umbi diawetkan untuk memastikan UMKM keripik tidak pernah kehabisan bahan baku.
              </p>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Periode & Musim</th>
                  <th className="py-2.5 px-3 text-right">Stok Segar Gudang (kg)</th>
                  <th className="py-2.5 px-3 text-right">+ Panen Baru (kg)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-green-800">= Total Tersedia (kg)</th>
                  <th className="py-2.5 px-3 text-right text-amber-900">- Kebutuhan Keripik (kg)</th>
                  <th className="py-2.5 px-3 text-right font-bold">= Selisih Bersih / Gap (kg)</th>
                  <th className="py-2.5 px-3 text-center">Status Alami</th>
                  <th className="py-2.5 px-3 text-right font-bold text-blue-700">Rekomendasi Cadangan Umbi</th>
                  <th className="py-2.5 px-3">Instruksi Operasional Sistem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPeriods.map((p: any, idx: number) => {
                  const label = p.period_label || p.period || `Minggu ${idx + 1}`;
                  const usableStock = Number(p.usable_stock_kg || 0);
                  const harvestKg = Number(p.forecast_harvest_kg || p.projected_supply_kg || 0);
                  const supplyKg = Number(p.projected_available_supply_kg || p.projected_supply_kg || 0);
                  const demandKg = Number(p.forecast_demand_kg || p.remaining_forecast_demand_kg || 0);
                  const gapKg = Number(p.projected_gap_kg ?? p.net_gap_kg ?? 0);
                  const status = p.gap_status || p.status || (gapKg > 500 ? "surplus" : gapKg < -500 ? "deficit" : "balanced");
                  const notes = p.notes || p.explanation || "-";
                  const preserveKg = Number(p.buffer_preservation_kg || 0);
                  const releaseKg = Number(p.buffer_release_kg || 0);
                  const seasonName = p.season === "rainy" ? "🌧️ Hujan" : "☀️ Kemarau";

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-semibold text-gray-900">
                        <div>{label}</div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          p.season === "rainy" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}>
                          {seasonName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700">{usableStock.toLocaleString("id-ID")}</td>
                      <td className="py-2.5 px-3 text-right text-green-700">+{harvestKg.toLocaleString("id-ID")}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-green-800">{supplyKg.toLocaleString("id-ID")}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-amber-900">{demandKg.toLocaleString("id-ID")}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${gapKg >= 0 ? "text-green-700" : "text-rose-700"}`}>
                        {gapKg > 0 ? "+" : ""}
                        {gapKg.toLocaleString("id-ID")} kg
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={status} type="gap" />
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {preserveKg > 0 && (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block text-[11px]">
                            +Simpan {preserveKg.toLocaleString("id-ID")} kg
                          </span>
                        )}
                        {releaseKg > 0 && (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block text-[11px]">
                            -Rilis {releaseKg.toLocaleString("id-ID")} kg
                          </span>
                        )}
                        {preserveKg === 0 && releaseKg === 0 && (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700 max-w-xs leading-relaxed text-[11px]">{notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
