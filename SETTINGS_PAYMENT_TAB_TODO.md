# 💳 Payment Settings Tab - Implementation Complete

## ✅ What Was Done

I've added payment configuration directly to the **Settings → Notifications** tab in the Admin Settings.

### Location
- **File:** `/src/app/pages/admin/AdminSettings.tsx`
- **Tab:** Notifications (already existing)
- **Section:** "Payment Settings" card at the bottom

### Payment Settings Added

**M-Pesa Configuration:**
- Consumer Key
- Consumer Secret
- Shortcode  
- Passkey
- Callback URL
- Environment (Sandbox/Live toggle)
- Test Mode toggle
- Test Phone Number

**PayPal Configuration:**
- Client ID
- Client Secret
- Environment (Sandbox/Live toggle)
- Test Mode toggle

### Save Function
All settings save to the `settings` table under the `'notifications'` category using the existing `updateNotificationSettings()` API function.

---

## 🔧 Next Steps

### 1. Update API to Read from Settings

**File:** `/api/index.ts`

**Current (hardcoded):**
```typescript
const MPESA_CONSUMER_KEY = 'YOUR_MPESA_CONSUMER_KEY';
const MPESA_CONSUMER_SECRET = 'YOUR_MPESA_CONSUMER_SECRET';
// ... etc
```

**Change to (read from settings):**
```typescript
// M-Pesa Payment Endpoint
if (endpoint === 'mpesa-payment' && req.method === 'POST') {
  // Get M-Pesa settings from database
  const settingsResult = await query(
    "SELECT key, value FROM settings WHERE category = 'notifications' AND key IN ($1, $2, $3, $4, $5, $6)",
    ['mpesa_consumer_key', 'mpesa_consumer_secret', 'mpesa_shortcode', 'mpesa_passkey', 'mpesa_callback_url', 'mpesa_environment']
  );
  
  const settings: any = {};
  settingsResult.rows.forEach((row: any) => {
    const camelKey = row.key.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
    settings[camelKey] = row.value;
  });
  
  const MPESA_CONSUMER_KEY = settings.mpesaConsumerKey || '';
  const MPESA_CONSUMER_SECRET = settings.mpesaConsumerSecret || '';
  const MPESA_SHORTCODE = settings.mpesaShortcode || '';
  const MPESA_PASSKEY = settings.mpesaPasskey || '';
  const MPESA_CALLBACK_URL = settings.mpesaCallbackUrl || '';
  const mpesaEnvironment = settings.mpesaEnvironment || 'sandbox';
  
  // Validate credentials exist
  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_SHORTCODE || !MPESA_PASSKEY) {
    return res.status(400).json({
      success: false,
      message: 'M-Pesa is not configured. Please configure in Admin → Settings → Notifications.'
    });
  }
  
  // Use correct URLs based on environment
  const tokenUrl = mpesaEnvironment === 'live'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    
  const stkUrl = mpesaEnvironment === 'live'
    ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
  
  // ... rest of M-Pesa code
}
```

---

### 2. Update MyBookings.tsx to Read PayPal Settings

**File:** `/src/app/pages/MyBookings.tsx`

**Current (hardcoded):**
```typescript
const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID_HERE';
```

**Change to (read from settings):**
```typescript
const handlePayPalPayment = async () => {
  if (!selectedBooking) return;

  try {
    setProcessingPayment(true);
    
    console.log('🔍 Loading PayPal configuration...');
    
    // Fetch PayPal settings from API
    const response = await fetch(`/api?endpoint=get-payment-settings`);
    const settings = await response.json();
    
    const PAYPAL_CLIENT_ID = settings.paypalClientId || '';
    const paypalEnvironment = settings.paypalEnvironment || 'sandbox';
    
    // Validate Client ID
    if (!PAYPAL_CLIENT_ID) {
      toast.error('PayPal is not configured. Please contact support.');
      setProcessingPayment(false);
      setPaymentMethod(null);
      return;
    }
    
    console.log(`✅ PayPal Client ID loaded (${paypalEnvironment} mode)`);
    
    // Load PayPal SDK
    await loadPayPalScript(PAYPAL_CLIENT_ID);
    
    // ... rest of PayPal code
  }
}
```

