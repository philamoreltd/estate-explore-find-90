-- Create the app_role enum type that's missing
CREATE TYPE public.app_role AS ENUM ('admin', 'landlord', 'tenant', 'user');

-- Ensure the user_roles table exists with proper structure
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    assigned_at timestamp with time zone NOT NULL DEFAULT now(),
    assigned_by uuid,
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Update the trigger to handle the new user creation properly
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the new user is the designated admin
  IF NEW.email = 'antonygmurimi@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role, assigned_at)
    VALUES (NEW.id, 'admin'::app_role, now())
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Assign role based on user metadata, default to 'user' if no role specified
    INSERT INTO public.user_roles (user_id, role, assigned_at)
    VALUES (
      NEW.id, 
      COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'user'::app_role), 
      now()
    )
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();