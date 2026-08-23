# Architecture & Technical Design: Multi-Tenant Payroll & Operational Task Engine

**Document Version:** 1.0.0  
**Author:** Viktor Cruz (Principal Software Architect)  
**Status:** Approved for Implementation  
**Target Platform:** Node.js/Express (API) + React UI (SPA) + PostgreSQL + Redis  

---

## 1. System Architecture & Tech Stack (Node.js/Express + React UI)

### 1.1 Architecture Pattern & Overview
Sistem mengadopsi pola **Layered Modular Monolith** dengan kesiapan transisi ke *Event-Driven Microservices*. Isolasi tenant menggunakan pendekatan **Shared Database, Shared Schema** dengan penegakan partisi data berbasis kolom `tenant_id` yang divalidasi pada level Gateway Middleware, Data Access Layer (ORM/Query Builder interceptor), serta PostgreSQL *Row Level Security (RLS)*.

```
+-------------------------------------------------------------------------+
|                               React 18 SPA                              |
|           (Vite + TypeScript + TailwindCSS + TanStack Query)           |
+-------------------------------------------------------------------------+
                                    | HTTPS / WSS
                                    v
+-------------------------------------------------------------------------+
|                           Reverse Proxy / NGINX                         |
|             (SSL Termination, Rate Limiting, Compression)               |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                     Node.js / Express API Gateway                       |
|  [Tenant Identification] -> [JWT/RBAC Auth] -> [Validation (Zod)]       |
+-------------------------------------------------------------------------+
         |                          |                           |
         v                          v                           v
+------------------+      +--------------------+      +-------------------+
|  Payroll Engine  |      | Task/To-Do Engine  |      | Employee/HR Module|
| (Calculations,   |      | (State Machine,    |      | (Contracts, Org,  |
|  Tax, BPJS, Runs)|      |  Assignment, Logs) |      |  Bank Accounts)   |
+------------------+      +--------------------+      +-------------------+
         |                          |                           |
         +--------------------------+---------------------------+
                                    |
       +----------------------------+----------------------------+
       |                                                         |
       v                                                         v
+------------------------------------+          +--------------------------------+
|          PostgreSQL 16             |          |         Redis Cluster          |
|  - Multi-Tenant Data (RLS Enabled) |          |  - Distributed Lock (Redlock)  |
|  - JSONB for Dynamic Formulas      |          |  - Session / Cache Layer       |
|  - ACID Transactions for Pay Runs  |          |  - BullMQ Queue (Jobs/Worker)  |
+------------------------------------+          +--------------------------------+
                                                                 |
                                                                 v
                                                +--------------------------------+
                                                |     Async Background Worker    |
                                                |  - Batch Payslip Generation    |
                                                |  - PDF Rendering & S3 Upload   |
                                                |  - Recurring Task Dispatcher   |
                                                +--------------------------------+
```

### 1.2 Tech Stack Specifications

| Layer | Technology | Selection Rationale |
| :--- | :--- | :--- |
| **Frontend Runtime** | React 18 (TypeScript) via Vite | Eksekusi UI cepat, typing statis ketat untuk akurasi data finansial. |
| **State & Data Fetching**| TanStack Query v5 + Zustand | Server-state caching optimal dengan client-state minimalis. |
| **UI Components & CSS** | TailwindCSS + Radix UI Primitives | Aksesibilitas tinggi, headless, kontrol penuh atas layout enterprise. |
| **Backend Runtime** | Node.js v20 LTS (TypeScript) | Non-blocking I/O, ekosistem solid, performa tinggi untuk I/O tasks. |
| **Web Framework** | Express.js v4/v5 | Minimalis, fleksibilitas integrasi middleware multi-tenant custom. |
| **Validation Layer** | Zod | Runtime type safety terintegrasi langsung dengan TypeScript interfaces. |
| **Database & ORM** | PostgreSQL 16 + Prisma/Kysely | Dukungan JSONB fleksibel, transactional integrity, performa indexing tinggi. |
| **In-Memory & Queues**| Redis 7 + BullMQ | Manajemen antrean kalkulasi payroll masif dan pencegahan *race conditions*. |
| **Object Storage** | S3-Compatible Storage (MinIO/AWS) | Penyimpanan dokumen payslip (PDF terenkripsi) dan attachment task. |
| **Observability** | OpenTelemetry + Winston + Prometheus | Distributed tracing, audit log komprehensif, metriks transaksi finansial. |

---

## 2. Database Model & Schema Structure

