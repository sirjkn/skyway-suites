import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Calendar, Users, Pencil, Trash2, Copy, Link as LinkIcon, Save, Upload, X } from 'lucide-react';
import { getProperties, Property, createProperty, deleteProperty, updateProperty, getBookings, Booking, getPayments, Payment, generateICalUrl, checkAirbnbAvailability } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { compressMultipleImages, CompressedImage } from '../../lib/imageUtils';
import { PropertyCalendar } from '../../components/PropertyCalendar';

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
  const [airbnbBookings, setAirbnbBookings] = useState<Array<{ checkIn: string; checkOut: string }>>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageCategories, setImageCategories] = useState<{ [url: string]: string }>({}); // Track category for each image
  const [activeCategory, setActiveCategory] = useState<'livingRoom' | 'bedroom' | 'kitchen' | 'dining' | 'amenities'>('livingRoom');
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    guests: '',
    category: '',
    image: '',
    amenities: '',
    videoUrl1: '',
    videoUrl2: '',
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
    
    const now = new Date();
    
    // Find active bookings (checkout date hasn't passed yet)
    const activeBookings = propertyBookings.filter(booking => {
      const checkOut = new Date(booking.checkOut);
      return checkOut > now;
    });
    
    console.log(`🔍 AdminProperties - Property ${propertyId}:`, {
      totalBookings: propertyBookings.length,
      activeBookings: activeBookings.length,
      totalPayments: payments.length
    });
    
    // Check if any active booking is confirmed AND paid in full
    for (const booking of activeBookings) {
      // Only consider "confirmed" bookings (not "pending")
      if (booking.status !== 'confirmed') {
        console.log(`⏭️ Skipping booking ${booking.id} - status: ${booking.status}`);
        continue;
      }
      
      // Calculate total payments for this booking
      const bookingPayments = payments.filter(p => p.bookingId === booking.id && p.status === 'paid');
      const totalPaid = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
      
      console.log(`💰 Confirmed Booking ${booking.id}:`, {
        status: booking.status,
        totalPrice: booking.totalPrice,
        totalPaid,
        isFullyPaid: totalPaid >= booking.totalPrice,
        checkOut: booking.checkOut
      });
      
      // If booking is confirmed and fully paid, property is booked
      if (totalPaid >= booking.totalPrice) {
        const checkOutDate = new Date(booking.checkOut).toLocaleDateString();
        console.log(`✅ Property BOOKED - Available from ${checkOutDate}`);
        return { 
          available: false, 
          label: `Booked, Available from ${checkOutDate}` 
        };
      }
    }
    
    // Property is available if:
    // - No active bookings
    // - OR all active bookings are pending
    // - OR active bookings are not fully paid
    console.log(`✅ Property AVAILABLE`);
    return { available: true, label: 'Available' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Ensure at least one image is uploaded
    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one property image');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the first uploaded image as the main property image
      const mainImage = uploadedImages[0];
      
      // Organize images by category
      const categorizedPhotos: Property['categorizedPhotos'] = {
        livingRoom: [],
        bedroom: [],
        kitchen: [],
        dining: [],
        amenities: [],
      };
      
      uploadedImages.forEach(imageUrl => {
        const category = imageCategories[imageUrl];
        if (category && categorizedPhotos[category as keyof typeof categorizedPhotos]) {
          categorizedPhotos[category as keyof typeof categorizedPhotos]!.push(imageUrl);
        }
      });
      
      console.log('🔍 IMAGE CATEGORIES MAP:', imageCategories);
      console.log('🔍 CATEGORIZED PHOTOS:', categorizedPhotos);
      console.log('🔍 SUBMITTING PROPERTY:', {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        location: formData.location,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        guests: Number(formData.guests),
        category: formData.category,
        image: mainImage,
        photos: uploadedImages, // All uploaded images
        categorizedPhotos, // Categorized images
        amenities: formData.amenities.split(',').map(a => a.trim()),
        available: true,
        icalUrl: '',
        airbnbCalendarUrl: '',
        calendarSyncEnabled: false,
      });
      
      const result = await createProperty({
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        location: formData.location,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        guests: Number(formData.guests),
        category: formData.category,
        image: mainImage,
        photos: uploadedImages, // All uploaded images for gallery
        categorizedPhotos, // Categorized images
        amenities: formData.amenities.split(',').map(a => a.trim()),
        available: true,
        icalUrl: '',
        airbnbCalendarUrl: '',
        calendarSyncEnabled: false,
        videoUrl1: formData.videoUrl1,
        videoUrl2: formData.videoUrl2,
      });
      
      console.log('✅ CREATE PROPERTY RESULT:', result);
      
      toast.success('Property added successfully!');
      setShowAddDialog(false);
      resetForm();
      loadProperties();
    } catch (error) {
      console.error('❌ ADD PROPERTY ERROR - FULL DETAILS:', error);
      console.error('❌ ERROR TYPE:', error instanceof Error ? 'Error Object' : typeof error);
      console.error('❌ ERROR MESSAGE:', error instanceof Error ? error.message : String(error));
      console.error('❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Show detailed error in alert AND toast
      alert(`❌ FAILED TO ADD PROPERTY\n\n${errorMessage}\n\nCheck console (F12) for full details.`);
      toast.error(`Failed to add property: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
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
        category: property.category,
        image: property.image,
        amenities: property.amenities.join(', '),
        videoUrl1: property.videoUrl1 || '',
        videoUrl2: property.videoUrl2 || '',
      });
      // Load existing photos and categories for editing
      setUploadedImages(property.photos || []);
      
      // Reconstruct image categories from categorizedPhotos if available
      if (property.categorizedPhotos) {
        const reconstructedCategories: { [url: string]: string } = {};
        Object.entries(property.categorizedPhotos).forEach(([category, urls]) => {
          if (urls) {
            urls.forEach(url => {
              reconstructedCategories[url] = category;
            });
          }
        });
        setImageCategories(reconstructedCategories);
      } else {
        setImageCategories({});
      }
      
      setShowEditDialog(true);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProperty) {
      setIsUpdating(true);
      try {
        // Use the first uploaded image if new images were uploaded, otherwise keep existing
        const mainImage = uploadedImages.length > 0 ? uploadedImages[0] : formData.image;
        
        // Organize images by category
        const categorizedPhotos: Property['categorizedPhotos'] = {
          livingRoom: [],
          bedroom: [],
          kitchen: [],
          dining: [],
          amenities: [],
        };
        
        uploadedImages.forEach(imageUrl => {
          const category = imageCategories[imageUrl];
          if (category && categorizedPhotos[category as keyof typeof categorizedPhotos]) {
            categorizedPhotos[category as keyof typeof categorizedPhotos]!.push(imageUrl);
          }
        });
        
        console.log('🔍 EDIT - IMAGE CATEGORIES MAP:', imageCategories);
        console.log('🔍 EDIT - CATEGORIZED PHOTOS:', categorizedPhotos);
        
        await updateProperty(editingProperty.id, {
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          location: formData.location,
          bedrooms: Number(formData.bedrooms),
          bathrooms: Number(formData.bathrooms),
          guests: Number(formData.guests),
          category: formData.category,
          image: mainImage,
          photos: uploadedImages, // All uploaded images for gallery
          categorizedPhotos, // Categorized images
          amenities: formData.amenities.split(',').map(a => a.trim()),
          available: true,
          videoUrl1: formData.videoUrl1,
          videoUrl2: formData.videoUrl2,
        });
        toast.success('Property updated successfully!');
        setShowEditDialog(false);
        resetForm();
        loadProperties();
      } catch (error) {
        console.error('❌ UPDATE PROPERTY ERROR - FULL DETAILS:', error);
        console.error('❌ ERROR TYPE:', error instanceof Error ? 'Error Object' : typeof error);
        console.error('❌ ERROR MESSAGE:', error instanceof Error ? error.message : String(error));
        console.error('❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack trace');
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Show detailed error in alert AND toast
        alert(`❌ FAILED TO UPDATE PROPERTY\n\n${errorMessage}\n\nCheck console (F12) for full details.`);
        toast.error(`Failed to update property: ${errorMessage}`);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleShowCalendar = async (id: string) => {
    const property = properties.find(p => p.id === id);
    if (property) {
      setCalendarProperty(property);
      setAirbnbCalendarUrl(property.airbnbCalendarUrl || '');
      setShowCalendarDialog(true);
      
      // Load Airbnb bookings if URL exists
      if (property.airbnbCalendarUrl) {
        loadAirbnbBookings(property.airbnbCalendarUrl);
      }
    }
  };
  
  const loadAirbnbBookings = async (icalUrl: string) => {
    if (!icalUrl) return;
    
    try {
      const result = await checkAirbnbAvailability(icalUrl, '', '');
      if (result && result.airbnbBookings) {
        setAirbnbBookings(result.airbnbBookings);
      }
    } catch (error) {
      console.error('Failed to load Airbnb bookings:', error);
    }
  };
  
  // Auto-sync Airbnb calendar every 1 second when calendar dialog is open
  useEffect(() => {
    if (!showCalendarDialog || !calendarProperty || !calendarProperty.airbnbCalendarUrl) {
      return;
    }
    
    // Initial load
    loadAirbnbBookings(calendarProperty.airbnbCalendarUrl);
    
    // Set up interval for every 1 second
    const interval = setInterval(() => {
      loadAirbnbBookings(calendarProperty.airbnbCalendarUrl!);
    }, 1000);
    
    // Cleanup interval on unmount or when dialog closes
    return () => clearInterval(interval);
  }, [showCalendarDialog, calendarProperty]);

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
      setUploadProgress({ current: 0, total: files.length });
      toast.info(`Starting upload of ${files.length} image(s)...`);
      
      try {
        const filesArray = Array.from(files);
        const compressedImages: CompressedImage[] = [];
        
        // Compress images one by one with progress tracking
        for (let i = 0; i < filesArray.length; i++) {
          setUploadProgress({ current: i + 1, total: files.length });
          toast.info(`Compressing image ${i + 1} of ${files.length}...`, {
            id: 'compress-progress',
            duration: 1000,
          });
          
          const compressed = await compressMultipleImages([filesArray[i]], 50);
          compressedImages.push(...compressed);
        }
        
        const imageUrls = compressedImages.map(img => img.dataUrl);
        
        // Automatically assign the active category to newly uploaded images
        const newCategories = { ...imageCategories };
        imageUrls.forEach(url => {
          newCategories[url] = activeCategory;
        });
        
        setUploadedImages([...uploadedImages, ...imageUrls]);
        setImageCategories(newCategories);
        
        // Show compression results
        const totalSize = compressedImages.reduce((sum, img) => sum + img.size, 0);
        toast.success(`✅ ${files.length} image(s) uploaded to ${getCategoryLabel(activeCategory)}! Total: ${totalSize}KB`, {
          id: 'compress-progress',
        });
      } catch (error) {
        toast.error('Failed to compress images');
      } finally {
        setIsCompressing(false);
        setUploadProgress(null);
      }
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      livingRoom: 'Living Room',
      bedroom: 'Bedroom',
      kitchen: 'Kitchen',
      dining: 'Dining',
      amenities: 'Amenities',
    };
    return labels[category] || category;
  };

  const removeImage = (imageUrl: string) => {
    setUploadedImages(uploadedImages.filter(url => url !== imageUrl));
    const newCategories = { ...imageCategories };
    delete newCategories[imageUrl];
    setImageCategories(newCategories);
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
      category: '',
      image: '',
      amenities: '',
      videoUrl1: '',
      videoUrl2: '',
    });
    setUploadedImages([]);
    setImageCategories({});
    setActiveCategory('livingRoom'); // Reset to default category
    setIsSubmitting(false);
    setIsUpdating(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl mb-2">Properties</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage your property listings</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8">
        <Button onClick={() => setShowAddDialog(true)} className="flex-1 sm:flex-none">
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
        <Link to="/admin/bookings" className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Bookings
          </Button>
        </Link>
        <Link to="/admin/customers" className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </Button>
        </Link>
      </div>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Properties ({properties.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
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
                      <td className="py-2 px-3 font-semibold">KES {property.price.toLocaleString()}</td>
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
          {/* Mobile Table */}
          <div className="lg:hidden">
            {properties.map((property) => {
              const availability = getPropertyAvailability(property.id);
              return (
                <div key={property.id} className="border-b hover:bg-gray-50 text-sm p-3">
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
                  <div className="mt-2">
                    <div className="text-gray-600">Location: {property.location}</div>
                    <div className="text-gray-600">Price: KES {property.price.toLocaleString()}</div>
                    <div className="text-gray-600">Beds: {property.bedrooms}</div>
                    <div className="text-gray-600">Guests: {property.guests}</div>
                    <div className="text-gray-600">
                      Status: <span className={`px-2 py-0.5 rounded text-xs ${
                        availability.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {availability.label}
                      </span>
                    </div>
                    <div className="mt-2">
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Property Dialog */}
      <Dialog.Root open={showAddDialog} onOpenChange={setShowAddDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 sm:p-6 w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
            <Dialog.Title className="text-xl sm:text-2xl mb-4">Add New Property</Dialog.Title>
            <Dialog.Description className="sr-only">
              Add a new property to your listings with details, images, and amenities
            </Dialog.Description>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                <label className="block text-sm mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Studio">Studio</option>
                  <option value="1 Bedroom">1 Bedroom</option>
                  <option value="2 Bedroom">2 Bedroom</option>
                  <option value="3 Bedroom">3 Bedroom</option>
                </select>
              </div>
              
              {/* Multiple Image Upload */}
              <div className="border-t pt-4">
                <label className="block text-sm mb-3 font-medium">Upload Property Images by Category *</label>
                
                {/* Category Tabs */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {[
                    { key: 'livingRoom', label: 'Living Room' },
                    { key: 'bedroom', label: 'Bedroom' },
                    { key: 'kitchen', label: 'Kitchen' },
                    { key: 'dining', label: 'Dining' },
                    { key: 'amenities', label: 'Amenities' },
                  ].map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategory(cat.key as typeof activeCategory)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeCategory === cat.key
                          ? 'bg-[#6B7C3C] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                      {uploadedImages.filter(img => imageCategories[img] === cat.key).length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                          {uploadedImages.filter(img => imageCategories[img] === cat.key).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Upload Section */}
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                  <p className="text-xs text-gray-600 mb-3">
                    Currently uploading to: <strong className="text-[#6B7C3C]">{getCategoryLabel(activeCategory)}</strong>
                  </p>
                  
                  <label className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm font-medium">{isCompressing ? 'Compressing...' : 'Choose Images'}</span>
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
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Images will be automatically compressed to WebP format (max 50KB each)
                  </p>
                </div>
                
                {/* Upload Progress */}
                {uploadProgress && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">
                        Uploading to {getCategoryLabel(activeCategory)}...
                      </span>
                      <span className="text-sm text-blue-700">
                        {uploadProgress.current} / {uploadProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Image Previews for Active Category */}
                {uploadedImages.filter(img => imageCategories[img] === activeCategory).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">{getCategoryLabel(activeCategory)} Photos</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {uploadedImages
                        .filter(img => imageCategories[img] === activeCategory)
                        .map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`${getCategoryLabel(activeCategory)} ${index + 1}`}
                              className="w-full h-24 object-cover rounded border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(imageUrl)}
                              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                              {getCategoryLabel(activeCategory)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Total Images Summary */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900">
                      Total Images: {uploadedImages.length}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        { key: 'livingRoom', label: 'Living Room' },
                        { key: 'bedroom', label: 'Bedroom' },
                        { key: 'kitchen', label: 'Kitchen' },
                        { key: 'dining', label: 'Dining' },
                        { key: 'amenities', label: 'Amenities' },
                      ].map(cat => {
                        const count = uploadedImages.filter(img => imageCategories[img] === cat.key).length;
                        if (count === 0) return null;
                        return (
                          <span key={cat.key} className="text-xs px-2 py-1 bg-white rounded border border-green-300 text-green-800">
                            {cat.label}: {count}
                          </span>
                        );
                      })}
                    </div>
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
              
              {/* Video URL Fields */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Property Videos (Optional)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-2">Video URL 1 (YouTube, Vimeo, etc.)</label>
                    <Input
                      type="url"
                      value={formData.videoUrl1}
                      onChange={(e) => setFormData({ ...formData, videoUrl1: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste the full video URL (YouTube, Vimeo, or any video link)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Video URL 2 (YouTube, Vimeo, etc.)</label>
                    <Input
                      type="url"
                      value={formData.videoUrl2}
                      onChange={(e) => setFormData({ ...formData, videoUrl2: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste the full video URL (YouTube, Vimeo, or any video link)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Property'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="w-full sm:w-auto" disabled={isSubmitting}>
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
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 sm:p-6 w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
            <Dialog.Title className="text-xl sm:text-2xl mb-4">Edit Property</Dialog.Title>
            <Dialog.Description className="sr-only">
              Edit property information including details, images, and amenities
            </Dialog.Description>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                <label className="block text-sm mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Studio">Studio</option>
                  <option value="1 Bedroom">1 Bedroom</option>
                  <option value="2 Bedroom">2 Bedroom</option>
                  <option value="3 Bedroom">3 Bedroom</option>
                </select>
              </div>
              
              {/* Multiple Image Upload for Edit */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Upload Property Images by Category *</label>
                  {uploadedImages.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to remove all images? You will need to re-upload categorized photos.')) {
                          setUploadedImages([]);
                          setImageCategories({});
                          toast.success('All images removed. Please re-upload with categories.');
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Remove All
                    </Button>
                  )}
                </div>
                
                {/* Category Tabs */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {[
                    { key: 'livingRoom', label: 'Living Room' },
                    { key: 'bedroom', label: 'Bedroom' },
                    { key: 'kitchen', label: 'Kitchen' },
                    { key: 'dining', label: 'Dining' },
                    { key: 'amenities', label: 'Amenities' },
                  ].map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategory(cat.key as typeof activeCategory)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeCategory === cat.key
                          ? 'bg-[#6B7C3C] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                      {uploadedImages.filter(img => imageCategories[img] === cat.key).length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                          {uploadedImages.filter(img => imageCategories[img] === cat.key).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Upload Section */}
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                  <p className="text-xs text-gray-600 mb-3">
                    Currently uploading to: <strong className="text-[#6B7C3C]">{getCategoryLabel(activeCategory)}</strong>
                  </p>
                  
                  <label className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm font-medium">{isCompressing ? 'Compressing...' : 'Choose Images'}</span>
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
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Images will be automatically compressed to WebP format (max 50KB each)
                  </p>
                </div>
                
                {/* Upload Progress */}
                {uploadProgress && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">
                        Uploading to {getCategoryLabel(activeCategory)}...
                      </span>
                      <span className="text-sm text-blue-700">
                        {uploadProgress.current} / {uploadProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Image Previews for Active Category */}
                {uploadedImages.filter(img => imageCategories[img] === activeCategory).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">{getCategoryLabel(activeCategory)} Photos</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {uploadedImages
                        .filter(img => imageCategories[img] === activeCategory)
                        .map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`${getCategoryLabel(activeCategory)} ${index + 1}`}
                              className="w-full h-24 object-cover rounded border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(imageUrl)}
                              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                              {getCategoryLabel(activeCategory)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Total Images Summary */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900">
                      Total Images: {uploadedImages.length}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        { key: 'livingRoom', label: 'Living Room' },
                        { key: 'bedroom', label: 'Bedroom' },
                        { key: 'kitchen', label: 'Kitchen' },
                        { key: 'dining', label: 'Dining' },
                        { key: 'amenities', label: 'Amenities' },
                      ].map(cat => {
                        const count = uploadedImages.filter(img => imageCategories[img] === cat.key).length;
                        if (count === 0) return null;
                        return (
                          <span key={cat.key} className="text-xs px-2 py-1 bg-white rounded border border-green-300 text-green-800">
                            {cat.label}: {count}
                          </span>
                        );
                      })}
                    </div>
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
              
              {/* Video URL Fields */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Property Videos (Optional)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-2">Video URL 1 (YouTube, Vimeo, etc.)</label>
                    <Input
                      type="url"
                      value={formData.videoUrl1}
                      onChange={(e) => setFormData({ ...formData, videoUrl1: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste the full video URL (YouTube, Vimeo, or any video link)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Video URL 2 (YouTube, Vimeo, etc.)</label>
                    <Input
                      type="url"
                      value={formData.videoUrl2}
                      onChange={(e) => setFormData({ ...formData, videoUrl2: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste the full video URL (YouTube, Vimeo, or any video link)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <Button type="submit" className="w-full sm:w-auto" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Property'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="w-full sm:w-auto" disabled={isUpdating}>
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
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 sm:p-6 w-[95%] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl sm:text-2xl mb-4">Calendar Sync & Export</Dialog.Title>
            <Dialog.Description className="sr-only">
              Export calendar to iCal format and import Airbnb calendar to prevent double bookings
            </Dialog.Description>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm mb-2 font-medium">Property</label>
                <div className="font-medium text-base sm:text-lg">{calendarProperty?.title}</div>
                <div className="text-sm text-gray-600">{calendarProperty?.location}</div>
              </div>

              {/* iCal Export */}
              <div className="border rounded-lg p-3 sm:p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <h3 className="font-semibold text-sm sm:text-base">Export Calendar (.ical)</h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Use this link to sync your Skyway Suites bookings with other calendar apps (Google Calendar, Apple Calendar, Outlook, etc.)
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    value={calendarProperty ? generateICalUrl(calendarProperty.id) : ''}
                    readOnly
                    className="flex-1 bg-white text-xs sm:text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(calendarProperty ? generateICalUrl(calendarProperty.id) : '')}
                    className="w-full sm:w-auto"
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
              <div className="border rounded-lg p-3 sm:p-4 bg-orange-50">
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  <h3 className="font-semibold text-sm sm:text-base">Import Airbnb Calendar</h3>
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
                    className="bg-white text-xs sm:text-sm"
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
              <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex-shrink-0">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1 text-sm sm:text-base">Double Booking Prevention Active</h4>
                    <p className="text-xs sm:text-sm text-green-800">
                      The system automatically checks for booking conflicts. When someone tries to book a property with existing paid reservations, they will be notified that those dates are unavailable.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Property Calendar View */}
              {calendarProperty && (
                <div>
                  <PropertyCalendar
                    propertyId={calendarProperty.id}
                    skywayBookings={
                      bookings
                        .filter(b => b.propertyId === calendarProperty.id)
                        .filter(b => {
                          const payment = payments.find(p => p.bookingId === b.id);
                          return payment && payment.status === 'paid' && payment.amount >= b.totalPrice;
                        })
                        .map(b => ({
                          checkIn: b.checkIn,
                          checkOut: b.checkOut,
                        }))
                    }
                    airbnbBookings={airbnbBookings}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
              <Button type="button" onClick={handleSaveCalendar} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Save Calendar Settings
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCalendarDialog(false)} className="w-full sm:w-auto">
                Close
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}