# Kamus Data (Data Dictionary) — CassavaFlow AI

Kamus data ini mendefinisikan 15 tabel PostgreSQL dalam skema CassavaFlow AI sesuai Bab 15 PRD.

---

## 1. `users`
Menyimpan akun pengguna dan peran hak akses (RBAC).

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID (PK) | Pengenal unik pengguna |
| `name` | VARCHAR(255) | Nama lengkap pengguna |
| `email` | VARCHAR(255) | Email unik untuk autentikasi login |
| `password_hash` | VARCHAR(255) | Hash kata sandi terenkripsi (bcrypt) |
| `role` | VARCHAR(50) | Peran: `admin`, `farmer`, `buyer`, `viewer` |
| `is_active` | BOOLEAN | Status keaktifan akun (default: true) |
| `created_at` / `updated_at` | TIMESTAMPTZ | Waktu pembuatan & pembaruan |

---

## 2. `farms`
Informasi petak lahan dan kelompok tani (poktan) di Trawas.

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID (PK) | Pengenal petak lahan |
| `owner_user_id` | UUID (FK) | Relasi ke `users.id` |
| `group_name` | VARCHAR(255) | Nama kelompok tani (mis. Poktan Trawas Makmur) |
| `village` | VARCHAR(100) | Desa (mis. Ketapanrame, Duyung, Belik) |
| `area_hectares` | NUMERIC(10,2) | Luas lahan dalam satuan hektar |
| `notes` | TEXT | Catatan kondisi tanah / elevasi |

---

## 3. `crop_plans`
Rencana tanam dan estimasi tanggal kesiapan panen.

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID (PK) | Pengenal rencana panen |
| `farm_id` | UUID (FK) | Relasi ke `farms.id` |
| `crop_name` | VARCHAR(100) | Nama tanaman (default: Singkong) |
| `variety` | VARCHAR(100) | Varietas: Gajah, Manggu, Kuning Mentega |
| `planting_date` | DATE | Tanggal tanam bibit |
| `expected_harvest_date` | DATE | Tanggal perkiraan panen |
| `area_hectares` | NUMERIC(10,2) | Luas petak yang ditanam |
| `expected_yield_kg` | NUMERIC(12,2) | Estimasi hasil panen (kg) |
| `status` | VARCHAR(50) | `planned`, `growing`, `ready_to_harvest`, `harvested`, `failed` |
| `data_origin` | VARCHAR(50) | `actual`, `manual_estimate`, `simulation` |

---

## 4. `harvest_records`
Catatan panen riil setelah pemungutan hasil panen.

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID (PK) | Pengenal catatan panen |
| `farm_id` | UUID (FK) | Relasi ke `farms.id` |
| `crop_plan_id` | UUID (FK, nullable) | Relasi ke `crop_plans.id` |
| `harvest_date` | DATE | Tanggal pelaksanaan panen |
| `quantity_kg` | NUMERIC(12,2) | Total hasil panen tercabut (kg) |
| `quality_grade` | VARCHAR(20) | Mutu umbi: Super, A, B, C |
| `rejected_quantity_kg` | NUMERIC(12,2) | Jumlah sortasi afkir/rusak (kg) |
| `data_origin` | VARCHAR(50) | Label asal data (default: simulation) |

---

## 5. `inventory_batches`
Stok fisik di gudang kelompok tani per batch panen.

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID (PK) | Pengenal batch |
| `farm_id` | UUID (FK) | Relasi ke `farms.id` |
| `batch_code` | VARCHAR(100) | Kode unik batch (mis. BATCH-TRW-202610-001) |
| `harvest_date` | DATE | Tanggal panen batch |
| `initial_quantity_kg` | NUMERIC(12,2) | Berat awal saat masuk gudang |
| `available_quantity_kg` | NUMERIC(12,2) | Stok tersedia saat ini (kg) |
| `reserved_quantity_kg` | NUMERIC(12,2) | Stok yang telah dialokasikan ke pesanan |
| `quality_grade` | VARCHAR(20) | Mutu umbi |
| `condition_notes` | VARCHAR(255) | Catatan kesegaran fisik |
| `status` | VARCHAR(50) | `available`, `allocated`, `processing`, `sold`, `spoiled` |
| `handling_deadline` | DATE | Batas waktu SOP sebelum kerusakan pascapanen |
| `data_origin` | VARCHAR(50) | `actual`, `manual_estimate`, `simulation` |

---

## 6. `buyers`
Direktori pembeli, UMKM pengolah keripik, pabrik mocaf, dan pedagang.

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID (PK) | Pengenal pembeli |
| `business_name` | VARCHAR(255) | Nama usaha / badan hukum pembeli |
| `buyer_category` | VARCHAR(100) | `umkm_chips`, `tapioca_factory`, `fresh_market`, `animal_feed` |
| `village_or_area` | VARCHAR(100) | Lokasi / area pengiriman |
| `contact_phone` | VARCHAR(50) | Nomor telepon/kontak |
| `max_quantity_kg` | NUMERIC(12,2) | Kapasitas serapan per batch (kg) |
| `preferred_grade` | VARCHAR(20) | Syarat mutu yang diminati |
| `lead_time_days` | INTEGER | Waktu tunggu pemesanan (hari) |
| `is_verified` | BOOLEAN | Status verifikasi mitra pembeli |

---

