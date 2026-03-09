// API functions to connect to your Neon database
// Backend API URL - automatically uses Vercel's API routes in production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  image: string;
  images?: string[]; // Multiple images support
  amenities: string[];
  available: boolean;
  icalUrl?: string;
  airbnbCalendarUrl?: string;
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

  try {
    const response = await fetch(url, { 
      ...options, 
      headers,
      cache: 'no-cache' // Prevent caching issues in development
    });
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Re-throw the error so it can be caught by the calling function
    throw error;
  }
}

// Properties API
export async function getProperties(): Promise<Property[]> {
  return await fetchWithAuth(`${API_BASE_URL}/properties`);
}

export async function getProperty(id: string): Promise<Property | null> {
  return await fetchWithAuth(`${API_BASE_URL}/properties?id=${id}`);
}

export async function createProperty(property: Omit<Property, 'id'>): Promise<Property> {
  return await fetchWithAuth(`${API_BASE_URL}/properties`, {
    method: 'POST',
    body: JSON.stringify(property),
  });
}

export async function updateProperty(id: string, property: Partial<Property>): Promise<Property> {
  return await fetchWithAuth(`${API_BASE_URL}/properties?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(property),
  });
}

export async function deleteProperty(id: string): Promise<void> {
  return await fetchWithAuth(`${API_BASE_URL}/properties?id=${id}`, {
    method: 'DELETE',
  });
}

// Bookings API
export async function getBookings(): Promise<Booking[]> {
  return await fetchWithAuth(`${API_BASE_URL}/bookings`);
}

export async function createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
  return await fetchWithAuth(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    body: JSON.stringify({
      property_id: booking.propertyId,
      customer_id: booking.customerId,
      check_in: booking.checkIn,
      check_out: booking.checkOut,
      guests: booking.guests,
      total_price: booking.totalPrice,
    }),
  });
}

export async function updateBooking(id: string, booking: Partial<Booking>): Promise<Booking> {
  return await fetchWithAuth(`${API_BASE_URL}/bookings?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(booking),
  });
}

export async function deleteBooking(id: string): Promise<void> {
  return await fetchWithAuth(`${API_BASE_URL}/bookings?id=${id}`, {
    method: 'DELETE',
  });
}

// Customers API
export async function getCustomers(): Promise<Customer[]> {
  return await fetchWithAuth(`${API_BASE_URL}/customers`);
}

export async function createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'totalBookings'>): Promise<Customer> {
  return await fetchWithAuth(`${API_BASE_URL}/customers`, {
    method: 'POST',
    body: JSON.stringify(customer),
  });
}

export async function updateCustomer(id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt' | 'totalBookings'>>): Promise<Customer> {
  return await fetchWithAuth(`${API_BASE_URL}/customers?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(customer),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  return await fetchWithAuth(`${API_BASE_URL}/customers?id=${id}`, {
    method: 'DELETE',
  });
}

// Payments API
export async function getPayments(): Promise<Payment[]> {
  return await fetchWithAuth(`${API_BASE_URL}/payments`);
}

export async function createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
  return await fetchWithAuth(`${API_BASE_URL}/payments`, {
    method: 'POST',
    body: JSON.stringify({
      booking_id: payment.bookingId,
      customer_id: payment.customerId,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
    }),
  });
}

export async function deletePayment(id: string): Promise<void> {
  return await fetchWithAuth(`${API_BASE_URL}/payments?id=${id}`, {
    method: 'DELETE',
  });
}

// Hero Settings API
export async function getHeroSettings(): Promise<HeroSettings | null> {
  return await fetchWithAuth(`${API_BASE_URL}/settings?category=hero`);
}

export async function updateHeroSettings(settings: HeroSettings): Promise<HeroSettings> {
  return await fetchWithAuth(`${API_BASE_URL}/settings?category=hero`, {
    method: 'PUT',
    body: JSON.stringify(settings),
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