### 2.1 Entity Relationship Overview
Semua entitas transaksional dan master wajib mereferensikan `tenant_id` dengan foreign key ke tabel `tenants`. Integritas finansial dijamin via tipe data `NUMERIC(15,2)` guna menghindari *floating-point rounding issues*.

```
 [tenants] 1---* [users] 1---1 [employees] 1---* [tasks]
    |               |               |                |
    |               |               +---* [payslips] +---* [task_checklists]
    |               |                       |
    +---* [payroll_runs] 1------------------+
    |
    +---* [salary_components]
```

### 2.2 PostgreSQL Schema Definitions (DDL)

```sql
-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Definitions
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_PAYROLL', 'MANAGER', 'EMPLOYEE');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED');
CREATE TYPE component_type AS ENUM ('ALLOWANCE', 'DEDUCTION', 'BENEFIT');
CREATE TYPE payroll_status AS ENUM ('DRAFT', 'PROCESSING', 'APPROVED', 'COMPLETED', 'FAILED');

-- 1. Tenants Table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    currency VARCHAR(3) DEFAULT 'IDR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'EMPLOYEE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_user_email UNIQUE (tenant_id, email)
);

-- 3. Departments & Positions
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Employees Table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    employee_code VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    national_id VARCHAR(50), -- KTP/SSN
    tax_identification_number VARCHAR(50), -- NPWP
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(100),
    bank_account_holder VARCHAR(255),
    base_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    hire_date DATE NOT NULL,
    resignation_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_employee_code UNIQUE (tenant_id, employee_code)
);

-- 5. Dynamic Salary Components
CREATE TABLE salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type component_type NOT NULL,
    is_taxable BOOLEAN DEFAULT TRUE,
    is_fixed BOOLEAN DEFAULT TRUE,
    default_amount NUMERIC(15, 2) DEFAULT 0.00,
    calculation_formula JSONB DEFAULT NULL, -- Formula engine definition
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Payroll Execution Batches
CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    payment_date DATE NOT NULL,
    status payroll_status DEFAULT 'DRAFT',
    total_gross NUMERIC(15, 2) DEFAULT 0.00,
    total_net NUMERIC(15, 2) DEFAULT 0.00,
    total_tax NUMERIC(15, 2) DEFAULT 0.00,
    processed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Individual Employee Payslips
CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    base_salary NUMERIC(15, 2) NOT NULL,
    total_allowances NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_deductions NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_salary NUMERIC(15, 2) NOT NULL,
    breakdown JSONB NOT NULL, -- Detailed snapshot of all components
    pdf_url VARCHAR(1024),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_run_employee UNIQUE (payroll_run_id, employee_id)
);

-- 8. Tasks Engine (Operational To-Do & Payroll Workflows)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority task_priority DEFAULT 'MEDIUM',
    status task_status DEFAULT 'TODO',
    assignee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    reporter_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    related_entity_type VARCHAR(50), -- e.g., 'PAYROLL_RUN', 'ONBOARDING'
    related_entity_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Task Checklists
CREATE TABLE task_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by UUID REFERENCES employees(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    diff JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indices for Multi-Tenant Query Optimization
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_payroll_runs_tenant_dates ON payroll_runs(tenant_id, period_start, period_end);
CREATE INDEX idx_payslips_payroll_run ON payslips(payroll_run_id);
CREATE INDEX idx_tasks_tenant_assignee_status ON tasks(tenant_id, assignee_id, status);
CREATE INDEX idx_audit_logs_tenant_resource ON audit_logs(tenant_id, resource_type, resource_id);
```

---

## 3. REST API Endpoint Specifications

### 3.1 Authentication & Context
Semua request wajib menyertakan header:
*   `Authorization: Bearer <JWT_TOKEN>` (Kecuali endpoint auth publik)
*   JWT Payload memuat: `user_id`, `tenant_id`, `role`, dan `employee_id`.

---

### 3.2 Authentication Module

#### `POST /api/v1/auth/login`
Autentikasi multi-tenant berbasis identifier atau slug organisasi.

*   **Request Body:**
```json
{
  "tenant_slug": "acme-corp",
  "email": "hr.lead@acme.com",
  "password": "SecurePassword123!"
}
```

