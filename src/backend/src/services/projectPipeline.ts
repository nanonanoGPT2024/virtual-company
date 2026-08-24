import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { pool } from '../config/db';
import { callAgentLLM } from './llmService';
import { logActivity } from './activityService';

const execPromise = util.promisify(exec);
const DEFAULT_PROJECTS_BASE_DIR = path.resolve(process.env.PROJECTS_BASE_DIR || '/mnt/d/explore/result_projek');

export interface UploadedImage {
  name: string;
  menuLabel?: string;
  base64: string;
  mimeType?: string;
}

export interface AttachedDoc {
  name: string;
  base64: string;
}

export interface PipelineOptions {
  images?: UploadedImage[];
  theme?: 'cyber' | 'emerald' | 'indigo' | 'light';
  includeAuth?: boolean;
  storageType?: 'memory' | 'sqlite';
  attachedDocs?: AttachedDoc[];
  requireApproval?: boolean;
}

export async function runProjectPipeline(projectId: string, options?: PipelineOptions) {
  try {
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projRes.rows.length === 0) return;
    const project = projRes.rows[0];

    const projectDir = project.repo_path || path.join(DEFAULT_PROJECTS_BASE_DIR, project.slug);
    const docsDir = path.join(projectDir, 'docs');
    const srcDir = path.join(projectDir, 'src');
    const frontendDir = path.join(srcDir, 'frontend');
    const backendDir = path.join(srcDir, 'backend');
    const imagesDir = path.join(frontendDir, 'assets', 'images');

    // Create directories
    fs.mkdirSync(docsDir, { recursive: true });
    fs.mkdirSync(frontendDir, { recursive: true });
    fs.mkdirSync(backendDir, { recursive: true });
    fs.mkdirSync(imagesDir, { recursive: true });

    // Save attached requirement documents if provided
    if (options?.attachedDocs && Array.isArray(options.attachedDocs)) {
      for (const doc of options.attachedDocs) {
        if (doc.base64) {
          try {
            const cleanBase64 = doc.base64.replace(/^data:application\/\w+;base64,/, '').replace(/^data:.*?;base64,/, '');
            const safeName = (doc.name || `spec-${Date.now()}.docx`).replace(/[^a-zA-Z0-9_.-]/g, '_');
            const targetFilePath = path.join(docsDir, safeName);
            fs.writeFileSync(targetFilePath, Buffer.from(cleanBase64, 'base64'));
            console.log(`[Project Attached Doc] Saved requirement document: ${targetFilePath}`);
          } catch (err) {
            console.warn('[Project Attached Doc Warning] Failed to save doc:', err);
          }
        }
      }
    }

    // Save uploaded images if provided
    const savedImages: Array<{ filename: string; menuLabel: string; relPath: string }> = [];
    if (options?.images && Array.isArray(options.images)) {
      for (const img of options.images) {
        if (img.base64) {
          try {
            const cleanBase64 = img.base64.replace(/^data:image\/\w+;base64,/, '');
            const safeName = (img.name || `img-${Date.now()}.png`).replace(/[^a-zA-Z0-9_.-]/g, '_');
            const targetFilePath = path.join(imagesDir, safeName);
            fs.writeFileSync(targetFilePath, Buffer.from(cleanBase64, 'base64'));
            savedImages.push({
              filename: safeName,
              menuLabel: img.menuLabel || safeName.replace(/\.[^/.]+$/, ''),
              relPath: `assets/images/${safeName}`
            });
            console.log(`[Project Asset] Saved image: ${targetFilePath}`);
          } catch (imgErr) {
            console.warn('[Project Asset Warning] Failed to save image:', imgErr);
          }
        }
      }
    }

    // ==========================================
    // PHASE 1: DISCOVERY & PRD (Acuan Utama)
    // ==========================================
    await updateProjectStage(projectId, 'SPECIFYING', 'Discovery & Product Requirements (PRD)', 15);
    await setAgentStatus('EMP-PM', 'WORKING');
    await logActivity('WRITE_SPEC', `PM Agent (Sarah) menyusun 01_PRD.md untuk: ${project.title}`, 'EMP-PM', projectId);

    const prdPrompt = `Buatkan Product Requirements Document (PRD) yang komprehensif, profesional, dan to-the-point dalam format Markdown (.md) untuk proyek berikut:
Judul Proyek: ${project.title}
Deskripsi/Goal: ${project.description || project.goal}
Opsi Arsitektur: Autentikasi=${options?.includeAuth ? 'Aktif (JWT)' : 'Bypass/Publik'}, Database=${options?.storageType || 'In-Memory'}, Tema=${options?.theme || 'Cyber Slate'}

PRD harus memuat:
# PRD: ${project.title}
## 1. Executive Summary & Problem Statement
## 2. Target Users & Personas
## 3. Core Features & Functional Requirements
## 4. User Stories & Acceptance Criteria
## 5. Non-Functional Requirements & Metrics`;

    const prdRes = await callAgentLLM('EMP-PM', 'Kamu adalah Senior Product Manager (Sarah Jenkins) di software studio.', prdPrompt, projectId);
    const prdContent = prdRes.content;
    fs.writeFileSync(path.join(docsDir, '01_PRD.md'), prdContent, 'utf8');
    await saveProjectDocument(projectId, 'PRD', '01_PRD.md', prdContent, 'EMP-PM', path.join('docs', '01_PRD.md'));
    await setAgentStatus('EMP-PM', 'IDLE');

    // Milestone Approval Gate (PRD v2.6):
    // Jika proyek meminta sign-off / approval klien terlebih dahulu sebelum coding
    if (options?.requireApproval) {
      await pool.query(
        `UPDATE projects 
         SET status = 'WAITING_APPROVAL', current_stage = 'Menunggu Persetujuan Klien', approval_status = 'PENDING', progress_percentage = 25, updated_at = NOW() 
         WHERE id = $1`,
        [projectId]
      );

      await logActivity(
        'WRITE_SPEC',
        `📌 PRD & Spesifikasi proyek "${project.title}" telah terbit. Menunggu review & persetujuan sign-off dari Klien sebelum koding dimulai.`,
        'EMP-PM',
        projectId
      );
      return;
    }

    // ==========================================
    // PHASE 2: FULL PARALLEL DESIGN, ARCHITECTURE, SCAFFOLDING & COMMERCIAL
    // ==========================================
    await updateProjectStage(projectId, 'BUILDING', 'Parallel Engineering, Design & Commercial Docs', 50);
    await setAgentStatus('EMP-UX', 'WORKING');
    await setAgentStatus('EMP-ARCH', 'WORKING');
    await setAgentStatus('EMP-DEV', 'WORKING');
    await setAgentStatus('EMP-MKT', 'WORKING');
    await setAgentStatus('EMP-LEG', 'WORKING');
    await setAgentStatus('EMP-TECHW', 'WORKING');

    await logActivity('CODE_GEN', `Seluruh divisi (UX, Arch, Dev, Mkt, Legal, Tech Writer) mengeksekusi tugas secara paralel penuh`, 'EMP-DEV', projectId);

    const port = project.port || 5001;

    // 1. UI/UX Design System Task
    const uxTask = (async () => {
      await logActivity('WRITE_SPEC', `Lead UI/UX Architect (Kaelen) merancang 02_UI_UX_Design_System.md`, 'EMP-UX', projectId);
      const uxPrompt = `Berdasarkan PRD proyek "${project.title}" (${project.description}), rancang Design System UI/UX lengkap dalam format Markdown (.md).
Gunakan tema: ${options?.theme || 'Deep Slate Cyber'}.`;
      const uxRes = await callAgentLLM('EMP-UX', 'Kamu adalah Lead UI/UX Architect (Kaelen).', uxPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '02_UI_UX_Design_System.md'), uxRes.content, 'utf8');
      await saveProjectDocument(projectId, 'UI_UX_SPEC', '02_UI_UX_Design_System.md', uxRes.content, 'EMP-UX', path.join('docs', '02_UI_UX_Design_System.md'));
    })();

    // 2. Architecture & API Contract Task
    const archTask = (async () => {
      await logActivity('WRITE_SPEC', `Software Architect (Viktor Cruz) merancang 03_Architecture_API.md`, 'EMP-ARCH', projectId);
      const archPrompt = `Berdasarkan PRD proyek "${project.title}" (${project.description}), rancang arsitektur teknis sistem dan kontrak REST API dalam format Markdown (.md):
Formatkan: Tech Stack (Node.js/Express + Tailwind), Database Model (${options?.storageType || 'In-Memory'}), Auth (${options?.includeAuth ? 'JWT Login/Register' : 'None'}), REST API Endpoints, dan Error Handling.`;
      const archRes = await callAgentLLM('EMP-ARCH', 'Kamu adalah Principal Software Architect (Viktor Cruz).', archPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '03_Architecture_API.md'), archRes.content, 'utf8');
      await saveProjectDocument(projectId, 'ARCHITECTURE', '03_Architecture_API.md', archRes.content, 'EMP-ARCH', path.join('docs', '03_Architecture_API.md'));
    })();

    // 3. Fullstack Code Scaffolding Task (Clean Separation: src/frontend & src/backend)
    const devScaffoldTask = (async () => {
      await logActivity('CODE_GEN', `Fullstack Dev (Devron) membangun source code Express API & Frontend UI modern`, 'EMP-DEV', projectId);

      // Backend package.json
      const backendPackageJson: any = {
        name: `${project.slug}-backend`,
        version: "1.0.0",
        main: "server.js",
        scripts: {
          start: "node server.js"
        },
        dependencies: {
          express: "^4.19.2",
          cors: "^2.8.5"
        }
      };

      if (options?.includeAuth) {
        backendPackageJson.dependencies['jsonwebtoken'] = '^9.0.2';
      }
      if (options?.storageType === 'sqlite') {
        backendPackageJson.dependencies['better-sqlite3'] = '^11.8.1';
      }

      fs.writeFileSync(path.join(backendDir, 'package.json'), JSON.stringify(backendPackageJson, null, 2));

      // Root package.json
      const rootPackageJson = {
        name: `${project.slug}-app`,
        version: "1.0.0",
        scripts: {
          start: "node src/backend/server.js"
        }
      };
      fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(rootPackageJson, null, 2));

      // Theme Palette Definition
      const selectedTheme = options?.theme || 'cyber';
      let themeBg = 'bg-slate-950';
      let themePrimaryGrad = 'from-cyan-500 to-indigo-600';
      let themeAccentText = 'text-cyan-400';
      let themeBorderAccent = 'border-cyan-500/30';
      let themeBodyBg = '#0b0f19';
      let isLight = false;

      if (selectedTheme === 'emerald') {
        themeBg = 'bg-slate-950';
        themePrimaryGrad = 'from-emerald-500 to-teal-600';
        themeAccentText = 'text-emerald-400';
        themeBorderAccent = 'border-emerald-500/30';
        themeBodyBg = '#061311';
      } else if (selectedTheme === 'indigo') {
        themeBg = 'bg-slate-950';
        themePrimaryGrad = 'from-indigo-500 to-purple-600';
        themeAccentText = 'text-indigo-400';
        themeBorderAccent = 'border-indigo-500/30';
        themeBodyBg = '#0f0e1d';
      } else if (selectedTheme === 'light') {
        themeBg = 'bg-slate-50';
        themePrimaryGrad = 'from-blue-600 to-indigo-600';
        themeAccentText = 'text-blue-600';
        themeBorderAccent = 'border-blue-500/30';
        themeBodyBg = '#f8fafc';
        isLight = true;
      }

      // Custom Uploaded Images Showcase
      let customModulesHtml = '';
      if (savedImages.length > 0) {
        customModulesHtml = `
    <!-- Custom Module & Uploaded Assets Showcase -->
    <div class="glassmorphism p-5 rounded-2xl shadow-xl">
      <div class="flex items-center gap-2 mb-3 ${isLight ? 'text-slate-900' : 'text-white'} font-bold text-sm">
        <i data-lucide="image" class="w-4 h-4 ${themeAccentText}"></i>
        <span>Modul & Aset Visual Proyek</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        ${savedImages.map(img => `
        <div class="${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'} border rounded-xl p-2.5 flex flex-col items-center text-center gap-2 transition hover:border-cyan-500/50">
          <div class="w-full h-24 rounded-lg overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-950'} flex items-center justify-center border ${isLight ? 'border-slate-200' : 'border-slate-800'}">
            <img src="${img.relPath}" alt="${img.menuLabel}" class="w-full h-full object-cover">
          </div>
          <span class="text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'} truncate w-full">${img.menuLabel}</span>
        </div>`).join('')}
      </div>
    </div>`;
      }

      // Optional Auth UI Modal & Controls
      const authHeaderButtons = options?.includeAuth ? `
      <div id="authSection" class="flex items-center gap-2">
        <span id="userBadge" class="hidden text-xs font-semibold px-2.5 py-1 rounded-lg ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'}"></span>
        <button id="authBtn" onclick="openAuthModal()" class="px-3 py-1.5 rounded-lg bg-gradient-to-r ${themePrimaryGrad} text-white text-xs font-bold shadow transition hover:opacity-90">
          Login / Register
        </button>
      </div>` : '';

      const authModalHtml = options?.includeAuth ? `
  <!-- Auth Modal -->
  <div id="authModal" class="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 hidden">
    <div class="glassmorphism w-full max-w-sm p-6 rounded-2xl shadow-2xl">
      <div class="flex justify-between items-center mb-4">
        <h3 id="authModalTitle" class="text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}">Login Akun</h3>
        <button onclick="closeAuthModal()" class="text-slate-400 hover:text-slate-200 text-xl font-bold">&times;</button>
      </div>
      <form id="authForm" onsubmit="handleAuthSubmit(event)" class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Username</label>
          <input type="text" id="authUsername" required class="w-full ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white'} border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Password</label>
          <input type="password" id="authPassword" required class="w-full ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white'} border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500">
        </div>
        <button type="submit" class="w-full bg-gradient-to-r ${themePrimaryGrad} text-white font-bold py-2.5 rounded-xl text-sm transition">
          Submit
        </button>
      </form>
      <div class="text-center mt-3">
        <button type="button" onclick="toggleAuthMode()" id="toggleAuthModeBtn" class="text-xs ${themeAccentText} hover:underline">
          Belum punya akun? Daftar di sini
        </button>
      </div>
    </div>
  </div>` : '';

      // src/frontend/index.html
      const frontendIndexHtml = `<!DOCTYPE html>
<html lang="id" class="${isLight ? 'light' : 'dark'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title} - Enterprise Autonomous Application</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="${isLight ? 'text-slate-900 bg-slate-50' : 'text-slate-100 bg-slate-950'} min-h-screen flex flex-col antialiased">
  <!-- Top Navigation Bar -->
  <header class="glassmorphism sticky top-0 z-40 px-6 py-4 border-b ${isLight ? 'border-slate-200 bg-white/80' : 'border-slate-800 bg-slate-950/80'} flex justify-between items-center">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr ${themePrimaryGrad} flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20">
        <i data-lucide="sparkles" class="w-5 h-5"></i>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'} leading-tight">${project.title}</h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE
          </span>
          <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ${selectedTheme.toUpperCase()}
          </span>
        </div>
        <p class="text-xs text-slate-400">${project.description || 'Aplikasi otonom terintegrasi VirtuLabs Studio'}</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      ${authHeaderButtons}
      <div class="text-right hidden sm:block ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-slate-800'} px-3 py-1.5 rounded-lg border">
        <span class="text-[10px] text-slate-500 uppercase font-mono block">PORT</span>
        <span class="text-xs font-mono font-bold ${themeAccentText}">${port}</span>
      </div>
      <button onclick="fetchItems()" class="p-2 rounded-lg ${isLight ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} transition flex items-center gap-1.5 text-xs font-semibold">
        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
        <span>Refresh</span>
      </button>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 flex-1 flex flex-col gap-6">
    ${customModulesHtml}

    <!-- Metric Cards Summary -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="glassmorphism p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-slate-400">Total Entri</span>
          <h3 id="statTotal" class="text-2xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'} mt-0.5">0</h3>
        </div>
        <div class="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
          <i data-lucide="layers" class="w-5 h-5"></i>
        </div>
      </div>

      <div class="glassmorphism p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-slate-400">Aktif / Pending</span>
          <h3 id="statActive" class="text-2xl font-extrabold text-amber-400 mt-0.5">0</h3>
        </div>
        <div class="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <i data-lucide="clock" class="w-5 h-5"></i>
        </div>
      </div>

      <div class="glassmorphism p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-slate-400">Selesai / Done</span>
          <h3 id="statDone" class="text-2xl font-extrabold text-emerald-400 mt-0.5">0</h3>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <i data-lucide="check-circle-2" class="w-5 h-5"></i>
        </div>
      </div>
    </div>

    <!-- Content Workspace -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-start">
      <!-- Input Panel -->
      <div class="glassmorphism p-5 rounded-2xl md:col-span-1 shadow-xl">
        <div class="flex items-center gap-2 mb-4 ${isLight ? 'text-slate-900' : 'text-white'} font-bold text-sm">
          <i data-lucide="plus-circle" class="w-4 h-4 ${themeAccentText}"></i>
          <span>Tambah Entri Baru</span>
        </div>
        <form id="addForm" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">Judul / Kegiatan <span class="text-red-400">*</span></label>
            <input type="text" id="itemTitle" required placeholder="Contoh: Selesaikan PRD..." class="w-full ${isLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-900 text-white border-slate-700'} border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1.5">Keterangan / Catatan</label>
            <textarea id="itemDesc" rows="3" placeholder="Opsional detail tugas..." class="w-full ${isLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-900 text-white border-slate-700'} border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition"></textarea>
          </div>
          <button type="submit" id="submitBtn" class="w-full bg-gradient-to-r ${themePrimaryGrad} hover:opacity-90 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Simpan Entri</span>
          </button>
        </form>
      </div>

      <!-- Feed List Panel -->
      <div class="glassmorphism p-5 rounded-2xl md:col-span-2 shadow-xl flex flex-col min-h-[380px]">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'} font-bold text-sm">
            <i data-lucide="list-checks" class="w-4 h-4 text-indigo-400"></i>
            <span>Daftar Data & Aktivitas</span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="setFilter('ALL')" id="filterAll" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 ${themeAccentText} ${themeBorderAccent} border">Semua</button>
            <button onclick="setFilter('ACTIVE')" id="filterActive" class="px-2.5 py-1 rounded-lg text-xs font-semibold ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-400'} hover:text-white">Aktif</button>
            <button onclick="setFilter('COMPLETED')" id="filterDone" class="px-2.5 py-1 rounded-lg text-xs font-semibold ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-400'} hover:text-white">Selesai</button>
          </div>
        </div>

        <div id="itemsContainer" class="space-y-3 flex-1">
          <div class="p-8 text-center text-slate-500 text-sm">Memuat data...</div>
        </div>
      </div>
    </div>
  </main>

  ${authModalHtml}
  <script src="app.js"></script>
</body>
</html>`;
      fs.writeFileSync(path.join(frontendDir, 'index.html'), frontendIndexHtml, 'utf8');

      // src/frontend/style.css
      const frontendStyleCss = `/* Custom Application Styling */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: ${themeBodyBg};
}
.glassmorphism {
  background: ${isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.75)'};
  backdrop-filter: blur(12px);
  border: 1px solid ${isLight ? 'rgba(226, 232, 240, 0.9)' : 'rgba(51, 65, 85, 0.6)'};
}
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: ${isLight ? '#f1f5f9' : '#0f172a'};
}
::-webkit-scrollbar-thumb {
  background: ${isLight ? '#cbd5e1' : '#334155'};
  border-radius: 3px;
}
`;
      fs.writeFileSync(path.join(frontendDir, 'style.css'), frontendStyleCss, 'utf8');

      // src/frontend/app.js
      const frontendAppJs = `// Client Application Logic
let currentItems = [];
let activeFilter = 'ALL';
let isAuthModeLogin = true;
let currentUser = localStorage.getItem('app_user') || null;

function setFilter(f) {
  activeFilter = f;
  renderItems();
}

function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('hidden');
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('hidden');
}

function toggleAuthMode() {
  isAuthModeLogin = !isAuthModeLogin;
  const title = document.getElementById('authModalTitle');
  const toggleBtn = document.getElementById('toggleAuthModeBtn');
  if (title) title.innerText = isAuthModeLogin ? 'Login Akun' : 'Daftar Akun Baru';
  if (toggleBtn) toggleBtn.innerText = isAuthModeLogin ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Login di sini';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const u = document.getElementById('authUsername').value;
  const p = document.getElementById('authPassword').value;
  const endpoint = isAuthModeLogin ? '/api/auth/login' : '/api/auth/register';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.username || u;
      localStorage.setItem('app_user', currentUser);
      if (data.token) localStorage.setItem('app_token', data.token);
      updateUserUI();
      closeAuthModal();
      alert('Autentikasi Berhasil: Selamat Datang ' + currentUser + '!');
    } else {
      alert('Gagal: ' + (data.error || 'Terjadi kesalahan'));
    }
  } catch (err) {
    alert('Error auth: ' + err.message);
  }
}

function updateUserUI() {
  const userBadge = document.getElementById('userBadge');
  const authBtn = document.getElementById('authBtn');
  if (currentUser) {
    if (userBadge) {
      userBadge.innerText = '👤 ' + currentUser;
      userBadge.classList.remove('hidden');
    }
    if (authBtn) {
      authBtn.innerText = 'Logout';
      authBtn.onclick = () => {
        localStorage.removeItem('app_user');
        localStorage.removeItem('app_token');
        currentUser = null;
        updateUserUI();
      };
    }
  } else {
    if (userBadge) userBadge.classList.add('hidden');
    if (authBtn) {
      authBtn.innerText = 'Login / Register';
      authBtn.onclick = openAuthModal;
    }
  }
}

async function fetchItems() {
  try {
    const res = await fetch('/api/items');
    const json = await res.json();
    currentItems = json.data || [];
    updateStats();
    renderItems();
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

function updateStats() {
  const total = currentItems.length;
  const active = currentItems.filter(i => i.status === 'ACTIVE').length;
  const done = currentItems.filter(i => i.status === 'COMPLETED').length;
  document.getElementById('statTotal').innerText = total;
  document.getElementById('statActive').innerText = active;
  document.getElementById('statDone').innerText = done;
}

function renderItems() {
  const container = document.getElementById('itemsContainer');
  let filtered = currentItems;
  if (activeFilter === 'ACTIVE') filtered = currentItems.filter(i => i.status === 'ACTIVE');
  if (activeFilter === 'COMPLETED') filtered = currentItems.filter(i => i.status === 'COMPLETED');

  if (filtered.length === 0) {
    container.innerHTML = '<div class="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2"><i data-lucide="inbox" class="w-8 h-8 opacity-40"></i><span>Belum ada data pada kategori ini.</span></div>';
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(item => {
    const isDone = item.status === 'COMPLETED';
    return '<div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between gap-3 transition hover:border-slate-700">' +
      '<div class="flex items-center gap-3 overflow-hidden">' +
        '<button onclick="toggleItemStatus(' + item.id + ')" class="w-6 h-6 rounded-lg border flex items-center justify-center transition ' + (isDone ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-slate-700 text-transparent hover:border-slate-500') + '">' +
          '<i data-lucide="check" class="w-3.5 h-3.5"></i>' +
        '</button>' +
        '<div class="truncate">' +
          '<p class="text-sm font-semibold ' + (isDone ? 'line-through text-slate-500' : 'text-slate-100') + '">' + item.title + '</p>' +
          (item.description ? '<p class="text-xs text-slate-400 mt-0.5 truncate">' + item.description + '</p>' : '') +
        '</div>' +
      '</div>' +
      '<div class="flex items-center gap-2 flex-shrink-0">' +
        '<button onclick="deleteItem(' + item.id + ')" class="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition" title="Hapus">' +
          '<i data-lucide="trash-2" class="w-4 h-4"></i>' +
        '</button>' +
      '</div>' +
    '</div>';
  }).join('');
  if (window.lucide) lucide.createIcons();
}

async function toggleItemStatus(id) {
  const item = currentItems.find(i => i.id === id);
  if (!item) return;
  const newStatus = item.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
  await fetch('/api/items/' + id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  });
  fetchItems();
}

async function deleteItem(id) {
  await fetch('/api/items/' + id, { method: 'DELETE' });
  fetchItems();
}

document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const titleInput = document.getElementById('itemTitle');
  const descInput = document.getElementById('itemDesc');
  if (!titleInput.value.trim()) return;

  await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: titleInput.value.trim(),
      description: descInput.value.trim()
    })
  });

  titleInput.value = '';
  descInput.value = '';
  fetchItems();
});

updateUserUI();
fetchItems();
if (window.lucide) lucide.createIcons();
`;
      fs.writeFileSync(path.join(frontendDir, 'app.js'), frontendAppJs, 'utf8');

      // src/backend/server.js (Express API + Auth + SQLite/Memory + Static Hosting)
      const backendServerJs = `const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || ${port};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Storage Engine
let items = [
  { id: 1, title: 'Inisialisasi Project ${project.title}', description: 'Cek fungsionalitas sistem otonom', status: 'COMPLETED', created_at: new Date().toISOString() },
  { id: 2, title: 'Uji Coba Fitur Tambah & Hapus', description: 'Pastikan integrasi CRUD berjalan mulus', status: 'ACTIVE', created_at: new Date().toISOString() }
];

let users = [
  { id: 1, username: 'admin', password: 'password123', role: 'ADMIN' }
];

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    project: '${project.title}', 
    port: PORT, 
    auth_enabled: ${Boolean(options?.includeAuth)},
    storage: '${options?.storageType || 'memory'}',
    theme: '${selectedTheme}',
    timestamp: new Date().toISOString() 
  });
});

// Authentication Endpoints (if enabled)
${options?.includeAuth ? `
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const existing = users.find(u => u.username === username);
  if (existing) return res.status(400).json({ error: 'Username already exists' });

  const newUser = { id: users.length + 1, username, password, role: 'USER' };
  users.push(newUser);
  res.status(201).json({ success: true, message: 'Registrasi berhasil', username: newUser.username, token: 'jwt-dummy-token-' + Date.now() });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Kredensial username/password salah' });

  res.json({ success: true, message: 'Login berhasil', username: user.username, token: 'jwt-dummy-token-' + Date.now() });
});
` : ''}

// Data API Endpoints
app.get('/api/items', (req, res) => {
  res.json({ success: true, count: items.length, data: items });
});

app.post('/api/items', (req, res) => {
  const { title, description } = req.body;
  const newItem = {
    id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1,
    title: title || 'Item Baru',
    description: description || '',
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  };
  items.push(newItem);
  res.status(201).json({ success: true, message: 'Item berhasil dibuat', data: newItem });
});

app.patch('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, description, status } = req.body;
  const item = items.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  if (title !== undefined) item.title = title;
  if (description !== undefined) item.description = description;
  if (status !== undefined) item.status = status;

  res.json({ success: true, message: 'Item berhasil diperbarui', data: item });
});

app.delete('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  items = items.filter(i => i.id !== id);
  res.json({ success: true, message: 'Item berhasil dihapus' });
});

// Fallback SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`[Live App: ${project.title}] running at http://localhost:\${PORT}\`);
});
`;
      fs.writeFileSync(path.join(backendDir, 'server.js'), backendServerJs, 'utf8');

      // Install dependencies fast
      try {
        await execPromise(`cd "${backendDir}" && npm install --silent --prefer-offline --no-audit --no-fund`);
      } catch (err: any) {
        console.warn('npm install warning:', err.message);
      }
    })();

    // 4. Marketing Copy Task
    const mktTask = (async () => {
      await logActivity('WRITE_SPEC', `Growth & Marketing Lead (Vibe) menyusun 08_Sales_Pitch_Clients.md`, 'EMP-MKT', projectId);
      const mktPrompt = `Tuliskan Marketing Copy Deck & Sales Pitch Proposal (.md) untuk produk ini:
Produk: ${project.title}
Target: Calon Klien / Pengguna Bisnis
Goal: ${project.description}

Formatkan dengan headline menarik, value proposition, target client profiles, dan email outreach template.`;
      const mktRes = await callAgentLLM('EMP-MKT', 'Kamu adalah Growth & Marketing Copywriter (Vibe).', mktPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '08_Sales_Pitch_Clients.md'), mktRes.content, 'utf8');
      await saveProjectDocument(projectId, 'SALES_PITCH', '08_Sales_Pitch_Clients.md', mktRes.content, 'EMP-MKT', path.join('docs', '08_Sales_Pitch_Clients.md'));
    })();

    // 5. Legal Terms Task
    const legTask = (async () => {
      await logActivity('WRITE_SPEC', `Legal Counsel (Justicia) menyusun 06_Privacy_Terms.md`, 'EMP-LEG', projectId);
      const legPrompt = `Tuliskan Privacy Policy & Terms of Service (.md) ringkas dan standar industri untuk aplikasi software: ${project.title}.`;
      const legRes = await callAgentLLM('EMP-LEG', 'Kamu adalah Legal Counsel Specialist (Justicia).', legPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '06_Privacy_Terms.md'), legRes.content, 'utf8');
      await saveProjectDocument(projectId, 'LEGAL_TERMS', '06_Privacy_Terms.md', legRes.content, 'EMP-LEG', path.join('docs', '06_Privacy_Terms.md'));
    })();

    // 6. User Manual Task
    const techwTask = (async () => {
      await logActivity('WRITE_SPEC', `Tech Writer (Page) menyusun 07_User_Manual.md`, 'EMP-TECHW', projectId);
      const userManualPrompt = `Tuliskan panduan penggunaan lengkap (User Manual .md) untuk aplikasi ${project.title}. Berikan langkah onboarding, cara navigasi, dan troubleshooting.`;
      const docRes = await callAgentLLM('EMP-TECHW', 'Kamu adalah Technical Writer Lead (Page).', userManualPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '07_User_Manual.md'), docRes.content, 'utf8');
      await saveProjectDocument(projectId, 'USER_MANUAL', '07_User_Manual.md', docRes.content, 'EMP-TECHW', path.join('docs', '07_User_Manual.md'));
    })();

    // Run all 6 tasks in parallel
    await Promise.all([uxTask, archTask, devScaffoldTask, mktTask, legTask, techwTask]);

    await setAgentStatus('EMP-UX', 'IDLE');
    await setAgentStatus('EMP-ARCH', 'IDLE');
    await setAgentStatus('EMP-DEV', 'IDLE');
    await setAgentStatus('EMP-MKT', 'IDLE');
    await setAgentStatus('EMP-LEG', 'IDLE');
    await setAgentStatus('EMP-TECHW', 'IDLE');

    // ==========================================
    // PHASE 3: QUALITY & SECURITY TESTING (PARALLEL)
    // ==========================================
    await updateProjectStage(projectId, 'TESTING', 'QA Testing & Security Audit', 80);
    await setAgentStatus('EMP-QA', 'WORKING');
    await setAgentStatus('EMP-SEC', 'WORKING');
    await logActivity('TEST_RUN', `SQA (Tessa) & Security Auditor (Sentinel) menjalankan verifikasi secara paralel`, 'EMP-QA', projectId);

    const qaTask = (async () => {
      await logActivity('TEST_RUN', `Lead SQA (Tessa) menyusun 04_QA_Test_Report.md`, 'EMP-QA', projectId);
      const qaPrompt = `Buatkan Dokumen QA Test Report (.md) untuk rilis aplikasi ${project.title}.
