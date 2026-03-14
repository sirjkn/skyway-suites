// API functions to connect to your Neon database
// Backend API URL - automatically uses Vercel's API routes in production
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Generate URL-friendly slug from property title and ID
export function generatePropertySlug(title: string, id: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  // Use double underscore as separator to avoid conflicts with UUID hyphens
  return `${slug}__${id}`;
}

// Extract property ID from slug (format: "title-slug__propertyId")
export function extractPropertyId(slug: string): string {
  // The ID comes after the double underscore separator
  const parts = slug.split('__');
  if (parts.length >= 2) {
    return parts[parts.length - 1];
  }
  // Fallback: if no separator found, return the whole slug (for backward compatibility)
  return slug;
}

// Detect if we're in preview mode (Figma Make) vs production (Vercel)
function isPreviewMode(): boolean {
  const hostname = window.location.hostname;
  return hostname.includes('makeproxy') || 
         hostname.includes('localhost') || 
         hostname === '127.0.0.1';
}

// Detect if we're deployed to Vercel
function isProduction(): boolean {
  const hostname = window.location.hostname;
  return hostname.includes('vercel.app') || 
         (!hostname.includes('makeproxy') && !hostname.includes('localhost'));
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  category: string;
  image: string;
  photos?: string[]; // Additional property photos for gallery
  amenities: string[];
  available: boolean;
  averageRating?: number;
  reviewCount?: number;
  icalUrl?: string;
  airbnbCalendarUrl?: string;
  calendarSyncEnabled?: boolean;
  lastCalendarSync?: string;
  createdAt?: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  customerId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  amountPaid?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  totalBookings: number;
}

export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  amount: number;
  status: 'pending' | 'paid' | 'refunded';
  paymentMethod: string;
  createdAt: string;
}

export interface HeroSettings {
  backgroundImage: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  createdAt: string;
  status: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  propertyId: string;
  rating: number;
  comment: string;
  createdAt: string;
  customerName?: string;
}

// Helper function to get auth token
function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

// Helper function to make authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // In preview mode, don't even try to hit the API
  if (isPreviewMode()) {
    // Silently fail in preview mode - no warnings needed
    throw new Error('PREVIEW_MODE');
  }

  try {
    // Silent API requests - no logging unless there's an actual error
    const response = await fetch(url, { 
      ...options, 
      headers,
      cache: 'no-cache'
    });
    
    // Check if response is HTML (error page) - API not available
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      // API is not available (deployment issue)
      console.error('⚠️ API returned HTML instead of JSON - API routes not deployed correctly');
      console.error('📋 DEPLOYMENT ISSUE DETECTED:');
      console.error('   1. Vercel serverless functions may not be deployed');
      console.error('   2. Check that /api folder is included in deployment');
      console.error('   3. Verify vercel.json configuration');
      console.error('   4. Try redeploying: vercel --prod');
      throw new Error('API_NOT_DEPLOYED');
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      if (isProduction()) {
        console.error('❌ API Error:', error);
      }
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    if (isProduction()) {
      console.log('✅ API Success:', url);
    }
    return data;
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof Error && (error.message === 'PREVIEW_MODE' || error.message === 'API_NOT_DEPLOYED')) {
      throw error;
    }
    // Log and throw other errors only in production
    if (isProduction()) {
      console.error('❌ Fetch error:', error);
    }
    throw error;
  }
}

// Properties API
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

export async function getPropertyById(id: string): Promise<Property | null> {
  try {
    console.log('🔍 API - getPropertyById called with ID:', id);
    console.log('🔍 API - Request URL:', `${API_BASE_URL}?endpoint=properties&id=${id}`);
    
    const result = await fetchWithAuth(`${API_BASE_URL}?endpoint=properties&id=${id}`);
    console.log('✅ API - getPropertyById result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ API - getPropertyById error:', error);
    
    // Silently return null in preview mode or if API not deployed
    if (error instanceof Error && (error.message === 'PREVIEW_MODE' || error.message === 'API_NOT_DEPLOYED')) {
      return null;
    }
    // Only log unexpected errors in production
    if (isProduction()) {
      console.error('Failed to fetch property:', error);
    }
    return null;
  }
}

