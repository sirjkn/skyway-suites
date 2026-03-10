-- =============================================
-- ADD MISSING CALENDAR COLUMNS TO PROPERTIES TABLE
-- =============================================
-- Copy and paste this entire script into your Neon SQL Editor and run it

-- Add all missing calendar sync columns
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS ical_export_url TEXT,
ADD COLUMN IF NOT EXISTS airbnb_import_url TEXT,
ADD COLUMN IF NOT EXISTS calendar_sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_calendar_sync TIMESTAMP,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Set defaults for existing properties
UPDATE properties 
SET 
    ical_export_url = COALESCE(ical_export_url, ''),
    airbnb_import_url = COALESCE(airbnb_import_url, ''),
    calendar_sync_enabled = COALESCE(calendar_sync_enabled, false),
    average_rating = COALESCE(average_rating, 0),
    review_count = COALESCE(review_count, 0)
WHERE 
    ical_export_url IS NULL 
    OR airbnb_import_url IS NULL 
    OR calendar_sync_enabled IS NULL
    OR average_rating IS NULL
    OR review_count IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'properties'
ORDER BY column_name;

-- Success message
SELECT '✅ Calendar columns added successfully!' as status;