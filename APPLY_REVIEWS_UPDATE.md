# Apply Reviews and Ratings Update - Migration Guide

## 🎯 What This Update Adds

1. ✅ Customer reviews and ratings system
2. ✅ Automatic property rating calculation
3. ✅ Default hero background image
4. ✅ Fixed "Add Property" functionality

## 📋 Prerequisites

- Access to your Neon Database SQL Editor
- Your app deployed to Vercel
- Admin access to Skyway Suites

## 🚀 Step-by-Step Migration

### Step 1: Update Properties Table (Required)

This adds the rating columns to your existing properties table.

**In Neon SQL Editor, run:**

```sql
-- Add rating columns to properties table (safe to run multiple times)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'average_rating'
    ) THEN
        ALTER TABLE properties ADD COLUMN average_rating DECIMAL(2,1) DEFAULT 0;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'review_count'
    ) THEN
        ALTER TABLE properties ADD COLUMN review_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Set default values for existing properties
UPDATE properties 
SET average_rating = 0 
WHERE average_rating IS NULL;

UPDATE properties 
SET review_count = 0 
WHERE review_count IS NULL;
```

**Expected Result:** ✅ "Query completed successfully"

### Step 2: Create Reviews Table (Required)

This creates the reviews table and automatic rating triggers.

**In Neon SQL Editor, run:**

```sql
-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(booking_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

-- Function to automatically update property ratings
CREATE OR REPLACE FUNCTION update_property_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    )
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update ratings
DROP TRIGGER IF EXISTS trigger_update_property_rating ON reviews;
CREATE TRIGGER trigger_update_property_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_property_rating();
```

**Expected Result:** ✅ "Query completed successfully"

### Step 3: Set Default Hero Image (Optional but Recommended)

This sets your custom hero background image.

**In Neon SQL Editor, run:**

```sql
-- Set default hero background image
INSERT INTO settings (category, key, value)
VALUES ('hero', 'background_image', 'https://res.cloudinary.com/dc5d5zfos/image/upload/v1773134775/skyway-suites/yndkhqpgcxknpro3tjjd.webp')
ON CONFLICT (category, key) 
DO UPDATE SET value = 'https://res.cloudinary.com/dc5d5zfos/image/upload/v1773134775/skyway-suites/yndkhqpgcxknpro3tjjd.webp';
```

**Expected Result:** ✅ "INSERT 0 1" or "UPDATE 1"

### Step 4: Verify Migration Success

**Run this verification query:**

```sql
-- Check properties table has rating columns
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('average_rating', 'review_count')
ORDER BY column_name;

-- Check reviews table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'reviews';

-- Check hero image is set
SELECT value 
FROM settings 
WHERE category = 'hero' AND key = 'background_image';
```

**Expected Results:**
```
column_name      | data_type | column_default
-----------------+-----------+---------------
average_rating   | numeric   | 0
review_count     | integer   | 0

table_name
----------
reviews

value
-----
https://res.cloudinary.com/dc5d5zfos/image/upload/v1773134775/skyway-suites/yndkhqpgcxknpro3tjjd.webp
```

## ✅ Test the Updates

### Test 1: Add New Property
1. Go to Admin Dashboard → Properties
2. Click "Add New Property"
3. Fill in all fields
4. Click Save
5. ✅ Should save successfully (no "Failed to add property" error)
6. ✅ New property should show `averageRating: 0` and `reviewCount: 0`

### Test 2: Check Hero Background
1. Visit homepage
2. Refresh the page
3. ✅ Should see the new default background image in the hero section

### Test 3: Reviews API (After deployment)
1. Visit: `https://your-app.vercel.app/api?endpoint=reviews`
2. ✅ Should return: `[]` (empty array - no reviews yet)

## 🎨 Using the Reviews System

### For Customers (to be implemented in UI):

