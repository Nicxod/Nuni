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
} from "lucide-react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { InventoryBatch, Farm } from "@/types";

export default function InventoryPage() {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State for adding new harvest batch
  const [showModal, setShowModal] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [quantityKg, setQuantityKg] = useState("5000");
  const [qualityGrade, setQualityGrade] = useState("A");
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
      // Deadline SOP 48 jam (2 hari)
      const deadline = new Date(hDate);
      deadline.setDate(deadline.getDate() + 2);
      const deadlineStr = deadline.toISOString().split("T")[0];

      await api.createInventoryBatch({
        farm_id: selectedFarmId,
        batch_code: batchCode || `BT-TRW-${harvestDate.replace(/-/g, "")}-${Math.floor(Math.random() * 90 + 10)}`,
        harvest_date: harvestDate,
        initial_quantity_kg: Number(quantityKg),
        available_quantity_kg: Number(quantityKg),
        reserved_quantity_kg: 0,
        quality_grade: qualityGrade,
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

  const filtered = batches.filter((b) =>
    b.batch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.condition_notes || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Inventaris Batch Stok Singkong Trawas
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Pelacakan kuantitas fisik, mutu (grade), tanggal panen dan batas penanganan pascapanen per batch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              + Catat Hasil Panen Aktual (Batch Baru)
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

        {/* SOP Kesegaran Callout (PRD Section 9.2) */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs flex items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <span>
              <strong>Parameter SOP Singkong Segar Trawas:</strong> Singkong segar rentan mengalami pencokelatan vaskular (PPD) dalam 2–3 hari setelah dicabut. Batch yang berusia &gt; 2 hari diprioritaskan untuk distribusi cepat atau dialihkan ke fasilitas pengolahan.
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kode batch atau catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500">Filter Status:</span>
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
              <option value="spoiled">Rusak</option>
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
                  <th className="py-2.5 px-3">Tanggal Panen</th>
                  <th className="py-2.5 px-3 text-center">Mutu (Grade)</th>
                  <th className="py-2.5 px-3 text-right">Stok Awal (kg)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-green-800">Tersedia (kg)</th>
                  <th className="py-2.5 px-3 text-right text-blue-700">Dialokasikan (kg)</th>
                  <th className="py-2.5 px-3">Batas SOP Penanganan</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Catatan Kondisi</th>
                  <th className="py-2.5 px-3">Asal Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => {
                  const hDate = new Date(b.harvest_date);
                  const diffDays = currentTimestamp
                    ? Math.floor((currentTimestamp - hDate.getTime()) / (1000 * 3600 * 24))
                    : 0;
                  const isUrgent = diffDays >= 2 && b.status === "available";

                  return (
                    <tr key={b.id} className={`hover:bg-gray-50/50 ${isUrgent ? "bg-amber-50/30" : ""}`}>
                      <td className="py-2.5 px-3 font-bold text-gray-900 font-mono">
                        {b.batch_code}
                        {isUrgent && (
                          <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-amber-500" title="Usia > 2 hari" />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700">
                        {b.harvest_date}
                        <span className="text-[10px] text-gray-400 block">({diffDays} hari lalu)</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-semibold bg-gray-100 text-gray-800">
                          Grade {b.quality_grade || "A"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700">
                        {Number(b.initial_quantity_kg).toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-green-800">
                        {Number(b.available_quantity_kg).toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 px-3 text-right text-blue-700">
                        {Number(b.reserved_quantity_kg).toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">
                        {b.handling_deadline || "Segera olah"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={b.status} type="batch" />
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">
                        {b.condition_notes || "-"}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={b.data_origin} />
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
                    Daftarkan singkong segar yang baru dicabut dari lahan ke sistem stok inventaris.
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
                      <option value="B">Grade B (Ukuran Campur, Standar)</option>
                      <option value="C">Grade C (Patah / Kecil, Cocok Olahan)</option>
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
                  <span className="text-[10px] text-amber-700 mt-0.5 block">
                    *Sistem otomatis menyetel batas SOP penanganan 48 jam untuk pencegahan kerusakan pencokelatan vaskular (PPD).
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
