import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBookingsByCustomer, getProperties, Property, Booking, getPayments, Payment, updateUser } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { MapPin, Calendar, Users, DollarSign, User, Lock } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { formatDateTime } from '../lib/dateUtils';

export function CustomerProfile() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Profile edit state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check if we have a valid user
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      const [bookingsData, propertiesData, paymentsData] = await Promise.all([
        getBookingsByCustomer(user.id).catch(() => []),
        getProperties().catch(() => []),
        getPayments(user.id).catch(() => [])
      ]);
      
      // Filter bookings for this customer
      const myBookings = bookingsData.filter(b => b.customerId === user?.id);
      setBookings(myBookings);
      setProperties(propertiesData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Don't show error toast if API is not available
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      await updateUser(user.id, { name, email });
      
      // Update localStorage
      const updatedUser = { ...user, name, email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
      
      // Reload page to update auth context
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await updateUser(user.id, { password: newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  const getPropertyDetails = (propertyId: string) => {
    return properties.find(p => p.id === propertyId);
  };

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6B7C3C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your bookings and account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2">Name</label>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Email</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        Save Changes
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsEditingProfile(false);
                          setName(user?.name || '');
                          setEmail(user?.email || '');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{user?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="font-medium capitalize">{user?.role}</p>
                    </div>
                    <Button 
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full"
                    >
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isChangingPassword ? (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2">Current Password</label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Confirm New Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        Update Password
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsChangingPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button 
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full"
                  >
                    Change Password
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Logout Button */}
            <Button 
              onClick={logout}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>

          {/* Right Content - Bookings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  My Bookings ({bookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                    <p className="text-gray-600 mb-6">
                      Start exploring our amazing properties
                    </p>
                    <Link to="/properties">
                      <Button>Browse Properties</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => {
                      const property = getPropertyDetails(booking.propertyId);
                      return (
                        <Card key={booking.id} className="overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            {property?.image && (
                              <div className="md:w-48 h-48 md:h-auto overflow-hidden">
                                <img
                                  src={property.image}
                                  alt={property.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="text-lg font-semibold mb-1">
                                    {property?.title || 'Property'}
                                  </h3>
                                  {property?.location && (
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {property.location}
                                    </p>
                                  )}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-gray-600">Check-in</p>
                                  <p className="text-sm font-medium">{formatDate(booking.checkIn)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Check-out</p>
                                  <p className="text-sm font-medium">{formatDate(booking.checkOut)}</p>
                                </div>
                              </div>

                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="text-xs text-gray-600">Guests</p>
                                    <p className="text-sm font-medium">{booking.guests}</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4 text-[#6B7C3C]" />
                                    <span className="text-lg font-bold text-[#6B7C3C]">
                                      ${booking.totalPrice}
                                    </span>
                                  </div>
                                </div>
                                
                                {property && (
                                  <Link to={`/properties/${property.id}`}>
                                    <Button variant="outline" size="sm">
                                      View Property
                                    </Button>
                                  </Link>
                                )}
                              </div>

                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-gray-500">
                                  Booking ID: {booking.id}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Booked on: {formatDate(booking.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}