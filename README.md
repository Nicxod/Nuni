# CassavaFlow AI 🍠

> **Seasonal Supply Forecasting, Market Demand Forecasting, and Smart Cassava Stock Planning for Trawas**

CassavaFlow AI adalah platform rantai pasok berbasis web yang dirancang khusus untuk membantu kelompok tani, pengelola pasokan, dan UMKM pengolah singkong di kawasan Trawas, Mojokerto dalam merencanakan panen, membaca kebutuhan pasar, mendeteksi potensi surplus/defisit lebih awal, dan menentukan tindakan terbaik terhadap persediaan singkong segar sebelum mengalami penurunan mutu.

---

## 🌟 Fitur Utama

### 1. AI Harvest Supply Forecasting (Fitur Utama 1)
- Memperkirakan volume panen singkong mingguan (horizon 4–12 minggu ke depan).
- Mengintegrasikan jadwal tanam, luas petak lahan, varietas singkong, dan riwayat panen aktual.
- Menampilkan rentang ketidakpastian (*confidence band* $\pm 15\%$) dan metrik evaluasi backtest temporal (MAE, RMSE, WAPE).

### 2. AI Market Demand Forecasting (Fitur Utama 2)
- Mempelajari riwayat transaksi pembelian UMKM dan pedagang lokal.
- Memisahkan secara tegas: *Actual Demand*, *Confirmed Orders*, *Forecast Demand*, dan *Planned Demand* untuk menghindari *double-counting*.
- Menampilkan proyeksi serapan pasar per minggu dengan rentang ketidakpastian $\pm 12\%$.

### 3. Supply–Demand Gap Analysis
- Menggabungkan proyeksi pasokan panen, stok fisik gudang yang layak pakai, pesanan terkonfirmasi, dan peramalan permintaan pasar.
- Menghasilkan status per periode: **Surplus** ($> +500\text{ kg}$), **Defisit** ($< -500\text{ kg}$), atau **Seimbang** ($\pm 500\text{ kg}$).

### 4. Smart Stock Planner & Preservation Actions
- Menghasilkan rekomendasi cerdas penanganan stok berdasarkan prioritas: (1) Alokasi pesanan terkonfirmasi, (2) Peringatan batas umur biologis singkong segar ($\ge 2\text{ hari}$ pascapanen), (3) Opsi pengolahan olahan bernilai tambah.
- **Human-in-the-Loop:** Sistem mewajibkan persetujuan manual manusia sebelum alokasi atau status stok diubah, disertai pencatatan *audit log*.

### 5. Fitur Pendukung (P1)
- **Kalkulator Biaya Olahan (Profit & Cost Calculator):** Perhitungan deterministik dengan tipe data `Decimal` untuk membandingkan penjualan singkong mentah versus diversifikasi produk (Keripik Singkong, Tepung Mocaf, Singkong Parut Beku).
- **Pencocokan Pembeli Cerdas (Explainable Buyer Matching):** Skor kesesuaian pasokan (0–100%) dengan transparansi bobot volume, mutu/grade, dan kedekatan lokasi Trawas.
- **Transaksi & Ekspor/Impor CSV:** Riwayat pesanan, unduh ekspor CSV, dan impor CSV transaksi dengan pratinjau dan laporan baris gagal.

---

## 🎨 Desain UI/UX & Design System

Aplikasi dibangun mengikuti standar **UI/UX Pro Max Skill** dengan tema **Organic Biophilic Agritech** (Density 8/10):
- **Warna Utama:** Earth Green (`#15803D`), Secondary Emerald (`#22C55E`), Accent Harvest Gold (`#A16207`).
- **Aksesibilitas:** Kontras teks $\ge 4.5:1$, ikon SVG Lucide (tanpa emoji sebagai ikon), indikator status multi-modal.
- **Transparansi Data:** Semua data percontohan diberi label **SIMULASI** sesuai Bab 10 & 25 PRD.
- File aturan desain tersimpan di: `design-system/cassavaflow-ai/MASTER.md`.

---

## 🚀 Panduan Menjalankan Aplikasi

### Opsi A: Menjalankan dengan Docker Compose (Direkomendasikan)

1. Pastikan Docker dan Docker Compose telah terpasang.
2. Salin template environment:
   ```bash
   cp .env.example .env
   ```
3. Bangun dan jalankan seluruh service (`web`, `api`, `db`):
   ```bash
   docker compose up --build
   ```
4. Buka browser:
   - **Frontend Web:** [http://localhost:3000](http://localhost:3000)
   - **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Healthcheck Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)

---

### Opsi B: Menjalankan secara Lokal / Manual

#### 1. Menjalankan Backend (FastAPI + Python)
```bash
# Masuk ke folder backend
cd services/api

# Aktifkan virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Jalankan server API
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Menjalankan Frontend (Next.js)
```bash
# Masuk ke folder web
cd apps/web

# Jalankan development server
npm run dev
```
Aplikasi web akan tersedia di [http://localhost:3000](http://localhost:3000).

---

## 🧪 Menjalankan Pengujian (Testing)

### 1. Backend Pytest Suite
Pengujian mencakup aturan bisnis non-negatif, perhitungan kalkulator deterministik, formula evaluasi metrik (MAE/RMSE/WAPE), otentikasi, peramalan, gap analysis, dan siklus persetujuan stok:
```bash
services\api\venv\Scripts\python.exe -m pytest services\api\tests -v
```

### 2. Frontend Build Verification
Memastikan seluruh halaman TypeScript App Router terkompilasi tanpa kesalahan:
```bash
cd apps/web
npm run build
```

---

## 🔑 Akun Demo Login & Peran (Role)

Tersedia tombol pintas 1-klik di halaman login (`/login`) atau gunakan kredensial berikut:

| Peran | Email | Kata Sandi | Fungsi Utama |
|-------|-------|------------|--------------|
| **Petani / Poktan** | `petani@cassavaflow.local` | `petanipassword123` | Kelola rencana panen, stok batch, tinjau saran alokasi |
| **Pembeli / UMKM** | `pembeli@cassavaflow.local` | `pembelipassword123` | Ajukan kebutuhan bahan baku, riwayat order keripik/mocaf |
| **Administrator** | `admin@cassavaflow.local` | `adminpassword123` | Konfigurasi opsi olahan, batas toleransi gap, akses penuh |
| **Analis / Viewer** | `viewer@cassavaflow.local` | `viewerpassword123` | Tinjau grafik, tren musiman, dan unduh laporan eksekutif |

---

## 📋 Catatan Keterbatasan & Validasi Lapangan

- **Label Simulasi:** Seluruh data panen dan harga saat ini berstatus **SIMULASI** untuk menguji alur logika dan keputusan percontohan Trawas.
- **Model Baseline:** Sebelum data historis transaksi lapangan mencapai $\ge 6$ bulan, sistem menggunakan kombinasi kalender panen dan rata-rata bergerak (*moving average*) dengan penanda *Data Terbatas - Estimasi Awal*.
- **Keamanan Pangan & Pengolahan:** Parameter rendemen dan biaya pengolahan mengacu pada SOP rujukan lokal (SOP-TRAWAS-01); verifikasi berkala bersama mitra UMKM tetap diwajibkan.
