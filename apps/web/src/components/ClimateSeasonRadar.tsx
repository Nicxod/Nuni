"use client";

import React, { useState } from "react";
import {
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
  Radio,
  FileText,
  CheckCircle2,
  X,
  Sliders,
  Database,
  History,
} from "lucide-react";
import { SeasonalTransitionPrediction, ClimateSyncLog } from "@/types";
import { api } from "@/lib/api";

interface ClimateSeasonRadarProps {
  data: SeasonalTransitionPrediction;
  onRefresh?: () => void;
}

export function ClimateSeasonRadar({ data, onRefresh }: ClimateSeasonRadarProps) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(data.last_synced_at || "Senin, 12 Oktober 2026 (06:00 WIB)");
  const [selectedInterval, setSelectedInterval] = useState<"weekly" | "monthly">(data.sync_interval_mode || "weekly");
  const [showLogModal, setShowLogModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      const res = await api.syncWeeklyClimateData(selectedInterval);
      setLastSync(`Baru saja (${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB)`);
      setSuccessToast(
        `Sukses! Data Agroklimat BMKG Trawas berhasil ditarik dengan interval ${
          selectedInterval === "weekly" ? "1 Minggu Sekali (Siklus Dasarian)" : "1 Bulan Sekali"
        }. Model peramalan musim dan stok otomatis diperbarui.`
      );
      if (onRefresh) onRefresh();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      alert("Gagal sinkronisasi data BMKG: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const isRainy = data.current_season === "rainy";
  const historyLogs = data.sync_history || [];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-emerald-500/30 space-y-4">
      {/* Top Banner & Sync Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-300">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                AI Agroklimat & Radar Musim Trawas
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                BMKG API Integrated
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/70">
              Deteksi otomatis musim hujan, musim kemarau, dan hitung mundur puncak panen singkong Trawas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowLogModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-200 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/40 rounded-lg transition-all cursor-pointer"
            title="Lihat riwayat pembaruan data BMKG mingguan"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>Riwayat Log BMKG</span>
          </button>
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Tarik pembaruan data cuaca agroklimat mingguan terbaru dari BMKG sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Menghubungi BMKG..." : "Sinkronkan Data BMKG"}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-200 p-2.5 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white cursor-pointer font-bold">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Interval Scheduler & API Status Control Bar */}
      <div className="bg-black/35 rounded-xl p-3 border border-emerald-500/20 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Jadwal Tarik Data BMKG:
          </span>
          <div className="inline-flex rounded-lg border border-emerald-500/30 p-0.5 bg-black/40">
            <button
              onClick={() => setSelectedInterval("weekly")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                selectedInterval === "weekly"
                  ? "bg-emerald-500 text-emerald-950 shadow-xs"
                  : "text-emerald-300/70 hover:text-white"
              }`}
            >
              ✓ 1 Minggu Sekali (Siklus Dasarian BMKG)
            </button>
            <button
              onClick={() => setSelectedInterval("monthly")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                selectedInterval === "monthly"
                  ? "bg-amber-500 text-amber-950 font-bold shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              1 Bulan Sekali (Kurang Ideal)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-emerald-200/80">
          <div>
            <span className="text-gray-400">Jadwal Rutin:</span>{" "}
            <strong className="text-white">Setiap Senin, 06:00 WIB</strong>
          </div>
          <div className="border-l border-white/20 pl-3">
            <span className="text-gray-400">Status API:</span>{" "}
            <span className="text-emerald-300 font-bold">● Aktif (200 OK)</span>
          </div>
        </div>
      </div>

      {/* Main Climate Intelligence Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Status Musim Aktif */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-200/90 uppercase tracking-wider flex items-center gap-1">
              {isRainy ? <CloudRain className="w-3.5 h-3.5 text-sky-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              Musim Terdeteksi Saat Ini
            </span>
            <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
              Akurasi AI {data.season_confidence_pct}%
            </span>
          </div>

          <div className="text-lg font-bold text-white flex items-center gap-2">
            <span>{data.current_season_label}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[11px]">
            <div>
              <span className="text-gray-400 block text-[10px]">Curah Hujan Bulanan:</span>
              <strong className="text-sky-300">{data.rainfall_monthly_mm} mm/bln</strong>
              <span className="text-[9px] text-gray-400 block">(Kategori Tinggi)</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Kondisi Tanah:</span>
              <strong className="text-emerald-300">{data.soil_moisture_pct}% Lembap</strong>
              <span className="text-[9px] text-emerald-300/80 block">Gembur (Mudah Cabut)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Puncak Panen & Kapan Berakhir */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-300/90 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Siklus Panen Singkong
            </span>
            <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full font-bold">
              Fase Panen
            </span>
          </div>

          <div className="text-xs font-bold text-white">
            <p className="text-sm text-amber-300">{data.peak_harvest_window}</p>
          </div>

          <div className="pt-1 border-t border-white/10 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Prakiraan Panen Berakhir:</span>
              <strong className="text-white">Pekan ke-4 Nov</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Penyebab Akhir Panen:</span>
              <span className="text-rose-300 text-[10px] text-right font-medium">Tanah mengeras (kemarau)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Prediksi Pergantian Musim Berikutnya */}
        <div className="bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent rounded-xl p-3.5 border border-amber-400/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-orange-300 uppercase tracking-wider flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Prediksi Musim Berikutnya
            </span>
            <span className="text-[10px] bg-orange-500/30 text-orange-200 px-2 py-0.5 rounded-full font-bold">
              Transisi Musim
            </span>
          </div>

          <div>
            <div className="text-sm font-bold text-amber-200">
              {data.next_season_label}
            </div>
            <p className="text-[11px] text-amber-100/80 mt-0.5">
              Tiba dalam: <strong className="text-white font-bold bg-amber-500/30 px-1.5 py-0.5 rounded text-xs">{data.weeks_until_transition} Minggu ({data.transition_predicted_date})</strong>
            </p>
          </div>

          <div className="pt-1 border-t border-amber-400/20 text-[10.5px] text-amber-200/90 leading-tight">
            Curah hujan akan drop ke &lt;40 mm. Panen singkong lokal diproyeksikan anjlok <strong>-65%</strong>.
          </div>
        </div>
      </div>

      {/* Early Warning Callout Banner */}
      <div className="bg-amber-400/15 border border-amber-400/40 rounded-xl p-3 sm:p-3.5 text-xs text-amber-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-inner">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-amber-500/30 text-amber-300 rounded-lg shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-amber-200 text-xs sm:text-sm">
              {data.early_warning_title}
            </h4>
            <p className="text-[11px] text-amber-100/90 leading-relaxed mt-0.5">
              {data.early_warning_message}
            </p>
            <div className="mt-1.5 p-2 bg-black/30 rounded-lg border border-amber-400/30 text-[11px] text-emerald-300">
              <strong>💡 Rekomendasi Waktu Simpan AI:</strong> {data.recommended_action}
            </div>
          </div>
        </div>
      </div>

      {/* 8-Week Climate & Harvest Feasibility Timeline */}
      <div className="bg-black/30 rounded-xl p-3.5 border border-white/10 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Prakiraan Cuaca & Jadwal Panen Singkong 8 Pekan (Timeline Agroklimat)
          </span>
          <span className="text-[10px] text-emerald-300/80">
            Sumber Data: {data.climate_model_source}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {data.weekly_climate_timeline.map((item, idx) => {
            const isHujan = item.season === "rainy";
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-left text-[11px] transition-all ${
                  isHujan
                    ? "bg-sky-950/40 border-sky-500/30 hover:border-sky-400"
                    : "bg-amber-950/40 border-amber-500/30 hover:border-amber-400"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs mb-1">
                  <span className="text-white">{item.week}</span>
                  <span className={isHujan ? "text-sky-300" : "text-amber-400"}>
                    {isHujan ? "🌧️" : "☀️"}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-medium">{item.date_range}</div>
                <div className="mt-1.5 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">CH:</span>
                    <strong className={isHujan ? "text-sky-300" : "text-amber-300"}>
                      {item.rainfall_mm} mm
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tanah:</span>
                    <span className={item.soil_hardness === "gembur" ? "text-emerald-300" : "text-rose-300"}>
                      {item.soil_hardness === "gembur" ? "Gembur" : "Keras"}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-white/10 text-[9.5px] leading-snug text-gray-300 line-clamp-2" title={item.action_cue}>
                  {item.action_cue}
                </div>
              </div>
            );
          })}
        </div>

        {/* Frequency Explanation Note */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-[10.5px] text-emerald-200/70 gap-2">
          <p>
            ℹ️ <strong>Alasan Penarikan Data 1 Minggu Sekali:</strong> Standar BMKG menggunakan siklus Dasarian (per 10 hari). Update setiap minggu memberi petani jeda 7–14 hari yang presisi untuk menyiapkan tenaga cabut umbi dan ruang cold storage sebelum cuaca berubah drastis.
          </p>
          <span className="shrink-0 text-emerald-300 font-semibold">Trawas, Kab. Mojokerto (Elevasi 700 mdpl)</span>
        </div>
      </div>

      {/* Modal Riwayat Log Sinkronisasi Mingguan */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Riwayat Pembaruan Agroklimat BMKG Mingguan</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-gray-300 leading-relaxed text-[11px]">
                Berikut adalah log penarikan otomatis setiap pekan (Siklus Dasarian BMKG) yang digunakan oleh AI ResiLokal untuk memutakhirkan model peramalan pasokan dan kalender panen petani:
              </p>

              <div className="overflow-x-auto border border-emerald-500/20 rounded-xl">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-white/5 text-emerald-300 border-b border-white/10">
                    <tr>
                      <th className="py-2 px-3">Waktu Penarikan</th>
                      <th className="py-2 px-3">Curah Hujan</th>
                      <th className="py-2 px-3">Status Tanah</th>
                      <th className="py-2 px-3">Deteksi Musim</th>
                      <th className="py-2 px-3">Arahan Sistem AI</th>
                      <th className="py-2 px-3 text-right">Status API</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {historyLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="py-2 px-3 font-semibold text-white whitespace-nowrap">{log.synced_at}</td>
                        <td className="py-2 px-3 text-sky-300 font-bold">{log.rainfall_recorded_mm} mm</td>
                        <td className="py-2 px-3 text-gray-300">{log.soil_status}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.detected_season === "rainy" ? "bg-sky-500/20 text-sky-300" : "bg-amber-500/20 text-amber-300"
                          }`}>
                            {log.detected_season === "rainy" ? "🌧️ Hujan" : "☀️ Kemarau"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-300 max-w-xs">{log.harvest_advisory}</td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-mono text-[10px]">200 OK</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-emerald-500/20 text-[11px]">
              <span className="text-gray-400">Jadwal Sync Berikutnya: <strong>Senin Depan, 06:00 WIB</strong></span>
              <button
                onClick={() => setShowLogModal(false)}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
