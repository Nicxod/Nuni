"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Plus,
  AlertTriangle,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Search,
  CheckCircle,
  Snowflake,
  Leaf,
  Clock,
  Warehouse,
} from "lucide-react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { FeatureGuide } from "@/components/FeatureGuide";
import { api } from "@/lib/api";
import { InventoryBatch, Farm } from "@/types";

export default function InventoryPage() {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Modal State for adding new harvest batch
  const [showModal, setShowModal] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [quantityKg, setQuantityKg] = useState("5000");
  const [qualityGrade, setQualityGrade] = useState("A");
  const [batchCategory, setBatchCategory] = useState<"fresh_tuber" | "preserved_tuber">("fresh_tuber");
  const [preservationMethod, setPreservationMethod] = useState("blanch_frozen");
  const [conditionNotes, setConditionNotes] = useState("Singkong baru dicabut pagi hari, umbi segar dan mulus.");
  const [saving, setSaving] = useState(false);

  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);

  useEffect(() => {
    setCurrentTimestamp(Date.now());
    const today = new Date().toISOString().split("T")[0];
    setHarvestDate(today);
    setBatchCode(`BT-TRW-${today.replace(/-/g, "")}-01`);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bRes, fRes] = await Promise.allSettled([
        api.getInventoryBatches(statusFilter ? { status_filter: statusFilter } : undefined),
        api.getFarms(),
      ]);
      if (bRes.status === "fulfilled") setBatches(bRes.value);
      if (fRes.status === "fulfilled") {
        setFarms(fRes.value);
        if (fRes.value.length > 0 && !selectedFarmId) {
          setSelectedFarmId(fRes.value[0].id);
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
  }, [statusFilter]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId || !harvestDate || !quantityKg) {
      alert("Mohon lengkapi lahan, tanggal panen, dan kuantitas hasil panen.");
      return;
    }

    try {
      setSaving(true);
      const hDate = new Date(harvestDate);
      let deadlineStr = "";

      if (batchCategory === "preserved_tuber") {
        // Tahan 6 bulan di cold storage
        const dl = new Date(hDate);
        dl.setMonth(dl.getMonth() + 6);
        deadlineStr = `${dl.toISOString().split("T")[0]} (Tahan 6 Bulan Cold Storage)`;
      } else {
        // Deadline SOP 48 jam (2 hari)
        const dl = new Date(hDate);
        dl.setDate(dl.getDate() + 2);
        deadlineStr = dl.toISOString().split("T")[0];
      }

      const isPreserved = batchCategory === "preserved_tuber";

      await api.createInventoryBatch({
        farm_id: selectedFarmId,
        batch_code: batchCode || `BT-TRW-${harvestDate.replace(/-/g, "")}-${Math.floor(Math.random() * 90 + 10)}`,
        harvest_date: harvestDate,
        initial_quantity_kg: Number(quantityKg),
        available_quantity_kg: Number(quantityKg),
        reserved_quantity_kg: 0,
        quality_grade: qualityGrade,
        batch_category: batchCategory,
        preservation_method: isPreserved ? (preservationMethod as any) : null,
        storage_location: isPreserved ? "Cold Storage Koperasi Trawas (-18°C)" : "Pos Pengumpul Trawas",
        shelf_life_months: isPreserved ? 6 : 0,
        condition_notes: conditionNotes,
        status: "available",
        handling_deadline: deadlineStr,
        data_origin: "simulation",
      });

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert("Gagal mencatat batch hasil panen: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = batches.filter((b) => {
    const matchesSearch =
      b.batch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.condition_notes || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !categoryFilter ||
      (categoryFilter === "fresh_tuber" && (!b.batch_category || b.batch_category === "fresh_tuber")) ||
      (categoryFilter === "preserved_tuber" && b.batch_category === "preserved_tuber");
    return matchesSearch && matchesCategory;
  });

  // KPI Calculations
  const freshBatches = batches.filter((b) => !b.batch_category || b.batch_category === "fresh_tuber");
  const preservedBatches = batches.filter((b) => b.batch_category === "preserved_tuber");

  const totalFreshAvailable = freshBatches.reduce((sum, b) => sum + Number(b.available_quantity_kg || 0), 0);
  const totalPreservedAvailable = preservedBatches.reduce((sum, b) => sum + Number(b.available_quantity_kg || 0), 0);
  const totalAllocated = batches.reduce((sum, b) => sum + Number(b.reserved_quantity_kg || 0), 0);

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Inventaris Batch Stok & Cadangan Penyangga Umbi
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Pelacakan kuantitas fisik umbi segar (SOP 48 jam PPD) dan cadangan penyangga umbi diawetkan di Cold Storage untuk pasokan keripik musim kemarau.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Catat Batch Panen Aktual
            </button>
            <Link
              href="/stock-actions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-green-700" />
              Rekomendasi Tindakan Stok
            </Link>
          </div>
        </div>

        {/* Inventory Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Umbi Segar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-500 font-medium block flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-green-600" /> Stok Umbi Segar Tersedia
              </span>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {totalFreshAvailable.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-normal text-gray-500">kg</span>
              </div>
              <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">
                Batas Kritis: SOP 48 Jam (Anti-PPD)
              </span>
            </div>
            <div className="p-2.5 bg-green-50 text-green-800 rounded-lg">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Cadangan Umbi Diawetkan */}
          <div className="bg-gradient-to-br from-sky-50 to-white rounded-xl border border-sky-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-sky-800 font-semibold block flex items-center gap-1">
                <Snowflake className="w-3.5 h-3.5 text-sky-600" /> Cadangan Umbi Awetan (Cold Storage)
              </span>
              <div className="text-xl font-bold text-sky-950 mt-1">
                {totalPreservedAvailable.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-normal text-sky-700">kg</span>
              </div>
              <span className="text-[10px] text-sky-700 font-medium mt-0.5 block">
                Penyangga Musim Kemarau (Tahan 6 Bulan)
              </span>
            </div>
            <div className="p-2.5 bg-sky-100 text-sky-800 rounded-lg">
              <Warehouse className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Stok Teralokasi */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-500 font-medium block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Stok Teralokasi ke Pesanan
              </span>
              <div className="text-xl font-bold text-blue-900 mt-1">
                {totalAllocated.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-normal text-gray-500">kg</span>
              </div>
              <span className="text-[10px] text-blue-700 font-medium mt-0.5 block">
                Siap Kirim ke UMKM Keripik Trawas
              </span>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-800 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Feature Guide */}
        <FeatureGuide
          title="Panduan Inventaris Batch, Kesegaran & Cadangan Penyangga Umbi"
          badge="Gudang & Cadangan Penyangga"
          howToRead={[
            {
              title: "Umbi Segar (🌿) vs Cadangan Umbi Diawetkan (❄️)",
              desc: "Umbi Segar diprioritaskan untuk order mingguan terkonfirmasi (batas aman 48 jam). Cadangan Umbi Diawetkan disimpan dalam wujud irisan blansir beku di Cold Storage Koperasi (tahan 6 bulan) untuk pasokan keripik musim kemarau.",
            },
            {
              title: "Kenapa Tidak Dibuat Tepung Mocaf?",
              desc: "Karena UMKM keripik memerlukan umbi singkong asli untuk digoreng menjadi keripik renyah. Jika semua panen hujan dibuat tepung, maka saat kemarau UMKM keripik tidak punya bahan baku.",
            },
            {
              title: "Indikator Usia & Batas Kritis 48 Jam",
              desc: "Pada umbi segar, warna lencana menunjukkan tingkat risiko PPD: Hijau (<24 jam), Kuning (24–48 jam mendekati batas), Merah (>48 jam / darurat olah).",
            },
          ]}
          howToAddOrAct={[
            {
              title: "Klik '+ Catat Batch Panen Aktual'",
              desc: "Buka formulir saat singkong baru tiba dari ladang ke pos pengumpul Trawas, dan pilih apakah disimpan sebagai stok segar atau dialihkan ke cadangan awetan.",
            },
            {
              title: "Filter Berdasarkan Kategori Stok",
              desc: "Gunakan dropdown filter di bawah untuk melihat khusus stok Umbi Segar atau Cadangan Umbi Diawetkan di Cold Storage.",
            },
            {
              title: "Tindakan Cerdas Stok",
              desc: "Jika ada batch segar mendekati 48 jam atau defisit musim kemarau terdeteksi, buka menu 'Rekomendasi Tindakan Stok' untuk alokasi cerdas.",
            },
          ]}
          roleTarget="Modul ini dijalankan oleh Pengelola Gudang / Koperasi Trawas bersama Koordinator Rantai Pasok untuk memastikan rotasi stok FIFO dan ketersediaan cadangan penyangga terkelola rapi."
        />

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kode batch, metode simpan, atau catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-500">Kategori Stok:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white font-medium"
            >
              <option value="">Semua Kategori</option>
              <option value="fresh_tuber">🌿 Umbi Segar (Max 48 Jam)</option>
              <option value="preserved_tuber">❄️ Cadangan Umbi Diawetkan (Cold Storage)</option>
            </select>

            <span className="text-gray-500 ml-2">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white font-medium"
            >
              <option value="">Semua Status</option>
              <option value="available">Tersedia</option>
              <option value="allocated">Dialokasikan</option>
              <option value="processing">Sedang Olah</option>
              <option value="sold">Terjual</option>
            </select>
          </div>
        </div>

        {/* Batches Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Kode Batch</th>
                  <th className="py-2.5 px-3">Kategori & Lokasi Simpan</th>
                  <th className="py-2.5 px-3">Tanggal Panen</th>
                  <th className="py-2.5 px-3 text-center">Mutu (Grade)</th>
                  <th className="py-2.5 px-3 text-right">Stok Awal (kg)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-green-800">Tersedia (kg)</th>
                  <th className="py-2.5 px-3 text-right text-blue-700">Dialokasikan (kg)</th>
                  <th className="py-2.5 px-3">Batas Penanganan / Shelf-life</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Catatan Kondisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => {
                  const isPreserved = b.batch_category === "preserved_tuber";
                  const hDate = new Date(b.harvest_date);
                  const diffDays = currentTimestamp
                    ? Math.floor((currentTimestamp - hDate.getTime()) / (1000 * 3600 * 24))
                    : 0;
                  const isUrgent = !isPreserved && diffDays >= 2 && b.status === "available";

                  return (
                    <tr key={b.id} className={`hover:bg-gray-50/50 ${isUrgent ? "bg-amber-50/30" : isPreserved ? "bg-sky-50/20" : ""}`}>
                      <td className="py-2.5 px-3 font-bold text-gray-900 font-mono">
                        {b.batch_code}
                        {isUrgent && (
                          <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-amber-500" title="Usia segar > 2 hari" />
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isPreserved ? (
                          <div>
                            <span className="px-2 py-0.5 rounded font-bold bg-sky-100 text-sky-800 text-[10px] inline-flex items-center gap-1">
                              <Snowflake className="w-3 h-3" /> Umbi Diawetkan
                            </span>
                            <span className="text-[10px] text-gray-500 block mt-0.5">
                              {b.storage_location || "Cold Storage Koperasi"}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="px-2 py-0.5 rounded font-bold bg-green-100 text-green-800 text-[10px] inline-flex items-center gap-1">
                              <Leaf className="w-3 h-3" /> Umbi Segar
                            </span>
                            <span className="text-[10px] text-gray-500 block mt-0.5">Pos Pengumpul Trawas</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700">
                        {b.harvest_date}
                        <span className="text-[10px] text-gray-400 block">({diffDays} hari lalu)</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-semibold bg-gray-100 text-gray-800 text-[11px]">
                          Grade {b.quality_grade || "A"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700">
                        {Number(b.initial_quantity_kg || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-green-800">
                        {Number(b.available_quantity_kg || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 px-3 text-right text-blue-700">
                        {Number(b.reserved_quantity_kg || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">
                        {isPreserved ? (
                          <span className="text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {b.handling_deadline || "Tahan 6 Bulan (Cold Storage)"}
                          </span>
                        ) : (
                          <span>{b.handling_deadline || "SOP 48 Jam"}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={b.status} type="batch" />
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 max-w-xs leading-relaxed text-[11px]">
                        {b.condition_notes || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Catat Hasil Panen Aktual */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Catat Hasil Panen Aktual ke Gudang
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Daftarkan hasil panen singkong ke inventaris stok segar atau cadangan umbi diawetkan.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
                {/* Lahan */}
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Lahan Sumber Panen:</label>
                  <select
                    value={selectedFarmId}
                    onChange={(e) => setSelectedFarmId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700 bg-white"
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.group_name} ({f.village})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Peruntukan / Kategori Batch */}
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Peruntukan Stok Panen:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBatchCategory("fresh_tuber");
                        setConditionNotes("Singkong baru dicabut pagi hari, umbi segar dan mulus. Siap order langsung.");
                      }}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        batchCategory === "fresh_tuber"
                          ? "border-green-600 bg-green-50 text-green-900 font-bold"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-green-600" />
                        <span>Umbi Segar</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-normal mt-0.5">SOP 48 Jam (Segera jual/goreng)</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBatchCategory("preserved_tuber");
                        setConditionNotes("Cadangan Penyangga Musim Hujan: Umbi diiris, diblansir & dibekukan kedap udara di Cold Storage untuk bahan baku keripik musim kemarau.");
                      }}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        batchCategory === "preserved_tuber"
                          ? "border-sky-600 bg-sky-50 text-sky-900 font-bold"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Snowflake className="w-3.5 h-3.5 text-sky-600" />
                        <span>Cadangan Awetan</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-normal mt-0.5">Cold Storage (Tahan 6 Bulan)</p>
                    </button>
                  </div>
                </div>

                {batchCategory === "preserved_tuber" && (
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Metode Preservasi Umbi:</label>
                    <select
                      value={preservationMethod}
                      onChange={(e) => setPreservationMethod(e.target.value)}
                      className="w-full px-3 py-1.5 border border-sky-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-700 bg-sky-50/50"
                    >
                      <option value="blanch_frozen">Irisan Blansir Beku (Blanch-Frozen Slices) - Tahan 6 Bulan</option>
                      <option value="cold_storage_paraffin">Cold Storage Suhu Terkendali + Edible Parafin - Tahan 2 Bulan</option>
                      <option value="vacuum_sealed">Kupas Vacuum Sealed Dingin - Tahan 1 Bulan</option>
                    </select>
                  </div>
                )}

                {/* Tanggal Panen & Preset Hari ini */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-gray-700">Tanggal Cabut / Panen:</label>
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date().toISOString().split("T")[0];
                        setHarvestDate(today);
                        setBatchCode(`BT-TRW-${today.replace(/-/g, "")}-01`);
                      }}
                      className="text-[10px] text-green-700 font-semibold hover:underline cursor-pointer"
                    >
                      Set ke Hari Ini
                    </button>
                  </div>
                  <input
                    type="date"
                    required
                    value={harvestDate}
                    onChange={(e) => {
                      setHarvestDate(e.target.value);
                      setBatchCode(`BT-TRW-${e.target.value.replace(/-/g, "")}-01`);
                    }}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700"
                  />
                </div>

                {/* Kode Batch */}
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Kode Batch Stok:</label>
                  <input
                    type="text"
                    required
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700 font-mono"
                  />
                </div>

                {/* Jumlah & Grade */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Jumlah Panen (kg):</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantityKg}
                      onChange={(e) => setQuantityKg(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Mutu (Grade):</label>
                    <select
                      value={qualityGrade}
                      onChange={(e) => setQualityGrade(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700 bg-white"
                    >
                      <option value="A">Grade A (Mulus, Diameter 4-6cm)</option>
                      <option value="B">Grade B (Ukuran Campur, Standar Olahan)</option>
                      <option value="C">Grade C (Patah / Kecil)</option>
                    </select>
                  </div>
                </div>

                {/* Catatan */}
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Catatan Kondisi Pascapanen:</label>
                  <textarea
                    rows={2}
                    value={conditionNotes}
                    onChange={(e) => setConditionNotes(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    {batchCategory === "preserved_tuber"
                      ? "*Disimpan di Cold Storage Koperasi Trawas (-18°C) untuk pasokan bahan baku keripik saat kemarau."
                      : "*Batas SOP 48 jam penanganan untuk mencegah pencokelatan vaskular (PPD)."}
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
                    {saving ? "Menyimpan..." : "Simpan Batch Panen"}
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