```typescript
// Customer can review after checkout date passes
const submitReview = async (bookingId, customerId, propertyId, rating, comment) => {
  try {
    await createReview({
      bookingId,
      customerId,
      propertyId,
      rating, // 1-5
      comment // Optional text
    });
    toast.success('Review submitted!');
  } catch (error) {
    toast.error(error.message);
  }
};
```

### Display Reviews on Property Page:

```typescript
// Load and display reviews
const [reviews, setReviews] = useState<Review[]>([]);
const [property, setProperty] = useState<Property | null>(null);

useEffect(() => {
  const loadData = async () => {
    const prop = await getPropertyById(propertyId);
    const revs = await getReviews(propertyId);
    setProperty(prop);
    setReviews(revs);
  };
  loadData();
}, [propertyId]);

// Show in UI:
{property && (
  <div>
    <h2>{property.title}</h2>
    <div className="flex items-center gap-2">
      <span>⭐ {property.averageRating?.toFixed(1) || '0.0'}</span>
      <span className="text-gray-500">
        ({property.reviewCount || 0} reviews)
      </span>
    </div>
  </div>
)}
```

## 🐛 Troubleshooting

### "Failed to add property" still appears

1. **Check if migration ran:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'properties' AND column_name = 'average_rating';
   ```
   If empty, re-run Step 1.

2. **Check Vercel deployment:**
   - Go to Vercel Dashboard
   - Redeploy your application
   - Wait for deployment to complete

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open in incognito mode

### Reviews not showing up

1. **Verify API endpoint:**
   ```
   GET https://your-app.vercel.app/api?endpoint=reviews
   ```
   Should return an array (empty or with reviews)

2. **Check if reviews table exists:**
   ```sql
   SELECT * FROM reviews;
   ```

3. **Verify trigger is working:**
   - Add a test review
   - Check if property rating updates automatically

### Hero image not showing

1. **Check settings:**
   ```sql
   SELECT * FROM settings WHERE category = 'hero';
   ```

2. **Force refresh homepage:**
   - Clear browser cache
   - Hard refresh the page

## 📊 Database Status After Migration

**Tables:**
- ✅ properties (with `average_rating` and `review_count` columns)
- ✅ reviews (new table)
- ✅ settings (with hero background)

**Triggers:**
- ✅ `trigger_update_property_rating` - Auto-updates property ratings

**Functions:**
- ✅ `update_property_rating()` - Calculates average rating

**Indexes:**
- ✅ `idx_reviews_property` - Fast property review lookups
- ✅ `idx_reviews_customer` - Fast customer review lookups
- ✅ `idx_reviews_created` - Fast date-sorted reviews

## 🎉 Success Indicators

After successful migration, you should see:

1. ✅ Properties can be added without errors
2. ✅ All properties show `averageRating: 0` and `reviewCount: 0`
3. ✅ Hero background shows the new default image
4. ✅ Reviews API endpoint returns empty array `[]`
5. ✅ No console errors in browser DevTools
6. ✅ Database connection shows green in admin panel

## 📝 Next Steps

1. **Add Review UI Components:**
   - Create review submission form for customers
   - Add review display on property details page
   - Show star ratings in property cards

2. **Email Notifications:**
   - Send review request after checkout
   - Notify property owners of new reviews

3. **Review Moderation:**
   - Add admin ability to moderate reviews
   - Flag inappropriate reviews

4. **Analytics:**
   - Track average ratings over time
   - Identify top-rated properties

## 🆘 Need Help?

If you encounter issues:

1. **Check Vercel logs:**
   - Vercel Dashboard → Your Project → Functions → /api
   
2. **Check browser console:**
   - DevTools → Console tab
   
3. **Check Neon query history:**
   - Neon Console → Your Project → Monitoring

4. **Verify DATABASE_URL:**
   - Make sure it's correctly set in `/api/config/db.ts`

---

**Migration completed successfully?** 🎉 
You now have a full review and rating system for Skyway Suites!
