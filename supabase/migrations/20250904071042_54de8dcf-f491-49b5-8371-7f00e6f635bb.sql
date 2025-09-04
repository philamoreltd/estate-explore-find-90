-- Create payments table to track M-Pesa payments for contact access
CREATE TABLE public.contact_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Amount in cents (KES)
  phone_number TEXT NOT NULL,
  transaction_id TEXT,
  checkout_request_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, cancelled
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_payments
CREATE POLICY "Users can view their own payments" 
ON public.contact_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" 
ON public.contact_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payments" 
ON public.contact_payments 
FOR UPDATE 
USING (true);

-- Create function to check if user has paid for contact access
CREATE OR REPLACE FUNCTION public.has_paid_for_contact_access(user_id UUID, property_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.contact_payments 
    WHERE contact_payments.user_id = $1 
      AND contact_payments.property_id = $2 
      AND payment_status = 'completed'
  );
$$;

-- Create trigger for updating timestamps
CREATE TRIGGER update_contact_payments_updated_at
BEFORE UPDATE ON public.contact_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();