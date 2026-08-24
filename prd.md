# Product Requirements Document (PRD) — v2.5
# AI Virtual Company OS — Autonomous Software & Product Studio

| Attribute | Details |
| :--- | :--- |
| **Product Name** | AI Virtual Company OS |
| **Version** | 2.5 (Interactive AI Project Workbench: Live Preview, Source Code Viewer, Contextual PM Chat, & Auto-Reload) |
| **Status** | Approved by Owner / In Implementation |
| **Product Type** | AI-Native Autonomous Software & Product Studio OS |
| **Owner / Root** | Human Founder / Root Owner (Nano) |

---

## 1. Executive Summary & Core Objective

**AI Virtual Company OS** adalah platform sistem operasi perusahaan virtual otonom. Platform ini mengorkestrasi agen-agen AI dengan struktur organisasi lengkap untuk memproduksi aplikasi/software nyata secara end-to-end dengan isolasi proyek mandiri (`/projects/{slug}/`).

### Pembaruan Inti (v2.5 — Interactive AI Project Workbench & Continuous Evolution):
1. **🌐 Live Interactive App Preview (Embedded WebView):**
   - Dalam tampilan detail project, aplikasi yang sedang running di port aktif (contoh: port 5001, 5002) langsung tertanam dalam layar dashboard via embedded container/iframe interaktif.
   - User dapat menguji UI, fungsionalitas tombol, dan input form secara live tanpa harus membuka tab browser terpisah.

2. **💻 Live Source Code Viewer & File Tree:**
   - Navigasi file tree interaktif dari direktori project (`/mnt/d/explore/result_projek/:slug/` atau `projects/:slug/`).
   - User dapat mengklik file (`server.js`, `index.html`, package.json, dll) untuk menginspeksi isi kodingan secara langsung dengan syntax highlighting rapi.

3. **💬 Contextual Project Chat dengan PM (Sarah Jenkins):**
   - Chat box terdedikasi di samping Live Preview khusus untuk membahas perubahan fitur, perbaikan bug, atau penyesuaian styling pada proyek tersebut.
   - PM Agent otomatis membaca konteks file kodingan proyek yang sedang aktif saat merespons arahan user.

4. **⚡ Autonomous In-Place Code Patching & Instant Auto-Reload:**
   - Ketika user memberikan instruksi perubahan (misal: *"Tambahkan tombol export CSV dan ubah warna header"*), agen PM, Architect, dan Devron (Fullstack Dev) langsung memodifikasi source code proyek secara inkremental (*in-place patching*).
   - DevOps (Cipher) me-reload service PM2 pada **port yang sama**.
   - Iframe Live Preview di dashboard **otomatis me-refresh** sehingga hasil perubahan kodingan langsung terlihat secara real-time.

---

## 2. Multi-User Hierarchy & Access Control (v2.4+):

### A. Hirarki Perorangan (User-Centric Architecture)
Sistem menggunakan hirarki berbasis user murni (`1 User Account = Owns Their Own Projects`):
1. 👑 **Root Owner (Bang Nano):**
   - **Master Oversight (God Mode):** Melihat seluruh daftar user publik yang terdaftar beserta seluruh project yang dibuat.
   - **Pipeline & Workbench Inspection:** Dapat membuka, menginspeksi source code, dan melakukan iterasi/chat pada project milik user mana pun.
   - **Infrastructure Control:** Kontrol alokasi port server, PM2 global runtime, dan restart service.
2. 👤 **Client / Pengguna Umum (Client Portal):**
   - **Self-Service Workspace:** Registrasi/Login instan mandiri.
   - **Strict Data Isolation:** Klien hanya dapat melihat, mengelola, chat dengan PM, dan mendownload project milik akunnya sendiri.
   - **Free Unlimited Projects:** Bebas membuat dan mengiterasi project tanpa batasan kuota/kredit.
   - **Zero Visibility:** Klien tidak dapat melihat daftar pengguna lain maupun project milik pengguna lain.

### B. Skema Keamanan & Database Relasi
- **Tabel `users`:** `id`, `name`, `email`, `password_hash`, `role` (`OWNER` | `CLIENT`), `created_at`.
- **Tabel `projects`:** Penambahan relasi `user_id` untuk isolasi hak akses data, serta kolom `version` (default: 'v1.0') dan `last_iteration_summary`.
- **Tabel `project_revisions`:** Menyimpan log histori perubahan, prompt user, summary perubahan kode, dan affected files.
- **Middleware Proteksi (`authMiddleware`):** Validasi token JWT pada seluruh endpoint REST API.

