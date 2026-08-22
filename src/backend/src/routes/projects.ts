import { Router } from 'express';
import { pool } from '../config/db';
import { runProjectPipeline } from '../services/projectPipeline';
import { logActivity } from '../services/activityService';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const router = Router();

// GET all projects
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
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

// POST Create new project & trigger fast parallel pipeline
router.post('/', async (req, res) => {
  try {
    const { title, description, goal, custom_port } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    const projectId = `PROJ-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Find next available port if not specified (starting from 5001)
    let assignedPort = custom_port;
    if (!assignedPort) {
      const portRes = await pool.query('SELECT MAX(port) as max_port FROM projects');
      const maxPort = portRes.rows[0].max_port;
      assignedPort = maxPort ? parseInt(maxPort, 10) + 1 : 5001;
    }

    const newProject = await pool.query(
      `INSERT INTO projects (id, company_id, title, slug, description, goal, port, status, current_stage, progress_percentage)
       VALUES ($1, 'COMP-001', $2, $3, $4, $5, $6, 'INITIATED', 'Discovery & Spec', 5)
       RETURNING *`,
      [projectId, title, slug, description || title, goal || description || title, assignedPort]
    );

    await logActivity('RESEARCH', `Owner (Nano) menginisiasi proyek baru: "${title}"`, 'EMP-OWNER', projectId);

    // Trigger pipeline in background without blocking response
    setImmediate(() => {
      runProjectPipeline(projectId).catch(err => console.error('[Pipeline Background Error]:', err));
    });

    res.status(201).json({
      message: 'Project created & pipeline started in background',
      project: newProject.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Control PM2 (start, stop, restart)
router.post('/:id/pm2/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const project = projRes.rows[0];

    if (!project.pm2_name) return res.status(400).json({ error: 'Project has not been deployed to PM2 yet' });

    if (action === 'start') {
      await execPromise(`pm2 start "${project.pm2_name}"`);
      await pool.query("UPDATE projects SET status = 'DEPLOYED' WHERE id = $1", [id]);
    } else if (action === 'stop') {
      await execPromise(`pm2 stop "${project.pm2_name}"`);
      await pool.query("UPDATE projects SET status = 'STOPPED' WHERE id = $1", [id]);
    } else if (action === 'restart') {
      await execPromise(`pm2 restart "${project.pm2_name}"`);
      await pool.query("UPDATE projects SET status = 'DEPLOYED' WHERE id = $1", [id]);
    }

    res.json({ message: `PM2 action ${action} executed successfully`, project_id: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
