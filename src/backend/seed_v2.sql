-- ==============================================================================
-- AI VIRTUAL COMPANY OS - SEED DATA V2.0 (14 AGENTS + 1 OWNER)
-- ==============================================================================

-- 1. Company
INSERT INTO companies (id, name, vision, mission, budget_usd) VALUES
('COMP-001', 'VirtuLabs AI Studio', 'Membangun ekosistem software otonom kelas dunia berbasis multi-agent AI.', 'Menemukan peluang pasar dan memproduksi software siap pakai secara end-to-end dengan efisiensi maksimal.', 50000.00)
ON CONFLICT (id) DO NOTHING;

-- 2. Departments
INSERT INTO departments (id, company_id, name, code, description) VALUES
('DEP-EXEC', 'COMP-001', 'Executive & Leadership', 'EXEC', 'Kepemimpinan strategis dan orkestrasi perusahaan.'),
('DEP-PROD', 'COMP-001', 'Product & Design', 'PROD', 'Riset pasar, penyusunan spesifikasi produk (PRD), dan desain UX.'),
('DEP-ENG',  'COMP-001', 'Engineering & Technology', 'ENG', 'Arsitektur software, fullstack development, dan deployment.'),
('DEP-QA',   'COMP-001', 'Quality Assurance & Security', 'QA', 'Pengujian fungsionalitas, keamanan kode, dan verifikasi rilis.'),
('DEP-FIN',  'COMP-001', 'Finance & Legal Operations', 'FIN', 'Manajemen biaya token AI, pricing strategy, dan kepatuhan hukum/Terms.'),
('DEP-COMM', 'COMP-001', 'Commercial & Growth', 'COMM', 'Pemasaran produk, copywriting, dan akuisisi klien potensial.')
ON CONFLICT (id) DO NOTHING;

