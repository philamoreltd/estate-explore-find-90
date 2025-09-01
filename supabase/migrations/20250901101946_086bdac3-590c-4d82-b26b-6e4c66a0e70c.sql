-- Create table to track property availability notifications
CREATE TABLE public.property_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'availability_check',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_sent_to TEXT NOT NULL,
  response_token UUID DEFAULT gen_random_uuid(),
  landlord_response TEXT NULL, -- 'available', 'unavailable', 'sold', etc.
  responded_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Landlords can view their own notifications" 
ON public.property_notifications 
FOR SELECT 
USING (auth.uid() = landlord_id);

CREATE POLICY "System can insert notifications" 
ON public.property_notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Landlords can update their own notifications" 
ON public.property_notifications 
FOR UPDATE 
USING (auth.uid() = landlord_id);

CREATE POLICY "Admins can view all notifications" 
ON public.property_notifications 
FOR SELECT 
USING (is_admin());

-- Add index for efficient querying
CREATE INDEX idx_property_notifications_property_id ON public.property_notifications(property_id);
CREATE INDEX idx_property_notifications_sent_at ON public.property_notifications(sent_at);
CREATE INDEX idx_property_notifications_response_token ON public.property_notifications(response_token);

-- Create function to update property status based on landlord response
CREATE OR REPLACE FUNCTION public.update_property_status_from_response()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when landlord_response is updated
  IF OLD.landlord_response IS DISTINCT FROM NEW.landlord_response AND NEW.landlord_response IS NOT NULL THEN
    -- Update property status based on response
    CASE NEW.landlord_response
      WHEN 'unavailable' THEN
        UPDATE public.properties 
        SET status = 'unavailable', updated_at = now() 
        WHERE id = NEW.property_id;
      WHEN 'sold' THEN
        UPDATE public.properties 
        SET status = 'sold', updated_at = now() 
        WHERE id = NEW.property_id;
      WHEN 'available' THEN
        UPDATE public.properties 
        SET status = 'available', updated_at = now() 
        WHERE id = NEW.property_id;
    END CASE;
    
    -- Set responded_at timestamp
    NEW.responded_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update property status
CREATE TRIGGER update_property_status_on_response
  BEFORE UPDATE ON public.property_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_status_from_response();