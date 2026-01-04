-- Drop existing functions first
DROP FUNCTION IF EXISTS public.has_paid_for_contact_access(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_properties_with_conditional_phone();

-- Recreate has_paid_for_contact_access with expiry check
CREATE OR REPLACE FUNCTION public.has_paid_for_contact_access(p_property_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contact_payments
    WHERE property_id = p_property_id
      AND user_id = p_user_id
      AND payment_status = 'completed'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Recreate get_properties_with_conditional_phone with expiry check
CREATE OR REPLACE FUNCTION public.get_properties_with_conditional_phone()
RETURNS TABLE(
  id uuid,
  title text,
  property_type text,
  location text,
  rent_amount numeric,
  bedrooms integer,
  bathrooms integer,
  size_sqft integer,
  description text,
  image_url text,
  image_urls text[],
  status text,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  latitude numeric,
  longitude numeric,
  contact text,
  phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.title,
    p.property_type,
    p.location,
    p.rent_amount,
    p.bedrooms,
    p.bathrooms,
    p.size_sqft,
    p.description,
    p.image_url,
    p.image_urls,
    p.status,
    p.user_id,
    p.created_at,
    p.updated_at,
    p.latitude,
    p.longitude,
    p.contact,
    CASE 
      WHEN auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.contact_payments cp
        WHERE cp.property_id = p.id 
          AND cp.user_id = auth.uid() 
          AND cp.payment_status = 'completed'
          AND (cp.expires_at IS NULL OR cp.expires_at > now())
      ) THEN p.phone
      ELSE NULL
    END as phone
  FROM public.properties p;
$$;