-- Migration to support CRM Conversation Forms and Activities
-- Run this in your Supabase SQL Editor

-- 1. Expand the leads table with specialized fields for Site Visit and Sales forms
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS site_location TEXT,
ADD COLUMN IF NOT EXISTS map_coordinates TEXT,
ADD COLUMN IF NOT EXISTS dob DATE,
ADD COLUMN IF NOT EXISTS aadhar_front_url TEXT,
ADD COLUMN IF NOT EXISTS aadhar_back_url TEXT,
ADD COLUMN IF NOT EXISTS bank_docs_url TEXT,
ADD COLUMN IF NOT EXISTS downpayment_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS downpayment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS remaining_payment_type TEXT CHECK (remaining_payment_type IN ('Loan', 'Full Payment')),
ADD COLUMN IF NOT EXISTS quotation_url TEXT;

-- 2. Update the status check constraint to include new CRM lifecycle stages
-- First, we need to find the name of the existing constraint if it exists, 
-- or we can just try to drop and recreate it. 
-- Note: Replace 'leads_status_check' with your actual constraint name if different.
DO $$ 
BEGIN 
    ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
EXCEPTION 
    WHEN undefined_object THEN NULL; 
END $$;

ALTER TABLE leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN (
    'new', 
    'contacted', 
    'site_visit_scheduled', 
    'site_visit_completed', 
    'site_visit_cancelled',
    'follow_up', 
    'closed_won', 
    'closed_lost', 
    'converted',
    'dropped'
));

-- 3. Ensure the audit_logs table can handle the new form actions
-- (Usually audit_logs is flexible, but good to check if it matches our expected structure)
-- IF NOT EXISTS is used for safety
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    changes JSONB,
    performed_by UUID REFERENCES auth.users(id)
);

-- Index for faster lookup of lead history
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