*   **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "refresh_token": "def502008b4...",
    "expires_in": 3600,
    "user": {
      "id": "7fa6b78a-cbf4-4f0f-8ef2-7eef2c2c0199",
      "tenant_id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      "tenant_name": "ACME Corporation",
      "email": "hr.lead@acme.com",
      "role": "HR_PAYROLL",
      "employee_id": "2e2a87a2-dc43-4f9e-a890-4c54964e5251"
    }
  }
}
```

---

### 3.3 Task & Workflow Management Module

#### `GET /api/v1/tasks`
Mengambil daftar to-do/tasks dalam lingkup tenant dengan filter terstruktur.

*   **Query Parameters:**  
    `status` (optional): `TODO | IN_PROGRESS | UNDER_REVIEW | COMPLETED`  
    `priority` (optional): `LOW | MEDIUM | HIGH | URGENT`  
    `assignee_id` (optional): UUID  
    `limit` (default: 20), `page` (default: 1)

*   **Response (200 OK):**
```json
{
  "success": true,
  "meta": {
    "page": 1,
    "limit": 20,
    "total_records": 42,
    "total_pages": 3
  },
  "data": [
    {
      "id": "9a1e0eb7-164b-4876-9c48-03823439b1a5",
      "title": "Verifikasi Insentif Tim Sales Periode Oktober",
      "description": "Cross-check data konversi CRM dengan pencapaian KPI individual",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "assignee": {
        "id": "2e2a87a2-dc43-4f9e-a890-4c54964e5251",
        "full_name": "Sarah Connor",
        "employee_code": "EMP-0042"
      },
      "due_date": "2023-10-25T17:00:00.000Z",
      "checklist_summary": {
        "total": 3,
        "completed": 1
      },
      "created_at": "2023-10-20T08:30:00.000Z"
    }
  ]
}
```

#### `POST /api/v1/tasks`
Membuat instansiasi task/to-do baru.

*   **Request Body:**
```json
{
  "title": "Validasi Final PPh 21 Masa Oktober",
  "description": "Lakukan rekonsiliasi SPT Masa Pajak Penghasilan Pasal 21",
  "priority": "URGENT",
  "assignee_id": "2e2a87a2-dc43-4f9e-a890-4c54964e5251",
  "due_date": "2023-10-28T10:00:00.000Z",
  "related_entity_type": "PAYROLL_RUN",
  "related_entity_id": "4020a59a-df6d-4952-ba14-5d51381bb53d",
  "checklists": [
    { "title": "Unduh rekap bukti potong" },
    { "title": "Cocokkan dengan GL Account Pajak" },
    { "title": "Submit Approval ke Finance Director" }
  ]
}
```

*   **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "3c7b3ec5-857c-4a37-b9f1-320d7d6b38c2",
    "tenant_id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    "title": "Validasi Final PPh 21 Masa Oktober",
    "priority": "URGENT",
    "status": "TODO",
    "checklists": [
      {
        "id": "01859c23-74b8-4c12-9c12-efb45781a001",
        "title": "Unduh rekap bukti potong",
        "is_completed": false
      },
      {
        "id": "01859c23-74b8-4c12-9c12-efb45781a002",
        "title": "Cocokkan dengan GL Account Pajak",
        "is_completed": false
      },
      {
        "id": "01859c23-74b8-4c12-9c12-efb45781a003",
        "title": "Submit Approval ke Finance Director",
        "is_completed": false
      }
    ],
    "created_at": "2023-10-21T02:15:00.000Z"
  }
}
```

#### `PATCH /api/v1/tasks/:id/status`
Memperbarui state task dengan validasi transisi alur kerja (*State Machine*).

*   **Request Body:**
```json
{
  "status": "COMPLETED"
}
```

*   **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "3c7b3ec5-857c-4a37-b9f1-320d7d6b38c2",
    "status": "COMPLETED",
    "updated_at": "2023-10-22T04:11:00.000Z"
  }
}
```

---

### 3.4 Payroll Engine Module

#### `POST /api/v1/payroll/runs`
Inisiasi eksekusi batch kalkulasi payroll untuk seluruh karyawan aktif pada periode berjalan.

*   **Request Body:**
```json
{
  "title": "Payroll Reguler Oktober 2023",
  "period_start": "2023-10-01",
  "period_end": "2023-10-31",
  "payment_date": "2023-10-27"
}
```

*   **Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Batch calculation queued successfully.",
  "data": {
    "payroll_run_id": "4020a59a-df6d-4952-ba14-5d51381bb53d",
    "status": "PROCESSING",
    "job_id": "bull:payroll_queue:4020a59a"
  }
}
```

#### `GET /api/v1/payroll/runs/:id`
Mengambil rekapitulasi agregasi run payroll dan status detail kalkulasi.

