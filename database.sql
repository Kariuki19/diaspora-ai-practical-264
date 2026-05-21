-- ============================================================================
-- DIASPORA TASK MANAGER - DATABASE DUMP
-- ============================================================================
-- This file contains the complete, production-ready schema and sample dataset
-- for the Diaspora AI Task Manager. It incorporates UUID primary keys, JSONB 
-- fields for AI metadata, strict enum intents, and transaction risk tracking.
-- ============================================================================

-- Enable the UUID extension if not already available in the PostgreSQL instance
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the table if it already exists to ensure a clean setup
DROP TABLE IF EXISTS tasks;

-- ----------------------------------------------------------------------------
-- Table Structure: tasks
-- ----------------------------------------------------------------------------
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_code TEXT,
    raw_input TEXT,
    intent TEXT,
    entities JSONB,
    risk_score INTEGER,
    generated_steps JSONB,
    msg_whatsapp TEXT,
    msg_email TEXT,
    msg_sms TEXT,
    employee_assignment TEXT,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT now()
);

-- Add indexes for optimized queries on frequent columns
CREATE INDEX idx_tasks_task_code ON tasks(task_code);
CREATE INDEX idx_tasks_intent ON tasks(intent);
CREATE INDEX idx_tasks_risk_score ON tasks(risk_score);

-- ----------------------------------------------------------------------------
-- Sample Dataset: 5 Core AI-Processed Diaspora Tasks
-- ----------------------------------------------------------------------------
INSERT INTO tasks (
    task_code,
    raw_input,
    intent,
    entities,
    risk_score,
    generated_steps,
    msg_whatsapp,
    msg_email,
    msg_sms,
    employee_assignment,
    status
) VALUES 
-- 1. Send $500 to my mom in Nairobi for her airport taxi and verify her identity card.
(
    'TSK-109283',
    'Send $500 to my mom in Nairobi for her airport taxi and verify her identity card.',
    'send_money',
    '{
        "amount": "500",
        "currency": "USD",
        "recipient": "mom",
        "location": "Nairobi",
        "purpose": "airport taxi",
        "verification_required": "identity card"
    }'::jsonb,
    85,
    '[
        "Verify the recipient''s identity card via partner compliance portal.",
        "Screen the $500 money transfer request for Nairobi compliance rules.",
        "Disburse $500 USD for airport taxi services and notify sender."
    ]'::jsonb,
    'Hi! We have initiated a transfer of $500 USD to Nairobi for Mom''s airport taxi. Identity card verification is in progress.',
    'Dear Customer, your transfer of $500.00 USD to Mom in Nairobi for her airport taxi is currently being processed. Identity verification has been launched.',
    'DiasporaAI: $500 transfer to Mom (Nairobi) for airport taxi pending identity card verification. Tracking: TSK-109283.',
    'Grace Wanjiku',
    'Pending'
),

-- 2. I need a taxi from JKIA to Westlands for two people.
(
    'TSK-283049',
    'I need a taxi from JKIA to Westlands for two people.',
    'get_airport_transfer',
    '{
        "pickup": "JKIA",
        "destination": "Westlands",
        "passengers": 2
    }'::jsonb,
    30,
    '[
        "Check passenger terminal arrival flight at JKIA.",
        "Dispatch a standard taxi vehicle suitable for two passengers.",
        "Send vehicle registration and driver contact details to the user."
    ]'::jsonb,
    'Hello! Your taxi from JKIA to Westlands for two people is booked. Driver John (KDL 482A) will be waiting at the arrival terminal.',
    'Dear Customer, your airport transfer booking from JKIA to Westlands for 2 passengers is confirmed. Driver details: John (+254712345678).',
    'DiasporaAI: Taxi from JKIA to Westlands for 2 people confirmed. Driver John (KDL 482A) assigned.',
    'David Kiprop',
    'Pending'
),

-- 3. Please verify my passport document for the application.
(
    'TSK-849021',
    'Please verify my passport document for the application.',
    'verify_document',
    '{
        "document_type": "passport",
        "purpose": "application"
    }'::jsonb,
    60,
    '[
        "Securely upload the passport document to the verification gateway.",
        "Cross-check passport validity and expiration dates with national databases.",
        "Generate compliance reports and update application system logs."
    ]'::jsonb,
    'Hi! The passport verification process has started for your application. We will notify you once verified.',
    'Dear Customer, passport verification has been initiated for your application. The compliance screening report is currently pending.',
    'DiasporaAI: Passport document verification for your application is in progress (TSK-849021).',
    'Sarah Mwangi',
    'In Progress'
),

-- 4. I want to hire a local plumber to fix a leak in my kitchen.
(
    'TSK-302948',
    'I want to hire a local plumber to fix a leak in my kitchen.',
    'hire_service',
    '{
        "service": "plumbing",
        "issue": "leak in kitchen"
    }'::jsonb,
    10,
    '[
        "Search for available and verified local plumbers in the area.",
        "Confirm plumber availability and quotes for kitchen leak repairs.",
        "Schedule the service visit and send appointment details to the client."
    ]'::jsonb,
    'Hello! We have assigned local plumber Kevin (+254799887766) to fix the leak in your kitchen. Expected arrival today.',
    'Dear Customer, your plumber booking is confirmed. Plumber Kevin will arrive at your residence today to resolve the kitchen leak.',
    'DiasporaAI: Plumber Kevin assigned to TSK-302948 to fix kitchen leak. Arrival scheduled today.',
    'Kelvin Omwamba',
    'Completed'
),

-- 5. Can you check the status of my recent transaction?
(
    'TSK-940283',
    'Can you check the status of my recent transaction?',
    'check_status',
    '{
        "query": "recent transaction status"
    }'::jsonb,
    10,
    '[
        "Search the database for the user''s most recent transaction entry.",
        "Fetch the live transaction processing status from external payment gateways.",
        "Return the verified transaction status and send updates to the user."
    ]'::jsonb,
    'Hi! We checked the status of your recent transaction. It is currently ''Approved'' and processing successfully.',
    'Dear Customer, regarding your request: Your most recent transaction status is ''Approved'' and has been successfully processed.',
    'DiasporaAI: Status check complete. Your recent transaction is Approved. Ref: TSK-940283.',
    'Alice Njeri',
    'Completed'
);
