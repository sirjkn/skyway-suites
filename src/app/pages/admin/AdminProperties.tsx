import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Calendar, Users, Pencil, Trash2 } from 'lucide-react';
import { getProperties, Property, createProperty, deleteProperty, updateProperty, getBookings, Booking, getPayments, Payment } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';

export function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    guests: '',
    image: '',
    amenities: '',
  });

  useEffect(() => {
    loadProperties();
    getBookings().then(setBookings);
    getPayments().then(setPayments);
  }, []);

  const loadProperties = async () => {
    const data = await getProperties();
    setProperties(data);
  };

  const getPropertyAvailability = (propertyId: string) => {
    // Find bookings for this property
    const propertyBookings = bookings.filter(b => b.propertyId === propertyId);
    
    // Check if any booking is paid in full
    const hasPaidBooking = propertyBookings.some(booking => {
      const payment = payments.find(p => p.bookingId === booking.id);
      return payment && payment.status === 'paid' && payment.amount >= booking.totalPrice;
    });
    
    if (hasPaidBooking) {
      return { available: false, label: 'Booked' };
    }
    
    return { available: true, label: 'Available' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProperty({
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        location: formData.location,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        guests: Number(formData.guests),
        image: formData.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        amenities: formData.amenities.split(',').map(a => a.trim()),
        available: true,
      });
      toast.success('Property added successfully!');
      setShowAddDialog(false);
      setFormData({
        title: '',
        description: '',
        price: '',
        location: '',
        bedrooms: '',
        bathrooms: '',
        guests: '',
        image: '',
        amenities: '',
      });
      loadProperties();
    } catch (error) {
      toast.error('Failed to add property');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this property?')) {
      try {
        await deleteProperty(id);
        toast.success('Property deleted successfully!');
        loadProperties();
      } catch (error) {
        toast.error('Failed to delete property');
      }
    }
  };

  const handleEdit = async (id: string) => {
    const property = properties.find(p => p.id === id);
    if (property) {
      setEditingProperty(property);
      setFormData({
        title: property.title,
        description: property.description,
        price: property.price.toString(),
        location: property.location,
        bedrooms: property.bedrooms.toString(),
        bathrooms: property.bathrooms.toString(),
        guests: property.guests.toString(),
        image: property.image,
        amenities: property.amenities.join(', '),
      });
      setShowEditDialog(true);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProperty) {
      try {
        await updateProperty(editingProperty.id, {
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          location: formData.location,
          bedrooms: Number(formData.bedrooms),
          bathrooms: Number(formData.bathrooms),
          guests: Number(formData.guests),
          image: formData.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
          amenities: formData.amenities.split(',').map(a => a.trim()),
          available: true,
        });
        toast.success('Property updated successfully!');
        setShowEditDialog(false);
        setFormData({
          title: '',
          description: '',
          price: '',
          location: '',
          bedrooms: '',
          bathrooms: '',
          guests: '',
          image: '',
          amenities: '',
        });
        loadProperties();
      } catch (error) {
        toast.error('Failed to update property');
      }
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Properties</h1>
        <p className="text-gray-600">Manage your property listings</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
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

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Properties ({properties.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b text-sm">
                  <th className="text-left py-2 px-3 font-medium">Property</th>
                  <th className="text-left py-2 px-3 font-medium">Location</th>
                  <th className="text-left py-2 px-3 font-medium">Price</th>
                  <th className="text-left py-2 px-3 font-medium">Beds</th>
                  <th className="text-left py-2 px-3 font-medium">Guests</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => {
                  const availability = getPropertyAvailability(property.id);
                  return (
                    <tr key={property.id} className="border-b hover:bg-gray-50 text-sm">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-10 h-10 rounded bg-cover bg-center flex-shrink-0"
                            style={{ backgroundImage: `url('${property.image}')` }}
                          />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{property.title}</div>
                            <div className="text-xs text-gray-500 truncate">{property.description.slice(0, 40)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-gray-600">{property.location}</td>
                      <td className="py-2 px-3 font-semibold">${property.price}</td>
                      <td className="py-2 px-3 text-gray-600">{property.bedrooms}</td>
                      <td className="py-2 px-3 text-gray-600">{property.guests}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          availability.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {availability.label}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(property.id)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDelete(property.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Property Dialog */}
      <Dialog.Root open={showAddDialog} onOpenChange={setShowAddDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-2xl mb-4">Add New Property</Dialog.Title>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm mb-2">Price/night</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Bedrooms</label>
                  <Input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Bathrooms</label>
                  <Input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Guests</label>
                  <Input
                    type="number"
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Image URL</label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Amenities (comma-separated)</label>
                <Input
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="WiFi, Kitchen, Pool, Parking"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="submit">Add Property</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Property Dialog */}
      <Dialog.Root open={showEditDialog} onOpenChange={setShowEditDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-2xl mb-4">Edit Property</Dialog.Title>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm mb-2">Price/night</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Bedrooms</label>
                  <Input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Bathrooms</label>
                  <Input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Guests</label>
                  <Input
                    type="number"
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Image URL</label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Amenities (comma-separated)</label>
                <Input
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="WiFi, Kitchen, Pool, Parking"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="submit">Update Property</Button>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}