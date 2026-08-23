Berikut adalah draf panduan pengguna lengkap (*User Manual*) berformat Markdown (`.md`) yang disusun dengan standar dokumentasi teknis profesional.

***

```markdown
# Panduan Pengguna (User Manual): TaskFlow App

**Versi Dokumen:** 1.0.0  
**Tanggal Rilis:** Oktober 2023  
**Penulis:** Technical Writing Team (Lead: Page)  
**Target Pembaca:** Pengguna Baru & Pengguna Tingkat Lanjut  

---

## Daftar Isi
1. [Pengantar](#1-pengantar)
2. [Langkah Onboarding](#2-langkah-onboarding)
3. [Navigasi & Antarmuka Aplikasi](#3-navigasi--antarmuka-aplikasi)
4. [Panduan Penggunaan Fitur Utama](#4-panduan-penggunaan-fitur-utama)
5. [Pintasan Keyboard (Shortcuts)](#5-pintasan-keyboard-shortcuts)
6. [Pemecahan Masalah (Troubleshooting)](#6-pemecahan-masalah-troubleshooting)
7. [Bantuan & Dukungan](#7-bantuan--dukungan)

---

## 1. Pengantar

**TaskFlow** adalah aplikasi manajemen tugas (*to-do list*) yang dirancang untuk membantu Anda mengorganisasi, memprioritaskan, dan menyelesaikan pekerjaan sehari-hari secara efisien.

### 1.1 Persyaratan Sistem
* **Web:** Browser modern (Chrome v90+, Firefox v88+, Safari v14+, Edge v90+).
* **Mobile:** Android 8.0+ atau iOS 14.0+.
* **Koneksi:** Diperlukan akses internet untuk sinkronisasi data *real-time*.

---

## 2. Langkah Onboarding

Ikuti langkah-langkah berikut untuk memulai penggunaan TaskFlow:

### Langkah 1: Pendaftaran Akun
1. Buka aplikasi TaskFlow atau kunjungi `https://app.taskflow.io`.
2. Klik tombol **Daftar** (Sign Up).
3. Pilih metode pendaftaran:
   * Menggunakan akun Google/Apple (*Single Sign-On*).
   * Menggunakan Email & Kata Sandi.
4. Jika menggunakan email, verifikasi akun melalui tautan yang dikirimkan ke kotak masuk Anda.

### Langkah 2: Pengaturan Preferensi Awal (Wizard)
Setelah login pertama kali, wizard onboarding akan memandu Anda:
1. **Pilih Zona Waktu & Format Tanggal:** Sesuaikan dengan lokasi Anda agar pengingat (*reminder*) akurat.
2. **Pilih Tema Tampilan:** Terang (*Light*), Gelap (*Dark*), atau Mengikuti Sistem.
3. **Izin Notifikasi:** Klik **Izinkan** (*Allow*) saat peramban/perangkat meminta izin push notification.

### Langkah 3: Membuat Tugas Pertama Anda
1. Pada layar selamat datang, ketik tugas pertama Anda di kolom input (contoh: *"Membeli susu"*).
2. Tekan **Enter** untuk menyimpan.

---

## 3. Navigasi & Antarmuka Aplikasi

Antarmuka TaskFlow dibagi menjadi 3 area utama:

```
+------------------+----------------------------------+------------------+
|                  |                                  |                  |
|  [1] SIDEBAR     |  [2] DAFTAR TUGAS UTAMA          |  [3] PANEL       |
|  - Hari Ini      |  (Task List View)                |      DETAIL      |
|  - Mendatang     |                                  |  (Task Detail)   |
|  - Proyek/Folder |  [+] Tambah Tugas...             |                  |
|  - Label         |  [ ] Tugas A                     |  - Deskripsi     |
|                  |  [ ] Tugas B                     |  - Sub-task      |
|                  |                                  |  - Lampiran      |
+------------------+----------------------------------+------------------+
```

### 3.1 Sidebar (Navigasi Kiri)
* **Hari Ini (Today):** Menampilkan tugas dengan batas waktu hari ini.
* **Mendatang (Upcoming):** Kalender visual untuk melihat beban kerja di masa depan.
* **Proyek (Projects):** Pengelompokan tugas berdasarkan kategori (misal: *Pribadi, Kantor, Belajar*).
* **Label/Tags:** Filter tugas berdasarkan konteks tertentu (misal: `@email`, `@urgent`).

### 3.2 Area Daftar Tugas (Tengah)
Area kerja utama tempat Anda melihat, mencentang, mengurutkan, dan menambah tugas baru.

### 3.3 Panel Detail Tugas (Kanan)
Muncul saat Anda mengklik salah satu tugas. Digunakan untuk menambahkan catatan rinci, berkas lampiran, tenggat waktu, sub-tugas, dan prioritas.

---

## 4. Panduan Penggunaan Fitur Utama

