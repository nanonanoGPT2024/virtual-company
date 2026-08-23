import path from 'path';
import fs from 'fs';
import { Router } from 'express';
import { pool } from '../config/db';
import { runProjectPipeline } from '../services/projectPipeline';
import { logActivity } from '../services/activityService';
import { generateProjectSpecTemplateDocx } from '../services/docExportService';
import { authenticateUser } from './auth';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const router = Router();

// Download Project Specification Template (.docx) for users to fill in requirements
router.get('/template/project-spec.docx', async (req, res) => {
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

// GET all projects (RBAC protected: CLIENT sees only their projects, OWNER sees all)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { user_id } = req.query;

    let query = 'SELECT * FROM projects';
    const params: any[] = [];

    if (user && user.role === 'CLIENT') {
      // Client is restricted to their own projects
      query += ' WHERE user_id = $1';
      params.push(user.id);
    } else if (user_id) {
      // Owner or filtered query by user_id
      query += ' WHERE user_id = $1';
      params.push(user_id);
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single project with its documents
router.get('/:id', async (req, res) => {
  try {
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
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

// Download individual document file (.docx, .xlsx, .md)
router.get('/:id/download-file', async (req, res) => {
  try {
    const { id } = req.params;
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ error: 'Filename is required' });

    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const project = projRes.rows[0];

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

// Download entire project as .ZIP with strong fallback and error resilience
router.get('/:id/download-zip', async (req, res) => {
  try {
    const { id } = req.params;
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const project = projRes.rows[0];

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

// POST Create new project
router.post('/', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const creatorUserId = user ? user.id : 'USR-OWNER-001';
    const creatorName = user ? user.name : 'Nano (Owner)';

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
      attachedDocs
    } = req.body;
    const projectTitle = title || name;
    if (!projectTitle) {
      return res.status(400).json({ error: 'Title / name is required' });
    }

    const slug = projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    const projectId = `PROJ-${Math.floor(1000 + Math.random() * 9000)}`;
    
    let assignedPort = custom_port;
    if (!assignedPort) {
      const portRes = await pool.query('SELECT MAX(port) as max_port FROM projects');
      const maxPort = portRes.rows[0].max_port;
      assignedPort = maxPort ? parseInt(maxPort, 10) + 1 : 5001;
    }

    const baseDir = target_dir && target_dir.trim() ? target_dir.trim() : (process.env.PROJECTS_BASE_DIR || '/mnt/d/explore/result_projek');
    const projectDir = path.join(baseDir, slug);

    const newProject = await pool.query(
      `INSERT INTO projects (id, company_id, user_id, title, slug, description, goal, port, status, current_stage, progress_percentage, repo_path)
       VALUES ($1, 'COMP-001', $2, $3, $4, $5, $6, $7, 'INITIATED', 'Discovery & Spec', 5, $8)
       RETURNING *`,
      [projectId, creatorUserId, projectTitle, slug, description || projectTitle, goal || description || projectTitle, assignedPort, projectDir]
    );

    await logActivity('RESEARCH', `${creatorName} menginisiasi proyek baru: "${projectTitle}"`, 'EMP-OWNER', projectId);

    // Trigger async pipeline in background with enterprise options
    runProjectPipeline(projectId, { 
      images,
      theme: theme || 'cyber',
      includeAuth: Boolean(includeAuth),
      storageType: storageType || 'memory',
      attachedDocs: attachedDocs || []
    }).catch(err => {
      console.error(`[Pipeline Async Error for ${projectId}]:`, err);
    });

    res.status(201).json(newProject.rows[0]);
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE Project with full cleanup
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = projRes.rows[0];

    // 1. PM2 Cleanup
    if (project.pm2_name) {
      try {
        await execPromise(`pm2 delete "${project.pm2_name}" 2>/dev/null || true`);
      } catch (pm2Err) {
        console.warn(`[Cleanup Warning] PM2 process delete failed: ${project.pm2_name}`, pm2Err);
      }
    }

    // 2. Filesystem Cleanup
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

    // 3. Database Cleanup
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

export default router;