// Alias for backward compatibility
export const getProperty = getPropertyById;

export async function createProperty(property: Omit<Property, 'id'>): Promise<Property | null> {
  // Transform camelCase to snake_case for API
  const apiProperty = {
    title: property.title,
    description: property.description,
    price: property.price,
    location: property.location,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    guests: property.guests,
    category: property.category,
    image: property.image,
    photos: property.photos || [],
    amenities: property.amenities,
    available: property.available,
    ical_export_url: property.icalUrl || '',
    airbnb_import_url: property.airbnbCalendarUrl || '',
    calendar_sync_enabled: property.calendarSyncEnabled || false,
  };
  
  console.log('🔍 API - Sending to backend:', apiProperty);
  console.log('🔍 API - Endpoint:', `${API_BASE_URL}?endpoint=properties`);
  
  const result = await fetchWithAuth(`${API_BASE_URL}?endpoint=properties`, {
    method: 'POST',
    body: JSON.stringify(apiProperty),
  });
  
  console.log('🔍 API - Backend response:', result);
  return result;
}

export async function updateProperty(id: string, property: Partial<Property>): Promise<Property | null> {
  // Transform camelCase to snake_case for API
  const apiProperty: any = {};
  
  if (property.title !== undefined) apiProperty.title = property.title;
  if (property.description !== undefined) apiProperty.description = property.description;
  if (property.price !== undefined) apiProperty.price = property.price;
  if (property.location !== undefined) apiProperty.location = property.location;
  if (property.bedrooms !== undefined) apiProperty.bedrooms = property.bedrooms;
  if (property.bathrooms !== undefined) apiProperty.bathrooms = property.bathrooms;
  if (property.guests !== undefined) apiProperty.guests = property.guests;
  if (property.category !== undefined) apiProperty.category = property.category;
  if (property.image !== undefined) apiProperty.image = property.image;
  if (property.photos !== undefined) apiProperty.photos = property.photos;
  if (property.amenities !== undefined) apiProperty.amenities = property.amenities;
  if (property.available !== undefined) apiProperty.available = property.available;
  if (property.icalUrl !== undefined) apiProperty.ical_export_url = property.icalUrl;
  if (property.airbnbCalendarUrl !== undefined) apiProperty.airbnb_import_url = property.airbnbCalendarUrl;
  if (property.calendarSyncEnabled !== undefined) apiProperty.calendar_sync_enabled = property.calendarSyncEnabled;
  
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=properties&id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(apiProperty),
  });
}

export async function deleteProperty(id: string): Promise<void> {
  await fetchWithAuth(`${API_BASE_URL}?endpoint=properties&id=${id}`, {
    method: 'DELETE',
  });
}

// Bookings API
export async function getBookings(): Promise<Booking[]> {
  try {
    const result = await fetchWithAuth(`${API_BASE_URL}?endpoint=bookings`);
    return result || [];
  } catch (error) {
    if (error instanceof Error && (error.message === 'PREVIEW_MODE' || error.message === 'API_NOT_DEPLOYED')) {
      return [];
    }
    if (isProduction()) {
      console.error('Failed to fetch bookings:', error);
    }
    throw error;
  }
}

// Get bookings for a specific property
export async function getPropertyBookings(propertyId: string): Promise<Booking[]> {
  try {
    const allBookings = await getBookings();
    return allBookings.filter(booking => 
      booking.propertyId === propertyId && 
      booking.status !== 'cancelled'
    );
  } catch (error) {
    console.error('Failed to fetch property bookings:', error);
    return [];
  }
}

// Get bookings for a specific customer
export async function getCustomerBookings(customerId: string): Promise<Booking[]> {
  try {
    const allBookings = await getBookings();
    return allBookings.filter(booking => booking.customerId === customerId);
  } catch (error) {
    console.error('Failed to fetch customer bookings:', error);
    return [];
  }
}

// Alias for backward compatibility
export const getBookingsByCustomer = getCustomerBookings;

// Check if dates overlap
export function doDatesOverlap(
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  return s1 < e2 && e1 > s2;
}

