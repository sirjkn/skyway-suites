import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { getBookings, getProperties, getPayments, Booking, Property, Payment } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, MapPin, Users, DollarSign, CheckCircle, Clock, XCircle, CreditCard, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '../lib/dateUtils';
import * as Dialog from '@radix-ui/react-dialog';

// PayPal script loader
const loadPayPalScript = (clientId: string) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector('#paypal-script')) {
      resolve(window.paypal);
      return;
    }
    const script = document.createElement('script');
    script.id = 'paypal-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.onload = () => resolve(window.paypal);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

export function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'paypal' | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, propertiesData, paymentsData] = await Promise.all([
        getBookings(),
        getProperties(),
        getPayments(),
      ]);

      // Filter bookings for current user
      const userBookings = bookingsData.filter(b => b.customerId === user?.id);
      setBookings(userBookings);
      setProperties(propertiesData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getProperty = (propertyId: string) => {
    return properties.find(p => p.id === propertyId);
  };

  const getTotalPaid = (bookingId: string) => {
    const bookingPayments = payments.filter(p => p.bookingId === bookingId && p.status === 'paid');
    return bookingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getRemainingBalance = (booking: Booking) => {
    const totalPaid = getTotalPaid(booking.id);
    return booking.totalPrice - totalPaid;
  };

  const getBookingStatus = (booking: Booking) => {
    const totalPaid = getTotalPaid(booking.id);
    
    if (!booking.approved) {
      return { status: 'pending approval', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
    }
    
    if (totalPaid === 0) {
      return { status: 'awaiting payment', color: 'bg-orange-100 text-orange-700', icon: DollarSign };
    } else if (totalPaid < booking.totalPrice) {
      return { status: 'partial payment', color: 'bg-blue-100 text-blue-700', icon: DollarSign };
    } else {
      return { status: 'confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    }
  };

  const handlePayNow = (booking: Booking) => {
    setSelectedBooking(booking);
    setPaymentMethod(null);
    setMpesaPhone('');
    setCheckoutRequestId(null); // Reset checkout request ID
    setShowPaymentDialog(true);
  };

  const handleMpesaPayment = async () => {
    if (!selectedBooking || !mpesaPhone) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }

    // Validate phone number (Kenyan format)
    const phoneRegex = /^(?:254|\+254|0)?([7][0-9]{8})$/;
    const match = mpesaPhone.match(phoneRegex);
    
    if (!match) {
      toast.error('Invalid phone number. Use format: 0712345678 or 254712345678');
      return;
    }

    const formattedPhone = '254' + match[1];
    const remainingBalance = getRemainingBalance(selectedBooking);

    try {
      setProcessingPayment(true);
      
      console.log('🔍 M-Pesa Payment Request:', {
        bookingId: selectedBooking.id,
        phoneNumber: formattedPhone,
        amount: remainingBalance
      });
      
      // Call M-Pesa STK Push API - FIX: Send data in body, not as endpoint param
      const response = await fetch('/api?endpoint=mpesa-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          phoneNumber: formattedPhone,
          amount: remainingBalance,
        }),
      });

      console.log('📱 M-Pesa Response Status:', response.status);
      const data = await response.json();
      console.log('📱 M-Pesa Response Data:', data);

      if (data.success) {
        toast.success('📱 M-Pesa payment request sent! Check your phone to complete payment.');
        toast.info('Please enter your M-Pesa PIN on your phone', { duration: 5000 });
        
        // Store checkout request ID for manual status check
        setCheckoutRequestId(data.checkoutRequestId);
        
        // Don't close dialog yet - let user check status
        setPaymentMethod(null); // Reset to show status check option
        
        // Poll for payment confirmation
        setTimeout(() => {
          loadData();
        }, 10000); // Reload after 10 seconds
      } else {
        console.error('❌ M-Pesa Error:', data);
        toast.error(data.message || 'Failed to initiate M-Pesa payment');
      }
    } catch (error) {
      console.error('❌ M-Pesa payment error:', error);
      toast.error('Failed to process M-Pesa payment. Check console for details.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!checkoutRequestId) {
      toast.error('No payment request found to check');
      return;
    }

    try {
      setCheckingStatus(true);
      toast.info('🔍 Checking payment status...');

      const response = await fetch('/api?endpoint=mpesa-query-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutRequestId }),
      });

      const data = await response.json();
      console.log('📊 Payment Status:', data);
      console.log('📊 Full Response:', JSON.stringify(data, null, 2));
      console.log('📊 Status:', data.status);
      console.log('📊 Success:', data.success);
      console.log('📊 ResultCode:', data.resultCode);

      if (data.success && data.status === 'completed') {
        toast.success('✅ Payment confirmed! Your booking is now paid.');
        
        // Show admin notification
        setTimeout(() => {
          toast.info('💡 Admin: Check M-Pesa Transactions page to see this payment', { duration: 5000 });
        }, 2000);
        
        setShowPaymentDialog(false);
        setCheckoutRequestId(null);
        loadData(); // Reload bookings
      } else if (data.status === 'cancelled') {
        toast.error('❌ Payment was cancelled');
        setCheckoutRequestId(null);
      } else if (data.status === 'timeout') {
        toast.error('⏱️ Payment request expired. Please try again.');
        setCheckoutRequestId(null);
      } else if (data.status === 'failed') {
        toast.error(`❌ Payment failed: ${data.message}`);
        setCheckoutRequestId(null);
      } else {
        toast.info('⏳ Payment is still pending. Please complete it on your phone.');
      }
    } catch (error) {
      console.error('❌ Status check error:', error);
      toast.error('Failed to check payment status');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!selectedBooking) return;

    try {
      setProcessingPayment(true);
      
      console.log('🔍 Loading PayPal configuration...');
      
      // Fetch PayPal settings from API
      const settingsResponse = await fetch('/api?endpoint=get-payment-settings');
      
      if (!settingsResponse.ok) {
        throw new Error('Failed to load PayPal settings from server');
      }
      
      const settings = await settingsResponse.json();
      
      console.log('📊 PayPal settings received:', {
        hasClientId: !!settings.paypalClientId,
        environment: settings.paypalEnvironment,
        clientIdLength: settings.paypalClientId?.length || 0
      });
      
      const PAYPAL_CLIENT_ID = settings.paypalClientId || '';
      const paypalEnvironment = settings.paypalEnvironment || 'sandbox';
      
      // Validate Client ID
      if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID.length < 10) {
        console.error('❌ Invalid PayPal Client ID:', PAYPAL_CLIENT_ID);
        toast.error('PayPal is not configured properly. Please contact the administrator to set up PayPal in Settings.');
        setProcessingPayment(false);
        setPaymentMethod(null);
        return;
      }
      
      console.log(`✅ PayPal Client ID loaded (${paypalEnvironment} mode, ${PAYPAL_CLIENT_ID.substring(0, 10)}...)`);
      
      // Load PayPal SDK
      console.log('📦 Loading PayPal SDK...');
      await loadPayPalScript(PAYPAL_CLIENT_ID);
      
      // Check if PayPal is loaded
      if (!window.paypal) {
        throw new Error('PayPal SDK failed to load. Please check your internet connection.');
      }
      
      console.log('✅ PayPal SDK loaded successfully');

      const remainingBalance = getRemainingBalance(selectedBooking);
      const property = getProperty(selectedBooking.propertyId);

      // Clear any existing PayPal buttons
      const container = document.getElementById('paypal-button-container');
      if (container) {
        container.innerHTML = '';
      }

      // Render PayPal buttons
      window.paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          console.log('🔍 Creating PayPal order...');
          const usdAmount = (remainingBalance / 130).toFixed(2);
          console.log(`💰 Amount: KES ${remainingBalance} = USD ${usdAmount}`);
          
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: usdAmount,
                currency_code: 'USD',
              },
              description: `Skyway Suites - ${property?.title || 'Property Booking'}`,
            }],
          });
        },
        onApprove: async (data: any, actions: any) => {
          console.log('✅ PayPal payment approved, capturing order...');
          
          try {
            const order = await actions.order.capture();
            console.log('✅ PayPal order captured:', order);
            
            // Save payment to database
            const response = await fetch('/api?endpoint=payments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: selectedBooking.id,
                customerId: selectedBooking.customerId,
                amount: remainingBalance,
                status: 'paid',
                paymentMethod: 'PayPal',
                transactionId: order.id,
              }),
            });

            if (response.ok) {
              console.log('✅ Payment recorded in database');
              toast.success('✅ Payment successful! Your booking is confirmed.');
              setShowPaymentDialog(false);
              setPaymentMethod(null);
              loadData();
            } else {
              const errorData = await response.json();
              console.error('❌ Failed to record payment:', errorData);
              toast.error('Payment successful but failed to record. Please contact support with order ID: ' + order.id);
            }
          } catch (captureError) {
            console.error('❌ Error capturing order:', captureError);
            toast.error('Payment processing error. Please contact support.');
          }
        },
        onError: (err: any) => {
          console.error('❌ PayPal error:', err);
          toast.error(`PayPal error: ${err.message || 'Please try again or contact support.'}`);
          setProcessingPayment(false);
          setPaymentMethod(null);
        },
        onCancel: () => {
          console.log('⚠️ PayPal payment cancelled by user');
          toast.info('Payment cancelled');
          setProcessingPayment(false);
          setPaymentMethod(null);
        }
      }).render('#paypal-button-container');
      
      console.log('✅ PayPal buttons rendered');
      setProcessingPayment(false);
    } catch (error) {
      console.error('❌ PayPal initialization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to initialize PayPal: ${errorMessage}`);
      setProcessingPayment(false);
      setPaymentMethod(null);
    }
  };

  useEffect(() => {
    if (paymentMethod === 'paypal' && selectedBooking) {
      handlePayPalPayment();
    }
  }, [paymentMethod]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#6B7C3C' }}></div>
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your property bookings</p>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-6">Start exploring our properties to make your first booking</p>
              <Link to="/properties">
                <Button>Browse Properties</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const property = getProperty(booking.propertyId);
              const statusInfo = getBookingStatus(booking);
              const totalPaid = getTotalPaid(booking.id);
              const remainingBalance = getRemainingBalance(booking);
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Property Image */}
                      <div className="lg:w-64 h-48 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {property?.image ? (
                          <img
                            src={property.image}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                      </div>

                      {/* Booking Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{property?.title || 'Unknown Property'}</h3>
                            <div className="flex items-center text-gray-600 text-sm">
                              <MapPin className="h-4 w-4 mr-1" />
                              {property?.location || 'Location unavailable'}
                            </div>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${statusInfo.color}`}>
                            <StatusIcon className="h-4 w-4" />
                            {statusInfo.status}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Check-in</div>
                            <div className="font-semibold">{formatDateTime(booking.checkIn)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Check-out</div>
                            <div className="font-semibold">{formatDateTime(booking.checkOut)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Guests</div>
                            <div className="font-semibold flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {booking.guests}
                            </div>
                          </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Price:</span>
                              <span className="font-semibold">KES {booking.totalPrice.toLocaleString()}</span>
                            </div>
                            {totalPaid > 0 && (
                              <>
                                <div className="flex justify-between text-green-600">
                                  <span>Paid:</span>
                                  <span className="font-semibold">KES {totalPaid.toLocaleString()}</span>
                                </div>
                                {remainingBalance > 0 && (
                                  <div className="flex justify-between text-orange-600 border-t border-gray-200 pt-2">
                                    <span className="font-semibold">Remaining:</span>
                                    <span className="font-semibold">KES {remainingBalance.toLocaleString()}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          {booking.approved && remainingBalance > 0 && (
                            <Button onClick={() => handlePayNow(booking)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Pay Now (KES {remainingBalance.toLocaleString()})
                            </Button>
                          )}
                          {!booking.approved && (
                            <div className="flex items-center text-yellow-700 bg-yellow-50 px-4 py-2 rounded-lg">
                              <Clock className="h-4 w-4 mr-2" />
                              Awaiting admin approval
                            </div>
                          )}
                          <Link to={`/properties/${booking.propertyId}`}>
                            <Button variant="outline">View Property</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog.Root open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-2xl mb-4">Complete Payment</Dialog.Title>
            <Dialog.Description className="sr-only">
              Choose your payment method and complete the payment
            </Dialog.Description>

            {selectedBooking && (
              <div className="space-y-6">
                {/* Booking Summary */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-sm font-semibold mb-2">Payment Summary</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property:</span>
                      <span>{getProperty(selectedBooking.propertyId)?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Due:</span>
                      <span className="font-semibold text-lg text-[#6B7C3C]">
                        KES {getRemainingBalance(selectedBooking).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                {!paymentMethod && !checkoutRequestId && (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold mb-2">Choose Payment Method</div>
                    
                    {/* M-Pesa Option */}
                    <button
                      onClick={() => setPaymentMethod('mpesa')}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#6B7C3C] hover:bg-gray-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Smartphone className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">M-Pesa</div>
                          <div className="text-sm text-gray-600">Pay via M-Pesa STK Push</div>
                        </div>
                      </div>
                    </button>

                    {/* PayPal Option */}
                    <button
                      onClick={() => setPaymentMethod('paypal')}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#6B7C3C] hover:bg-gray-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">PayPal / Credit Card</div>
                          <div className="text-sm text-gray-600">Pay with PayPal or any credit card</div>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* M-Pesa Payment Status Check */}
                {!paymentMethod && checkoutRequestId && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-blue-900 mb-1">Payment Request Sent</div>
                          <div className="text-sm text-blue-700">
                            Please check your phone and enter your M-Pesa PIN to complete the payment.
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleCheckPaymentStatus}
                      disabled={checkingStatus}
                      className="w-full"
                      style={{ backgroundColor: '#6B7C3C' }}
                    >
                      {checkingStatus ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Checking Status...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Check Payment Status
                        </>
                      )}
                    </Button>

                    <button
                      onClick={() => {
                        setCheckoutRequestId(null);
                        setPaymentMethod(null);
                      }}
                      className="w-full text-sm text-gray-600 hover:text-gray-900"
                    >
                      ← Try a different payment method
                    </button>
                  </div>
                )}

                {/* M-Pesa Payment Form */}
                {paymentMethod === 'mpesa' && (
                  <div className="space-y-4">
                    <button
                      onClick={() => setPaymentMethod(null)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      ← Back to payment methods
                    </button>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">M-Pesa Phone Number</label>
                      <input
                        type="tel"
                        placeholder="0712345678 or 254712345678"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B7C3C]"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the M-Pesa number you want to pay from
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm text-blue-900">
                        <strong>How it works:</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                          <li>Click "Send Payment Request"</li>
                          <li>Check your phone for M-Pesa prompt</li>
                          <li>Enter your M-Pesa PIN</li>
                          <li>Payment confirmation will be instant</li>
                        </ol>
                      </div>
                    </div>

                    <Button
                      onClick={handleMpesaPayment}
                      disabled={processingPayment}
                      className="w-full"
                    >
                      {processingPayment ? 'Processing...' : 'Send Payment Request'}
                    </Button>
                  </div>
                )}

                {/* PayPal Payment Container */}
                {paymentMethod === 'paypal' && (
                  <div className="space-y-4">
                    <button
                      onClick={() => setPaymentMethod(null)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      ← Back to payment methods
                    </button>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="text-sm text-blue-900">
                        Amount will be charged in USD (approx ${(getRemainingBalance(selectedBooking) / 130).toFixed(2)})
                      </div>
                    </div>

                    {processingPayment ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B7C3C] mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading PayPal...</p>
                      </div>
                    ) : (
                      <div id="paypal-button-container"></div>
                    )}
                  </div>
                )}

                {!paymentMethod && (
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentDialog(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// Extend Window interface for PayPal
declare global {
  interface Window {
    paypal: any;
  }
}