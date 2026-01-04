-- Create activity_logs table to track staff actions
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (public.is_admin());

-- Staff (admins) can view all activity logs
CREATE POLICY "Staff can view activity logs"
ON public.activity_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Staff can insert activity logs
CREATE POLICY "Staff can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_activity_logs_staff_id ON public.activity_logs(staff_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Allow admins to create properties for others
CREATE POLICY "Admins can create properties for others"
ON public.properties
FOR INSERT
WITH CHECK (public.is_admin());