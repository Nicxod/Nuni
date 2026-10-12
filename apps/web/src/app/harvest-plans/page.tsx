"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Sprout,
  Layers,
  MapPin,
  CheckCircle,
  HelpCircle,
  Clock,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { FeatureGuide } from "@/components/FeatureGuide";
import { api } from "@/lib/api";
import { CropPlan, Farm } from "@/types";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function getWeekAndMonthLabel(dateStr: string) {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const monthName = MONTH_NAMES[monthIdx] || "";
  let week = 1;
  if (day <= 7) week = 1;
  else if (day <= 14) week = 2;
  else if (day <= 21) week = 3;
  else week = 4;

  return `${monthName} ${year} (Mgg ${week})`;
}

export function getWeekDateRange(year: number, monthIdx: number, week: number) {
  const mName = MONTH_NAMES[monthIdx];
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();
  switch (week) {
    case 1:
      return { start: `1 ${mName}`, end: `7 ${mName}`, repDay: 4 };
    case 2:
      return { start: `8 ${mName}`, end: `14 ${mName}`, repDay: 11 };
    case 3:
      return { start: `15 ${mName}`, end: `21 ${mName}`, repDay: 18 };
    case 4:
    default:
      return { start: `22 ${mName}`, end: `${lastDay} ${mName}`, repDay: 25 };
  }
}

