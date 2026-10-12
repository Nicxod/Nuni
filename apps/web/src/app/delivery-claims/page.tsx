"use client";

import React, { useEffect, useState } from "react";
import {
  Truck,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  ArrowRight,
  Phone,
  Thermometer,
  PackageCheck,
  Sparkles,
  Camera,
  Coins,
  X,
} from "lucide-react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { FeatureGuide } from "@/components/FeatureGuide";
import { api } from "@/lib/api";
import { DeliveryOrder, DamageClaim, Buyer } from "@/types";

export default function DeliveryClaimsPage() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"deliveries" | "claims">("deliveries");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Create Delivery
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [delBuyerId, setDelBuyerId] = useState("");
  const [delItemType, setDelItemType] = useState<any>("Keripik Singkong Barokah");
  const [delQtyKg, setDelQtyKg] = useState("500");
  const [delDriverName, setDelDriverName] = useState("Pak Slamet (Armada Pick-Up Trawas 01)");
  const [delDriverPhone, setDelDriverPhone] = useState("0812-3456-7890");
  const [delVehiclePlate, setDelVehiclePlate] = useState("S 8421 NA");
  const [delDestination, setDelDestination] = useState("Pusat Oleh-Oleh Mojokerto");
  const [delFragileLevel, setDelFragileLevel] = useState<any>("tinggi_rentan_remuk");
  const [savingDelivery, setSavingDelivery] = useState(false);

  // Modal Create Claim
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimDeliveryId, setClaimDeliveryId] = useState("");
  const [claimDamagedKg, setClaimDamagedKg] = useState("25");
  const [claimDamageType, setClaimDamageType] = useState<any>("remuk_keripik");
  const [claimNotes, setClaimNotes] = useState(
    "Kemasan keripik mengalami remuk >25% akibat guncangan lereng bukit. Melebihi batas toleransi SOP 5%."
  );
  const [claimCompScheme, setClaimCompScheme] = useState<any>("potong_faktur_berikutnya");
  const [savingClaim, setSavingClaim] = useState(false);

  // Modal Review Claim
  const [selectedClaim, setSelectedClaim] = useState<DamageClaim | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewCompAmount, setReviewCompAmount] = useState<number>(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dRes, bRes] = await Promise.allSettled([
        api.getDeliveries(),
        api.getBuyers(),
      ]);
      if (dRes.status === "fulfilled") setDeliveries(dRes.value);
      if (bRes.status === "fulfilled") {
        setBuyers(bRes.value);
        if (bRes.value.length > 0 && !delBuyerId) {
          setDelBuyerId(bRes.value[0].id);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data logistik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const allClaims: DamageClaim[] = deliveries.flatMap((d) => d.claims || []);

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingDelivery(true);
      const matchedBuyer = buyers.find((b) => b.id === delBuyerId);
      const buyerName = matchedBuyer ? matchedBuyer.business_name : "Mitra UMKM Trawas";

      await api.createDelivery({
        buyer_id: delBuyerId || "b1",
        buyer_name: buyerName,
        destination_address: delDestination,
        item_type: delItemType,
        quantity_kg: Number(delQtyKg),
        package_count: Math.round(Number(delQtyKg) * (delItemType.includes("Keripik") ? 4 : 0.02)),
        driver_name: delDriverName,
        driver_phone: delDriverPhone,
        vehicle_type: "Armada Angkut Trawas",
        vehicle_plate: delVehiclePlate,
        fragile_level: delFragileLevel,
      });

      setShowDeliveryModal(false);
      await loadData();
    } catch (err: any) {
      alert("Gagal membuat surat jalan: " + err.message);
    } finally {
      setSavingDelivery(false);
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingClaim(true);
      const targetDel = deliveries.find((d) => d.id === claimDeliveryId) || deliveries[0];
      const shippedKg = Number(targetDel?.quantity_kg || 500);
      const damagedKg = Number(claimDamagedKg) || 10;
      const breakagePct = Number(((damagedKg / shippedKg) * 100).toFixed(1));
      const estCompRp = damagedKg * (targetDel?.item_type.includes("Keripik") ? 15000 : 2500);

      await api.createDamageClaim({
        delivery_id: targetDel?.id || "del-1",
        tracking_code: targetDel?.tracking_code || "TRW-LOG-20261012-01",
        buyer_name: targetDel?.buyer_name || "Mitra Pembeli",
        item_type: targetDel?.item_type || "Keripik Singkong",
        total_shipped_kg: shippedKg,
        damaged_kg: damagedKg,
        breakage_percentage: breakagePct,
        damage_type: claimDamageType,
        buyer_notes: claimNotes,
        compensation_scheme: claimCompScheme,
        compensation_amount_rp: estCompRp,
      });

      setShowClaimModal(false);
      await loadData();
      alert("Klaim remuk berhasil diajukan dan masuk ke antrean verifikasi.");
    } catch (err: any) {
      alert("Gagal mengajukan klaim: " + err.message);
    } finally {
      setSavingClaim(false);
    }
  };

  const openReviewModal = (claim: DamageClaim, action: "approve" | "reject") => {
    setSelectedClaim(claim);
    setReviewAction(action);
    setReviewCompAmount(claim.compensation_amount_rp);
    setReviewNotes(
      action === "approve"
        ? `Klaim remuk ${claim.breakage_percentage}% diverifikasi sah melebihi ambang batas toleransi SOP (5%). Kompensasi disetujui.`
        : "Kerusakan berada di bawah batas toleransi SOP garansi renyah (5%). Klaim ditolak."
    );
  };

  const handleSubmitReview = async () => {
    if (!selectedClaim || !reviewAction) return;
    try {
      setSubmittingReview(true);
      await api.reviewDamageClaim(
        selectedClaim.id,
        reviewAction,
        reviewNotes,
        reviewAction === "approve" ? reviewCompAmount : 0
      );
      setSelectedClaim(null);
      setReviewAction(null);
      await loadData();
      alert(`Klaim ${selectedClaim.claim_code} berhasil diproses.`);
    } catch (err: any) {
      alert("Gagal memproses klaim: " + err.message);
    } finally {
      setSubmittingReview(false);
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
                Pelacakan Pengiriman & Klaim Remuk Logistik
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Lapisan digital pelacakan armada, milestone status suhu & waktu, serta sistem garansi klaim remuk keripik (SOP 5% Toleransi).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (deliveries.length > 0 && !claimDeliveryId) {
                  setClaimDeliveryId(deliveries[0].id);
                }
                setShowClaimModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors shadow-xs cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              + Ajukan Klaim Remuk
            </button>
            <button
              onClick={() => setShowDeliveryModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              + Buat Surat Jalan Pengiriman
            </button>
          </div>
        </div>

        {/* Feature Guide */}
        <FeatureGuide
          title="Panduan Pelacakan Logistik & Garansi Anti-Remuk"
          badge="Sistem Informasi Logistik & Mutu"
          howToRead={[
            {
              title: "Milestone Pelacakan Armada",
              desc: "Memantau waktu keberangkatan, titik lokasi real-time via GPS lereng Trawas, suhu ruang angkut (°C), dan waktu perkiraan tiba (ETA).",
            },
            {
              title: "Ambang Batas Toleransi Remuk (5%)",
              desc: "SOP 'Garansi Renyah Sampai Tujuan': Jika persentase remuk produk keripik > 5%, pembeli berhak mengajukan klaim kompensasi otomatis.",
            },
            {
              title: "Skema Kompensasi Transparan",
              desc: "Klaim yang disetujui otomatis memilih opsi: Potong faktur nota berikutnya, Kirim batch pengganti gratis, atau Refund kredit stok.",
            },
          ]}
          howToAddOrAct={[
            {
              title: "Buat Pengiriman Baru",
              desc: "Klik '+ Buat Surat Jalan Pengiriman', pilih tujuan UMKM/toko, jenis barang (Singkong/Keripik), driver, dan nomor plat kendaraan.",
            },
            {
              title: "Ajukan Klaim Remuk (Pembeli)",
              desc: "Klik '+ Ajukan Klaim Remuk', masukkan kg rusak & persentase remuk hasil timbang terima toko, lalu sertakan catatan kerusakan.",
            },
            {
              title: "Verifikasi & Persetujuan Klaim",
              desc: "Koordinator meninjau bukti klaim, memeriksa apakah melebihi toleransi 5%, lalu menyetujui kompensasi rupiah secara digital.",
            },
          ]}
          roleTarget="Modul ini mempertegas peran Sistem Informasi & Ilmu Komputer dalam rantai pasok: digunakan bersama oleh Pembeli UMKM (penerima barang), Driver Logistik, dan Koordinator Koperasi."
        />

        {/* Logistics KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-green-50 text-green-700 rounded-lg shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-medium block">Total Armada Aktif:</span>
              <strong className="text-lg font-bold text-gray-900">{deliveries.length} Pengiriman</strong>
              <span className="text-[10px] text-green-700 font-semibold block">100% Terpantau GPS</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-medium block">On-Time Delivery (SOP):</span>
              <strong className="text-lg font-bold text-blue-900">98.4%</strong>
              <span className="text-[10px] text-blue-700 font-semibold block">Rata-rata 42 Menit Tiba</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-medium block">Rata-rata Remuk Logistik:</span>
              <strong className="text-lg font-bold text-amber-900">2.4%</strong>
              <span className="text-[10px] text-emerald-700 font-semibold block">✓ Di bawah batas SOP (5%)</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-medium block">Penyelesaian Klaim:</span>
              <strong className="text-lg font-bold text-gray-900">{allClaims.length} Kasus</strong>
              <span className="text-[10px] text-green-700 font-semibold block">100% Tuntas Kompensasi</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("deliveries")}
            className={`pb-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === "deliveries"
                ? "border-b-2 border-green-700 text-green-800"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Daftar Armada & Pelacakan Pengiriman ({deliveries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("claims")}
            className={`pb-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === "claims"
                ? "border-b-2 border-rose-600 text-rose-800"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Pusat Klaim Remuk & Kerusakan Garansi ({allClaims.length})</span>
          </button>
        </div>

        {/* Tab 1: Deliveries List & Live Timeline */}
        {activeTab === "deliveries" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {deliveries.map((del) => (
                <div
                  key={del.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 space-y-3.5 shadow-2xs hover:border-green-300 transition-all flex flex-col justify-between text-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                      <div>
                        <span className="font-bold text-gray-900 block font-mono text-[11px]">
                          {del.tracking_code}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {del.vehicle_type} ({del.vehicle_plate})
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          del.status === "terkirim"
                            ? "bg-green-100 text-green-800"
                            : del.status === "ada_klaim"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {del.status === "terkirim"
                          ? "Terkirim"
                          : del.status === "ada_klaim"
                          ? "Ada Klaim"
                          : "Dalam Jalan"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block">Tujuan & Penerima:</span>
                      <strong className="text-gray-900 block text-xs">{del.buyer_name}</strong>
                      <p className="text-[11px] text-gray-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>{del.destination_address}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-lg text-[11px]">
                      <div>
                        <span className="text-gray-400 block">Muatan:</span>
                        <strong className="text-gray-800">{del.item_type}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Kuantitas:</span>
                        <strong className="text-green-800">{del.quantity_kg.toLocaleString("id-ID")} kg</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Pengemudi:</span>
                        <span className="text-gray-700 truncate block">{del.driver_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Suhu Logistik:</span>
                        <span className="text-gray-700 font-semibold">{del.temperature_c || 24.5}°C</span>
                      </div>
                    </div>

                    {/* Timeline Milestones */}
                    <div className="space-y-1.5 pt-1">
                      <span className="font-bold text-gray-800 text-[11px] block">
                        Riwayat Perjalanan (Milestones):
                      </span>
                      <div className="space-y-2 border-l-2 border-green-300 ml-1.5 pl-3 text-[10.5px]">
                        {del.timeline.map((evt, idx) => (
                          <div key={idx} className="relative">
                            <span className="w-2 h-2 rounded-full bg-green-600 absolute -left-[17px] top-1"></span>
                            <div className="font-semibold text-gray-900 flex items-center justify-between">
                              <span>{evt.title}</span>
                              <span className="text-gray-400 text-[10px]">{evt.time}</span>
                            </div>
                            <p className="text-gray-600 text-[10px]">{evt.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {del.claims && del.claims.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-[10.5px] text-rose-800 flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Klaim: {del.claims[0].breakage_percentage}% Remuk ({del.claims[0].damaged_kg} kg)
                      </span>
                      <span className="font-bold uppercase text-[9px] px-1.5 py-0.5 rounded bg-rose-200 text-rose-900">
                        {del.claims[0].status}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Damage Claims & Compensation Management */}
        {activeTab === "claims" && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Daftar Klaim Kerusakan & Remuk Logistik
                </h3>
                <p className="text-[11px] text-gray-500">
                  Semua klaim kerusakan barang ditinjau berdasarkan batas toleransi SOP Garansi Renyah Trawas (5%).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500">Status Toleransi:</span>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Maksimal 5.0% Remuk
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {allClaims.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  Belum ada klaim kerusakan. Semua barang terkirim dalam kondisi utuh & renyah.
                </div>
              ) : (
                allClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 hover:bg-white hover:border-green-300 transition-all space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 font-mono text-xs">
                          {claim.claim_code}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-700 font-medium">Resi: {claim.tracking_code}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            claim.status === "disetujui"
                              ? "bg-green-100 text-green-800"
                              : claim.status === "ditolak"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          Status: {claim.status}
                        </span>
                      </div>
                      <span className="text-gray-500 text-[11px]">{claim.reported_at}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-lg border border-gray-100 text-[11px]">
                      <div>
                        <span className="text-gray-400 block">Mitra Pelapor:</span>
                        <strong className="text-gray-900">{claim.buyer_name}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Jenis Muatan:</span>
                        <span className="text-gray-800">{claim.item_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Tingkat Remuk:</span>
                        <strong className="text-rose-700 text-xs">
                          {claim.breakage_percentage}% ({claim.damaged_kg} kg rusak)
                        </strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Nilai Kompensasi:</span>
                        <strong className="text-green-800 text-xs">
                          Rp {Number(claim.compensation_amount_rp || 0).toLocaleString("id-ID")}
                        </strong>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-100 text-[11px] space-y-1">
                      <strong className="text-gray-800 block">Catatan Pemeriksaan Penerima:</strong>
                      <p className="text-gray-600 leading-relaxed">{claim.buyer_notes}</p>
                    </div>

                    {claim.review_notes && (
                      <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-[11px] space-y-1">
                        <strong className="text-emerald-950 block">
                          Keputusan Koordinator Logistik ({claim.reviewed_by}):
                        </strong>
                        <p className="text-emerald-800 leading-relaxed">{claim.review_notes}</p>
                      </div>
                    )}

                    {claim.status === "diajukan" && (
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
                        <button
                          onClick={() => openReviewModal(claim, "reject")}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Tolak Klaim
                        </button>
                        <button
                          onClick={() => openReviewModal(claim, "approve")}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer"
                        >
                          Setujui Kompensasi Garansi
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modal Create Delivery */}
        {showDeliveryModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-gray-200 text-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-green-700" />
                  Terbitkan Surat Jalan Pengiriman Baru
                </h3>
                <button onClick={() => setShowDeliveryModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDelivery} className="space-y-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Pilih Mitra Pembeli / Penerima:</label>
                  <select
                    value={delBuyerId}
                    onChange={(e) => setDelBuyerId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-white"
                  >
                    {buyers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.business_name} ({b.village_or_area})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Jenis Muatan:</label>
                    <select
                      value={delItemType}
                      onChange={(e) => setDelItemType(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="Keripik Singkong Barokah">Keripik Singkong Barokah</option>
                      <option value="Singkong Segar Grade A">Singkong Segar Grade A</option>
                      <option value="Singkong Segar Grade B">Singkong Segar Grade B</option>
                      <option value="Tepung Mocaf Duyung">Tepung Mocaf Duyung</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Total Volume (kg):</label>
                    <input
                      type="number"
                      required
                      min="10"
                      value={delQtyKg}
                      onChange={(e) => setDelQtyKg(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Nama Driver & Armada:</label>
                    <input
                      type="text"
                      required
                      value={delDriverName}
                      onChange={(e) => setDelDriverName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Plat Kendaraan:</label>
                    <input
                      type="text"
                      required
                      value={delVehiclePlate}
                      onChange={(e) => setDelVehiclePlate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Alamat / Lokasi Tujuan:</label>
                  <input
                    type="text"
                    required
                    value={delDestination}
                    onChange={(e) => setDelDestination(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowDeliveryModal(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingDelivery}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {savingDelivery ? "Menerbitkan..." : "Terbitkan Surat Jalan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Submit Claim */}
        {showClaimModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-gray-200 text-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Formulir Pengajuan Klaim Remuk / Kerusakan Logistik
                </h3>
                <button onClick={() => setShowClaimModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClaim} className="space-y-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Pilih Nomor Resi / Surat Jalan:</label>
                  <select
                    value={claimDeliveryId}
                    onChange={(e) => setClaimDeliveryId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-white"
                  >
                    {deliveries.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.tracking_code} — {d.buyer_name} ({d.item_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Berat Rusak / Remuk (kg):</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={claimDamagedKg}
                      onChange={(e) => setClaimDamagedKg(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Jenis Kerusakan Mutu:</label>
                    <select
                      value={claimDamageType}
                      onChange={(e) => setClaimDamageType(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="remuk_keripik">Keripik Remuk &gt;25% (Guncangan Jalan)</option>
                      <option value="patah_umbi_singkong">Umbi Patah & Memar Saat Bongkar</option>
                      <option value="busuk_ppd_transit">Pemburukan Fisiologis PPD Saat Transit</option>
                      <option value="kemasan_rusak">Kemasan Pecah / Terbuka</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Pilihan Skema Kompensasi:</label>
                  <select
                    value={claimCompScheme}
                    onChange={(e) => setClaimCompScheme(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="potong_faktur_berikutnya">Potong Tagihan Faktur Berikutnya (Rekomendasi)</option>
                    <option value="kirim_batch_pengganti">Kirim Batch Pengganti Gratis</option>
                    <option value="refund_dana">Kredit Saldo / Pengembalian Dana</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Catatan Bukti Pemeriksaan Penerima:</label>
                  <textarea
                    rows={3}
                    required
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingClaim}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {savingClaim ? "Mengirim..." : "Kirim Pengajuan Klaim"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Review Claim */}
        {selectedClaim && reviewAction && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-gray-200 text-xs">
              <h3 className="text-sm font-bold text-gray-900">
                {reviewAction === "approve"
                  ? "Konfirmasi Persetujuan Kompensasi Klaim"
                  : "Konfirmasi Penolakan Klaim"}
              </h3>
              <p className="text-gray-600">
                Klaim <strong>{selectedClaim.claim_code}</strong> dari <strong>{selectedClaim.buyer_name}</strong> sebesar {selectedClaim.breakage_percentage}% remuk.
              </p>

              {reviewAction === "approve" && (
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Nominal Kompensasi Disetujui (Rp):</label>
                  <input
                    type="number"
                    value={reviewCompAmount}
                    onChange={(e) => setReviewCompAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg font-bold text-green-800"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Catatan Peninjauan / Verifikasi:</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClaim(null);
                    setReviewAction(null);
                  }}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg cursor-pointer ${
                    reviewAction === "approve"
                      ? "bg-green-700 hover:bg-green-800"
                      : "bg-rose-700 hover:bg-rose-800"
                  }`}
                >
                  {submittingReview ? "Menyimpan..." : "Simpan Keputusan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
