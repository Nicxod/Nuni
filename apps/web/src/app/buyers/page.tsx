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
} from "lucide-react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { Buyer, BuyerMatchItem } from "@/types";

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [matches, setMatches] = useState<BuyerMatchItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        </div>

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
                    {m.matched_reasons.map((r, idx) => (
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
      </div>
    </LayoutWrapper>
  );
}
