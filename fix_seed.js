const { Pool } = require('/mnt/d/explore/virtual-company/src/backend/node_modules/pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5433/company_os' });

async function fixSeed() {
  await pool.query(`
    INSERT INTO projects (id, company_id, user_id, title, slug, description, goal, port, status, current_stage, progress_percentage, repo_path)
    VALUES (
      'PROJ-SITI-01',
      'COMP-001',
      'USR-CLIENT-B',
      'MedikaCare - Rekam Medis & Antrean Poliklinik Digital',
      'medikacare-rekam-medis-poliklinik',
      'Sistem informasi manajemen rumah sakit dan rekam medis elektronik berbasis web.',
      'Memodernisasi sistem antrean pasien dan rekam medis digital klinik Pratama.',
      5002,
      'LIVE',
      'Deployment & Go-Live',
      100,
      '/mnt/d/explore/result_projek/medikacare-rekam-medis-poliklinik'
    )
    ON CONFLICT (id) DO UPDATE SET user_id = 'USR-CLIENT-B', title = 'MedikaCare - Rekam Medis & Antrean Poliklinik Digital';
  `);

  await pool.query(`
    INSERT INTO activity_logs (project_id, agent_id, action_type, summary)
    VALUES 
      ('PROJ-SITI-01', 'EMP-CPO', 'WRITE_SPEC', 'Elena (CPO) merancang modul Rekam Medis ICD-10 MedikaCare'),
      ('PROJ-SITI-01', 'EMP-OPS', 'DEPLOY', 'Cipher (DevOps) mendeploy MedikaCare SIMRS ke Port 5002')
    ON CONFLICT DO NOTHING;
  `);

  console.log('Seed fixed successfully!');
  await pool.end();
}

fixSeed().catch(console.error);
