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
    const response = await fetch(url, { ...options, headers });
    
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
    // Re-throw the error so it can be caught by the calling function
    throw error;
  }
}

// Properties API
export async function getProperties(): Promise<Property[]> {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/properties`);
  } catch (error) {
    // Silently use mock data when backend is not available
    return getMockProperties();
  }
}

export async function getProperty(id: string): Promise<Property | null> {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/properties?id=${id}`);
  } catch (error) {
    // Silently use mock data when backend is not available
    return getMockProperties().find(p => p.id === id) || null;
  }
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
  try {
    return await fetchWithAuth(`${API_BASE_URL}/bookings`);
  } catch (error) {
    // Silently use mock data when backend is not available
    return getMockBookings();
  }
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
  try {
    return await fetchWithAuth(`${API_BASE_URL}/customers`);
  } catch (error) {
    // Silently use mock data when backend is not available
    return getMockCustomers();
  }
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
  try {
    return await fetchWithAuth(`${API_BASE_URL}/payments`);
  } catch (error) {
    // Silently use mock data when backend is not available
    return getMockPayments();
  }
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

// Mock data functions (fallback when backend is not running)
function getMockProperties(): Property[] {
  return [
    {
      id: '1',
      title: 'Luxury Downtown Apartment',
      description: 'Beautiful modern apartment in the heart of downtown with stunning city views.',
      price: 150,
      location: 'New York, NY',
      bedrooms: 2,
      bathrooms: 2,
      guests: 4,
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'TV', 'Workspace'],
      available: true,
    },
    {
      id: '2',
      title: 'Cozy Beach House',
      description: 'Relaxing beachfront property with private access to the beach.',
      price: 200,
      location: 'Malibu, CA',
      bedrooms: 3,
      bathrooms: 2,
      guests: 6,
      image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
      amenities: ['WiFi', 'Beach Access', 'BBQ Grill', 'Parking', 'Ocean View'],
      available: true,
    },
    {
      id: '3',
      title: 'Mountain Cabin Retreat',
      description: 'Secluded cabin in the mountains perfect for a peaceful getaway.',
      price: 120,
      location: 'Aspen, CO',
      bedrooms: 2,
      bathrooms: 1,
      guests: 4,
      image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800',
      amenities: ['Fireplace', 'Hiking Trails', 'Pet Friendly', 'Kitchen', 'Hot Tub'],
      available: true,
    },
  ];
}

function getMockBookings(): Booking[] {
  return [
    {
      id: '1',
      propertyId: '1',
      customerId: '1',
      checkIn: '2026-03-15',
      checkOut: '2026-03-20',
      guests: 2,
      totalPrice: 750,
      status: 'confirmed',
      createdAt: '2026-03-01',
    },
    {
      id: '2',
      propertyId: '2',
      customerId: '2',
      checkIn: '2026-04-10',
      checkOut: '2026-04-17',
      guests: 4,
      totalPrice: 1400,
      status: 'pending',
      createdAt: '2026-03-05',
    },
  ];
}

function getMockCustomers(): Customer[] {
  return [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      createdAt: '2026-01-15',
      totalBookings: 5,
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 (555) 987-6543',
      createdAt: '2026-02-20',
      totalBookings: 3,
    },
  ];
}

function getMockPayments(): Payment[] {
  return [
    {
      id: '1',
      bookingId: '1',
      customerId: '1',
      amount: 750,
      status: 'paid',
      paymentMethod: 'Credit Card',
      createdAt: '2026-03-01',
    },
    {
      id: '2',
      bookingId: '2',
      customerId: '2',
      amount: 1400,
      status: 'pending',
      paymentMethod: 'Credit Card',
      createdAt: '2026-03-05',
    },
  ];
}

// Hero Settings API
export async function getHeroSettings(): Promise<HeroSettings | null> {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/settings?category=hero`);
  } catch (error) {
    // Return null when backend is not available
    return null;
  }
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