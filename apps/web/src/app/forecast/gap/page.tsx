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

  const chartData = (gapData?.periods || []).map((p: any, idx: number) => {
    const rawLabel = p.period_label || p.period || p.period_start || `W${idx + 1}`;
    const name = typeof rawLabel === "string" ? rawLabel.replace("Minggu ", "W") : `W${idx + 1}`;
    return {
      name,
      "Pasokan Tersedia (kg)": Number(p.projected_available_supply_kg || p.projected_supply_kg || 0),
      "Prediksi Permintaan (kg)": Number(p.forecast_demand_kg || p.remaining_forecast_demand_kg || 0),
      "Net Gap (kg)": Number(p.projected_gap_kg ?? p.net_gap_kg ?? 0),
    };
  });

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Supply–Demand Gap Analysis
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Perbandingan deterministik pasokan singkong tersedia terhadap proyeksi serapan pasar per periode di Trawas.
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
          title="Panduan Analisis Keseimbangan Pasokan & Permintaan (Gap)"
          badge="Supply-Demand Balancing"
          howToRead={[
            {
              title: "Batang Hijau vs Batang Cokelat",
              desc: "Membandingkan proyeksi ketersediaan singkong (Pasokan) dengan total serapan pesanan UMKM & pasar (Permintaan) di minggu yang sama.",
            },
            {
              title: "Garis Biru (Net Gap)",
              desc: "Garis di atas 0 (+ >500 kg) menandakan SURPLUS (potensi menumpuk); garis di bawah 0 (- >500 kg) menandakan DEFISIT (kurang bahan baku).",
            },
            {
              title: "Tabel Status Keseimbangan",
              desc: "Memberikan status per minggu: Seimbang, Surplus Berlebih, atau Defisit Pasokan beserta kuantitas selisih (kg).",
            },
          ]}
          howToAddOrAct={[
            {
              title: "Tindakan Saat Surplus (+)",
              desc: "Segera klik tombol hijau 'Buka Rekomendasi Tindakan Stok' untuk mengalihkan singkong ke pengolahan mocaf/keripik sebelum batas SOP 48 jam.",
            },
            {
              title: "Tindakan Saat Defisit (-)",
              desc: "Buka menu 'Rencana Panen' untuk berkoordinasi dengan Poktan Trawas guna mempercepat jadwal panen petak siap cabut.",
            },
            {
              title: "Hitung Potensi Nilai Tambah",
              desc: "Buka menu 'Kalkulator Biaya Olahan' untuk menghitung margin keuntungan jika singkong surplus diproses menjadi tepung mocaf.",
            },
          ]}
          roleTarget="Modul ini digunakan oleh Koordinator Rantai Pasok Trawas dan Pemangku Kepentingan untuk mengantisipasi gejolak harga dan mencegah food loss."
        />

        {/* Calculation Formula Explanation Card (PRD Section 8.2) */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <HelpCircle className="w-4 h-4 text-green-700" />
            <span>Rumus Baku Perhitungan Gap (PRD Bagian 8.2):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
            <div className="p-2.5 bg-gray-50 rounded-lg font-mono text-[11px] border border-gray-200">
              <p className="font-bold text-gray-900 mb-1 font-sans">1. Pasokan Tersedia Diproyeksikan:</p>
              Projected Available Supply = Usable Stock + Forecast Harvest - Confirmed Allocations
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg font-mono text-[11px] border border-gray-200">
              <p className="font-bold text-gray-900 mb-1 font-sans">2. Proyeksi Selisih Pasokan-Permintaan:</p>
              Projected Supply-Demand Gap = Projected Available Supply - Forecast Demand
            </div>
          </div>
          <p className="text-[11px] text-gray-500">
            *Ambang batas Trawas: Gap &gt; +500 kg dikategorikan <strong>Surplus</strong>; Gap &lt; -500 kg dikategorikan <strong>Defisit</strong>; di antaranya relatif <strong>Seimbang</strong>.
          </p>
        </div>

        {/* Combined Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Visualisasi Pasokan Tersedia vs Permintaan & Net Gap
              </h3>
              <p className="text-[11px] text-gray-500">
                Area di atas garis nol menunjukkan kelebihan pasokan (surplus), di bawah garis nol menunjukkan potensi kekurangan (defisit).
              </p>
            </div>
            <span className="text-xs text-gray-400">Kilogram (kg)</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: 8, fontSize: 12, border: "1px solid #E2E8F0" }}
                  formatter={(val: any) => [`${Number(val).toLocaleString("id-ID")} kg`]}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="Pasokan Tersedia (kg)" fill="#15803D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Prediksi Permintaan (kg)" fill="#A16207" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Net Gap (kg)" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Gap Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Rincian Perhitungan Gap per Periode Mingguan
              </h3>
              <p className="text-[11px] text-gray-500">
                Tabel deterministik tanpa double-counting order aktif.
              </p>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Periode</th>
                  <th className="py-2.5 px-3 text-right">Stok Awal (kg)</th>
                  <th className="py-2.5 px-3 text-right">+ Prediksi Panen (kg)</th>
                  <th className="py-2.5 px-3 text-right">- Pesanan Tetap (kg)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-green-800">= Pasokan Tersedia (kg)</th>
                  <th className="py-2.5 px-3 text-right text-amber-800">- Demand Model (kg)</th>
                  <th className="py-2.5 px-3 text-right font-bold">= Net Gap (kg)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Saran / Catatan Sistem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(gapData?.periods || []).map((p: any, idx: number) => {
                  const label = p.period_label || p.period || `Minggu ${idx + 1}`;
                  const usableStock = Number(p.usable_stock_kg || 0);
                  const harvestKg = Number(p.forecast_harvest_kg || p.projected_supply_kg || 0);
                  const ordersKg = Number(p.confirmed_orders_kg || 0);
                  const supplyKg = Number(p.projected_available_supply_kg || p.projected_supply_kg || 0);
                  const demandKg = Number(p.forecast_demand_kg || p.remaining_forecast_demand_kg || 0);
                  const gapKg = Number(p.projected_gap_kg ?? p.net_gap_kg ?? 0);
                  const status = p.gap_status || p.status || (gapKg > 500 ? "surplus" : gapKg < -500 ? "deficit" : "balanced");
                  const notes = p.notes || p.explanation || "-";

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{label}</td>
                      <td className="py-2.5 px-3 text-right text-gray-700">{usableStock.toLocaleString("id-ID")}</td>
                      <td className="py-2.5 px-3 text-right text-green-700">+{harvestKg.toLocaleString("id-ID")}</td>
                      <td className="py-2.5 px-3 text-right text-blue-700">-{ordersKg.toLocaleString("id-ID")}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-green-800">{supplyKg.toLocaleString("id-ID")}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-amber-800">{demandKg.toLocaleString("id-ID")}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${gapKg >= 0 ? "text-green-700" : "text-rose-700"}`}>
                        {gapKg > 0 ? "+" : ""}
                        {gapKg.toLocaleString("id-ID")} kg
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={status} type="gap" />
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 max-w-xs leading-relaxed">{notes}</td>
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
