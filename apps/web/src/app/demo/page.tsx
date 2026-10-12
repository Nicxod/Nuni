"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Video,
  Download,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  CloudRain,
  Sun,
  Snowflake,
  ShieldCheck,
  Truck,
  TrendingUp,
  Scale,
  Boxes,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { StatusBadge } from "@/components/StatusBadge";

interface Chapter {
  id: number;
  title: string;
  startSec: number;
  endSec: number;
  route: string;
  speechText: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "1. Supply-Demand Gap & AI Musiman",
    startSec: 0,
    endSec: 55,
    route: "/forecast/gap",
    speechText:
      "Selamat pagi Dewan Juri. Inilah inti kecerdasan ResiLokal: Supply–Demand Gap and Seasonal Buffer Balancing. Selama ini, agribisnis singkong Trawas terjebak dilema musiman yang merugikan. Di musim hujan, panen umbi melimpah ruah, tapi permintaan keripik biasa saja sehingga umbi menumpuk dan busuk dalam 48 jam karena PPD. Sebaliknya di musim kemarau, panen anjlok padahal wisatawan membludak mencari keripik, sehingga UMKM krisis bahan baku. AI ResiLokal memetakan gap pasokan dan permintaan mingguan secara otomatis. Saat mendeteksi surplus musim hujan, AI merekomendasikan mengawetkan kelebihan umbi dengan metode Irisan Blansir Beku di Cold Storage Koperasi tahan 6 bulan, bukan diolah jadi tepung, melainkan disimpan dalam wujud umbi agar siap digoreng! Saat mendeteksi defisit musim kemarau, AI otomatis merekomendasikan pelepasan cadangan umbi awetan tersebut untuk menyuplai pabrik keripik, sehingga pabrik tidak pernah mogok produksi dan harga tetap stabil.",
  },
  {
    id: 2,
    title: "2. Tindakan Cerdas Stok (AI to Action)",
    startSec: 55,
    endSec: 85,
    route: "/stock-actions",
    speechText:
      "Dari kalkulasi AI tadi, sistem langsung menerbitkan instruksi operasional di menu Tindakan Cerdas Stok. Di sini terlihat jelas: ada rekomendasi Preservasi Umbi 4.200 kg ke Cold Storage Koperasi, dan rekomendasi Rilis Cadangan Umbi 5.000 kg ke UMKM Keripik Barokah. Sistem kami menerapkan prinsip Human in the Loop: AI memberi kalkulasi cerdas, namun persetujuan akhir tetap di tangan koordinator koperasi hanya dengan satu klik tombol Setujui.",
  },
  {
    id: 3,
    title: "3. Logistik & Garansi Anti-Remuk",
    startSec: 85,
    endSec: 110,
    route: "/delivery-claims",
    speechText:
      "Setelah keripik selesai digoreng, tantangan berikutnya adalah pengiriman di jalur perbukitan pegunungan yang rawan hancur. ResiLokal melengkapinya dengan Pelacakan Logistik dan Klaim Remuk. Pembeli oleh-oleh mendapatkan jaminan garansi mutu: jika keripik remuk melebihi toleransi SOP 5 persen, pembeli cukup unggah foto kerusakan dan kompensasi potong faktur otomatis disetujui digital tanpa perdebatan.",
  },
  {
    id: 4,
    title: "4. Dampak Nyata & Penutup",
    startSec: 110,
    endSec: 120,
    route: "/dashboard",
    speechText:
      "Melalui ekosistem terpadu ini, ResiLokal mewujudkan Decent Work and Economic Growth: petani sejahtera tanpa umbi terbuang, UMKM keripik aman bahan baku sepanjang tahun, dengan komitmen: Lokal Tangguh, Renyah Sampai Tujuan. Terima kasih!",
  },
];

