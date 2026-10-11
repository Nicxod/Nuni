"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Layers,
} from "lucide-react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { StockRecommendation, ProcessingOption } from "@/types";

export default function StockActionsPage() {
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Review modal state
  const [selectedRec, setSelectedRec] = useState<StockRecommendation | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [approvedQty, setApprovedQty] = useState<number | "">("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, optRes] = await Promise.allSettled([
        api.getRecommendations(),
        api.getProcessingOptions(),
      ]);
      if (recRes.status === "fulfilled") setRecommendations(recRes.value);
      if (optRes.status === "fulfilled") setProcessingOptions(optRes.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await api.generateRecommendations();
      setRecommendations(res);
      alert(`Berhasil membuat ${res.length} rekomendasi stok baru berdasarkan evaluasi gap & umur batch.`);
    } catch (err: any) {
      alert("Gagal membuat rekomendasi: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const openReviewModal = (rec: StockRecommendation, action: "approve" | "reject") => {
    setSelectedRec(rec);
    setReviewAction(action);
    setReviewNotes(action === "approve" ? "Disetujui untuk eksekusi penanganan stok" : "Ditolak karena alasan operasional lapangan");
    setApprovedQty(rec.quantity_kg || 0);
  };

  const submitReview = async () => {
    if (!selectedRec || !reviewAction) return;
    try {
      setActionLoading(selectedRec.id);
      if (reviewAction === "approve") {
        await api.approveRecommendation(selectedRec.id, reviewNotes, typeof approvedQty === "number" ? approvedQty : undefined);
      } else {
        await api.rejectRecommendation(selectedRec.id, reviewNotes);
      }
      setSelectedRec(null);
      setReviewAction(null);
      await loadData();
    } catch (err: any) {
      alert("Gagal memproses tindakan: " + err.message);
    } finally {
      setActionLoading(null);
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
                Smart Stock & Preservation/Processing Actions
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Rekomendasi alokasi, penjualan segera, dan evaluasi pengolahan/pengawetan sebelum singkong segar rusak.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/processing-calculator"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-800 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              Kalkulator Biaya Olahan
            </Link>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Menganalisis Stok..." : "Evaluasi Rekomendasi Baru"}
            </button>
          </div>
        </div>

        {/* Human in the loop rule card */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs flex items-center justify-between gap-3 text-emerald-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-green-700 shrink-0" />
            <span>
              <strong>Prinsip Kontrol Pengguna:</strong> AI tidak mengubah alokasi gudang atau status transaksi secara otomatis. Semua rekomendasi wajib diverifikasi dan disetujui secara manual oleh penanggung jawab rantai pasok.
            </span>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Daftar Rekomendasi Tindakan Stok
              </h3>
              <p className="text-[11px] text-gray-500">
                Disusun berdasarkan prioritas: (1) Pesanan terkonfirmasi, (2) Usia batch panen & batas SOP, (3) Alternatif pengolahan UMKM.
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                Belum ada rekomendasi aktif. Klik tombol "Evaluasi Rekomendasi Baru" di atas.
              </div>
            ) : (
              recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:border-green-300 transition-all text-xs space-y-2.5 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] ${
                        rec.recommendation_type === "allocate" ? "bg-blue-100 text-blue-800" :
                        rec.recommendation_type === "process" ? "bg-purple-100 text-purple-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        Tindakan: {rec.recommendation_type === "allocate" ? "Alokasi Order" : rec.recommendation_type === "process" ? "Pengolahan Olahan" : "Penjualan Segar"}
                      </span>
                      {rec.batch_code && (
                        <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          Batch: {rec.batch_code}
                        </span>
                      )}
                      <StatusBadge status="SIMULASI" />
                    </div>
                    <StatusBadge status={rec.status} type="recommendation" />
                  </div>

                  <p className="text-xs text-gray-800 leading-relaxed font-medium">
                    {rec.reason}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-[11px] text-gray-600">
                    <div>
                      <span className="text-gray-400 block">Volume Disarankan:</span>
                      <strong className="text-gray-900 text-xs">{Number(rec.quantity_kg || 0).toLocaleString("id-ID")} kg</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Estimasi Nilai:</span>
                      <strong className="text-green-800 text-xs">Rp {Number(rec.estimated_value || 0).toLocaleString("id-ID")}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Estimasi Biaya:</span>
                      <strong className="text-gray-700 text-xs">Rp {Number(rec.estimated_cost || 0).toLocaleString("id-ID")}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Batas Waktu:</span>
                      <strong className="text-gray-900 text-xs">{rec.period_end}</strong>
                    </div>
                  </div>

                  {rec.review_notes && (
                    <div className="p-2 bg-gray-50 rounded-lg text-[11px] text-gray-600 border border-gray-100">
                      <strong>Catatan Peninjauan:</strong> {rec.review_notes}
                    </div>
                  )}

                  {rec.status === "pending" && (
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => openReviewModal(rec, "reject")}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        Tolak Rekomendasi
                      </button>
                      <button
                        onClick={() => openReviewModal(rec, "approve")}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors cursor-pointer shadow-xs"
                      >
                        Setujui & Terapkan Stok
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal for Approval / Rejection */}
        {selectedRec && reviewAction && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900">
                {reviewAction === "approve" ? "Konfirmasi Persetujuan Tindakan Stok" : "Konfirmasi Penolakan Rekomendasi"}
              </h3>
              <p className="text-xs text-gray-600">
                {selectedRec.reason}
              </p>

              {reviewAction === "approve" && (
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Kuantitas Disetujui (kg):
                  </label>
                  <input
                    type="number"
                    value={approvedQty}
                    onChange={(e) => setApprovedQty(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Catatan Verifikasi (Tercatat di Audit Log):
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => { setSelectedRec(null); setReviewAction(null); }}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={submitReview}
                  disabled={actionLoading === selectedRec.id}
                  className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-xs cursor-pointer ${
                    reviewAction === "approve" ? "bg-green-700 hover:bg-green-800" : "bg-rose-700 hover:bg-rose-800"
                  }`}
                >
                  {actionLoading === selectedRec.id ? "Memproses..." : (reviewAction === "approve" ? "Simpan Persetujuan" : "Simpan Penolakan")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