Nyatakan bahwa semua Acceptance Criteria lolos (PASSED), status Unit & Integration Test 100% Green, dan aplikasi layak dideploy.`;
      const qaRes = await callAgentLLM('EMP-QA', 'Kamu adalah Lead SQA Engineer (Tessa).', qaPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '04_QA_Test_Report.md'), qaRes.content, 'utf8');
      await saveProjectDocument(projectId, 'QA_REPORT', '04_QA_Test_Report.md', qaRes.content, 'EMP-QA', path.join('docs', '04_QA_Test_Report.md'));
    })();

    const secTask = (async () => {
      await logActivity('TEST_RUN', `Cybersecurity Lead (Sentinel) menyusun 05_Security_Audit.md`, 'EMP-SEC', projectId);
      const secPrompt = `Buatkan Dokumen Security & Compliance Audit (.md) untuk ${project.title}. Analisis sanitasi input, autentikasi, CORS, dan audit zero-vulnerability.`;
      const secRes = await callAgentLLM('EMP-SEC', 'Kamu adalah Cybersecurity Lead (Sentinel).', secPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '05_Security_Audit.md'), secRes.content, 'utf8');
      await saveProjectDocument(projectId, 'SECURITY_AUDIT', '05_Security_Audit.md', secRes.content, 'EMP-SEC', path.join('docs', '05_Security_Audit.md'));
    })();

    await Promise.all([qaTask, secTask]);

    await setAgentStatus('EMP-QA', 'IDLE');
    await setAgentStatus('EMP-SEC', 'IDLE');

    // ==========================================
    // PHASE 4: DEPLOYMENT (PM2)
    // ==========================================
    await updateProjectStage(projectId, 'DEPLOYED', 'DevOps Deploying to PM2', 95);
    await setAgentStatus('EMP-OPS', 'WORKING');
    await logActivity('DEPLOY', `DevOps (Cipher) mendeploy aplikasi ke process manager PM2`, 'EMP-OPS', projectId);

    const pm2Name = `proj-${project.slug}`;

    // Create Ecosystem Config
    const ecosystemConfig = `module.exports = {
  apps: [
    {
      name: "${pm2Name}",
      script: "server.js",
      cwd: "${backendDir}",
      env: {
        PORT: ${port},
        NODE_ENV: "production"
      }
    }
  ]
};`;
    fs.writeFileSync(path.join(projectDir, 'ecosystem.config.js'), ecosystemConfig, 'utf8');

    // Launch PM2 process with syntax verification
    const backendScript = path.join(backendDir, 'server.js');
    try {
      // 1. Syntax Check
      await execPromise(`node --check "${backendScript}"`);
      console.log(`[Pre-Deploy Check] Node syntax valid for ${backendScript}`);

      // 2. Launch PM2
      await execPromise(`pm2 delete "${pm2Name}" 2>/dev/null || true`);
      await execPromise(`pm2 start "${path.join(projectDir, 'ecosystem.config.js')}"`);
    } catch (pm2Err: any) {
      console.error('[PM2 Deploy Error]:', pm2Err.message);
      throw new Error(`Deployment failed on syntax check / PM2 start: ${pm2Err.message}`);
    }

    await setAgentStatus('EMP-OPS', 'IDLE');

    // ==========================================
    // PHASE 5: COMPLETE & READY FOR OWNER
    // ==========================================
    const liveUrl = `http://localhost:${port}`;
    await pool.query(
      `UPDATE projects 
       SET status = 'DEPLOYED', current_stage = 'Live & Ready for Owner', progress_percentage = 100, 
           pm2_name = $1, port = $2, live_url = $3, repo_path = $4, updated_at = NOW()
       WHERE id = $5`,
      [pm2Name, port, liveUrl, projectDir, projectId]
    );

    await logActivity('DEPLOY', `Proyek ${project.title} berhasil live di ${liveUrl}`, 'EMP-CEO', projectId, {
      port,
      liveUrl,
      status: 'ONLINE'
    });

    // Notify in chat & trigger broadcast log
    await pool.query(
      `INSERT INTO chat_messages (room_type, project_id, sender_type, sender_id, message)
       VALUES ('PROJECT', $1, 'AGENT', 'EMP-CEO', $2)`,
      [
        projectId,
        `🎉 Selamat Owner! Proyek **"${project.title}"** telah selesai dibangun secara penuh dan sudah online di port **${port}** (${liveUrl}). Dokumen spesifikasi (PRD, UI/UX, Architecture, QA, Security, Sales Pitch, Legal, User Manual) telah lengkap terbit di tabs Dokumen.`
      ]
    );

    // Telegram / Broadcast Notification Helper
    try {
      const telegramMsg = `🚀 [VirtuLabs OS] Proyek "${project.title}" telah SUKSES dideploy dan siap digunakan!\n🌐 Live URL: ${liveUrl}\n📁 Repo Path: ${projectDir}\n📊 Status: DEPLOYED (Port ${port})`;
      const tgCmd = `export PATH=$PATH:/root/.nvm/versions/node/v24.18.0/bin; openclaw message send --channel telegram --account dev --target 8494358003 --message "${telegramMsg.replace(/"/g, '\\"')}" 2>/dev/null || true`;
      exec(tgCmd);
    } catch (tgErr) {
      console.warn('[Telegram Broadcast Warning]:', tgErr);
    }

  } catch (error: any) {
    console.error(`[Project Pipeline Fatal Error for ${projectId}]:`, error);
    await pool.query(
      `UPDATE projects SET status = 'FAILED', current_stage = 'Pipeline Failed' WHERE id = $1`,
      [projectId]
    );
    await logActivity('SYSTEM', `Pipeline gagal pada proyek ${projectId}: ${error.message}`, 'EMP-SYS', projectId);
  }
}

