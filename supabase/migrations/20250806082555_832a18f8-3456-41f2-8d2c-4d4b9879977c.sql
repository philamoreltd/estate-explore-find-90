-- Add support for multiple images per property
ALTER TABLE public.properties 
ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- Update existing properties to move single image_url to the array
UPDATE public.properties 
SET image_urls = CASE 
  WHEN image_url IS NOT NULL THEN ARRAY[image_url]
  ELSE '{}'
END
WHERE image_urls = '{}';

-- We'll keep the old image_url column for backward compatibility for now
-- but the new functionality will use image_urls array