// Check property availability in Skyway Suites database
export async function checkPropertyAvailability(
  propertyId: string,
  checkIn: string,
  checkOut: string
): Promise<{ available: boolean; conflictingBooking?: Booking }> {
  try {
    const bookings = await getPropertyBookings(propertyId);
    
    for (const booking of bookings) {
      if (doDatesOverlap(checkIn, checkOut, booking.checkIn, booking.checkOut)) {
        return { available: false, conflictingBooking: booking };
      }
    }
    
    return { available: true };
  } catch (error) {
    console.error('Failed to check availability:', error);
    return { available: true }; // Fail open to allow bookings if check fails
  }
}

// Parse iCal format to extract booking dates
export function parseICalDates(icalData: string): Array<{ start: string; end: string }> {
  const events: Array<{ start: string; end: string }> = [];
  const lines = icalData.split('\n');
  
  let currentEvent: { start?: string; end?: string } = {};
  let inEvent = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (trimmed === 'END:VEVENT') {
      if (currentEvent.start && currentEvent.end) {
        events.push({ start: currentEvent.start, end: currentEvent.end });
      }
      inEvent = false;
      currentEvent = {};
    } else if (inEvent) {
      if (trimmed.startsWith('DTSTART')) {
        const dateMatch = trimmed.match(/DTSTART[;:](.+)/);
        if (dateMatch) {
          const dateStr = dateMatch[1].split('T')[0];
          currentEvent.start = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        }
      } else if (trimmed.startsWith('DTEND')) {
        const dateMatch = trimmed.match(/DTEND[;:](.+)/);
        if (dateMatch) {
          const dateStr = dateMatch[1].split('T')[0];
          currentEvent.end = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        }
      }
    }
  }
  
  return events;
}

// Check Airbnb calendar availability
export async function checkAirbnbAvailability(
  propertyId: string,
  checkIn: string,
  checkOut: string
): Promise<{ available: boolean; conflictDate?: string }>;
export async function checkAirbnbAvailability(
  icalUrl: string,
  checkIn: string,
  checkOut: string
): Promise<{ available: boolean; conflictDate?: string; airbnbBookings?: Array<{ checkIn: string; checkOut: string }> }>;
export async function checkAirbnbAvailability(
  propertyOrUrl: Property | string,
  checkIn: string,
  checkOut: string
): Promise<{ available: boolean; conflictDate?: string; airbnbBookings?: Array<{ checkIn: string; checkOut: string }> }> {
  let airbnbCalendarUrl: string | undefined;
  
  // Handle both Property object and direct URL string
  if (typeof propertyOrUrl === 'string') {
    airbnbCalendarUrl = propertyOrUrl;
  } else {
    if (!propertyOrUrl.calendarSyncEnabled || !propertyOrUrl.airbnbCalendarUrl) {
      return { available: true };
    }
    airbnbCalendarUrl = propertyOrUrl.airbnbCalendarUrl;
  }
  
  if (!airbnbCalendarUrl) {
    return { available: true };
  }
  
  try {
    // Use proxy endpoint to avoid CORS issues
    const proxyUrl = `/api/proxy-ical?url=${encodeURIComponent(airbnbCalendarUrl)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch Airbnb calendar via proxy');
      return { available: true, airbnbBookings: [] }; // Fail open
    }
    
    const icalData = await response.text();
    const airbnbBookings = parseICalDates(icalData);
    
    // Convert to our booking format
    const formattedBookings = airbnbBookings.map(booking => ({
      checkIn: booking.start,
      checkOut: booking.end,
    }));
    
    // If checkIn and checkOut are provided, check for conflicts
    if (checkIn && checkOut) {
      for (const booking of airbnbBookings) {
        if (doDatesOverlap(checkIn, checkOut, booking.start, booking.end)) {
          return { available: false, conflictDate: booking.end, airbnbBookings: formattedBookings };
        }
      }
    }
    
    return { available: true, airbnbBookings: formattedBookings };
  } catch (error) {
    console.error('Failed to check Airbnb availability:', error);
    return { available: true, airbnbBookings: [] }; // Fail open
  }
}

export async function createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=bookings`, {
    method: 'POST',
    body: JSON.stringify({
      propertyId: booking.propertyId,
      customerId: booking.customerId,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      totalPrice: booking.totalPrice,
    }),
  });
}