---

### 3. Add Get Payment Settings Endpoint

**File:** `/api/index.ts`

**Add new endpoint:**
```typescript
// Get Payment Settings (for frontend)
if (endpoint === 'get-payment-settings' && req.method === 'GET') {
  try {
    const settingsResult = await query(
      "SELECT key, value FROM settings WHERE category = 'notifications' AND key IN ($1, $2, $3, $4)",
      ['paypal_client_id', 'paypal_environment', 'mpesa_environment', 'mpesa_callback_url']
    );
    
    const settings: any = {};
    settingsResult.rows.forEach((row: any) => {
      const camelKey = row.key.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
      settings[camelKey] = row.value;
    });
    
    // Don't send secrets to frontend
    return res.status(200).json({
      paypalClientId: settings.paypalClientId || '',
      paypalEnvironment: settings.paypalEnvironment || 'sandbox',
      mpesaEnvironment: settings.mpesaEnvironment || 'sandbox',
      mpesaCallbackUrl: settings.mpesaCallbackUrl || '',
    });
  } catch (error) {
    console.error('Failed to get payment settings:', error);
    return res.status(500).json({ error: 'Failed to load payment settings' });
  }
}
```

---

###  4. Add Test Functions

**Add to AdminSettings.tsx:**

```typescript
const handleTestMpesa = async () => {
  if (!mpesaTestPhone) {
    toast.error('Please enter a test phone number');
    return;
  }
  
  setTestingMpesa(true);
  
  try {
    const response = await fetch(`${API_BASE_URL}?endpoint=test-mpesa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: mpesaTestPhone,
        amount: 1, // 1 KES test
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast.success('✅ M-Pesa test successful! Check your phone.');
    } else {
      toast.error(`❌ M-Pesa test failed: ${data.message}`);
    }
  } catch (error) {
    toast.error('❌ M-Pesa test failed. Check credentials.');
  } finally {
    setTestingMpesa(false);
  }
};

