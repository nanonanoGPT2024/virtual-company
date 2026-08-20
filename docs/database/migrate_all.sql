-- Consolidated PostgreSQL Migration & Seed Script for AI Virtual Company OS
-- Includes full schema creation and master data seeding (15 Agents, 6 Departments, Projects, Tasks, Ideas)
-- Suitable for setting up the database on a fresh PC/environment.

-- Enable pgvector extension for semantic searches/brain memory
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================================
-- 1. SCHEMA DEFINITION
-- =========================================================================

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    budget_usd NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agents / Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    daily_ai_limit_usd NUMERIC(10, 2) DEFAULT 10.00,
    monthly_ai_limit_usd NUMERIC(10, 2) DEFAULT 200.00,
    autonomy_level INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    budget_usd NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PLANNING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    goal TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    assignee_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    reviewer_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    deadline TIMESTAMP WITH TIME ZONE,
    budget_usd NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'BACKLOG',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ideas Table
CREATE TABLE IF NOT EXISTS ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    problem TEXT,
    solution TEXT,
    target_audience TEXT,
    market_size TEXT,
    competitor_analysis TEXT,
    cost_estimate_usd NUMERIC(12, 2),
    revenue_projection_usd NUMERIC(12, 2),
    score NUMERIC(5, 2),
    status VARCHAR(50) DEFAULT 'GENERATED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    version INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial Logs Table
CREATE TABLE IF NOT EXISTS financial_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    agent_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    amount_usd NUMERIC(10, 4) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Company Brain Table
CREATE TABLE IF NOT EXISTS company_brain (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    reference_id UUID,
    content TEXT NOT NULL,
    embedding VECTOR(768),
    meta_tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================================
-- 2. MASTER DATA SEEDING
-- =========================================================================

-- 2.1 Insert Company
INSERT INTO companies (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'AI Virtual Company Inc.')
ON CONFLICT (id) DO NOTHING;

-- 2.2 Insert Departments
INSERT INTO departments (id, company_id, name, budget_usd)
VALUES 
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Executive', 100000.00),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Engineering', 50000.00),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Product', 25000.00),
('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'Finance', 30000.00),
('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'Marketing & Growth', 40000.00),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Sales', 20000.00)
ON CONFLICT (id) DO NOTHING;

-- 2.3 Insert C-Level Executive & Employees
INSERT INTO employees (id, company_id, name, title, department_id, manager_id, daily_ai_limit_usd, monthly_ai_limit_usd, autonomy_level)
VALUES
('EMP-EXE-001', '11111111-1111-1111-1111-111111111111', 'Sovereign', 'CEO', '22222222-2222-2222-2222-222222222222', NULL, 50.00, 1000.00, 3),
('EMP-ENG-001', '11111111-1111-1111-1111-111111111111', 'Alex', 'Senior Software Architect', '33333333-3333-3333-3333-333333333333', 'EMP-EXE-001', 15.00, 350.00, 2),
('EMP-ENG-002', '11111111-1111-1111-1111-111111111111', 'Elena', 'CTO', '33333333-3333-3333-3333-333333333333', 'EMP-EXE-001', 30.00, 600.00, 3),
('EMP-PRD-001', '11111111-1111-1111-1111-111111111111', 'Marcus', 'CPO', '44444444-4444-4444-4444-444444444444', 'EMP-EXE-001', 25.00, 500.00, 3),
('EMP-FIN-001', '11111111-1111-1111-1111-111111111111', 'Sophia', 'CFO', '88888888-8888-8888-8888-888888888888', 'EMP-EXE-001', 25.00, 500.00, 3),
('EMP-MKT-001', '11111111-1111-1111-1111-111111111111', 'Diana', 'CMO', '99999999-9999-9999-9999-999999999999', 'EMP-EXE-001', 20.00, 400.00, 3),
('EMP-SLS-001', '11111111-1111-1111-1111-111111111111', 'Jack', 'CRO', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMP-EXE-001', 20.00, 400.00, 3),
('EMP-PRD-002', '11111111-1111-1111-1111-111111111111', 'Sarah', 'Product Manager', '44444444-4444-4444-4444-444444444444', 'EMP-PRD-001', 15.00, 300.00, 2),
('EMP-PRD-003', '11111111-1111-1111-1111-111111111111', 'Clara', 'UX Specialist', '44444444-4444-4444-4444-444444444444', 'EMP-PRD-001', 10.00, 200.00, 2),
('EMP-PRD-004', '11111111-1111-1111-1111-111111111111', 'Ryan', 'Researcher', '44444444-4444-4444-4444-444444444444', 'EMP-PRD-001', 10.00, 200.00, 2),
('EMP-ENG-003', '11111111-1111-1111-1111-111111111111', 'Liam', 'Developer (Backend)', '33333333-3333-3333-3333-333333333333', 'EMP-ENG-002', 15.00, 300.00, 2),
('EMP-ENG-004', '11111111-1111-1111-1111-111111111111', 'Noah', 'Developer (Frontend)', '33333333-3333-3333-3333-333333333333', 'EMP-ENG-002', 15.00, 300.00, 2),
('EMP-ENG-005', '11111111-1111-1111-1111-111111111111', 'Emma', 'QA Engineer', '33333333-3333-3333-3333-333333333333', 'EMP-ENG-002', 10.00, 200.00, 2),
('EMP-ENG-006', '11111111-1111-1111-1111-111111111111', 'Lucas', 'DevOps / SRE', '33333333-3333-3333-3333-333333333333', 'EMP-ENG-002', 12.00, 250.00, 2),
('EMP-FIN-002', '11111111-1111-1111-1111-111111111111', 'Chloe', 'Financial Ops', '88888888-8888-8888-8888-888888888888', 'EMP-FIN-001', 10.00, 200.00, 2)
ON CONFLICT (id) DO NOTHING;

-- 2.4 Insert Projects
INSERT INTO projects (id, company_id, name, description, budget_usd, status)
VALUES
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'AI Virtual Company OS', 'Sistem operasi berbasis multi-agent otonom untuk mensimulasikan operasional perusahaan.', 10000.00, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 2.5 Insert Tasks
INSERT INTO tasks (id, title, goal, project_id, department_id, assignee_id, reviewer_id, priority, deadline, budget_usd, status)
VALUES
('66666666-6666-6666-6666-666666666666', 'Initialize Backend Boilerplate', 'Create a clean starting point for the backend server with basic CRUD routing.', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'EMP-ENG-001', 'EMP-EXE-001', 'HIGH', '2026-08-25 00:00:00+00', 0.00, 'IN_PROGRESS')
ON CONFLICT (id) DO NOTHING;

-- 2.6 Insert Ideas
INSERT INTO ideas (id, company_id, title, problem, solution, target_audience, market_size, competitor_analysis, cost_estimate_usd, revenue_projection_usd, score, status)
VALUES
('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'AI Agent Cost Accounting Auditor', 'Tracking LLM expenses dynamically across multiple sub-agents is hard to centralize.', 'Build a middleware proxy with micro-budget limitations and event-based warning hooks.', 'Virtual Companies / Multi-agent ecosystems', '$500M potential market', 'None with automated workflow budget capping', 15000.00, 120000.00, 8.50, 'APPROVED')
ON CONFLICT (id) DO NOTHING;
