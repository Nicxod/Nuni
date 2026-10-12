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
import { FeatureGuide } from "@/components/FeatureGuide";
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
      alert(`Berhasil membuat ${res.length} rekomendasi stok baru berdasarkan analisis keseimbangan pasokan & umur batch.`);
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
                Rekomendasi Tindakan Cerdas Stok (Smart Stock Actions)
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Rekomendasi tindakan cerdas AI: Preservasi umbi musim hujan, rilis cadangan umbi musim kemarau, alokasi order UMKM, dan pengamanan stok sebelum batas SOP 48 jam.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/processing-calculator"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-800 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              Kalkulator Untung Olahan
            </Link>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Menganalisis Stok..." : "Jalankan Rekomendasi AI"}
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

        {/* Feature Guide */}
        <FeatureGuide
          title="Panduan Rekomendasi Tindakan Cerdas Stok & Cadangan Penyangga"
          badge="Preservation & Buffer AI"
          howToRead={[
            {
              title: "Tindakan & Tipe Rekomendasi",
              desc: "Instruksi perlakuan stok AI: ❄️ Preservasi Umbi Musim Hujan (simpan di cold storage), ☀️ Rilis Cadangan Umbi Kemarau (suplai pabrik keripik), 📦 Alokasi Order, atau 💰 Jual Segar.",
            },
            {
              title: "Filosofi Cadangan Umbi (Bukan Tepung)",
              desc: "Surplus musim hujan diawetkan dalam bentuk umbi (irisan blansir beku tahan 6 bulan), bukan tepung mocaf, agar pabrik keripik tetap memiliki bahan baku umbi saat kemarau tiba.",
            },
            {
              title: "Estimasi Nilai & Batas SOP PPD 48 Jam",
              desc: "Perkiraan nilai bahan baku terlindungi, biaya operasional preservasi/logistik, dan batas toleransi kesegaran singkong sebelum membusuk.",
            },
          ]}
          howToAddOrAct={[
            {
              title: "Klik 'Jalankan Rekomendasi AI'",
              desc: "Gunakan tombol hijau di kanan atas untuk menganalisis stok gudang terkini dan memunculkan rekomendasi tindakan baru.",
            },
            {
              title: "Tinjau Detail Rekomendasi",
              desc: "Periksa volume disarankan (kg), sasaran fasilitas/UMKM penerima, dan metode preservasi pada setiap kartu rekomendasi.",
            },
            {
              title: "Setujui atau Tolak Tindakan",
              desc: "Klik 'Setujui & Terapkan Stok' untuk memotong inventori dan menerbitkan instruksi jalan/simpan, atau 'Tolak Rekomendasi' jika gudang penuh.",
            },
          ]}
          roleTarget="Modul ini dijalankan oleh Admin / Koordinator Rantai Pasok Trawas. Sistem menerapkan prinsip Human-in-the-Loop: AI memberikan kalkulasi saran, namun keputusan eksekusi mutlak disetujui manual oleh koordinator."
        />

        {/* Seasonal Preservation Highlight Card */}
        <div className="bg-gradient-to-r from-sky-50 via-emerald-50 to-amber-50 border border-emerald-200 rounded-xl p-4 text-xs space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
            <Sparkles className="w-4 h-4 text-green-700" />
            <span>Skema Cerdas Cadangan Penyangga Umbi Musiman (Seasonal Tuber Buffer):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700 pt-1">
            <div className="p-2.5 bg-white/80 rounded-lg border border-sky-200">
              <span className="font-bold text-sky-900 block mb-0.5">🌧️ Musim Hujan (Surplus Panen Umbi):</span>
              <p className="text-[11px] leading-relaxed text-gray-600">
                Panen umbi melimpah namun serapan pasar keripik mingguan terbatas. AI merekomendasikan: <strong>Awetkan umbi segar</strong> dengan metode <em>Irisan Blansir Beku (Blanch-Frozen)</em> di Cold Storage Koperasi (tahan 6 bulan) untuk mencegah pembusukan 48 jam (PPD).
              </p>
            </div>
            <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-900 block mb-0.5">☀️ Musim Kemarau (Defisit Panen Lokal):</span>
              <p className="text-[11px] leading-relaxed text-gray-600">
                Panen lokal anjlok sementara wisatawan memadati Trawas mencari keripik. AI merekomendasikan: <strong>Keluarkan cadangan umbi awetan</strong> dari Cold Storage untuk menyuplai UMKM Keripik Barokah agar pasokan tidak putus dan harga tidak meroket.
              </p>
            </div>
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
                Belum ada rekomendasi aktif. Klik tombol "Jalankan Rekomendasi AI" di atas.
              </div>
            ) : (
              recommendations.map((rec: any) => {
                const recType = rec.recommendation_type || (rec.recommended_action?.includes("preserve") ? "preserve" : rec.recommended_action?.includes("release") ? "release_buffer" : rec.recommended_action?.includes("process") ? "process" : rec.recommended_action?.includes("allocate") ? "allocate" : "sell");
                const estValue = Number(rec.estimated_value ?? rec.estimated_revenue ?? (Number(rec.quantity_kg || 0) * 2400));
                const estCost = Number(rec.estimated_cost ?? (Number(rec.quantity_kg || 0) * 350));
                const reasonText = rec.reason || rec.urgency_reason || "Rekomendasi optimasi alokasi pasokan singkong.";
                const deadlineText = rec.period_end || rec.handling_deadline || "48 Jam (Batas SOP)";

                return (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl border border-gray-200 bg-white hover:border-green-300 transition-all text-xs space-y-2.5 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] ${
                          recType === "preserve" ? "bg-sky-100 text-sky-900 border border-sky-300" :
                          recType === "release_buffer" ? "bg-amber-100 text-amber-900 border border-amber-300" :
                          recType === "allocate" ? "bg-blue-100 text-blue-800" :
                          recType === "process" ? "bg-purple-100 text-purple-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          Tindakan: {
                            recType === "preserve" ? "❄️ Preservasi Umbi Musim Hujan" :
                            recType === "release_buffer" ? "☀️ Rilis Cadangan Umbi Kemarau" :
                            recType === "allocate" ? "📦 Alokasi Order" :
                            recType === "process" ? "🏭 Pengolahan Olahan" :
                            "💰 Penjualan Segar"
                          }
                        </span>
                        {rec.batch_code && (
                          <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            Batch: {rec.batch_code}
                          </span>
                        )}
                        {rec.preservation_method && (
                          <span className="font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[10px]">
                            {rec.preservation_method}
                          </span>
                        )}
                        <StatusBadge status="SIMULASI" />
                      </div>
                      <StatusBadge status={rec.status} type="recommendation" />
                    </div>

                    <p className="text-xs text-gray-800 leading-relaxed font-medium">
                      {reasonText}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-[11px] text-gray-600">
                      <div>
                        <span className="text-gray-400 block">Volume Disarankan:</span>
                        <strong className="text-gray-900 text-xs">{Number(rec.quantity_kg || 0).toLocaleString("id-ID")} kg</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Estimasi Nilai:</span>
                        <strong className="text-green-800 text-xs">Rp {estValue.toLocaleString("id-ID")}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Estimasi Biaya:</span>
                        <strong className="text-gray-700 text-xs">Rp {estCost.toLocaleString("id-ID")}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Batas Waktu:</span>
                        <strong className="text-gray-900 text-xs">{deadlineText}</strong>
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
                );
              })
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
