-- Add new columns to leads table for Master-Detail refactor
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS last_month_bill NUMERIC,
ADD COLUMN IF NOT EXISTS proposed_kw NUMERIC,
ADD COLUMN IF NOT EXISTS lead_type TEXT CHECK (lead_type IN ('Residential', 'Commercial', 'Agriculture')),
ADD COLUMN IF NOT EXISTS lead_owner TEXT,
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS site_visit_datetime TIMESTAMPTZ;

-- Update trigger for last_modified_at if not already exists
CREATE OR REPLACE FUNCTION update_lead_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_last_modified ON leads;
CREATE TRIGGER update_leads_last_modified
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_modified_column();
