import { Router } from 'express';
import { pool } from '../config/db';
import { callAgentLLM } from '../services/llmService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ideas ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Scan market & auto-generate new business idea
router.post('/scan', async (req, res) => {
  try {
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
      `INSERT INTO ideas (title, problem_statement, target_audience, proposed_solution, market_potential_score, estimated_revenue_usd, estimated_dev_time_mins)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [ideaData.title, ideaData.problem_statement, ideaData.target_audience, ideaData.proposed_solution, ideaData.market_potential_score || 85, ideaData.estimated_revenue_usd || 5000, ideaData.estimated_dev_time_mins || 5]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
