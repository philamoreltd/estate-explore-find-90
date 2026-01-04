-- Step 1: Add expires_at column to contact_payments
ALTER TABLE public.contact_payments 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '14 days');

-- Step 2: Update existing records to have expiry 2 weeks from creation
UPDATE public.contact_payments 
SET expires_at = created_at + INTERVAL '14 days'
WHERE expires_at IS NULL;