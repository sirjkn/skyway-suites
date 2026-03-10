import { useState, useEffect } from 'react';
import { X, Calendar, Users, Tag, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Property } from '../lib/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onBookingSubmit: (bookingData: {
    checkIn: string;
    checkOut: string;
    guests: number;
    totalPrice: number;
    numberOfNights: number;
    discountPercent: number;
  }) => void;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
}

export function BookingModal({
  isOpen,
  onClose,
  property,
  onBookingSubmit,
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = '1',
}: BookingModalProps) {
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);

  useEffect(() => {
    setCheckIn(initialCheckIn);
    setCheckOut(initialCheckOut);
    setGuests(initialGuests);
  }, [initialCheckIn, initialCheckOut, initialGuests]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkIn || !checkOut) {
      return;
    }

    const numberOfNights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (numberOfNights <= 0) {
      return;
    }

    const basePrice = property.price * numberOfNights;

    let discountPercent = 0;
    if (numberOfNights >= 30) {
      discountPercent = 8;
    } else if (numberOfNights >= 7) {
      discountPercent = 2;
    }

    const discountAmount = basePrice * (discountPercent / 100);
    const finalPrice = basePrice - discountAmount;

    onBookingSubmit({
      checkIn,
      checkOut,
      guests: parseInt(guests),
      totalPrice: finalPrice,
      numberOfNights,
      discountPercent,
    });
  };

  // Calculate price details
  const priceDetails = (() => {
    if (!checkIn || !checkOut) return null;

    const numberOfNights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (numberOfNights <= 0) return null;

    const basePrice = property.price * numberOfNights;

    let discountPercent = 0;
    if (numberOfNights >= 30) {
      discountPercent = 8;
    } else if (numberOfNights >= 7) {
      discountPercent = 2;
    }

    const discountAmount = basePrice * (discountPercent / 100);
    const finalPrice = basePrice - discountAmount;

    return {
      numberOfNights,
      basePrice,
      discountPercent,
      discountAmount,
      finalPrice,
    };
  })();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Book {property.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5">
          {/* Property Info - Compact */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">{property.title}</span>
              <span className="text-sm font-semibold text-[#6B7C3C]">
                ${property.price}/night
              </span>
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-3">
              <span>{property.bedrooms} bed</span>
              <span>•</span>
              <span>{property.bathrooms} bath</span>
              <span>•</span>
              <span>Max {property.guests} guests</span>
            </div>
          </div>

          {/* Booking Form - Compact */}
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Check-in
                </label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Check-out
                </label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  required
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Users className="h-3 w-3" />
                Number of Guests
              </label>
              <Input
                type="number"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                min="1"
                max={property.guests}
                required
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Discount Info - Compact */}
          <div className="bg-[#6B7C3C]/10 border border-[#6B7C3C]/20 rounded-md p-2.5 mb-4">
            <div className="flex items-start gap-2">
              <Tag className="h-3.5 w-3.5 text-[#6B7C3C] mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-[#3a3a3a] mb-0.5">
                  Special Discounts
                </div>
                <div className="text-[#3a3a3a]/80 space-y-0.5">
                  <div>7+ days: 2% off • 30+ days: 8% off</div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Breakdown - Compact */}
          {priceDetails && (
            <div className="bg-gray-50 rounded-md p-3 mb-4 border border-gray-200">
              <div className="text-xs font-semibold mb-2 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                Price Breakdown
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    ${property.price} × {priceDetails.numberOfNights} night
                    {priceDetails.numberOfNights > 1 ? 's' : ''}
                  </span>
                  <span>${priceDetails.basePrice.toFixed(2)}</span>
                </div>
                {priceDetails.discountPercent > 0 && (
                  <div className="flex justify-between text-[#6B7C3C]">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {priceDetails.discountPercent}% Discount
                    </span>
                    <span>-${priceDetails.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-1.5 mt-1.5"></div>
                <div className="flex justify-between font-semibold text-sm">
                  <span>Total</span>
                  <span className="text-[#6B7C3C]">
                    ${priceDetails.finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-9 text-sm"
              disabled={!checkIn || !checkOut || !priceDetails}
            >
              Confirm Booking
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
            You won't be charged yet
          </p>
        </form>
      </div>
    </div>
  );
}
