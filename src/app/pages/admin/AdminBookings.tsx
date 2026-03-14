import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Home, Users, Calendar, DollarSign, Trash2, Tag } from 'lucide-react';
import { getBookings, Booking, getProperties, getCustomers, getPayments, Payment, createPayment, deleteBooking, createBooking } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Combobox } from '../../components/ui/combobox';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { sendCustomerBookingConfirmation, sendAdminBookingNotification } from '../../lib/notificationService';
import { formatDateTime } from '../../lib/dateUtils';

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'MPesa',
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [formData, setFormData] = useState({
    propertyId: '',
    customerId: '',
    checkIn: '',
    checkOut: '',
    guests: '',
    totalPrice: '',
  });

  useEffect(() => {
    loadBookings();
    getPayments().then(setPayments);
  }, []);

  // Calculate total price when property, check-in, or check-out changes
  useEffect(() => {
    if (formData.propertyId && formData.checkIn && formData.checkOut) {
      const property = properties.find(p => p.id === formData.propertyId);
      if (property) {
        const checkInDate = new Date(formData.checkIn);
        const checkOutDate = new Date(formData.checkOut);
        const numberOfDays = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (numberOfDays > 0) {
          const basePrice = property.price * numberOfDays;
          
          // Apply discounts based on duration
          let discount = 0;
          if (numberOfDays >= 30) {
            discount = 0.08; // 8% for 1 month or more
          } else if (numberOfDays >= 7) {
            discount = 0.02; // 2% for 7 days or more
          }
          
          const totalPrice = basePrice * (1 - discount);
          setFormData(prev => ({ ...prev, totalPrice: totalPrice.toFixed(2) }));
        }
      }
    }
  }, [formData.propertyId, formData.checkIn, formData.checkOut, properties]);

  const loadBookings = async () => {
    const data = await getBookings();
    console.log('Loaded bookings:', data);
    setBookings(data);
    
    // Also reload properties and customers to ensure we have the latest data
    const propsData = await getProperties();
    const customersData = await getCustomers();
    console.log('Properties:', propsData);
    console.log('Customers:', customersData);
    setProperties(propsData);
    setCustomers(customersData);
  };

  const getBookingStatus = (booking: Booking) => {
    // Calculate total paid amount for this booking
    const totalPaid = getTotalPaid(booking.id);
    
    if (totalPaid === 0) {
      return 'pending payment';
    } else if (totalPaid < booking.totalPrice) {
      return 'partial payment';
    } else if (totalPaid >= booking.totalPrice) {
      return 'confirmed';
    }
    
    return booking.status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending payment': 'bg-yellow-100 text-yellow-700',
      'partial payment': 'bg-orange-100 text-orange-700',
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.title || 'Unknown Property';
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  // Calculate total amount paid for a booking
  const getTotalPaid = (bookingId: string) => {
    const bookingPayments = payments.filter(p => p.bookingId === bookingId && p.status === 'paid');
    return bookingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  // Calculate remaining balance for a booking
  const getRemainingBalance = (booking: Booking) => {
    const totalPaid = getTotalPaid(booking.id);
    return booking.totalPrice - totalPaid;
  };

  const handleMakePayment = async (booking: Booking) => {
    // Calculate remaining balance
    const remaining = getRemainingBalance(booking);
    
    if (remaining <= 0) {
      toast.error('Payment already completed for this booking');
      return;
    }

    // Open payment modal with remaining balance as default amount
    setSelectedBookingForPayment(booking);
    setPaymentFormData({
      amount: remaining.toString(),
      paymentMethod: 'MPesa',
    });
    setShowPaymentDialog(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedBookingForPayment) return;

    if (!paymentFormData.amount || parseFloat(paymentFormData.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      // Create payment
      await createPayment({
        bookingId: selectedBookingForPayment.id,
        customerId: selectedBookingForPayment.customerId,
        amount: parseFloat(paymentFormData.amount),
        status: 'paid',
        paymentMethod: paymentFormData.paymentMethod,
      });

      toast.success('Payment processed successfully!');
      
      // Send notifications if payment is in full
      const paymentAmount = parseFloat(paymentFormData.amount);
      if (paymentAmount >= selectedBookingForPayment.totalPrice) {
        // Find customer and property details
        const customer = customers.find(c => c.id === selectedBookingForPayment.customerId);
        const property = properties.find(p => p.id === selectedBookingForPayment.propertyId);
        
        if (customer && property) {
          // Send customer confirmation
          await sendCustomerBookingConfirmation({
            customerName: customer?.name || 'Customer',
            customerPhone: customer?.phone || '',
            customerEmail: customer?.email || '',
            checkInDate: selectedBookingForPayment.checkIn,
            checkOutDate: selectedBookingForPayment.checkOut,
            propertyName: property.title,
            totalPrice: selectedBookingForPayment.totalPrice,
          });
          
          // Send admin notification
          await sendAdminBookingNotification({
            customerName: customer?.name || 'Customer',
            checkInDate: selectedBookingForPayment.checkIn,
            checkOutDate: selectedBookingForPayment.checkOut,
            propertyName: property.title,
            totalPrice: selectedBookingForPayment.totalPrice,
          });
          
          toast.success('Booking confirmation sent!');
        }
      }
      
      // Reset and close modal
      setShowPaymentDialog(false);
      setSelectedBookingForPayment(null);
      setPaymentFormData({ amount: '', paymentMethod: 'MPesa' });
      
      // 🎯 Wait a moment for database to commit, then reload data
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Reload data to show updated booking status
      const updatedPayments = await getPayments();
      setPayments(updatedPayments);
      await loadBookings();
      
      toast.success('Booking status updated!', { duration: 2000 });
    } catch (error) {
      toast.error('Failed to process payment');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (confirm('Are you sure you want to delete this booking? This will remove it from the calendar and database.')) {
      try {
        await deleteBooking(id);
        toast.success('Booking deleted successfully!');
        loadBookings();
      } catch (error) {
        toast.error('Failed to delete booking');
      }
    }
  };

  const handleCreateBooking = async () => {
    // Validate all required fields
    if (!formData.propertyId) {
      toast.error('Please select a property');
      return;
    }
    if (!formData.customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (!formData.checkIn) {
      toast.error('Please select check-in date');
      return;
    }
    if (!formData.checkOut) {
      toast.error('Please select check-out date');
      return;
    }
    if (!formData.guests || parseInt(formData.guests) < 1) {
      toast.error('Please enter number of guests');
      return;
    }
    if (!formData.totalPrice || parseFloat(formData.totalPrice) <= 0) {
      toast.error('Invalid total price. Please check dates.');
      return;
    }

    try {
      const newBooking = await createBooking({
        propertyId: formData.propertyId,
        customerId: formData.customerId,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guests: parseInt(formData.guests),
        totalPrice: parseFloat(formData.totalPrice),
        status: 'pending',
      });

      console.log('Booking created:', newBooking);
      toast.success('Booking created successfully!');
      toast.info('📧 Booking confirmation emails sent to customer and admin', { duration: 3000 });
      
      // Reset form
      setFormData({
        propertyId: '',
        customerId: '',
        checkIn: '',
        checkOut: '',
        guests: '',
        totalPrice: '',
      });
      
      setShowAddDialog(false);
      
      // Reload bookings to show the new one
      await loadBookings();

      // Send notifications
      const property = properties.find(p => p.id === newBooking.propertyId);
      const customer = customers.find(c => c.id === newBooking.customerId);
      if (property && customer) {
        sendCustomerBookingConfirmation({
          customerName: customer?.name || 'Customer',
          customerPhone: customer?.phone || '',
          customerEmail: customer?.email || '',
          checkInDate: newBooking.checkIn,
          checkOutDate: newBooking.checkOut,
          propertyName: property.title,
          totalPrice: newBooking.totalPrice,
        });
        sendAdminBookingNotification({
          customerName: customer?.name || 'Customer',
          checkInDate: newBooking.checkIn,
          checkOutDate: newBooking.checkOut,
          propertyName: property.title,
          totalPrice: newBooking.totalPrice,
        });
      }
    } catch (error) {
      console.error('Failed to create booking:', error);
      toast.error('Failed to create booking. Please try again.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl mb-2">Bookings</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage property bookings</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8">
        <Button onClick={() => setShowAddDialog(true)} className="flex-1 sm:flex-none">
          <Plus className="h-4 w-4 mr-2" />
          Book Property
        </Button>
        <Link to="/admin/customers" className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </Button>
        </Link>
        <Link to="/admin/properties" className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Properties
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-gray-600 mb-0.5">Total Bookings</div>
            <div className="text-xl font-semibold">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-gray-600 mb-0.5">Pending Payment</div>
            <div className="text-xl font-semibold text-yellow-600">
              {bookings.filter(b => b.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-gray-600 mb-0.5">Confirmed</div>
            <div className="text-xl font-semibold text-green-600">
              {bookings.filter(b => b.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-gray-600 mb-0.5">Completed</div>
            <div className="text-xl font-semibold text-blue-600">
              {bookings.filter(b => b.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b text-sm">
                  <th className="text-left py-2 px-3 font-medium">Booking ID</th>
                  <th className="text-left py-2 px-3 font-medium">Property</th>
                  <th className="text-left py-2 px-3 font-medium">Customer</th>
                  <th className="text-left py-2 px-3 font-medium">Check-in</th>
                  <th className="text-left py-2 px-3 font-medium">Check-out</th>
                  <th className="text-left py-2 px-3 font-medium">Total</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="py-2 px-3 font-mono text-xs">#{booking.id.slice(0, 8)}</td>
                    <td className="py-2 px-3">{getPropertyName(booking.propertyId)}</td>
                    <td className="py-2 px-3 text-gray-600">{getCustomerName(booking.customerId)}</td>
                    <td className="py-2 px-3 text-gray-600">{formatDateTime(booking.checkIn)}</td>
                    <td className="py-2 px-3 text-gray-600">{formatDateTime(booking.checkOut)}</td>
                    <td className="py-2 px-3">
                      {(() => {
                        const remainingBalance = getRemainingBalance(booking);
                        const totalPaid = getTotalPaid(booking.id);
                        
                        if (remainingBalance > 0 && totalPaid > 0) {
                          return (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-orange-600">
                                KES {remainingBalance.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                (Paid: KES {totalPaid.toLocaleString()})
                              </div>
                            </div>
                          );
                        } else if (remainingBalance === 0) {
                          return (
                            <div className="font-semibold text-green-600">
                              Fully Paid
                            </div>
                          );
                        } else {
                          return (
                            <div className="font-semibold">
                              KES {booking.totalPrice.toLocaleString()}
                            </div>
                          );
                        }
                      })()}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(getBookingStatus(booking))}`}>
                        {getBookingStatus(booking)}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        {(getBookingStatus(booking) === 'pending payment' || getBookingStatus(booking) === 'partial payment') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            onClick={() => handleMakePayment(booking)}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Pay
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 border-red-200"
                          onClick={() => handleDeleteBooking(booking.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Booking Dialog */}
      <Dialog.Root open={showAddDialog} onOpenChange={setShowAddDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
            <Dialog.Title className="text-2xl mb-4">Create Booking</Dialog.Title>
            <Dialog.Description className="sr-only">
              Create a new booking by selecting a property, customer, and dates
            </Dialog.Description>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Property</label>
                <Combobox
                  value={formData.propertyId}
                  onChange={(value) => setFormData({ ...formData, propertyId: value })}
                  options={properties.map(p => ({ value: p.id, label: `${p.title} - KES ${p.price.toLocaleString()}/night` }))}
                  placeholder="Select a property"
                  searchPlaceholder="Search properties..."
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Customer</label>
                <Combobox
                  value={formData.customerId}
                  onChange={(value) => setFormData({ ...formData, customerId: value })}
                  options={customers.map(c => ({ value: c.id, label: c.name }))}
                  placeholder="Select a customer"
                  searchPlaceholder="Search customers..."
                />
              </div>
              <div className="grid grid-cols-8 gap-3">
                <div className="col-span-3">
                  <label className="block text-xs mb-1.5">Check-in</label>
                  <Input
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs mb-1.5">Check-out</label>
                  <Input
                    type="date"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs mb-1.5">Guests</label>
                  <Input
                    type="number"
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                    min="1"
                    required
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Discount Information Banner */}
              <div className="bg-[#6B7C3C]/10 border border-[#6B7C3C]/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-[#6B7C3C] mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-[#3a3a3a]">
                    <div className="font-semibold mb-1">Special Discounts Available!</div>
                    <div className="space-y-0.5">
                      <div>• 7+ days: <span className="font-semibold">2% off</span></div>
                      <div>• 30+ days: <span className="font-semibold">8% off</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              {formData.totalPrice && formData.propertyId && formData.checkIn && formData.checkOut && (() => {
                const property = properties.find(p => p.id === formData.propertyId);
                if (!property) return null;
                
                const numberOfDays = Math.ceil((new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 60 * 60 * 24));
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
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
                    <div className="text-sm font-semibold mb-2">Price Breakdown</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">KES {property.price.toLocaleString()} × {numberOfDays} night{numberOfDays > 1 ? 's' : ''}</span>
                      <span>KES {basePrice.toLocaleString()}</span>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between text-sm text-[#6B7C3C]">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {discountPercent}% Discount ({numberOfDays >= 30 ? '1 month+' : '7 days+'})
                        </span>
                        <span>-KES {discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 pt-2 mt-2"></div>
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-lg">KES {Math.round(finalPrice).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-4 pt-4">
                <Button onClick={handleCreateBooking}>
                  Create Booking
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Payment Dialog */}
      <Dialog.Root open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
            <Dialog.Title className="text-2xl mb-4">Process Payment</Dialog.Title>
            <Dialog.Description className="sr-only">
              Process payment for a booking
            </Dialog.Description>
            <div className="space-y-4">
              {selectedBookingForPayment && (() => {
                const totalPaid = getTotalPaid(selectedBookingForPayment.id);
                const remainingBalance = getRemainingBalance(selectedBookingForPayment);
                
                return (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm font-semibold mb-2">Booking Details</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Property:</span>
                        <span>{getPropertyName(selectedBookingForPayment.propertyId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer:</span>
                        <span>{getCustomerName(selectedBookingForPayment.customerId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Price:</span>
                        <span className="font-semibold">KES {selectedBookingForPayment.totalPrice.toLocaleString()}</span>
                      </div>
                      {totalPaid > 0 && (
                        <>
                          <div className="flex justify-between text-green-600">
                            <span>Paid:</span>
                            <span className="font-semibold">KES {totalPaid.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-orange-600 border-t border-gray-300 pt-1 mt-1">
                            <span className="font-semibold">Remaining Balance:</span>
                            <span className="font-semibold">KES {remainingBalance.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div>
                <label className="block text-sm mb-2">Payment Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Payment Method</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={paymentFormData.paymentMethod}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                  required
                >
                  <option value="MPesa">MPesa</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <Button onClick={handleProcessPayment}>
                  Process Payment
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowPaymentDialog(false);
                  setSelectedBookingForPayment(null);
                  setPaymentFormData({ amount: '', paymentMethod: 'MPesa' });
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}