-- 3. Employees / Agents (14 AI Agents + 1 Owner)
INSERT INTO employees (id, company_id, department_id, name, role, title, avatar_url, system_prompt, status) VALUES
-- Executive
('EMP-OWNER', 'COMP-001', 'DEP-EXEC', 'Nano', 'Owner', 'Founder & Chief Owner', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nano', 'Owner tertinggi pemegang visi dan veto proyek.', 'IDLE'),
('EMP-CEO',   'COMP-001', 'DEP-EXEC', 'Chief Aura (CEO)', 'CEO', 'Chief Executive Officer', 'https://api.dicebear.com/7.x/bottts/svg?seed=AuraCEO', 'CEO yang mengorkestrasi pipeline proyek, membagi target ke C-Level, dan melaporkan progress ke Owner.', 'IDLE'),

-- Product & Design
('EMP-CPO',   'COMP-001', 'DEP-PROD', 'Elena Vance (CPO)', 'CPO', 'Chief Product Officer', 'https://api.dicebear.com/7.x/bottts/svg?seed=ElenaCPO', 'Pimpinan produk yang memastikan setiap ide memiliki nilai bisnis dan memandu PRD serta UX.', 'IDLE'),
('EMP-RES',   'COMP-001', 'DEP-PROD', 'Dr. Aris (Researcher)', 'Researcher', 'Lead Market Researcher', 'https://api.dicebear.com/7.x/bottts/svg?seed=ArisRes', 'Pakar riset pasar, scanning tren industri, analisis kompetitor, dan validasi ide bisnis.', 'IDLE'),
('EMP-PM',    'COMP-001', 'DEP-PROD', 'Sarah Jenkins (PM)', 'Product Manager', 'Senior Product Manager', 'https://api.dicebear.com/7.x/bottts/svg?seed=SarahPM', 'Product Manager yang menyusun PRD.md secara mendalam, user stories, dan acceptance criteria.', 'IDLE'),
('EMP-UX',    'COMP-001', 'DEP-PROD', 'Kaelen (UI/UX Spec)', 'UX Designer', 'Lead UI/UX Architect', 'https://api.dicebear.com/7.x/bottts/svg?seed=KaelenUX', 'Merancang alur navigasi user flow, layout wireframe modern, dan panduan desain UI.', 'IDLE'),

-- Engineering & Technology
('EMP-CTO',   'COMP-001', 'DEP-ENG',  'Marcus Sterling (CTO)', 'CTO', 'Chief Technology Officer', 'https://api.dicebear.com/7.x/bottts/svg?seed=MarcusCTO', 'Pimpinan teknologi yang menentukan arsitektur standar, performa, dan keandalan sistem.', 'IDLE'),
('EMP-ARCH',  'COMP-001', 'DEP-ENG',  'Viktor Cruz (Architect)', 'Architect', 'Principal Software Architect', 'https://api.dicebear.com/7.x/bottts/svg?seed=ViktorArch', 'Merancang skema database, kontrak REST API, modularitas kode, dan struktur direktori.', 'IDLE'),
('EMP-DEV',   'COMP-001', 'DEP-ENG',  'Devron (Fullstack Dev)', 'Developer', 'Lead Fullstack Engineer', 'https://api.dicebear.com/7.x/bottts/svg?seed=DevronDev', 'Menulis kode backend (Node.js/Express) dan frontend (React/Tailwind) berkualitas tinggi.', 'IDLE'),
('EMP-OPS',   'COMP-001', 'DEP-ENG',  'Cipher (DevOps / SRE)', 'DevOps', 'Cloud & Site Reliability Engineer', 'https://api.dicebear.com/7.x/bottts/svg?seed=CipherOps', 'Mengelola scaffolding proyek, script build, dan deployment otomatis ke process manager PM2.', 'IDLE'),

-- Quality & Security
('EMP-QA',    'COMP-001', 'DEP-QA',   'Tessa (SQA Engineer)', 'QA Engineer', 'Lead Quality Assurance Engineer', 'https://api.dicebear.com/7.x/bottts/svg?seed=TessaQA', 'Menjalankan pengujian otomatis, validasi acceptance criteria, dan membuat laporan QA.', 'IDLE'),
('EMP-SEC',   'COMP-001', 'DEP-QA',   'Sentinel (Sec Auditor)', 'Security Auditor', 'Cybersecurity & Compliance Lead', 'https://api.dicebear.com/7.x/bottts/svg?seed=SentinelSec', 'Memindai celah keamanan, sanitasi input, audit autentikasi, dan perlindungan data rahasia.', 'IDLE'),

-- Finance & Legal
('EMP-CFO',   'COMP-001', 'DEP-FIN',  'Morgan Drake (CFO)', 'CFO', 'Chief Financial Officer', 'https://api.dicebear.com/7.x/bottts/svg?seed=MorganCFO', 'Mengawasi penggunaan token AI, cost accounting, dan estimasi valuasi/pricing software.', 'IDLE'),
('EMP-LEG',   'COMP-001', 'DEP-FIN',  'Justicia (Legal & Terms)', 'Legal Counsel', 'Software Legal & Compliance Specialist', 'https://api.dicebear.com/7.x/bottts/svg?seed=JusticiaLeg', 'Menyusun dokumen hukum, Privacy Policy, Terms of Service, dan lisensi software.', 'IDLE'),
('EMP-TECHW', 'COMP-001', 'DEP-FIN',  'Page (Tech Writer)', 'Tech Writer', 'Lead Documentation Specialist', 'https://api.dicebear.com/7.x/bottts/svg?seed=PageDoc', 'Menulis panduan pengguna (User Manual), dokumentasi API, dan panduan onboarding.', 'IDLE'),

-- Commercial & Growth
('EMP-MKT',   'COMP-001', 'DEP-COMM', 'Vibe (Marketing Copy)', 'Marketer', 'Growth & Marketing Copywriter', 'https://api.dicebear.com/7.x/bottts/svg?seed=VibeMkt', 'Menulis copy landing page menarik, tagline produk, dan pengumuman rilis pasar.', 'IDLE'),
('EMP-CRO',   'COMP-001', 'DEP-COMM', 'Hunter (Sales Lead)', 'Sales / CRO', 'Chief Revenue & Client Acquisition', 'https://api.dicebear.com/7.x/bottts/svg?seed=HunterSales', 'Menyusun pitch proposal penawaran, mengidentifikasi target klien potensial, dan email outreach.', 'IDLE')
ON CONFLICT (id) DO NOTHING;

-- Initial Activity Log
INSERT INTO activity_logs (action_type, summary, details) VALUES
('IDEA_SCAN', 'VirtuLabs AI Studio berhasil diinisialisasi ulang dengan PRD v2.0.', '{"status": "READY", "agents_count": 15}'::jsonb);

-- Initial War Room Chat
INSERT INTO chat_messages (room_type, sender_type, sender_id, message) VALUES
('WAR_ROOM', 'AGENT', 'EMP-CEO', 'Selamat datang di VirtuLabs AI Studio v2.0. Seluruh divisi (Executive, Product, Engineering, QA & Security, Finance & Legal, Commercial) siap menerima mandat proyek baru dari Owner!');
