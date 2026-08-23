# Product Requirements Document (PRD) — v2.1
# AI Virtual Company OS — Autonomous Software & Product Studio

| Attribute | Details |
| :--- | :--- |
| **Product Name** | AI Virtual Company OS |
| **Version** | 2.1 (Floating Chat & Direct 3D Interaction) |
| **Status** | Approved by Owner / In Implementation |
| **Product Type** | AI-Native Autonomous Software & Product Studio OS |
| **Owner / Root** | Human Founder / Owner (Nano) |

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
2. **Floating Message Bubble (Pojok Kanan Bawah):**
   - Komponen floating chat widget melayang di pojok kanan bawah layar (`bottom-6 right-6`).
   - Saat diklik, membuka pop-up drawer percakapan chat modern.
   - **Default Chat:** Terhubung langsung ke **Chief Aura (CEO)** untuk diskusi strategis.
   - Dilengkapi dropdown/selector untuk berpindah ke **Executive War Room** atau 14 agen virtual lainnya.
3. **Direct 3D Agent Click-to-Chat Interaction:**
   - Di tampilan **Virtual Office 3D & 2D**, Owner dapat mengklik meja / karakter agen mana pun.
   - Pop-up quick inspector muncul dengan tombol **"💬 Chat With [Nama Agen]"**.
   - Mengklik tombol tersebut akan langsung membuka Floating Chat Bubble dan mengalihkan percakapan 1-on-1 dengan agen tersebut secara instan.
4. **Project Lifecycle Management — Fitur Hapus Project (Delete Project):**
   - Mendukung penghapusan project secara menyeluruh (hard delete & cleanup) baik dari dashboard UI maupun REST API (`DELETE /api/projects/:id`).
   - **Cakupan Pembersihan Otomatis:**
     * **Database:** Menghapus data project di tabel `projects` beserta semua relasi terkait (`project_documents`, `token_usages`, `tasks`, logs).
     * **Process Management:** Menghentikan dan menghapus instans PM2 yang sedang berjalan (`pm2 delete <pm2_name>`).
     * **Filesystem Cleanup:** Menghapus folder direktori project hasil build di `/projects/{slug}/`.
   - **UI/UX:** Dilengkapi konfirmasi modal peringatan (Confirmation Dialog) sebelum penghapusan dieksekusi agar aman dari ketidaksengajaan.

---

## 2. Organizational Structure & Agent Roles (15 AI Agents + 1 Owner)

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
