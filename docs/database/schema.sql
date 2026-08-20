-- Database Schema for AI Virtual Company OS
-- Mapped for PostgreSQL with pgvector support

-- Enable pgvector extension for semantic searches/brain memory
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    budget_usd NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Agents / Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'EMP-ENG-001'
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(100) NOT NULL, -- e.g. Senior Software Architect
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    daily_ai_limit_usd NUMERIC(10, 2) DEFAULT 10.00,
    monthly_ai_limit_usd NUMERIC(10, 2) DEFAULT 200.00,
    autonomy_level INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    budget_usd NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PLANNING', -- PLANNING, ACTIVE, PAUSED, COMPLETED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    goal TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    assignee_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    reviewer_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    deadline TIMESTAMP WITH TIME ZONE,
    budget_usd NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'BACKLOG', -- BACKLOG, READY, IN_PROGRESS, IN_REVIEW, COMPLETED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Ideas Table (Idea Engine)
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
    status VARCHAR(50) DEFAULT 'GENERATED', -- GENERATED, RESEARCHING, VALIDATING, APPROVED, REJECTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Documents Table (Documentation Hierarchy)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- BUSINESS_CASE, BRD, PRD, UX_SPEC, FSD, HLD, LLD, API_SPEC, ADR
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    version INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Financial Logs Table (AI Cost Accounting)
CREATE TABLE IF NOT EXISTS financial_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    agent_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    amount_usd NUMERIC(10, 4) NOT NULL,
    type VARCHAR(50) NOT NULL, -- AI_TOKENS, INFRASTRUCTURE, OTHER
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Company Brain / Memory Table (pgvector storage)
CREATE TABLE IF NOT EXISTS company_brain (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    reference_id UUID, -- Links to documents, tasks, or ideas if applicable
    content TEXT NOT NULL,
    embedding VECTOR(768), -- Gemma-based 768d local embeddings
    meta_tags TEXT[], -- Array of tags/categories
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
