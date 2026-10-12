"use client";

import React, { useEffect, useState } from "react";
import {
  Store,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle2,
  Users,
  Target,
  ArrowRight,
  X,
} from "lucide-react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { FeatureGuide } from "@/components/FeatureGuide";
import { api } from "@/lib/api";
import { Buyer, BuyerMatchItem } from "@/types";

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [matches, setMatches] = useState<BuyerMatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [buyerCategory, setBuyerCategory] = useState<string>("umkm_chips");
  const [villageOrArea, setVillageOrArea] = useState("Desa Trawas");
  const [contactPhone, setContactPhone] = useState("");
  const [maxQuantityKg, setMaxQuantityKg] = useState("2500");
  const [preferredGrade, setPreferredGrade] = useState("A");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bRes, mRes] = await Promise.allSettled([
        api.getBuyers(),
        api.getBuyerMatches(),
      ]);
      if (bRes.status === "fulfilled") setBuyers(bRes.value);
      if (mRes.status === "fulfilled") setMatches(mRes.value.matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName) {
      alert("Mohon masukkan nama entitas / usaha pembeli.");
      return;
    }
    try {
      setSaving(true);
      await api.createBuyer({
        business_name: businessName,
        buyer_category: buyerCategory,
        village_or_area: villageOrArea,
        contact_phone: contactPhone || "0812-xxxx-xxxx",
        max_quantity_kg: Number(maxQuantityKg) || 2000,
        preferred_grade: preferredGrade,
        lead_time_days: 2,
        is_verified: true,
        status: "active",
        data_origin: "simulation",
      });
      setShowModal(false);
      setBusinessName("");
      setContactPhone("");
      await loadData();
    } catch (err: any) {
      alert("Gagal menambahkan pembeli: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "umkm_chips":
        return "UMKM Keripik & Oleh-oleh";
      case "tapioca_factory":
        return "Pabrik Mocaf / Tapioka";
      case "fresh_market":
        return "Pasar Segar Tradisional";
      case "animal_feed":
        return "Pengolah Pakan Ternak";
      default:
        return "Lainnya";
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
                Direktori Pembeli & Pencocokan Cerdas (Buyer Matching)
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Profil entitas pembeli terverifikasi di Trawas dan skor kecocokan pasokan singkong (Fitur P1).
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Store className="w-3.5 h-3.5" />
            + Daftarkan Pembeli / UMKM Baru
          </button>
        </div>

        {/* Feature Guide */}
        <FeatureGuide
          title="Panduan Direktori Pembeli & Pencocokan Cerdas (Buyer Matching)"
          badge="Market Matching Engine"
          howToRead={[
            {
              title: "Skor Kecocokan Pasokan (%)",
              desc: "Algoritma menghitung kecocokan pembeli berdasarkan 5 parameter: Volume (30%), Waktu (25%), Mutu Grade (20%), Jarak Desa (15%), dan Riwayat (10%).",
            },
            {
              title: "Kapasitas Serap & Grade Mutu",
              desc: "Menunjukkan kuota penyerapan mingguan (kg/minggu) serta syarat minimum grade (Grade A super, Grade B olahan keripik/mocaf, Grade C pakan).",
            },
            {
              title: "Kategori Mitra Pengolah",
              desc: "Klasifikasi industri: UMKM Keripik Barokah, Pabrik Tepung Mocaf Duyung, Pedagang Pasar Segar, dan Peternak Pakan.",
            },
          ]}
          howToAddOrAct={[
            {
              title: "Klik '+ Daftarkan Pembeli / UMKM Baru'",
              desc: "Buka formulir pendaftaran mitra melalui tombol hijau di kanan atas saat ada industri atau pembeli baru bergabung.",
            },
            {
              title: "Isi Profil Usaha & Kuota Serap",
              desc: "Masukkan nama entitas usaha, kategori produk olahan, nomor WhatsApp, kapasitas serap (kg/minggu), dan lokasi desa di Trawas.",
            },
            {
              title: "Otomasi Integrasi Pasokan",
              desc: "Pembeli yang terdaftar otomatis masuk ke dalam algoritma peramalan permintaan AI dan penyaluran stok saat panen raya tiba.",
            },
          ]}
          roleTarget="Modul ini dikelola oleh Koordinator Rantai Pasok Trawas untuk memperluas jaringan pasar pembeli dan melindungi petani dari monopoli tengkulak."
        />

        {/* Explainable Matching Engine Callout (PRD Section 10.1) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-xs space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-700" />
              Skor Kecocokan Pasokan (Explainable Buyer Matching - P1)
            </span>
            <span className="text-[11px] text-gray-500">Bobot: Volume (30%), Waktu (25%), Mutu (20%), Jarak (15%), Riwayat (10%)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {matches.map((m) => (
              <div
                key={m.buyer_id}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-green-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{m.business_name}</span>
                    <span className="font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full text-[11px]">
                      Skor: {m.score}%
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    {getCategoryLabel(m.buyer_category)} • {m.village_or_area}
                  </span>

                  <div className="mt-2 space-y-1">
                    {(m.matched_reasons || []).map((r, idx) => (
                      <p key={idx} className="text-[11px] text-gray-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        {r}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Target Harga:</span>
                  <strong className="text-gray-900">
                    Rp {Number(m.target_price_per_kg || 2500).toLocaleString("id-ID")}/kg
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buyers Directory Cards */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Profil Pembeli Terdaftar
              </h3>
              <p className="text-[11px] text-gray-500">
                Data mitra penyerap hasil panen singkong lokal di kawasan Trawas dan Mojokerto.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {buyers.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl border border-gray-200 bg-white flex flex-col justify-between hover:shadow-xs transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-gray-900 text-xs">{b.business_name}</h4>
                    {b.is_verified && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-200">
                        Terverifikasi
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] font-semibold text-green-700 mt-1">
                    {getCategoryLabel(b.buyer_category)}
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {b.village_or_area}
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {b.contact_phone || "0812-xxxx-xxxx"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-gray-100 text-[11px] text-gray-600 flex items-center justify-between">
                  <span>Kapasitas Serap:</span>
                  <strong className="text-gray-900">
                    {Number(b.max_quantity_kg || 0).toLocaleString("id-ID")} kg/batch
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Form Tambah Pembeli */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-800 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      Daftarkan Pembeli / Mitra UMKM Baru
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Entitas pembeli untuk simulasi pencocokan pasokan singkong Trawas
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

              <form onSubmit={handleSaveBuyer} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Nama Usaha / Usaha Pembeli: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: UMKM Keripik Singkong Barokah"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Kategori Pembeli:
                    </label>
                    <select
                      value={buyerCategory}
                      onChange={(e) => setBuyerCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                    >
                      <option value="umkm_chips">UMKM Keripik & Oleh-oleh</option>
                      <option value="tapioca_factory">Pabrik Mocaf / Tapioka</option>
                      <option value="fresh_market">Pasar Segar Tradisional</option>
                      <option value="animal_feed">Pengolah Pakan Ternak</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Desa / Lokasi di Trawas:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Desa Duyung, Trawas"
                      value={villageOrArea}
                      onChange={(e) => setVillageOrArea(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Kapasitas Serap (kg/batch):
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      step="50"
                      value={maxQuantityKg}
                      onChange={(e) => setMaxQuantityKg(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Grade Mutu Diinginkan:
                    </label>
                    <select
                      value={preferredGrade}
                      onChange={(e) => setPreferredGrade(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-green-600 focus:outline-none"
                    >
                      <option value="A">Grade A (Segar & Kadar Pati Tinggi)</option>
                      <option value="B">Grade B (Standar Pengolahan)</option>
                      <option value="C">Grade C (Pakan / Industri)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Kontak Telepon / WhatsApp:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 0812-3456-7890"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
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
                    {saving ? "Menyimpan..." : "Daftarkan Pembeli"}
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
