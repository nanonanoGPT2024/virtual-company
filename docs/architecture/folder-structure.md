# Folder Structure - AI Virtual Company OS

Pondasi folder project yang telah disiapkan di `/mnt/d/explore/company virtual/`:

```
company-virtual/
├── docker-compose.yml       # Konfigurasi PostgreSQL (pgvector) & Qdrant
├── README.md
├── prd.md                   # Product Requirements Document
├── docs/
│   ├── database/
│   │   └── schema.sql       # Skema database lengkap (Companies, Employees, Tasks, dll.)
│   └── architecture/
│       └── folder-structure.md # Dokumentasi struktur ini
└── src/
    ├── backend/             # Source code backend service (API & Logic)
    ├── frontend/            # Dashboard eksekutif & office visualizer (Presentation Layer)
    └── agents/              # Logika orkestrasi AI Agent & integrasi 9Router/OpenClaw
```

## Deskripsi Folder

- **`docs/`**: Berisi seluruh file perancangan, arsitektur, diagram, spesifikasi API, dan database schema.
- **`src/backend/`**: Tempat utama untuk API server, penanganan event bus lokal, task engine, budget auditor, dan interaksi ke PostgreSQL.
- **`src/frontend/`**: Berisi panel admin (web dashboard) untuk owner memantau status karyawan AI, KPI, cashflow, log audit, dan project timeline.
- **`src/agents/`**: Berisi logika runtime untuk masing-masing role (CEO, CTO, CPO, Developer, QA, dll.), manajemen system prompt khusus per role, pembatasan otonomi, dan integrasi API 9Router sebagai AI gateway.
