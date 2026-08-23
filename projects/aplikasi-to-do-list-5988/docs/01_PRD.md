# PRD: aplikasi to do list

**Dokumen Kontrol Proyek**
* **Penulis:** Sarah Jenkins (Senior Product Manager)
* **Status:** Ready for Engineering Review
* **Versi:** 1.0.0
* **Domain/Fokus Sistem:** *Multi-Tenant Employee Payroll & Workforce Operational Management Engine*
* **Target Rilis:** Q3 2025

---

## 1. Executive Summary & Problem Statement

### 1.1 Executive Summary
Aplikasi ini (nama kode: *Project WorkPay / aplikasi to do list*) dirancang sebagai platform SaaS *multi-tenant* terpadu yang menggabungkan manajemen penugasan operasional kerja harian (*operational task tracking*) dengan sistem penggajian karyawan otomatis (*automated end-to-end payroll engine*). 

Sistem ini memungkinkan ribuan entitas bisnis (tenant) mengelola struktur organisasi, memonitor kepatuhan penyelesaian tugas harian, dan mengeksekusi perhitungan gaji kompleks (gaji pokok, tunjangan, lembur, BPJS, PPh 21, dan potongan berbasis SLA tugas) secara instan, aman, dan terisolasi.

### 1.2 Problem Statement
1. **Fragmentasi Data Operasional & Payroll:** Perusahaan kesulitan mengintegrasikan data produktivitas harian, kehadiran, dan denda ketidaktercapaian tugas ke dalam slip gaji akhir bulan, mengakibatkan proses manual yang rawan *human error*.
2. **Keterbatasan Skalabilitas Sistem Lama:** Aplikasi penggajian konvensional tidak didesain dengan arsitektur *multi-tenant* yang aman, menyulitkan grup perusahaan (*holding*) atau penyedia *outsourcing* dalam mengelola entitas anak perusahaan secara terpisah.
3. **Kompleksitas Regulasi Pajak & Kepatuhan:** Perhitungan PPh 21 (skema TER dan progresif) serta BPJS Ketenagakerjaan/Kesehatan memakan waktu hingga 3–5 hari kerja per periode *pay run*.

---

## 2. Target Users & Personas

| Peran (Role) | Tanggung Jawab Utama | Kebutuhan Kunci |
| :--- | :--- | :--- |
| **Super Admin (Platform Owner)** | Mengelola seluruh infrastruktur SaaS, langganan tenant, dan kepatuhan global. | Monitoring utilisasi sistem, isolasi basis data, *billing engine*. |
| **Tenant Admin (HR & Payroll Manager)** | Konfigurasi struktur gaji, validasi kehadiran & tugas, eksekusi *payroll run*. | *Formula builder* fleksibel, otomatisasi kalkulasi pajak/BPJS, integrasi perbankan. |
| **Tenant Approver (Finance Director / C-Level)** | Otorisasi pencairan dana gaji dan audit laporan keuangan. | Dasbor analitik biaya gaji (*burn rate*), sistem persetujuan bertingkat (*multi-level approval*). |
| **Employee (End-User)** | Menjalankan tugas harian, mencatat absensi, mengajukan klaim, melihat slip gaji. | *Employee Self-Service (ESS)* yang intuitif, akses slip gaji terenkripsi via mobile/web. |

---

## 3. Core Features & Functional Requirements

```
[Arsitektur Inti]
 ├── 1. Multi-Tenant Infrastructure & Security
 ├── 2. Organisasi & Data Master Karyawan
 ├── 3. Task Management & Input Payroll Otomatis
 ├── 4. Automated Payroll Calculation Engine
 ├── 5. Disbursement & Integrasi Pembayaran
 └── 6. Employee Self-Service (ESS)
```

### 3.1 Multi-Tenant Infrastructure
* **FR-MT-01:** Sistem harus mendukung arsitektur *Multi-Tenancy* menggunakan skema *Row-Level Security (RLS)* atau *Separate Schema* untuk isolasi data 100%.
* **FR-MT-02:** Kustomisasi konfigurasi per tenant: zona waktu, mata uang, kalender kerja, dan struktur perpajakan.

