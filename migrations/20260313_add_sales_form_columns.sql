-- Update lead schema to support extended sales forms
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_type TEXT,
ADD COLUMN IF NOT EXISTS dob DATE,
ADD COLUMN IF NOT EXISTS aadhar_front_url TEXT,
ADD COLUMN IF NOT EXISTS aadhar_back_url TEXT,
ADD COLUMN IF NOT EXISTS eb_bill_url TEXT,
ADD COLUMN IF NOT EXISTS bank_docs_url TEXT,
ADD COLUMN IF NOT EXISTS downpayment_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS downpayment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS remaining_payment_type TEXT,
ADD COLUMN IF NOT EXISTS quotation_url TEXT;

-- Refresh the postgrest API schema cache
NOTIFY pgrst, 'reload schema';
