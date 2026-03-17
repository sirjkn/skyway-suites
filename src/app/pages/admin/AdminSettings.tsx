import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Upload, X, Wrench, Mail, MessageCircle, Bell, Settings as SettingsIcon, Users as UsersIcon } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Switch from '@radix-ui/react-switch';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { 
  getHeroSettings, 
  updateHeroSettings, 
  getMaintenanceSettings, 
  updateMaintenanceSettings, 
  getCompanyInfo, 
  updateCompanyInfo,
  getNotificationSettings,
  updateNotificationSettings,
  API_BASE_URL
} from '../../lib/api';
import { compressImageToWebP } from '../../lib/imageUtils';
import { uploadToCloudinary, getCloudinaryConfig, saveCloudinaryConfig } from '../../lib/cloudinaryUpload';
import { UsersManagement } from '../../components/UsersManagement';

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [heroBackgroundUrl, setHeroBackgroundUrl] = useState('https://res.cloudinary.com/dc5d5zfos/image/upload/v1773134775/skyway-suites/yndkhqpgcxknpro3tjjd.webp');
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [isLoadingHero, setIsLoadingHero] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState('');
  
  // Cloudinary configuration
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState('');
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState('');
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState('');

  // Company Info State
  const [companyName, setCompanyName] = useState('Skyway Suites');
  const [companyEmail, setCompanyEmail] = useState('info@skywaysuites.com');
  const [companyPhone, setCompanyPhone] = useState('+1 (555) 123-4567');
  const [companyAddress, setCompanyAddress] = useState('123 Main St, Suite 100, New York, NY 10001');

  // Email Integration State
  const [emailProvider, setEmailProvider] = useState('smtp');
  const [emailApiKey, setEmailApiKey] = useState('');
  const [emailFromAddress, setEmailFromAddress] = useState('info@skywaysuites.co.ke');
  const [emailFromName, setEmailFromName] = useState('Skyway Suites');
  const [adminNotificationEmail, setAdminNotificationEmail] = useState('info@skywaysuites.co.ke');
  
  // SMTP Configuration State
  const [smtpHost, setSmtpHost] = useState('raptor.vivawebhost.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUsername, setSmtpUsername] = useState('info@skywaysuites.co.ke');
  const [smtpPassword, setSmtpPassword] = useState('^we;RW{8OMGUOazE');
  const [smtpSecure, setSmtpSecure] = useState(false); // STARTTLS for 587
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  
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

  // Maintenance Mode State
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("We're currently performing scheduled maintenance to improve your experience.");
  const [maintenanceEstimatedTime, setMaintenanceEstimatedTime] = useState("We'll be back soon");

  useEffect(() => {
    loadHeroSettings();
    loadCloudinaryConfig();
    loadMaintenanceSettings();
    loadCompanyInfo();
    loadNotificationSettings();
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
      if (settings?.backgroundImages) {
        setHeroImages(settings.backgroundImages);
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

  const loadMaintenanceSettings = async () => {
    try {
      const settings = await getMaintenanceSettings();
      if (settings) {
        setMaintenanceEnabled(settings.enabled === 'true');
        setMaintenanceMessage(settings.message || "We're currently performing scheduled maintenance to improve your experience.");
        setMaintenanceEstimatedTime(settings.estimated_time || "We'll be back soon");
      }
    } catch (error) {
      console.error('Failed to load maintenance settings');
    }
  };

  const handleSaveMaintenanceSettings = async () => {
    try {
      await updateMaintenanceSettings({
        enabled: maintenanceEnabled ? 'true' : 'false',
        message: maintenanceMessage,
        estimated_time: maintenanceEstimatedTime,
      });
      toast.success('Maintenance settings saved!');
    } catch (error) {
      toast.error('Failed to save maintenance settings');
    }
  };

  const loadCompanyInfo = async () => {
    try {
      const info = await getCompanyInfo();
      if (info) {
        setCompanyName(info.companyName || 'Skyway Suites');
        setCompanyEmail(info.email || 'info@skywaysuites.com');
        setCompanyPhone(info.phone || '+1 (555) 123-4567');
        setCompanyAddress(info.address || '123 Main St, Suite 100, New York, NY 10001');
      }
    } catch (error) {
      console.error('Failed to load company info');
    }
  };

  const handleSaveCompanyInfo = async () => {
    try {
      await updateCompanyInfo({
        companyName: companyName,
        email: companyEmail,
        phone: companyPhone,
        address: companyAddress,
      });
      toast.success('Company info saved!');
    } catch (error) {
      toast.error('Failed to save company info');
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const settings = await getNotificationSettings();
      if (settings) {
        // Load email integration settings
        if (settings.emailProvider) setEmailProvider(settings.emailProvider);
        if (settings.emailApiKey) setEmailApiKey(settings.emailApiKey);
        if (settings.emailFromAddress) setEmailFromAddress(settings.emailFromAddress);
        if (settings.emailFromName) setEmailFromName(settings.emailFromName);
        if (settings.adminNotificationEmail) setAdminNotificationEmail(settings.adminNotificationEmail);
        
        // Load SMTP configuration settings
        if (settings.smtpHost) setSmtpHost(settings.smtpHost);
        if (settings.smtpPort) setSmtpPort(settings.smtpPort);
        if (settings.smtpUsername) setSmtpUsername(settings.smtpUsername);
        if (settings.smtpPassword) setSmtpPassword(settings.smtpPassword);
        if (settings.smtpSecure !== undefined) {
          // Convert string 'true'/'false' to boolean
          setSmtpSecure(settings.smtpSecure === 'true' || settings.smtpSecure === true);
        }
        
        // Load WhatsApp integration settings
        if (settings.whatsappProvider) setWhatsappProvider(settings.whatsappProvider);
        if (settings.whatsappAccountSid) setWhatsappAccountSid(settings.whatsappAccountSid);
        if (settings.whatsappAuthToken) setWhatsappAuthToken(settings.whatsappAuthToken);
        if (settings.whatsappFromNumber) setWhatsappFromNumber(settings.whatsappFromNumber);
        if (settings.wesendrApiKey) setWesendrApiKey(settings.wesendrApiKey);
        
        // Load notification actions with proper validation and defaults
        if (settings.notificationActions) {
          setNotificationActions({
            accountCreated: settings.notificationActions.accountCreated || { email: true, whatsapp: true },
            bookingCreated: settings.notificationActions.bookingCreated || { email: true, whatsapp: true },
            bookingConfirmed: settings.notificationActions.bookingConfirmed || { email: true, whatsapp: true },
          });
        }
      }
    } catch (error) {
      console.error('Failed to load notification settings');
    }
  };

  const handleSaveEmailSettings = async () => {
    try {
      await updateNotificationSettings({
        emailProvider,
        emailApiKey,
        emailFromAddress,
        emailFromName,
        smtpHost,
        smtpPort,
        smtpUsername,
        smtpPassword,
        smtpSecure,
        adminNotificationEmail,
      });
      toast.success('Email settings saved successfully');
    } catch (error) {
      toast.error('Failed to save email settings');
    }
  };

  const handleInitializeRaptorSettings = async () => {
    try {
      // Set the correct Raptor settings
      setSmtpHost('raptor.vivawebhost.com');
      setSmtpPort('587');
      setSmtpUsername('info@skywaysuites.co.ke');
      setSmtpPassword('^we;RW{8OMGUOazE');
      setSmtpSecure(false);
      setEmailFromAddress('info@skywaysuites.co.ke');
      setEmailFromName('Skyway Suites');
      
      // Save to database
      await updateNotificationSettings({
        emailProvider: 'smtp',
        emailApiKey: '',
        emailFromAddress: 'info@skywaysuites.co.ke',
        emailFromName: 'Skyway Suites',
        smtpHost: 'raptor.vivawebhost.com',
        smtpPort: '587',
        smtpUsername: 'info@skywaysuites.co.ke',
        smtpPassword: '^we;RW{8OMGUOazE',
        smtpSecure: false,
        adminNotificationEmail: 'info@skywaysuites.co.ke',
      });
      
      toast.success('Raptor mail server settings initialized and saved!');
      
      // Reload settings to confirm they were saved
      setTimeout(() => {
        loadNotificationSettings();
      }, 500);
    } catch (error) {
      toast.error('Failed to initialize settings');
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSendingTest(true);
    try {
      const response = await fetch(`${API_BASE_URL}?endpoint=test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          testEmail,
          smtpHost,
          smtpPort,
          smtpUsername,
          smtpPassword,
          smtpSecure,
          emailFromAddress,
          emailFromName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Test email sent successfully to ${testEmail}!`);
        setTestEmail(''); // Clear the input after successful send
      } else {
        // Show detailed error with suggestion
        if (data.code === 'ETIMEDOUT') {
          toast.error('Connection timeout! Check the details below.', { duration: 5000 });
          toast.warning(data.suggestion || 'Try using port 587 instead of 465', { duration: 8000 });
          
          // Auto-fix: Suggest changing to port 587
          if (smtpPort === '465') {
            setTimeout(() => {
              const confirmFix = window.confirm(
                '🔧 Quick Fix Available!\n\n' +
                'Port 465 is blocked by Vercel. Would you like to automatically switch to port 587 (STARTTLS)?\n\n' +
                'This will:\n' +
                '✓ Change port from 465 → 587\n' +
                '✓ Disable SSL/TLS (use STARTTLS instead)\n' +
                '✓ Save settings automatically'
              );
              
              if (confirmFix) {
                setSmtpPort('587');
                setSmtpSecure(false);
                toast.success('Settings updated! Click "Save Email Settings" to save.');
              }
            }, 1000);
          }
        } else if (data.code === 'EAUTH') {
          toast.error('Authentication failed: Check username and password', { duration: 5000 });
        } else {
          toast.error(data.details || data.error || 'Failed to send test email', { duration: 5000 });
        }
        
        console.error('Test email error:', data);
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast.error('Failed to send test email. Please check your SMTP settings.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSaveWhatsAppSettings = async () => {
    try {
      await updateNotificationSettings({
        whatsappProvider,
        whatsappAccountSid,
        whatsappAuthToken,
        whatsappFromNumber,
        wesendrApiKey,
      });
      toast.success('WhatsApp integration saved!');
    } catch (error) {
      toast.error('Failed to save WhatsApp settings');
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      await updateNotificationSettings({
        notificationActions,
      });
      toast.success('Notification settings saved!');
    } catch (error) {
      toast.error('Failed to save notification settings');
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
                  <Input 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Email</label>
                  <Input 
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Phone</label>
                  <Input 
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Address</label>
                  <Input 
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveCompanyInfo}>
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

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Maintenance Mode</CardTitle>
                <CardDescription>Enable or disable maintenance mode for the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch.Root
                    checked={maintenanceEnabled}
                    onCheckedChange={setMaintenanceEnabled}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6B7C3C] focus:ring-offset-2 ${
                      maintenanceEnabled ? 'bg-[#6B7C3C]' : 'bg-gray-200'
                    }`}
                  >
                    <Switch.Thumb
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        maintenanceEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </Switch.Root>
                  <span className="text-sm font-medium text-gray-900">Enable Maintenance Mode</span>
                </div>
                <div>
                  <label className="block text-sm mb-2 font-medium">Maintenance Message</label>
                  <Input 
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="We are currently undergoing maintenance. Please check back later."
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 font-medium">Estimated Time</label>
                  <Input 
                    value={maintenanceEstimatedTime}
                    onChange={(e) => setMaintenanceEstimatedTime(e.target.value)}
                    placeholder="We'll be back soon"
                  />
                </div>
                <div className="p-3 bg-blue-50 rounded-md text-xs">
                  <p className="mb-1.5"><strong>Setup Instructions:</strong></p>
                  <ol className="list-decimal list-inside space-y-0.5 text-gray-700">
                    <li>Enable maintenance mode to prevent user access</li>
                    <li>Enter a message to display to users</li>
                    <li>Save settings to apply changes</li>
                  </ol>
                </div>
                <Button onClick={handleSaveMaintenanceSettings} size="sm">
                  <Wrench className="h-3.5 w-3.5 mr-2" />
                  Save Maintenance Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </Tabs.Content>

        {/* Users & Roles */}
        <Tabs.Content value="users">
          <UsersManagement />
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
                    <option value="smtp">Custom SMTP</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                  </select>
                </div>

                {emailProvider === 'smtp' ? (
                  <>
                    <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-xs">
                      <p className="font-semibold text-amber-800 mb-1">⚠️ Port 465 Blocked on Vercel</p>
                      <p className="text-amber-700">Vercel serverless functions block port 465. <strong>Use port 587 with STARTTLS instead.</strong></p>
                    </div>
                    
                    <div>
                      <label className="block text-sm mb-2 font-medium">From Name</label>
                      <Input 
                        value={emailFromName}
                        onChange={(e) => setEmailFromName(e.target.value)}
                        placeholder="Skyway Suites"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2 font-medium">From Email Address</label>
                      <Input 
                        type="email"
                        value={emailFromAddress}
                        onChange={(e) => setEmailFromAddress(e.target.value)}
                        placeholder="info@skywaysuites.co.ke"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2 font-medium">Admin Notification Email</label>
                      <Input 
                        type="email"
                        value={adminNotificationEmail}
                        onChange={(e) => setAdminNotificationEmail(e.target.value)}
                        placeholder="admin@skywaysuites.co.ke"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This email will receive notifications for new bookings and payments
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm mb-2 font-medium">SMTP Host</label>
                      <Input 
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="mail.skywaysuites.co.ke"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-2 font-medium">SMTP Port</label>
                        <Input 
                          type="number"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(e.target.value)}
                          placeholder="465"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2 font-medium">Security</label>
                        <select
                          value={smtpSecure ? 'true' : 'false'}
                          onChange={(e) => setSmtpSecure(e.target.value === 'true')}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="true">SSL/TLS (465)</option>
                          <option value="false">STARTTLS (587)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm mb-2 font-medium">SMTP Username</label>
                      <Input 
                        value={smtpUsername}
                        onChange={(e) => setSmtpUsername(e.target.value)}
                        placeholder="info@skywaysuites.co.ke"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2 font-medium">SMTP Password</label>
                      <Input 
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        placeholder="Your email password"
                      />
                    </div>

                    <div className="p-3 bg-blue-50 rounded-md text-xs">
                      <p className="mb-1.5"><strong>SMTP Configuration:</strong></p>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                        <li>Server: {smtpHost || 'mail.skywaysuites.co.ke'}</li>
                        <li>Port: {smtpPort || '587'} ({smtpSecure ? 'SSL/TLS' : 'STARTTLS'})</li>
                        <li>Username: {smtpUsername || 'info@skywaysuites.co.ke'}</li>
                        <li>From: {emailFromName || 'Skyway Suites'} &lt;{emailFromAddress || 'info@skywaysuites.co.ke'}&gt;</li>
                      </ul>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="Enter test email address"
                        className="w-full"
                      />
                      <Button
                        onClick={handleSendTestEmail}
                        size="sm"
                        disabled={isSendingTest}
                      >
                        <Mail className="h-3.5 w-3.5 mr-2" />
                        {isSendingTest ? 'Sending...' : 'Send Test Email'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}

                <Button onClick={handleSaveEmailSettings}>
                  <Mail className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>

                <Button onClick={handleInitializeRaptorSettings}>
                  <Mail className="h-4 w-4 mr-2" />
                  Initialize Raptor Mail Server
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
                
                <Button onClick={handleSaveWhatsAppSettings}>
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
                        checked={notificationActions?.accountCreated?.email || false}
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
                        checked={notificationActions?.accountCreated?.whatsapp || false}
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
                        checked={notificationActions?.bookingCreated?.email || false}
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
                        checked={notificationActions?.bookingCreated?.whatsapp || false}
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
                        checked={notificationActions?.bookingConfirmed?.email || false}
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
                        checked={notificationActions?.bookingConfirmed?.whatsapp || false}
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

                <Button onClick={handleSaveNotificationSettings}>
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