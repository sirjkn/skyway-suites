import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { API_BASE_URL } from '../../lib/api';
import { toast } from 'sonner';
import { Mail, Eye, Save, RotateCcw } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  description: string;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'booking_customer',
    name: 'Booking Created - Customer',
    subject: '🎉 New Booking Created - {{propertyTitle}}',
    description: 'Email sent to customers when they create a new booking',
    htmlTemplate: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6B7C3C; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6B7C3C; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .label { font-weight: bold; color: #6B7C3C; }
    .value { color: #3a3a3a; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Booking Created!</h1>
      <p>Thank you for choosing Skyway Suites</p>
    </div>
    <div class="content">
      <p>Dear {{customerName}},</p>
      <p>Your booking has been successfully created. Here are the details:</p>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #6B7C3C;">Booking Details</h3>
        <div class="detail-row">
          <span class="label">Property:</span>
          <span class="value">{{propertyTitle}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Check-in:</span>
          <span class="value">{{checkIn}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Check-out:</span>
          <span class="value">{{checkOut}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Guests:</span>
          <span class="value">{{guests}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Total Price:</span>
          <span class="value">KSh {{totalPrice}}</span>
        </div>
      </div>
      
      <div class="warning">
        <strong>⚠️ Payment Required</strong><br>
        Your booking is currently <strong>pending</strong>. Please complete your payment to confirm this booking.
      </div>
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
      
      <div class="footer">
        <p>This is an automated email from Skyway Suites</p>
        <p>&copy; {{currentYear}} Skyway Suites. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'booking_admin',
    name: 'Booking Created - Admin',
    subject: '🔔 New Booking Alert - {{customerName}}',
    description: 'Email sent to admin when a new booking is created',
    htmlTemplate: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3a3a3a; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6B7C3C; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .label { font-weight: bold; color: #6B7C3C; }
    .value { color: #3a3a3a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 New Booking Alert</h1>
    </div>
    <div class="content">
      <p><strong>A new booking has been created!</strong></p>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #6B7C3C;">Customer Information</h3>
        <div class="detail-row">
          <span class="label">Name:</span>
          <span class="value">{{customerName}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Email:</span>
          <span class="value">{{customerEmail}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Phone:</span>
          <span class="value">{{customerPhone}}</span>
        </div>
      </div>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #6B7C3C;">Booking Details</h3>
        <div class="detail-row">
          <span class="label">Property:</span>
          <span class="value">{{propertyTitle}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Check-in:</span>
          <span class="value">{{checkIn}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Check-out:</span>
          <span class="value">{{checkOut}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Guests:</span>
          <span class="value">{{guests}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Total Price:</span>
          <span class="value">KSh {{totalPrice}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value" style="color: #ffc107;">⏳ Pending Payment</span>
        </div>
      </div>
      
      <p>Please follow up with the customer to ensure payment is completed.</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'payment_customer',
    name: 'Payment Confirmed - Customer',
    subject: '✅ Payment Confirmed - {{propertyTitle}}',
    description: 'Email sent to customers when payment is confirmed',
    htmlTemplate: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6B7C3C; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6B7C3C; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .label { font-weight: bold; color: #6B7C3C; }
    .value { color: #3a3a3a; }
    .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Payment Confirmed!</h1>
      <p>Your booking is now confirmed</p>
    </div>
    <div class="content">
      <p>Dear {{customerName}},</p>
      
      <div class="success">
        <strong>✓ Payment Successful</strong><br>
        We have received your full payment of <strong>KSh {{totalPaid}}</strong>. Your booking is now <strong>confirmed</strong>!
      </div>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #6B7C3C;">Booking Confirmation</h3>
        <div class="detail-row">
          <span class="label">Property:</span>
          <span class="value">{{propertyTitle}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Check-in:</span>
          <span class="value">{{checkIn}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Check-out:</span>
          <span class="value">{{checkOut}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Guests:</span>
          <span class="value">{{guests}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Total Paid:</span>
          <span class="value" style="color: #6B7C3C; font-weight: bold;">KSh {{totalPaid}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Payment Method:</span>
          <span class="value">{{paymentMethod}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value" style="color: #28a745; font-weight: bold;">✓ CONFIRMED</span>
        </div>
      </div>
      
      <p><strong>What's Next?</strong></p>
      <ul>
        <li>You will receive a reminder 24 hours before check-in</li>
        <li>Please bring a valid ID for verification</li>
        <li>Contact us if you have any special requests</li>
      </ul>
      
      <p>We look forward to welcoming you!</p>
      
      <div class="footer">
        <p>This is an automated email from Skyway Suites</p>
        <p>&copy; {{currentYear}} Skyway Suites. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'payment_admin',
    name: 'Payment Received - Admin',
    subject: '💰 Payment Received - {{customerName}}',
    description: 'Email sent to admin when payment is received',
    htmlTemplate: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3a3a3a; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6B7C3C; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .label { font-weight: bold; color: #6B7C3C; }
    .value { color: #3a3a3a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Payment Received</h1>
    </div>
    <div class="content">
      <p><strong>Full payment received and booking confirmed!</strong></p>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #6B7C3C;">Payment Details</h3>
        <div class="detail-row">
          <span class="label">Customer:</span>
          <span class="value">{{customerName}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Email:</span>
          <span class="value">{{customerEmail}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Amount:</span>
          <span class="value" style="color: #6B7C3C; font-weight: bold;">KSh {{amount}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Method:</span>
          <span class="value">{{paymentMethod}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Total Paid:</span>
          <span class="value">KSh {{totalPaid}}</span>
        </div>
      </div>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #6B7C3C;">Booking Details</h3>
        <div class="detail-row">
          <span class="label">Property:</span>
          <span class="value">{{propertyTitle}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Check-in:</span>
          <span class="value">{{checkIn}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Check-out:</span>
          <span class="value">{{checkOut}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value" style="color: #28a745; font-weight: bold;">✓ CONFIRMED</span>
        </div>
      </div>
      
      <p>Customer has been notified of the confirmation.</p>
    </div>
  </div>
</body>
</html>`
  },
];

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedHtml, setEditedHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedHtml(template.htmlTemplate);
    setShowPreview(false);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}?endpoint=email-templates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedTemplate.id,
          subject: editedSubject,
          htmlTemplate: editedHtml,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Save template error:', errorData);
        throw new Error(errorData.error || 'Failed to save template');
      }

      // Update local state
      setTemplates(prev => prev.map(t => 
        t.id === selectedTemplate.id 
          ? { ...t, subject: editedSubject, htmlTemplate: editedHtml }
          : t
      ));

      toast.success('Email template saved successfully!');
    } catch (error) {
      console.error('Failed to save template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save template';
      toast.error(errorMessage);
      
      // If error mentions table not existing, show helpful message
      if (errorMessage.includes('relation') || errorMessage.includes('email_templates')) {
        toast.error('Email templates table does not exist. Please create it first from Debug Settings page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetTemplate = () => {
    if (!selectedTemplate) return;
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplate.id);
    if (defaultTemplate) {
      setEditedSubject(defaultTemplate.subject);
      setEditedHtml(defaultTemplate.htmlTemplate);
      toast.success('Template reset to default');
    }
  };

  const generatePreviewHtml = () => {
    const sampleData = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+254 712 345 678',
      propertyTitle: 'Luxury Villa in Karen',
      checkIn: '2024-12-20',
      checkOut: '2024-12-25',
      guests: '4',
      totalPrice: '50,000',
      totalPaid: '50,000',
      paymentMethod: 'M-Pesa',
      amount: '50,000',
      currentYear: new Date().getFullYear().toString(),
      companyName: 'Skyway Suites',
      companyEmail: 'info@skywaysuites.co.ke',
      companyPhone: '+254 712 345 678',
      companyWebsite: 'www.skywaysuites.co.ke',
      companyLocation: 'Nairobi, Kenya',
      companyLogo: 'https://skywaysuites.co.ke/logo.png',
    };

    let preview = editedHtml;
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return preview;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Email Templates</h1>
        <p className="text-gray-600">Customize the email templates sent to customers and admins</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Select a template to edit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-[#6B7C3C] bg-[#6B7C3C]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 mt-0.5 text-[#6B7C3C]" />
                    <div>
                      <div className="font-semibold text-sm">{template.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {selectedTemplate && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Available Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-1">Customer Details:</div>
                    <div className="space-y-1 text-xs font-mono">
                      <div>{'{{customerName}}'}</div>
                      <div>{'{{customerEmail}}'}</div>
                      <div>{'{{customerPhone}}'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-1">Booking Details:</div>
                    <div className="space-y-1 text-xs font-mono">
                      <div>{'{{propertyTitle}}'}</div>
                      <div>{'{{checkIn}}'}</div>
                      <div>{'{{checkOut}}'}</div>
                      <div>{'{{guests}}'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-1">Payment Details:</div>
                    <div className="space-y-1 text-xs font-mono">
                      <div>{'{{totalPrice}}'}</div>
                      <div>{'{{totalPaid}}'}</div>
                      <div>{'{{paymentMethod}}'}</div>
                      <div>{'{{amount}}'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-1">Company Details:</div>
                    <div className="space-y-1 text-xs font-mono">
                      <div>{'{{companyName}}'}</div>
                      <div>{'{{companyEmail}}'}</div>
                      <div>{'{{companyPhone}}'}</div>
                      <div>{'{{companyWebsite}}'}</div>
                      <div>{'{{companyLocation}}'}</div>
                      <div>{'{{companyLogo}}'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-1">Other:</div>
                    <div className="space-y-1 text-xs font-mono">
                      <div>{'{{currentYear}}'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Editor */}
        {selectedTemplate && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Edit Template: {selectedTemplate.name}</CardTitle>
                <CardDescription>{selectedTemplate.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Subject</label>
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Email subject line"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">HTML Template</label>
                  <textarea
                    value={editedHtml}
                    onChange={(e) => setEditedHtml(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs"
                    rows={20}
                    placeholder="HTML email template"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveTemplate} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Template'}
                  </Button>
                  <Button onClick={() => setShowPreview(!showPreview)} variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                  <Button onClick={handleResetTemplate} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                </div>

                {showPreview && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Preview (with sample data):</h3>
                    <div className="border rounded-lg p-4 bg-white max-h-96 overflow-auto">
                      <div dangerouslySetInnerHTML={{ __html: generatePreviewHtml() }} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!selectedTemplate && (
          <div className="lg:col-span-2 flex items-center justify-center">
            <Card className="w-full">
              <CardContent className="p-12 text-center text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Select a template from the list to start editing</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}