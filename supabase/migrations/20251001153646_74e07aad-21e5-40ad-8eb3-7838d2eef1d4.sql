-- Create a function that returns properties with conditional phone access
CREATE OR REPLACE FUNCTION public.get_properties_with_conditional_phone()
RETURNS TABLE (
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
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  latitude numeric,
  longitude numeric,
  contact text,
  phone text
)
LANGUAGE sql
STABLE SECURITY DEFINER
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
    -- Only show phone number if user is authenticated
    CASE 
      WHEN auth.uid() IS NOT NULL THEN p.phone
      ELSE NULL
    END as phone
  FROM public.properties p;
$$;