export default function DemoPlayerPage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Current active chapter
  const currentChapter =
    CHAPTERS.find((ch) => currentTime >= ch.startSec && currentTime < ch.endSec) ||
    CHAPTERS[CHAPTERS.length - 1];

  // Speech Synthesis
  useEffect(() => {
    if (!isPlaying || !voiceEnabled) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    // Trigger speech for active chapter when time matches chapter start
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentChapter.speechText);
      utterance.lang = "id-ID";
      utterance.rate = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find((v) => v.lang.startsWith("id"));
      if (idVoice) utterance.voice = idVoice;

      window.speechSynthesis.speak(utterance);
    }
  }, [currentChapter.id, isPlaying, voiceEnabled]);

  // Main playback timer (120 seconds total)
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= 120) {
            setIsPlaying(false);
            if (isRecording) stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, isRecording]);

  const togglePlay = () => {
    if (currentTime >= 120) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const jumpToTime = (sec: number) => {
    setCurrentTime(sec);
  };

  // Browser Screen Recorder
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert("Browser Anda belum mendukung fitur perekaman layar langsung. Anda bisa menggunakan shortcut Windows 'Win + Alt + R' untuk merekam.");
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: true,
      });

      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Start playback automatically
      setCurrentTime(0);
      setIsPlaying(true);
    } catch (err) {
      console.error(err);
      alert("Perekaman layar dibatalkan atau tidak diizinkan.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  // Formatting mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <LayoutWrapper>
      <div className="space-y-5 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                🎬 Demo Video & Presentasi 2 Menit (Auto-Runner)
              </h2>
              <StatusBadge status="SIMULASI" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Simulator interaktif yang memandu jalannya presentasi 2 menit secara otomatis dengan visual layar, narator suara, dan perekam video langsung.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                title="Merekam layar tab ini dan download video MP4/WebM"
              >
                <Video className="w-3.5 h-3.5" />
                🔴 Rekam Jadi Video
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gray-800 rounded-lg hover:bg-black transition-colors shadow-xs animate-pulse cursor-pointer"
              >
                ⏹️ Selesai Rekam
              </button>
            )}

            {recordedVideoUrl && (
              <a
                href={recordedVideoUrl}
                download="ResiLokal-Demo-Presentation-2Menit.webm"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Video Hasil Rekaman
              </a>
            )}
          </div>
        </div>

        {/* Video Player Stage Container */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-xl border border-gray-800 text-white">
          {/* Top Video Stage Bar */}
          <div className="bg-gray-950 px-4 py-2.5 flex items-center justify-between text-xs border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-gray-200">Mode Simulasi Presentasi Juri</span>
              <span className="text-gray-500 text-[11px]">| Rute Aktif: {currentChapter.route}</span>
            </div>
            <div className="flex items-center gap-2 font-mono font-bold text-green-400 text-sm">
              <span>{formatTime(currentTime)}</span>
              <span className="text-gray-600">/ 02:00</span>
            </div>
          </div>

          {/* Video Screen Content (Simulated Interactive UI) */}
          <div className="relative min-h-[460px] bg-slate-900 p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
            {/* Visual Screen 1: Supply-Demand Gap */}
            {currentChapter.id === 1 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="flex items-center justify-between bg-white text-gray-900 p-3.5 rounded-xl shadow-md border border-gray-200">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">
                      Supply–Demand Gap & Seasonal Buffer Balancing
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Peramalan pasokan umbi singkong vs serapan keripik: Preservasi saat musim hujan & rilis saat kemarau.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-green-700 text-white font-bold rounded-lg text-xs shadow-xs">
                    Fokus Utama AI
                  </span>
                </div>

                {/* 2 Seasonal Cards Showcase with Animated Highlight */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Rainy Card */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      currentTime < 30
                        ? "bg-blue-900/40 border-blue-400 ring-2 ring-blue-400 scale-[1.01]"
                        : "bg-gray-800/60 border-gray-700 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-blue-300 flex items-center gap-1.5 text-sm">
                        <CloudRain className="w-4 h-4 text-blue-400" /> 🌧️ Skenario Musim Hujan
                      </span>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-bold rounded-full text-[10px]">
                        SURPLUS (+16.300 kg)
                      </span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">
                      Panen umbi melimpah ruah, namun permintaan keripik biasa saja. Umbi terancam busuk dalam 48 jam (PPD).
                    </p>
                    <div className="mt-2.5 p-2 bg-blue-950/80 rounded-lg border border-blue-700 text-blue-200 font-medium text-[11px]">
                      ❄️ <strong>Rekomendasi AI:</strong> Awetkan sebagai umbi cadangan (Irisan Blansir Beku di Cold Storage Koperasi, tahan 6 bulan) — <em>Bukan ditepungkan!</em>
                    </div>
                  </div>

                  {/* Dry Card */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      currentTime >= 30
                        ? "bg-amber-900/40 border-amber-400 ring-2 ring-amber-400 scale-[1.01]"
                        : "bg-gray-800/60 border-gray-700 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                        <Sun className="w-4 h-4 text-amber-400" /> ☀️ Skenario Musim Kemarau
                      </span>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded-full text-[10px]">
                        DEFISIT DITAMBAL (-30.000 kg)
                      </span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">
                      Panen umbi lokal anjlok karena tanah mengeras, sementara wisatawan membludak mencari keripik singkong.
                    </p>
                    <div className="mt-2.5 p-2 bg-amber-950/80 rounded-lg border border-amber-700 text-amber-200 font-medium text-[11px]">
                      📦 <strong>Rekomendasi AI:</strong> Buka cold storage! Rilis cadangan umbi awetan untuk menyuplai pabrik keripik agar tidak krisis bahan baku.
                    </div>
                  </div>
                </div>

                {/* Mini Visual Chart Indicator */}
                <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-2 bg-green-500 rounded-full" />
                    <div>
                      <span className="font-bold text-gray-200 block text-xs">
                        Grafik Neraca Keseimbangan Bahan Baku Keripik
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Net Gap Alami diseimbangkan oleh aliran Simpan vs Rilis Umbi Awetan
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/forecast/gap"
                    target="_blank"
                    className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                  >
                    Buka Halaman Langsung <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* Visual Screen 2: Stock Actions */}
            {currentChapter.id === 2 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="bg-white text-gray-900 p-3.5 rounded-xl shadow-md border border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">
                      Tindakan Cerdas Stok (Smart Action AI)
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Eksekusi operasional berprinsip Human-in-the-Loop di tangan Koordinator Koperasi.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-700 text-white font-bold rounded-lg text-xs shadow-xs">
                    Eksekusi Cerdas
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-sky-950/60 border border-sky-400 text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-sky-400/20 text-sky-300 text-[11px] uppercase">
                          ❄️ Tindakan: Preservasi Umbi Musim Hujan
                        </span>
                        <span className="font-mono text-gray-300 text-[11px]">Batch: BT-TRW-20261010-02</span>
                      </div>
                      <p className="text-gray-200 text-xs mt-1.5">
                        Surplus 4.200 kg umbi diawetkan (Metode Irisan Blansir Beku) ke Cold Storage Koperasi Trawas.
                      </p>
                    </div>
                    <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm text-xs cursor-pointer shrink-0">
                      ✓ Setujui Tindakan
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-400 text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 text-[11px] uppercase">
                          ☀️ Tindakan: Rilis Cadangan Umbi Kemarau
                        </span>
                        <span className="font-mono text-gray-300 text-[11px]">Batch: BT-TRW-PRESERV-20260915-01</span>
                      </div>
                      <p className="text-gray-200 text-xs mt-1.5">
                        Rilis 5.000 kg umbi awetan dari Cold Storage ke UMKM Keripik Barokah menambal defisit panen lokal.
                      </p>
                    </div>
                    <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm text-xs cursor-pointer shrink-0">
                      ✓ Setujui Tindakan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Screen 3: Delivery Claims */}
            {currentChapter.id === 3 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="bg-white text-gray-900 p-3.5 rounded-xl shadow-md border border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">
                      Pelacakan Logistik & Garansi Anti-Remuk (SOP Toleransi 5%)
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Perlindungan risiko keripik hancur akibat rute pengiriman pegunungan Trawas-Pacet.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs">
                    Hilir & Garansi
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-gray-800/80 border border-gray-700 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-200 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-green-400" /> DO-TRW-20261011-01 • Pengiriman Keripik Singkong
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      SOP Toleransi 5% Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-900/70 rounded-lg text-center text-[11px]">
                    <div>
                      <span className="text-gray-400 block">Tujuan Pengiriman</span>
                      <strong className="text-gray-200">Pusat Oleh-Oleh Pacet</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Status Kerusakan</span>
                      <strong className="text-amber-400">7.5% (Melebihi SOP)</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Penyelesaian Klaim</span>
                      <strong className="text-green-400">Potong Faktur Digital Rp 180.000</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Screen 4: Closing */}
            {currentChapter.id === 4 && (
              <div className="space-y-4 text-center my-auto py-8 animate-in zoom-in-95 duration-500">
                <div className="inline-block p-3 bg-green-500/20 text-green-400 rounded-full mb-2">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  ResiLokal
                </h3>
                <p className="text-sm font-semibold text-green-400">
                  "Lokal Tangguh, Renyah Sampai Tujuan"
                </p>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  Mendukung <strong>SDG 8 (Decent Work & Economic Growth)</strong>: Menghapus food loss petani, menjaga stabilitas bahan baku UMKM keripik, dan membangun transparansi rantai pasok agribisnis Indonesia.
                </p>
              </div>
            )}

            {/* Bottom Subtitle Karaoke Box */}
            <div className="mt-4 p-3 bg-gray-950/90 rounded-xl border border-gray-800 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                <span className="font-bold text-green-400 uppercase tracking-wide">
                  🎙️ Narasi Presenter (Teleprompter):
                </span>
                <span>{currentChapter.title}</span>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed font-medium">
                "{currentChapter.speechText}"
              </p>
            </div>
          </div>

          {/* Timeline Scrubbing & Playback Controls */}
          <div className="bg-gray-950 p-4 border-t border-gray-800 space-y-3">
            {/* Timeline Progress Bar */}
            <div className="relative w-full h-2.5 bg-gray-800 rounded-full cursor-pointer overflow-hidden group">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${(currentTime / 120) * 100}%` }}
              />
            </div>

            {/* Chapters Markers */}
            <div className="grid grid-cols-4 gap-1 text-[10px] text-gray-400 font-medium">
              {CHAPTERS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => jumpToTime(ch.startSec)}
                  className={`text-left p-1 rounded hover:bg-gray-800 truncate cursor-pointer transition-colors ${
                    currentChapter.id === ch.id ? "text-green-400 font-bold bg-gray-800/80" : ""
                  }`}
                >
                  {ch.title}
                </button>
              ))}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center gap-2 text-xs shadow-xs cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "Jeda (Pause)" : currentTime >= 120 ? "Putar Ulang" : "Mulai Demo (Play)"}
                </button>

                <button
                  onClick={handleReset}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs cursor-pointer"
                  title="Kembali ke awal"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-2 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 ${
                    voiceEnabled ? "bg-gray-800 text-green-400" : "bg-gray-800 text-gray-500"
                  }`}
                  title={voiceEnabled ? "Suara Narator AI Aktif" : "Suara Narator AI Mati"}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span className="text-[11px] hidden sm:inline">
                    {voiceEnabled ? "Suara AI Aktif" : "Bisu"}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <span className="hidden sm:inline">Shortcut Rekam Cepat Windows:</span>
                <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-300 font-mono text-[10px]">
                  Win + Alt + R
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Instructions Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <Sparkles className="w-4 h-4 text-green-700" />
            <span>Cara Menggunakan Simulator Video Demo Ini:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-gray-600 pt-1">
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <strong className="text-gray-900 block mb-0.5">1. Latihan Berbicara:</strong>
              Klik <strong>"Mulai Demo (Play)"</strong> dan ikuti teleprompter di bawah layar sambil mencocokkan tempo bicara Anda agar pas 2 menit.
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <strong className="text-gray-900 block mb-0.5">2. Rekam Jadi Video MP4/WebM:</strong>
              Klik tombol merah <strong>"🔴 Rekam Jadi Video"</strong> di atas. Sistem akan merekam otomatis dan langsung menyediakan link unduh video.
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <strong className="text-gray-900 block mb-0.5">3. Putar Langsung ke Juri:</strong>
              Buka link <code className="text-green-800 font-bold">/demo</code> saat presentasi, biarkan simulator berjalan otomatis di layar presentasi!
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