---

## 3. Spesifikasi Arsitektur Layar: "Project Workbench Studio"

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🚀 WORKBENCH: "Kopi Senja POS" (Port: 5001) [v1.0] [Status: LIVE]     [✖ Tutup]        │
├──────────────────────────────────────────────────────┬─────────────────────────────────┤
│ [🌐 Live Preview]   [💻 Source Code]   [📄 Dokumen]  │ 💬 CHAT PROYEK (PM Sarah)       │
├──────────────────────────────────────────────────────┼─────────────────────────────────┤
│                                                      │ Sarah (PM):                     │
│  ┌────────────────────────────────────────────────┐  │ "Halo! Ada penambahan fitur     │
│  │ <iframe src="http://localhost:5001" />         │  │  atau perbaikan bug?"           │
│  │                                                │  │                                 │
│  │ (Menampilkan aplikasi running live)            │  │ User (Bang Nano):               │
│  │                                                │  │ "Tolong tambahkan tombol export │
│  │                                                │  │  CSV dan ganti warna tombol"    │
│  └────────────────────────────────────────────────┘  │                                 │
│  (Jika Tab Source Code dipilih:                      │ Sarah (PM):                     │
│   Kiri: File Tree (server.js, index.html, dll)       │ "Siap! Devron sedang patching   │
│   Kanan: Code Viewer dengan syntax dark theme)       │  file index.html & server.js..."│
│                                                      │                                 │
│  [🔄 Auto-Reloading Preview saat reload selesai]     │ ⚡ Cipher: PM2 port 5001 reloaded│
│                                                      │ ✅ Perubahan selesai diterapkan!│
│                                                      ├─────────────────────────────────┤
│                                                      │ [ Ketik instruksi ke Sarah... ] │
└──────────────────────────────────────────────────────┴─────────────────────────────────┘
```

---

## 4. Spesifikasi REST API Backend

1. **`GET /api/projects/:id/files`**
   - Mengambil struktur file tree dan konten file dari direktori proyek (`repo_path`).
   - Proteksi multi-tenant: hanya owner atau user pemilik proyek yang dapat mengakses.

2. **`GET /api/projects/:id/files/content?filePath=src/backend/server.js`**
   - Membaca konten teks dari file spesifik untuk ditampilkan di Code Viewer.

3. **`POST /api/projects/:id/iterate`**
   - Memproses instruksi perubahan dari user.
   - Payload: `{ prompt: string, iteration_type?: string }`
   - Alur Otonom:
     1. Ingest existing code files.
     2. Call Agent LLM (Sarah PM & Devron) untuk menghasilkan patch code.
     3. Tulis ulang file yang terdampak secara in-place.
     4. Jalankan `pm2 restart <pm2_name>`.
     5. Catat log ke `project_revisions` & `activity_logs`.
     6. Kembalikan summary perubahan dan trigger frontend auto-reload.

4. **`GET /api/projects/:id/revisions`**
   - Mengambil riwayat versi dan changelog iterasi proyek.

---

## 5. Organizational Structure & Agent Roles (15 AI Agents + 1 Owner)

1. **Owner (Nano):** Founder & Root Authority (Human-in-the-loop).
2. **CEO (Chief Aura):** Eksekutif orkestrator & default chat assistant.
3. **CPO (Elena Vance):** Pimpinan produk & roadmap.
4. **Researcher (Dr. Aris):** Riset tren pasar & scanner peluang SaaS.
5. **Product Manager (Sarah Jenkins):** Pembuat PRD & lead contextual project iteration.
6. **UI/UX Designer (Kaelen):** Wireframe spec, design tokens & UI blueprint.
7. **CTO (Marcus Sterling):** Standar teknologi & kualitas rekayasa.
8. **Architect (Viktor Cruz):** Skema database & analisis dampak kode iterasi.
9. **Backend Dev (Devron):** Backend Express REST API & in-place code patcher.
10. **Frontend Dev (Anya):** Dynamic interactive UI & Workbench Studio UI.
11. **DevOps / SRE (Cipher):** Zero-downtime PM2 reloader & port keeper.
12. **SQA Engineer (Tessa):** Regression testing & syntax validation.
13. **Security Auditor (Sentinel):** Zero-vulnerability audit.
14. **CFO (Morgan Drake):** Cost accounting & pricing estimation.
15. **Legal Counsel (Justicia):** Privacy Policy & Terms of Service.
16. **Tech Writer (Page):** User Manual & Changelog documentation.
17. **Marketing & Sales (Vibe & Hunter):** Copy deck & client outreach.
