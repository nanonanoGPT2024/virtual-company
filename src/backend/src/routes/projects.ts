import http from 'http';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { Router } from 'express';
import { spawn, ChildProcess } from 'child_process';
import { pool } from '../config/db';
import { 
  runProjectPipeline, 
  iterateProjectPipeline, 
  continueApprovedPipeline, 
  reviseProjectSpec 
} from '../services/projectPipeline';
import { logActivity } from '../services/activityService';
import { generateProjectSpecTemplateDocx } from '../services/docExportService';
import { callAgentLLM } from '../services/llmService';
import { authenticateUser } from './auth';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const router = Router();

// In-Memory active tunnel processes map { [projectId]: ChildProcess }
const activeTunnels: Record<string, ChildProcess> = {};

// Clean up any active tunnel child processes on exit to prevent zombie processes
const cleanupAllTunnels = () => {
  for (const pid of Object.keys(activeTunnels)) {
    try {
      activeTunnels[pid]?.kill('SIGTERM');
      delete activeTunnels[pid];
    } catch (_) {}
  }
};
process.on('SIGINT', cleanupAllTunnels);
process.on('SIGTERM', cleanupAllTunnels);
process.on('exit', cleanupAllTunnels);

// Helper function to safely check port availability
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close();
      resolve(true);
    });
    tester.listen(port, '0.0.0.0');
  });
}

// Helper to get next genuinely available port
async function getNextAvailablePort(startPort = 5001): Promise<number> {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
  }
  return port;
}

