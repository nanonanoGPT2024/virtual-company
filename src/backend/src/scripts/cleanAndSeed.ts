import path from 'path';
import { Pool } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '/mnt/d/explore/virtual-company/src/backend/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'company_os',
});

const JWT_SECRET = process.env.JWT_SECRET || 'virtulabs-company-os-secret-2026';
function hashPassword(password: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(password).digest('hex');
}

async function cleanAndSeed() {
  console.log('--- Cleaning database records ---');

  // 1. Clean old simulation data
  await pool.query('DELETE FROM activity_logs').catch(() => {});
  await pool.query('DELETE FROM project_documents').catch(() => {});
  await pool.query('DELETE FROM token_usages').catch(() => {});
  await pool.query('DELETE FROM chat_messages').catch(() => {});
  await pool.query('DELETE FROM ideas').catch(() => {});
  await pool.query('DELETE FROM projects').catch(() => {});
  await pool.query('DELETE FROM users').catch(() => {});

  console.log('--- Seeding clean multi-tenant users ---');

  // Seed Users
  const users = [
    {
      id: 'USR-OWNER-001',
      name: 'Nano (Root Owner)',
      email: 'nano@company.os',
      password: hashPassword('owner123'),
      role: 'OWNER'
    },
    {
      id: 'USR-CLIENT-A',
      name: 'Budi Santoso (Client A)',
      email: 'client_a@example.com',
      password: hashPassword('password123'),
      role: 'CLIENT'
    },
    {
      id: 'USR-CLIENT-B',
      name: 'Siti Rahma (Client B)',
      email: 'client_b@example.com',
      password: hashPassword('password123'),
      role: 'CLIENT'
    }
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [u.id, u.name, u.email, u.password, u.role]
    );
  }

  console.log('--- Seeding clean isolated projects ---');

  // Seed Projects
  const projects = [
    {
      id: 'PROJ-BUDI-01',
      company_id: 'COMP-001',
      user_id: 'USR-CLIENT-A',
      title: 'Sistem Kasir & POS Coffee Shop Budi',
      slug: 'sistem-kasir-pos-budi',
      description: 'Point-of-Sale kasir cafe modern dengan pelacakan inventaris bahan baku real-time dan laporan laba-rugi otomatis.',
      goal: 'Otomasi transaksi kasir cafe dan stok kopi secara terpadu.',
      port: 5001,
      status: 'DEPLOYED',
      current_stage: 'Live Deployed',
      progress_percentage: 100,
      pm2_name: 'proj-sistem-kasir-pos-budi',
      live_url: 'http://localhost:5001',
      repo_path: '/mnt/d/explore/result_projek/sistem-kasir-pos-budi',
      total_token_cost_usd: '0.0384'
    },
    {
      id: 'PROJ-SITI-01',
      company_id: 'COMP-001',
      user_id: 'USR-CLIENT-B',
      title: 'Portal HR & Absensi Digital PT Rahma',
      slug: 'portal-hr-absensi-rahma',
      description: 'Aplikasi pengelolaan SDM, absensi berbasis geolocation GPS, pengajuan cuti digital, dan rekap penggajian bulanan.',
      goal: 'Digitalisasi manajemen karyawan dan kehadiran karyawan.',
      port: 5002,
      status: 'DEPLOYED',
      current_stage: 'Live Deployed',
      progress_percentage: 100,
      pm2_name: 'proj-portal-hr-absensi-rahma',
      live_url: 'http://localhost:5002',
      repo_path: '/mnt/d/explore/result_projek/portal-hr-absensi-rahma',
      total_token_cost_usd: '0.0412'
    }
  ];

  for (const p of projects) {
    await pool.query(
      `INSERT INTO projects (id, company_id, user_id, title, slug, description, goal, port, status, current_stage, progress_percentage, pm2_name, live_url, repo_path, total_token_cost_usd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [p.id, p.company_id, p.user_id, p.title, p.slug, p.description, p.goal, p.port, p.status, p.current_stage, p.progress_percentage, p.pm2_name, p.live_url, p.repo_path, p.total_token_cost_usd]
    );

    // Create project documents
    await pool.query(
      `INSERT INTO project_documents (project_id, doc_type, title, content, author_agent_id, file_path)
       VALUES ($1, 'PRD', '01_PRD.md', $2, 'EMP-PM', 'docs/01_PRD.md')`,
      [p.id, `# PRD: ${p.title}\n\n## 1. Ringkasan Eksekutif\n${p.description}\n\n## 2. Kriteria Penerimaan\n- Sistem transaksi cepat\n- Integrasi database aman\n- Desain responsif Tailwind CSS.`]
    );

    await pool.query(
      `INSERT INTO project_documents (project_id, doc_type, title, content, author_agent_id, file_path)
       VALUES ($1, 'ARCHITECTURE', '03_Architecture_API.md', $2, 'EMP-ARCH', 'docs/03_Architecture_API.md')`,
      [p.id, `# Arsitektur Sistem: ${p.title}\n\n- Backend: Express REST API (Port ${p.port})\n- Frontend: HTML5 / Tailwind / Lucide Icons\n- Deploy: PM2 Process Manager.`]
    );
  }

  console.log('--- Seeding clean isolated activity logs & ideas ---');

  // Activity Logs for Client A (PROJ-BUDI-01)
  await pool.query(
    `INSERT INTO activity_logs (action_type, summary, agent_id, department_id, project_id, details)
     VALUES 
     ('WRITE_SPEC', 'Sarah (PM) merilis PRD untuk Sistem Kasir Cafe Budi', 'EMP-PM', 'DEP-PROD', 'PROJ-BUDI-01', '{"status":"DONE"}'),
     ('CODE_GEN', 'Devron (Dev) menyelesaikan kode Express & POS Frontend Cafe Budi', 'EMP-DEV', 'DEP-ENG', 'PROJ-BUDI-01', '{"status":"DEPLOYED"}')`
  );

  // Activity Logs for Client B (PROJ-SITI-01)
  await pool.query(
    `INSERT INTO activity_logs (action_type, summary, agent_id, department_id, project_id, details)
     VALUES 
     ('WRITE_SPEC', 'Elena (CPO) memfinalisasi UI/UX Portal HR PT Rahma', 'EMP-CPO', 'DEP-PROD', 'PROJ-SITI-01', '{"status":"DONE"}'),
     ('DEPLOY', 'Cipher (DevOps) mendeploy Portal HR & Absensi ke Port 5002', 'EMP-OPS', 'DEP-ENG', 'PROJ-SITI-01', '{"status":"ONLINE"}')`
  );

  // Ideas for Client A
  await pool.query(
    `INSERT INTO ideas (user_id, title, problem_statement, target_audience, proposed_solution, market_potential_score, estimated_revenue_usd, estimated_dev_time_mins)
     VALUES ('USR-CLIENT-A', 'Loyalty App & Promo QR Cafe', 'Pelanggan cafe sering kehilangan kartu stempel fisik.', 'Pelanggan Cafe & Resto', 'Aplikasi loyalty point scan QR code via WhatsApp.', 92, 6000, 5)`
  );

  // Ideas for Client B
  await pool.query(
    `INSERT INTO ideas (user_id, title, problem_statement, target_audience, proposed_solution, market_potential_score, estimated_revenue_usd, estimated_dev_time_mins)
     VALUES ('USR-CLIENT-B', 'Slip Gaji Otomatis & Reimburse Karyawan', 'Proses reimburse manual makan waktu 3 minggu.', 'Perusahaan & HR Staff', 'Modul pengajuan reimburse klaim struk foto via mobile portal.', 89, 7500, 5)`
  );

  console.log('✅ Clean multi-tenant seeding successful!');
  process.exit(0);
}

cleanAndSeed().catch(err => {
  console.error('Error during cleanup and seeding:', err);
  process.exit(1);
});
