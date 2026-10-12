"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  TrendingUp,
  Receipt,
  Users,
  Scale,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  XCircle,
  Sparkles,
  Info,
  Truck,
  Megaphone,
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
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { FeatureGuide } from "@/components/FeatureGuide";
import { api } from "@/lib/api";
import {
  GapAnalysisResponse,
  InventoryBatch,
  StockRecommendation,
  SummaryReport,
} from "@/types";

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [gapData, setGapData] = useState<GapAnalysisResponse | null>(null);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, gapRes, batchRes, recRes] = await Promise.allSettled([
        api.getSummaryReport(),
        api.getGapAnalysis(),
        api.getInventoryBatches(),
        api.getRecommendations(),
      ]);

      if (sumRes.status === "fulfilled") setSummary(sumRes.value);
      if (gapRes.status === "fulfilled") setGapData(gapRes.value);
      if (batchRes.status === "fulfilled") setBatches(batchRes.value);
      if (recRes.status === "fulfilled") setRecommendations(recRes.value);
    } catch (err) {
      console.error("Gagal memuat dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await api.approveRecommendation(id, "Disetujui langsung dari Dashboard");
      await loadData();
    } catch (err: any) {
      alert("Gagal menyetujui: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      await api.rejectRecommendation(id, "Ditolak dari Dashboard");
      await loadData();
    } catch (err: any) {
      alert("Gagal menolak: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Prepare chart data from gap analysis periods
  const chartData = (gapData?.periods || []).map((p: any, idx: number) => {
    const rawLabel = p.period_label || p.period || p.period_start || `W${idx + 1}`;
    const name = typeof rawLabel === "string" ? rawLabel.replace("Minggu ", "W") : `W${idx + 1}`;
    return {
      name,
      "Stok Awal": Number(p.usable_stock_kg || p.total_usable_stock_kg || 0),
      "Prediksi Panen": Number(p.forecast_harvest_kg || p.projected_supply_kg || p.projected_available_supply_kg || 0),
      "Pesanan Terkonfirmasi": Number(p.confirmed_orders_kg || 0),
      "Prediksi Permintaan": Number(p.forecast_demand_kg || p.remaining_forecast_demand_kg || 0),
      "Net Gap": Number(p.projected_gap_kg ?? p.net_gap_kg ?? 0),
    };
  });

  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);

  useEffect(() => {
    setCurrentTimestamp(Date.now());
  }, []);

  // Urgent batches: harvest date >= 2 days ago
  const urgentBatches = batches.filter((b) => {
    if (!currentTimestamp) return false;
    const hDate = new Date(b.harvest_date);
    const diffDays = Math.floor((currentTimestamp - hDate.getTime()) / (1000 * 3600 * 24));
    return diffDays >= 2 && b.status === "available";
  });

  const pendingRecs = recommendations.filter((r) => r.status === "pending").slice(0, 3);

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Title & Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Dashboard Rantai Pasok Singkong Trawas
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Pemantauan pasokan panen terintegrasi, peramalan permintaan pasar, dan peringatan dini surplus/defisit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/delivery-claims"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors shadow-xs cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              Pelacakan & Klaim Remuk
            </Link>
            <Link
              href="/marketing-automation"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-800 bg-purple-50 border border-purple-300 rounded-lg hover:bg-purple-100 transition-colors shadow-xs cursor-pointer"
            >
              <Megaphone className="w-3.5 h-3.5" />
              Otomasi Pemasaran
            </Link>
            <Link
              href="/forecast/gap"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-800 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
              Keseimbangan Pasokan (Gap)
            </Link>
            <Link
              href="/stock-actions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Rekomendasi Tindakan Stok
            </Link>
          </div>
        </div>

        {/* Feature Guide */}
        <FeatureGuide
          title="Panduan Navigasi Dashboard Ekosistem ResiLokal"
          badge="Pusat Komando Rantai Pasok"
          howToRead={[
            {
              title: "5 Kartu KPI Utama",
              desc: "Memantau Stok Gudang Tersedia (kg), Prediksi Panen AI 6 Minggu ke Depan, Pesanan Terikat Kontrak, Proyeksi Permintaan Pasar, dan Status Keseimbangan Gap.",
            },
            {
              title: "Grafik Neraca Multi-Periode",
              desc: "Memadukan stok awal + estimasi panen (sisi pasokan) dengan pesanan + proyeksi kebutuhan pembeli (sisi serapan) per minggu.",
            },
            {
              title: "Peringatan Batch Kritis 48 Jam",
              desc: "Menyoroti batch singkong di gudang yang mendekati atau melewati batas kesegaran SOP untuk segera dieksekusi alokasinya.",
            },
          ]}
          howToAddOrAct={[
            {
              title: "Pintasan Keseimbangan Pasokan (Gap)",
              desc: "Klik tombol 'Keseimbangan Pasokan (Gap)' di kanan atas untuk melihat rincian surplus musim hujan dan defisit musim kemarau.",
            },
            {
              title: "Eksekusi Tindakan Cerdas Stok",
              desc: "Klik 'Rekomendasi Tindakan Stok' untuk menyetujui preservasi umbi di cold storage atau rilis cadangan ke pabrik keripik.",
            },
            {
              title: "Beralih Peran Pengguna",
              desc: "Gunakan menu dropdown peran di bar navigasi atas untuk melihat perspektif operasional Petani, UMKM, atau Admin.",
            },
          ]}
          roleTarget="Pusat kendali operasional bersama bagi Koordinator Rantai Pasok, Petani, dan UMKM Trawas untuk memantau kelancaran aliran singkong dan stabilitas harga."
        />

        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <MetricCard
            title="Stok Tersedia"
            value={summary ? Number(summary.total_inventory_available_kg) : 3850}
            unit="kg"
            subtitle="Inventaris gudang poktan"
            icon={Boxes}
            badge={<StatusBadge status="SIMULASI" />}
          />
          <MetricCard
            title="Panen Diprediksi"
            value={gapData ? Number(gapData.total_forecast_harvest_kg) : 8400}
            unit="kg"
            subtitle="Estimasi panen 6 minggu"
            icon={TrendingUp}
            variant="success"
            badge={<span className="text-[10px] text-green-700 font-bold">AI Forecast</span>}
          />
          <MetricCard
            title="Pesanan Terkonfirmasi"
            value={summary ? Number(summary.total_confirmed_orders_kg) : 1800}
            unit="kg"
            subtitle="Order aktif pembeli"
            icon={Receipt}
            variant="info"
            badge={<span className="text-[10px] text-blue-700 font-bold">Confirmed</span>}
          />
          <MetricCard
            title="Prediksi Kebutuhan"
            value={gapData ? Number(gapData.total_forecast_demand_kg) : 9600}
            unit="kg"
            subtitle="Permintaan pasar diproyeksi"
            icon={Users}
            variant="warning"
            badge={<span className="text-[10px] text-amber-700 font-bold">Demand AI</span>}
          />
          <MetricCard
            title="Proyeksi Net Gap"
            value={gapData ? Number(gapData.overall_net_gap_kg) : 850}
            unit="kg"
            subtitle={
              (gapData?.overall_net_gap_kg || 0) > 0
                ? "Potensi surplus pasokan"
                : "Potensi kekurangan pasokan"
            }
            icon={Scale}
            variant={(gapData?.overall_net_gap_kg || 0) > 0 ? "success" : "danger"}
            badge={
              <StatusBadge
                status={(gapData?.overall_net_gap_kg || 0) > 0 ? "surplus" : "deficit"}
                type="gap"
              />
            }
          />
        </div>

        {/* Charts & Gap Status Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  Proyeksi Pasokan vs Kebutuhan Pasar (Per Minggu)
                  <StatusBadge status="SIMULASI" />
                </h3>
                <p className="text-[11px] text-gray-500">
                  Perbandingan estimasi panen, stok, pesanan terkonfirmasi, dan proyeksi permintaan pasar Trawas.
                </p>
              </div>
              <span className="text-xs text-gray-400">Satuan: Kilogram (kg)</span>
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
                  <Bar dataKey="Prediksi Panen" fill="#15803D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pesanan Terkonfirmasi" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="Prediksi Permintaan" stroke="#A16207" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Net Gap" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Breakdown & Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Status Gap Mingguan</h3>
                <span className="text-xs font-semibold text-gray-500">6 Horizon</span>
              </div>

              <div className="mt-3 space-y-2.5">
                {(gapData?.periods || []).slice(0, 5).map((p: any, idx) => {
                  const label = p.period_label || p.period || `Minggu ${idx + 1}`;
                  const supplyKg = Number(p.projected_available_supply_kg || p.projected_supply_kg || 0);
                  const demandKg = Number(p.forecast_demand_kg || p.remaining_forecast_demand_kg || 0);
                  const gapKg = Number(p.projected_gap_kg ?? p.net_gap_kg ?? 0);
                  const status = p.gap_status || p.status || (gapKg > 500 ? "surplus" : gapKg < -500 ? "deficit" : "balanced");

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{label}</p>
                        <p className="text-[11px] text-gray-500">
                          Supply: {supplyKg.toLocaleString("id-ID")} kg | Demand: {demandKg.toLocaleString("id-ID")} kg
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={status} type="gap" />
                        <p className={`text-[11px] font-bold mt-1 ${gapKg >= 0 ? "text-green-700" : "text-rose-700"}`}>
                          {gapKg > 0 ? "+" : ""}
                          {gapKg.toLocaleString("id-ID")} kg
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 mt-3">
              <Link
                href="/forecast/gap"
                className="text-xs font-semibold text-green-700 hover:text-green-900 flex items-center justify-center gap-1"
              >
                Lihat Tabel Lengkap Analisis Gap <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section: Urgent Batches & Priority Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Urgent Inventory Batches */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  Batch Singkong Butuh Penanganan Cepat
                </h3>
              </div>
              <Link href="/inventory" className="text-xs text-green-700 hover:underline">
                Kelola Inventaris
              </Link>
            </div>

            <div className="mt-3 space-y-2.5">
              {urgentBatches.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  Semua batch stok dalam kondisi aman sesuai parameter SOP kesegaran singkong segar.
                </div>
              ) : (
                urgentBatches.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{b.batch_code}</span>
                        <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded font-semibold text-gray-700">
                          Grade {b.quality_grade || "A"}
                        </span>
                        <StatusBadge status="SIMULASI" />
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1">
                        Panen: {b.harvest_date} • {b.condition_notes}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {Number(b.available_quantity_kg || 0).toLocaleString("id-ID")} kg
                      </span>
                      <p className="text-[10px] text-amber-800 font-semibold mt-0.5">
                        Batas SOP: {b.handling_deadline || "Segera Olah"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Priority Recommendations */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-700" />
                <h3 className="text-sm font-bold text-gray-900">
                  Rekomendasi Tindakan Cerdas Stok (Smart Action)
                </h3>
              </div>
              <Link href="/stock-actions" className="text-xs text-green-700 hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="mt-3 space-y-2.5">
              {pendingRecs.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  Tidak ada rekomendasi pending saat ini. Sistem memantau kondisi gap & batch secara dinamis.
                </div>
              ) : (
                pendingRecs.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg border border-gray-200 bg-gray-50/60 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                            rec.recommendation_type === "preserve" ? "bg-sky-100 text-sky-900 border border-sky-300" :
                            rec.recommendation_type === "release_buffer" ? "bg-amber-100 text-amber-900 border border-amber-300" :
                            rec.recommendation_type === "allocate" ? "bg-blue-100 text-blue-800" :
                            "bg-green-100 text-green-800"
                          }`}>
                            {rec.recommendation_type === "preserve" ? "❄️ Awetkan Umbi (Buffer Hujan)" :
                             rec.recommendation_type === "release_buffer" ? "☀️ Rilis Umbi (Buffer Kemarau)" :
                             rec.recommendation_type === "allocate" ? "📦 Alokasi Pesanan" : "Olah / Awetkan"}
                          </span>
                          <span className="font-semibold text-gray-700">
                            Volume: {Number(rec.quantity_kg || 0).toLocaleString("id-ID")} kg
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {rec.reason}
                        </p>
                      </div>
                      <StatusBadge status={rec.status} type="recommendation" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-[11px] text-gray-500">
                        Estimasi Nilai: Rp {Number(rec.estimated_value || 0).toLocaleString("id-ID")}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleReject(rec.id)}
                          disabled={actionLoading === rec.id}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-md hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => handleApprove(rec.id)}
                          disabled={actionLoading === rec.id}
                          className="px-3 py-1 text-xs font-semibold text-white bg-green-700 rounded-md hover:bg-green-800 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {actionLoading === rec.id ? "Memproses..." : "Setujui"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