### 4.1 Menambahkan dan Mengatur Tugas
1. Klik tombol **"+ Tambah Tugas"** atau tekan tombol shortcut `N`.
2. Masukkan judul tugas.
3. Atur metadata tugas:
   * **Jadwal:** Klik ikon kalender untuk memilih tanggal dan jam.
   * **Prioritas:** Pilih dari **P1** (Tinggi/Merah), **P2** (Sedang/Kuning), **P3** (Rendah/Biru), atau **P4** (Tanpa Prioritas/Abu-abu).
   * **Proyek/Kategori:** Tentukan lokasi folder tugas tersebut.
4. Klik **Simpan** atau tekan `Ctrl + Enter` (`Cmd + Enter` di Mac).

### 4.2 Mengelola Sub-tugas (Checklist)
1. Buka tugas untuk memunculkan **Panel Detail**.
2. Klik tombol **Tambah Sub-tugas**.
3. Ketik rincian langkah kerja, lalu tekan `Enter`.

### 4.3 Menyelesaikan dan Menghapus Tugas
* **Menyelesaikan:** Klik kotak centang `[ ]` di samping judul tugas. Tugas akan berpindah ke riwayat "Tugas Selesai".
* **Menghapus:** Klik kanan pada tugas > pilih **Hapus**, atau buka Panel Detail > klik ikon **Tempat Sampah**.

---

## 5. Pintasan Keyboard (Shortcuts)

Gunakan pintasan keyboard berikut untuk meningkatkan produktivitas Anda:

| Tombol Pintasan | Fungsi |
| :--- | :--- |
| `N` | Membuat tugas baru (*New Task*) |
| `Q` | Buka menu *Quick Add* dari mana saja |
| `Ctrl + K` / `Cmd + K` | Buka Menu Pencarian Global (Search) |
| `Delete` / `Backspace` | Hapus tugas yang sedang dipilih |
| `E` | Tandai tugas sebagai selesai / belum selesai |
| `1`, `2`, `3`, `4` | Mengubah Prioritas (P1 - P4) secara cepat |
| `Esc` | Menutup panel detail / membatalkan aksi |

---

## 6. Pemecahan Masalah (Troubleshooting)

Berikut adalah solusi untuk kendala umum yang sering terjadi:

### Masalah 1: Notifikasi Pengingat Tidak Muncul
* **Penyebab:** Izin notifikasi dinonaktifkan di browser atau sistem operasi perangkat.
* **Solusi:**
  1. Periksa ikon gembok di sebelah bilah URL browser Anda, pastikan izin *Notification* disetel ke **Allow**.
  2. Pada perangkat seluler, buka **Pengaturan Perangkat > Aplikasi > TaskFlow > Notifikasi**, lalu aktifkan status izin.
  3. Pastikan fitur *Do Not Disturb* / *Focus Mode* pada perangkat Anda tidak aktif.

### Masalah 2: Data Tidak Sinkron Antar Perangkat
* **Penyebab:** Masalah konektivitas internet atau kegagalan token autentikasi aplikasi.
* **Solusi:**
  1. Periksa apakah perangkat Anda terhubung ke internet.
  2. Lakukan sinkronisasi manual dengan menarik layar ke bawah (*pull-to-refresh*) pada aplikasi mobile, atau tekan `F5` pada web.
  3. Lakukan **Log Out**, bersihkan cache browser/aplikasi, lalu **Log In** kembali.

### Masalah 3: Tugas yang Dihapus Ingin Dikembalikan
* **Penyebab:** Tidak sengaja menekan tombol hapus.
* **Solusi:**
  1. Buka menu **Sidebar**.
  2. Gulir ke bawah dan klik folder **Sampah (Trash)**.
  3. Cari tugas yang dimaksud, klik ikon titik tiga `...`, lalu pilih **Pulihkan (Restore)**.
  > *Catatan: Item di dalam folder Sampah akan dihapus permanen secara otomatis setelah 30 hari.*

### Masalah 4: Aplikasi Mengalami Freeze / Blank Putih
* **Solusi:**
  1. **Web:** Bersihkan cache dan cookies browser Anda (`Ctrl + Shift + Del` / `Cmd + Shift + Del`).
  2. **Mobile:** Masuk ke *Settings > Apps > TaskFlow > Storage > Clear Cache*, kemudian buka ulang aplikasi (*Force Stop* & *Restart*).

---

## 7. Bantuan & Dukungan

Jika masalah Anda tidak tercantum dalam panduan ini, silakan hubungi tim dukungan kami melalui saluran berikut:

* **Email Dukungan:** support@taskflow.io
* **Pusat Bantuan & Komunitas:** [https://community.taskflow.io](https://community.taskflow.io)
* **Layanan Tiket & Live Chat:** Tersedia di menu **Pengaturan > Bantuan** (Senin - Jumat, 09:00 - 17:00 WIB)
```