## 7. `buyer_needs`
Rencana kebutuhan bahan baku masa depan yang diajukan pembeli (*Planned Demand*).

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID (PK) | Pengenal kebutuhan |
| `buyer_id` | UUID (FK) | Relasi ke `buyers.id` |
| `needed_from` / `needed_until` | DATE | Rentang waktu bahan baku dibutuhkan |
| `quantity_kg` | NUMERIC(12,2) | Kuantitas yang dibutuhkan (kg) |
| `minimum_grade` | VARCHAR(20) | Standar mutu minimal yang dapat diterima |
| `target_price_per_kg` | NUMERIC(12,2) | Target harga beli (Rp/kg) |
| `status` | VARCHAR(50) | `planned`, `confirmed`, `fulfilled`, `cancelled` |

---

## 8. `transactions`
Transaksi pemesanan dan pembelian riil.

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID (PK) | Pengenal transaksi |
| `buyer_id` | UUID (FK) | Relasi ke `buyers.id` |
| `transaction_date` | DATE | Tanggal transaksi dibuat |
| `order_date` | DATE | Tanggal pesanan disepakati |
| `fulfilled_date` | DATE | Tanggal pengiriman selesai |
| `quantity_ordered_kg` | NUMERIC(12,2) | Kuantitas dipesan (kg) |
| `quantity_fulfilled_kg` | NUMERIC(12,2) | Kuantitas yang telah dipenuhi (kg) |
| `unit_price` | NUMERIC(12,2) | Harga per kilogram (Rp) |
| `delivery_cost` | NUMERIC(12,2) | Biaya angkut / logistik (Rp) |
| `status` | VARCHAR(50) | `draft`, `confirmed`, `fulfilled`, `cancelled`, `rejected` |

---

## 9. `transaction_allocations`
Alokasi stok dari suatu batch spesifik untuk memenuhi transaksi pesanan.

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID (PK) | Pengenal alokasi |
| `transaction_id` | UUID (FK) | Relasi ke `transactions.id` |
| `inventory_batch_id` | UUID (FK) | Relasi ke `inventory_batches.id` |
| `allocated_quantity_kg` | NUMERIC(12,2) | Kuantitas yang dikunci dari batch (kg) |

---

## 10. `forecast_runs` & `forecast_points`
Menyimpan riwayat eksekusi model peramalan dan titik-titik proyeksi kuantitas.

| Kolom `forecast_runs` | Tipe Data | Keterangan |
|-----------------------|-----------|------------|
| `id` | UUID (PK) | Pengenal sesi run forecast |
| `forecast_type` | VARCHAR(50) | `supply` atau `demand` |
| `granularity` | VARCHAR(50) | `weekly` atau `monthly` |
| `method_name` | VARCHAR(100) | Algoritma yang digunakan |
| `model_version` | VARCHAR(50) | Versi model |
| `metrics_json` | JSON | Metrik backtest: MAE, RMSE, WAPE |
| `quality_status` | VARCHAR(50) | `reliable`, `low_confidence`, `insufficient_data` |

---

## 11. `processing_options`
Pilihan produk olahan bernilai tambah yang terdaftar di Trawas (Keripik, Mocaf, Singkong Beku).

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID (PK) | Pengenal opsi olahan |
| `name` | VARCHAR(255) | Nama produk olahan |
| `yield_ratio` | NUMERIC(6,4) | Rendemen hasil jadi (mis. 0.40 = 40%) |
| `capacity_kg_per_day` | NUMERIC(12,2) | Kapasitas olah harian fasilitas |
| `labor_cost` / `energy_cost` | NUMERIC(12,2) | Komponen biaya olah per kg bahan mentah |
| `packaging_cost` / `distribution_cost` | NUMERIC(12,2) | Biaya kemasan dan distribusi per kg |
| `expected_selling_price_per_unit` | NUMERIC(12,2) | Harga jual estimasi per produk jadi |
| `food_safety_sop_reference` | VARCHAR(255) | Rujukan SOP keamanan pangan |

---

## 12. `stock_recommendations`
Rekomendasi tindakan cerdas stok yang dihasilkan oleh sistem untuk ditinjau manusia.

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID (PK) | Pengenal rekomendasi |
| `recommendation_type` | VARCHAR(50) | `allocate`, `process`, `sell`, `find_buyer`, `procure` |
| `batch_id` | UUID (FK, nullable) | Relasi ke `inventory_batches.id` |
| `quantity_kg` | NUMERIC(12,2) | Kuantitas yang disarankan |
| `reason` | TEXT | Penjelasan logis dan urgensi |
| `estimated_cost` / `estimated_value` | NUMERIC(12,2) | Estimasi biaya & potensi nilai ekonomi |
| `status` | VARCHAR(50) | `pending`, `approved`, `rejected`, `completed` |
| `reviewed_by_user_id` | UUID (FK) | Relasi ke pengguna yang mengambil keputusan |
| `reviewed_at` | TIMESTAMPTZ | Waktu persetujuan / penolakan |

---

## 13. `audit_logs`
Catatan jejak audit untuk setiap perubahan alokasi stok dan keputusan pengguna.

| Kolom | Tipe Data | Keterangan |
|-------|-----------|------------|
| `id` | UUID (PK) | Pengenal log audit |
| `user_id` | UUID (FK, nullable) | Pengguna penanggung jawab |
| `action` | VARCHAR(100) | Aksi (mis. `approve_allocate`, `approve_process`) |
| `entity_type` | VARCHAR(100) | Entitas yang terpengaruh (mis. `inventory_batch`) |
| `before_json` / `after_json` | JSON | Cuplikan keadaan data sebelum & sesudah aksi |
| `created_at` | TIMESTAMPTZ | Waktu peristiwa |
