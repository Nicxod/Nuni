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
  Plus,
  X,
} from "lucide-react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { Transaction, Buyer } from "@/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  // Modal create transaction state
  const [showModal, setShowModal] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const [customBuyerName, setCustomBuyerName] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [qtyOrderedKg, setQtyOrderedKg] = useState("2000");
  const [qtyFulfilledKg, setQtyFulfilledKg] = useState("2000");
  const [unitPrice, setUnitPrice] = useState("2400");
  const [txStatus, setTxStatus] = useState<"fulfilled" | "confirmed" | "cancelled">("fulfilled");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, bRes] = await Promise.allSettled([
        api.getTransactions(statusFilter ? { status_filter: statusFilter } : undefined),
        api.getBuyers(),
      ]);
      if (tRes.status === "fulfilled") setTransactions(tRes.value);
      if (bRes.status === "fulfilled") {
        setBuyers(bRes.value);
        if (bRes.value.length > 0 && !selectedBuyerId) {
          setSelectedBuyerId(bRes.value[0].id);
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

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const matchedBuyer = buyers.find((b) => b.id === selectedBuyerId);
      const finalBuyerName = matchedBuyer ? matchedBuyer.business_name : customBuyerName || "Mitra UMKM Trawas";
      const qOrd = Number(qtyOrderedKg) || 0;
      const qFul = Number(qtyFulfilledKg) || qOrd;
      const uPrice = Number(unitPrice) || 0;
      const totalAmt = qFul * uPrice;

      await api.createTransaction({
        buyer_id: selectedBuyerId || (matchedBuyer ? matchedBuyer.id : "buyer-custom"),
        buyer_name: finalBuyerName,
        transaction_date: transactionDate,
        order_date: transactionDate,
        fulfilled_date: txStatus === "fulfilled" ? transactionDate : null,
        quantity_ordered_kg: qOrd,
        quantity_fulfilled_kg: qFul,
        unit_price: uPrice,
        total_amount: totalAmt,
        status: txStatus,
        data_origin: "simulation",
        notes: notes || "Pencatatan langsung via form simulasi ResiLokal",
      });

      setShowModal(false);
      setNotes("");
      await loadData();
    } catch (err: any) {
      alert("Gagal mencatat transaksi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

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

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Catat Transaksi Baru
            </button>

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
              {importing ? "Mengimpor CSV..." : "Impor CSV"}
            </button>

            <a
              href={api.getExportTransactionsCsvUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
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
                      {Number(t.quantity_ordered_kg || 0).toLocaleString("id-ID")} kg
                    </td>
                    <td className="py-2.5 px-3 text-right text-green-700">
                      {Number(t.quantity_fulfilled_kg || 0).toLocaleString("id-ID")} kg
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700">
                      Rp {Number(t.unit_price || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-green-800">
                      Rp {Number(t.total_amount || 0).toLocaleString("id-ID")}
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

        {/* Modal Catat Transaksi Baru */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-800 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      Catat Transaksi Penjualan Singkong Baru
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Pencatatan realisasi pesanan mitra UMKM / Pembeli Trawas
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Mitra Pembeli: *
                  </label>
                  {buyers.length > 0 ? (
                    <select
                      value={selectedBuyerId}
                      onChange={(e) => setSelectedBuyerId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                    >
                      {buyers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.business_name} ({b.village_or_area})
                        </option>
                      ))}
                      <option value="custom">+ Nama Pembeli Lainnya</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Contoh: UMKM Keripik Barokah Trawas"
                      value={customBuyerName}
                      onChange={(e) => setCustomBuyerName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                    />
                  )}
                  {selectedBuyerId === "custom" && (
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama pembeli..."
                      value={customBuyerName}
                      onChange={(e) => setCustomBuyerName(e.target.value)}
                      className="w-full mt-2 px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Tanggal Transaksi: *
                    </label>
                    <input
                      type="date"
                      required
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Status Transaksi:
                    </label>
                    <select
                      value={txStatus}
                      onChange={(e) => setTxStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                    >
                      <option value="fulfilled">Terkirim / Selesai (Fulfilled)</option>
                      <option value="confirmed">Dikonfirmasi (Confirmed)</option>
                      <option value="cancelled">Dibatalkan (Cancelled)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Qty Pesanan (kg): *
                    </label>
                    <input
                      type="number"
                      required
                      min="10"
                      step="50"
                      value={qtyOrderedKg}
                      onChange={(e) => {
                        setQtyOrderedKg(e.target.value);
                        if (txStatus === "fulfilled") setQtyFulfilledKg(e.target.value);
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Qty Terpenuhi (kg):
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="50"
                      value={qtyFulfilledKg}
                      onChange={(e) => setQtyFulfilledKg(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Harga / kg (Rp): *
                    </label>
                    <input
                      type="number"
                      required
                      min="500"
                      step="100"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Total Preview */}
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Estimasi Total Nilai Transaksi:</span>
                  <strong className="text-green-800 text-sm">
                    Rp {(Number(qtyFulfilledKg || qtyOrderedKg || 0) * Number(unitPrice || 0)).toLocaleString("id-ID")}
                  </strong>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Catatan Transaksi:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Singkong segar panen Blok A, kualitas super"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Menyimpan..." : "Simpan Transaksi"}
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
