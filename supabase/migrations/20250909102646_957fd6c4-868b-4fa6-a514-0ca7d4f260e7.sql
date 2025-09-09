-- Create a view that conditionally shows phone numbers only to authenticated users
CREATE OR REPLACE VIEW public.properties_public AS
SELECT 
  id,
  title,
  property_type,
  location,
  rent_amount,
  bedrooms,
  bathrooms,
  size_sqft,
  description,
  image_url,
  image_urls,
  status,
  user_id,
  created_at,
  updated_at,
  latitude,
  longitude,
  contact,
  -- Only show phone number if user is authenticated
  CASE 
    WHEN auth.uid() IS NOT NULL THEN phone
    ELSE NULL
  END as phone
FROM public.properties;

-- Enable RLS on the view
ALTER VIEW public.properties_public ENABLE ROW LEVEL SECURITY;

-- Create policy for the view - anyone can view but phone is conditionally shown
CREATE POLICY "Anyone can view properties with conditional phone access" 
ON public.properties_public 
FOR SELECT 
USING (true);