import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router';
import { MapPin, Users, Bed, Bath, Check } from 'lucide-react';
import { getProperty, Property, createBooking } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BookingModal } from '../components/BookingModal';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // Get booking state from URL params (if returning from login)
  const initialCheckIn = searchParams.get('checkIn') || '';
  const initialCheckOut = searchParams.get('checkOut') || '';
  const initialGuests = searchParams.get('guests') || '1';
  
  const { user } = useAuth();

  useEffect(() => {
    async function fetchProperty() {
      if (!id) {
        setError('Property ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 PropertyDetails - Fetching property with ID:', id);
        const data = await getProperty(id);
        console.log('✅ Property data received:', data);
        
        if (!data) {
          console.log('❌ No data returned from API');
          setError('Property not found');
        } else {
          setProperty(data);
        }
      } catch (err) {
        console.error('Failed to fetch property:', err);
        setError(err instanceof Error ? err.message : 'Failed to load property');
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id]);

  // Auto-open modal if returning from login with booking params
  useEffect(() => {
    if (property && user && initialCheckIn && initialCheckOut && !isBookingModalOpen) {
      setIsBookingModalOpen(true);
    }
  }, [property, user, initialCheckIn, initialCheckOut, isBookingModalOpen]);

  const handleBookingSubmit = async (bookingData: {
    checkIn: string;
    checkOut: string;
    guests: number;
    totalPrice: number;
    numberOfNights: number;
    discountPercent: number;
  }) => {
    if (!user || !property) {
      toast.error('Please login to make a booking');
      return;
    }

    try {
      console.log('📝 Submitting booking:', bookingData);
      
      const booking = await createBooking({
        propertyId: property.id,
        customerId: user.id, // Add the user ID
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: bookingData.guests,
        totalPrice: bookingData.totalPrice,
        status: 'pending' as const,
      });

      console.log('✅ Booking created:', booking);
      
      setIsBookingModalOpen(false);
      toast.success('Booking request submitted successfully!');
      
      // Optional: Navigate to bookings page
      // navigate('/bookings');
    } catch (error) {
      console.error('❌ Booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      toast.error(errorMessage);
    }
  };

  const handleBookNowClick = () => {
    if (!user) {
      // Build return URL with current path
      const returnUrl = window.location.pathname;
      navigate(`/login?returnTo=${encodeURIComponent(returnUrl)}`);
    } else {
      setIsBookingModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#6B7C3C' }}></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#3a3a3a' }}>
            {error || 'Property Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            The property you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/properties">
              <Button style={{ backgroundColor: '#6B7C3C', color: 'white' }}>
                Browse All Properties
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline">
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          {' > '}
          <Link to="/properties" className="hover:text-blue-600">Properties</Link>
          {' > '}
          <span>{property.title}</span>
        </div>

        {/* Image */}
        <div
          className="h-96 rounded-lg bg-cover bg-center mb-8"
          style={{ backgroundImage: `url('${property.image}')` }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl mb-4">{property.title}</h1>
            
            {/* Category Badge - Charcoal black background */}
            <div className="mb-4">
              <span className="inline-block bg-[#3a3a3a] text-white text-sm px-3 py-1.5 rounded-md">
                {property.category}
              </span>
            </div>
            
            <div className="flex items-center text-gray-600 mb-6">
              <MapPin className="h-5 w-5 mr-2" />
              {property.location}
            </div>

            <div className="flex items-center gap-6 mb-8 pb-8 border-b">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <span>{property.guests} guests</span>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-gray-600" />
                <span>{property.bedrooms} bedrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-gray-600" />
                <span>{property.bathrooms} bathrooms</span>
              </div>
            </div>

            <div className="mb-8 pb-8 border-b">
              <h2 className="text-2xl mb-4">About this place</h2>
              <p className="text-gray-600">{property.description}</p>
            </div>

            <div>
              <h2 className="text-2xl mb-4">Amenities</h2>
              <div className="grid grid-cols-2 gap-4">
                {property.amenities && property.amenities.length > 0 ? (
                  property.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span>{amenity}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 col-span-2">No amenities listed</p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Card - Simple CTA */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="text-2xl">${property.price}</span>
                  <span className="text-sm font-normal text-gray-600">per night</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={handleBookNowClick}>
                  {user ? 'Book Now' : 'Login to Book'}
                </Button>
                <p className="text-sm text-gray-600 text-center mt-3">
                  You won't be charged yet
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {property && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          property={property}
          onBookingSubmit={handleBookingSubmit}
          initialCheckIn={initialCheckIn}
          initialCheckOut={initialCheckOut}
          initialGuests={initialGuests}
        />
      )}
    </div>
  );
}