export async function updateBooking(id: string, booking: Partial<Booking>): Promise<Booking> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=bookings&id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(booking),
  });
}

export async function deleteBooking(id: string): Promise<void> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=bookings&id=${id}`, {
    method: 'DELETE',
  });
}

// Customers API
export async function getCustomers(): Promise<Customer[]> {
  try {
    const result = await fetchWithAuth(`${API_BASE_URL}?endpoint=customers`);
    // Filter out any invalid customer objects that don't have required fields
    if (Array.isArray(result)) {
      return result.filter(customer => customer && customer.id && customer.email && customer.name);
    }
    return [];
  } catch (error) {
    if (error instanceof Error && (error.message === 'PREVIEW_MODE' || error.message === 'API_NOT_DEPLOYED')) {
      return [];
    }
    if (isProduction()) {
      console.error('Failed to fetch customers:', error);
    }
    return [];
  }
}

export async function createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'totalBookings'>): Promise<Customer> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=customers`, {
    method: 'POST',
    body: JSON.stringify(customer),
  });
}

export async function updateCustomer(id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt' | 'totalBookings'>>): Promise<Customer> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=customers&id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(customer),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=customers&id=${id}`, {
    method: 'DELETE',
  });
}

// Payments API
export async function getPayments(): Promise<Payment[]> {
  try {
    const result = await fetchWithAuth(`${API_BASE_URL}?endpoint=payments`);
    return result || [];
  } catch (error) {
    if (error instanceof Error && (error.message === 'PREVIEW_MODE' || error.message === 'API_NOT_DEPLOYED')) {
      return [];
    }
    if (isProduction()) {
      console.error('Failed to fetch payments:', error);
    }
    return [];
  }
}

export async function createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=payments`, {
    method: 'POST',
    body: JSON.stringify({
      bookingId: payment.bookingId,
      customerId: payment.customerId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
    }),
  });
}

export async function deletePayment(id: string): Promise<void> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=payments&id=${id}`, {
    method: 'DELETE',
  });
}

// Hero Settings API
export async function getHeroSettings(): Promise<HeroSettings | null> {
  try {
    return await fetchWithAuth(`${API_BASE_URL}?endpoint=settings&action=category&category=hero`);
  } catch (error) {
    return null;
  }
}

export async function updateHeroSettings(settings: HeroSettings): Promise<HeroSettings> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=settings`, {
    method: 'PUT',
    body: JSON.stringify([
      { category: 'hero', key: 'background_image', value: settings.backgroundImage }
    ]),
  });
}

// Maintenance Mode API
export interface MaintenanceSettings {
  enabled: string; // 'true' or 'false'
  message?: string;
  estimated_time?: string;
}

export interface CompanyInfo {
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface NotificationSettings {
  // Email integration
  emailProvider?: string;
  emailApiKey?: string;
  emailFromAddress?: string;
  emailFromName?: string;
  adminNotificationEmail?: string;
  
  // SMTP Configuration
  smtpHost?: string;
  smtpPort?: string;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  
  // WhatsApp integration
  whatsappProvider?: string;
  whatsappAccountSid?: string;
  whatsappAuthToken?: string;
  whatsappFromNumber?: string;
  wesendrApiKey?: string;
  
  // Notification actions
  notificationActions?: {
    accountCreated: { email: boolean; whatsapp: boolean };
    bookingCreated: { email: boolean; whatsapp: boolean };
    bookingConfirmed: { email: boolean; whatsapp: boolean };
  };
  
  // Test email
  testEmail?: string;
}

export async function getMaintenanceSettings(): Promise<MaintenanceSettings | null> {
  try {
    return await fetchWithAuth(`${API_BASE_URL}?endpoint=settings&action=maintenance`);
  } catch (error) {
    return null;
  }
}

export async function updateMaintenanceSettings(settings: MaintenanceSettings): Promise<MaintenanceSettings> {
  const settingsArray = [
    { category: 'maintenance', key: 'enabled', value: settings.enabled }
  ];
  if (settings.message) {
    settingsArray.push({ category: 'maintenance', key: 'message', value: settings.message });
  }
  if (settings.estimated_time) {
    settingsArray.push({ category: 'maintenance', key: 'estimated_time', value: settings.estimated_time });
  }
  
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=settings`, {
    method: 'PUT',
    body: JSON.stringify(settingsArray),
  });
}

