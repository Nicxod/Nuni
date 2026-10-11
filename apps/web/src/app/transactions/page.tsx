"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Receipt,
  Download,
  Upload,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { Transaction } from "@/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getTransactions(statusFilter ? { status_filter: statusFilter } : undefined);
      setTransactions(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportResult(null);
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.importTransactionsCsv(formData);
      setImportResult(res);
      await loadData();
    } catch (err: any) {
      alert("Gagal impor CSV: " + err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Riwayat Transaksi & Pembelian Singkong
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Pencatatan riwayat pesanan nyata untuk melatih model AI Demand Forecasting dan memvalidasi serapan pasar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-800 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {importing ? "Mengimpor CSV..." : "Impor CSV Transaksi"}
            </button>

            <a
              href={api.getExportTransactionsCsvUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV
            </a>
          </div>
        </div>

        {/* CSV Import Report Banner */}
        {importResult && (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-blue-700" />
                {importResult.message}
              </span>
              <button
                onClick={() => setImportResult(null)}
                className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            <p className="text-blue-800">
              Total Baris: <strong>{importResult.total_rows}</strong> | Berhasil:{" "}
              <strong className="text-emerald-700">{importResult.successful_rows}</strong> | Gagal:{" "}
              <strong className="text-rose-700">{importResult.failed_rows}</strong>
            </p>
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="p-2 bg-white rounded border border-rose-200 text-rose-800 space-y-1">
                <span className="font-bold block">Rincian Baris Gagal:</span>
                {importResult.errors.map((errStr: string, idx: number) => (
                  <p key={idx} className="font-mono text-[11px]">• {errStr}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white font-medium"
            >
              <option value="">Semua Status</option>
              <option value="confirmed">Confirmed (Aktif)</option>
              <option value="fulfilled">Fulfilled (Selesai)</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled (Batal)</option>
            </select>
          </div>
          <span className="text-gray-400">Total Transaksi: {transactions.length}</span>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Pembeli / UMKM</th>
                  <th className="py-2.5 px-3">Tgl Transaksi</th>
                  <th className="py-2.5 px-3 text-right">Dipesan (kg)</th>
                  <th className="py-2.5 px-3 text-right">Dipenuhi (kg)</th>
                  <th className="py-2.5 px-3 text-right">Harga / kg</th>
                  <th className="py-2.5 px-3 text-right font-bold text-gray-900">Total Nilai</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Catatan</th>
                  <th className="py-2.5 px-3">Asal Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-semibold text-gray-900">{t.buyer_name || "Pembeli Trawas"}</td>
                    <td className="py-2.5 px-3 text-gray-600">{t.transaction_date}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                      {Number(t.quantity_ordered_kg).toLocaleString("id-ID")} kg
                    </td>
                    <td className="py-2.5 px-3 text-right text-green-700">
                      {Number(t.quantity_fulfilled_kg).toLocaleString("id-ID")} kg
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700">
                      Rp {Number(t.unit_price).toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-green-800">
                      Rp {Number(t.total_amount).toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        t.status === "fulfilled" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        t.status === "confirmed" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        t.status === "cancelled" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">{t.notes || "-"}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={t.data_origin} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
