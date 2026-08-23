# Product Requirements Document (PRD) — v2.4
# AI Virtual Company OS — Autonomous Software & Product Studio

| Attribute | Details |
| :--- | :--- |
| **Product Name** | AI Virtual Company OS |
| **Version** | 2.4 (Enterprise Multi-Tenant Data Isolation & Clean Sandbox Architecture) |
| **Status** | Approved by Owner / Fully Implemented & QA Verified |
| **Product Type** | AI-Native Autonomous Software & Product Studio OS |
| **Owner / Root** | Human Founder / Root Owner (Nano) |

---

## 1. Executive Summary & Core Objective

**AI Virtual Company OS** adalah platform sistem operasi perusahaan virtual otonom. Platform ini mengorkestrasi agen-agen AI dengan struktur organisasi lengkap untuk memproduksi aplikasi/software nyata secara end-to-end dengan isolasi proyek mandiri (`/projects/{slug}/`).

### Standar Isolasi Multi-Tenant Mutlak (v2.4 - Zero Cross-Tenant Leakage):
1. **🚀 Project Pipeline Data Isolation:**
   - Client hanya melihat project miliknya sendiri. Jika belum login atau token invalid, endpoint `GET /api/projects` memblokir akses (HTTP 401) dan tidak membocorkan data global.
   - Root Owner memiliki tampilan **Master Directory** dan dapat mengklik `[🔍 Lihat Pipeline]` pada user tertentu untuk memfilter tampilan pipeline khusus user tersebut secara akurat.
2. **⚡ Live Activity Stream Scoping:**
   - Log aktivitas agen AI (`/api/activities`) difilter secara ketat berdasarkan `project_id` yang dimiliki oleh `user_id` pembuatnya. Client A tidak akan melihat pergerakan agen dari project Client B.
3. **💡 Idea Radar Private Scans:**
   - Setiap scan ide baru (`POST /api/ideas/scan`) terikat pada `user_id` akun pembuatnya.
4. **🛡️ Full-Screen Strict Auth Shield:**
   - Sistem menghilangkan seluruh auto-login / hardcoded token.
   - Pengguna baru wajib login / register melalui modal glassmorphic sebelum aplikasi merender tampilan workspace.

---

## 2. Multi-User Hierarchy & Access Control (v2.4):

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