*   **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "4020a59a-df6d-4952-ba14-5d51381bb53d",
    "title": "Payroll Reguler Oktober 2023",
    "status": "DRAFT",
    "period_start": "2023-10-01",
    "period_end": "2023-10-31",
    "payment_date": "2023-10-27",
    "summary": {
      "total_employees": 128,
      "total_gross": 1450000000.00,
      "total_tax_pph21": 108750000.00,
      "total_deductions": 43500000.00,
      "total_net": 1297750000.00
    },
    "processed_by": "7fa6b78a-cbf4-4f0f-8ef2-7eef2c2c0199",
    "created_at": "2023-10-21T09:00:00.000Z"
  }
}
```

#### `POST /api/v1/payroll/runs/:id/approve`
Finalisasi run payroll. Mengunci modifikasi data dan memicu pembentukan payslip individual serta task pembayaran via Finance.

*   **Request Body:**
```json
{
  "notes": "Approved by CFO after review of overtime records."
}
```

*   **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "4020a59a-df6d-4952-ba14-5d51381bb53d",
    "status": "APPROVED",
    "approved_by": "e1f13b6f-6cfa-4927-9c98-1e4a64ef8139",
    "approved_at": "2023-10-22T11:20:00.000Z"
  }
}
```

#### `GET /api/v1/payslips/:id`
Mengambil detail rincian slip gaji individual.

*   **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "f51b94d1-817b-40fa-a0a1-898031d27931",
    "employee": {
      "full_name": "Sarah Connor",
      "employee_code": "EMP-0042",
      "department": "Engineering",
      "position": "Staff Software Engineer"
    },
    "period": {
      "start": "2023-10-01",
      "end": "2023-10-31"
    },
    "base_salary": 25000000.00,
    "earnings": [
      { "name": "Tunjangan Posisi", "amount": 3000000.00 },
      { "name": "Tunjangan Komunikasi", "amount": 500000.00 }
    ],
    "deductions": [
      { "name": "BPJS Ketenagakerjaan (JHT 2%)", "amount": 500000.00 },
      { "name": "BPJS Kesehatan (1%)", "amount": 250000.00 },
      { "name": "PPh 21 Terutang", "amount": 1875000.00 }
    ],
    "summary": {
      "gross_salary": 28500000.00,
      "total_deductions": 2625000.00,
      "take_home_pay": 25875000.00
    },
    "pdf_download_url": "https://storage.enterprise-payroll.internal/tenants/1b9d.../payslips/202310/EMP-0042.pdf?sig=..."
  }
}
```

---

## 4. Security, Error Handling & Data Flow

### 4.1 Multi-Tenant Data Isolation & Security Architecture

```
[Incoming Request]
        │
        ▼
[Tenant Resolution Middleware] ──(Resolves Tenant via Hostname / JWT Claim)
        │
        ▼
[JWT & RBAC Authorization] ──────(Asserts Permission: e.g., 'PAYROLL_RUN_CREATE')
        │
        ▼
[Prisma / Kysely Middleware] ───(Injects WHERE tenant_id = Context.tenantId)
        │
        ▼
[PostgreSQL Session Level RLS] ──(SET LOCAL app.current_tenant_id = Context.tenantId)
        │
        ▼
