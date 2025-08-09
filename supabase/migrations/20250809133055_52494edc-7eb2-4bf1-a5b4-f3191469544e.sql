-- Add landlord and tenant roles to the existing enum
ALTER TYPE public.app_role ADD VALUE 'landlord';
ALTER TYPE public.app_role ADD VALUE 'tenant';

-- Update the trigger function to handle role assignment based on user metadata
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Check if the new user is the designated admin
  IF NEW.email = 'antonygmurimi@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role, assigned_at)
    VALUES (NEW.id, 'admin', now())
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
$function$;