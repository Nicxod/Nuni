"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Building,
  TrendingUp,
} from "lucide-react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { SummaryReport } from "@/types";

export default function ReportsPage() {
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await api.getSummaryReport();
        setSummary(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Laporan Eksekutif & Ringkasan Audit Rantai Pasok
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Konsolidasi data operasional panen, penyerapan pasar, dan kepatuhan transparansi simulasi pilot Trawas.
            </p>
          </div>

          <a
            href={api.getExportTransactionsCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Laporan Transaksi CSV
          </a>
        </div>

        {/* Executive Summary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-gray-200 text-xs shadow-xs">
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500 block text-[11px]">Total Petak Lahan Aktif:</span>
            <strong className="text-xl font-bold text-gray-900">{summary?.total_crop_plans_active || 4} Petak</strong>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500 block text-[11px]">Total Stok Gudang Fisik:</span>
            <strong className="text-xl font-bold text-green-800">
              {Number(summary?.total_inventory_available_kg || 0).toLocaleString("id-ID")} kg
            </strong>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500 block text-[11px]">Pesanan Terkonfirmasi:</span>
            <strong className="text-xl font-bold text-blue-800">
              {Number(summary?.total_confirmed_orders_kg || 0).toLocaleString("id-ID")} kg
            </strong>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500 block text-[11px]">Mitra Pembeli Terdata:</span>
            <strong className="text-xl font-bold text-amber-800">{summary?.registered_buyers_count || 4} UMKM/Pabrik</strong>
          </div>
        </div>

        {/* Validation and Field Readiness Principles (PRD Section 26 & 27) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-green-700" />
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Kepatuhan Prinsip Transparansi & Validasi Lapangan Trawas
              </h3>
              <p className="text-[11px] text-gray-500">
                Poin verifikasi lapangan sesuai Bab 26 & 27 PRD CassavaFlow AI.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border border-gray-200 space-y-2">
              <span className="font-bold text-gray-900 block text-xs">
                1. Status Labeling Data Simulasi
              </span>
              <p className="text-gray-600 leading-relaxed text-[11px]">
                Seluruh data yang ditampilkan dalam sistem saat ini menggunakan penanda <strong>SIMULASI</strong> sampai dilakukan sinkronisasi kontrak riil dengan kelompok tani dan UMKM Trawas. Tidak ada klaim data fiktif sebagai transaksi riil.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-gray-200 space-y-2">
              <span className="font-bold text-gray-900 block text-xs">
                2. Verifikasi Batas Umur Pascapanen Singkong
              </span>
              <p className="text-gray-600 leading-relaxed text-[11px]">
                Sistem tidak menciptakan estimasi kedaluwarsa buatan sendiri, melainkan mengadopsi SOP biologis singkong segar (pencokelatan enzimatik terjadi dalam 48-72 jam pascapanen tanpa pengolahan).
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-gray-200 space-y-2">
              <span className="font-bold text-gray-900 block text-xs">
                3. Pencegahan Double Counting Peramalan
              </span>
              <p className="text-gray-600 leading-relaxed text-[11px]">
                Pesanan terkonfirmasi (confirmed orders) dan kebutuhan terencana (planned demand) dipisahkan dari permintaan aktual yang telah terpenuhi, menjamin integritas perhitungan neraca pasokan.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-gray-200 space-y-2">
              <span className="font-bold text-gray-900 block text-xs">
                4. Persetujuan Manusia (Human-In-The-Loop)
              </span>
              <p className="text-gray-600 leading-relaxed text-[11px]">
                Setiap pemindahan stok dari status tersedia menjadi teralokasi atau diproses pengolahan memerlukan konfirmasi otorisasi dan tercatat dalam sistem audit log.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
