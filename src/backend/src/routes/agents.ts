import { Router, RequestHandler } from 'express';
import pool from '../config/db.js';

const router = Router();

const getAgents: RequestHandler = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

const getAgentById: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching employee by id:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

router.get('/', getAgents);
router.get('/:id', getAgentById);

export default router;
