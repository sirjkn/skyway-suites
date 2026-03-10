import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Calendar, Users, CreditCard, DollarSign, Eye, Trash2 } from 'lucide-react';
import { getPayments, Payment, getBookings, getCustomers, createPayment, deletePayment } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';

export function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    bookingId: '',
    customerId: '',
    amount: '',
    paymentMethod: 'MPesa',
  });
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isFullyPaid, setIsFullyPaid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPayments();
    getBookings().then(setBookings);
    getCustomers().then(setCustomers);
  }, []);

  const loadPayments = async () => {
    const data = await getPayments();
    setPayments(data);
  };

  const handleBookingSelect = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      const remainingBalance = calculateRemainingBalance(booking);
      
      // Check if booking is fully paid
      if (remainingBalance === 0) {
        setIsFullyPaid(true);
        setSelectedBooking(booking);
        setFormData({
          ...formData,
          bookingId: bookingId,
          customerId: booking.customerId,
          amount: '0',
        });
        toast.error('Property paid in full, please select another property');
        return;
      }
      
      setIsFullyPaid(false);
      setSelectedBooking(booking);
      
      // Auto-populate customer from booking
      setFormData({
        ...formData,
        bookingId: bookingId,
        customerId: booking.customerId,
        amount: remainingBalance.toString(),
      });
    } else {
      setIsFullyPaid(false);
      setSelectedBooking(null);
      setFormData({
        ...formData,
        bookingId: '',
        customerId: '',
        amount: '',
      });
    }
  };

  const calculateRemainingBalance = (booking: any): number => {
    // Get all payments for this booking
    const bookingPayments = payments.filter(p => p.bookingId === booking.id && p.status === 'paid');
    const totalPaid = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate remaining balance
    const remainingBalance = booking.totalPrice - totalPaid;
    return Math.max(0, remainingBalance); // Never negative
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      refunded: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Payments</h1>
        <p className="text-gray-600">Track and manage payments</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Make Payment
        </Button>
        <Link to="/admin/bookings">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Bookings
          </Button>
        </Link>
        <Link to="/admin/customers">
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-600 mb-0.5">Total Revenue</div>
                <div className="text-xl font-semibold text-green-600">${totalRevenue}</div>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-600 mb-0.5">Pending</div>
                <div className="text-xl font-semibold text-yellow-600">${pendingAmount}</div>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-gray-600 mb-0.5">Total Payments</div>
            <div className="text-xl font-semibold">{payments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-gray-600 mb-0.5">Paid</div>
            <div className="text-xl font-semibold text-green-600">
              {payments.filter(p => p.status === 'paid').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b text-sm">
                  <th className="text-left py-2 px-3 font-medium">Payment ID</th>
                  <th className="text-left py-2 px-3 font-medium">Booking ID</th>
                  <th className="text-left py-2 px-3 font-medium">Customer</th>
                  <th className="text-left py-2 px-3 font-medium">Amount</th>
                  <th className="text-left py-2 px-3 font-medium">Method</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Date</th>
                  <th className="text-left py-2 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="py-2 px-3 font-mono text-xs">#{payment.id?.slice(0, 8) || 'N/A'}</td>
                    <td className="py-2 px-3 font-mono text-xs">#{payment.bookingId?.slice(0, 8) || 'N/A'}</td>
                    <td className="py-2 px-3">{getCustomerName(payment.customerId)}</td>
                    <td className="py-2 px-3 font-semibold text-green-600">${payment.amount}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                        {payment.paymentMethod}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowViewDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this payment?')) {
                              try {
                                await deletePayment(payment.id);
                                toast.success('Payment deleted successfully!');
                                await loadPayments();
                              } catch (error) {
                                toast.error('Failed to delete payment');
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add Payment Dialog */}
      <Dialog.Root open={showAddDialog} onOpenChange={setShowAddDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
            <Dialog.Title className="text-2xl mb-4">Make Payment</Dialog.Title>
            <Dialog.Description className="sr-only">
              Process a payment for a booking with remaining balance calculation
            </Dialog.Description>
            
            {/* Fully Paid Warning */}
            {isFullyPaid && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ Property paid in full, please select another property
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Booking</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={formData.bookingId}
                  onChange={(e) => handleBookingSelect(e.target.value)}
                  required
                >
                  <option value="">Select a booking</option>
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>
                      Booking #{b.id?.slice(0, 8) || 'N/A'} - ${b.totalPrice}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Customer</label>
                <Input
                  value={selectedBooking ? getCustomerName(selectedBooking.customerId) : ''}
                  placeholder="Select a booking first"
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Customer is automatically selected from the booking
                </p>
              </div>
              <div>
                <label className="block text-sm mb-2">Amount (Remaining Balance)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
                {selectedBooking && (
                  <p className="text-xs text-gray-500 mt-1">
                    Total: ${selectedBooking.totalPrice} | Remaining: ${calculateRemainingBalance(selectedBooking)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm mb-2">Payment Method</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  required
                >
                  <option value="MPesa">MPesa</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={async () => {
                    if (!formData.bookingId || !formData.customerId || !formData.amount) {
                      toast.error('Please fill in all fields');
                      return;
                    }
                    
                    setIsProcessing(true);
                    try {
                      await createPayment({
                        bookingId: formData.bookingId,
                        customerId: formData.customerId,
                        amount: parseFloat(formData.amount),
                        paymentMethod: formData.paymentMethod,
                        status: 'paid',
                      });
                      toast.success('Payment processed successfully!');
                      await loadPayments();
                      await getBookings().then(setBookings);
                      setShowAddDialog(false);
                      setFormData({ bookingId: '', customerId: '', amount: '', paymentMethod: 'MPesa' });
                      setSelectedBooking(null);
                    } catch (error) {
                      toast.error('Failed to process payment');
                      console.error('Payment error:', error);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isFullyPaid || isProcessing}
                  className={isFullyPaid || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  {isProcessing ? 'Processing...' : 'Process Payment'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowAddDialog(false);
                  setFormData({ bookingId: '', customerId: '', amount: '', paymentMethod: 'MPesa' });
                  setSelectedBooking(null);
                  setIsFullyPaid(false);
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* View Payment Dialog */}
      <Dialog.Root open={showViewDialog} onOpenChange={setShowViewDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
            <Dialog.Title className="text-2xl mb-4">Payment Details</Dialog.Title>
            <Dialog.Description className="sr-only">
              View details of a payment
            </Dialog.Description>
            
            {selectedPayment && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Payment ID</label>
                  <Input
                    value={selectedPayment.id}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Booking ID</label>
                  <Input
                    value={selectedPayment.bookingId}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Customer</label>
                  <Input
                    value={getCustomerName(selectedPayment.customerId)}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Amount</label>
                  <Input
                    value={selectedPayment.amount}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Payment Method</label>
                  <Input
                    value={selectedPayment.paymentMethod}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Status</label>
                  <Input
                    value={selectedPayment.status}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Date</label>
                  <Input
                    value={new Date(selectedPayment.createdAt).toLocaleDateString()}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
              </div>
            )}
            
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => {
                setShowViewDialog(false);
                setSelectedPayment(null);
              }}>
                Close
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}