import { Router } from 'express';
import { pool } from '../config/db';
import { callAgentLLM } from '../services/llmService';
import { authenticateUser } from './auth';

const router = Router();

// GET /api/ideas (Multi-tenant isolated)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { user_id } = req.query;

    let query = 'SELECT * FROM ideas';
    const params: any[] = [];

    if (user && user.role === 'CLIENT') {
      // Client only sees their own scanned ideas or global starter ideas (user_id IS NULL)
      query += ' WHERE user_id = $1 OR user_id IS NULL';
      params.push(user.id);
    } else if (user_id) {
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

// Scan market & auto-generate new business idea with creator's user_id
router.post('/scan', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const creatorUserId = user ? user.id : 'USR-OWNER-001';

    const scanPrompt = `Kamu adalah Lead Market Researcher (Dr. Aris).
Lakukan market scan dan temukan 1 ide produk/software SaaS/micro-tool inovatif yang dibutuhkan pasar saat ini.
Berikan respon JSON murni tanpa markdown wrapper:
{
  "title": "Nama Ide",
  "problem_statement": "Masalah utama yang diselesaikan",
  "target_audience": "Target pengguna",
  "proposed_solution": "Solusi fitur utama",
  "market_potential_score": 90,
  "estimated_revenue_usd": 5000,
  "estimated_dev_time_mins": 5
}`;

    const llmRes = await callAgentLLM('EMP-RES', 'Kamu adalah Dr. Aris (Researcher Agent).', scanPrompt);
    let ideaData;
    try {
      const cleaned = llmRes.content.replace(/```json/g, '').replace(/```/g, '').trim();
      ideaData = JSON.parse(cleaned);
    } catch {
      ideaData = {
        title: "Automated Invoice & Reminder Bot",
        problem_statement: "Banyak freelancer kesulitan melacak tagihan invoice yang belum dibayar.",
        target_audience: "Freelancer & UMKM",
        proposed_solution: "Aplikasi webhook WhatsApp reminder otomatis untuk invoice jatuh tempo.",
        market_potential_score: 88,
        estimated_revenue_usd: 4500,
        estimated_dev_time_mins: 5
      };
    }

    const inserted = await pool.query(
      `INSERT INTO ideas (user_id, title, problem_statement, target_audience, proposed_solution, market_potential_score, estimated_revenue_usd, estimated_dev_time_mins)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        creatorUserId,
        ideaData.title,
        ideaData.problem_statement,
        ideaData.target_audience,
        ideaData.proposed_solution,
        ideaData.market_potential_score || 85,
        ideaData.estimated_revenue_usd || 5000,
        ideaData.estimated_dev_time_mins || 5
      ]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