// Company Info API
export async function getCompanyInfo(): Promise<CompanyInfo | null> {
  try {
    return await fetchWithAuth(`${API_BASE_URL}?endpoint=settings&action=category&category=company`);
  } catch (error) {
    return null;
  }
}

export async function updateCompanyInfo(info: CompanyInfo): Promise<CompanyInfo> {
  const settingsArray = [];
  if (info.companyName !== undefined) {
    settingsArray.push({ category: 'company', key: 'company_name', value: info.companyName });
  }
  if (info.email !== undefined) {
    settingsArray.push({ category: 'company', key: 'email', value: info.email });
  }
  if (info.phone !== undefined) {
    settingsArray.push({ category: 'company', key: 'phone', value: info.phone });
  }
  if (info.address !== undefined) {
    settingsArray.push({ category: 'company', key: 'address', value: info.address });
  }
  
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=settings`, {
    method: 'PUT',
    body: JSON.stringify(settingsArray),
  });
}

// Notification Settings API
export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  try {
    return await fetchWithAuth(`${API_BASE_URL}?endpoint=settings&action=category&category=notifications`);
  } catch (error) {
    return null;
  }
}

export async function updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
  const settingsArray = [];
  
  // Email integration settings
  if (settings.emailProvider !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'email_provider', value: settings.emailProvider });
  }
  if (settings.emailApiKey !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'email_api_key', value: settings.emailApiKey });
  }
  if (settings.emailFromAddress !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'email_from_address', value: settings.emailFromAddress });
  }
  if (settings.emailFromName !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'email_from_name', value: settings.emailFromName });
  }
  if (settings.adminNotificationEmail !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'admin_notification_email', value: settings.adminNotificationEmail });
  }
  
  // SMTP Configuration settings
  if (settings.smtpHost !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'smtp_host', value: settings.smtpHost });
  }
  if (settings.smtpPort !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'smtp_port', value: settings.smtpPort });
  }
  if (settings.smtpUsername !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'smtp_username', value: settings.smtpUsername });
  }
  if (settings.smtpPassword !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'smtp_password', value: settings.smtpPassword });
  }
  if (settings.smtpSecure !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'smtp_secure', value: String(settings.smtpSecure) });
  }
  
  // WhatsApp integration settings
  if (settings.whatsappProvider !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'whatsapp_provider', value: settings.whatsappProvider });
  }
  if (settings.whatsappAccountSid !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'whatsapp_account_sid', value: settings.whatsappAccountSid });
  }
  if (settings.whatsappAuthToken !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'whatsapp_auth_token', value: settings.whatsappAuthToken });
  }
  if (settings.whatsappFromNumber !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'whatsapp_from_number', value: settings.whatsappFromNumber });
  }
  if (settings.wesendrApiKey !== undefined) {
    settingsArray.push({ category: 'notifications', key: 'wesendr_api_key', value: settings.wesendrApiKey });
  }
  
  // Notification actions
  if (settings.notificationActions !== undefined) {
    settingsArray.push({ 
      category: 'notifications', 
      key: 'notification_actions', 
      value: JSON.stringify(settings.notificationActions) 
    });
  }
  
  // Test email - if provided, send test email
  if (settings.testEmail !== undefined) {
    // Trigger test email endpoint
    await fetchWithAuth(`${API_BASE_URL}?endpoint=test-email`, {
      method: 'POST',
      body: JSON.stringify({ 
        testEmail: settings.testEmail,
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUsername: settings.smtpUsername,
        smtpPassword: settings.smtpPassword,
        smtpSecure: settings.smtpSecure,
        emailFromAddress: settings.emailFromAddress,
        emailFromName: settings.emailFromName,
      }),
    });
  }
  
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=settings`, {
    method: 'PUT',
    body: JSON.stringify(settingsArray),
  });
}

