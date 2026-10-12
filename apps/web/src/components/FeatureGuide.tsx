"use client";

import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, BarChart2, PlusCircle, Users } from "lucide-react";

export interface GuideStep {
  title: string;
  desc: string;
}

export interface FeatureGuideProps {
  title?: string;
  badge?: string;
  howToRead: GuideStep[];
  howToAddOrAct: GuideStep[];
  roleTarget?: string;
  defaultOpen?: boolean;
}

export function FeatureGuide({
  title = "Panduan Fitur & Cara Penggunaan",
  badge = "Panduan Interaktif",
  howToRead,
  howToAddOrAct,
  roleTarget,
  defaultOpen = true,
}: FeatureGuideProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-green-50/90 border border-emerald-200/90 rounded-xl overflow-hidden shadow-2xs transition-all">
      {/* Header bar with toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-emerald-100/50 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-700 text-white rounded-lg shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-emerald-950">
                {title}
              </h3>
              {badge && (
                <span className="text-[10px] font-semibold bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-700 hidden sm:block">
              Petunjuk membaca diagram, langkah input data, dan alur operasional di lapangan.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-white/80 hover:bg-white px-2.5 py-1 rounded-md border border-emerald-200 transition-colors cursor-pointer"
        >
          <span>{isOpen ? "Tutup Panduan" : "Buka Panduan"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Content */}
      {isOpen && (
        <div className="p-4 pt-1 border-t border-emerald-200/60 bg-white/60">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 text-xs">
            {/* 1. Cara Membaca */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 border-b border-gray-100 pb-1.5">
                <BarChart2 className="w-4 h-4 text-emerald-700" />
                <span>1. Cara Membaca Diagram & Data</span>
              </div>
              <ul className="space-y-1.5 text-gray-700 text-[11px] leading-relaxed">
                {howToRead.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="font-bold text-emerald-700 shrink-0">•</span>
                    <div>
                      <strong className="text-gray-900">{item.title}: </strong>
                      <span>{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. Cara Tambah / Aksi */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 border-b border-gray-100 pb-1.5">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span>2. Cara Tambah Data & Melakukan Aksi</span>
              </div>
              <ul className="space-y-1.5 text-gray-700 text-[11px] leading-relaxed">
                {howToAddOrAct.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-600 shrink-0">{idx + 1}.</span>
                    <div>
                      <strong className="text-gray-900">{item.title}: </strong>
                      <span>{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Peran & Tanggung Jawab */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 border-b border-gray-100 pb-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>3. Penanggung Jawab & Alur Peran</span>
              </div>
              <div className="text-[11px] text-gray-700 space-y-2 leading-relaxed">
                {roleTarget ? (
                  <p>{roleTarget}</p>
                ) : (
                  <p>
                    Fitur ini digunakan bersama oleh <strong>Petani</strong> (pencatatan pasokan), <strong>UMKM</strong> (penyerapan pesanan), dan <strong>Admin/Koordinator</strong> (pengambilan keputusan stok).
                  </p>
                )}
                <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-lg p-2 text-[10.5px]">
                  ⏱️ <strong>SOP Kritis 48 Jam:</strong> Singkong segar mengalami pemburukan fisiologis (PPD). Pastikan setiap tindakan terjadwal sebelum 48 jam pascapanen.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
