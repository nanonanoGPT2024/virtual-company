# Product Requirements Document (PRD) — v2.3
# AI Virtual Company OS — Autonomous Software & Product Studio

| Attribute | Details |
| :--- | :--- |
| **Product Name** | AI Virtual Company OS |
| **Version** | 2.3 (One-Click Public Tunnel, AI Spec Enrichment & Autonomous Alerts) |
| **Status** | Approved by Owner / Fully Implemented |
| **Product Type** | AI-Native Autonomous Software & Product Studio OS |
| **Owner / Root** | Human Founder / Root Owner (Nano) |

---

## 1. Executive Summary & Core Objective

**AI Virtual Company OS** adalah platform sistem operasi perusahaan virtual otonom. Platform ini mengorkestrasi agen-agen AI dengan struktur organisasi lengkap untuk memproduksi aplikasi/software nyata secara end-to-end dengan isolasi proyek mandiri (`/projects/{slug}/`).

### Pembaruan Fitur & UX Terkini (v2.3):
1. **⚡ One-Click Instant Public Tunnel per Project:**
   - Menyediakan tombol *Share Public Link* / *Buka Tunnel Publik* langsung di kartu project dan pipeline.
   - Endpoint `POST /api/projects/:id/tunnel/start` & `stop` memfasilitasi pembuatan link HTTPS publik instan via reverse tunnel background (`*.lhr.life`).
   - Klien maupun Owner dapat membagikan link live demo aplikasi yang baru selesai di-deploy ke pihak eksternal tanpa konfigurasi port forwarding manual.
2. **🧠 Interactive PRD Auto-Enrichment & Spec Builder:**
   - Tombol *✨ Auto-Enrich AI Spec* pada modal pembuatan project baru.
   - Menggunakan LLM latensi rendah (`ag/gemini-3.7-flash-low`) via endpoint `POST /api/projects/enrich-spec` untuk secara instan menyusun:
     * Nama aplikasi & ringkasan arsitektur profesional.
     * Pilihan tema warna UI rekomendasi.
     * Skema database awal (tabel & relasi field).
     * Modul & fitur kunci yang bisa dicentang langsung oleh pengguna sebelum pipeline dimulai.
3. **🔔 Autonomous Stage Audio & Smart Toast Notification:**
   - Sintesis audio bawaan (*Web Audio API*) menghasilkan soft chime berfrekuensi ganda (D5/A5) saat pengerjaan berpindah divisi (PRD $\to$ Koding $\to$ QA $\to$ Deploy).
   - Smart Toast Notification di sudut layar menyajikan update real-time progress agen.
   - Dilengkapi toggle *🔔 Sound: ON/OFF* di header atas yang tersimpan di `localStorage`.

---

## 2. Multi-User Hierarchy & Access Control (v2.2):

### A. Hirarki Perorangan (User-Centric Architecture)
Sistem menggunakan hirarki berbasis user murni (`1 User Account = Owns Their Own Projects`):
1. 👑 **Root Owner (Bang Nano):**
   - **Master Oversight (God Mode):** Melihat seluruh daftar user publik yang terdaftar beserta seluruh project yang dibuat.
   - **Pipeline Inspection:** Dapat membuka dan menginspeksi alur pengerjaan pipeline, dokumen Word/Excel, dan source code ZIP dari project milik user mana pun.
   - **Infrastructure Control:** Kontrol alokasi port server, PM2 global runtime, dan restart service.
2. 👤 **Client / Pengguna Umum (Client Portal):**
   - **Self-Service Workspace:** Registrasi/Login instan mandiri.
   - **Strict Data Isolation:** Klien hanya dapat melihat, mengelola, dan mendownload project milik akunnya sendiri.
   - **Free Unlimited Projects:** Bebas membuat project tanpa batasan kuota/kredit.
   - **Zero Visibility:** Klien tidak dapat melihat daftar pengguna lain maupun project milik pengguna lain.

### B. Skema Keamanan & Database Relasi
- **Tabel `users`:** `id`, `name`, `email`, `password_hash`, `role` (`OWNER` | `CLIENT`), `created_at`.
- **Tabel `projects`:** Penambahan relasi `user_id` untuk isolasi hak akses data.
- **Middleware Proteksi (`authMiddleware`):** Validasi token JWT pada seluruh endpoint REST API.

---

## 3. Organizational Structure & Agent Roles (15 AI Agents + 1 Owner)

1. **Owner (Nano):** Founder & Root Authority (Human-in-the-loop).
2. **CEO (Chief Aura):** Eksekutif orkestrator & default chat assistant.
3. **CPO (Elena Vance):** Pimpinan produk & roadmap.
4. **Researcher (Dr. Aris):** Riset tren pasar & scanner peluang SaaS.
5. **Product Manager (Sarah Jenkins):** Pembuat `01_PRD.md` & user stories.
6. **UI/UX Designer (Kaelen):** Wireframe spec, design tokens & UI blueprint (`02_UI_UX_Design_System.md`).
7. **CTO (Marcus Sterling):** Standar teknologi & kualitas rekayasa.
8. **Architect (Viktor Cruz):** Skema database & kontrak REST API (`03_Architecture_API.md`).
9. **Backend Dev (Devron):** Backend Express REST API, persistence & business logic.
10. **Frontend Dev (Anya):** Dynamic interactive UI, Tailwind CSS, Lucide icons, glassmorphic layout & rich dashboard generator.
11. **DevOps / SRE (Cipher):** Scaffolding boilerplate & auto-deploy PM2.
12. **SQA Engineer (Tessa):** Test suite automation & UI/UX Acceptance Verification (`04_QA_Test_Report.md`).
13. **Security Auditor (Sentinel):** Zero-vulnerability audit (`05_Security_Audit.md`).
14. **CFO (Morgan Drake):** Cost accounting & pricing estimation.
15. **Legal Counsel (Justicia):** Privacy Policy & Terms of Service (`06_Privacy_Terms.md`).
16. **Tech Writer (Page):** User Manual & Onboarding docs (`07_User_Manual.md`).
17. **Marketing & Sales (Vibe & Hunter):** Copy deck & client outreach (`08_Sales_Pitch_Clients.md`).

---

## 3. UI Layout & Floating Chat Specifications

```
┌────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR MENU         │  MAIN WORKSPACE VIEW                           │
│  - Virtual Office 3D  │  (3D Canvas / Pipeline Hub / Live Feed)        │
│  - Project Pipeline   │                                                │
│  - Idea Radar         │                                                │
│  - Activity Stream    │                                                │
│  - Finance Analytics  │                                                │
│                       │                                                │
│                       │                       ┌──────────────────────┐ │
│                       │                       │ 💬 Floating Chat     │ │
│                       │                       │  Drawer (CEO / Agent)│ │
│                       │                       │                      │ │
│                       │                       └──────────────────────┘ │
│                       │                       ┌─────────┐              │
│                       │                       │ 🔘 [💬] │ (Bottom-Right│
└───────────────────────┴───────────────────────┴─────────┴──────────────┘
```
