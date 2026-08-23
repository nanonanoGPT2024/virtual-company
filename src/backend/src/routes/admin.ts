import { Router } from 'express';
import { pool } from '../config/db';
import { authenticateUser } from './auth';

const router = Router();

// Middleware: Strict Owner Authorization
const requireOwner = (req: any, res: any, next: any) => {
  const user = req.user;
  if (!user || user.role !== 'OWNER') {
    return res.status(403).json({ error: 'Akses ditolak. Fitur ini hanya untuk Root Owner.' });
  }
  next();
};

// 1. GET /api/admin/users - List all users with project stats
router.get('/users', authenticateUser, requireOwner, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
             COUNT(p.id)::int as total_projects,
             COALESCE(SUM(p.total_token_cost_usd), 0) as total_spent_usd
      FROM users u
      LEFT JOIN projects p ON u.id = p.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, users: result.rows });
  } catch (err: any) {
    console.error('[Admin Users Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/admin/users/:userId/projects - List projects by user
router.get('/users/:userId/projects', authenticateUser, requireOwner, async (req, res) => {
  try {
    const { userId } = req.params;
    const userRes = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const projRes = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      user: userRes.rows[0],
      projects: projRes.rows
    });
  } catch (err: any) {
    console.error('[Admin User Projects Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
