import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
dotenv.config({ path: '/mnt/d/explore/virtual-company/src/backend/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'company_os',
});

const JWT_SECRET = process.env.JWT_SECRET || 'virtulabs-company-os-secret-2026';
function hashPassword(password: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(password).digest('hex');
}

const RESULT_BASE = '/mnt/d/explore/result_projek';

async function seedCleanRealistic() {
  console.log('--- 1. Reset Database Tables ---');
  await pool.query('DELETE FROM activity_logs').catch(() => {});
  await pool.query('DELETE FROM project_documents').catch(() => {});
  await pool.query('DELETE FROM token_usages').catch(() => {});
  await pool.query('DELETE FROM chat_messages').catch(() => {});
  await pool.query('DELETE FROM ideas').catch(() => {});
  await pool.query('DELETE FROM projects').catch(() => {});
  await pool.query('DELETE FROM users').catch(() => {});

  console.log('--- 2. Seed 3 Key Distinct Users ---');
  const users = [
    {
      id: 'USR-OWNER-001',
      name: 'Nano (Root Owner)',
      email: 'nano@company.os',
      password: hashPassword('owner123'),
      role: 'OWNER'
    },
    {
      id: 'USR-CLIENT-A',
      name: 'Budi Santoso (Client A)',
      email: 'client_a@example.com',
      password: hashPassword('password123'),
      role: 'CLIENT'
    },
    {
      id: 'USR-CLIENT-B',
      name: 'Dr. Siti Rahma (Client B)',
      email: 'client_b@example.com',
      password: hashPassword('password123'),
      role: 'CLIENT'
    }
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [u.id, u.name, u.email, u.password, u.role]
    );
  }

  console.log('--- 3. Create Physical Project A: Kopi Senja (Client A - Port 5001) ---');
  const projADir = path.join(RESULT_BASE, 'kopi-senja-pos-barista');
  const projADocs = path.join(projADir, 'docs');
  const projAFrontend = path.join(projADir, 'src', 'frontend');
  const projABackend = path.join(projADir, 'src', 'backend');

  fs.mkdirSync(projADocs, { recursive: true });
  fs.mkdirSync(projAFrontend, { recursive: true });
  fs.mkdirSync(projABackend, { recursive: true });

  // Project A Docs
  fs.writeFileSync(path.join(projADocs, '01_PRD.md'), `# PRD: Kopi Senja - Smart POS & Barista Ordering System\n\n## 1. Ringkasan Eksekutif\nSistem Point-of-Sale dan manajemen order barista modern untuk kedai kopi spesialisasi.\n\n## 2. Fitur Utama\n- Kasir Cepat & Cetak Struk Bluetooth\n- Manajemen Stok Biji Kopi & Susu\n- Integrasi QRIS & WhatsApp Nota\n- Laporan Omset Harian Barista\n\n## 3. PIC Divisi\n- PM: Sarah Jenkins (EMP-PM)\n- Architect: Viktor Cruz (EMP-ARCH)\n- Developer: Devron (EMP-DEV)\n- QA: Tessa (EMP-QA)`, 'utf8');
  fs.writeFileSync(path.join(projADocs, '01_PRD.docx'), 'DUMMY_DOCX_PRD_CONTENT_KOPI_SENJA', 'utf8');
  fs.writeFileSync(path.join(projADocs, '02_UI_UX.docx'), 'DUMMY_DOCX_UX_CONTENT_KOPI_SENJA', 'utf8');
  fs.writeFileSync(path.join(projADocs, '03_Architecture.docx'), 'DUMMY_DOCX_ARCH_CONTENT_KOPI_SENJA', 'utf8');
  fs.writeFileSync(path.join(projADocs, '04_QA_Test_Report.docx'), 'DUMMY_DOCX_QA_CONTENT_KOPI_SENJA', 'utf8');
  fs.writeFileSync(path.join(projADocs, 'SIT_UAT_Test_Matrix.xlsx'), 'DUMMY_XLSX_MATRIX_KOPI_SENJA', 'utf8');

  // Project A Frontend (Warm Amber Coffee Theme)
  const projAIndexHtml = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kopi Senja - Smart POS & Barista Ordering</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #120b05; }
    .glassmorphism { background: rgba(30, 18, 10, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(217, 119, 6, 0.3); }
  </style>
</head>
<body class="text-amber-50 min-h-screen flex flex-col antialiased">
  <header class="glassmorphism sticky top-0 z-40 px-6 py-4 border-b border-amber-900/50 flex justify-between items-center">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-white font-black shadow-lg shadow-amber-600/30">
        ☕
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-base font-bold text-amber-100 leading-tight">Kopi Senja POS</h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            BARISTA LIVE
          </span>
        </div>
        <p class="text-xs text-amber-400/80">Smart Ordering & Inventory System &bull; Budi Santoso</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <div class="bg-amber-950/80 px-3 py-1.5 rounded-lg border border-amber-800/60 text-right">
        <span class="text-[10px] text-amber-400 font-mono block">OUTLET PORT</span>
        <span class="text-xs font-mono font-bold text-amber-300">5001</span>
      </div>
    </div>
  </header>

  <main class="max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 flex-1 flex flex-col gap-6">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="glassmorphism p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-amber-300">Total Cup Terjual</span>
          <h3 id="statCup" class="text-2xl font-extrabold text-white mt-0.5">142</h3>
        </div>
        <div class="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl">☕</div>
      </div>
      <div class="glassmorphism p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-amber-300">Stok Espresso Bean</span>
          <h3 class="text-2xl font-extrabold text-amber-400 mt-0.5">4.8 kg</h3>
        </div>
        <div class="w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center text-xl">📦</div>
      </div>
      <div class="glassmorphism p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-amber-300">Omset Kasir Hari Ini</span>
          <h3 class="text-2xl font-extrabold text-emerald-400 mt-0.5">Rp 3.550.000</h3>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl">💰</div>
      </div>
    </div>

    <!-- Active Menu List -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="glassmorphism p-5 rounded-2xl md:col-span-1 shadow-xl">
        <h2 class="text-sm font-bold text-amber-200 mb-3 flex items-center gap-2">
          <i data-lucide="plus-circle" class="w-4 h-4 text-amber-400"></i>
          <span>Order Baru Barista</span>
        </h2>
        <form id="orderForm" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-amber-300 mb-1">Nama Minuman / Order</label>
            <input type="text" id="menuName" placeholder="Contoh: Senja Aren Latte Ice" required class="w-full bg-amber-950/60 border border-amber-800/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-amber-300 mb-1">Catatan Kustomisasi</label>
            <input type="text" id="menuNotes" placeholder="Less sugar, oat milk..." class="w-full bg-amber-950/60 border border-amber-800/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
          </div>
          <button type="submit" class="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg shadow-amber-600/30">
            + Tambah Order Kasir
          </button>
        </form>
      </div>

      <div class="glassmorphism p-5 rounded-2xl md:col-span-2 shadow-xl flex flex-col">
        <h2 class="text-sm font-bold text-amber-200 mb-4 flex items-center gap-2">
          <i data-lucide="coffee" class="w-4 h-4 text-amber-400"></i>
          <span>Antrean Pesanan Barista Real-time</span>
        </h2>
        <div id="ordersContainer" class="space-y-2.5 flex-1">
          <div class="p-3 bg-amber-950/80 border border-amber-800/70 rounded-xl flex justify-between items-center">
            <div>
              <p class="text-sm font-bold text-amber-100">☕ Kopi Susu Senja Gula Aren</p>
              <p class="text-xs text-amber-400/70">Dine-in &bull; Normal Ice &bull; Rp 25.000</p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">Sedang Diseduh</span>
          </div>
          <div class="p-3 bg-amber-950/80 border border-amber-800/70 rounded-xl flex justify-between items-center">
            <div>
              <p class="text-sm font-bold text-amber-100">🍵 Matcha Espresso Fusion</p>
              <p class="text-xs text-amber-400/70">Takeaway &bull; Oat Milk &bull; Rp 32.000</p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">Siap Pick-up</span>
          </div>
        </div>
      </div>
    </div>
  </main>
  <script>lucide.createIcons();</script>
</body>
</html>`;
  fs.writeFileSync(path.join(projAFrontend, 'index.html'), projAIndexHtml, 'utf8');

  // Project A Backend (server.js port 5001)
  const projABackendJs = `const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

let orders = [
  { id: 1, item: 'Kopi Susu Senja Gula Aren', price: 25000, status: 'BREWING', created_at: new Date().toISOString() },
  { id: 2, item: 'Matcha Espresso Fusion', price: 32000, status: 'READY', created_at: new Date().toISOString() }
];

app.get('/health', (req, res) => res.json({ status: 'OK', outlet: 'Kopi Senja POS', port: PORT }));
app.get('/api/items', (req, res) => res.json({ success: true, data: orders }));
app.post('/api/items', (req, res) => {
  const newOrder = { id: orders.length + 1, item: req.body.title || 'Pesanan Kopi', price: 25000, status: 'BREWING', created_at: new Date().toISOString() };
  orders.push(newOrder);
  res.status(201).json({ success: true, data: newOrder });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.listen(PORT, '0.0.0.0', () => console.log('[Kopi Senja POS] running at http://localhost:' + PORT));
`;
  fs.writeFileSync(path.join(projABackend, 'server.js'), projABackendJs, 'utf8');
  fs.writeFileSync(path.join(projABackend, 'package.json'), JSON.stringify({ name: 'kopi-senja-pos-backend', version: '1.0.0', main: 'server.js', dependencies: { express: '^4.19.2', cors: '^2.8.5' } }, null, 2));
  fs.writeFileSync(path.join(projADir, 'ecosystem.config.js'), `module.exports = { apps: [{ name: "proj-kopi-senja-pos-barista", script: "server.js", cwd: "${projABackend}", env: { PORT: 5001, NODE_ENV: "production" } }] };`, 'utf8');

  console.log('--- 4. Create Physical Project B: MedikaCare (Client B - Port 5002) ---');
  const projBDir = path.join(RESULT_BASE, 'medikacare-rekam-medis-antrean');
  const projBDocs = path.join(projBDir, 'docs');
  const projBFrontend = path.join(projBDir, 'src', 'frontend');
  const projBBackend = path.join(projBDir, 'src', 'backend');

  fs.mkdirSync(projBDocs, { recursive: true });
  fs.mkdirSync(projBFrontend, { recursive: true });
  fs.mkdirSync(projBBackend, { recursive: true });

  // Project B Docs
  fs.writeFileSync(path.join(projBDocs, '01_PRD.md'), `# PRD: MedikaCare - Rekam Medis & Antrean Poliklinik Digital\n\n## 1. Ringkasan Eksekutif\nPlatform Sistem Informasi Manajemen Rumah Sakit & Klinik (SIMRS) terintegrasi SATUSEHAT Kemenkes.\n\n## 2. Fitur Utama\n- Electronic Medical Record (EMR / RME Standar ICD-10)\n- Antrean Dokter & Display Layar Poli Real-time\n- Farmasi Digital & E-Prescription\n- Billing Kasir Pasien BPJS / Mandiri\n\n## 3. PIC Divisi\n- Lead PM: Elena Vance (EMP-CPO)\n- Security Auditor: Sentinel (EMP-SEC)\n- Tech Lead: Viktor Cruz (EMP-ARCH)\n- QA Lead: Tessa (EMP-QA)`, 'utf8');
  fs.writeFileSync(path.join(projBDocs, '01_PRD.docx'), 'DUMMY_DOCX_PRD_CONTENT_MEDIKACARE', 'utf8');
  fs.writeFileSync(path.join(projBDocs, '02_UI_UX.docx'), 'DUMMY_DOCX_UX_CONTENT_MEDIKACARE', 'utf8');
  fs.writeFileSync(path.join(projBDocs, '03_Architecture.docx'), 'DUMMY_DOCX_ARCH_CONTENT_MEDIKACARE', 'utf8');
  fs.writeFileSync(path.join(projBDocs, '04_QA_Test_Report.docx'), 'DUMMY_DOCX_QA_CONTENT_MEDIKACARE', 'utf8');
  fs.writeFileSync(path.join(projBDocs, 'SIT_UAT_Test_Matrix.xlsx'), 'DUMMY_XLSX_MATRIX_MEDIKACARE', 'utf8');

  // Project B Frontend (Hospital Emerald Theme)
  const projBIndexHtml = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MedikaCare - Rekam Medis & Antrean Klinik Digital</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #031514; }
    .glassmorphism { background: rgba(6, 30, 28, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(16, 185, 129, 0.3); }
  </style>
</head>
<body class="text-emerald-50 min-h-screen flex flex-col antialiased">
  <header class="glassmorphism sticky top-0 z-40 px-6 py-4 border-b border-emerald-900/60 flex justify-between items-center">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-600/30">
        🏥
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-base font-bold text-emerald-100 leading-tight">MedikaCare SIMRS</h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            KLINIK ONLINE
          </span>
        </div>
        <p class="text-xs text-emerald-400/80">Electronic Medical Record & Polyclinic Queue &bull; Dr. Siti Rahma</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <div class="bg-emerald-950/90 px-3 py-1.5 rounded-lg border border-emerald-800/70 text-right">
        <span class="text-[10px] text-emerald-400 font-mono block">KLINIK PORT</span>
        <span class="text-xs font-mono font-bold text-teal-300">5002</span>
      </div>
    </div>
  </header>

  <main class="max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 flex-1 flex flex-col gap-6">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="glassmorphism p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-emerald-300">Pasien Terdaftar Hari Ini</span>
          <h3 class="text-2xl font-extrabold text-white mt-0.5">86 Pasien</h3>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl">👥</div>
      </div>
      <div class="glassmorphism p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-emerald-300">Antrean Poli Umum & Gigi</span>
          <h3 class="text-2xl font-extrabold text-amber-400 mt-0.5">14 Menunggu</h3>
        </div>
        <div class="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl">⏳</div>
      </div>
      <div class="glassmorphism p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-emerald-300">Resep Terlayani (Farmasi)</span>
          <h3 class="text-2xl font-extrabold text-teal-300 mt-0.5">72 Resep</h3>
        </div>
        <div class="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-xl">💊</div>
      </div>
    </div>

    <!-- Patient Queue Table -->
    <div class="glassmorphism p-5 rounded-2xl shadow-xl flex flex-col">
      <h2 class="text-sm font-bold text-emerald-200 mb-4 flex items-center gap-2">
        <i data-lucide="activity" class="w-4 h-4 text-emerald-400"></i>
        <span>Live Antrean & Rekam Medis Elektronik Pasien</span>
      </h2>
      <div class="space-y-3">
        <div class="p-3.5 bg-emerald-950/80 border border-emerald-800/70 rounded-xl flex justify-between items-center">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">A-024</span>
              <h3 class="text-sm font-bold text-white">Tn. Hendra Gunawan (45 Th)</h3>
            </div>
            <p class="text-xs text-emerald-400/80 mt-1">Diagnosa: Hipertensi Primer (ICD-10 I10) &bull; Poli Penyakit Dalam &bull; Dokter: dr. Siti Sp.PD</p>
          </div>
          <span class="text-xs px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">Di Ruang Dokter</span>
        </div>
        <div class="p-3.5 bg-emerald-950/80 border border-emerald-800/70 rounded-xl flex justify-between items-center">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">A-025</span>
              <h3 class="text-sm font-bold text-white">Ny. Dewi Sartika (32 Th)</h3>
            </div>
            <p class="text-xs text-emerald-400/80 mt-1">Keluhan: ISPA Akut & Demam 3 Hari &bull; Poli Umum &bull; Tensi: 110/80</p>
          </div>
          <span class="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">Antrean Berikutnya</span>
        </div>
      </div>
    </div>
  </main>
  <script>lucide.createIcons();</script>
</body>
</html>`;
  fs.writeFileSync(path.join(projBFrontend, 'index.html'), projBIndexHtml, 'utf8');

  // Project B Backend (server.js port 5002)
  const projBBackendJs = `const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

let patients = [
  { id: 1, name: 'Tn. Hendra Gunawan', poly: 'Poli Penyakit Dalam', status: 'IN_CONSULTATION', created_at: new Date().toISOString() },
  { id: 2, name: 'Ny. Dewi Sartika', poly: 'Poli Umum', status: 'WAITING', created_at: new Date().toISOString() }
];

app.get('/health', (req, res) => res.json({ status: 'OK', system: 'MedikaCare SIMRS', port: PORT }));
app.get('/api/items', (req, res) => res.json({ success: true, data: patients }));
app.post('/api/items', (req, res) => {
  const newPatient = { id: patients.length + 1, name: req.body.title || 'Pasien Baru', poly: 'Poli Umum', status: 'WAITING', created_at: new Date().toISOString() };
  patients.push(newPatient);
  res.status(201).json({ success: true, data: newPatient });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.listen(PORT, '0.0.0.0', () => console.log('[MedikaCare SIMRS] running at http://localhost:' + PORT));
`;
  fs.writeFileSync(path.join(projBBackend, 'server.js'), projBBackendJs, 'utf8');
  fs.writeFileSync(path.join(projBBackend, 'package.json'), JSON.stringify({ name: 'medikacare-simrs-backend', version: '1.0.0', main: 'server.js', dependencies: { express: '^4.19.2', cors: '^2.8.5' } }, null, 2));
  fs.writeFileSync(path.join(projBDir, 'ecosystem.config.js'), `module.exports = { apps: [{ name: "proj-medikacare-rekam-medis-antrean", script: "server.js", cwd: "${projBBackend}", env: { PORT: 5002, NODE_ENV: "production" } }] };`, 'utf8');

  console.log('--- 5. Seed Project Records in DB ---');
  // Insert DB Projects
  await pool.query(
    `INSERT INTO projects (id, company_id, user_id, title, slug, description, goal, port, status, current_stage, progress_percentage, pm2_name, live_url, repo_path, total_token_cost_usd)
     VALUES 
     ('PROJ-BUDI-01', 'COMP-001', 'USR-CLIENT-A', 'Kopi Senja - Smart POS & Barista Ordering System', 'kopi-senja-pos-barista', 'Point-of-Sale kasir cafe modern dengan pelacakan inventaris bahan baku real-time dan laporan laba-rugi otomatis.', 'Otomasi transaksi kasir cafe dan stok kopi secara terpadu.', 5001, 'DEPLOYED', 'Live Deployed', 100, 'proj-kopi-senja-pos-barista', 'http://localhost:5001', '${projADir}', '0.0384'),
     ('PROJ-SITI-01', 'COMP-001', 'USR-CLIENT-B', 'MedikaCare - Rekam Medis & Antrean Poliklinik Digital', 'medikacare-rekam-medis-antrean', 'Platform Sistem Informasi Manajemen Rumah Sakit & Klinik (SIMRS) terintegrasi rekam medis digital ICD-10 dan antrean pasien.', 'Digitalisasi rekam medis dan antrean poli klinik kesehatan.', 5002, 'DEPLOYED', 'Live Deployed', 100, 'proj-medikacare-rekam-medis-antrean', 'http://localhost:5002', '${projBDir}', '0.0412')`
  );

  // Insert Project Documents
  await pool.query(
    `INSERT INTO project_documents (project_id, doc_type, title, content, author_agent_id, file_path)
     VALUES 
     ('PROJ-BUDI-01', 'PRD', '01_PRD.md', 'Dokumen PRD Kopi Senja POS', 'EMP-PM', 'docs/01_PRD.md'),
     ('PROJ-BUDI-01', 'ARCHITECTURE', '03_Architecture_API.md', 'Arsitektur Kopi Senja POS Port 5001', 'EMP-ARCH', 'docs/03_Architecture_API.md'),
     ('PROJ-SITI-01', 'PRD', '01_PRD.md', 'Dokumen PRD MedikaCare SIMRS', 'EMP-PM', 'docs/01_PRD.md'),
     ('PROJ-SITI-01', 'ARCHITECTURE', '03_Architecture_API.md', 'Arsitektur MedikaCare SIMRS Port 5002', 'EMP-ARCH', 'docs/03_Architecture_API.md')`
  );

  // Insert Activity Logs
  await pool.query(
    `INSERT INTO activity_logs (action_type, summary, agent_id, department_id, project_id, details)
     VALUES 
     ('WRITE_SPEC', 'Sarah (PM) merilis 01_PRD.md untuk Kopi Senja POS', 'EMP-PM', 'DEP-PROD', 'PROJ-BUDI-01', '{"role":"CLIENT_A"}'),
     ('CODE_GEN', 'Devron (Dev) menyelesaikan Express Server Kopi Senja di Port 5001', 'EMP-DEV', 'DEP-ENG', 'PROJ-BUDI-01', '{"role":"CLIENT_A"}'),
     ('WRITE_SPEC', 'Elena (CPO) merancang modul Rekam Medis ICD-10 MedikaCare', 'EMP-CPO', 'DEP-PROD', 'PROJ-SITI-01', '{"role":"CLIENT_B"}'),
     ('DEPLOY', 'Cipher (DevOps) mendeploy MedikaCare SIMRS ke Port 5002', 'EMP-OPS', 'DEP-ENG', 'PROJ-SITI-01', '{"role":"CLIENT_B"}')`
  );

  // Insert Ideas
  await pool.query(
    `INSERT INTO ideas (user_id, title, problem_statement, target_audience, proposed_solution, market_potential_score, estimated_revenue_usd, estimated_dev_time_mins)
     VALUES 
     ('USR-CLIENT-A', 'Coffee Subscription & QR Voucher Bot', 'Pelanggan cafe langganan ingin sistem paket langganan 30 cup hemat bulanan.', 'Penikmat Kopi Harian', 'Bot langganan kopi otomatis integrasi QRIS dan WhatsApp pengingat.', 94, 8000, 5),
     ('USR-CLIENT-B', 'Telemedisin & AI Diagnosa Awal Puskesmas', 'Antrean dokter spesialis di daerah sangat padat.', 'Pasien Rawat Jalan & Klinik', 'Modul triage awal cerdas berbasis gejala dan rujukan otomatis.', 91, 15000, 5)`
  );

  console.log('--- 6. Launch PM2 for Project A & Project B ---');
  await execPromise(`cd "${projABackend}" && npm install --silent 2>/dev/null || true`);
  await execPromise(`cd "${projBBackend}" && npm install --silent 2>/dev/null || true`);
  await execPromise(`pm2 start "${path.join(projADir, 'ecosystem.config.js')}"`);
  await execPromise(`pm2 start "${path.join(projBDir, 'ecosystem.config.js')}"`);

  console.log('🎉 REALISTIC SEEDING & DEPLOYMENT COMPLETED 100%!');
  process.exit(0);
}

seedCleanRealistic().catch(err => {
  console.error('Seed Error:', err);
  process.exit(1);
});
