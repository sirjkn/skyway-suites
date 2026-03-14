import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { MapPin, Star, Users } from 'lucide-react';
import { getPropertyBookings, getPayments, Property } from '../lib/api';
import { formatDateOnly } from '../lib/dateUtils';
import { Card, CardContent } from './ui/card';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [bookedUntil, setBookedUntil] = useState<string | null>(null);

  useEffect(() => {
    // Check if property has active confirmed bookings with full payment
    async function checkBookingStatus() {
      try {
        const bookings = await getPropertyBookings(property.id);
        const payments = await getPayments();
        const now = new Date();
        
        console.log(`🔍 PropertyCard [${property.title}]:`, {
          totalBookings: bookings.length,
          totalPayments: payments.length,
          propertyId: property.id
        });
        
        // Find active confirmed bookings (checkout date hasn't passed yet)
        const activeBookings = bookings.filter(booking => {
          const checkOut = new Date(booking.checkOut);
          return checkOut > now && booking.status === 'confirmed';
        });
        
        console.log(`📅 Active confirmed bookings:`, activeBookings);
        
        // Check if any active booking is fully paid
        for (const booking of activeBookings) {
          const bookingPayments = payments.filter(p => p.bookingId === booking.id && p.status === 'paid');
          const totalPaid = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
          
          console.log(`💰 Booking ${booking.id}:`, {
            totalPrice: booking.totalPrice,
            totalPaid,
            isFullyPaid: totalPaid >= booking.totalPrice,
            payments: bookingPayments
          });
          
          // If booking is confirmed and fully paid, property is booked
          if (totalPaid >= booking.totalPrice) {
            const checkOutDate = formatDateOnly(new Date(booking.checkOut));
            console.log(`✅ Property BOOKED until ${checkOutDate}`);
            setBookedUntil(checkOutDate);
            return;
          }
        }
        
        // No fully paid confirmed bookings
        console.log(`✅ Property AVAILABLE`);
        setBookedUntil(null);
      } catch (error) {
        console.error('Failed to check booking status:', error);
      }
    }
    
    checkBookingStatus();
  }, [property.id]);
  
  console.log('🏠 PropertyCard:', {
    id: property.id,
    title: property.title,
    linkTo: `/properties/${property.id}`
  });
  
  return (
    <Link to={`/properties/${property.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <div
            className="h-48 bg-cover bg-center"
            style={{ backgroundImage: `url('${property.image}')` }}
          />
          {/* Booked Status Badge - Top Right */}
          {bookedUntil && (
            <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-md text-xs font-semibold shadow-lg">
              Booked (available on {bookedUntil})
            </div>
          )}
          {/* Price Badge - Bottom Right, Orange, 25% smaller */}
          <div className="absolute bottom-3 right-3 bg-orange-500 text-white px-2.5 py-1 rounded-md text-sm font-semibold shadow-lg">
            KES {property.price.toLocaleString()}/night
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
          
          {/* Category Badge - Below title with black bg */}
          <div className="mb-3">
            <span className="inline-block bg-black text-white text-xs px-2.5 py-1 rounded-md">
              {property.category}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600 text-sm mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            {property.location}
          </div>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {property.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {property.guests}
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              {property.bedrooms}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}