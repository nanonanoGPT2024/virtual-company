import { Router, RequestHandler } from 'express';
import pool from '../config/db.js';

const router = Router();

// GET /api/projects - List all projects with nested tasks & documents
const getProjects: RequestHandler = async (req, res) => {
  try {
    const projectsRes = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    const tasksRes = await pool.query('SELECT * FROM tasks ORDER BY created_at ASC');
    const docsRes = await pool.query('SELECT * FROM documents ORDER BY created_at ASC');

    const projectsWithDetails = projectsRes.rows.map((project) => {
      const projectTasks = tasksRes.rows.filter((t) => t.project_id === project.id);
      const projectDocs = docsRes.rows.filter((d) => d.project_id === project.id);
      return {
        ...project,
        tasks: projectTasks,
        documents: projectDocs
      };
    });

    res.json({ success: true, data: projectsWithDetails });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: `Database error: ${error.message}` });
  }
};

// POST /api/projects - Create a new project and initialize division pipeline tasks
const createProject: RequestHandler = async (req, res) => {
  const { name, description, budget_usd } = req.body;

  if (!name || name.trim() === '') {
    res.status(400).json({ success: false, message: 'Project name is required' });
    return;
  }

  try {
    const compRes = await pool.query('SELECT id FROM companies LIMIT 1');
    const companyId = compRes.rows[0]?.id || '11111111-1111-1111-1111-111111111111';

    // 1. Insert Project
    const projQuery = `
      INSERT INTO projects (company_id, name, description, budget_usd, status)
      VALUES ($1, $2, $3, $4, 'ACTIVE')
      RETURNING *
    `;
    const projRes = await pool.query(projQuery, [
      companyId,
      name,
      description || 'Project baru otomatis dari pipeline AI Virtual Company.',
      budget_usd || 15000.00
    ]);
    const newProject = projRes.rows[0];

    // 2. Initialize Standard Pipeline Tasks for this Project
    const tasksToCreate = [
      {
        title: 'Executive Strategic Assessment & Budget Lock',
        goal: `Menetapkan model bisnis, batasan modal token, dan ROI untuk project ${name}.`,
        assignee_id: 'EMP-EXE-001',
        priority: 'HIGH'
      },
      {
        title: 'Product Scope & UX Flow Specification (PRD)',
        goal: `Menyusun dokumen PRD, user stories, dan daftar deliverable fitur ${name}.`,
        assignee_id: 'EMP-EXE-004',
        priority: 'HIGH'
      },
      {
        title: 'Core System Implementation & Code Generator',
        goal: `Membangun arsitektur (ADR), setup folder kode di WSL, dan menulis logika backend/frontend.`,
        assignee_id: 'EMP-ENG-001',
        priority: 'CRITICAL'
      },
      {
        title: 'Automated QA Testing & Security Audit',
        goal: `Menjalankan unit test, e2e simulation, dan verifikasi bug report.`,
        assignee_id: 'EMP-QA-101',
        priority: 'HIGH'
      },
      {
        title: 'DevOps Deployment & Containerization in WSL',
        goal: `Setup Docker container, binding port lokal, dan deploy runtime aplikasi di lingkungan WSL.`,
        assignee_id: 'EMP-OPS-101',
        priority: 'CRITICAL'
      },
      {
        title: 'Market Launch & Growth Release Announcement',
        goal: `Merilis materi promosi, rilis release notes publik, dan kick-off campaign.`,
        assignee_id: 'EMP-MKT-001',
        priority: 'MEDIUM'
      }
    ];

    for (const t of tasksToCreate) {
      await pool.query(
        `INSERT INTO tasks (title, goal, project_id, assignee_id, priority, status)
         VALUES ($1, $2, $3, $4, $5, 'READY')`,
        [t.title, t.goal, newProject.id, t.assignee_id, t.priority]
      );
    }

    // 3. Create starter Architecture & DevOps spec doc
    await pool.query(
      `INSERT INTO documents (project_id, type, title, content, version)
       VALUES ($1, 'PRD', $2, $3, 1)`,
      [
        newProject.id,
        `PRD: ${newProject.name}`,
        `# PROJECT REQUIREMENTS DOCUMENT (PRD)\n**Project:** ${newProject.name}\n**Status:** INITIALIZED\n**Target Deploy:** WSL / Docker Container\n\n## Ringkasan Project\n${newProject.description}\n\n## Pipeline Divisi:\n1. Executive Inisiasi\n2. Product PRD\n3. Engineering Coding\n4. QA Testing\n5. DevOps Deployment (WSL Port auto-bind)\n6. Marketing Launch`
      ]
    );

    res.status(201).json({
      success: true,
      message: `Project ${name} berhasil dibuat dengan 6 alur tahapan divisi lengkap termasuk DevOps Deployment.`,
      data: newProject
    });
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: `Database error: ${error.message}` });
  }
};

router.get('/', getProjects);
router.post('/', createProject);

export default router;
