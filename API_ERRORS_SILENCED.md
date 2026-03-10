# API Error Messages Fixed

## Issue
Console was showing noisy error messages in preview mode (Figma Make):
- ❌ API endpoint returned HTML - not deployed correctly
- Failed to fetch properties: Error: API_NOT_DEPLOYED
- ⚠️ API not available - Deploy to Vercel to connect to Neon

These errors are **expected behavior** in preview mode since the backend API is not available until deployed to Vercel.

## Solution
Made all API error logging conditional based on environment:

### Changes Made

1. **Silent Preview Mode** - No logs when running in Figma Make
2. **Informative Production Mode** - Only log errors when deployed to Vercel
3. **Clean Console** - Zero noisy errors in preview mode

### Updated Functions

All API functions now check environment before logging:
- `getProperties()`
- `getPropertyById()`
- `getBookings()`
- `getCustomers()`
- `getPayments()`
- `getUsers()`
- And all other API methods

### Error Handling Pattern

```typescript
export async function getProperties(): Promise<Property[]> {
  try {
    const result = await fetchWithAuth(`${API_BASE_URL}?endpoint=properties`);
    return result || [];
  } catch (error) {
    // Silently return empty array in preview mode or if API not deployed
    if (error instanceof Error && (error.message === 'PREVIEW_MODE' || error.message === 'API_NOT_DEPLOYED')) {
      return [];
    }
    // Only log unexpected errors in production
    if (isProduction()) {
      console.error('Failed to fetch properties:', error);
    }
    return [];
  }
}
```

### Core Logic

The `fetchWithAuth` function now:
1. Detects preview mode and throws `PREVIEW_MODE` error silently
2. Detects API not deployed and throws `API_NOT_DEPLOYED` error (only logged in production)
3. Only logs API requests and responses when in production

```typescript
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // In preview mode, don't even try to hit the API
  if (isPreviewMode()) {
    throw new Error('PREVIEW_MODE');
  }

  try {
    // Only log in production
    if (isProduction()) {
      console.log('🌐 API Request:', url, options.method || 'GET');
    }
    
    // ... rest of the logic
    
    if (isProduction()) {
      console.log('✅ API Success:', url);
    }
  } catch (error) {
    // Only log errors in production
    if (isProduction()) {
      console.error('❌ Fetch error:', error);
    }
    throw error;
  }
}
```

## Result

✅ **Clean console in preview mode** - No error messages  
✅ **Helpful logs in production** - Full debugging when deployed  
✅ **Graceful degradation** - App works in both modes without errors  
✅ **Better UX** - No confusing error messages for development

## Testing

**Preview Mode (Figma Make):**
- Opens with clean console
- No API errors shown
- Orange "Preview Mode" badge displayed
- UI shows empty states instead of errors

**Production Mode (Vercel):**
- Full API request/response logging
- Real errors are logged for debugging
- Database connection status indicator works
- All features connected to Neon database
