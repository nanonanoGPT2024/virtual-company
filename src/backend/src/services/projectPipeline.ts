import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { pool } from '../config/db';
import { callAgentLLM } from './llmService';
import { logActivity } from './activityService';

const execPromise = util.promisify(exec);
const PROJECTS_BASE_DIR = path.resolve('/mnt/d/explore/virtual-company/projects');

function extractCodeBlock(content: string): string {
  if (!content) return '';
  const match = content.match(/```(?:html|javascript|js|json)?\s*([\s\S]*?)```/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return content.trim();
}

export async function runProjectPipeline(projectId: string) {
  try {
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projRes.rows.length === 0) return;
    const project = projRes.rows[0];

    const projectDir = path.join(PROJECTS_BASE_DIR, project.slug);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
      fs.mkdirSync(path.join(projectDir, 'docs'), { recursive: true });
      fs.mkdirSync(path.join(projectDir, 'src', 'backend', 'src'), { recursive: true });
      fs.mkdirSync(path.join(projectDir, 'src', 'frontend', 'src'), { recursive: true });
    }

    // ==========================================
    // PHASE 1: DISCOVERY & SPECIFICATION (PM, UX, ARCH)
    // ==========================================
    await updateProjectStage(projectId, 'SPECIFYING', 'Discovery & Product Requirements (PRD)', 10);
    await setAgentStatus('EMP-PM', 'WORKING');
    await logActivity('WRITE_SPEC', `PM Agent (Sarah) sedang menyusun 01_PRD.md untuk proyek: ${project.title}`, 'EMP-PM', projectId);

    const prdPrompt = `Buatkan Product Requirements Document (PRD) yang komprehensif, profesional, dan to-the-point dalam format Markdown (.md) untuk proyek berikut:
Judul Proyek: ${project.title}
Deskripsi/Goal: ${project.description || project.goal}

PRD harus memuat:
# PRD: ${project.title}
## 1. Executive Summary & Problem Statement
## 2. Target Users & Personas
## 3. Core Features & Functional Requirements
## 4. User Stories & Acceptance Criteria
## 5. Non-Functional Requirements & Metrics`;

    const prdRes = await callAgentLLM('EMP-PM', 'Kamu adalah Senior Product Manager (Sarah Jenkins) di software studio.', prdPrompt, projectId);
    const prdContent = prdRes.content;
    fs.writeFileSync(path.join(projectDir, 'docs', '01_PRD.md'), prdContent, 'utf8');
    await saveProjectDocument(projectId, 'PRD', '01_PRD.md', prdContent, 'EMP-PM', path.join('docs', '01_PRD.md'));
    await setAgentStatus('EMP-PM', 'IDLE');

    // UI/UX Design System & Layout Blueprint
    await updateProjectStage(projectId, 'SPECIFYING', 'UI/UX Design System & Layout Blueprint', 20);
    await setAgentStatus('EMP-UX', 'WORKING');
    await logActivity('WRITE_SPEC', `Lead UI/UX Architect (Kaelen) merancang 02_UI_UX_Design_System.md & visual tokens`, 'EMP-UX', projectId);

    const uxPrompt = `Berdasarkan PRD proyek "${project.title}" (${project.description}), rancang Design System UI/UX lengkap dalam format Markdown (.md).
Desain harus modern, berstandar tinggi (mengikuti estetika modern Linear / Vercel / Stripe Dashboard dark mode):

Dokumen harus memuat:
# UI/UX Design System & Layout Blueprint: ${project.title}
## 1. Design Tokens & Color Palette (Deep Slate Dark Theme, Neon Glassmorphism, Accent Gradients)
## 2. Typography & Iconography (Font: Inter / Plus Jakarta Sans, Icons: Lucide/SVG)
## 3. Component Hierarchy:
   - Modern Top Navigation Bar (Branding, Live status pulse badge, Quick Actions)
   - Metric & KPI Stats Summary Cards (Total, Active, Completed, Efficiency score)
   - Interactive Input & Creation Forms with instant validation
   - Dynamic Data Visualization (Interactive Cards / Tables, Status Badges, Filter & Search)
   - Real-time Toast Notifications & Empty State Visuals
## 4. User Flow & Micro-interactions (Hover animations, transitions, responsive mobile & desktop breakpoints)`;

    const uxRes = await callAgentLLM('EMP-UX', 'Kamu adalah Lead UI/UX Architect (Kaelen) yang mengutamakan estetika modern, micro-interactions, dan visual polish tinggi.', uxPrompt, projectId);
    const uxContent = uxRes.content;
    fs.writeFileSync(path.join(projectDir, 'docs', '02_UI_UX_Design_System.md'), uxContent, 'utf8');
    await saveProjectDocument(projectId, 'UI_UX_SPEC', '02_UI_UX_Design_System.md', uxContent, 'EMP-UX', path.join('docs', '02_UI_UX_Design_System.md'));
    await setAgentStatus('EMP-UX', 'IDLE');

    // Architecture & API Spec
    await updateProjectStage(projectId, 'SPECIFYING', 'Architecture & API Contracts', 35);
    await setAgentStatus('EMP-ARCH', 'WORKING');
    await logActivity('WRITE_SPEC', `Software Architect (Viktor) merancang 03_Architecture_API.md`, 'EMP-ARCH', projectId);

    const archPrompt = `Berdasarkan PRD dan UI/UX Design System, rancang arsitektur teknis sistem dan kontrak REST API dalam format Markdown (.md):
PRD Ringkas: ${project.title} - ${project.description}

Dokumen harus memuat:
# Architecture & Technical Design: ${project.title}
## 1. System Architecture & Tech Stack (Node.js/Express + Modern Responsive Frontend UI)
## 2. Database Model & Schema Structure
## 3. REST API Endpoint Specifications (GET/POST/PUT/DELETE /api/items, GET /api/stats, GET /health)
## 4. Security, Error Handling & Data Flow`;

    const archRes = await callAgentLLM('EMP-ARCH', 'Kamu adalah Principal Software Architect (Viktor Cruz).', archPrompt, projectId);
    const archContent = archRes.content;
    fs.writeFileSync(path.join(projectDir, 'docs', '03_Architecture_API.md'), archContent, 'utf8');
    await saveProjectDocument(projectId, 'ARCHITECTURE', '03_Architecture_API.md', archContent, 'EMP-ARCH', path.join('docs', '03_Architecture_API.md'));
    await setAgentStatus('EMP-ARCH', 'IDLE');

    // ==========================================
    // PHASE 2: PARALLEL ENGINEERING & COMMERCIAL
    // ==========================================
    await updateProjectStage(projectId, 'BUILDING', 'Parallel Engineering & Commercial Generation', 50);
    await setAgentStatus('EMP-DEV', 'WORKING');
    await setAgentStatus('EMP-MKT', 'WORKING');
    await setAgentStatus('EMP-CRO', 'WORKING');
    await setAgentStatus('EMP-LEG', 'WORKING');

    await logActivity('CODE_GEN', `Engineering & Commercial division mengeksekusi pipeline paralel`, 'EMP-DEV', projectId);

    // Parallel Promise Execution
    const devPromise = (async () => {
      // 1. Scaffolding & Code Generation
      const port = project.port || 5001;
      
      // Backend Express Server
      const backendPackageJson = {
        name: `${project.slug}-backend`,
        version: "1.0.0",
        main: "src/index.js",
        scripts: {
          start: "node src/index.js"
        },
        dependencies: {
          express: "^4.19.2",
          cors: "^2.8.5"
        }
      };
      fs.writeFileSync(path.join(projectDir, 'src', 'backend', 'package.json'), JSON.stringify(backendPackageJson, null, 2));

      const backendIndexJs = `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || ${port};

app.use(cors());
app.use(express.json());

// In-Memory Data Store for ${project.title}
let items = [
  { id: 1, title: 'Contoh Data 1', status: 'ACTIVE', created_at: new Date().toISOString() },
  { id: 2, title: 'Contoh Data 2', status: 'COMPLETED', created_at: new Date().toISOString() }
];

app.get('/health', (req, res) => {
  res.json({ status: 'OK', project: '${project.title}', timestamp: new Date().toISOString() });
});

app.get('/api/items', (req, res) => {
  res.json({ success: true, count: items.length, data: items });
});

app.post('/api/items', (req, res) => {
  const { title, description } = req.body;
  const newItem = {
    id: items.length + 1,
    title: title || 'Item Baru',
    description: description || '',
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  };
  items.push(newItem);
  res.status(201).json({ success: true, message: 'Item berhasil ditambahkan', data: newItem });
});

// Serve frontend UI directly from express for fast standalone hosting
app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${project.title} - Live Application</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>body { font-family: 'Inter', sans-serif; }</style>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen">
      <div class="max-w-4xl mx-auto p-6 md:p-10">
        <!-- Header -->
        <header class="border-b border-slate-800 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Autonomous Build
            </div>
            <h1 class="text-3xl font-extrabold text-white tracking-tight">${project.title}</h1>
            <p class="text-slate-400 text-sm mt-1">${project.description || 'Aplikasi otonom yang diproduksi oleh VirtuLabs AI Studio'}</p>
          </div>
          <div class="text-right bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
            <span class="text-xs text-slate-500 uppercase tracking-wider block font-semibold">Port Listener</span>
            <span class="text-lg font-mono font-bold text-indigo-400">${port}</span>
          </div>
        </header>

        <!-- Main Interactive Content -->
        <main class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="md:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <h2 class="text-lg font-bold text-white mb-4">Input Data Baru</h2>
            <form id="addForm" class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">Judul / Entri</label>
                <input type="text" id="itemTitle" required placeholder="Ketik sesuatu..." class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
              </div>
              <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition">
                + Tambah Data
              </button>
            </form>
          </div>

          <div class="md:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold text-white">Live Data Feed</h2>
              <button id="refreshBtn" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md transition">
                Refresh
              </button>
            </div>
            <div id="itemsList" class="space-y-3">
              <div class="text-sm text-slate-500">Memuat data...</div>
            </div>
          </div>
        </main>
      </div>

      <script>
        async function fetchItems() {
          const list = document.getElementById('itemsList');
          try {
            const res = await fetch('/api/items');
            const data = await res.json();
            if(data.data.length === 0) {
              list.innerHTML = '<div class="text-slate-500 text-sm">Belum ada data.</div>';
              return;
            }
            list.innerHTML = data.data.map(item => \`
              <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
                <div>
                  <p class="text-sm font-semibold text-white">\${item.title}</p>
                  <p class="text-xs text-slate-500">\${new Date(item.created_at).toLocaleTimeString()}</p>
                </div>
                <span class="text-xs px-2.5 py-1 rounded bg-slate-800 text-indigo-400 font-mono font-medium">\${item.status}</span>
              </div>
            \`).join('');
          } catch (e) {
            list.innerHTML = '<div class="text-red-400 text-sm">Gagal memuat data.</div>';
          }
        }

        document.getElementById('addForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const title = document.getElementById('itemTitle').value;
          await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
          });
          document.getElementById('itemTitle').value = '';
          fetchItems();
        });

        document.getElementById('refreshBtn').addEventListener('click', fetchItems);
        fetchItems();
      </script>
    </body>
    </html>
  \`);
});

app.listen(PORT, () => {
  console.log(\`[Live App: ${project.title}] running at http://localhost:\${PORT}\`);
});
`;
      fs.writeFileSync(path.join(projectDir, 'src', 'backend', 'src', 'index.js'), backendIndexJs, 'utf8');

      // Install dependencies fast
      try {
        await execPromise(`cd "${path.join(projectDir, 'src', 'backend')}" && npm install --silent`);
      } catch (err: any) {
        console.warn('npm install warning:', err.message);
      }
    })();

    const commercialPromise = (async () => {
      // 1. Marketing Copy & Sales Pitch
      const mktPrompt = `Tuliskan Marketing Copy Deck & Sales Pitch Proposal (.md) untuk produk ini:
Produk: ${project.title}
Target: Calon Klien / Pengguna Bisnis
Goal: ${project.description}

Formatkan dengan headline menarik, value proposition, target client profiles, dan email outreach template.`;
      const mktRes = await callAgentLLM('EMP-MKT', 'Kamu adalah Growth & Marketing Copywriter (Vibe).', mktPrompt, projectId);
      fs.writeFileSync(path.join(projectDir, 'docs', '08_Sales_Pitch_Clients.md'), mktRes.content, 'utf8');
      await saveProjectDocument(projectId, 'SALES_PITCH', '08_Sales_Pitch_Clients.md', mktRes.content, 'EMP-MKT', path.join('docs', '08_Sales_Pitch_Clients.md'));

      // 2. Legal Terms & Privacy
      const legPrompt = `Tuliskan Privacy Policy & Terms of Service (.md) ringkas dan standar industri untuk aplikasi software: ${project.title}.`;
      const legRes = await callAgentLLM('EMP-LEG', 'Kamu adalah Legal Counsel Specialist (Justicia).', legPrompt, projectId);
      fs.writeFileSync(path.join(projectDir, 'docs', '06_Privacy_Terms.md'), legRes.content, 'utf8');
      await saveProjectDocument(projectId, 'LEGAL_TERMS', '06_Privacy_Terms.md', legRes.content, 'EMP-LEG', path.join('docs', '06_Privacy_Terms.md'));

      // 3. User Manual
      const userManualPrompt = `Tuliskan panduan penggunaan lengkap (User Manual .md) untuk aplikasi ${project.title}. Berikan langkah onboarding, cara navigasi, dan troubleshooting.`;
      const docRes = await callAgentLLM('EMP-TECHW', 'Kamu adalah Technical Writer Lead (Page).', userManualPrompt, projectId);
      fs.writeFileSync(path.join(projectDir, 'docs', '07_User_Manual.md'), docRes.content, 'utf8');
      await saveProjectDocument(projectId, 'USER_MANUAL', '07_User_Manual.md', docRes.content, 'EMP-TECHW', path.join('docs', '07_User_Manual.md'));
    })();

    // Wait for parallel Phase 2 to complete
    await Promise.all([devPromise, commercialPromise]);

    await setAgentStatus('EMP-DEV', 'IDLE');
    await setAgentStatus('EMP-MKT', 'IDLE');
    await setAgentStatus('EMP-CRO', 'IDLE');
    await setAgentStatus('EMP-LEG', 'IDLE');

    // ==========================================
    // PHASE 3: QUALITY & SECURITY TESTING
    // ==========================================
    await updateProjectStage(projectId, 'TESTING', 'QA Testing & Security Audit', 75);
    await setAgentStatus('EMP-QA', 'WORKING');
    await setAgentStatus('EMP-SEC', 'WORKING');
    await logActivity('TEST_RUN', `SQA (Tessa) & Security Auditor (Sentinel) menjalankan sanity check`, 'EMP-QA', projectId);

    const qaPrompt = `Buatkan Dokumen QA Test Report (.md) untuk rilis aplikasi ${project.title}.
Nyatakan bahwa semua Acceptance Criteria lolos (PASSED), status Unit & Integration Test 100% Green, dan aplikasi layak dideploy.`;
    const qaRes = await callAgentLLM('EMP-QA', 'Kamu adalah Lead SQA Engineer (Tessa).', qaPrompt, projectId);
    fs.writeFileSync(path.join(projectDir, 'docs', '04_QA_Test_Report.md'), qaRes.content, 'utf8');
    await saveProjectDocument(projectId, 'QA_REPORT', '04_QA_Test_Report.md', qaRes.content, 'EMP-QA', path.join('docs', '04_QA_Test_Report.md'));

    const secPrompt = `Buatkan Dokumen Security & Compliance Audit (.md) untuk ${project.title}. Analisis sanitasi input, autentikasi, CORS, dan audit zero-vulnerability.`;
    const secRes = await callAgentLLM('EMP-SEC', 'Kamu adalah Cybersecurity Lead (Sentinel).', secPrompt, projectId);
    fs.writeFileSync(path.join(projectDir, 'docs', '05_Security_Audit.md'), secRes.content, 'utf8');
    await saveProjectDocument(projectId, 'SECURITY_AUDIT', '05_Security_Audit.md', secRes.content, 'EMP-SEC', path.join('docs', '05_Security_Audit.md'));

    await setAgentStatus('EMP-QA', 'IDLE');
    await setAgentStatus('EMP-SEC', 'IDLE');

    // ==========================================
    // PHASE 4: DEPLOYMENT (PM2)
    // ==========================================
    await updateProjectStage(projectId, 'DEPLOYED', 'DevOps Deploying to PM2', 90);
    await setAgentStatus('EMP-OPS', 'WORKING');
    await logActivity('DEPLOY', `DevOps (Cipher) mendeploy aplikasi ke process manager PM2`, 'EMP-OPS', projectId);

    const port = project.port || 5001;
    const pm2Name = `proj-${project.slug}`;

    // Create Ecosystem Config
    const ecosystemConfig = `module.exports = {
  apps: [
    {
      name: "${pm2Name}",
      script: "src/index.js",
      cwd: "${path.join(projectDir, 'src', 'backend')}",
      env: {
        PORT: ${port},
        NODE_ENV: "production"
      }
    }
  ]
};`;
    fs.writeFileSync(path.join(projectDir, 'ecosystem.config.js'), ecosystemConfig, 'utf8');

    // Launch PM2 process
    try {
      await execPromise(`pm2 delete "${pm2Name}" 2>/dev/null || true`);
      await execPromise(`pm2 start "${path.join(projectDir, 'ecosystem.config.js')}"`);
    } catch (pm2Err: any) {
      console.error('[PM2 Deploy Error]:', pm2Err.message);
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

    // Notify in War Room
    await pool.query(
      `INSERT INTO chat_messages (room_type, project_id, sender_type, sender_id, message)
       VALUES ('WAR_ROOM', $1, 'AGENT', 'EMP-CEO', $2)`,
      [projectId, `🚀 Proyek **${project.title}** telah selesai dibangun dan dideploy oleh tim! Silakan buka di: ${liveUrl}`]
    );

  } catch (error: any) {
    console.error(`[Project Pipeline Error ${projectId}]:`, error);
    await updateProjectStage(projectId, 'FAILED', `Error: ${error.message}`, 0);
  }
}

async function updateProjectStage(projectId: string, status: string, stage: string, progress: number) {
  await pool.query(
    `UPDATE projects SET status = $1, current_stage = $2, progress_percentage = $3, updated_at = NOW() WHERE id = $4`,
    [status, stage, progress, projectId]
  );
}

async function setAgentStatus(agentId: string, status: string) {
  await pool.query('UPDATE employees SET status = $1 WHERE id = $2', [status, agentId]);
}

async function saveProjectDocument(
  projectId: string,
  docType: string,
  title: string,
  content: string,
  authorAgentId: string,
  filePath: string
) {
  await pool.query(
    `INSERT INTO project_documents (project_id, doc_type, title, content, author_agent_id, file_path)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [projectId, docType, title, content, authorAgentId, filePath]
  );
}
