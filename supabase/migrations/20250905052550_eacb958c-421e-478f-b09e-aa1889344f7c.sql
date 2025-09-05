-- Recreate the assign_admin_role function with proper schema references
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user is the designated admin
  IF NEW.email = 'antonygmurimi@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role, assigned_at)
    VALUES (NEW.id, 'admin'::public.app_role, now())
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Assign role based on user metadata, default to 'user' if no role specified
    INSERT INTO public.user_roles (user_id, role, assigned_at)
    VALUES (
      NEW.id, 
      COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'user'::public.app_role), 
      now()
    )
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;