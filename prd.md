# Product Requirements Document (PRD) — v2.6
# AI Virtual Company OS — Autonomous Software & Product Studio

| Attribute | Details |
| :--- | :--- |
| **Product Name** | AI Virtual Company OS |
| **Version** | 2.6 (Interactive AI Project Workbench, Database GUI Viewer, Multi-Tenant Security Guards, & Formal Client Sign-Off Approval Gate) |
| **Status** | Approved by Owner / In Implementation |
| **Product Type** | AI-Native Autonomous Software & Product Studio OS |
| **Owner / Root** | Human Founder / Root Owner (Nano) |

---

## 1. Executive Summary & Core Objective

**AI Virtual Company OS** adalah platform sistem operasi perusahaan virtual otonom. Platform ini mengorkestrasi agen-agen AI dengan struktur organisasi lengkap untuk memproduksi aplikasi/software nyata secara end-to-end dengan isolasi proyek mandiri (`/projects/{slug}/`).

### Pembaruan Inti (v2.6 — Security Multi-Tenant Guards, Database GUI, & Milestone Approval Gate):
1. **🛡️ Strict Multi-Tenant Security & Owner Read-Only Inspection Mode:**
   - Seluruh endpoint API (`GET /:id`, `GET /:id/download-file`, `GET /:id/download-zip`, `DELETE /:id`, `POST /:id/tunnel/*`, `POST /:id/iterate`) dilindungi autentikasi token JWT dan validasi kepemilikan tenant yang ketat.
   - Owner (Bang Nano) saat menginspeksi proyek milik Klien berada dalam **Read-Only Inspection Mode** (dilarang memodifikasi kode untuk menjaga integritas data klien).
   - Penanganan cleanup proses background SSH Tunnel (anti-zombie process) dan alokasi port dinamis anti-collision.

2. **🗄️ Interactive Database GUI Viewer di Workbench Studio:**
   - Tab khusus `[🗄️ Database Data]` di dalam Project Workbench Studio.
   - Menampilkan data tabel CRUD live (SQLite/JSON/In-Memory) lengkap dengan dropdown tabel, jumlah baris/kolom, dan tombol live reload.

3. **✍️ Formal Client Sign-Off & Milestone Approval Gate:**
   - Opsi mode persetujuan saat pembuatan proyek (`requireApproval`).
   - Pipeline otomatis jeda pada tahap `WAITING_APPROVAL` setelah PRD & Spesifikasi terbit.
   - Klien dapat mereview dan menekan tombol `[✅ Setujui & Mulai Koding]` atau `[✏️ Minta Revisi Spec]`.

4. **🌐 Live Interactive App Preview, Source Code Viewer, & Autonomous Code Patching:**
   - Embedded live webview iframe dengan auto-reload instan saat iterasi kode selesai.
   - Dark code viewer dengan file tree explorer.
   - Contextual PM Chat dengan Sarah Jenkins.

---

## 2. Multi-User Hierarchy & Access Control (v2.6):

### A. Hirarki Perorangan (User-Centric Architecture)
Sistem menggunakan hirarki berbasis user murni (`1 User Account = Owns Their Own Projects`):
1. 👑 **Root Owner (Bang Nano):**
   - **Master Oversight:** Melihat seluruh daftar user publik yang terdaftar beserta seluruh project yang dibuat.
   - **Read-Only Inspection:** Dapat membuka, menginspeksi Live Preview, Database GUI, Source Code, dan mendownload dokumen proyek milik siapa pun. Dibatasi dari pengubahan sepihak kode klien.
   - **Infrastructure Control:** Kontrol alokasi port server, PM2 global runtime, dan restart service.
2. 👤 **Client / Pengguna Umum (Client Portal):**
   - **Self-Service Workspace:** Registrasi/Login instan mandiri.
   - **Strict Data Isolation:** Klien hanya dapat melihat, mengelola, chat dengan PM, dan mendownload project milik akunnya sendiri.
   - **Full Iteration & Sign-Off:** Memiliki hak penuh melakukan iterasi kodingan dan menyetujui milestone spesifikasi proyeknya.

### B. Skema Keamanan & Database Relasi
- **Tabel `users`:** `id`, `name`, `email`, `password_hash`, `role` (`OWNER` | `CLIENT`), `created_at`.
- **Tabel `projects`:** Penambahan relasi `user_id`, `version`, `last_iteration_summary`, `approval_required` (boolean), dan `approval_status` (`NONE` | `PENDING` | `APPROVED`).
- **Tabel `project_revisions`:** Menyimpan log histori perubahan, prompt user, summary perubahan kode, dan affected files.
- **Middleware Proteksi (`authenticateUser`):** Validasi token JWT pada seluruh endpoint REST API.

