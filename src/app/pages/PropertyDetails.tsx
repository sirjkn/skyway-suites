import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router';
import { MapPin, Users, Bed, Bath, Wifi, Check, Tag, AlertCircle, Loader2, Star, MessageCircle } from 'lucide-react';
import { 
  getProperty, 
  Property, 
  createBooking, 
  checkPropertyAvailability,
  checkAirbnbAvailability,
  getPropertyBookings,
  getPayments,
  Booking,
  getReviews,
  createReview,
  Review
} from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { PhotoGallery } from '../components/PhotoGallery';
import { formatDateOnly } from '../lib/dateUtils';
import { SEO } from '../components/SEO';
import { PropertyStructuredData, BreadcrumbStructuredData } from '../components/StructuredData';

export function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [appConflict, setAppConflict] = useState<{ hasConflict: boolean; availableDate?: string }>({ hasConflict: false });
  const [checkingApp, setCheckingApp] = useState(false);
  const [airbnbConflict, setAirbnbConflict] = useState<{ hasConflict: boolean; availableDate?: string }>({ hasConflict: false });
  const [checkingAirbnb, setCheckingAirbnb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasCompletedStay, setHasCompletedStay] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  
  // Get booking state from URL params (if returning from login)
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '1');
  
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
          
          // Check current booking status - only show as booked if confirmed AND fully paid
          const bookings = await getPropertyBookings(id);
          const payments = await getPayments();
          const now = new Date();
          
          // Find active confirmed bookings (checkout date hasn't passed yet)
          const activeBookings = bookings.filter(booking => {
            const checkOut = new Date(booking.checkOut);
            return checkOut > now && booking.status === 'confirmed';
          });
          
          // Check if any active booking is fully paid
          for (const booking of activeBookings) {
            const bookingPayments = payments.filter(p => p.bookingId === booking.id && p.status === 'paid');
            const totalPaid = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
            
            // If booking is confirmed and fully paid, property is booked
            if (totalPaid >= booking.totalPrice) {
              setCurrentBooking(booking);
              break;
            }
          }
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

  // Check App (Skyway Suites) availability when dates change
  useEffect(() => {
    async function checkApp() {
      if (!id || !checkIn || !checkOut) {
        setAppConflict({ hasConflict: false });
        return;
      }

      const numberOfDays = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
      if (numberOfDays <= 0) {
        setAppConflict({ hasConflict: false });
        return;
      }

      setCheckingApp(true);
      const appCheck = await checkPropertyAvailability(id, checkIn, checkOut);
      setCheckingApp(false);

      if (!appCheck.available && appCheck.conflictingBooking) {
        const availableDate = formatDateOnly(appCheck.conflictingBooking.checkOut);
        setAppConflict({ hasConflict: true, availableDate });
      } else {
        setAppConflict({ hasConflict: false });
      }
    }

    checkApp();
  }, [id, checkIn, checkOut]);

  // Check Airbnb availability when dates change
  useEffect(() => {
    async function checkAirbnb() {
      if (!property || !checkIn || !checkOut) {
        setAirbnbConflict({ hasConflict: false });
        return;
      }

      const numberOfDays = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
      if (numberOfDays <= 0) {
        setAirbnbConflict({ hasConflict: false });
        return;
      }

      setCheckingAirbnb(true);
      const airbnbCheck = await checkAirbnbAvailability(property, checkIn, checkOut);
      setCheckingAirbnb(false);

      if (!airbnbCheck.available && airbnbCheck.conflictDate) {
        const availableDate = formatDateOnly(airbnbCheck.conflictDate);
        setAirbnbConflict({ hasConflict: true, availableDate });
      } else {
        setAirbnbConflict({ hasConflict: false });
      }
    }

    checkAirbnb();
  }, [property, checkIn, checkOut]);

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to make a booking');
      return;
    }
    if (!checkIn || !checkOut || !id || !property) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    
    // Calculate total price with discounts
    const numberOfDays = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    
    if (numberOfDays <= 0) {
      toast.error('Check-out must be after check-in');
      return;
    }
    
    // Check Skyway Suites database availability
    const skywayCheck = await checkPropertyAvailability(id, checkIn, checkOut);
    if (!skywayCheck.available && skywayCheck.conflictingBooking) {
      const availableDate = formatDateOnly(skywayCheck.conflictingBooking.checkOut);
      toast.error(`Property Booked, Available after ${availableDate}`, {
        style: {
          background: '#DC2626',
          color: 'white',
        },
        duration: 5000,
      });
      return;
    }
    
    const basePrice = property.price * numberOfDays;
    let discountPercent = 0;
    if (numberOfDays >= 30) {
      discountPercent = 8;
    } else if (numberOfDays >= 7) {
      discountPercent = 2;
    }
    const discountAmount = basePrice * (discountPercent / 100);
    const totalPrice = basePrice - discountAmount;
    
    // Connect to your Neon database to create booking
    try {
      setIsBooking(true);
      const response = await createBooking({
        propertyId: id,
        customerId: user.id,
        checkIn: checkIn,
        checkOut: checkOut,
        guests: parseInt(guests),
        totalPrice: totalPrice,
        status: 'pending',
      });
      toast.success('Booking request submitted successfully!');
      toast.info('📧 Confirmation email sent to your email address', { duration: 3000 });
    } catch (err) {
      console.error('Failed to create booking:', err);
      toast.error('Failed to create booking');
    } finally {
      setIsBooking(false);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="mb-6 rounded-lg overflow-hidden">
              <img 
                src={property.image} 
                alt={property.title} 
                className="w-full h-96 object-cover"
              />
            </div>
            
            {/* Booking Status Banner */}
            {currentBooking && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-600 p-4 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">Booked</p>
                    <p className="text-sm text-red-700">
                      Available after {formatDateOnly(currentBooking.checkOut)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
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
              <div className="grid grid-cols-2 gap-4 mb-8">
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

              {/* Photo Gallery */}
              {((property.categorizedPhotos && 
                (property.categorizedPhotos.livingRoom?.length || 
                 property.categorizedPhotos.bedroom?.length || 
                 property.categorizedPhotos.kitchen?.length || 
                 property.categorizedPhotos.dining?.length || 
                 property.categorizedPhotos.amenities?.length)) || 
                (property.photos && property.photos.length > 0)) && (
                <div className="mt-8">
                  <h2 className="text-2xl mb-4">Property Photos</h2>
                  <PhotoGallery 
                    photos={property.photos} 
                    categorizedPhotos={property.categorizedPhotos}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Booking Card */}
          <div>
            <Card className="sticky top-24">
              <CardHeader className="bg-orange-500 text-white rounded-t-lg">
                <CardTitle className="flex justify-between items-center">
                  <span className="text-2xl">KES {property.price.toLocaleString()}</span>
                  <span className="text-sm font-normal text-white/90">per night</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">Check-in</label>
                    <Input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Check-out</label>
                    <Input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Guests</label>
                    <Input
                      type="number"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      min="1"
                      max={property.guests}
                    />
                  </div>

                  {/* App (Skyway Suites) Conflict Warning - Inline RED */}
                  {checkingApp && (
                    <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                        <p className="text-sm text-red-800">Checking availability...</p>
                      </div>
                    </div>
                  )}

                  {appConflict.hasConflict && !checkingApp && (
                    <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-red-800 text-sm">Property Booked</p>
                          <p className="text-xs text-red-700 mt-1">
                            Choose from {appConflict.availableDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Airbnb Conflict Warning - Inline AMBER */}
                  {checkingAirbnb && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent"></div>
                        <p className="text-sm text-amber-800">Checking Airbnb availability...</p>
                      </div>
                    </div>
                  )}

                  {airbnbConflict.hasConflict && !checkingAirbnb && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-amber-800 text-sm">Property Booked in AirBNB</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Available after {airbnbConflict.availableDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Discount Information Banner */}
                  <div className="bg-[#6B7C3C]/10 border border-[#6B7C3C]/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Tag className="h-4 w-4 text-[#6B7C3C] mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-[#3a3a3a]">
                        <div className="font-semibold mb-1">Special Discounts!</div>
                        <div className="space-y-0.5">
                          <div>• 7+ days: <span className="font-semibold">2% off</span></div>
                          <div>• 30+ days: <span className="font-semibold">8% off</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  {checkIn && checkOut && (() => {
                    const numberOfDays = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (numberOfDays <= 0) return null;
                    
                    const basePrice = property.price * numberOfDays;
                    
                    let discountPercent = 0;
                    if (numberOfDays >= 30) {
                      discountPercent = 8;
                    } else if (numberOfDays >= 7) {
                      discountPercent = 2;
                    }
                    
                    const discountAmount = basePrice * (discountPercent / 100);
                    const finalPrice = basePrice - discountAmount;
                    
                    return (
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
                        <div className="text-xs font-semibold mb-2">Price Breakdown</div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">KES {property.price.toLocaleString()} × {numberOfDays} night{numberOfDays > 1 ? 's' : ''}</span>
                          <span>KES {basePrice.toLocaleString()}</span>
                        </div>
                        {discountPercent > 0 && (
                          <div className="flex justify-between text-xs text-[#6B7C3C]">
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {discountPercent}% Discount
                            </span>
                            <span>-KES {discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-300 pt-2 mt-2"></div>
                        <div className="flex justify-between font-semibold text-sm">
                          <span>Total</span>
                          <span>KES {Math.round(finalPrice).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {user ? (
                    <Button className="w-full" onClick={handleBooking} disabled={isBooking}>
                      {isBooking ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Booking...
                        </>
                      ) : (
                        'Request to Book'
                      )}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        // Build return URL with booking state
                        const params = new URLSearchParams();
                        if (checkIn) params.set('checkIn', checkIn);
                        if (checkOut) params.set('checkOut', checkOut);
                        if (guests) params.set('guests', guests);
                        
                        const currentPath = window.location.pathname;
                        const returnUrl = params.toString() 
                          ? `${currentPath}?${params.toString()}`
                          : currentPath;
                        
                        // Navigate to login with return URL
                        navigate(`/login?returnTo=${encodeURIComponent(returnUrl)}`);
                      }}
                    >
                      Login to Book
                    </Button>
                  )}
                  <p className="text-sm text-gray-600 text-center">
                    You won't be charged yet
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <SEO
        title={property.title}
        description={property.description}
        image={property.image}
        url={`/properties/${property.id}`}
        type="product"
        price={property.price}
        keywords={[
          property.location,
          property.category || '',
          'vacation rental',
          'short term stay',
          `${property.bedrooms} bedroom`,
          `${property.guests} guests`,
        ]}
      />
      <PropertyStructuredData property={property} />
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: '/' },
          { name: 'Properties', url: '/properties' },
          { name: property.title, url: `/properties/${property.id}` },
        ]}
      />
    </div>
  );
}