import { Router } from 'express';
import { pool } from '../config/db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { department_id, project_id, limit = 50, sort = 'ASC' } = req.query;
    let query = `
      SELECT a.*, e.name as agent_name, e.role as agent_role, e.avatar_url as agent_avatar,
             d.name as department_name, d.code as department_code,
             p.title as project_title
      FROM activity_logs a
      LEFT JOIN employees e ON a.agent_id = e.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN projects p ON a.project_id = p.id
    `;
    const params: any[] = [];

    if (department_id) {
      query += ` WHERE a.department_id = $1`;
      params.push(department_id);
    } else if (project_id) {
      query += ` WHERE a.project_id = $1`;
      params.push(project_id);
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