### 3.2 Employee & Master Data Management
* **FR-EM-01:** Pengelolaan data induk karyawan (Status PKWT/PKWTT/Freelance, PTKP, NPWP, Nomor BPJS, Data Rekening Bank).
* **FR-EM-02:** Pemetaan komponen gaji: Gaji Pokok, Tunjangan Tetap/Tidak Tetap, Skema Lembur, dan Potongan Kustom.

### 3.3 Task-Driven Payroll Inputs (Modul Integrasi Tugas & Payroll)
* **FR-TP-01:** Integrasi daftar tugas harian (*to-do list/SLA-based tasks*) terhadap insentif atau potongan performa karyawan secara otomatis.
* **FR-TP-02:** Modul absensi & *overtime tracking* yang terhubung langsung sebagai variabel perhitungan *payroll*.

### 3.4 Payroll Processing Engine
* **FR-PE-01 (Kalkulasi Otomatis):** Menghitung *Gross-to-Net* mencakup:
  * PPh 21 Otomatis (Metode TER Bulanan/Tahunan & Skema Gross, Gross-Up, Nett).
  * BPJS Ketenagakerjaan (JKK, JKM, JHT, JP) & BPJS Kesehatan (perhitungan batas atas & bawah otomatis).
  * Potongan keterlambatan, pinjaman karyawan, dan denda tugas.
* **FR-PE-02 (Prorate Engine):** Perhitungan gaji prorata otomatis bagi karyawan baru masuk atau *resign* di pertengahan periode.
* **FR-PE-03 (Batch Processing):** Eksekusi *Pay Run* massal hingga 10.000 karyawan per tenant dalam satu siklus kerja.

### 3.5 Approval & Disbursement
* **FR-AD-01:** Alur persetujuan multi-level (*Maker-Checker-Approver*) sebelum berkas penggajian difinalisasi.
* **FR-AD-02:** Ekspor format file kliring bank massal (BCA, Mandiri, BRI, BNI) dan integrasi langsung API Payment Gateway (*disbursement* otomatis).
* **FR-AD-03:** Penerbitan slip gaji digital berformat PDF yang dilindungi kata sandi (Password-protected).

---

## 4. User Stories & Acceptance Criteria

### Story 1: Eksekusi Siklus Penggajian Bulanan oleh HR Admin
> **Sebagai** Tenant HR Admin,  
> **Saya ingin** menjalankan proses *payroll calculation* massal secara otomatis berdasarkan data absensi dan kinerja tugas karyawan,  
> **Agar** saya dapat menghemat waktu dan menghindari kesalahan hitung manual sebelum diverifikasi oleh tim Finance.

#### Acceptance Criteria (Gherkin Format):
```gherkin
Scenario: Kalkulasi Penggajian Bulanan dengan Komponen Pajak dan Potongan
  Given Tenant Admin telah mengunci (lock) data absensi dan rekap tugas periode berjalan
  When Tenant Admin menekan tombol "Generate Payroll Run" untuk periode "Maret 2025"
  Then Sistem harus menghitung Gaji Pokok, Tunjangan, Overtime, BPJS, PPh 21, dan Potongan secara otomatis
  And Menampilkan ringkasan "Total Payout", "Total Tax", dan "Total Deductions" dalam waktu < 10 detik
  And Menandai status draf penggajian sebagai "Pending Approval"
```

---

### Story 2: Persetujuan Penggajian Multi-Level oleh Finance Director
> **Sebagai** Tenant Approver (Finance Director),  
> **Saya ingin** meninjau laporan ringkasan gaji dan menyetujui atau menolak *Pay Run*,  
> **Agar** pengeluaran kas perusahaan tetap sesuai anggaran dan terverifikasi secara sah.

