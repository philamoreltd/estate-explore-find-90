-- Add GPS coordinates to properties table
ALTER TABLE public.properties 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add index for location-based queries
CREATE INDEX idx_properties_location ON public.properties(latitude, longitude);