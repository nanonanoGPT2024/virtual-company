import { Router } from 'express';
import { pool } from '../config/db';
import { authenticateUser } from './auth';

const router = Router();

// GET /api/activities (Multi-tenant isolated)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { department_id, project_id, user_id, limit = 50, sort = 'ASC' } = req.query;

    let query = `
      SELECT a.*, e.name as agent_name, e.role as agent_role, e.avatar_url as agent_avatar,
             d.name as department_name, d.code as department_code,
             p.title as project_title, p.user_id as project_user_id
      FROM activity_logs a
      LEFT JOIN employees e ON a.agent_id = e.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN projects p ON a.project_id = p.id
    `;
    const whereConditions: string[] = [];
    const params: any[] = [];

    // Tenant Isolation
    if (user && user.role === 'CLIENT') {
      // Client only sees activities associated with their own projects
      whereConditions.push(`a.project_id IN (SELECT id FROM projects WHERE user_id = $${params.length + 1})`);
      params.push(user.id);
    } else if (user_id) {
      // Owner inspecting specific user's projects
      whereConditions.push(`a.project_id IN (SELECT id FROM projects WHERE user_id = $${params.length + 1})`);
      params.push(user_id);
    }

    if (department_id) {
      whereConditions.push(`a.department_id = $${params.length + 1}`);
      params.push(department_id);
    } else if (project_id) {
      whereConditions.push(`a.project_id = $${params.length + 1}`);
      params.push(project_id);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ` + whereConditions.join(' AND ');
    }

    const sortOrder = String(sort).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY a.created_at ${sortOrder} LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
