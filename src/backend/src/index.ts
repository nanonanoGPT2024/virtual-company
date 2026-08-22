import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection } from './config/db.js';

// Import routes with extension for NodeNext resolution
import tasksRouter from './routes/tasks.js';
import ideasRouter from './routes/ideas.js';
import agentsRouter from './routes/agents.js';
import documentsRouter from './routes/documents.js';
import brainRouter from './routes/brain.js';
import factoryRouter from './routes/factory.js';
import researchRouter from './routes/research.js';
import marketingRouter from './routes/marketing.js';
import executiveRouter from './routes/executive.js';
import chatRouter from './routes/chat.js';
import projectsRouter from './routes/projects.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health Check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Root route removed to let static frontend files serve on /

// Map routes
app.use('/api/tasks', tasksRouter);
app.use('/api/ideas', ideasRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/brain', brainRouter);
app.use('/api/factory', factoryRouter);
app.use('/api/research', researchRouter);
app.use('/api/marketing', marketingRouter);
app.use('/api/executive', executiveRouter);
app.use('/api/chat', chatRouter);
app.use('/api/projects', projectsRouter);

// Serve static frontend files from dist-prod
const distPath = '/mnt/d/explore/virtual-company/src/frontend/dist-prod';
app.use(express.static(distPath));

// Serve index.html for any frontend routing, except API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start the server
const startServer = async () => {
  console.log('Starting server...');
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log('Database connected successfully.');
  } else {
    console.warn('Warning: Database connection failed. Running server without database connection.');
  }

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();
