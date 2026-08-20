import { Router, RequestHandler } from 'express';
import pool from '../config/db.js';

const router = Router();

const getIdeas: RequestHandler = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ideas ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching ideas:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

const createIdea: RequestHandler = async (req, res) => {
  const { title, problem, solution, target_audience, market_size, competitor_analysis, cost_estimate_usd, revenue_projection_usd, score, company_id } = req.body;
  if (!title || !problem || !solution) {
    res.status(400).json({ success: false, message: 'Title, problem, and solution are required' });
    return;
  }

  try {
    const query = `
      INSERT INTO ideas (title, problem, solution, target_audience, market_size, competitor_analysis, cost_estimate_usd, revenue_projection_usd, score, company_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'GENERATED')
      RETURNING *
    `;
    const values = [
      title,
      problem,
      solution,
      target_audience || null,
      market_size || null,
      competitor_analysis || null,
      cost_estimate_usd || null,
      revenue_projection_usd || null,
      score || 5.0,
      company_id || '11111111-1111-1111-1111-111111111111'
    ];
    const result = await pool.query(query, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating idea:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

const updateIdea: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  if (keys.length === 0) {
    res.status(400).json({ success: false, message: 'No fields to update' });
    return;
  }

  const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
  const values = keys.map(key => updates[key]);

  try {
    const query = `
      UPDATE ideas 
      SET ${setClause} 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id, ...values]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Idea not found' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating idea:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

router.get('/', getIdeas);
router.post('/', createIdea);
router.put('/:id', updateIdea);

export default router;
