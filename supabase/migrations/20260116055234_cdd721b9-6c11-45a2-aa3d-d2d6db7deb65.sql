-- Add is_active column to profiles for admin activation
ALTER TABLE public.profiles 
ADD COLUMN is_active boolean NOT NULL DEFAULT false;

-- Update existing profiles to be active (so current users aren't locked out)
UPDATE public.profiles SET is_active = true;