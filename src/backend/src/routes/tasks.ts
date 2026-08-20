import { Router, RequestHandler } from 'express';
import pool from '../config/db.js';

const router = Router();

const getTasks: RequestHandler = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

const createTask: RequestHandler = async (req, res) => {
  const { title, goal, project_id, department_id, assignee_id, reviewer_id, priority, deadline, budget_usd } = req.body;
  if (!title || !goal) {
    res.status(400).json({ success: false, message: 'Title and Goal are required' });
    return;
  }

  try {
    const query = `
      INSERT INTO tasks (title, goal, project_id, department_id, assignee_id, reviewer_id, priority, deadline, budget_usd, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'BACKLOG')
      RETURNING *
    `;
    const values = [
      title,
      goal,
      project_id || null,
      department_id || null,
      assignee_id || null,
      reviewer_id || null,
      priority || 'MEDIUM',
      deadline || null,
      budget_usd || 0.00
    ];
    const result = await pool.query(query, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

const updateTask: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Filter out read-only fields
  const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  if (keys.length === 0) {
    res.status(400).json({ success: false, message: 'No fields to update' });
    return;
  }

  const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
  const values = keys.map(key => updates[key]);

  try {
    const query = `
      UPDATE tasks 
      SET ${setClause} 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id, ...values]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);

export default router;
