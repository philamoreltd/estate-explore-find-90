
-- Listing fee admin codes (unlimited reusable, revocable)
CREATE TABLE public.listing_fee_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_fee_codes TO authenticated;
GRANT ALL ON public.listing_fee_codes TO service_role;

ALTER TABLE public.listing_fee_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage listing fee codes"
ON public.listing_fee_codes
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE TRIGGER update_listing_fee_codes_updated_at
BEFORE UPDATE ON public.listing_fee_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Listing fee payments (separate from contact_payments)
CREATE TABLE public.listing_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  phone_number text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  checkout_request_id text,
  transaction_id text,
  code_used text,
  consumed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_payments TO authenticated;
GRANT ALL ON public.listing_payments TO service_role;

ALTER TABLE public.listing_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own listing payments"
ON public.listing_payments FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users insert own listing payments"
ON public.listing_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own listing payments"
ON public.listing_payments FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin());

CREATE TRIGGER update_listing_payments_updated_at
BEFORE UPDATE ON public.listing_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security-definer function to validate a code without exposing the table to non-admins
CREATE OR REPLACE FUNCTION public.validate_listing_code(p_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.listing_fee_codes
    WHERE code = p_code AND active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.validate_listing_code(text) TO authenticated;

-- Checks whether user currently has an unused completed listing payment available
CREATE OR REPLACE FUNCTION public.has_available_listing_payment(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.listing_payments
    WHERE user_id = p_user_id
      AND payment_status = 'completed'
      AND consumed = false
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_available_listing_payment(uuid) TO authenticated;
