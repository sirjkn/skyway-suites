import { useState, useEffect } from 'react';
import { Save, Bell, Users as UsersIcon, Settings as SettingsIcon, Image, Mail, MessageCircle, CheckCircle, Upload, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import * as Tabs from '@radix-ui/react-tabs';
import * as Select from '@radix-ui/react-select';
import { toast } from 'sonner';
import { getHeroSettings, updateHeroSettings } from '../../lib/api';
import { compressImageToWebP } from '../../lib/imageUtils';
import { uploadToCloudinary, getCloudinaryConfig, saveCloudinaryConfig } from '../../lib/cloudinaryUpload';

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [heroBackgroundUrl, setHeroBackgroundUrl] = useState('');
  const [isLoadingHero, setIsLoadingHero] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState('');
  
  // Cloudinary configuration
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState('');
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState('');
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState('');

  // Email Integration State
  const [emailProvider, setEmailProvider] = useState('sendgrid');
  const [emailApiKey, setEmailApiKey] = useState('');
  const [emailFromAddress, setEmailFromAddress] = useState('');
  const [emailFromName, setEmailFromName] = useState('Skyway Suites');
  
  // WhatsApp Integration State
  const [whatsappProvider, setWhatsappProvider] = useState('twilio');
  const [whatsappAccountSid, setWhatsappAccountSid] = useState('');
  const [whatsappAuthToken, setWhatsappAuthToken] = useState('');
  const [whatsappFromNumber, setWhatsappFromNumber] = useState('');
  const [wesendrApiKey, setWesendrApiKey] = useState('');
  
  // Notification Actions State
  const [notificationActions, setNotificationActions] = useState({
    accountCreated: { email: true, whatsapp: true },
    bookingCreated: { email: true, whatsapp: true },
    bookingConfirmed: { email: true, whatsapp: true },
  });

  useEffect(() => {
    loadHeroSettings();
    loadCloudinaryConfig();
  }, []);

  const loadCloudinaryConfig = async () => {
    try {
      const config = await getCloudinaryConfig();
      setCloudinaryCloudName(config.cloudName);
      setCloudinaryApiKey(config.apiKey);
      setCloudinaryApiSecret(config.apiSecret);
    } catch (error) {
      console.error('Failed to load Cloudinary config');
    }
  };

  const handleSaveCloudinaryConfig = async () => {
    try {
      await saveCloudinaryConfig({
        cloudName: cloudinaryCloudName,
        apiKey: cloudinaryApiKey,
        apiSecret: cloudinaryApiSecret,
      });
      toast.success('Cloudinary configuration saved!');
    } catch (error) {
      toast.error('Failed to save Cloudinary settings');
    }
  };

  const loadHeroSettings = async () => {
    try {
      const settings = await getHeroSettings();
      if (settings?.backgroundImage) {
        setHeroBackgroundUrl(settings.backgroundImage);
      }
    } catch (error) {
      console.error('Failed to load hero settings');
    } finally {
      setIsLoadingHero(false);
    }
  };

  const handleSaveHeroBackground = async () => {
    try {
      await updateHeroSettings({ backgroundImage: heroBackgroundUrl });
      toast.success('Hero background updated! Refresh the homepage to see changes.');
    } catch (error) {
      toast.error('Failed to update hero background. Make sure you\'re connected to the database.');
    }
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if cloudinary is configured
    if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
      toast.error('Please configure Cloudinary settings first!');
      return;
    }

    setIsUploading(true);
    
    try {
      // Show file size
      toast.info(`Compressing image... (${(file.size / 1024).toFixed(0)}KB)`);
      
      // Compress to WebP (max 50KB)
      const compressedImage = await compressImageToWebP(file, 50);
      
      toast.info(`Compressed to ${compressedImage.size}KB, uploading to Cloudinary...`);
      
      // Upload to Cloudinary
      const uploadResponse = await uploadToCloudinary(
        compressedImage.dataUrl,
        {
          cloudName: cloudinaryCloudName,
          apiKey: cloudinaryApiKey,
          apiSecret: cloudinaryApiSecret,
        }
      );

      setHeroBackgroundUrl(uploadResponse.secureUrl);
      setUploadPreview(uploadResponse.secureUrl);
      
      toast.success(`Image uploaded successfully! (${(uploadResponse.bytes / 1024).toFixed(0)}KB)`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image. Check your Cloudinary settings.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Settings</h1>
        <p className="text-gray-600">Manage your application settings</p>
      </div>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-4 border-b mb-8">
          <Tabs.Trigger
            value="general"
            className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </div>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="users"
            className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Users & Roles
            </div>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="notifications"
            className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </div>
          </Tabs.Trigger>
        </Tabs.List>

        {/* General Settings */}
        <Tabs.Content value="general">
          <div className="grid gap-4 max-w-2xl">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Hero Background</CardTitle>
                <CardDescription>Upload or set the background image for the homepage hero section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {uploadPreview && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                    <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        setUploadPreview('');
                        setHeroBackgroundUrl('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm mb-1.5 font-medium">Upload Image (Auto-compressed to WebP, max 50KB)</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImage}
                      className="hidden"
                      id="upload-hero-image"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="upload-hero-image"
                      className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        isUploading 
                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                          : 'hover:bg-gray-50 border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      <Upload className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        {isUploading ? 'Uploading...' : 'Click to upload image'}
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Images will be automatically converted to WebP and compressed to under 50KB
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-500">OR</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1.5 font-medium">Background Image URL</label>
                  <Input 
                    value={heroBackgroundUrl}
                    onChange={(e) => setHeroBackgroundUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste a direct image URL from any source
                  </p>
                </div>

                <Button onClick={handleSaveHeroBackground} size="sm" disabled={!heroBackgroundUrl}>
                  <Save className="h-3.5 w-3.5 mr-2" />
                  Save Background
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Cloudinary Configuration</CardTitle>
                <CardDescription>Configure Cloudinary for automatic image uploads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm mb-1.5 font-medium">Cloud Name</label>
                  <Input 
                    value={cloudinaryCloudName}
                    onChange={(e) => setCloudinaryCloudName(e.target.value)}
                    placeholder="your-cloud-name"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1.5 font-medium">API Key</label>
                  <Input 
                    value={cloudinaryApiKey}
                    onChange={(e) => setCloudinaryApiKey(e.target.value)}
                    placeholder="your-api-key"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1.5 font-medium">API Secret</label>
                  <Input 
                    value={cloudinaryApiSecret}
                    onChange={(e) => setCloudinaryApiSecret(e.target.value)}
                    placeholder="your-api-secret"
                  />
                </div>
                <div className="p-3 bg-blue-50 rounded-md text-xs">
                  <p className="mb-1.5"><strong>Setup Cloudinary:</strong></p>
                  <ol className="list-decimal list-inside space-y-0.5 text-gray-700">
                    <li>Create a free account at <a href="https://cloudinary.com" target="_blank" className="text-blue-600 hover:underline">cloudinary.com</a></li>
                    <li>Go to Settings → Upload → Add upload preset</li>
                    <li>Set signing mode to \"Unsigned\"</li>
                    <li>Copy your Cloud Name and Upload Preset</li>
                    <li>Paste them above and save</li>
                  </ol>
                </div>
                <Button onClick={handleSaveCloudinaryConfig} size="sm">
                  <Save className="h-3.5 w-3.5 mr-2" />
                  Save Cloudinary Config
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Business Information</CardTitle>
                <CardDescription>Update your business details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm mb-2">Company Name</label>
                  <Input defaultValue="Skyway Suites" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Email</label>
                  <Input type="email" defaultValue="info@skywaysuites.com" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Phone</label>
                  <Input type="tel" defaultValue="+1 (555) 123-4567" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Address</label>
                  <Input defaultValue="123 Main St, Suite 100, New York, NY 10001" />
                </div>
                <Button onClick={() => toast.success('Settings saved!')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Database Connection</CardTitle>
                <CardDescription>Neon database configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Database URL</label>
                  <Input 
                    type="password" 
                    placeholder="postgresql://username:password@host/database" 
                  />
                </div>
                <div className="p-4 bg-blue-50 rounded-md text-sm">
                  <p className="mb-2"><strong>Connect your Neon database:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Create a Neon account at neon.tech</li>
                    <li>Create a new database project</li>
                    <li>Copy your connection string</li>
                    <li>Paste it above and save</li>
                    <li>Update API endpoints in /src/app/lib/api.ts</li>
                  </ol>
                </div>
                <Button onClick={() => toast.success('Database connection updated!')}>
                  <Save className="h-4 w-4 mr-2" />
                  Update Connection
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Booking Settings</CardTitle>
                <CardDescription>Configure booking rules and policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Minimum Nights</label>
                  <Input type="number" defaultValue="1" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Maximum Advance Booking (days)</label>
                  <Input type="number" defaultValue="365" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Cancellation Period (hours)</label>
                  <Input type="number" defaultValue="24" />
                </div>
                <Button onClick={() => toast.success('Booking settings saved!')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>
        </Tabs.Content>

        {/* Users & Roles */}
        <Tabs.Content value="users">
          <div className="grid gap-4 max-w-3xl">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Admin Users</CardTitle>
                    <CardDescription>Manage admin access and permissions</CardDescription>
                  </div>
                  <Button size="sm">
                    <UsersIcon className="h-3.5 w-3.5 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b text-sm">
                        <th className="text-left py-2 px-3 font-medium">Name</th>
                        <th className="text-left py-2 px-3 font-medium">Email</th>
                        <th className="text-left py-2 px-3 font-medium">Role</th>
                        <th className="text-left py-2 px-3 font-medium">Status</th>
                        <th className="text-left py-2 px-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-gray-50 text-sm">
                        <td className="py-2 px-3">John Admin</td>
                        <td className="py-2 px-3 text-gray-600">admin@skywaysuites.com</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            Super Admin
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                            Active
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <Button variant="outline" size="sm" className="h-7 text-xs">Edit</Button>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50 text-sm">
                        <td className="py-2 px-3">Sarah Manager</td>
                        <td className="py-2 px-3 text-gray-600">sarah@skywaysuites.com</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            Manager
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                            Active
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <Button variant="outline" size="sm" className="h-7 text-xs">Edit</Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Role Permissions</CardTitle>
                <CardDescription>Define what each role can access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="font-semibold mb-2 text-sm">Super Admin</div>
                    <div className="space-y-1.5 text-sm">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        Manage Properties
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        Manage Bookings
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        Manage Customers
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        Manage Payments
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        Access Settings
                      </label>
                    </div>
                  </div>
                  <Button onClick={() => toast.success('Permissions updated!')} size="sm">
                    <Save className="h-3.5 w-3.5 mr-2" />
                    Save Permissions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Tabs.Content>

        {/* Notifications */}
        <Tabs.Content value="notifications">
          <div className="grid gap-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Email Integration</CardTitle>
                <CardDescription>Configure email service for sending automated emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 font-medium">Email Provider</label>
                  <select
                    value={emailProvider}
                    onChange={(e) => setEmailProvider(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="smtp">Custom SMTP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2 font-medium">API Key</label>
                  <Input 
                    type="password"
                    value={emailApiKey}
                    onChange={(e) => setEmailApiKey(e.target.value)}
                    placeholder="Your API Key"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 font-medium">From Email Address</label>
                  <Input 
                    type="email"
                    value={emailFromAddress}
                    onChange={(e) => setEmailFromAddress(e.target.value)}
                    placeholder="noreply@skywaysuites.com"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 font-medium">From Name</label>
                  <Input 
                    value={emailFromName}
                    onChange={(e) => setEmailFromName(e.target.value)}
                    placeholder="Skyway Suites"
                  />
                </div>
                <div className="p-3 bg-blue-50 rounded-md text-xs">
                  <p className="mb-1.5"><strong>Setup Instructions:</strong></p>
                  <ol className="list-decimal list-inside space-y-0.5 text-gray-700">
                    <li>Create an account with your chosen email provider</li>
                    <li>Generate an API key from their dashboard</li>
                    <li>Paste your API key above</li>
                    <li>Configure your sending domain and verify it</li>
                  </ol>
                </div>
                <Button onClick={() => toast.success('Email integration saved!')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Integration</CardTitle>
                <CardDescription>Configure WhatsApp service for sending messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 font-medium">WhatsApp Provider</label>
                  <select
                    value={whatsappProvider}
                    onChange={(e) => setWhatsappProvider(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="twilio">Twilio</option>
                    <option value="wesendr">Wesendr API</option>
                  </select>
                </div>
                
                {whatsappProvider === 'twilio' && (
                  <>
                    <div>
                      <label className="block text-sm mb-2 font-medium">Twilio Account SID</label>
                      <Input 
                        value={whatsappAccountSid}
                        onChange={(e) => setWhatsappAccountSid(e.target.value)}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 font-medium">Twilio Auth Token</label>
                      <Input 
                        type="password"
                        value={whatsappAuthToken}
                        onChange={(e) => setWhatsappAuthToken(e.target.value)}
                        placeholder="Your Auth Token"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 font-medium">WhatsApp From Number</label>
                      <Input 
                        value={whatsappFromNumber}
                        onChange={(e) => setWhatsappFromNumber(e.target.value)}
                        placeholder="+1234567890"
                      />
                    </div>
                    <div className="p-3 bg-blue-50 rounded-md text-xs">
                      <p className="mb-1.5"><strong>Twilio Setup:</strong></p>
                      <ol className="list-decimal list-inside space-y-0.5 text-gray-700">
                        <li>Create a Twilio account at twilio.com</li>
                        <li>Get your Account SID and Auth Token</li>
                        <li>Set up WhatsApp Sandbox or get approved number</li>
                        <li>Enter your credentials above</li>
                      </ol>
                    </div>
                  </>
                )}
                
                {whatsappProvider === 'wesendr' && (
                  <>
                    <div>
                      <label className="block text-sm mb-2 font-medium">Wesendr API Key</label>
                      <Input 
                        type="password"
                        value={wesendrApiKey}
                        onChange={(e) => setWesendrApiKey(e.target.value)}
                        placeholder="Your Wesendr API Key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 font-medium">WhatsApp From Number</label>
                      <Input 
                        value={whatsappFromNumber}
                        onChange={(e) => setWhatsappFromNumber(e.target.value)}
                        placeholder="+1234567890"
                      />
                    </div>
                    <div className="p-3 bg-blue-50 rounded-md text-xs">
                      <p className="mb-1.5"><strong>Wesendr Setup:</strong></p>
                      <ol className="list-decimal list-inside space-y-0.5 text-gray-700">
                        <li>Create a Wesendr account</li>
                        <li>Generate an API key from dashboard</li>
                        <li>Connect your WhatsApp Business account</li>
                        <li>Enter your API key above</li>
                      </ol>
                    </div>
                  </>
                )}
                
                <Button onClick={() => toast.success('WhatsApp integration saved!')}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Save WhatsApp Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Actions</CardTitle>
                <CardDescription>Configure automatic notifications for customer actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold">Account Created</div>
                      <div className="text-sm text-gray-600">Welcome new customers to your platform</div>
                    </div>
                  </div>
                  <div className="flex gap-6 ml-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notificationActions.accountCreated.email}
                        onChange={(e) => setNotificationActions({
                          ...notificationActions,
                          accountCreated: { ...notificationActions.accountCreated, email: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notificationActions.accountCreated.whatsapp}
                        onChange={(e) => setNotificationActions({
                          ...notificationActions,
                          accountCreated: { ...notificationActions.accountCreated, whatsapp: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <MessageCircle className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">WhatsApp</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold">Booking Created</div>
                      <div className="text-sm text-gray-600">Notify customer and admin when a new booking is made</div>
                    </div>
                  </div>
                  <div className="flex gap-6 ml-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notificationActions.bookingCreated.email}
                        onChange={(e) => setNotificationActions({
                          ...notificationActions,
                          bookingCreated: { ...notificationActions.bookingCreated, email: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notificationActions.bookingCreated.whatsapp}
                        onChange={(e) => setNotificationActions({
                          ...notificationActions,
                          bookingCreated: { ...notificationActions.bookingCreated, whatsapp: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <MessageCircle className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">WhatsApp</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold">Booking Confirmed</div>
                      <div className="text-sm text-gray-600">Confirm booking details to customer after payment</div>
                    </div>
                  </div>
                  <div className="flex gap-6 ml-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notificationActions.bookingConfirmed.email}
                        onChange={(e) => setNotificationActions({
                          ...notificationActions,
                          bookingConfirmed: { ...notificationActions.bookingConfirmed, email: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notificationActions.bookingConfirmed.whatsapp}
                        onChange={(e) => setNotificationActions({
                          ...notificationActions,
                          bookingConfirmed: { ...notificationActions.bookingConfirmed, whatsapp: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <MessageCircle className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">WhatsApp</span>
                    </label>
                  </div>
                </div>

                <Button onClick={() => toast.success('Notification actions saved!')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Actions
                </Button>
              </CardContent>
            </Card>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}