// Helper function to extract database tables & rows from a project directory
function extractProjectDatabase(projectDir: string): Array<{ name: string; columns: string[]; rows: any[] }> {
  const tables: Array<{ name: string; columns: string[]; rows: any[] }> = [];

  // 1. Scan JSON data files (data.json, db.json, database.json, items.json, orders.json)
  const candidateDirs = [projectDir, path.join(projectDir, 'src', 'backend')];
  for (const cDir of candidateDirs) {
    if (fs.existsSync(cDir)) {
      const entries = fs.readdirSync(cDir);
      for (const entry of entries) {
        if (entry.endsWith('.json') && entry !== 'package.json' && entry !== 'package-lock.json' && entry !== 'tsconfig.json') {
          const filePath = path.join(cDir, entry);
          try {
            const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const tableName = path.basename(entry, '.json');
            if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object') {
              if (!tables.some(t => t.name === tableName)) {
                tables.push({ name: tableName, columns: Object.keys(raw[0]), rows: raw });
              }
            } else if (typeof raw === 'object' && raw !== null) {
              for (const k of Object.keys(raw)) {
                if (Array.isArray(raw[k]) && raw[k].length > 0 && typeof raw[k][0] === 'object') {
                  if (!tables.some(t => t.name === k)) {
                    tables.push({ name: k, columns: Object.keys(raw[k][0]), rows: raw[k] });
                  }
                }
              }
            }
          } catch (_) {}
        }
      }
    }
  }

  // 2. Extract in-memory data structures from server.js
  const serverPath = path.join(projectDir, 'src', 'backend', 'server.js');
  if (fs.existsSync(serverPath)) {
    try {
      const code = fs.readFileSync(serverPath, 'utf8');
      const arrayRegex = /(?:let|const|var)\s+([a-zA-Z0-9_]+)\s*=\s*(\[\s*\{[\s\S]*?\}\s*\])/g;
      let match;
      while ((match = arrayRegex.exec(code)) !== null) {
        const tableName = match[1];
        if (tables.some(t => t.name === tableName)) continue;
        try {
          const rows = Function('return ' + match[2])();
          if (Array.isArray(rows) && rows.length > 0 && typeof rows[0] === 'object') {
            tables.push({ name: tableName, columns: Object.keys(rows[0]), rows });
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  // Default fallback if table is empty
  if (tables.length === 0) {
    tables.push({
      name: 'items',
      columns: ['id', 'name', 'status', 'created_at'],
      rows: [
        { id: 1, name: 'Sample Record Item', status: 'ACTIVE', created_at: new Date().toISOString() }
      ]
    });
  }

  return tables;
}

// 1. POST /api/projects/enrich-spec (Interactive PRD Auto-Enrichment & Spec Builder)
router.post('/enrich-spec', authenticateUser, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title && !description) {
      return res.status(400).json({ error: 'Title atau deskripsi ide diperlukan' });
    }

    const prompt = `Kamu adalah Chief Product & Technical Architect di software studio kelas dunia.
Berdasarkan ide aplikasi berikut:
Judul: ${title || 'Aplikasi Baru'}
Deskripsi: ${description || title}

Tolong perkaya spesifikasi kebutuhan aplikasi ini menjadi format JSON murni (tanpa penjelasan markdown di luar JSON) dengan struktur persis:
{
  "refinedTitle": "Nama Aplikasi yang profesional dan menarik",
  "refinedDescription": "Deskripsi singkat yang berfokus pada solusi masalah dan arsitektur (1-2 paragraf)",
  "recommendedTheme": "cyber" | "emerald" | "indigo" | "light",
  "keyFeatures": [
    "Fitur 1 dengan deskripsi ringkas",
    "Fitur 2 dengan deskripsi ringkas",
    "Fitur 3 dengan deskripsi ringkas",
    "Fitur 4 dengan deskripsi ringkas",
    "Fitur 5 dengan deskripsi ringkas"
  ],
  "suggestedModules": [
    "Modul 1 (contoh: Dashboard)",
    "Modul 2 (contoh: Master Data)",
    "Modul 3 (contoh: Transaksi / Logika)",
    "Modul 4 (contoh: Laporan / Analytics)"
  ],
  "databaseSchema": [
    { "table": "users", "fields": ["id", "username", "role", "created_at"] },
    { "table": "items", "fields": ["id", "title", "status", "created_at"] }
  ]
}`;

    const llmRes = await callAgentLLM('EMP-PM', 'Kamu adalah AI Product Architect. Selalu output JSON valid.', prompt);
    let enrichedData: any = null;
    try {
      const match = llmRes.content.match(/\{[\s\S]*\}/);
      if (match) {
        enrichedData = JSON.parse(match[0]);
      }
    } catch (parseErr) {
      console.warn('[Enrich Spec JSON Parse Warning]:', parseErr);
    }

    if (!enrichedData) {
      enrichedData = {
        refinedTitle: title || 'SaaS Application',
        refinedDescription: description || 'Aplikasi otomatis berbasis arsitektur Express dan Tailwind CSS.',
        recommendedTheme: 'cyber',
        keyFeatures: [
          'Interactive Data Management & CRUD',
          'Live Activity Stream & Dashboard Analytics',
          'Responsive Dark/Light Visual Interface',
          'Export & Reporting Documentation'
        ],
        suggestedModules: ['Dashboard', 'Data Table', 'Analytics', 'Settings'],
        databaseSchema: [
          { table: 'items', fields: ['id', 'title', 'description', 'status', 'created_at'] }
        ]
      };
    }

    res.json({ success: true, data: enrichedData });
  } catch (error: any) {
    console.error('Error enriching spec:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. POST /api/projects/:id/tunnel/start (One-Click Instant Public Tunnel)
router.post('/:id/tunnel/start', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });

    const { id } = req.params;
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const project = projRes.rows[0];

    // Multi-tenant check
    if (user.role === 'CLIENT' && String(project.user_id || '').trim().toLowerCase() !== String(user.id || '').trim().toLowerCase()) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan pemilik proyek ini.' });
    }

    const port = project.port || 5001;

    // Check if existing tunnel process is still active
    if (activeTunnels[id]) {
      try {
        activeTunnels[id].kill('SIGTERM');
        delete activeTunnels[id];
      } catch (_) {}
    }

    let tunnelUrl = '';
    // Launch localhost.run SSH tunnel in background
    const tunnelProcess = spawn('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ServerAliveInterval=30',
      '-R', `80:localhost:${port}`,
      'nokey@localhost.run'
    ]);

    activeTunnels[id] = tunnelProcess;

    const timeoutPromise = new Promise<string>((resolve) => {
      const timer = setTimeout(() => resolve(''), 8000);

      const captureUrl = (data: Buffer) => {
        const text = data.toString();
        const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.lhr\.life|https:\/\/[a-zA-Z0-9.-]+\.localhost\.run/i);
        if (match && match[0]) {
          clearTimeout(timer);
          resolve(match[0]);
        }
      };

      tunnelProcess.stdout.on('data', captureUrl);
      tunnelProcess.stderr.on('data', captureUrl);
    });

    tunnelUrl = await timeoutPromise;

    // Fallback if localhost.run output delayed or rate-limited
    if (!tunnelUrl) {
      tunnelUrl = `http://${req.hostname || 'localhost'}:${port}`;
    }

    await pool.query('UPDATE projects SET tunnel_url = $1 WHERE id = $2', [tunnelUrl, id]);

    res.json({
      success: true,
      message: 'Tunnel public URL active',
      tunnel_url: tunnelUrl,
      project_id: id,
      port
    });
  } catch (error: any) {
    console.error('Error starting tunnel:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. POST /api/projects/:id/tunnel/stop (Stop Public Tunnel)
router.post('/:id/tunnel/stop', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });

    const { id } = req.params;
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const project = projRes.rows[0];

    // Multi-tenant check
    if (user.role === 'CLIENT' && String(project.user_id || '').trim().toLowerCase() !== String(user.id || '').trim().toLowerCase()) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan pemilik proyek ini.' });
    }

    if (activeTunnels[id]) {
      try {
        activeTunnels[id].kill('SIGTERM');
      } catch (_) {}
      delete activeTunnels[id];
    }
    await pool.query('UPDATE projects SET tunnel_url = NULL WHERE id = $1', [id]);
    res.json({ success: true, message: 'Tunnel stopped successfully', project_id: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Download Project Specification Template (.docx) for users to fill in requirements
router.get('/template/project-spec.docx', authenticateUser, async (req, res) => {
  try {
    const buffer = await generateProjectSpecTemplateDocx();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="Template_Spesifikasi_Proyek.docx"');
    res.send(buffer);
  } catch (err: any) {
    console.error('Error generating project spec template:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all projects (Strict Multi-Tenant Protection)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });
    }

    const { user_id } = req.query;
    let query = 'SELECT * FROM projects';
    const params: any[] = [];

    if (user.role === 'CLIENT') {
      // Client is STRICTLY restricted to projects with their own user_id
      query += ' WHERE user_id = $1';
      params.push(user.id);
    } else if (user.role === 'OWNER') {
      // Owner can view all or filter by specific client user_id
      if (user_id) {
        query += ' WHERE user_id = $1';
        params.push(user_id);
      }
    } else {
      return res.json([]);
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single project with its documents (Strict Multi-Tenant Protection)
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });

    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = projRes.rows[0];

    // Multi-tenant check
    if (user.role === 'CLIENT' && String(project.user_id || '').trim().toLowerCase() !== String(user.id || '').trim().toLowerCase()) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan pemilik proyek ini.' });
    }

    const docsRes = await pool.query('SELECT * FROM project_documents WHERE project_id = $1 ORDER BY created_at ASC', [req.params.id]);
    const costsRes = await pool.query('SELECT * FROM token_usages WHERE project_id = $1 ORDER BY created_at DESC', [req.params.id]);

    res.json({
      project: projRes.rows[0],
      documents: docsRes.rows,
      costs: costsRes.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to get recursive project file tree excluding node_modules & .git
function getProjectFileTree(dir: string, baseDir: string = dir): any[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result: any[] = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.DS_Store') continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      result.push({
        name: entry.name,
        path: relPath,
        type: 'directory',
        children: getProjectFileTree(fullPath, baseDir)
      });
    } else {
      let size = 0;
      try { size = fs.statSync(fullPath).size; } catch (_) {}
      result.push({
        name: entry.name,
        path: relPath,
        type: 'file',
        size
      });
    }
  }

  // Sort directories first, then files
  return result.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });
}

