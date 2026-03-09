import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Calendar, Users, Pencil, Trash2, Copy, Link as LinkIcon, Save, Upload, X } from 'lucide-react';
import { getProperties, Property, createProperty, deleteProperty, updateProperty, getBookings, Booking, getPayments, Payment, generateICalUrl } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { compressMultipleImages, CompressedImage } from '../../lib/imageUtils';

export function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [calendarProperty, setCalendarProperty] = useState<Property | null>(null);
  const [airbnbCalendarUrl, setAirbnbCalendarUrl] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
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
      resetForm();
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
        resetForm();
        loadProperties();
      } catch (error) {
        toast.error('Failed to update property');
      }
    }
  };

  const handleShowCalendar = async (id: string) => {
    const property = properties.find(p => p.id === id);
    if (property) {
      setCalendarProperty(property);
      setAirbnbCalendarUrl(property.airbnbCalendarUrl || '');
      setShowCalendarDialog(true);
    }
  };

  const handleSaveCalendar = async () => {
    if (calendarProperty) {
      try {
        await updateProperty(calendarProperty.id, {
          airbnbCalendarUrl: airbnbCalendarUrl,
        });
        toast.success('Calendar settings saved!');
        setShowCalendarDialog(false);
        loadProperties();
      } catch (error) {
        toast.error('Failed to save calendar settings');
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsCompressing(true);
      toast.info(`Compressing ${files.length} image(s) to WebP (max 50KB each)...`);
      
      try {
        const compressedImages: CompressedImage[] = await compressMultipleImages(Array.from(files), 50);
        const imageUrls = compressedImages.map(img => img.dataUrl);
        setUploadedImages([...uploadedImages, ...imageUrls]);
        
        // Show compression results
        const totalSize = compressedImages.reduce((sum, img) => sum + img.size, 0);
        toast.success(`${files.length} image(s) compressed! Total: ${totalSize}KB`);
      } catch (error) {
        toast.error('Failed to compress images');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const resetForm = () => {
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
    setUploadedImages([]);
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleShowCalendar(property.id)}
                          >
                            <Calendar className="h-3.5 w-3.5" />
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
              
              {/* Multiple Image Upload */}
              <div className="border-t pt-4">
                <label className="block text-sm mb-2 font-medium">Upload Property Images</label>
                <p className="text-xs text-gray-600 mb-3">
                  Upload multiple images. Each will be automatically compressed to WebP format (max 50KB).
                </p>
                
                <div className="flex items-center gap-3 mb-3">
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">{isCompressing ? 'Compressing...' : 'Choose Images'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isCompressing}
                    />
                  </label>
                  {uploadedImages.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''} uploaded
                    </span>
                  )}
                </div>

                {/* Image Previews */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
              
              {/* Multiple Image Upload for Edit */}
              <div className="border-t pt-4">
                <label className="block text-sm mb-2 font-medium">Upload Property Images</label>
                <p className="text-xs text-gray-600 mb-3">
                  Upload multiple images. Each will be automatically compressed to WebP format (max 50KB).
                </p>
                
                <div className="flex items-center gap-3 mb-3">
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">{isCompressing ? 'Compressing...' : 'Choose Images'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isCompressing}
                    />
                  </label>
                  {uploadedImages.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''} uploaded
                    </span>
                  )}
                </div>

                {/* Image Previews */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Calendar Dialog */}
      <Dialog.Root open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-2xl mb-4">Calendar Sync & Export</Dialog.Title>
            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-2 font-medium">Property</label>
                <div className="font-medium text-lg">{calendarProperty?.title}</div>
                <div className="text-sm text-gray-600">{calendarProperty?.location}</div>
              </div>

              {/* iCal Export */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Export Calendar (.ical)</h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Use this link to sync your Skyway Suites bookings with other calendar apps (Google Calendar, Apple Calendar, Outlook, etc.)
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={calendarProperty ? generateICalUrl(calendarProperty.id) : ''}
                    readOnly
                    className="flex-1 bg-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(calendarProperty ? generateICalUrl(calendarProperty.id) : '')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="mt-3 p-3 bg-white rounded text-xs">
                  <p className="mb-1.5"><strong>How to use:</strong></p>
                  <ol className="list-decimal list-inside space-y-0.5 text-gray-700">
                    <li>Copy the URL above</li>
                    <li>Open your calendar app (Google Calendar, Apple Calendar, etc.)</li>
                    <li>Look for "Subscribe to calendar" or "Add calendar from URL"</li>
                    <li>Paste this URL to keep bookings synced</li>
                  </ol>
                </div>
              </div>

              {/* Airbnb Calendar Import */}
              <div className="border rounded-lg p-4 bg-orange-50">
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold">Import Airbnb Calendar</h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Prevent double bookings by syncing your Airbnb calendar. This will block dates that are already booked on Airbnb.
                </p>
                <div>
                  <label className="block text-sm mb-2 font-medium">Airbnb Calendar URL</label>
                  <Input
                    value={airbnbCalendarUrl}
                    onChange={(e) => setAirbnbCalendarUrl(e.target.value)}
                    placeholder="https://www.airbnb.com/calendar/ical/..."
                    className="bg-white"
                  />
                </div>
                <div className="mt-3 p-3 bg-white rounded text-xs">
                  <p className="mb-1.5"><strong>How to get your Airbnb calendar URL:</strong></p>
                  <ol className="list-decimal list-inside space-y-0.5 text-gray-700">
                    <li>Log in to your Airbnb host dashboard</li>
                    <li>Go to Calendar → Availability Settings</li>
                    <li>Scroll to "Sync calendars" section</li>
                    <li>Click "Export calendar" and copy the iCal link</li>
                    <li>Paste it above and save</li>
                  </ol>
                </div>
              </div>

              {/* Double Booking Prevention Notice */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">Double Booking Prevention Active</h4>
                    <p className="text-sm text-green-800">
                      The system automatically checks for booking conflicts. When someone tries to book a property with existing paid reservations, they will be notified that those dates are unavailable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-6">
              <Button type="button" onClick={handleSaveCalendar}>
                <Save className="h-4 w-4 mr-2" />
                Save Calendar Settings
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCalendarDialog(false)}>
                Close
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}