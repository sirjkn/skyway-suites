import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Calendar, Users, CreditCard, DollarSign } from 'lucide-react';
import { getPayments, Payment, getBookings, getCustomers } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';

export function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    loadPayments();
    getBookings().then(setBookings);
    getCustomers().then(setCustomers);
  }, []);

  const loadPayments = async () => {
    const data = await getPayments();
    setPayments(data);
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
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="py-2 px-3 font-mono text-xs">#{payment.id.slice(0, 8)}</td>
                    <td className="py-2 px-3 font-mono text-xs">#{payment.bookingId.slice(0, 8)}</td>
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Booking</label>
                <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option value="">Select a booking</option>
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>Booking #{b.id} - ${b.totalPrice}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Customer</label>
                <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option value="">Select a customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Amount</label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm mb-2">Payment Method</label>
                <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option>Credit Card</option>
                  <option>Debit Card</option>
                  <option>PayPal</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <Button onClick={() => {
                  toast.success('Payment processed! (Connect to Neon database to save)');
                  setShowAddDialog(false);
                }}>
                  Process Payment
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
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