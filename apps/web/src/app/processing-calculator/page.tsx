"use client";

import React, { useEffect, useState } from "react";
import {
  Calculator,
  ArrowRight,
  TrendingUp,
  Coins,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { ProcessingOption, ProcessingCalcResponse } from "@/types";

export default function ProcessingCalculatorPage() {
  const [options, setOptions] = useState<ProcessingOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [inputKg, setInputKg] = useState("1000");
  const [rawPrice, setRawPrice] = useState("2500");
  const [result, setResult] = useState<ProcessingCalcResponse | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await api.getProcessingOptions();
        setOptions(res);
        if (res.length > 0) {
          setSelectedOptionId(res[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchOptions();
  }, []);

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setCalculating(true);
      const res = await api.estimateProcessingCost({
        processing_option_id: selectedOptionId || undefined,
        input_raw_cassava_kg: Number(inputKg),
        raw_cassava_price_per_kg: Number(rawPrice),
      });
      setResult(res);
    } catch (err: any) {
      alert("Gagal menghitung: " + err.message);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (selectedOptionId) {
      handleCalculate();
    }
  }, [selectedOptionId]);

  const selectedOpt = options.find((o) => o.id === selectedOptionId);

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Kalkulator Biaya Olahan & Nilai Tambah Singkong (P1)
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Simulasi deterministik perbandingan margin penjualan singkong mentah versus diversifikasi produk olahan UMKM Trawas.
            </p>
          </div>
        </div>

        {/* Calculator Form & Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Form Parameters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <Calculator className="w-4 h-4 text-green-700" />
              Parameter Input Olahan
            </h3>

            <form onSubmit={handleCalculate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Pilihan Produk Olahan:</label>
                <select
                  value={selectedOptionId}
                  onChange={(e) => setSelectedOptionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-medium focus:ring-1 focus:ring-green-700"
                >
                  {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} (Rendemen {(Number(opt.yield_ratio || 0) * 100).toFixed(0)}%)
                    </option>
                  ))}
                </select>
                {selectedOpt?.description && (
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    {selectedOpt.description}
                  </p>
                )}
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Volume Singkong Mentah Masuk (kg):</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={inputKg}
                  onChange={(e) => setInputKg(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-700 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Harga Acuan Singkong Mentah (Rp/kg):</label>
                <input
                  type="number"
                  required
                  value={rawPrice}
                  onChange={(e) => setRawPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-700"
                />
              </div>

              {selectedOpt && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 text-[11px] text-gray-600">
                  <span className="font-bold text-gray-800 block">Struktur Biaya Pengolahan Terkonfigurasi:</span>
                  <div className="flex justify-between">
                    <span>Tenaga Kerja:</span>
                    <strong>Rp {Number(selectedOpt.labor_cost || 0).toLocaleString("id-ID")}/kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Energi & Penggorengan/Pengeringan:</span>
                    <strong>Rp {Number(selectedOpt.energy_cost || 0).toLocaleString("id-ID")}/kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Kemasan & Label:</span>
                    <strong>Rp {Number(selectedOpt.packaging_cost || 0).toLocaleString("id-ID")}/kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Transportasi / Distribusi:</span>
                    <strong>Rp {Number(selectedOpt.distribution_cost || 0).toLocaleString("id-ID")}/kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Harga Jual Target Produk Jadi:</span>
                    <strong className="text-green-800">Rp {Number(selectedOpt.expected_selling_price_per_unit || 0).toLocaleString("id-ID")}/{selectedOpt.output_unit || "unit"}</strong>
                  </div>
                  <div className="pt-1 border-t border-gray-200 text-[10px] text-gray-500">
                    SOP Terkait: {selectedOpt.food_safety_sop_reference || "SOP Standar Dinas"}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={calculating}
                className="w-full py-2 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                {calculating ? "Menghitung..." : "Hitung Nilai Tambah"}
              </button>
            </form>
          </div>

          {/* Result Display & Comparison */}
          {result && (
            <div className="lg:col-span-2 space-y-4">
              {/* Comparison Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Jual Mentah */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    Opsi A: Dijual Sebagai Singkong Mentah
                  </span>
                  <p className="text-2xl font-bold text-gray-800">
                    Rp {Number(result.raw_sale_revenue_comparison ?? (Number(result.input_raw_cassava_kg || inputKg) * Number(rawPrice))).toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Number(result.input_raw_cassava_kg || inputKg).toLocaleString("id-ID")} kg @ Rp {Number(rawPrice).toLocaleString("id-ID")}/kg
                  </p>
                  <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-600">
                    Risiko: Singkong segar wajib terkirim dalam 2-3 hari untuk menghindari penurunan mutu.
                  </div>
                </div>

                {/* Diolah */}
                <div className="bg-white p-4 rounded-xl border-2 border-green-600 shadow-xs space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-0.5 rounded text-[10px] font-bold">
                    DIVERSIFIKASI
                  </div>
                  <span className="text-[11px] font-bold text-green-800 uppercase tracking-wider block">
                    Opsi B: Diolah Menjadi Produk Jadi
                  </span>
                  <p className="text-2xl font-bold text-green-800">
                    Rp {Number(result.gross_revenue || 0).toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-green-700 font-semibold">
                    Hasil Jadi: {Number(result.output_finished_quantity ?? (result as any).estimated_output_units ?? 0).toLocaleString("id-ID")} {result.output_unit || "pack"} (Rendemen {(Number(result.yield_ratio || 0.4) * 100).toFixed(0)}%)
                  </p>
                  <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-700 flex justify-between font-semibold">
                    <span>Estimasi Margin Kontribusi:</span>
                    <span className="text-green-800 font-bold">
                      Rp {Number(result.estimated_contribution_margin || 0).toLocaleString("id-ID")} ({Number(result.margin_percentage || 0).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Cost & Margin Detailed Breakdown Table */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  Rincian Komponen Biaya & Laba Kontribusi
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 block text-[11px]">Bahan Baku:</span>
                    <strong className="text-gray-900 font-mono">Rp {Number(result.raw_material_cost ?? (Number(result.input_raw_cassava_kg || inputKg) * Number(rawPrice))).toLocaleString("id-ID")}</strong>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 block text-[11px]">Total Biaya Olah:</span>
                    <strong className="text-gray-900 font-mono">Rp {Number(result.total_processing_cost || 0).toLocaleString("id-ID")}</strong>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 block text-[11px]">Total Biaya Gabungan:</span>
                    <strong className="text-gray-900 font-mono">Rp {Number(result.total_combined_cost ?? ((result.raw_material_cost || 0) + (result.total_processing_cost || 0))).toLocaleString("id-ID")}</strong>
                  </div>
                  <div className="p-2.5 bg-green-50 rounded-lg">
                    <span className="text-green-700 block text-[11px]">HPP per Unit Jadi:</span>
                    <strong className="text-green-900 font-mono">Rp {Number(result.unit_cost_per_finished_unit || 0).toLocaleString("id-ID")}/{result.output_unit || "unit"}</strong>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    <strong>Catatan Transparansi Akuntansi (PRD Bagian 10.2):</strong> {result.disclaimer || "Hasil kalkulasi ini adalah contribution margin sebelum pajak dan overhead tetap."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}