export default function HarvestPlansPage() {
  const [plans, setPlans] = useState<CropPlan[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>("all");

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [farmId, setFarmId] = useState("");
  const [cropName, setCropName] = useState("Singkong Gajah");
  const [variety, setVariety] = useState("Gajah");
  const [areaHectares, setAreaHectares] = useState("1.0");
  const [expectedYield, setExpectedYield] = useState("18000");
  const [plantingDate, setPlantingDate] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Farmer-friendly timing mode
  const [timingMode, setTimingMode] = useState<"week_month" | "plant_age" | "exact_date">("week_month");

  // State for Week/Month mode
  const [targetYear, setTargetYear] = useState<number>(2026);
  const [targetMonth, setTargetMonth] = useState<number>(9); // 9 = Oktober
  const [targetWeek, setTargetWeek] = useState<number>(3); // Minggu ke-3

  // State for Plant Age mode
  const [plantYear, setPlantYear] = useState<number>(2026);
  const [plantMonth, setPlantMonth] = useState<number>(0); // 0 = Januari
  const [growthMonths, setGrowthMonths] = useState<number>(9); // Singkong 9 bulan

  // Synchronize target dates based on timing mode
  useEffect(() => {
    if (timingMode === "week_month") {
      const { repDay } = getWeekDateRange(targetYear, targetMonth, targetWeek);
      const mm = String(targetMonth + 1).padStart(2, "0");
      const dd = String(repDay).padStart(2, "0");
      setExpectedDate(`${targetYear}-${mm}-${dd}`);
    } else if (timingMode === "plant_age") {
      // Planting date ~ tgl 10 bulan tanam
      const pMm = String(plantMonth + 1).padStart(2, "0");
      setPlantingDate(`${plantYear}-${pMm}-10`);

      // Calculate harvest date
      const totalMonths = plantMonth + growthMonths;
      const hYear = plantYear + Math.floor(totalMonths / 12);
      const hMonth = totalMonths % 12;
      const hMm = String(hMonth + 1).padStart(2, "0");
      setExpectedDate(`${hYear}-${hMm}-15`);
    }
  }, [timingMode, targetYear, targetMonth, targetWeek, plantYear, plantMonth, growthMonths]);

  // Auto calculate expected yield when area changes
  const handleAreaChange = (val: string) => {
    setAreaHectares(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      // Standar produktivitas rata-rata singkong Trawas 18 ton (18.000 kg) per hektar
      setExpectedYield(String(Math.round(num * 18000)));
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, fRes] = await Promise.allSettled([
        api.getCropPlans(),
        api.getFarms(),
      ]);
      if (pRes.status === "fulfilled") setPlans(pRes.value);
      if (fRes.status === "fulfilled") {
        setFarms(fRes.value);
        if (fRes.value.length > 0 && !farmId) {
          setFarmId(fRes.value[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId || !expectedDate) {
      alert("Pilih lahan dan pastikan perkiraan waktu panen telah terisi.");
      return;
    }

    try {
      setSaving(true);
      await api.createCropPlan({
        farm_id: farmId,
        crop_name: cropName,
        variety: variety,
        planting_date: plantingDate || null,
        expected_harvest_date: expectedDate,
        area_hectares: Number(areaHectares),
        expected_yield_kg: Number(expectedYield),
        status: "growing",
        data_origin: "simulation",
        notes: `Rencana panen dijadwalkan untuk ${getWeekAndMonthLabel(expectedDate)}`,
      });
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert("Gagal menyimpan rencana panen: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus rencana panen ini?")) return;
    try {
      await api.deleteCropPlan(id);
      await loadData();
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  // Filter plans
  const filteredPlans = plans.filter((p) => {
    if (filterMonth === "all") return true;
    return p.expected_harvest_date.startsWith(filterMonth);
  });

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Rencana Lahan & Kalender Panen Singkong
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Pencatatan petak lahan, jadwal tanam, target panen mingguan/bulanan, dan proyeksi produktivitas Poktan Trawas.
            </p>
          </div>

          <button
            onClick={() => {
              setShowModal(true);
              setTimingMode("week_month");
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Jadwal Panen (Minggu/Bulan)
          </button>
        </div>

        {/* Feature Guide */}
        <FeatureGuide
          title="Panduan Rencana Lahan & Kalender Panen"
          badge="Modul Petani & Poktan"
          howToRead={[
            {
              title: "Tabel Rencana & Kalender Panen",
              desc: "Menampilkan komitmen panen per poktan, luas petak (ha), varietas singkong (Gajah, Ketan, Manggu), serta estimasi tonase hasil panen.",
            },
            {
              title: "Waktu Panen (Minggu & Bulan)",
              desc: "Memetakan jadwal cabut singkong ke dalam slot mingguan (misal 'November 2026 Mgg 2') yang menjadi basis agregasi pasokan AI.",
            },
            {
              title: "Kartu Profil Kelompok Tani",
              desc: "Rangkuman total luas lahan garapan, jumlah petak aktif, dan kontak koordinator kelompok tani di wilayah Trawas.",
            },
          ]}
          howToAddOrAct={[
            {
              title: "Klik '+ Tambah Jadwal Panen'",
              desc: "Buka formulir pendaftaran rencana panen melalui tombol hijau di kanan atas.",
            },
            {
              title: "Pilih Metode Estimasi",
              desc: "Pilih 'Bulan & Minggu Panen' langsung, atau gunakan 'Bulan Tanam + Umur Singkong' (9–10 bulan) agar tanggal panen terhitung otomatis.",
            },
            {
              title: "Simpan Rencana",
              desc: "Masukkan luas lahan dan perkiraan tonase (kg). Data tersimpan langsung mengalir ke grafik prediksi pasokan AI.",
            },
          ]}
          roleTarget="Modul ini diisi oleh Petani & Ketua Poktan Trawas untuk mendaftarkan jadwal panen, serta dipantau oleh Koordinator Rantai Pasok untuk memastikan kepastian suplai singkong lokal."
        />

        {/* Farms Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {farms.map((f) => (
            <div key={f.id} className="bg-white p-3.5 rounded-xl border border-gray-200 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-green-800 font-bold">
                <MapPin className="w-3.5 h-3.5" />
                <span>{f.group_name || "Lahan Poktan"}</span>
              </div>
              <p className="text-gray-500 mt-1">{f.village}</p>
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-gray-700">
                <span>Luas: <strong>{f.area_hectares} ha</strong></span>
                <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-semibold">Aktif</span>
              </div>
            </div>
          ))}
        </div>

        {/* Plans Table & Month Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Daftar Rencana Panen Terdata
              </h3>
              <p className="text-[11px] text-gray-500">
                Disinkronkan langsung sebagai masukan jadwal suplai untuk peramalan AI mingguan/bulanan.
              </p>
            </div>

            {/* Quick Month Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Filter Bulan:</span>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-800"
              >
                <option value="all">Semua Bulan</option>
                <option value="2026-10">Oktober 2026</option>
                <option value="2026-11">November 2026</option>
                <option value="2026-12">Desember 2026</option>
                <option value="2027-01">Januari 2027</option>
                <option value="2027-02">Februari 2027</option>
              </select>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Komoditas & Varietas</th>
                  <th className="py-2.5 px-3">Tanggal Tanam</th>
                  <th className="py-2.5 px-3">Target Waktu Panen (Minggu / Bulan)</th>
                  <th className="py-2.5 px-3 text-right">Luas (ha)</th>
                  <th className="py-2.5 px-3 text-right">Estimasi Hasil (kg)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Asal Data</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-gray-400">
                      Tidak ada rencana panen pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-semibold text-gray-900">
                        {p.crop_name} <span className="text-gray-500 font-normal">({p.variety})</span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">{p.planting_date || "-"}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-green-900">
                          {p.expected_harvest_date}
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                          {getWeekAndMonthLabel(p.expected_harvest_date)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700">{p.area_hectares} ha</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-gray-900">
                        {Number(p.expected_yield_kg || 0).toLocaleString("id-ID")} kg
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={p.data_origin} />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Tambah Rencana Panen Ramah Petani */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-gray-200 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Input Jadwal Tanam & Panen Singkong
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Pilih target waktu panen berbasis minggu atau perkiraan umur tanaman.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                {/* Lahan */}
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Pilih Lahan / Poktan:</label>
                  <select
                    value={farmId}
                    onChange={(e) => setFarmId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700 bg-white"
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.group_name} ({f.village}) - {f.area_hectares} ha
                      </option>
                    ))}
                  </select>
                </div>

                {/* Varietas & Luas */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Varietas Singkong:</label>
                    <select
                      value={variety}
                      onChange={(e) => {
                        setVariety(e.target.value);
                        setCropName(`Singkong ${e.target.value}`);
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700 bg-white"
                    >
                      <option value="Gajah">Singkong Gajah (Standar Trawas - Umur 9-10 Bln)</option>
                      <option value="Kaspro">Singkong Kaspro (Industri Tepung - Umur 9 Bln)</option>
                      <option value="Manggu">Singkong Manggu / Mentega (Keripik - Umur 8 Bln)</option>
                      <option value="Mukibat">Singkong Mukibat (Umur 10-12 Bln)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Luas Petak Tanam (ha):</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={areaHectares}
                      onChange={(e) => handleAreaChange(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700"
                    />
                  </div>
                </div>

                {/* MODE SELECTION FOR TIMING */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wide">
                      Cara Menentukan Waktu Panen:
                    </span>
                  </div>

                  {/* Mode Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 bg-gray-200/70 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTimingMode("week_month")}
                      className={`py-1.5 px-2 rounded-md font-semibold text-[11px] text-center transition-all cursor-pointer ${
                        timingMode === "week_month"
                          ? "bg-white text-green-800 shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Bulan & Minggu
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimingMode("plant_age")}
                      className={`py-1.5 px-2 rounded-md font-semibold text-[11px] text-center transition-all cursor-pointer ${
                        timingMode === "plant_age"
                          ? "bg-white text-green-800 shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Umur Tanam
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimingMode("exact_date")}
                      className={`py-1.5 px-2 rounded-md font-semibold text-[11px] text-center transition-all cursor-pointer ${
                        timingMode === "exact_date"
                          ? "bg-white text-green-800 shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Tanggal Kalender
                    </button>
                  </div>

                  {/* Opsi 1: Bulan & Minggu */}
                  {timingMode === "week_month" && (
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-medium text-gray-600 block mb-0.5">Bulan Target:</label>
                          <select
                            value={targetMonth}
                            onChange={(e) => setTargetMonth(parseInt(e.target.value, 10))}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                          >
                            {MONTH_NAMES.map((name, idx) => (
                              <option key={idx} value={idx}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="font-medium text-gray-600 block mb-0.5">Tahun:</label>
                          <select
                            value={targetYear}
                            onChange={(e) => setTargetYear(parseInt(e.target.value, 10))}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                          >
                            <option value={2026}>2026</option>
                            <option value={2027}>2027</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-medium text-gray-600 block mb-1">Pilih Minggu Panen:</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((wk) => {
                            const range = getWeekDateRange(targetYear, targetMonth, wk);
                            const isSelected = targetWeek === wk;
                            return (
                              <button
                                key={wk}
                                type="button"
                                onClick={() => setTargetWeek(wk)}
                                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-green-700 text-white border-green-800 font-bold shadow-xs"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-green-600 font-medium"
                                }`}
                              >
                                <div className="text-[11px]">Minggu {wk}</div>
                                <div className={`text-[9px] ${isSelected ? "text-green-100" : "text-gray-400"}`}>
                                  {range.start.split(" ")[0]}-{range.end.split(" ")[0]} {MONTH_NAMES[targetMonth].slice(0, 3)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 p-2.5 rounded-lg text-green-900 text-[11px] flex items-center justify-between">
                        <div>
                          <strong>Target Terpilih:</strong> Minggu ke-{targetWeek} {MONTH_NAMES[targetMonth]} {targetYear}
                          <span className="text-gray-500 block text-[10px]">
                            Rentang panen: {getWeekDateRange(targetYear, targetMonth, targetWeek).start} s/d {getWeekDateRange(targetYear, targetMonth, targetWeek).end} {targetYear}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-green-800 bg-white px-2 py-1 rounded border border-green-300">
                          {expectedDate}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Opsi 2: Umur Tanam */}
                  {timingMode === "plant_age" && (
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-medium text-gray-600 block mb-0.5">Bulan Tanam:</label>
                          <select
                            value={plantMonth}
                            onChange={(e) => setPlantMonth(parseInt(e.target.value, 10))}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                          >
                            {MONTH_NAMES.map((name, idx) => (
                              <option key={idx} value={idx}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="font-medium text-gray-600 block mb-0.5">Tahun Tanam:</label>
                          <select
                            value={plantYear}
                            onChange={(e) => setPlantYear(parseInt(e.target.value, 10))}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                          >
                            <option value={2025}>2025</option>
                            <option value={2026}>2026</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-medium text-gray-600 block mb-0.5">Lama Umur Tumbuh (Bulan):</label>
                        <select
                          value={growthMonths}
                          onChange={(e) => setGrowthMonths(parseInt(e.target.value, 10))}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                        >
                          <option value={8}>8 Bulan (Varietas Cepat / Manggu)</option>
                          <option value={9}>9 Bulan (Varietas Standar / Kaspro)</option>
                          <option value={10}>10 Bulan (Varietas Optimal / Gajah Trawas)</option>
                          <option value={11}>11 Bulan</option>
                          <option value={12}>12 Bulan (Varietas Jumbo / Mukibat)</option>
                        </select>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-950 text-[11px] flex items-center justify-between">
                        <div>
                          <strong>Perkiraan Siap Panen:</strong> {getWeekAndMonthLabel(expectedDate)}
                          <span className="text-gray-500 block text-[10px]">
                            Tanam {MONTH_NAMES[plantMonth]} {plantYear} + {growthMonths} bulan tumbuh
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-2 py-1 rounded border border-emerald-300">
                          {expectedDate}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Opsi 3: Tanggal Kalender Pasti */}
                  {timingMode === "exact_date" && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-medium text-gray-600 block mb-0.5">Tanggal Tanam (Opsional):</label>
                          <input
                            type="date"
                            value={plantingDate}
                            onChange={(e) => setPlantingDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="font-medium text-gray-600 block mb-0.5">Tanggal Pasti Panen:</label>
                          <input
                            type="date"
                            required
                            value={expectedDate}
                            onChange={(e) => setExpectedDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        *Terbaca dalam sistem sebagai: <strong>{getWeekAndMonthLabel(expectedDate)}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Estimasi Hasil Panen */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-gray-700">Estimasi Hasil Panen (kg):</label>
                    <span className="text-[10px] text-green-700 font-semibold">
                      ~18.000 kg (18 ton) per ha
                    </span>
                  </div>
                  <input
                    type="number"
                    value={expectedYield}
                    onChange={(e) => setExpectedYield(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700 font-bold text-gray-800"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    *Nilai estimasi hasil panen ini langsung masuk ke dalam model prediksi pasokan mingguan AI.
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg shadow-xs cursor-pointer"
                  >
                    {saving ? "Menyimpan..." : "Simpan Jadwal Panen"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
