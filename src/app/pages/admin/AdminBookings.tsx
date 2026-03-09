import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Home, Users, Calendar } from 'lucide-react';
import { getBookings, Booking, getProperties, getCustomers, getPayments, Payment } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
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
    getProperties().then(setProperties);
    getCustomers().then(setCustomers);
    getPayments().then(setPayments);
  }, []);

  const loadBookings = async () => {
    const data = await getBookings();
    setBookings(data);
  };

  const getBookingStatus = (booking: Booking) => {
    // Find payment for this booking
    const payment = payments.find(p => p.bookingId === booking.id);
    
    if (!payment || payment.status === 'pending') {
      return 'pending payment';
    } else if (payment.status === 'paid' && payment.amount >= booking.totalPrice) {
      return 'confirmed';
    }
    
    return booking.status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending payment': 'bg-yellow-100 text-yellow-700',
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Bookings</h1>
        <p className="text-gray-600">Manage property bookings</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Book Property
        </Button>
        <Link to="/admin/customers">
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </Button>
        </Link>
        <Link to="/admin/properties">
          <Button variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Properties
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-gray-600 mb-0.5">Total Bookings</div>
            <div className="text-xl font-semibold">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-gray-600 mb-0.5">Pending</div>
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
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="py-2 px-3 font-mono text-xs">#{booking.id.slice(0, 8)}</td>
                    <td className="py-2 px-3">{getPropertyName(booking.propertyId)}</td>
                    <td className="py-2 px-3 text-gray-600">{getCustomerName(booking.customerId)}</td>
                    <td className="py-2 px-3 text-gray-600">{booking.checkIn}</td>
                    <td className="py-2 px-3 text-gray-600">{booking.checkOut}</td>
                    <td className="py-2 px-3 font-semibold">${booking.totalPrice}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(getBookingStatus(booking))}`}>
                        {getBookingStatus(booking)}
                      </span>
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Property</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Customer</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Check-in</label>
                  <Input
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Check-out</label>
                  <Input
                    type="date"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Guests</label>
                  <Input
                    type="number"
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Total Price</label>
                  <Input
                    type="number"
                    value={formData.totalPrice}
                    onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button onClick={() => {
                  toast.success('Booking created! (Connect to Neon database to save)');
                  setShowAddDialog(false);
                }}>
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
    </div>
  );
}