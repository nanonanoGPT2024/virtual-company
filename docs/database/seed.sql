-- Seed initial data for AI Virtual Company OS

-- 1. Insert Company
INSERT INTO companies (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'AI Virtual Company Inc.')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Departments
INSERT INTO departments (id, company_id, name, budget_usd)
VALUES 
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Executive', 100000.00),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Engineering', 50000.00),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Product', 25000.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Employees
INSERT INTO employees (id, company_id, name, title, department_id, manager_id, daily_ai_limit_usd, monthly_ai_limit_usd, autonomy_level)
VALUES
('EMP-EXE-001', '11111111-1111-1111-1111-111111111111', 'Sovereign', 'CEO', '22222222-2222-2222-2222-222222222222', NULL, 50.00, 1000.00, 3),
('EMP-ENG-001', '11111111-1111-1111-1111-111111111111', 'Alex', 'Senior Software Architect', '33333333-3333-3333-3333-333333333333', 'EMP-EXE-001', 15.00, 350.00, 2)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Projects
INSERT INTO projects (id, company_id, name, description, budget_usd, status)
VALUES
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'AI Virtual Company OS', 'Sistem operasi berbasis multi-agent otonom untuk mensimulasikan operasional perusahaan.', 10000.00, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Tasks
INSERT INTO tasks (id, title, goal, project_id, department_id, assignee_id, reviewer_id, priority, deadline, budget_usd, status)
VALUES
('66666666-6666-6666-6666-666666666666', 'Initialize Backend Boilerplate', 'Create a clean starting point for the backend server with basic CRUD routing.', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'EMP-ENG-001', 'EMP-EXE-001', 'HIGH', '2026-08-25 00:00:00+00', 0.00, 'IN_PROGRESS')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Ideas
INSERT INTO ideas (id, company_id, title, problem, solution, target_audience, market_size, competitor_analysis, cost_estimate_usd, revenue_projection_usd, score, status)
VALUES
('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'AI Agent Cost Accounting Auditor', 'Tracking LLM expenses dynamically across multiple sub-agents is hard to centralize.', 'Build a middleware proxy with micro-budget limitations and event-based warning hooks.', 'Virtual Companies / Multi-agent ecosystems', '$500M potential market', 'None with automated workflow budget capping', 15000.00, 120000.00, 8.50, 'APPROVED')
ON CONFLICT (id) DO NOTHING;
