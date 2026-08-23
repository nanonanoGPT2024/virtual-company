# Product Requirements Document (PRD) — v2.2
# AI Virtual Company OS — Autonomous Software & Product Studio

| Attribute | Details |
| :--- | :--- |
| **Product Name** | AI Virtual Company OS |
| **Version** | 2.2 (Multi-User Public Access, User-Centric RBAC & Owner Oversight) |
| **Status** | Approved by Owner / In Implementation |
| **Product Type** | AI-Native Autonomous Software & Product Studio OS |
| **Owner / Root** | Human Founder / Root Owner (Nano) |

---

## 1. Executive Summary & Core Objective

**AI Virtual Company OS** adalah platform sistem operasi perusahaan virtual otonom. Platform ini mengorkestrasi agen-agen AI dengan struktur organisasi lengkap untuk memproduksi aplikasi/software nyata secara end-to-end dengan isolasi proyek mandiri (`/projects/{slug}/`).

### Pembaruan UI/UX Navigasi & Komunikasi (v2.1):
1. **Pembersihan Sidebar Navigasi:**
   - Tab "Company Chat" di sidebar samping **dihilangkan**.
   - Sidebar kini ramping dan fokus pada menu utama:
     * 🏢 **Virtual Office 3D**
     * 🚀 **Project Pipeline Hub**
     * 💡 **Idea Radar**
     * ⚡ **Live Activity Stream**
     * 💰 **Financial Analytics**
     * 👥 **User Management Hub (Khusus Owner)**
2. **Floating Message Bubble (Pojok Kanan Bawah):**
   - Komponen floating chat widget melayang di pojok kanan bawah layar (`bottom-6 right-6`).
   - Saat diklik, membuka pop-up drawer percakapan chat modern.
   - **Default Chat:** Terhubung langsung ke **Chief Aura (CEO)** untuk diskusi strategis.
   - Dilengkapi dropdown/selector untuk berpindah ke **Executive War Room** atau 14 agen virtual lainnya.
3. **Direct 3D Agent Click-to-Chat Interaction:**
   - Di tampilan **Virtual Office 3D & 2D**, Owner dapat mengklik meja / karakter agen mana pun.
   - Pop-up quick inspector muncul dengan tombol **"💬 Chat With [Nama Agen]"**.
   - Mengklik tombol tersebut akan langsung membuka Floating Chat Bubble dan mengalihkan percakapan 1-on-1 dengan agen tersebut secara instan.
4. **Project Lifecycle Management — Fitur Hapus Project & ZIP Export:**
   - Mendukung penghapusan project secara menyeluruh (hard delete & cleanup) baik dari dashboard UI maupun REST API (`DELETE /api/projects/:id`).
   - Mendukung ekspor seluruh direktori project (source code `src/` & dokumen `docs/`) ke dalam arsip bundle **`.ZIP`** (`GET /api/projects/:id/download-zip`).
   - Dokumen deliverables resmi tersedia dalam format Microsoft Word (`.docx`) dan Microsoft Excel (`.xlsx`).

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