---

## 3. Spesifikasi Arsitektur Layar: "Project Workbench Studio"

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🚀 WORKBENCH: "Kopi Senja POS" (Port: 5001) [v1.0] [Status: LIVE]     [✖ Tutup]        │
├──────────────────────────────────────────────────────┬─────────────────────────────────┤
│ [🌐 Live Preview] [💻 Source Code] [🗄️ Database GUI] │ 💬 CHAT PROYEK (PM Sarah)       │
│ [📄 Dokumen Rilis] [🕒 Riwayat Revisi]               │                                 │
├──────────────────────────────────────────────────────┼─────────────────────────────────┤
│                                                      │ Sarah (PM):                     │
│  ┌────────────────────────────────────────────────┐  │ "Halo! Ada penambahan fitur     │
│  │ <iframe src="http://localhost:5001" />         │  │  atau perbaikan bug?"           │
│  │                                                │  │                                 │
│  │ (Menampilkan aplikasi running live)            │  │ User (Klien):                   │
│  │                                                │  │ "Tolong tambahkan tombol export │
│  │                                                │  │  CSV dan ganti warna tombol"    │
│  └────────────────────────────────────────────────┘  │                                 │
│  (Jika Tab Database GUI dipilih:                     │ Sarah (PM):                     │
│   Kiri: Daftar Tabel [orders (3), items (12)]        │ "Siap! Devron sedang patching   │
│   Kanan: Grid Tabel Data Interaktif dengan Reload)   │  file index.html & server.js..."│
│                                                      │                                 │
│  [🔄 Auto-Reloading Preview saat reload selesai]     │ ⚡ Cipher: PM2 port 5001 reloaded│
│                                                      │ ✅ Perubahan selesai diterapkan!│
│                                                      ├─────────────────────────────────┤
│                                                      │ [ Ketik instruksi ke Sarah... ] │
└──────────────────────────────────────────────────────┴─────────────────────────────────┘
```

---

## 4. Spesifikasi REST API Backend (v2.6)

1. **`GET /api/projects/:id/files`**
   - Mengambil struktur file tree dan konten file dari direktori proyek (`repo_path`).

2. **`GET /api/projects/:id/files/content?filePath=...`**
   - Membaca konten teks dari file spesifik untuk ditampilkan di Code Viewer.

3. **`GET /api/projects/:id/database`**
   - Membaca dan mengekstrak tabel data dan baris record proyek untuk Database GUI.

4. **`POST /api/projects/:id/approve`**
   - Formal milestone sign-off oleh klien untuk melanjutkan proyek ke fase koding.

5. **`POST /api/projects/:id/request-spec-revision`**
   - Mengirim masukan revisi PRD/spesifikasi sebelum koding dimulai.

6. **`POST /api/projects/:id/iterate`**
   - Autonomous in-place code patching & PM2 reload (Khusus pemilik proyek).

7. **`GET /api/projects/:id/revisions`**
   - Mengambil riwayat versi dan changelog iterasi proyek.

---

## 5. Organizational Structure & Agent Roles (15 AI Agents + 1 Owner)

1. **Owner (Nano):** Founder & Root Authority (Human-in-the-loop).
2. **CEO (Chief Aura):** Eksekutif orkestrator & default chat assistant.
3. **CPO (Elena Vance):** Pimpinan produk & roadmap.
4. **Researcher (Dr. Aris):** Riset tren pasar & scanner peluang SaaS.
5. **Product Manager (Sarah Jenkins):** Pembuat PRD & lead contextual project iteration & milestone sign-off.
6. **UI/UX Designer (Kaelen):** Wireframe spec, design tokens & UI blueprint.
7. **CTO (Marcus Sterling):** Standar teknologi & kualitas rekayasa.
8. **Architect (Viktor Cruz):** Skema database & analisis dampak kode iterasi.
9. **Backend Dev (Devron):** Backend Express REST API & in-place code patcher.
10. **Frontend Dev (Anya):** Dynamic interactive UI & Workbench Studio UI.
11. **DevOps / SRE (Cipher):** Zero-downtime PM2 reloader & dynamic port allocator.
12. **SQA Engineer (Tessa):** Regression testing & syntax validation.
13. **Security Auditor (Sentinel):** Zero-vulnerability audit & multi-tenant isolation guard.
14. **CFO (Morgan Drake):** Cost accounting & pricing estimation.
15. **Legal Counsel (Justicia):** Privacy Policy & Terms of Service.
16. **Tech Writer (Page):** User Manual & Changelog documentation.
17. **Marketing & Sales (Vibe & Hunter):** Copy deck & client outreach.

