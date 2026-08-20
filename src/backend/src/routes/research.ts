import { Router, RequestHandler } from 'express';
import pool from '../config/db.js';

const router = Router();

// Simulated list of trend words, problem statements, target audiences etc. to generate business ideas
const TRENDS = ['AI-Powered', 'Decentralized', 'Automated', 'SaaS', 'Eco-friendly', 'Micro-SaaS', 'No-code', 'Collaborative'];
const SECTORS = ['HR Tech', 'FinTech', 'LegalTech', 'DevOps', 'Sales Enablement', 'Customer Support', 'Creator Economy', 'Logistics'];
const PROBLEMS = [
  'Managing high volumes of documents manually leads to errors and layout shift issues.',
  'Attributing marketing conversion across five different channels with private data restriction is impossible.',
  'Local AI agents run out of memory or budget without dynamic limit auditing features.',
  'Finding high-quality royalty-free video frames takes hours of manual filtering.',
  'Small businesses struggle to schedule social media updates at optimal times across global timezones.'
];
const SOLUTIONS = [
  'Create a vector-embedded layout pipeline with automated validation.',
  'Deploy a cookie-less privacy-first agent tracking middleware that acts as a financial ledger.',
  'Build a top-down visualization grid monitor matching standard ERP configurations.',
  'Develop an automated frame extraction CLI with vision-language filtering tools.',
  'Launch a multi-agent publisher engine that handles automatic translations and scheduling.'
];
const AUDIENCES = [
  'AI virtual companies, developer operations engineers',
  'Marketing managers, freelance copywriters',
  'Remote engineers, local project managers',
  'Video editors, creators, media agencies',
  'B2B SaaS companies, product teams'
];

const scanTrends: RequestHandler = async (req, res) => {
  try {
    // Generate simulated details
    const trend = TRENDS[Math.floor(Math.random() * TRENDS.length)];
    const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
    const title = `${trend} ${sector} Platform`;
    const problem = PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)];
    const solution = SOLUTIONS[Math.floor(Math.random() * SOLUTIONS.length)];
    const target_audience = AUDIENCES[Math.floor(Math.random() * AUDIENCES.length)];
    
    const market_size = `$${(Math.random() * 900 + 100).toFixed(0)}M potential market`;
    const competitor_analysis = 'Few competitors in automated niche; high barrier to entry';
    const cost_estimate_usd = parseFloat((Math.random() * 20000 + 5000).toFixed(2));
    const revenue_projection_usd = parseFloat((Math.random() * 150000 + 30000).toFixed(2));
    const score = parseFloat((Math.random() * 4 + 6).toFixed(2)); // score between 6.0 and 10.0
    
    // Use default company ID from seed data
    const company_id = '11111111-1111-1111-1111-111111111111';

    const insertQuery = `
      INSERT INTO ideas (
        company_id, title, problem, solution, target_audience, 
        market_size, competitor_analysis, cost_estimate_usd, 
        revenue_projection_usd, score, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'GENERATED')
      RETURNING *
    `;

    const values = [
      company_id,
      title,
      problem,
      solution,
      target_audience,
      market_size,
      competitor_analysis,
      cost_estimate_usd,
      revenue_projection_usd,
      score
    ];

    const result = await pool.query(insertQuery, values);
    
    res.status(201).json({
      success: true,
      message: 'Trend scan completed and new business idea generated.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error generating trend idea:', error);
    res.status(500).json({ success: false, message: 'Database error generating trend idea' });
  }
};

const getIdeas: RequestHandler = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ideas ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching ideas:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

router.post('/scan', scanTrends);
router.get('/ideas', getIdeas);

export default router;
