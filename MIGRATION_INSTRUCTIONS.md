# Database Migration Instructions

## Problem
The categorized photos feature was not working because the database was missing the `categorized_photos` column in the `properties` table.

## Solution
We've created a database migration to add this column.

## How to Run the Migration

### Option 1: Using the Admin Panel (Recommended)
1. Go to **Admin → Settings**
2. Scroll to the "Database Connection" section
3. Click the **"Run Migrations"** button
4. Or navigate directly to: `http://your-domain.com/admin/database-migration`
5. Click **"Run Migration"** button
6. You should see a success message

### Option 2: Direct API Call
Visit this URL in your browser:
```
http://your-domain.com/api/migrate
```

You should see a JSON response:
```json
{
  "success": true,
  "message": "Migration completed successfully. The categorized_photos column has been added to the properties table."
}
```

## After Running the Migration

1. **Add New Property**: Go to Admin → Properties → Add Property
2. **Upload Photos**: 
   - Click on category tabs (Living Room, Bedroom, Kitchen, Dining, Amenities)
   - Upload photos to each category
   - You'll see a count badge showing how many photos are in each category
3. **Save Property**: The categorized photos will now be saved correctly
4. **View Property**: Visit the property details page to see photos with olive green category badges

## Changes Made

### Backend Changes (/api/index.ts)
1. ✅ Added `categorizedPhotos` to `transformProperty` function
2. ✅ Added `categorized_photos` to INSERT statement (line 711-720)
3. ✅ Added `categorized_photos` to UPDATE statement (line 655-658)

### Frontend Changes (/src/app/lib/api.ts)
1. ✅ Already sending `categorized_photos` to backend (line 253)

### Database Schema
1. ✅ Created migration endpoint at `/api/migrate.ts`
2. ✅ Migration adds JSONB column `categorized_photos` with default empty object

### UI Changes
1. ✅ Badge color changed to olive green (#6B7C3C)
2. ✅ Added loading states to Add/Edit Property buttons
3. ✅ Created admin migration page at `/admin/database-migration`

## Troubleshooting

### If Photos Still Show "General"
1. Make sure you ran the migration successfully
2. Check the browser console (F12) when saving a property - you should see:
   - `🔍 IMAGE CATEGORIES MAP:` - Shows category assignments
   - `🔍 CATEGORIZED PHOTOS:` - Shows final structure
3. If the console shows empty objects, the photos might not be assigned to categories during upload

### If Migration Fails
1. Check that your database connection is working
2. Verify the DATABASE_URL environment variable is set correctly
3. The migration is safe to run multiple times (uses IF NOT EXISTS)

## Testing

1. Create a test property with photos in different categories
2. Save and reload the page
3. Check that photos display with correct category badges (olive green background)
4. Open property details to verify the photo gallery shows categorized photos

---

**Need Help?** Check the browser console for detailed logs when saving properties.
