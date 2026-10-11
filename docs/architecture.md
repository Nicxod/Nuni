# Arsitektur Sistem — CassavaFlow AI

CassavaFlow AI dirancang untuk memecahkan ketidakseimbangan musiman pasokan dan permintaan singkong di Trawas, Mojokerto melalui integrasi dua mesin peramalan berbasis AI dan perencanaan tindakan cerdas persediaan (Smart Stock Actions).

---

## 1. Diagram Komponen Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Frontend (Next.js)                   │
│   • Next.js App Router, TypeScript, Tailwind CSS, Recharts  │
│   • Design System: Biophilic Agritech (Density 8/10)        │
│   • Bahasa UI: Bahasa Indonesia, Format Angka IDR & kg      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway & Backend                    │
│                        (FastAPI)                            │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Modul Bisnis: Auth, CRUD, Transaksi, Audit Log      │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │ AI Supply Forecaster (Crop Plans + Temporal Backtest)│  │
│   ├─────────────────────────────────────────────────────┤   │
│   │ AI Demand Forecaster (Transactions + Planned Needs) │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │ Supply–Demand Gap Analysis Engine                   │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │ Smart Stock Actions & Preservation Recommender      │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │ Processing Cost & Margin Calculator (P1)            │   │
│   └─────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQLAlchemy 2.0 (psycopg)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL Database (v16)                   │
│   • Persistensi volume bernama Docker (named volume)        │
│   • 15 Tabel: users, farms, crop_plans, inventory_batches,  │
│     buyers, buyer_needs, transactions, forecast_runs, dll.  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Prinsip Kerja Mesin Peramalan (Forecasting Engines)

### 2.1 AI Harvest Supply Forecasting
- **Sumber Data Input:** Rencana panen petani (`crop_plans`), tanggal tanam, perkiraan umur panen, luas lahan (ha), dan catatan panen aktual historis (`harvest_records`).
- **Pendekatan Model:** Menggabungkan kalender panen terencana (80%) dengan *moving average* historis hasil panen (20%).
- **Evaluasi Model:** Menggunakan validasi temporal (*rolling-origin backtest*) untuk mengukur MAE, RMSE, dan WAPE tanpa kebocoran data masa depan (*data leakage*).
- **Rentang Ketidakpastian:** Menghasilkan rentang batas atas dan batas bawah (±15%).

### 2.2 AI Market Demand Forecasting
- **Sumber Data Input:** Riwayat transaksi selesai/terpenuhi (`transactions`), pesanan aktif terkonfirmasi (*confirmed orders*), dan kebutuhan masa depan yang didaftarkan pembeli (`buyer_needs`).
- **Pencegahan Double Counting:** Pesanan terkonfirmasi dan pesanan batal dipisahkan secara tegas agar tidak terhitung ganda terhadap peramalan residual.
- **Rentang Ketidakpastian:** Menghasilkan batas atas dan bawah (±12%).

---

## 3. Rumus Baku Supply–Demand Gap Analysis

Perhitungan selisih pasokan dan permintaan dilakukan per periode mingguan/bulanan:

$$\text{Projected Available Supply} = \text{Stok Awal Layak Pakai} + \text{Prediksi Panen} - \text{Pesanan Tetap}$$

$$\text{Projected Gap} = \text{Projected Available Supply} - \text{Prediksi Permintaan}$$

- **Surplus:** Jika Net Gap $> +500\text{ kg}$ $\rightarrow$ Sistem menyarankan opsi pengolahan bernilai tambah atau pencarian pembeli baru.
- **Defisit:** Jika Net Gap $< -500\text{ kg}$ $\rightarrow$ Sistem memberi peringatan kekurangan pasokan untuk koordinasi antar poktan.
- **Seimbang:** Di antara rentang $\pm 500\text{ kg}$.

---

## 4. Smart Stock Planner & Pengendalian Manusia (*Human-in-the-Loop*)

1. **Prioritas Alokasi (FIFO):** Batch tertua yang memenuhi kriteria dialokasikan terlebih dahulu untuk pesanan terkonfirmasi.
2. **Peringatan SOP Pascapanen:** Singkong segar rentan mengalami pencokelatan vaskular enzimatik dalam 48–72 jam. Batch yang berumur $\ge 2\text{ hari}$ direkomendasikan segera diolah menjadi keripik, mocaf, atau singkong parut beku.
3. **Persetujuan Manusia:** Sistem **tidak mengubah** stok fisik atau komitmen penjualan secara sepihak. Setiap tindakan wajib melalui verifikasi dan tombol persetujuan pengguna, dengan pencatatan otomatis di `audit_logs`.

---

## 5. Kalkulator Pengolahan & Nilai Tambah (P1)

- Perhitungan finansial deterministik menggunakan tipe data `Decimal` (presisi tinggi tanpa *floating point error*).
- Menghitung biaya bahan baku, tenaga kerja, energi penggorengan/pengeringan, kemasan, dan distribusi.
- Membandingkan hasil penjualan mentah vs margin kontribusi olahan secara transparan.
