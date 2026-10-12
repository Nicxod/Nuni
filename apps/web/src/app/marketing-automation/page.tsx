"use client";

import React, { useEffect, useState } from "react";
import {
  Megaphone,
  Sparkles,
  Send,
  Zap,
  CheckCircle2,
  Clock,
  Users,
  MessageSquare,
  Mail,
  Globe,
  Plus,
  RefreshCw,
  TrendingUp,
  X,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  AlertCircle,
  Copy,
  Sliders,
} from "lucide-react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";
import { FeatureGuide } from "@/components/FeatureGuide";
import { api } from "@/lib/api";
import { MarketingCampaign, MarketingAutomationRule, Buyer } from "@/types";

export default function MarketingAutomationPage() {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [rules, setRules] = useState<MarketingAutomationRule[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"campaigns" | "rules">("campaigns");

  // Create Campaign Modal
  const [showModal, setShowModal] = useState(false);
  const [campName, setCampName] = useState("");
  const [campChannel, setCampChannel] = useState<any>("whatsapp");
  const [campTrigger, setCampTrigger] = useState<any>("otomatis_surplus_panen");
  const [campTarget, setCampTarget] = useState("Pabrik Tepung Mocaf & UMKM Keripik");
  const [campMessage, setCampMessage] = useState(
    "🌾 [ResiLokal Trawas Alert] Terdeteksi surplus panen singkong segar Grade B sebanyak 41.500 kg di Minggu ke-5 (W5). Tersedia penawaran serapan kemitraan Rp 2.300/kg (bebas ongkir wilayah Trawas-Pacet). Konfirmasi kuota PO Anda via aplikasi: resilokal.id/buyers"
  );
  const [savingCamp, setSavingCamp] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, rRes, bRes] = await Promise.allSettled([
        api.getMarketingCampaigns(),
        api.getMarketingRules(),
        api.getBuyers(),
      ]);
      if (cRes.status === "fulfilled") setCampaigns(cRes.value);
      if (rRes.status === "fulfilled") setRules(rRes.value);
      if (bRes.status === "fulfilled") setBuyers(bRes.value);
    } catch (err) {
      console.error("Gagal memuat otomasi pemasaran:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName || !campMessage) {
      alert("Mohon lengkapi judul kampanye dan isi pesan.");
      return;
    }
    try {
      setSavingCamp(true);
      await api.createMarketingCampaign({
        campaign_name: campName,
        channel: campChannel,
        trigger_source: campTrigger,
        target_segment: campTarget,
        recipient_count: buyers.length > 0 ? buyers.length * 4 : 20,
        message_content: campMessage,
      });
      setShowModal(false);
      setCampName("");
      await loadData();
      alert("Kampanye pemasaran digital berhasil dibuat dan siap di-broadcast.");
    } catch (err: any) {
      alert("Gagal membuat kampanye: " + err.message);
    } finally {
      setSavingCamp(false);
    }
  };

  const handleSendCampaign = async (id: string) => {
    try {
      setActionLoading(id);
      await api.sendMarketingCampaign(id);
      await loadData();
      alert("Pesan broadcast otomatis berhasil dikirimkan ke seluruh nomor WhatsApp/Email mitra!");
    } catch (err: any) {
      alert("Gagal mengirim broadcast: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      setActionLoading(id);
      await api.toggleMarketingRule(id);
      await loadData();
    } catch (err: any) {
      alert("Gagal mengubah status aturan: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const setTemplate = (type: "surplus" | "keripik" | "jadwal") => {
    if (type === "surplus") {
      setCampName("Broadcast Cepat Surplus Panen Raya W5");
      setCampTrigger("otomatis_surplus_panen");
      setCampTarget("Pabrik Tepung Mocaf & Pengolah Skala Industri");
      setCampMessage(
        "🌾 [PENAWARAN PASOKAN KHUSUS] Singkong segar Varietas Gajah siap panen raya W5 (total 41.500 kg). Dapatkan harga kemitraan Rp 2.300/kg untuk order di atas 2 ton. Dijamin segar panen subuh, lolos uji pati, antar langsung ke pabrik. Balas pesan ini untuk klaim kuota!"
      );
    } else if (type === "keripik") {
      setCampName("Promosi Katalog Keripik Garansi Renyah Sampai Tujuan");
      setCampTrigger("promosi_olahan_umkm");
      setCampTarget("Jaringan Toko Oleh-Oleh Surabaya, Malang, Mojokerto");
      setCampMessage(
        "✨ [PRODUK OLAHAN UNGGULAN TRAWAS] Keripik Singkong Barokah & Tepung Mocaf Duyung siap kirim! Dilengkapi Garansi Anti-Remuk (SOP toleransi maks 5% atau kompensasi potong faktur). Gurih renyah tanpa bahan pengawet. Cek katalog lengkap: resilokal.id/buyers"
      );
    } else {
      setCampName("Pengingat Jadwal Panen Mingguan ke Mitra Rutin");
      setCampTrigger("jadwal_panen_mingguan");
      setCampTarget("Seluruh UMKM Terikat Kontrak Pasokan");
      setCampMessage(
        "Halo Mitra UMKM Trawas! Panen singkong petak Poktan Sukamaju dijadwalkan masuk pos pengumpul dalam 48 jam. Alokasi reguler Anda telah disiapkan. Mohon konfirmasi jadwal bongkar muat sebelum pukul 15.00 WIB."
      );
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
                Otomasi Pemasaran & Broadcast Pasokan Digital
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Lapisan digital penghubung panen petani dengan pasar: broadcast WhatsApp otomatis saat surplus, aturan promosi cerdas, dan katalog online.
            </p>
          </div>

          <button
            onClick={() => {
              setTemplate("surplus");
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            + Buat Kampanye / Broadcast Baru
          </button>
        </div>

        {/* Feature Guide */}
        <FeatureGuide
          title="Panduan Otomasi Pemasaran & Penghubung Pasar Digital"
          badge="Sistem Informasi Pemasaran & CRM"
          howToRead={[
            {
              title: "3 Saluran Komunikasi Terpadu",
              desc: "WhatsApp Gateway (broadcast instan pesan teks & penawaran), Email Kemitraan (kontrak mingguan), dan Katalog Web Digital (pricelist real-time).",
            },
            {
              title: "Mesin Aturan Otomasi (Rule-Based Triggers)",
              desc: "Sistem otomatis mengirim penawaran saat algoritma mendeteksi surplus panen > 3 ton atau ketika batch mendekati batas toleransi 48 jam.",
            },
            {
              title: "Metrik Konversi Pasar",
              desc: "Memantau Open Rate (tingkat keterbacaan), Response Rate (kecepatan respon UMKM), dan total tonase singkong yang berhasil terserap.",
            },
          ]}
          howToAddOrAct={[
            {
              title: "Buat Broadcast Kampanye",
              desc: "Klik '+ Buat Kampanye Baru', pilih template pesan otomatis (Surplus Panen, Keripik Renyah, atau Pengingat Rutin), lalu tentukan audiens sasaran.",
            },
            {
              title: "Kirim Broadcast Instan",
              desc: "Klik tombol 'Kirim Broadcast' pada daftar kampanye untuk menyimulasikan pengiriman pesan otomatis ke seluruh kontak pembeli.",
            },
            {
              title: "Atur Trigger Otomatis",
              desc: "Buka tab 'Mesin Aturan Otomasi', aktifkan switch hijau agar sistem bekerja otomatis tanpa perlu campur tangan manual setiap panen.",
            },
          ]}
          roleTarget="Modul ini mempertegas peran Sistem Informasi & Ilmu Komputer dalam pemasaran pertanian: dikelola oleh Koordinator Koperasi untuk mempercepat penyerapan stok dan UMKM untuk mendapat info bahan baku termurah."
        />

        {/* Marketing KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-green-50 text-green-700 rounded-lg shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-medium block">Pesan Tersalurkan:</span>
              <strong className="text-lg font-bold text-gray-900">1.420 Broadcast</strong>
              <span className="text-[10px] text-green-700 font-semibold block">98.5% Delivered via WhatsApp</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-medium block">Rata-rata Open Rate:</span>
              <strong className="text-lg font-bold text-blue-900">93.8%</strong>
              <span className="text-[10px] text-blue-700 font-semibold block">Tinggi (Respon Cepat UMKM)</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-medium block">Lead Time Serapan:</span>
              <strong className="text-lg font-bold text-amber-900">4.2 Jam</strong>
              <span className="text-[10px] text-emerald-700 font-semibold block">Turun dari 3 Hari (Pra-Digital)</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-500 font-medium block">Pasokan Terserap Otomasi:</span>
              <strong className="text-lg font-bold text-purple-900">30.500 kg</strong>
              <span className="text-[10px] text-purple-700 font-semibold block">Mencegah Surplus Terbuang</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`pb-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === "campaigns"
                ? "border-b-2 border-green-700 text-green-800"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Daftar Kampanye Broadcast Pemasaran ({campaigns.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`pb-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === "rules"
                ? "border-b-2 border-purple-600 text-purple-800"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Mesin Aturan Otomasi Pemasaran ({rules.length})</span>
          </button>
        </div>

        {/* Tab 1: Campaigns List */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 space-y-3.5 shadow-2xs hover:border-green-300 transition-all flex flex-col justify-between text-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${
                          camp.channel === "whatsapp" ? "bg-emerald-100 text-emerald-800" :
                          camp.channel === "email" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                        }`}>
                          {camp.channel === "whatsapp" ? <MessageSquare className="w-4 h-4" /> :
                           camp.channel === "email" ? <Mail className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                        </span>
                        <div>
                          <strong className="text-gray-900 block leading-tight text-xs">
                            {camp.campaign_name}
                          </strong>
                          <span className="text-[10px] text-gray-500 uppercase font-semibold">
                            Saluran: {camp.channel}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        camp.status === "terkirim" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}>
                        {camp.status}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block">Sasaran Audiens:</span>
                      <strong className="text-gray-800 text-xs block">{camp.target_segment}</strong>
                      <span className="text-[10px] text-gray-500">Estimasi Penerima: {camp.recipient_count} Mitra UMKM</span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1 text-[11px]">
                      <span className="font-bold text-gray-700 block">Isi Pesan Promosi:</span>
                      <p className="text-gray-600 leading-relaxed italic bg-white p-2 rounded border border-gray-200 text-[10.5px]">
                        "{camp.message_content}"
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-emerald-50/50 p-2 rounded-lg text-center text-[10.5px]">
                      <div>
                        <span className="text-gray-400 block text-[9.5px]">Open Rate</span>
                        <strong className="text-emerald-800 font-bold">{camp.open_rate_pct}%</strong>
                      </div>
                      <div className="border-x border-emerald-200">
                        <span className="text-gray-400 block text-[9.5px]">Respon</span>
                        <strong className="text-blue-800 font-bold">{camp.response_rate_pct}%</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9.5px]">Terserap</span>
                        <strong className="text-gray-900 font-bold">{camp.converted_orders_kg.toLocaleString("id-ID")} kg</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      {camp.sent_at ? `Dikirim: ${camp.sent_at}` : "Jadwal Otomatis"}
                    </span>
                    <button
                      onClick={() => handleSendCampaign(camp.id)}
                      disabled={actionLoading === camp.id}
                      className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>{actionLoading === camp.id ? "Mengirim..." : "Kirim Broadcast Ulang"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Automation Rules Engine */}
        {activeTab === "rules" && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Mesin Pemicu Otomatis (Event-Driven Marketing Rules)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Aturan logika otomatis yang berjalan di latar belakang saat terjadi peristiwa operasional rantai pasok.
                </p>
              </div>

              <span className="text-[11px] font-semibold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                Rule Engine Status: AKTIF (3 Aturan)
              </span>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-purple-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">
                        {rule.rule_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        rule.is_active ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"
                      }`}>
                        {rule.is_active ? "Otomasi Aktif" : "Non-Aktif"}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold bg-gray-100 px-2 py-0.5 rounded">
                        Kanal: {rule.channel}
                      </span>
                    </div>

                    <p className="text-gray-700 text-[11.5px] leading-relaxed">
                      <strong>Kondisi Pemicu:</strong> {rule.condition_description}
                    </p>
                    <p className="text-green-800 text-[11.5px] leading-relaxed">
                      <strong>Aksi Digital:</strong> {rule.action_description}
                    </p>
                    <div className="flex items-center gap-4 text-[10.5px] text-gray-500 pt-1">
                      <span>Total Pemicu Eksekusi: <strong>{rule.total_triggered_count} Kali</strong></span>
                      <span>•</span>
                      <span>Terakhir Berjalan: <strong>{rule.last_triggered_at || "-"}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    disabled={actionLoading === rule.id}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                      rule.is_active
                        ? "bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                    }`}
                  >
                    {rule.is_active ? <ToggleRight className="w-5 h-5 text-purple-700" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    <span>{rule.is_active ? "Matikan Aturan" : "Aktifkan Aturan"}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Create Campaign */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-gray-200 text-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-green-700" />
                  Buat Kampanye Broadcast Pemasaran Baru
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Template Buttons */}
              <div className="space-y-1.5">
                <span className="font-semibold text-gray-700 block text-[11px]">Gunakan Template AI Otomatis:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplate("surplus")}
                    className="p-2 border border-gray-200 hover:border-green-400 rounded-lg text-left bg-gray-50 hover:bg-green-50 transition-colors cursor-pointer"
                  >
                    <strong className="block text-gray-900 text-[10.5px]">Surplus Panen W5</strong>
                    <span className="text-[9.5px] text-gray-500">Diskon volume pabrik</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplate("keripik")}
                    className="p-2 border border-gray-200 hover:border-green-400 rounded-lg text-left bg-gray-50 hover:bg-green-50 transition-colors cursor-pointer"
                  >
                    <strong className="block text-gray-900 text-[10.5px]">Garansi Renyah</strong>
                    <span className="text-[9.5px] text-gray-500">Toko oleh-oleh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplate("jadwal")}
                    className="p-2 border border-gray-200 hover:border-green-400 rounded-lg text-left bg-gray-50 hover:bg-green-50 transition-colors cursor-pointer"
                  >
                    <strong className="block text-gray-900 text-[10.5px]">Pengingat Panen</strong>
                    <span className="text-[9.5px] text-gray-500">Kontrak rutin UMKM</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Judul Kampanye:</label>
                  <input
                    type="text"
                    required
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                    placeholder="Contoh: Broadcast Penawaran Singkong Grade B ke Pabrik Mocaf"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Saluran Distribusi:</label>
                    <select
                      value={campChannel}
                      onChange={(e) => setCampChannel(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="whatsapp">WhatsApp Business Gateway</option>
                      <option value="email">Email Newsletter Kemitraan</option>
                      <option value="katalog_web">Katalog Web Digital</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Pemicu Operasional:</label>
                    <select
                      value={campTrigger}
                      onChange={(e) => setCampTrigger(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="otomatis_surplus_panen">Otomatis Saat Surplus Panen</option>
                      <option value="jadwal_panen_mingguan">Jadwal Panen Mingguan</option>
                      <option value="promosi_olahan_umkm">Promosi Olahan Hilir UMKM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Target Segmen Mitra:</label>
                  <input
                    type="text"
                    required
                    value={campTarget}
                    onChange={(e) => setCampTarget(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Isi Pesan Siaran (Broadcast Copy):</label>
                  <textarea
                    rows={4}
                    required
                    value={campMessage}
                    onChange={(e) => setCampMessage(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-mono text-[11px]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingCamp}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {savingCamp ? "Menyimpan..." : "Simpan & Jadwalkan Siaran"}
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