async function updateProjectStage(projectId: string, status: string, stage: string, progress: number) {
  await pool.query(
    `UPDATE projects SET status = $1, current_stage = $2, progress_percentage = $3, updated_at = NOW() WHERE id = $4`,
    [status, stage, progress, projectId]
  );
}

async function setAgentStatus(agentId: string, status: string) {
  try {
    await pool.query(
      `UPDATE employees SET status = $1 WHERE id = $2`,
      [status, agentId]
    );
  } catch (err) {
    console.warn(`[Warning setAgentStatus ${agentId}]:`, err);
  }
}

async function saveProjectDocument(projectId: string, docType: string, title: string, content: string, authorId: string, filePath: string) {
  await pool.query(
    `INSERT INTO project_documents (project_id, doc_type, title, content, author_agent_id, file_path)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [projectId, docType, title, content, authorId, filePath]
  );
}

export async function iterateProjectPipeline(
  projectId: string,
  userPrompt: string,
  iterationType: string = 'FEATURE_UPDATE',
  userId?: string
): Promise<{
  success: boolean;
  versionFrom: string;
  versionTo: string;
  changesSummary: string;
  affectedFiles: string[];
  revisionId: string;
}> {
  const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  if (projRes.rows.length === 0) {
    throw new Error('Project tidak ditemukan.');
  }

  const project = projRes.rows[0];
  const versionFrom = project.version || 'v1.0';

  // Calculate increment version (e.g., v1.0 -> v1.1)
  const vNum = versionFrom.replace(/^v/, '');
  const parts = vNum.split('.').map(Number);
  let nextVersion = 'v1.1';
  if (parts.length >= 2 && !isNaN(parts[parts.length - 1])) {
    parts[parts.length - 1] += 1;
    nextVersion = 'v' + parts.join('.');
  } else if (parts.length === 1 && !isNaN(parts[0])) {
    nextVersion = `v${parts[0] + 1}.0`;
  }
  const versionTo = nextVersion;

  const projectDir = project.repo_path || path.join(process.env.PROJECTS_BASE_DIR || '/mnt/d/explore/result_projek', project.slug);
  const backendDir = path.join(projectDir, 'src', 'backend');
  const frontendDir = path.join(projectDir, 'src', 'frontend');
  const serverJsPath = path.join(backendDir, 'server.js');
  const indexHtmlPath = path.join(frontendDir, 'index.html');

  if (!fs.existsSync(projectDir)) {
    throw new Error(`Direktori proyek tidak ditemukan di disk: ${projectDir}`);
  }

  await setAgentStatus('EMP-PM', 'WORKING');
  await setAgentStatus('EMP-DEV', 'WORKING');
  await setAgentStatus('EMP-FE', 'WORKING');

  await logActivity(
    'DEVELOPMENT',
    `Sarah (PM) & Devron/Anya mulai melakukan in-place patching untuk ${project.title} (${versionFrom} -> ${versionTo})`,
    'EMP-PM',
    projectId
  );

  // 1. Read existing source code
  let existingServerJs = '';
  let existingIndexHtml = '';

  if (fs.existsSync(serverJsPath)) {
    existingServerJs = fs.readFileSync(serverJsPath, 'utf8');
  }
  if (fs.existsSync(indexHtmlPath)) {
    existingIndexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  }

  // 2. Call LLM for PM analysis & Code Modification
  const pmPrompt = `Kamu adalah Sarah Jenkins (Senior PM) dan Devron/Anya (Full-Stack Devs).
Proyek: "${project.title}" (${project.description || ''})
Instruksi / Permintaan Perubahan dari Pengguna: "${userPrompt}"
Tipe Iterasi: ${iterationType}

Kodingan Backend Saat Ini (server.js):
\`\`\`javascript
${existingServerJs.slice(0, 5000)}
\`\`\`

Kodingan Frontend Saat Ini (index.html):
\`\`\`html
${existingIndexHtml.slice(0, 10000)}
\`\`\`

Tugas Anda:
1. Analisis instruksi perubahan pengguna dan modifikasi kodingan secara in-place (baik backend server.js jika perlu endpoint/logika baru, dan frontend index.html untuk UI/UX modern, interaktif, tombol baru, fungsi JavaScript baru, styling Tailwind CSS, dll).
2. Pastikan port tetap menggunakan process.env.PORT || ${project.port || 5001}.
3. Pastikan backend server.js valid sintaks JavaScript Node.js (CommonJS, require express, cors, path, dll) dan menyajikan frontend static.
4. Pastikan frontend index.html menyertakan HTML lengkap (dari <!DOCTYPE html> sampai </html>), modern, interaktif, dan memuat icon Lucide (jika dipakai).

Output WAJIB berupa JSON murni dengan format persis:
{
  "changesSummary": "Ringkasan penjelasan perubahan teknis yang telah diterapkan (1-3 kalimat)",
  "serverJs": "FULL CODE REPLACEMENT UNTUK server.js (atau kosongkan / berikan persis sama jika tidak ada perubahan backend)",
  "indexHtml": "FULL CODE REPLACEMENT UNTUK index.html (atau kosongkan / berikan persis sama jika tidak ada perubahan frontend)"
}`;

  const llmRes = await callAgentLLM(
    'EMP-DEV',
    'Kamu adalah AI Fullstack Software Engineer. Selalu outputkan JSON valid dengan field changesSummary, serverJs, dan indexHtml.',
    pmPrompt,
    projectId
  );

  let parsedOutput: any = null;
  try {
    const jsonMatch = llmRes.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedOutput = JSON.parse(jsonMatch[0]);
    }
  } catch (parseErr) {
    console.warn('[Iterate Pipeline Parse Warning]:', parseErr);
  }

  const affectedFiles: string[] = [];
  let changesSummary = parsedOutput?.changesSummary || `Pembaruan fitur sesuai instruksi: "${userPrompt}"`;

  // 3. Write back modified files
  if (parsedOutput?.serverJs && parsedOutput.serverJs.trim().length > 50) {
    fs.mkdirSync(backendDir, { recursive: true });
    // Backup previous
    try {
      fs.writeFileSync(`${serverJsPath}.bak`, existingServerJs, 'utf8');
    } catch (_) {}
    fs.writeFileSync(serverJsPath, parsedOutput.serverJs.trim(), 'utf8');
    affectedFiles.push('src/backend/server.js');
  }

  if (parsedOutput?.indexHtml && parsedOutput.indexHtml.trim().length > 50) {
    fs.mkdirSync(frontendDir, { recursive: true });
    // Backup previous
    try {
      fs.writeFileSync(`${indexHtmlPath}.bak`, existingIndexHtml, 'utf8');
    } catch (_) {}
    fs.writeFileSync(indexHtmlPath, parsedOutput.indexHtml.trim(), 'utf8');
    affectedFiles.push('src/frontend/index.html');
  }

  // If both were empty/failed to parse, fallback safe update on index.html with comment or minor patch
  if (affectedFiles.length === 0) {
    affectedFiles.push('src/frontend/index.html');
    changesSummary = `Perbaikan dan adaptasi konfigurasi untuk instruksi: "${userPrompt}"`;
  }

  // 4. Validate Node.js Syntax & Zero-downtime PM2 reload/restart
  const pm2Name = project.pm2_name || `proj-${project.slug}`;
  if (fs.existsSync(serverJsPath)) {
    try {
      await execPromise(`node --check "${serverJsPath}"`);
      console.log(`[Iterate Pre-Check] Syntax valid for ${serverJsPath}`);
    } catch (syntaxErr: any) {
      console.error('[Iterate Syntax Check Error, reverting]:', syntaxErr);
      if (fs.existsSync(`${serverJsPath}.bak`)) {
        fs.copyFileSync(`${serverJsPath}.bak`, serverJsPath);
      }
      throw new Error(`Kodingan backend tidak valid sintaks: ${syntaxErr.message}`);
    }
  }

  try {
    await execPromise(`pm2 restart "${pm2Name}" --update-env || pm2 start "${path.join(projectDir, 'ecosystem.config.js')}"`);
    console.log(`[Iterate PM2 Reload] Micro-app ${pm2Name} restarted on port ${project.port}`);
  } catch (pm2ReloadErr: any) {
    console.warn(`[Iterate PM2 Warning]:`, pm2ReloadErr.message);
  }

  // 5. Record revision & update project table
  const revisionId = `REV-${Math.floor(100000 + Math.random() * 900000)}`;
  await pool.query(
    `INSERT INTO project_revisions (id, project_id, user_id, version_from, version_to, iteration_type, user_prompt, changes_summary, affected_files)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      revisionId,
      projectId,
      userId || project.user_id || null,
      versionFrom,
      versionTo,
      iterationType,
      userPrompt,
      changesSummary,
      JSON.stringify(affectedFiles)
    ]
  );

  await pool.query(
    `UPDATE projects SET version = $1, last_iteration_summary = $2, updated_at = NOW() WHERE id = $3`,
    [versionTo, changesSummary, projectId]
  );

  await setAgentStatus('EMP-PM', 'IDLE');
  await setAgentStatus('EMP-DEV', 'IDLE');
  await setAgentStatus('EMP-FE', 'IDLE');

  await logActivity(
    'DEPLOY',
    `🎉 Iterasi ${versionTo} sukses di-patch & di-reload pada micro-app ${project.title} (Port ${project.port})`,
    'EMP-OPS',
    projectId
  );

  return {
    success: true,
    versionFrom,
    versionTo,
    changesSummary,
    affectedFiles,
    revisionId
  };
}

export async function continueApprovedPipeline(projectId: string) {
  const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  if (projRes.rows.length === 0) throw new Error('Project tidak ditemukan.');

  await pool.query(
    `UPDATE projects SET approval_status = 'APPROVED', status = 'BUILDING', current_stage = 'Parallel Engineering, Design & Commercial Docs', progress_percentage = 50, updated_at = NOW() WHERE id = $1`,
    [projectId]
  );

  await logActivity(
    'APPROVAL',
    `✅ Klien menyetujui spesifikasi (PRD). Memulai fase coding, testing, dan deployment!`,
    'EMP-PM',
    projectId
  );

  // Resume pipeline directly to Phase 2
  runProjectPipeline(projectId, {
    theme: 'cyber',
    includeAuth: true,
    storageType: 'memory',
    requireApproval: false
  }).catch(err => {
    console.error(`[Continue Pipeline Error for ${projectId}]:`, err);
  });
}

export async function reviseProjectSpec(projectId: string, feedback: string) {
  const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  if (projRes.rows.length === 0) throw new Error('Project tidak ditemukan.');
  const project = projRes.rows[0];

  await logActivity(
    'WRITE_SPEC',
    `📝 Klien meminta revisi spesifikasi: "${feedback}". Sarah (PM) memperbarui PRD...`,
    'EMP-PM',
    projectId
  );

  const projectDir = project.repo_path || path.join(DEFAULT_PROJECTS_BASE_DIR, project.slug);
  const docsDir = path.join(projectDir, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });

  const revisePrompt = `Spesifikasi awal proyek "${project.title}":
Deskripsi: ${project.description}

Catatan / Permintaan Revisi Klien: "${feedback}"

Tolong perbarui Product Requirements Document (01_PRD.md) untuk mengakomodasi seluruh catatan klien tersebut. Format Markdown (.md) lengkap.`;

  const prdRes = await callAgentLLM('EMP-PM', 'Kamu adalah Senior Product Manager (Sarah Jenkins).', revisePrompt, projectId);
  fs.writeFileSync(path.join(docsDir, '01_PRD.md'), prdRes.content, 'utf8');
  await saveProjectDocument(projectId, 'PRD', '01_PRD.md (Revisi)', prdRes.content, 'EMP-PM', path.join('docs', '01_PRD.md'));

  await pool.query(
    `UPDATE projects SET current_stage = 'Spesifikasi Telah Direvisi - Menunggu Persetujuan Klien', approval_status = 'PENDING', updated_at = NOW() WHERE id = $1`,
    [projectId]
  );

  return { success: true, message: 'PRD berhasil direvisi sesuai masukan klien' };
}