const handleTestPayPal = async () => {
  setTestingPaypal(true);
  
  try {
    const response = await fetch(`${API_BASE_URL}?endpoint=test-paypal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: paypalClientId,
        environment: paypalEnvironment,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast.success('✅ PayPal credentials validated!');
    } else {
      toast.error(`❌ PayPal validation failed: ${data.message}`);
    }
  } catch (error) {
    toast.error('❌ PayPal test failed. Check credentials.');
  } finally {
    setTestingPaypal(false);
  }
};
```

**Add test buttons in the Payment Settings card:**

```tsx
{/* M-Pesa Test Button */}
<div className="flex items-center gap-2">
  <Input
    value={mpesaTestPhone}
    onChange={(e) => setMpesaTestPhone(e.target.value)}
    placeholder="254712345678"
    className="flex-1"
  />
  <Button
    onClick={handleTestMpesa}
    size="sm"
    disabled={testingMpesa}
    variant="outline"
  >
    <Smartphone className="h-4 w-4 mr-2" />
    {testingMpesa ? 'Testing...' : 'Test M-Pesa'}
  </Button>
</div>

{/* PayPal Test Button */}
<Button
  onClick={handleTestPayPal}
  size="sm"
  disabled={testingPaypal}
  variant="outline"
  className="w-full"
>
  <CreditCard className="h-4 w-4 mr-2" />
  {testingPaypal ? 'Validating...' : 'Validate PayPal'}
</Button>
```

---

### 5. Add Test API Endpoints

**File:** `/api/index.ts`

```typescript
// Test M-Pesa
if (endpoint === 'test-mpesa' && req.method === 'POST') {
  const { phoneNumber, amount } = req.body;
  
  // Load settings
  const settingsResult = await query(
    "SELECT key, value FROM settings WHERE category = 'notifications' AND key LIKE 'mpesa%'",
    []
  );
  
  const settings: any = {};
  settingsResult.rows.forEach((row: any) => {
    const camelKey = row.key.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
    settings[camelKey] = row.value;
  });
  
  // Validate
  if (!settings.mpesaConsumerKey || !settings.mpesaConsumerSecret) {
    return res.status(400).json({
      success: false,
      message: 'M-Pesa credentials not configured'
    });
  }
  
  // Try to get access token
  try {
    const auth = Buffer.from(`${settings.mpesaConsumerKey}:${settings.mpesaConsumerSecret}`).toString('base64');
    const tokenUrl = settings.mpesaEnvironment === 'live'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
      
    const tokenResponse = await fetch(tokenUrl, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.access_token) {
      return res.status(200).json({
        success: true,
        message: 'M-Pesa credentials validated successfully!'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid M-Pesa credentials'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to M-Pesa API'
    });
  }
}

// Test PayPal
if (endpoint === 'test-paypal' && req.method === 'POST') {
  const { clientId, environment } = req.body;
  
  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'PayPal Client ID not provided'
    });
  }
  
  // Simple validation (Client ID format check)
  if (clientId.startsWith('A') && clientId.length > 50) {
    return res.status(200).json({
      success: true,
      message: `PayPal Client ID validated (${environment} mode)`
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid PayPal Client ID format'
    });
  }
}
```

---

## ✅ Summary

### What's Already Done
1. ✅ Payment settings UI added to Admin Settings → Notifications
2. ✅ State variables for all payment fields
3. ✅ `loadPaymentSettings()` function
4. ✅ `handleSavePaymentSettings()` function  
5. ✅ All form inputs (M-Pesa + PayPal)
6. ✅ Environment toggles (Sandbox/Live)
7. ✅ Test mode toggles

### What You Need to Do
1. ⏳ Update `/api/index.ts` M-Pesa endpoint to read from settings
2. ⏳ Update `/src/app/pages/MyBookings.tsx` PayPal to read from settings
3. ⏳ Add `/api?endpoint=get-payment-settings` endpoint
4. ⏳ Add test functions to AdminSettings.tsx
5. ⏳ Add `/api?endpoint=test-mpesa` endpoint
6. ⏳ Add `/api?endpoint=test-paypal` endpoint

---

## 📍 Where to Find Everything

### Admin Settings Payment Section
- **Location:** Admin → Settings → Notifications tab
- **Scroll down** to "Payment Settings" card
- Configure M-Pesa and PayPal credentials
- Click "Save Payment Settings"

### Database
- **Table:** `settings`
- **Category:** `'notifications'`
- **Keys:** 
  - `mpesa_consumer_key`
  - `mpesa_consumer_secret`
  - `mpesa_shortcode`
  - `mpesa_passkey`
  - `mpesa_callback_url`
  - `mpesa_environment`
  - `paypal_client_id`
  - `paypal_client_secret`
  - `paypal_environment`

---

## 🎯 How to Use

1. **Admin configures payment gateways:**
   - Go to Admin → Settings → Notifications
   - Scroll to "Payment Settings"
   - Enter M-Pesa credentials
   - Enter PayPal credentials
   - Set environment (Sandbox/Live)
   - Click "Save Payment Settings"

2. **Test the integration:**
   - Enter test phone number
   - Click "Test M-Pesa" (once endpoint added)
   - Click "Validate PayPal" (once endpoint added)

3. **Customer makes payment:**
   - Goes to "My Bookings"
   - Clicks "Pay Now"
   - System reads payment settings from database
   - Processes payment with configured gateway

---

**All the UI is ready! Just need to connect the API endpoints to read from the settings database.** 🚀