// Helper function to check for booking conflicts (double booking prevention)
export function hasBookingConflict(
  checkIn: string,
  checkOut: string,
  propertyId: string,
  bookings: Booking[],
  payments: Payment[],
  excludeBookingId?: string
): boolean {
  const newCheckIn = new Date(checkIn);
  const newCheckOut = new Date(checkOut);

  // Get all confirmed bookings for this property
  const propertyBookings = bookings.filter(
    booking => 
      booking.propertyId === propertyId && 
      booking.id !== excludeBookingId
  );

  // Check each booking for conflicts
  for (const booking of propertyBookings) {
    // Check if booking is paid (confirmed)
    const payment = payments.find(p => p.bookingId === booking.id);
    const isPaid = payment && payment.status === 'paid' && payment.amount >= booking.totalPrice;

    // Only check for conflicts with paid bookings
    if (isPaid) {
      const existingCheckIn = new Date(booking.checkIn);
      const existingCheckOut = new Date(booking.checkOut);

      // Check for date overlap
      const hasOverlap = (
        (newCheckIn >= existingCheckIn && newCheckIn < existingCheckOut) ||
        (newCheckOut > existingCheckIn && newCheckOut <= existingCheckOut) ||
        (newCheckIn <= existingCheckIn && newCheckOut >= existingCheckOut)
      );

      if (hasOverlap) {
        return true;
      }
    }
  }

  return false;
}

// Generate iCal URL for a property
export function generateICalUrl(propertyId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/api/calendar/${propertyId}.ics`;
}

// Users API
export async function getUsers(): Promise<User[]> {
  try {
    const result = await fetchWithAuth(`${API_BASE_URL}?endpoint=users`);
    // Filter out any invalid user objects that don't have required fields
    if (Array.isArray(result)) {
      return result.filter(user => user && user.id && user.email && user.name);
    }
    return [];
  } catch (error) {
    if (error instanceof Error && (error.message === 'PREVIEW_MODE' || error.message === 'API_NOT_DEPLOYED')) {
      return [];
    }
    if (isProduction()) {
      console.error('Failed to fetch users:', error);
    }
    return [];
  }
}

export async function createUser(user: { email: string; password: string; name: string; role: 'admin' | 'customer' }): Promise<User> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=users`, {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

export async function updateUser(id: string, user: { email?: string; name?: string; role?: 'admin' | 'customer'; password?: string }): Promise<User> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=users&id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });
}

export async function deleteUser(id: string): Promise<void> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=users&id=${id}`, {
    method: 'DELETE',
  });
}

// Reviews API
export async function getReviews(propertyId?: string): Promise<Review[]> {
  try {
    const url = propertyId 
      ? `${API_BASE_URL}?endpoint=reviews&propertyId=${propertyId}`
      : `${API_BASE_URL}?endpoint=reviews`;
    const result = await fetchWithAuth(url);
    return result || [];
  } catch (error) {
    if (error instanceof Error && (error.message === 'PREVIEW_MODE' || error.message === 'API_NOT_DEPLOYED')) {
      return [];
    }
    if (isProduction()) {
      console.error('Failed to fetch reviews:', error);
    }
    return [];
  }
}

export async function getReviewByBooking(bookingId: string): Promise<Review | null> {
  try {
    return await fetchWithAuth(`${API_BASE_URL}?endpoint=reviews&bookingId=${bookingId}`);
  } catch (error) {
    if (error instanceof Error && (error.message === 'PREVIEW_MODE' || error.message === 'API_NOT_DEPLOYED')) {
      return null;
    }
    if (isProduction()) {
      console.error('Failed to fetch review:', error);
    }
    return null;
  }
}

export async function createReview(review: Omit<Review, 'id' | 'createdAt' | 'customerName'>): Promise<Review> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
  });
}

export async function updateReview(id: string, review: { rating?: number; comment?: string }): Promise<Review> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=reviews&id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(review),
  });
}

export async function deleteReview(id: string): Promise<void> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=reviews&id=${id}`, {
    method: 'DELETE',
  });
}