#### Acceptance Criteria (Gherkin Format):
```gherkin
Scenario: Persetujuan Penggajian Berhasil
  Given Draf penggajian berstatus "Pending Approval"
  When Finance Director membuka detail ringkasan dan menekan tombol "Approve Pay Run"
  Then Sistem meminta otentikasi 2FA (Two-Factor Authentication)
  And Setelah verifikasi berhasil, status payroll berubah menjadi "Approved for Disbursement"
  And Sistem mengirimkan notifikasi instan ke bagian Kasir/Treasury
```

---

### Story 3: Akses Slip Gaji Mandiri oleh Karyawan
> **Sebagai** Karyawan (Employee),  
> **Saya ingin** mengunduh slip gaji bulanan saya dalam format PDF terenkripsi dari portal mandiri,  
> **Agar** saya mendapatkan rincian penerimaan gaji secara transparan dan aman.

#### Acceptance Criteria (Gherkin Format):
```gherkin
Scenario: Pengunduhan Slip Gaji Terenkripsi
  Given Gaji periode berjalan telah berstatus "Disbursed"
  When Karyawan login ke modul ESS dan memilih "Unduh Slip Gaji Maret 2025"
  Then Sistem mengunduh berkas PDF yang terenkripsi
  And PDF hanya dapat dibuka menggunakan kata sandi berupa kombinasi Tanggal Lahir (DDMMYYYY) dan 4 digit terakhir NIK
```

---

## 5. Non-Functional Requirements & Metrics

### 5.1 Non-Functional Requirements (NFR)

| Kategori | Kriteria & Spesifikasi Teknis |
| :--- | :--- |
| **Keamanan & Isolasi Data** | • Enkripsi data *at-rest* menggunakan AES-256 dan *in-transit* menggunakan TLS 1.3.<br>• Implementasi *Row-Level Security (RLS)* ketat pada basis data PostgreSQL.<br>• *Audit trail log* tak terhapuskan (*immutable*) untuk setiap perubahan data finansial. |
| **Performa & Skalabilitas** | • Pemrosesan batch payroll: Kalkulasi 5.000 karyawan selesai dalam < 30 detik.<br>• Latensi API (p95) < 200 ms untuk operasional standar.<br>• Mampu menangani beban konkurensi hingga 100 tenant bersamaan pada tanggal puncak gajian (*peak pay-run date*). |
| **Ketersediaan (Availability)** | • Target SLA: **99.9% Uptime** (downtime terencana hanya di luar jam kerja).<br>• *Disaster Recovery*: RPO < 1 jam, RTO < 4 jam. |
| **Kepatuhan Regulasi** | • Kepatuhan UU Perlindungan Data Pribadi (UU PDP).<br>• Perhitungan pajak terupdate sesuai regulasi PMK PPh 21 TER yang berlaku di Indonesia. |

---

### 5.2 Success Metrics & Key Performance Indicators (KPIs)

```
        ┌─────────────────────────────────────────────────────────┐
        │                 SUCCESS METRICS DASHBOARD               │
        ├────────────────────────────┬────────────────────────────┤
        │  Waktu Pemrosesan Payroll  │   Tingkat Error Kalkulasi  │
        │      TURUN 85%             │          0%                │
        │   (Dari 3 hari -> 2 jam)   │     (Zero Discrepancy)     │
        ├────────────────────────────┼────────────────────────────┤
        │    Tingkat Retensi Tenant  │      Adopsi ESS Mobile     │
        │       > 98% per tahun      │      > 90% Karyawan Aktif  │
        └────────────────────────────┴────────────────────────────┘
```

1. **Efficiency Metric:** Waktu yang dihabiskan HR Admin untuk memproses penggajian berkurang dari rata-rata 3 hari kerja menjadi **kurang dari 2 jam**.
2. **Accuracy Metric:** Discrepancy/kesalahan perhitungan gaji mencapai **0%** (*Zero Defect Rate* pada komponen regulasi pajak/BPJS).
3. **System Performance Metric:** Kegagalan pengiriman *batch disbursement* perbankan kurang dari **0.01%**.
4. **User Engagement Metric:** Adopsi portal ESS mencapai minimal **90% MAU (Monthly Active Users)** pada bulan kedua pasca *onboarding*.