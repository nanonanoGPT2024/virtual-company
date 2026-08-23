import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db';
import projectsRouter from './routes/projects';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import agentsRouter from './routes/agents';
import chatRouter from './routes/chat';
import activitiesRouter from './routes/activities';
import ideasRouter from './routes/ideas';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Health Check
app.get('/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      db_time: dbRes.rows[0].now,
      version: '2.1.0'
    });
  } catch (error: any) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// Company Overview / Stats
app.get('/api/company', async (req, res) => {
  try {
    const compRes = await pool.query('SELECT * FROM companies LIMIT 1');
    const deptRes = await pool.query('SELECT * FROM departments ORDER BY code ASC');
    const empRes = await pool.query('SELECT * FROM employees ORDER BY id ASC');
    const projCount = await pool.query('SELECT count(*) FROM projects');

    res.json({
      company: compRes.rows[0] || null,
      departments: deptRes.rows,
      employees: empRes.rows,
      total_projects: parseInt(projCount.rows[0].count, 10)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/template', projectsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/ideas', ideasRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Company OS v2.1] Backend running on port ${PORT}`);
});
