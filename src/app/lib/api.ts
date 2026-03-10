// API functions to connect to your Neon database
// Backend API URL - automatically uses Vercel's API routes in production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
  amenities: string[];
  available: boolean;
  averageRating?: number;
  reviewCount?: number;
  icalUrl?: string;
  airbnbCalendarUrl?: string;
  bookingCalendarUrl?: string;
  vrboCalendarUrl?: string;
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
    // Silently fail in preview mode - no noisy console warnings
    throw new Error('PREVIEW_MODE');
  }

  try {
    // Only log in development/production, not in preview
    if (isProduction()) {
      console.log('🌐 API Request:', url, options.method || 'GET');
    }
    
    const response = await fetch(url, { 
      ...options, 
      headers,
      cache: 'no-cache'
    });
    
    // Check if response is HTML (error page) - API not available
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      // API is not available (deployment issue)
      if (isProduction()) {
        console.error('❌ API endpoint returned HTML - not deployed correctly');
      }
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
    return await fetchWithAuth(`${API_BASE_URL}?endpoint=properties&id=${id}`);
  } catch (error) {
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
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=properties`, {
    method: 'POST',
    body: JSON.stringify(property),
  });
}

export async function updateProperty(id: string, property: Partial<Property>): Promise<Property | null> {
  return await fetchWithAuth(`${API_BASE_URL}?endpoint=properties&id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(property),
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
    return [];
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
    return result || [];
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
    return result || [];
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