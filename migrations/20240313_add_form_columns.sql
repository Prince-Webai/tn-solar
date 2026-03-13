-- Update lead schema to support extended forms and dropdowns
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS dob DATE,
ADD COLUMN IF NOT EXISTS payment_mode TEXT,
ADD COLUMN IF NOT EXISTS co_applicant_name TEXT;

-- Refresh the postgrest API schema schema cache
NOTIFY pgrst, 'reload schema';
