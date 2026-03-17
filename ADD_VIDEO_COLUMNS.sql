-- =============================================
-- ADD VIDEO URL COLUMNS TO PROPERTIES TABLE
-- =============================================
-- Copy and paste this entire script into your Neon SQL Editor and run it

-- Add video URL columns to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS video_url1 TEXT,
ADD COLUMN IF NOT EXISTS video_url2 TEXT;

-- Set defaults for existing properties (empty strings)
UPDATE properties 
SET 
    video_url1 = COALESCE(video_url1, ''),
    video_url2 = COALESCE(video_url2, '')
WHERE 
    video_url1 IS NULL 
    OR video_url2 IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'properties'
AND column_name IN ('video_url1', 'video_url2')
ORDER BY column_name;

-- Success message
SELECT '✅ Video URL columns added successfully!' as status;
