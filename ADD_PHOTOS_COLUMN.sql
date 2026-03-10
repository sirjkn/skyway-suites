-- =============================================
-- ADD PHOTOS COLUMN TO PROPERTIES TABLE
-- =============================================
-- This migration adds support for multiple property photos
-- Run this in your Neon SQL Editor

-- Add photos column to store array of photo URLs
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Verify the migration
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
  AND column_name = 'photos';

-- Show success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Photos column added successfully!';
    RAISE NOTICE 'You can now store multiple property photos for the gallery feature.';
END $$;