[Database Engine Level Filter] ──(SELECT * FROM table WHERE tenant_id = current_tenant_id)
```

1. **Context Injection:**  
   Middleware Express mengekstrak `tenant_id` dari JWT terenkripsi (AES-256-GCM pada refresh cookie, RS256 pada access token). Nilai diikat ke request context menggunakan `AsyncLocalStorage`.
2. **Row-Level Security (Postgres RLS):**  
   Setiap koneksi database menjalankan hook transaksional:
   ```sql
   SET LOCAL app.current_tenant_id = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
   ```
   Kebijakan tabel aktif menjamin data lintas tenant tidak akan bocor meskipun developer melakukan kesalahan agregasi query tanpa `WHERE` eksplisit:
   ```sql
   CREATE POLICY tenant_isolation_policy ON employees
       USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
   ```
3. **Double-Calculation Concurrency Protection:**  
   Kalkulasi batch payroll menggunakan **Distributed Mutex (Redis Redlock)** dengan kunci unik: `lock:payroll:run:<tenant_id>:<period_start>:<period_end>`. Kunci otomatis kadaluarsa setelah TTL 300 detik atau saat proses komputasi selesai.

---

### 4.2 Standardized Error Handling Architecture
Semua kegagalan sistem mengikuti format **RFC 7807 (Problem Details for HTTP APIs)** dengan error code statis.

```typescript
// Express Centralized Error Interceptor Contract
interface RFC7807ProblemDetail {
  type: string;        // URI reference error definition
  title: string;       // Human-readable summary
  status: number;      // HTTP Status Code
  detail: string;      // Detailed explanation
  instance: string;    // Request path
  code: string;        // Machine-readable business code
  invalid_params?: Array<{
    field: string;
    reason: string;
  }>;
  timestamp: string;
}
```

#### Error Response Samples

##### 1. Domain Validation Error (422 Unprocessable Entity)
```json
{
  "type": "https://api.docs.internal/errors/VALIDATION_FAILED",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Data masukan tidak memenuhi parameter validasi.",
  "instance": "/api/v1/employees",
  "code": "ERR_VALIDATION_FAILED",
  "invalid_params": [
    {
      "field": "base_salary",
      "reason": "Nilai gaji pokok harus lebih besar dari 0"
    },
    {
      "field": "national_id",
      "reason": "Format KTP/NIK harus berjumlah 16 digit numerik"
    }
  ],
  "timestamp": "2023-10-21T10:14:02.124Z"
}
```

##### 2. Tenant Isolation Cross-Access Attempt (403 Forbidden)
```json
{
  "type": "https://api.docs.internal/errors/CROSS_TENANT_FORBIDDEN",
  "title": "Access Denied",
  "status": 403,
  "detail": "Aktor tidak memiliki izin mengakses entitas data tenant lain.",
  "instance": "/api/v1/payroll/runs/98711823-3b4e-4bce-9251-1823abce1283",
  "code": "ERR_TENANT_MISMATCH",
  "timestamp": "2023-10-21T10:15:00.512Z"
}
```

---

### 4.3 End-to-End Payroll & Operational Workflow Execution

```
[HR Admin]                  [Node.js API]               [Redis Queue]          [Worker Engine]           [Database]
    │                             │                           │                       │                      │
    │ 1. POST /payroll/runs       │                           │                       │                      │
    ├────────────────────────────>│                           │                       │                      │
    │                             │ 2. Acquire Redis Lock     │                       │                      │
    │                             ├──────────────────────────>│                       │                      │
    │                             │ 3. Create 'DRAFT' Run     │                       │                      │
    │                             ├─────────────────────────────────────────────────────────────────────────>│
    │                             │ 4. Enqueue Calculation   │                       │                      │
    │                             ├──────────────────────────>│                       │                      │
    │ 5. 202 Accepted (Run ID)   │                           │                       │                      │
    │<────────────────────────────┤                           │                       │                      │
    │                             │                           │ 6. Pop Job            │                      │
    │                             │                           ├──────────────────────>│                      │
    │                             │                           │                       │ 7. Bulk Fetch Emp    │
    │                             │                           │                       ├─────────────────────>│
    │                             │                           │                       │ 8. Compute PPh/BPJS  │
    │                             │                           │                       │    & Net Salariess   │
    │                             │                           │                       │ 9. Bulk Upsert Slips │
    │                             │                           │                       ├─────────────────────>│
    │                             │                           │                       │ 10. Create Auto Task │
    │                             │                           │                       │     (Review Slip)    │
    │                             │                           │                       ├─────────────────────>│
    │                             │                           │                       │ 11. Release Lock     │
    │                             │                           ├───────────────────────┤                      │
```

#### Execution Logic Pipeline:
1. **Inisiasi & Locking:** HR memicu API run. API memperoleh distributed mutex pada Redis untuk mencegah multiproses serentak pada periode yang sama.
2. **Kalkulasi Deterministik Asinkron:** Worker mengeksekusi kalkulasi komponen gaji berdasarkan:
   $$\text{Gross Pay} = \text{Base Salary} + \sum \text{Allowances}$$
   $$\text{Taxable Base} = \text{Gross Pay} - \text{Non-Taxable Deductions (BPJS JHT/JP)}$$
   $$\text{Tax PPh 21} = f(\text{Taxable Base}, \text{TER/Progressive Formula})$$
   $$\text{Take Home Pay} = \text{Gross Pay} - \text{Total Deductions} - \text{Tax PPh 21}$$
3. **Automated Task Triggering:** Setelah agregasi payslip selesai, modul task secara otomatis membuat task berkategori `PAYROLL_APPROVAL` yang ditugaskan kepada Financial Controller atau Management Role lengkap dengan daftar periksa validasi (*checklists*).
4. **Audit Immutability:** Setelah payroll disetujui (`APPROVED`), payslip bertransformasi menjadi entitas *read-only* dengan enkripsi hash dokumen SHA-256 yang tersimpan pada audit trail log untuk menjamin akuntabilitas kepatuhan hukum perburuhan dan perpajakan.