// 4. GET /api/projects/:id/files (List Project Source Code Files)
router.get('/:id/files', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    const project = projRes.rows[0];
    const projectDir = project.repo_path || path.join(process.env.PROJECTS_BASE_DIR || '/mnt/d/explore/result_projek', project.slug);

    if (!fs.existsSync(projectDir)) {
      return res.json({ files: [] });
    }

    const files = getProjectFileTree(projectDir, projectDir);
    res.json({ files });
  } catch (error: any) {
    console.error('Error fetching project files:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. GET /api/projects/:id/files/content (Read Source Code File Content)
router.get('/:id/files/content', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { filePath } = req.query;
    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' });
    }

    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    const project = projRes.rows[0];
    const projectDir = project.repo_path || path.join(process.env.PROJECTS_BASE_DIR || '/mnt/d/explore/result_projek', project.slug);

    // Prevent directory traversal attack
    const safeRelPath = path.normalize(String(filePath)).replace(/^(\.\.[\/\\])+/, '');
    const targetPath = path.join(projectDir, safeRelPath);

    if (!targetPath.startsWith(path.resolve(projectDir))) {
      return res.status(403).json({ error: 'Access denied outside project directory' });
    }

    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
      return res.status(404).json({ error: 'File tidak ditemukan' });
    }

    // Check if binary file
    const ext = path.extname(targetPath).toLowerCase();
    const binaryExts = ['.docx', '.xlsx', '.pdf', '.zip', '.png', '.jpg', '.jpeg', '.ico'];
    if (binaryExts.includes(ext)) {
      return res.json({ 
        filePath: safeRelPath, 
        isBinary: true, 
        content: `[Binary file: ${ext.toUpperCase()} - Silakan gunakan tombol download untuk melihat dokumen]` 
      });
    }

    const content = fs.readFileSync(targetPath, 'utf8');
    res.json({ filePath: safeRelPath, isBinary: false, content });
  } catch (error: any) {
    console.error('Error reading file content:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. POST /api/projects/:id/iterate (Autonomous In-Place Code Patching & Live PM2 Reload)
router.post('/:id/iterate', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt, iteration_type } = req.body;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });
    }

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Instruksi iterasi / prompt perubahan diperlukan' });
    }

    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    const project = projRes.rows[0];

    // Strict Multi-Tenant Protection:
    // Owner TIDAK BISA mengedit / memodifikasi proyek milik Klien (Read-Only Inspection Mode)
    const isOwner = user.role === 'OWNER';
    const isClient = user.role === 'CLIENT';
    const isProjectOwner = String(project.user_id || '').trim().toLowerCase() === String(user.id || '').trim().toLowerCase();

    if (isOwner && !isProjectOwner) {
      return res.status(403).json({
        error: 'Akses ditolak: Mode Inspeksi Read-Only. Demi menjaga integritas data klien, Owner tidak diizinkan memodifikasi source code milik klien.'
      });
    }

    if (isClient && !isProjectOwner) {
      return res.status(403).json({
        error: 'Akses ditolak: Anda bukan pemilik proyek ini.'
      });
    }

    const result = await iterateProjectPipeline(
      id,
      prompt.trim(),
      iteration_type || 'FEATURE_UPDATE',
      user?.id
    );

    res.json({
      success: true,
      message: `Iterasi ${result.versionTo} berhasil diterapkan & micro-app di-reload`,
      data: result
    });
  } catch (error: any) {
    console.error('Error iterating project:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. GET /api/projects/:id/revisions (Fetch Revision History)
router.get('/:id/revisions', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM project_revisions WHERE project_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching revisions:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. POST /api/projects/:id/chat-pm (Contextual Interactive PM Chat with Sarah Jenkins)
router.post('/:id/chat-pm', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const user = (req as any).user;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Pesan chat diperlukan' });
    }

    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project tidak ditemukan' });
    }
    const project = projRes.rows[0];

    const senderTitle = user ? (user.role === 'OWNER' ? 'Owner / Founder' : `Klien (${user.name})`) : 'Owner';
    const projectDir = project.repo_path || path.join(process.env.PROJECTS_BASE_DIR || '/mnt/d/explore/result_projek', project.slug);
    
    // Read quick summary of server.js and index.html if exists
    let codeOverview = '';
    const serverJsPath = path.join(projectDir, 'src', 'backend', 'server.js');
    const indexHtmlPath = path.join(projectDir, 'src', 'frontend', 'index.html');
    if (fs.existsSync(serverJsPath)) {
      codeOverview += `Backend endpoints (server.js excerpt):\n${fs.readFileSync(serverJsPath, 'utf8').slice(0, 1000)}\n\n`;
    }
    if (fs.existsSync(indexHtmlPath)) {
      codeOverview += `Frontend overview (index.html length: ${fs.statSync(indexHtmlPath).size} bytes)\n`;
    }

    const isOwner = user?.role === 'OWNER';
    const isProjectOwner = String(project.user_id || '').trim().toLowerCase() === String(user?.id || '').trim().toLowerCase();
    const isReadOnlyInspection = isOwner && !isProjectOwner;

    const systemPrompt = `Kamu adalah Sarah Jenkins, Senior Product Manager & Technical Lead untuk proyek "${project.title}".
Peranmu: Menjadi partner diskusi teknis & fungsional yang responsif, cerdas, solutif, dan ramah.
Kamu memahami arsitektur proyek, fitur yang sudah live pada port ${project.port}, serta riwayat versi (${project.version || 'v1.0'}).
${isReadOnlyInspection 
  ? 'PERHATIAN KHUSUS: Pengguna saat ini adalah Owner yang sedang dalam "Mode Inspeksi Read-Only" pada proyek milik klien. Berikan informasi asistensi, analisis arsitektur, atau review kualitas proyek, tetapi tegaskan dengan ramah bahwa perubahan kode dinonaktifkan dalam mode inspeksi demi menjaga integritas data klien.'
  : 'Jika pengguna menanyakan rekomendasi fitur atau meminta saran perbaikan, berikan opsi konkrit dan tawarkan bahwa kamu dan tim Dev (Devron & Anya) dapat langsung mengimplementasikannya melalui tombol iterasi/patching.'
}`;

    const userPrompt = `Pesan dari ${senderTitle}: "${message}"
Konteks Proyek:
- Judul: ${project.title}
- Deskripsi: ${project.description}
- Versi Saat Ini: ${project.version || 'v1.0'}
- Port Aktif: ${project.port}
- Ringkasan Terakhir: ${project.last_iteration_summary || 'Rilis awal v1.0'}
- Mode Akses: ${isReadOnlyInspection ? 'READ-ONLY INSPECTION (Owner tidak dapat mengedit kode klien)' : 'FULL EDIT & ITERATION'}
${codeOverview ? `- Ringkasan Kodingan: \n${codeOverview}` : ''}`;

    const llmRes = await callAgentLLM('EMP-PM', systemPrompt, userPrompt, project.id);

    res.json({
      reply: llmRes.content,
      agent: {
        id: 'EMP-PM',
        name: 'Sarah Jenkins',
        title: 'Senior Product Manager',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SarahPM'
      }
    });
  } catch (error: any) {
    console.error('Error in project PM chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download individual document file (.docx, .xlsx, .md) (Strict Multi-Tenant Protection)
router.get('/:id/download-file', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });

    const { id } = req.params;
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ error: 'Filename is required' });

    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const project = projRes.rows[0];

    // Multi-tenant check
    if (user.role === 'CLIENT' && String(project.user_id || '').trim().toLowerCase() !== String(user.id || '').trim().toLowerCase()) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan pemilik proyek ini.' });
    }

    const baseDir = project.repo_path || path.join(process.env.PROJECTS_BASE_DIR || '/mnt/d/explore/result_projek', project.slug);
    const filePath = path.join(baseDir, 'docs', String(filename));

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(filePath);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Download entire project as .ZIP with strong fallback and error resilience (Strict Multi-Tenant Protection)
router.get('/:id/download-zip', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });

    const { id } = req.params;
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const project = projRes.rows[0];

    // Multi-tenant check
    if (user.role === 'CLIENT' && String(project.user_id || '').trim().toLowerCase() !== String(user.id || '').trim().toLowerCase()) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan pemilik proyek ini.' });
    }

    const baseDir = project.repo_path || path.join(process.env.PROJECTS_BASE_DIR || '/mnt/d/explore/result_projek', project.slug);
    if (!fs.existsSync(baseDir)) {
      return res.status(404).json({ error: 'Project directory not found on disk: ' + baseDir });
    }

    const zipFilename = `${(project.slug || project.title || 'project').replace(/[^a-zA-Z0-9_-]/g, '_')}-bundle.zip`;
    const tempZipPath = path.join('/tmp', `${project.id}-${Date.now()}.zip`);

    // 1. Try native Linux zip
    let zipCreated = false;
    try {
      const zipCmd = `cd "${baseDir}" && zip -r -q "${tempZipPath}" . -x "node_modules/*" ".git/*"`;
      await execPromise(zipCmd);
      if (fs.existsSync(tempZipPath) && fs.statSync(tempZipPath).size > 0) {
        zipCreated = true;
      }
    } catch (zipErr) {
      console.warn('[Download Zip] Native zip command failed, falling back to python/tar...', zipErr);
    }

    // 2. Fallback using python zipfile if native zip failed
    if (!zipCreated) {
      try {
        const pythonZipScript = `
import os, zipfile
base_dir = "${baseDir}"
zip_path = "${tempZipPath}"
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(base_dir):
        if 'node_modules' in dirs: dirs.remove('node_modules')
        if '.git' in dirs: dirs.remove('.git')
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, base_dir)
            zipf.write(full_path, rel_path)
`;
        await execPromise(`python3 -c '${pythonZipScript.replace(/\n/g, ' ')}'`);
        if (fs.existsSync(tempZipPath) && fs.statSync(tempZipPath).size > 0) {
          zipCreated = true;
        }
      } catch (pyErr) {
        console.error('[Download Zip] Python zip fallback failed:', pyErr);
      }
    }

    if (zipCreated) {
      res.download(tempZipPath, zipFilename, (err) => {
        if (fs.existsSync(tempZipPath)) {
          try { fs.unlinkSync(tempZipPath); } catch (_) {}
        }
        if (err && !res.headersSent) {
          console.error('[Download Zip Error]:', err);
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to generate zip archive for project files.' });
    }
  } catch (err: any) {
    console.error('Error generating project zip:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// 9. GET /api/projects/:id/database (Interactive Database GUI Viewer)
router.get('/:id/database', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });

    const { id } = req.params;
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const project = projRes.rows[0];

    // Multi-tenant check
    if (user.role === 'CLIENT' && String(project.user_id || '').trim().toLowerCase() !== String(user.id || '').trim().toLowerCase()) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan pemilik proyek ini.' });
    }

    const projectDir = project.repo_path || path.join(process.env.PROJECTS_BASE_DIR || '/mnt/d/explore/result_projek', project.slug);
    const tables = extractProjectDatabase(projectDir);

    res.json({
      success: true,
      projectId: id,
      projectName: project.title || project.name,
      tables
    });
  } catch (error: any) {
    console.error('Error fetching project database tables:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper for SQL Type inference and escaping
function inferSqlColumnType(key: string, sampleVal: any): string {
  const k = key.toLowerCase();
  if (k === 'id') return 'INTEGER PRIMARY KEY';
  if (k.endsWith('_id')) return 'INTEGER';
  if (typeof sampleVal === 'number') {
    return Number.isInteger(sampleVal) ? 'INTEGER' : 'DECIMAL(12,2)';
  }
  if (typeof sampleVal === 'boolean') return 'BOOLEAN';
  if (k.includes('created_at') || k.includes('updated_at') || k.includes('due_date') || k.includes('date')) return 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
  if (k.includes('desc') || k.includes('note') || k.includes('content') || k.includes('payload') || k.includes('body') || k.includes('symptoms')) return 'TEXT';
  return 'VARCHAR(255)';
}

function escapeSqlValue(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isFinite(val) ? String(val) : 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'`;
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

// 9b. GET /api/projects/:id/database/export (Database Schema & Data Exporter - SQL & JSON)
router.get('/:id/database/export', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });

    const { id } = req.params;
    const format = String(req.query.format || 'schema').toLowerCase();
    const filterTable = req.query.table ? String(req.query.table).trim() : null;

    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const project = projRes.rows[0];

    // Multi-tenant check
    if (user.role === 'CLIENT' && String(project.user_id || '').trim().toLowerCase() !== String(user.id || '').trim().toLowerCase()) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan pemilik proyek ini.' });
    }

    const projectDir = project.repo_path || path.join(process.env.PROJECTS_BASE_DIR || '/mnt/d/explore/result_projek', project.slug);
    let tables = extractProjectDatabase(projectDir);

    if (filterTable) {
      tables = tables.filter(t => t.name.toLowerCase() === filterTable.toLowerCase());
      if (tables.length === 0) {
        return res.status(404).json({ error: `Table '${filterTable}' not found in project database.` });
      }
    }

    const fileSlug = project.slug || `project-${id}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (format === 'json') {
      const exportJson = {
        projectId: id,
        projectTitle: project.title || project.name,
        exportedAt: new Date().toISOString(),
        tables: tables.map(t => ({
          name: t.name,
          columns: t.columns,
          rowCount: t.rows?.length || 0,
          rows: t.rows || []
        }))
      };

      const filename = `${fileSlug}-database-${timestamp}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(JSON.stringify(exportJson, null, 2));
    }

    // Format: 'schema' OR 'data' / 'full' (SQL DDL / DML)
    const isFullData = format === 'data' || format === 'full';
    let sqlOutput = `-- =========================================================================\n`;
    sqlOutput += `-- VirtuLabs Autonomous Studio Database Dump\n`;
    sqlOutput += `-- Project: ${project.title || project.name} (${project.slug})\n`;
    sqlOutput += `-- Export Type: ${isFullData ? 'SQL Schema + Data (DDL & DML)' : 'SQL Schema Only (DDL)'}\n`;
    sqlOutput += `-- Exported At: ${new Date().toISOString()}\n`;
    sqlOutput += `-- Generated by VirtuLabs Company OS v2.2\n`;
    sqlOutput += `-- =========================================================================\n\n`;

    for (const table of tables) {
      sqlOutput += `-- -------------------------------------------------------------------------\n`;
      sqlOutput += `-- Table Structure for \`${table.name}\`\n`;
      sqlOutput += `-- -------------------------------------------------------------------------\n`;
      sqlOutput += `CREATE TABLE IF NOT EXISTS \`${table.name}\` (\n`;

      const columnDefs = table.columns.map(col => {
        const sampleVal = table.rows?.[0]?.[col];
        const colType = inferSqlColumnType(col, sampleVal);
        return `  \`${col}\` ${colType}`;
      });

      sqlOutput += columnDefs.join(',\n') + '\n);\n\n';

      if (isFullData && Array.isArray(table.rows) && table.rows.length > 0) {
        sqlOutput += `-- Dumping Data for \`${table.name}\` (${table.rows.length} records)\n`;
        const colNamesSql = table.columns.map(c => `\`${c}\``).join(', ');

        for (const row of table.rows) {
          const valuesSql = table.columns.map(c => escapeSqlValue(row[c])).join(', ');
          sqlOutput += `INSERT INTO \`${table.name}\` (${colNamesSql}) VALUES (${valuesSql});\n`;
        }
        sqlOutput += '\n';
      }
    }

    const filename = isFullData ? `${fileSlug}-database-${timestamp}.sql` : `${fileSlug}-schema-${timestamp}.sql`;
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(sqlOutput);
  } catch (error: any) {
    console.error('Error exporting project database:', error);
    res.status(500).json({ error: error.message });
  }
});

