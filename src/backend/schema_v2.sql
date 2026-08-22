-- ==============================================================================
-- AI VIRTUAL COMPANY OS - SCHEMA V2.0 (CLEAN REDESIGN)
-- ==============================================================================

DROP TABLE IF EXISTS token_usages CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS project_documents CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS ideas CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- 1. Companies
CREATE TABLE companies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    vision TEXT,
    mission TEXT,
    budget_usd NUMERIC(15, 2) DEFAULT 10000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments
CREATE TABLE departments (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Employees (14 AI Agents + 1 Owner)
CREATE TABLE employees (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id) ON DELETE CASCADE,
    department_id VARCHAR(50) REFERENCES departments(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255),
    system_prompt TEXT,
    status VARCHAR(50) DEFAULT 'IDLE', -- IDLE, WORKING, TESTING, SYNCING, OFFLINE
    daily_ai_limit_usd NUMERIC(10, 2) DEFAULT 50.00,
    ai_cost_used_today NUMERIC(10, 4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Projects
CREATE TABLE projects (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    goal TEXT,
    status VARCHAR(50) DEFAULT 'INITIATED', -- INITIATED, SPECIFYING, BUILDING, TESTING, DEPLOYED, FAILED
    current_stage VARCHAR(100) DEFAULT 'Discovery & Spec',
    progress_percentage INT DEFAULT 0,
    pm2_name VARCHAR(100),
    port INT,
    live_url VARCHAR(255),
    repo_path VARCHAR(255),
    total_token_cost_usd NUMERIC(10, 4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Project Documents (8 Standard Markdown Documents)
CREATE TABLE project_documents (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    doc_type VARCHAR(100) NOT NULL, -- PRD, USERFLOW, ARCHITECTURE, QA_REPORT, SECURITY_AUDIT, LEGAL_TERMS, USER_MANUAL, SALES_PITCH
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_agent_id VARCHAR(50) REFERENCES employees(id),
    file_path VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Ideas Radar
CREATE TABLE ideas (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title VARCHAR(255) NOT NULL,
    problem_statement TEXT,
    target_audience TEXT,
    proposed_solution TEXT,
    market_potential_score INT DEFAULT 85,
    estimated_revenue_usd NUMERIC(15, 2),
    estimated_dev_time_mins INT DEFAULT 5,
    status VARCHAR(50) DEFAULT 'DISCOVERED', -- DISCOVERED, APPROVED, REJECTED, CONVERTED_TO_PROJECT
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Activity Logs (Real-time Stream)
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE SET NULL,
    agent_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    department_id VARCHAR(50) REFERENCES departments(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- RESEARCH, WRITE_SPEC, CODE_GEN, TEST_RUN, DEPLOY, CHAT, IDEA_SCAN
    summary TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Chat Messages (1-on-1 & War Room)
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    room_type VARCHAR(50) DEFAULT 'WAR_ROOM', -- WAR_ROOM, DIRECT, PROJECT
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE SET NULL,
    sender_type VARCHAR(20) NOT NULL, -- HUMAN, AGENT
    sender_id VARCHAR(50) NOT NULL,
    recipient_id VARCHAR(50), -- null if war room
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Token & AI Cost Usages
CREATE TABLE token_usages (
    id BIGSERIAL PRIMARY KEY,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE SET NULL,
    agent_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    model_name VARCHAR(100) NOT NULL,
    input_tokens INT NOT NULL,
    output_tokens INT NOT NULL,
    cost_usd NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
