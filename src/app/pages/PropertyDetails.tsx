import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { MapPin, Users, Bed, Bath, Wifi, Check, Tag } from 'lucide-react';
import { getProperty, Property, extractPropertyId } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export function PropertyDetails() {
  const { id: slug } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');
  const { user } = useAuth();

  useEffect(() => {
    const loadProperty = async () => {
      console.log('==================== PROPERTY DETAILS LOADING ====================');
      console.log('1️⃣ Slug from useParams:', slug);
      
      if (!slug) {
        console.log('❌ No slug provided');
        setError('No property ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Extract the actual property ID from the slug
        const propertyId = extractPropertyId(slug);
        console.log('2️⃣ Extracted property ID:', propertyId);
        console.log('3️⃣ Calling getProperty with ID:', propertyId);
        
        const data = await getProperty(propertyId);
        console.log('4️⃣ Property data received:', data);
        console.log('   - Type of data:', typeof data);
        console.log('   - Is null?', data === null);
        console.log('   - Is undefined?', data === undefined);
        
        if (!data) {
          console.error('❌ No data returned from API');
          setError('Property not found');
          setLoading(false);
          return;
        }
        
        console.log('✅ SUCCESS! Setting property state with:', data);
        setProperty(data);
        setLoading(false);
      } catch (err) {
        console.error('❌ PropertyDetails - Error loading property:', err);
        console.error('   - Error type:', typeof err);
        console.error('   - Error message:', err instanceof Error ? err.message : String(err));
        setError(err instanceof Error ? err.message : 'Failed to load property');
        setLoading(false);
      }
      
      console.log('==================== PROPERTY DETAILS LOADING END ====================');
    };

    loadProperty();
  }, [slug]);

  const handleBooking = () => {
    if (!user) {
      toast.error('Please login to make a booking');
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    // TODO: Connect to your Neon database to create booking
    toast.success('Booking request submitted! (Connect to Neon database to save)');
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

          {/* Booking Card */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="text-2xl">${property.price}</span>
                  <span className="text-sm font-normal text-gray-600">per night</span>
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
                          <span className="text-gray-600">${property.price} × {numberOfDays} night{numberOfDays > 1 ? 's' : ''}</span>
                          <span>${basePrice.toFixed(2)}</span>
                        </div>
                        {discountPercent > 0 && (
                          <div className="flex justify-between text-xs text-[#6B7C3C]">
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {discountPercent}% Discount
                            </span>
                            <span>-${discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-300 pt-2 mt-2"></div>
                        <div className="flex justify-between font-semibold text-sm">
                          <span>Total</span>
                          <span>${finalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {user ? (
                    <Button className="w-full" onClick={handleBooking}>
                      Request to Book
                    </Button>
                  ) : (
                    <Link to="/login">
                      <Button className="w-full">Login to Book</Button>
                    </Link>
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
    </div>
  );
}