// 10. POST /api/projects/:id/approve (Formal Client Milestone Sign-Off)
router.post('/:id/approve', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });

    const { id } = req.params;
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) return res.status(404).json({ error: 'Project tidak ditemukan' });
    const project = projRes.rows[0];

    // Only project owner (Client) or Owner can sign-off
    if (user.role === 'CLIENT' && String(project.user_id || '').trim().toLowerCase() !== String(user.id || '').trim().toLowerCase()) {
      return res.status(403).json({ error: 'Akses ditolak: Hanya pemilik proyek yang berhak menyetujui spesifikasi.' });
    }

    await continueApprovedPipeline(id);

    res.json({
      success: true,
      message: 'Spesifikasi telah disetujui. Pipeline otomatis melanjutkan tahap coding & deployment.',
      projectId: id
    });
  } catch (error: any) {
    console.error('Error approving project spec:', error);
    res.status(500).json({ error: error.message });
  }
});

// 11. POST /api/projects/:id/request-spec-revision (Request Spec/PRD Revision before coding)
router.post('/:id/request-spec-revision', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });

    const { id } = req.params;
    const { feedback } = req.body;
    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ error: 'Catatan feedback / revisi spesifikasi diperlukan' });
    }

    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) return res.status(404).json({ error: 'Project tidak ditemukan' });
    const project = projRes.rows[0];

    if (user.role === 'CLIENT' && String(project.user_id || '').trim().toLowerCase() !== String(user.id || '').trim().toLowerCase()) {
      return res.status(403).json({ error: 'Akses ditolak: Hanya pemilik proyek yang berhak meminta revisi.' });
    }

    const result = await reviseProjectSpec(id, feedback.trim());
    res.json(result);
  } catch (error: any) {
    console.error('Error requesting spec revision:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST Create new project (Strict Multi-Tenant & Auth Protected)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });
    }

    const creatorUserId = user.id;
    const creatorName = user.name;

    const { 
      title, 
      name, 
      description, 
      goal, 
      custom_port, 
      target_dir, 
      images,
      theme,
      includeAuth,
      storageType,
      attachedDocs,
      requireApproval
    } = req.body;
    const projectTitle = title || name;
    if (!projectTitle) {
      return res.status(400).json({ error: 'Title / name is required' });
    }

    const slug = projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    const projectId = `PROJ-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Dynamic Safe Port Allocation to avoid port collision
    let assignedPort = custom_port;
    if (!assignedPort) {
      const portRes = await pool.query('SELECT MAX(port) as max_port FROM projects');
      const maxDbPort = portRes.rows[0].max_port ? parseInt(portRes.rows[0].max_port, 10) + 1 : 5001;
      assignedPort = await getNextAvailablePort(maxDbPort);
    } else {
      assignedPort = parseInt(String(assignedPort), 10);
    }

    const baseDir = target_dir && target_dir.trim() ? target_dir.trim() : (process.env.PROJECTS_BASE_DIR || '/mnt/d/explore/result_projek');
    const projectDir = path.join(baseDir, slug);

    const isApprovalRequired = Boolean(requireApproval);

    const newProject = await pool.query(
      `INSERT INTO projects (id, company_id, user_id, title, slug, description, goal, port, status, current_stage, progress_percentage, repo_path, approval_required, approval_status)
       VALUES ($1, 'COMP-001', $2, $3, $4, $5, $6, $7, 'INITIATED', 'Discovery & Spec', 5, $8, $9, $10)
       RETURNING *`,
      [
        projectId, 
        creatorUserId, 
        projectTitle, 
        slug, 
        description || projectTitle, 
        goal || description || projectTitle, 
        assignedPort, 
        projectDir,
        isApprovalRequired,
        isApprovalRequired ? 'PENDING' : 'NONE'
      ]
    );

    await logActivity('RESEARCH', `${creatorName} menginisiasi proyek baru: "${projectTitle}"`, 'EMP-OWNER', projectId);

    // Trigger async pipeline in background with enterprise options
    runProjectPipeline(projectId, { 
      images,
      theme: theme || 'cyber',
      includeAuth: Boolean(includeAuth),
      storageType: storageType || 'memory',
      attachedDocs: attachedDocs || [],
      requireApproval: isApprovalRequired
    }).catch(err => {
      console.error(`[Pipeline Async Error for ${projectId}]:`, err);
    });

    res.status(201).json(newProject.rows[0]);
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE Project with full cleanup (Strict Multi-Tenant Protection)
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });

    const { id } = req.params;
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = projRes.rows[0];

    // Multi-tenant check: Client can only delete their own project, Owner can delete any
    if (user.role === 'CLIENT' && String(project.user_id || '').trim().toLowerCase() !== String(user.id || '').trim().toLowerCase()) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan pemilik proyek ini.' });
    }

    // 1. PM2 Cleanup
    if (project.pm2_name) {
      try {
        await execPromise(`pm2 delete "${project.pm2_name}" 2>/dev/null || true`);
      } catch (pm2Err) {
        console.warn(`[Cleanup Warning] PM2 process delete failed: ${project.pm2_name}`, pm2Err);
      }
    }

    // 2. Active Tunnel Cleanup
    if (activeTunnels[id]) {
      try {
        activeTunnels[id].kill('SIGTERM');
        delete activeTunnels[id];
      } catch (_) {}
    }

    // 3. Filesystem Cleanup
    const candidatePaths: string[] = [];
    if (project.repo_path) candidatePaths.push(project.repo_path);
    if (project.slug) {
      candidatePaths.push(path.join('/mnt/d/explore/result_projek', project.slug));
      candidatePaths.push(path.join('/mnt/d/explore/virtual-company/projects', project.slug));
    }
    if (project.id) {
      candidatePaths.push(path.join('/mnt/d/explore/result_projek', project.id));
      candidatePaths.push(path.join('/mnt/d/explore/virtual-company/projects', project.id));
    }

    const uniquePaths = Array.from(new Set(candidatePaths));
    for (const targetPath of uniquePaths) {
      if (fs.existsSync(targetPath)) {
        try {
          fs.rmSync(targetPath, { recursive: true, force: true });
          console.log(`[Project Cleanup] Successfully removed directory: ${targetPath}`);
        } catch (fsErr) {
          console.warn(`[Cleanup Warning] Filesystem removal failed for: ${targetPath}`, fsErr);
        }
      }
    }

    // 4. Database Cleanup
    await pool.query('DELETE FROM project_revisions WHERE project_id = $1', [id]).catch(() => {});
    await pool.query('DELETE FROM project_documents WHERE project_id = $1', [id]).catch(() => {});
    await pool.query('DELETE FROM token_usages WHERE project_id = $1', [id]).catch(() => {});
    await pool.query('DELETE FROM chat_messages WHERE project_id = $1', [id]).catch(() => {});
    await pool.query('DELETE FROM activity_logs WHERE project_id = $1', [id]).catch(() => {});
    await pool.query('DELETE FROM tasks WHERE project_id = $1', [id]).catch(() => {});
    await pool.query('DELETE FROM documents WHERE project_id = $1', [id]).catch(() => {});
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);

    await logActivity('SYSTEM', `Project "${project.title || project.name || id}" berhasil dihapus beserta resource PM2 dan direktori filesystem.`, 'EMP-OWNER');

    res.json({
      success: true,
      message: `Project ${id} deleted successfully.`,
      project: { id: project.id, title: project.title || project.name }
    });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: error.message });
  }
});


// Embedded Live Preview Reverse Proxy for External / Remote Access
router.all('/:id/preview*', async (req, res) => {
  try {
    const { id } = req.params;
    const projRes = await pool.query('SELECT port FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) {
      return res.status(404).send('Project tidak ditemukan');
    }
    const targetPort = projRes.rows[0].port || 5001;
    
    // Calculate subpath
    const subpath = req.url.replace(new RegExp(`^/${id}/preview`), '') || '/';
    
    const options = {
      hostname: '127.0.0.1',
      port: targetPort,
      path: subpath,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${targetPort}`
      }
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.status(502).send(`<html><body style="background:#0f172a;color:#f87171;font-family:sans-serif;padding:2rem;"><h3>Preview Loading...</h3><p>Aplikasi sedang booting pada port ${targetPort}. Silakan refresh.</p></body></html>`);
    });

    req.pipe(proxyReq);
  } catch (err) {
    res.status(500).send('Proxy internal error');
  }
});

export default router;
