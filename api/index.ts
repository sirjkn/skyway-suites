import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './config/db.js';
import { hashPassword, verifyPassword, generateToken } from './utils/auth.js';

// Date formatting utilities
function formatDateTimeEmail(date: string | Date): string {
  const d = new Date(date);
  
  // Get day name (Sat)
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  
  // Get month name (Mar)
  const monthName = d.toLocaleDateString('en-US', { month: 'short' });
  
  // Get day (14)
  const day = d.getDate();
  
  // Get year (2026)
  const year = d.getFullYear();
  
  // Get hours and minutes (12:00)
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${dayName} ${monthName} ${day} ${year} ${hours}:${minutes}HRS`;
}

// Helper to get email template from database or use default
async function getEmailTemplate(templateId: string, defaultSubject: string, defaultHtml: string) {
  try {
    const result = await query('SELECT subject, html_template FROM email_templates WHERE id = $1', [templateId]);
    if (result.rows.length > 0) {
      return {
        subject: result.rows[0].subject,
        html: result.rows[0].html_template
      };
    }
  } catch (error) {
    console.log(`Template ${templateId} not found in database, using default`);
  }
  return { subject: defaultSubject, html: defaultHtml };
}

// Helper to replace template variables
function replaceTemplateVars(template: string, vars: Record<string, string>) {
  let result = template;
  Object.entries(vars).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || 'N/A');
  });
  return result;
}

// Company details for email templates
function getCompanyDetails() {
  return {
    companyName: 'Skyway Suites',
    companyEmail: 'info@skywaysuites.co.ke',
    companyPhone: '+254 712 345 678',
    companyWebsite: 'www.skywaysuites.co.ke',
    companyLocation: 'Nairobi, Kenya',
    companyLogo: 'https://skywaysuites.co.ke/logo.png'
  };
}

// Helper to transform database row to API format for properties
function transformProperty(row: any) {
  return {
    id: String(row.id), // Convert to string for consistency with frontend
    title: row.title,
    description: row.description,
    price: parseFloat(row.price),
    location: row.location,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    guests: row.guests,
    category: row.category,
    image: row.image,
    photos: row.photos || [],
    categorizedPhotos: row.categorized_photos || {},
    amenities: row.amenities || [],
    available: row.available,
    averageRating: row.average_rating ? parseFloat(row.average_rating) : 0,
    reviewCount: row.review_count || 0,
    icalUrl: row.ical_export_url,
    airbnbCalendarUrl: row.airbnb_import_url,
    calendarSyncEnabled: row.calendar_sync_enabled,
    lastCalendarSync: row.last_calendar_sync,
    videoUrl1: row.video_url1 || '',
    videoUrl2: row.video_url2 || '',
    createdAt: row.created_at
  };
}

// Helper to transform database row to API format for bookings
function transformBooking(row: any) {
  return {
    id: String(row.id),
    propertyId: String(row.property_id),
    customerId: String(row.customer_id),
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    totalPrice: parseFloat(row.total_price),
    amountPaid: row.amount_paid ? parseFloat(row.amount_paid) : 0,
    status: row.status,
    approved: row.approved || false,
    createdAt: row.created_at
  };
}

// Helper to transform database row to API format for payments
function transformPayment(row: any) {
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    customerId: String(row.customer_id),
    amount: parseFloat(row.amount),
    status: row.status,
    paymentMethod: row.payment_method,
    createdAt: row.created_at
  };
}

// Unified API handler - routes all requests
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { endpoint, action, id } = req.query;

    // ============================================
    // HEALTH CHECK ENDPOINTS
    // ============================================
    if (endpoint === 'health' || !endpoint) {
      try {
        // Actually test the database connection
        const result = await query('SELECT NOW() as current_time');
        const dbTime = result.rows[0]?.current_time;
        
        return res.status(200).json({ 
          status: 'ok', 
          database: 'connected',
          message: 'Skyway Suites API is running',
          timestamp: new Date().toISOString(),
          dbTimestamp: dbTime
        });
      } catch (dbError) {
        console.error('❌ Database health check failed:', dbError);
        return res.status(503).json({ 
          status: 'error',
          database: 'disconnected', 
          message: 'Database connection failed',
          error: dbError instanceof Error ? dbError.message : String(dbError),
          timestamp: new Date().toISOString() 
        });
      }
    }

    // ============================================
    // AUTHENTICATION ENDPOINTS
    // ============================================
    if (endpoint === 'auth') {
      if (action === 'login' && req.method === 'POST') {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        const validPassword = await verifyPassword(password, user.password_hash);
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateToken(user.id);
        return res.status(200).json({
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          token
        });
      }

      if (action === 'signup' && req.method === 'POST') {
        const { email, password, name, phone } = req.body;
        if (!email || !password || !name || !phone) {
          return res.status(400).json({ error: 'Email, password, name, and phone are required' });
        }
        const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await hashPassword(password);
        const result = await query(
          'INSERT INTO users (email, password_hash, name, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
          [email, hashedPassword, name, phone, 'customer']
        );
        const user = result.rows[0];
        
        // 📧 SEND WELCOME EMAIL
        try {
          console.log('📧 Sending welcome email to new user:', email);
          
          // Get SMTP settings from notifications category
          const settingsResult = await query("SELECT key, value FROM settings WHERE category = 'notifications'");
          
          const settings: any = {};
          settingsResult.rows.forEach((row: any) => {
            // Convert snake_case to camelCase for JavaScript
            const camelKey = row.key.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
            settings[camelKey] = row.value;
          });
          
          console.log('📧 SMTP Settings loaded:', {
            hasSmtpHost: !!settings.smtpHost,
            hasSmtpUsername: !!settings.smtpUsername,
            hasSmtpPassword: !!settings.smtpPassword,
            smtpHost: settings.smtpHost,
            smtpUsername: settings.smtpUsername
          });
          
          if (settings.smtpHost && settings.smtpUsername) {
            const nodemailer = await import('nodemailer');
            
            const port = parseInt(settings.smtpPort || '587');
            const useSSL = settings.smtpSecure === 'true';
            
            const transporter = nodemailer.default.createTransport({
              host: settings.smtpHost || 'raptor.vivawebhost.com',
              port: port,
              secure: useSSL,
              auth: {
                user: settings.smtpUsername || 'info@skywaysuites.co.ke',
                pass: settings.smtpPassword || '',
              },
              connectionTimeout: 10000,
              tls: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2'
              }
            });
            
            await transporter.sendMail({
              from: `${settings.emailFromName || 'Skyway Suites'} <${settings.emailFromAddress || 'info@skywaysuites.co.ke'}>`,
              to: email,
              subject: '🎉 Welcome to Skyway Suites!',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #6B7C3C; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                    .welcome-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6B7C3C; }
                    .button { display: inline-block; background: #6B7C3C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1 style="font-size: 48px; margin: 0;">🎉 Welcome to Skyway Suites!</h1>
                      <p>Your account has been created successfully</p>
                    </div>
                    <div class="content">
                      <p>Dear ${name},</p>
                      <p>Thank you for creating an account with <strong>Skyway Suites</strong>! We're excited to have you join our community.</p>
                      
                      <div class="welcome-box">
                        <h3 style="margin-top: 0; color: #6B7C3C;">Account Details</h3>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Phone:</strong> ${phone}</p>
                      </div>
                      
                      <p>You can now:</p>
                      <ul>
                        <li>Browse our exclusive properties</li>
                        <li>Make bookings instantly</li>
                        <li>Manage your reservations</li>
                        <li>Receive special offers and updates</li>
                      </ul>
                      
                      <p>If you have any questions or need assistance, feel free to contact us anytime.</p>
                      
                      <div class="footer">
                        <p>This is an automated email from Skyway Suites</p>
                        <p>&copy; ${new Date().getFullYear()} Skyway Suites. All rights reserved.</p>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
              `
            });
            
            console.log('✅ Welcome email sent successfully to:', email);
          } else {
            console.log('⚠️ SMTP not configured - skipping welcome email');
          }
        } catch (emailError) {
          console.error('❌ Welcome email error:', emailError);
          console.error('❌ Full error details:', emailError instanceof Error ? emailError.stack : emailError);
          // Don't fail signup if email fails
        }
        
        const token = generateToken(user.id);
        return res.status(200).json({ user, token });
      }
    }

    // ============================================
    // EMAIL DIAGNOSTICS ENDPOINT
    // ============================================
    if (endpoint === 'email-diagnostics' && req.method === 'GET') {
      try {
        // Check SMTP settings
        const settingsResult = await query("SELECT key, value FROM settings WHERE category = 'notifications'");
        
        const settings: any = {};
        settingsResult.rows.forEach((row: any) => {
          // Convert snake_case to camelCase for JavaScript
          const camelKey = row.key.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
          settings[camelKey] = row.value;
        });
        
        console.log('📧 Diagnostics - Settings loaded from DB:', settings);
        
        // Count customers with emails
        const customersResult = await query('SELECT COUNT(*) as count FROM users WHERE role = $1 AND email IS NOT NULL', ['customer']);
        const customersWithEmail = customersResult.rows[0]?.count || 0;
        
        // Get sample customer
        const sampleCustomerResult = await query('SELECT id, name, email FROM users WHERE role = $1 AND email IS NOT NULL LIMIT 1', ['customer']);
        const sampleCustomer = sampleCustomerResult.rows[0] || null;
        
        return res.status(200).json({
          smtpConfigured: !!settings.smtpHost && !!settings.smtpUsername,
          settings: {
            smtpHost: settings.smtpHost || '(not set)',
            smtpPort: settings.smtpPort || '(not set)',
            smtpUsername: settings.smtpUsername || '(not set)',
            hasPassword: !!settings.smtpPassword,
            smtpSecure: settings.smtpSecure || '(not set)',
            emailFromAddress: settings.emailFromAddress || '(not set)',
            emailFromName: settings.emailFromName || '(not set)',
          },
          database: {
            customersWithEmail: parseInt(customersWithEmail),
            sampleCustomer: sampleCustomer ? {
              id: sampleCustomer.id,
              name: sampleCustomer.name,
              email: sampleCustomer.email
            } : null
          }
        });
      } catch (error) {
        console.error('❌ Email diagnostics error:', error);
        return res.status(500).json({ 
          error: 'Diagnostics failed', 
          details: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // ============================================
    // DEBUG: RAW SETTINGS ENDPOINT
    // ============================================
    if (endpoint === 'debug-settings' && req.method === 'GET') {
      try {
        const allSettings = await query("SELECT * FROM settings WHERE category = 'notifications' ORDER BY key");
        return res.status(200).json({
          count: allSettings.rows.length,
          settings: allSettings.rows
        });
      } catch (error) {
        console.error('❌ Debug settings error:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch settings', 
          details: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // ============================================
    // TEST EMAIL ENDPOINT
    // ============================================
    if (endpoint === 'test-email' && req.method === 'POST') {
      const { 
        testEmail, 
        smtpHost, 
        smtpPort, 
        smtpUsername, 
        smtpPassword, 
        smtpSecure,
        emailFromAddress,
        emailFromName
      } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ error: 'Test email address is required' });
      }
      
      try {
        // Import nodemailer dynamically
        const nodemailer = await import('nodemailer');
        
        const port = parseInt(smtpPort || '587');
        const useSSL = smtpSecure === true || smtpSecure === 'true';
        
        console.log('📧 Testing SMTP Configuration:', {
          host: smtpHost,
          port,
          secure: useSSL,
          user: smtpUsername
        });
        
        // Create transporter with enhanced settings and timeout
        const transporter = nodemailer.default.createTransport({
          host: smtpHost || 'raptor.vivawebhost.com',
          port: port,
          secure: useSSL, // true for 465 (SSL/TLS), false for 587 (STARTTLS)
          auth: {
            user: smtpUsername || 'info@skywaysuites.co.ke',
            pass: smtpPassword || '',
          },
          // Add connection timeout settings
          connectionTimeout: 10000, // 10 seconds
          greetingTimeout: 10000,
          socketTimeout: 10000,
          // Additional settings for better compatibility
          tls: {
            rejectUnauthorized: false, // Accept self-signed certificates
            minVersion: 'TLSv1.2'
          },
          // Enable debug for troubleshooting
          debug: true,
          logger: true
        });
        
        // Verify connection first
        console.log('🔌 Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified!');
        
        // Send test email
        console.log('📨 Sending test email to:', testEmail);
        const info = await transporter.sendMail({
          from: `${emailFromName || 'Skyway Suites'} <${emailFromAddress || 'info@skywaysuites.co.ke'}>`,
          to: testEmail,
          subject: '✓ SMTP Test Email - Skyway Suites',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #6B7C3C; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .info { background: #fff; border-left: 4px solid #6B7C3C; padding: 15px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✓ SMTP Test Successful</h1>
                </div>
                <div class="content">
                  <div class="success">
                    <strong>✓ Congratulations!</strong><br>
                    Your SMTP configuration is working correctly. This test email was sent successfully.
                  </div>
                  
                  <div class="info">
                    <h3>SMTP Configuration Details:</h3>
                    <p><strong>Server:</strong> ${smtpHost || 'mail.skywaysuites.co.ke'}</p>
                    <p><strong>Port:</strong> ${port}</p>
                    <p><strong>Security:</strong> ${useSSL ? 'SSL/TLS (Port 465)' : 'STARTTLS (Port 587)'}</p>
                    <p><strong>From:</strong> ${emailFromName || 'Skyway Suites'} &lt;${emailFromAddress || 'info@skywaysuites.co.ke'}&gt;</p>
                    <p><strong>Test sent to:</strong> ${testEmail}</p>
                  </div>
                  
                  <p>You can now use this SMTP configuration to send automated emails for:</p>
                  <ul>
                    <li>Account creation notifications</li>
                    <li>Booking confirmations</li>
                    <li>Payment receipts</li>
                    <li>Booking reminders</li>
                  </ul>
                  
                  <div class="footer">
                    <p>This is an automated test email from Skyway Suites Admin Panel</p>
                    <p>&copy; ${new Date().getFullYear()} Skyway Suites. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
SMTP Test Email - Skyway Suites

✓ Congratulations! Your SMTP configuration is working correctly.

SMTP Configuration Details:
- Server: ${smtpHost || 'mail.skywaysuites.co.ke'}
- Port: ${port}
- Security: ${useSSL ? 'SSL/TLS (Port 465)' : 'STARTTLS (Port 587)'}
- From: ${emailFromName || 'Skyway Suites'} <${emailFromAddress || 'info@skywaysuites.co.ke'}>
- Test sent to: ${testEmail}

You can now use this SMTP configuration for automated notifications.

© ${new Date().getFullYear()} Skyway Suites. All rights reserved.
          `,
        });
        
        console.log('✅ Test email sent successfully! Message ID:', info.messageId);
        
        return res.status(200).json({ 
          success: true, 
          message: 'Test email sent successfully!',
          messageId: info.messageId,
          config: {
            host: smtpHost,
            port,
            secure: useSSL
          }
        });
      } catch (error: any) {
        console.error('❌ Failed to send test email:', error);
        
        // Provide detailed error messages
        let errorMessage = 'Failed to send test email';
        let suggestion = '';
        
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
          errorMessage = 'Connection timeout - Could not reach SMTP server';
          suggestion = 'Try using port 587 with STARTTLS instead of port 465. Many hosting providers (including Vercel) block port 465.';
        } else if (error.code === 'EAUTH') {
          errorMessage = 'Authentication failed';
          suggestion = 'Please check your SMTP username and password are correct.';
        } else if (error.code === 'EENVELOPE') {
          errorMessage = 'Invalid email address';
          suggestion = 'Please check the from/to email addresses are valid.';
        } else if (error.responseCode === 535) {
          errorMessage = 'Authentication failed - Invalid credentials';
          suggestion = 'Your username or password is incorrect.';
        }
        
        return res.status(500).json({ 
          error: errorMessage,
          details: error.message,
          suggestion,
          code: error.code,
          command: error.command
        });
      }
    }

    // ============================================
    // DATABASE MIGRATION ENDPOINT
    // ============================================
    if (endpoint === 'migrate') {
      try {
        console.log('🔄 Starting database migration...');
        
        // Add categorized_photos column if it doesn't exist
        await query(`
          ALTER TABLE properties 
          ADD COLUMN IF NOT EXISTS categorized_photos JSONB DEFAULT '{}'::jsonb
        `);
        
        // Add video URL columns if they don't exist
        await query(`
          ALTER TABLE properties 
          ADD COLUMN IF NOT EXISTS video_url1 TEXT DEFAULT '',
          ADD COLUMN IF NOT EXISTS video_url2 TEXT DEFAULT ''
        `);
        
        // Add approved column to bookings table if it doesn't exist
        await query(`
          ALTER TABLE bookings 
          ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE
        `);
        
        console.log('✅ Migration completed successfully');
        
        return res.status(200).json({ 
          success: true, 
          message: 'Migration completed successfully. Video URL columns, approved column, and categorized_photos column have been added.' 
        });
      } catch (error) {
        console.error('❌ Migration failed:', error);
        return res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // ============================================
    // PROPERTIES ENDPOINTS
    // ============================================
    if (endpoint === 'properties') {
      // Item operations
      if (id && typeof id === 'string') {
        if (req.method === 'GET') {
          // GET single property by ID
          try {
            console.log('🔍 GET /api/properties - Fetching property with ID:', id);
            
            // Validate UUID format (basic check)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
              console.error('❌ Invalid UUID format:', id);
              return res.status(400).json({ error: 'Invalid property ID format' });
            }
            
            const result = await query('SELECT * FROM properties WHERE id = $1', [id]);
            console.log('📊 Query result:', { rowCount: result.rows.length });
            
            if (result.rows.length === 0) {
              console.log('❌ Property not found for ID:', id);
              return res.status(404).json({ error: 'Property not found' });
            }
            
            const property = transformProperty(result.rows[0]);
            console.log('✅ Property found:', property.title);
            return res.status(200).json(property);
          } catch (error) {
            console.error('❌ Error fetching property:', error);
            return res.status(500).json({ 
              error: 'Failed to fetch property',
              details: error instanceof Error ? error.message : String(error)
            });
          }
        }
        
        if (req.method === 'PUT') {
          // Support partial updates - only update fields that are provided
          const updates: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;
          
          const fields = req.body;
          
          // Build dynamic UPDATE query based on provided fields
          if (fields.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(fields.title);
          }
          if (fields.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(fields.description);
          }
          if (fields.price !== undefined) {
            updates.push(`price = $${paramIndex++}`);
            values.push(fields.price);
          }
          if (fields.location !== undefined) {
            updates.push(`location = $${paramIndex++}`);
            values.push(fields.location);
          }
          if (fields.bedrooms !== undefined) {
            updates.push(`bedrooms = $${paramIndex++}`);
            values.push(fields.bedrooms);
          }
          if (fields.bathrooms !== undefined) {
            updates.push(`bathrooms = $${paramIndex++}`);
            values.push(fields.bathrooms);
          }
          if (fields.guests !== undefined) {
            updates.push(`guests = $${paramIndex++}`);
            values.push(fields.guests);
          }
          if (fields.category !== undefined) {
            updates.push(`category = $${paramIndex++}`);
            values.push(fields.category);
          }
          if (fields.image !== undefined) {
            updates.push(`image = $${paramIndex++}`);
            values.push(fields.image);
          }
          if (fields.photos !== undefined) {
            updates.push(`photos = $${paramIndex++}`);
            values.push(fields.photos);
          }
          if (fields.categorized_photos !== undefined) {
            updates.push(`categorized_photos = $${paramIndex++}`);
            values.push(fields.categorized_photos);
          }
          if (fields.amenities !== undefined) {
            updates.push(`amenities = $${paramIndex++}`);
            values.push(fields.amenities);
          }
          if (fields.available !== undefined) {
            updates.push(`available = $${paramIndex++}`);
            values.push(fields.available);
          }
          if (fields.ical_export_url !== undefined) {
            updates.push(`ical_export_url = $${paramIndex++}`);
            values.push(fields.ical_export_url);
          }
          if (fields.airbnb_import_url !== undefined) {
            updates.push(`airbnb_import_url = $${paramIndex++}`);
            values.push(fields.airbnb_import_url);
          }
          if (fields.calendar_sync_enabled !== undefined) {
            updates.push(`calendar_sync_enabled = $${paramIndex++}`);
            values.push(fields.calendar_sync_enabled);
          }
          if (fields.video_url1 !== undefined) {
            updates.push(`video_url1 = $${paramIndex++}`);
            values.push(fields.video_url1);
          }
          if (fields.video_url2 !== undefined) {
            updates.push(`video_url2 = $${paramIndex++}`);
            values.push(fields.video_url2);
          }
          
          if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
          }
          
          // Add id as the last parameter
          values.push(id);
          
          const result = await query(
            `UPDATE properties SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
          );
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
          }
          return res.status(200).json(transformProperty(result.rows[0]));
        }

        if (req.method === 'DELETE') {
          await query('DELETE FROM properties WHERE id = $1', [id]);
          return res.status(200).json({ message: 'Property deleted successfully' });
        }
      }

      // Collection operations
      if (req.method === 'GET') {
        const result = await query('SELECT * FROM properties WHERE available = true ORDER BY created_at DESC');
        return res.status(200).json(result.rows.map(transformProperty));
      }

      if (req.method === 'POST') {
        const { title, description, price, location, bedrooms, bathrooms, guests, category, image, photos, categorized_photos, amenities,
          ical_export_url, airbnb_import_url, calendar_sync_enabled, video_url1, video_url2 } = req.body;
        const result = await query(
          `INSERT INTO properties 
           (title, description, price, location, bedrooms, bathrooms, guests, category, image, photos, categorized_photos, amenities,
            ical_export_url, airbnb_import_url, calendar_sync_enabled, video_url1, video_url2) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
          [title, description, price, location, bedrooms, bathrooms, guests, category, image, photos, categorized_photos, amenities,
           ical_export_url, airbnb_import_url, calendar_sync_enabled, video_url1 || '', video_url2 || '']
        );
        return res.status(200).json(transformProperty(result.rows[0]));
      }
    }

    // ============================================
    // BOOKINGS ENDPOINTS
    // ============================================
    if (endpoint === 'bookings') {
      if (id && typeof id === 'string') {
        if (req.method === 'PUT') {
          const { status } = req.body;
          const result = await query(
            'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
          }
          return res.status(200).json(transformBooking(result.rows[0]));
        }
        if (req.method === 'DELETE') {
          await query('DELETE FROM bookings WHERE id = $1', [id]);
          return res.status(200).json({ message: 'Booking deleted' });
        }
        
        // Handle booking approval (action=approve)
        if (req.method === 'POST' && action === 'approve') {
          console.log('📋 Approving booking:', id);
          
          // Update booking to approved
          const result = await query(
            'UPDATE bookings SET approved = TRUE WHERE id = $1 RETURNING *',
            [id]
          );
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
          }
          
          const booking = transformBooking(result.rows[0]);
          
          // Send email to customer with payment instructions
          try {
            // Get customer details
            const customerResult = await query('SELECT name, email FROM users WHERE id = $1', [booking.customerId]);
            const customer = customerResult.rows[0];
            
            // Get property details
            const propertyResult = await query('SELECT title FROM properties WHERE id = $1', [booking.propertyId]);
            const property = propertyResult.rows[0];
            
            // Get notification settings
            const settingsResult = await query('SELECT key, value FROM settings WHERE key IN ($1, $2, $3, $4, $5, $6, $7)', [
              'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_secure', 'email_from_address', 'email_from_name'
            ]);
            
            const settings: any = {};
            settingsResult.rows.forEach((row: any) => {
              const camelKey = row.key.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
              settings[camelKey] = row.value;
            });
            
            if (settings.smtpHost && customer?.email) {
              const nodemailer = await import('nodemailer');
              
              const port = parseInt(settings.smtpPort || '587');
              const useSSL = settings.smtpSecure === 'true';
              
              const transporter = nodemailer.default.createTransporter({
                host: settings.smtpHost,
                port: port,
                secure: useSSL,
                auth: {
                  user: settings.smtpUsername,
                  pass: settings.smtpPassword,
                },
              });
              
              const company = getCompanyDetails();
              const appUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
              const paymentUrl = `${appUrl}/customer-profile?tab=bookings&bookingId=${booking.id}`;
              
              const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #6B7C3C; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 30px; }
    .button { display: inline-block; padding: 12px 30px; margin: 10px; background-color: #6B7C3C; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .button.mpesa { background-color: #00A86B; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Booking Approved!</h1>
    </div>
    <div class="content">
      <p>Dear ${customer.name},</p>
      
      <p>Great news! Your booking has been approved by our admin team.</p>
      
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Property:</strong> ${property.title}</li>
        <li><strong>Check-in:</strong> ${formatDateTimeEmail(booking.checkIn)}</li>
        <li><strong>Check-out:</strong> ${formatDateTimeEmail(booking.checkOut)}</li>
        <li><strong>Guests:</strong> ${booking.guests}</li>
        <li><strong>Total Amount:</strong> KES ${booking.totalPrice.toLocaleString()}</li>
      </ul>
      
      <h3>Next Step: Complete Payment</h3>
      <p>To confirm your booking, please complete the payment using one of the following methods:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${paymentUrl}" class="button">💳 Pay with Card</a>
        <a href="${paymentUrl}" class="button mpesa">📱 Pay with Mpesa</a>
      </div>
      
      <p><strong>Important:</strong> Your booking will be confirmed once payment is received.</p>
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>
      ${company.companyName} Team</p>
    </div>
    <div class="footer">
      <p>${company.companyName}<br>
      ${company.companyEmail} | ${company.companyPhone}<br>
      ${company.companyLocation}</p>
    </div>
  </div>
</body>
</html>
              `;
              
              await transporter.sendMail({
                from: `"${settings.emailFromName || company.companyName}" <${settings.emailFromAddress}>`,
                to: customer.email,
                subject: `Booking Approved - Complete Payment for ${property.title}`,
                html: emailHtml,
              });
              
              console.log('✅ Approval email sent to customer');
            }
          } catch (emailError) {
            console.error('❌ Failed to send approval email:', emailError);
            // Don't fail the request if email fails
          }
          
          return res.status(200).json(booking);
        }
      }

      if (req.method === 'GET') {
        const result = await query('SELECT * FROM bookings ORDER BY created_at DESC');
        return res.status(200).json(result.rows.map(transformBooking));
      }

      if (req.method === 'POST') {
        const { propertyId, customerId, checkIn, checkOut, guests, totalPrice } = req.body;
        
        // Create the booking
        const result = await query(
          'INSERT INTO bookings (property_id, customer_id, check_in, check_out, guests, total_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [propertyId, customerId, checkIn, checkOut, guests, totalPrice]
        );
        
        const booking = transformBooking(result.rows[0]);
        
        console.log('✅ Booking created successfully:', booking.id);
        
        // 📧 SEND EMAIL NOTIFICATION
        let emailStatus = { sent: false, error: null };
        try {
          console.log('📧 Starting email notification process...');
          
          // Get customer details
          console.log('🔍 Fetching customer details for ID:', customerId);
          const customerResult = await query('SELECT name, email, phone FROM users WHERE id = $1', [customerId]);
          const customer = customerResult.rows[0];
          console.log('✅ Customer found:', { name: customer?.name, email: customer?.email, hasPhone: !!customer?.phone });
          
          // Get property details
          console.log('🔍 Fetching property details for ID:', propertyId);
          const propertyResult = await query('SELECT title, location FROM properties WHERE id = $1', [propertyId]);
          const property = propertyResult.rows[0];
          console.log('✅ Property found:', { title: property?.title, location: property?.location });
          
          // Get notification settings
          console.log('🔍 Fetching SMTP settings from database...');
          const settingsResult = await query('SELECT key, value FROM settings WHERE key IN ($1, $2, $3, $4, $5, $6, $7, $8)', [
            'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_secure', 'email_from_address', 'email_from_name', 'admin_notification_email'
          ]);
          
          const settings: any = {};
          settingsResult.rows.forEach((row: any) => {
            // Convert snake_case to camelCase for JavaScript
            const camelKey = row.key.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
            settings[camelKey] = row.value;
          });
          
          console.log('📋 SMTP Settings loaded:', {
            smtpHost: settings.smtpHost,
            smtpPort: settings.smtpPort,
            smtpUsername: settings.smtpUsername,
            smtpSecure: settings.smtpSecure,
            hasPassword: !!settings.smtpPassword,
            emailFromAddress: settings.emailFromAddress,
            emailFromName: settings.emailFromName,
            adminNotificationEmail: settings.adminNotificationEmail
          });
          
          // Only send if SMTP is configured
          if (!settings.smtpHost) {
            console.log('⚠️ SMTP Host not configured - skipping email');
            emailStatus.error = 'SMTP not configured';
          } else if (!settings.smtpUsername) {
            console.log('⚠️ SMTP Username not configured - skipping email');
            emailStatus.error = 'SMTP username missing';
          } else if (!customer?.email) {
            console.log('⚠️ Customer email not found - skipping email');
            emailStatus.error = 'Customer email missing';
          } else {
            console.log('✅ All email prerequisites met - proceeding to send emails');
            
            const nodemailer = await import('nodemailer');
            
            const port = parseInt(settings.smtpPort || '587');
            const useSSL = settings.smtpSecure === 'true';
            
            console.log('📧 Creating email transporter with config:', {
              host: settings.smtpHost,
              port: port,
              secure: useSSL,
              user: settings.smtpUsername
            });
            
            const transporter = nodemailer.default.createTransport({
              host: settings.smtpHost || 'raptor.vivawebhost.com',
              port: port,
              secure: useSSL,
              auth: {
                user: settings.smtpUsername || 'info@skywaysuites.co.ke',
                pass: settings.smtpPassword || '',
              },
              connectionTimeout: 10000,
              tls: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2'
              }
            });
            
            // Send customer email
            console.log('📤 Sending customer email to:', customer.email);
            const customerEmailInfo = await transporter.sendMail({
              from: `${settings.emailFromName || 'Skyway Suites'} <${settings.emailFromAddress || 'info@skywaysuites.co.ke'}>`,
              to: customer.email,
              subject: `New Booking Created - ${property?.title || 'Property'}`,
              html: `
                <!DOCTYPE html>
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
                      <h1 style="margin: 0; font-size: 20px;">Booking Created</h1>
                      <p>Thank you for choosing Skyway Suites</p>
                    </div>
                    <div class="content">
                      <p>Dear ${customer?.name || 'Customer'},</p>
                      <p>Your booking has been successfully created. Here are the details:</p>
                      
                      <div class="booking-details">
                        <h3 style="margin-top: 0; color: #6B7C3C;">Booking Details</h3>
                        <div class="detail-row">
                          <span class="label">Property:</span>
                          <span class="value">${property?.title || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                          <span class="label">Check-in:</span>
                          <span class="value">${formatDateTimeEmail(checkIn)}</span>
                        </div>
                        <div class="detail-row">
                          <span class="label">Check-out:</span>
                          <span class="value">${formatDateTimeEmail(checkOut)}</span>
                        </div>
                        <div class="detail-row">
                          <span class="label">Guests:</span>
                          <span class="value">${guests}</span>
                        </div>
                        <div class="detail-row">
                          <span class="label">Total Price:</span>
                          <span class="value">KSh ${totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div class="warning">
                        <strong>Payment Required</strong><br>
                        Your booking is currently <strong>pending</strong>. Please complete your payment to confirm this booking.
                      </div>
                      
                      <p>If you have any questions, please don't hesitate to contact us.</p>
                      
                      <div class="footer">
                        <p>This is an automated email from Skyway Suites</p>
                        <p>&copy; ${new Date().getFullYear()} Skyway Suites. All rights reserved.</p>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
              `
            });
            console.log('✅ Customer email sent successfully! Message ID:', customerEmailInfo.messageId);
            
            // Send admin notification email
            const bookingId = booking.id;
            const adminEmail = settings.adminNotificationEmail || settings.emailFromAddress || 'info@skywaysuites.co.ke';
            console.log('📤 Sending admin notification to:', adminEmail);
            
            const adminEmailInfo = await transporter.sendMail({
              from: `${settings.emailFromName || 'Skyway Suites'} <${settings.emailFromAddress || 'info@skywaysuites.co.ke'}>`,
              to: adminEmail,
              subject: `New Booking Made - Approval Required`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #6B7C3C; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 40px 30px; border-radius: 0 0 8px 8px; text-align: center; }
                    .alert-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; border: 3px solid #ffc107; }
                    .action-button { display: inline-block; background: #6B7C3C; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; font-size: 16px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1 style="margin: 0; font-size: 20px;">New Booking Alert</h1>
                    </div>
                    <div class="content">
                      <div class="alert-box">
                        <h2 style="color: #6B7C3C; margin-top: 0;">A Customer Has Made a Booking</h2>
                        <p style="font-size: 18px; line-height: 1.8; margin: 20px 0;">
                          <strong>Action Required:</strong><br>
                          Please log in to your admin dashboard to review the booking details, 
                          verify the payment, and approve the booking.
                        </p>
                        <a href="${req.headers.origin || 'https://skyway-suites.vercel.app'}/admin/bookings" class="action-button">
                          Go to Dashboard & Approve
                        </a>
                      </div>
                      <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        This booking is currently pending and waiting for your approval.
                      </p>
                      <div class="footer">
                        <p>This is an automated notification from Skyway Suites</p>
                        <p>&copy; ${new Date().getFullYear()} Skyway Suites. All rights reserved.</p>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
              `
            });
            console.log('✅ Admin notification email sent successfully! Message ID:', adminEmailInfo.messageId);
            
            emailStatus.sent = true;
            console.log('🎉 All booking notification emails sent successfully!');
          }
        } catch (emailError) {
          console.error('❌ BOOKING EMAIL ERROR:', emailError);
          console.error('Error details:', {
            message: emailError instanceof Error ? emailError.message : 'Unknown error',
            code: (emailError as any).code,
            command: (emailError as any).command
          });
          // Don't fail the booking if email fails
          emailStatus.error = emailError instanceof Error ? emailError.message : 'Unknown error';
        }
        
        if (!emailStatus.sent && emailStatus.error) {
          console.log('⚠️ Email not sent. Reason:', emailStatus.error);
        }
        
        return res.status(200).json({ booking, emailStatus });
      }
    }

    // ============================================
    // CUSTOMERS ENDPOINTS
    // ============================================
    if (endpoint === 'customers') {
      if (id && typeof id === 'string') {
        if (req.method === 'PUT') {
          const { name, email, phone } = req.body;
          const result = await query(
            'UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 AND role = $5 RETURNING id, name, email, phone, created_at',
            [name, email, phone, id, 'customer']
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
          }
          return res.status(200).json(result.rows[0]);
        }
        if (req.method === 'DELETE') {
          await query('DELETE FROM users WHERE id = $1 AND role = $2', [id, 'customer']);
          return res.status(200).json({ message: 'Customer deleted' });
        }
      }

      if (req.method === 'GET') {
        const result = await query('SELECT id, name, email, phone, created_at FROM users WHERE role = $1 AND name IS NOT NULL AND email IS NOT NULL ORDER BY created_at DESC', ['customer']);
        return res.status(200).json(result.rows);
      }

      if (req.method === 'POST') {
        const { name, email, phone, password } = req.body;
        const hashedPassword = password ? await hashPassword(password) : await hashPassword('temppassword123');
        const result = await query(
          'INSERT INTO users (name, email, phone, role, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, created_at',
          [name, email, phone, 'customer', hashedPassword]
        );
        return res.status(200).json(result.rows[0]);
      }
    }

    // ============================================
    // PAYMENTS ENDPOINTS
    // ============================================
    if (endpoint === 'payments') {
      if (id && typeof id === 'string') {
        if (req.method === 'PUT') {
          const { status } = req.body;
          const result = await query(
            'UPDATE payments SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
          }
          return res.status(200).json(transformPayment(result.rows[0]));
        }
        if (req.method === 'DELETE') {
          await query('DELETE FROM payments WHERE id = $1', [id]);
          return res.status(200).json({ message: 'Payment deleted' });
        }
      }

      if (req.method === 'GET') {
        const result = await query('SELECT * FROM payments ORDER BY created_at DESC');
        return res.status(200).json(result.rows.map(transformPayment));
      }

      if (req.method === 'POST') {
        const { bookingId, customerId, amount, paymentMethod, status } = req.body;
        const paymentStatus = status || 'pending'; // Use provided status or default to 'pending'
        const result = await query(
          'INSERT INTO payments (booking_id, customer_id, amount, payment_method, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [bookingId, customerId, amount, paymentMethod, paymentStatus]
        );
        
        console.log('✅ Payment created:', result.rows[0]);
        const transformedPayment = transformPayment(result.rows[0]);
        console.log('✅ Transformed payment:', transformedPayment);
        
        // 🎯 AUTO-UPDATE BOOKING STATUS WHEN FULLY PAID
        // Get the booking details
        const bookingResult = await query(
          'SELECT id, total_price, property_id, customer_id, check_in, check_out, guests FROM bookings WHERE id = $1',
          [bookingId]
        );
        
        if (bookingResult.rows.length > 0) {
          const booking = bookingResult.rows[0];
          const bookingTotalPrice = parseFloat(booking.total_price);
          
          // Calculate total payments for this booking
          const paymentsResult = await query(
            'SELECT SUM(amount) as total_paid FROM payments WHERE booking_id = $1 AND status = $2',
            [bookingId, 'paid']
          );
          
          const totalPaid = parseFloat(paymentsResult.rows[0]?.total_paid || 0);
          
          console.log('💰 Payment Check:', {
            bookingId,
            totalPrice: bookingTotalPrice,
            totalPaid,
            fullyPaid: totalPaid >= bookingTotalPrice
          });
          
          // If fully paid, update booking status to 'confirmed'
          if (totalPaid >= bookingTotalPrice) {
            await query(
              'UPDATE bookings SET status = $1 WHERE id = $2',
              ['confirmed', bookingId]
            );
            console.log('✅ Booking status updated to CONFIRMED');
            
            // 📧 SEND PAYMENT CONFIRMATION EMAIL
            try {
              console.log('📧 Sending payment confirmation email...');
              
              // Get customer details
              const customerResult = await query('SELECT name, email, phone FROM users WHERE id = $1', [customerId]);
              const customer = customerResult.rows[0];
              
              // Get property details
              const propertyResult = await query('SELECT title FROM properties WHERE id = $1', [booking.property_id]);
              const property = propertyResult.rows[0];
              
              // Get SMTP settings
              const settingsResult = await query("SELECT key, value FROM settings WHERE category = 'notifications'");
              
              const settings: any = {};
              settingsResult.rows.forEach((row: any) => {
                // Convert snake_case to camelCase for JavaScript
                const camelKey = row.key.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
                settings[camelKey] = row.value;
              });
              
              if (settings.smtpHost && settings.smtpUsername && customer?.email) {
                const nodemailer = await import('nodemailer');
                
                const port = parseInt(settings.smtpPort || '587');
                const useSSL = settings.smtpSecure === 'true';
                
                const transporter = nodemailer.default.createTransport({
                  host: settings.smtpHost || 'raptor.vivawebhost.com',
                  port: port,
                  secure: useSSL,
                  auth: {
                    user: settings.smtpUsername || 'info@skywaysuites.co.ke',
                    pass: settings.smtpPassword || '',
                  },
                  connectionTimeout: 10000,
                  tls: {
                    rejectUnauthorized: false,
                    minVersion: 'TLSv1.2'
                  }
                });
                
                // Send customer confirmation email
                await transporter.sendMail({
                  from: `${settings.emailFromName || 'Skyway Suites'} <${settings.emailFromAddress || 'info@skywaysuites.co.ke'}>`,
                  to: customer.email,
                  subject: `Payment Confirmed - ${property?.title || 'Your Booking'}`,
                  html: `
                    <!DOCTYPE html>
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
                          <h1 style="margin: 0; font-size: 20px;">Payment Confirmed</h1>
                          <p>Your booking is now confirmed</p>
                        </div>
                        <div class="content">
                          <p>Dear ${customer?.name || 'Customer'},</p>
                          
                          <div class="success">
                            <strong>Payment Successful</strong><br>
                            We have received your full payment of <strong>KSh ${totalPaid.toLocaleString()}</strong>. Your booking is now <strong>confirmed</strong>!
                          </div>
                          
                          <div class="booking-details">
                            <h3 style="margin-top: 0; color: #6B7C3C;">Booking Confirmation</h3>
                            <div class="detail-row">
                              <span class="label">Property:</span>
                              <span class="value">${property?.title || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Check-in:</span>
                              <span class="value">${formatDateTimeEmail(booking.check_in)}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Check-out:</span>
                              <span class="value">${formatDateTimeEmail(booking.check_out)}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Guests:</span>
                              <span class="value">${booking.guests}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Total Paid:</span>
                              <span class="value" style="color: #6B7C3C; font-weight: bold;">KSh ${totalPaid.toLocaleString()}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Payment Method:</span>
                              <span class="value">${paymentMethod}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Status:</span>
                              <span class="value" style="color: #28a745; font-weight: bold;">CONFIRMED</span>
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
                            <p>&copy; ${new Date().getFullYear()} Skyway Suites. All rights reserved.</p>
                          </div>
                        </div>
                      </div>
                    </body>
                    </html>
                  `
                });
                
                console.log('✅ Payment confirmation email sent to customer:', customer.email);
                
                // Send admin notification
                const adminEmail = settings.adminNotificationEmail || settings.emailFromAddress || 'info@skywaysuites.co.ke';
                console.log('📤 Sending payment notification to admin:', adminEmail);
                await transporter.sendMail({
                  from: `${settings.emailFromName || 'Skyway Suites'} <${settings.emailFromAddress || 'info@skywaysuites.co.ke'}>`,
                  to: adminEmail,
                  subject: `Payment Received - ${customer?.name || 'Customer'}`,
                  html: `
                    <!DOCTYPE html>
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
                          <h1 style="margin: 0; font-size: 20px;">Payment Received</h1>
                        </div>
                        <div class="content">
                          <p><strong>Full payment received and booking confirmed!</strong></p>
                          
                          <div class="booking-details">
                            <h3 style="margin-top: 0; color: #6B7C3C;">Payment Details</h3>
                            <div class="detail-row">
                              <span class="label">Customer:</span>
                              <span class="value">${customer?.name || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Email:</span>
                              <span class="value">${customer?.email || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Amount:</span>
                              <span class="value" style="color: #6B7C3C; font-weight: bold;">KSh ${amount.toLocaleString()}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Method:</span>
                              <span class="value">${paymentMethod}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Total Paid:</span>
                              <span class="value">KSh ${totalPaid.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div class="booking-details">
                            <h3 style="margin-top: 0; color: #6B7C3C;">Booking Details</h3>
                            <div class="detail-row">
                              <span class="label">Property:</span>
                              <span class="value">${property?.title || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Check-in:</span>
                              <span class="value">${formatDateTimeEmail(booking.check_in)}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Check-out:</span>
                              <span class="value">${formatDateTimeEmail(booking.check_out)}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Status:</span>
                              <span class="value" style="color: #28a745; font-weight: bold;">CONFIRMED</span>
                            </div>
                          </div>
                          
                          <p>Customer has been notified of the confirmation.</p>
                        </div>
                      </div>
                    </body>
                    </html>
                  `
                });
                
                console.log('✅ Payment notification email sent to admin');
              }
            } catch (emailError) {
              console.error('❌ Payment confirmation email error:', emailError);
              // Don't fail payment if email fails
            }
          }
        }
        
        return res.status(200).json(transformedPayment);
      }
    }

    // ============================================
    // INITIALIZE EMAIL TEMPLATES TABLE
    // ============================================
    if (endpoint === 'init-email-templates' && req.method === 'POST') {
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS email_templates (
            id TEXT PRIMARY KEY,
            subject TEXT NOT NULL,
            html_template TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);
        
        await query(`CREATE INDEX IF NOT EXISTS idx_email_templates_id ON email_templates(id)`);
        
        return res.status(200).json({ 
          success: true, 
          message: 'Email templates table created successfully!' 
        });
      } catch (error) {
        console.error('Failed to create email_templates table:', error);
        return res.status(500).json({ 
          error: 'Failed to create table',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // ============================================
    // EMAIL TEMPLATES ENDPOINTS
    // ============================================
    if (endpoint === 'email-templates') {
      if (req.method === 'GET') {
        const result = await query("SELECT * FROM email_templates ORDER BY id");
        return res.status(200).json(result.rows);
      }
      
      if (req.method === 'PUT') {
        const { id, subject, htmlTemplate } = req.body;
        if (!id || !subject || !htmlTemplate) {
          return res.status(400).json({ error: 'ID, subject, and htmlTemplate are required' });
        }
        
        // Upsert the template
        const result = await query(`
          INSERT INTO email_templates (id, subject, html_template)
          VALUES ($1, $2, $3)
          ON CONFLICT (id) 
          DO UPDATE SET subject = $2, html_template = $3, updated_at = NOW()
          RETURNING *
        `, [id, subject, htmlTemplate]);
        
        return res.status(200).json(result.rows[0]);
      }
    }

    // ============================================
    // CONTACT ENDPOINTS
    // ============================================
    if (endpoint === 'contact' && req.method === 'POST') {
      const { name, email, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
      }
      await query(
        'INSERT INTO contact_submissions (name, email, message) VALUES ($1, $2, $3)',
        [name, email, message]
      );
      return res.status(200).json({ message: 'Message sent successfully' });
    }

    // ============================================
    // USERS ENDPOINTS (Admin Management)
    // ============================================
    if (endpoint === 'users') {
      if (id && typeof id === 'string') {
        if (req.method === 'PUT') {
          const { name, email, role, password } = req.body;
          if (password) {
            const hashedPassword = await hashPassword(password);
            const result = await query(
              'UPDATE users SET name = $1, email = $2, role = $3, password_hash = $4 WHERE id = $5 RETURNING id, name, email, role, created_at',
              [name, email, role, hashedPassword, id]
            );
            if (result.rows.length === 0) {
              return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json(result.rows[0]);
          } else {
            const result = await query(
              'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, name, email, role, created_at',
              [name, email, role, id]
            );
            if (result.rows.length === 0) {
              return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json(result.rows[0]);
          }
        }
        if (req.method === 'DELETE') {
          await query('DELETE FROM users WHERE id = $1', [id]);
          return res.status(200).json({ message: 'User deleted' });
        }
      }

      if (req.method === 'GET') {
        const result = await query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
        return res.status(200).json(result.rows);
      }

      if (req.method === 'POST') {
        const { name, email, role, password } = req.body;
        if (!password) {
          return res.status(400).json({ error: 'Password is required for new users' });
        }
        const hashedPassword = await hashPassword(password);
        const result = await query(
          'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
          [name, email, role, hashedPassword]
        );
        return res.status(200).json(result.rows[0]);
      }
    }

    // ============================================
    // SETTINGS ENDPOINTS
    // ============================================
    if (endpoint === 'settings') {
      if (action === 'maintenance' && req.method === 'GET') {
        const result = await query(
          "SELECT * FROM settings WHERE category = 'maintenance'"
        );
        const settings: any = {};
        result.rows.forEach(row => {
          settings[row.key] = row.value;
        });
        return res.status(200).json(settings);
      }

      // Handle fetching settings by category
      if (action === 'category' && req.method === 'GET') {
        const { category } = req.query;
        if (!category || typeof category !== 'string') {
          return res.status(400).json({ error: 'Category is required' });
        }
        
        const result = await query(
          'SELECT * FROM settings WHERE category = $1',
          [category]
        );
        
        const settings: any = {};
        result.rows.forEach(row => {
          // Convert snake_case to camelCase for the frontend
          const camelKey = row.key.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
          settings[camelKey] = row.value;
        });
        
        return res.status(200).json(settings);
      }

      if (req.method === 'GET') {
        const result = await query('SELECT * FROM settings ORDER BY category, key');
        return res.status(200).json(result.rows);
      }

      if (req.method === 'POST' || req.method === 'PUT') {
        const updates = req.body;
        if (!Array.isArray(updates)) {
          return res.status(400).json({ error: 'Settings must be an array' });
        }

        for (const setting of updates) {
          const { category, key, value } = setting;
          await query(
            `INSERT INTO settings (category, key, value) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (category, key) 
             DO UPDATE SET value = $3, updated_at = CURRENT_TIMESTAMP`,
            [category, key, value]
          );
        }
        return res.status(200).json({ message: 'Settings updated successfully' });
      }
    }

    // ============================================
    // M-PESA PAYMENT ENDPOINTS
    // ============================================
    if (endpoint === 'mpesa-payment' && req.method === 'POST') {
      const { bookingId, phoneNumber, amount } = req.body;
      
      console.log('🔍 M-Pesa Payment Request:', { bookingId, phoneNumber, amount });
      
      // IMPORTANT: Replace these with your actual Safaricom Daraja API credentials
      const MPESA_CONSUMER_KEY = 'YOUR_MPESA_CONSUMER_KEY';
      const MPESA_CONSUMER_SECRET = 'YOUR_MPESA_CONSUMER_SECRET';
      const MPESA_SHORTCODE = 'YOUR_BUSINESS_SHORTCODE'; // e.g., 174379
      const MPESA_PASSKEY = 'YOUR_MPESA_PASSKEY';
      const MPESA_CALLBACK_URL = 'https://your-domain.com/api?endpoint=mpesa-callback';
      
      try {
        // Step 1: Get access token
        const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
        const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
          headers: {
            'Authorization': `Basic ${auth}`
          }
        });
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        // Step 2: Generate timestamp and password
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
        const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
        
        // Step 3: Initiate STK Push
        const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            BusinessShortCode: MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: phoneNumber,
            PartyB: MPESA_SHORTCODE,
            PhoneNumber: phoneNumber,
            CallBackURL: MPESA_CALLBACK_URL,
            AccountReference: `BOOKING-${bookingId.slice(0, 8)}`,
            TransactionDesc: `Payment for booking ${bookingId.slice(0, 8)}`
          })
        });
        
        const stkData = await stkResponse.json();
        console.log('✅ M-Pesa STK Response:', stkData);
        
        if (stkData.ResponseCode === '0') {
          // Store the checkout request ID for later verification
          await query(
            'INSERT INTO mpesa_transactions (checkout_request_id, booking_id, phone_number, amount, status) VALUES ($1, $2, $3, $4, $5)',
            [stkData.CheckoutRequestID, bookingId, phoneNumber, amount, 'pending']
          );
          
          return res.status(200).json({ 
            success: true, 
            message: 'Payment request sent to your phone',
            checkoutRequestId: stkData.CheckoutRequestID
          });
        } else {
          return res.status(400).json({ 
            success: false, 
            message: stkData.ResponseDescription || 'Failed to initiate M-Pesa payment'
          });
        }
      } catch (error) {
        console.error('❌ M-Pesa Error:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'M-Pesa service temporarily unavailable'
        });
      }
    }
    
    // M-Pesa Callback Endpoint
    if (endpoint === 'mpesa-callback' && req.method === 'POST') {
      const { Body } = req.body;
      const { stkCallback } = Body;
      
      console.log('📱 M-Pesa Callback Received:', JSON.stringify(stkCallback, null, 2));
      
      try {
        const checkoutRequestID = stkCallback.CheckoutRequestID;
        const resultCode = stkCallback.ResultCode;
        
        if (resultCode === 0) {
          // Payment successful
          const callbackMetadata = stkCallback.CallbackMetadata;
          const items = callbackMetadata.Item;
          
          const amount = items.find((item: any) => item.Name === 'Amount')?.Value;
          const mpesaReceiptNumber = items.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
          const phoneNumber = items.find((item: any) => item.Name === 'PhoneNumber')?.Value;
          
          // Get the transaction from database
          const transactionResult = await query(
            'SELECT booking_id FROM mpesa_transactions WHERE checkout_request_id = $1',
            [checkoutRequestID]
          );
          
          if (transactionResult.rows.length > 0) {
            const bookingId = transactionResult.rows[0].booking_id;
            
            // Get booking details
            const bookingResult = await query(
              'SELECT customer_id FROM bookings WHERE id = $1',
              [bookingId]
            );
            
            if (bookingResult.rows.length > 0) {
              const customerId = bookingResult.rows[0].customer_id;
              
              // Create payment record
              await query(
                'INSERT INTO payments (booking_id, customer_id, amount, payment_method, status, transaction_id) VALUES ($1, $2, $3, $4, $5, $6)',
                [bookingId, customerId, amount, 'MPesa', 'paid', mpesaReceiptNumber]
              );
              
              // Update transaction status
              await query(
                'UPDATE mpesa_transactions SET status = $1, mpesa_receipt_number = $2 WHERE checkout_request_id = $3',
                ['completed', mpesaReceiptNumber, checkoutRequestID]
              );
              
              console.log('✅ M-Pesa payment processed successfully');
            }
          }
        } else {
          // Payment failed
          await query(
            'UPDATE mpesa_transactions SET status = $1 WHERE checkout_request_id = $2',
            ['failed', checkoutRequestID]
          );
          console.log('❌ M-Pesa payment failed:', stkCallback.ResultDesc);
        }
        
        return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
      } catch (error) {
        console.error('❌ M-Pesa Callback Error:', error);
        return res.status(500).json({ ResultCode: 1, ResultDesc: 'Error processing callback' });
      }
    }

    // ============================================
    // REVIEWS ENDPOINTS
    // ============================================
    if (endpoint === 'reviews') {
      const { propertyId, bookingId } = req.query;

      // Get review by booking ID
      if (bookingId && typeof bookingId === 'string' && req.method === 'GET') {
        const result = await query(
          `SELECT r.*, u.name as customer_name 
           FROM reviews r 
           JOIN users u ON r.customer_id = u.id 
           WHERE r.booking_id = $1`,
          [bookingId]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Review not found' });
        }
        return res.status(200).json(result.rows[0]);
      }

      // Single review operations
      if (id && typeof id === 'string') {
        if (req.method === 'GET') {
          const result = await query(
            `SELECT r.*, u.name as customer_name 
             FROM reviews r 
             JOIN users u ON r.customer_id = u.id 
             WHERE r.id = $1`,
            [id]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
          }
          return res.status(200).json(result.rows[0]);
        }

        if (req.method === 'PUT') {
          const { rating, comment } = req.body;
          const result = await query(
            'UPDATE reviews SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [rating, comment, id]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
          }
          return res.status(200).json(result.rows[0]);
        }

        if (req.method === 'DELETE') {
          await query('DELETE FROM reviews WHERE id = $1', [id]);
          return res.status(200).json({ message: 'Review deleted' });
        }
      }

      // Collection operations
      if (req.method === 'GET') {
        let queryStr = `SELECT r.*, u.name as customer_name 
                        FROM reviews r 
                        JOIN users u ON r.customer_id = u.id`;
        const params: any[] = [];
        
        if (propertyId && typeof propertyId === 'string') {
          queryStr += ' WHERE r.property_id = $1';
          params.push(propertyId);
        }
        
        queryStr += ' ORDER BY r.created_at DESC';
        
        const result = await query(queryStr, params);
        return res.status(200).json(result.rows);
      }

      if (req.method === 'POST') {
        const { bookingId, customerId, propertyId, rating, comment } = req.body;
        
        // Validate required fields
        if (!bookingId || !customerId || !propertyId || !rating) {
          return res.status(400).json({ error: 'Booking ID, customer ID, property ID, and rating are required' });
        }

        // Check if review already exists for this booking
        const existing = await query('SELECT id FROM reviews WHERE booking_id = $1', [bookingId]);
        if (existing.rows.length > 0) {
          return res.status(400).json({ error: 'Review already exists for this booking' });
        }

        // Verify booking belongs to customer and is completed
        const booking = await query(
          'SELECT * FROM bookings WHERE id = $1 AND customer_id = $2',
          [bookingId, customerId]
        );
        if (booking.rows.length === 0) {
          return res.status(404).json({ error: 'Booking not found or does not belong to this customer' });
        }

        // Check if booking checkout date has passed
        const checkoutDate = new Date(booking.rows[0].check_out);
        const now = new Date();
        if (checkoutDate > now) {
          return res.status(400).json({ error: 'Cannot review a property before checkout date' });
        }

        const result = await query(
          'INSERT INTO reviews (booking_id, customer_id, property_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [bookingId, customerId, propertyId, rating, comment || '']
        );
        return res.status(200).json(result.rows[0]);
      }
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('❌ API ERROR - FULL DETAILS:', error);
    console.error('❌ ERROR MESSAGE:', error instanceof Error ? error.message : String(error));
    console.error('❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack');
    
    // Return detailed error message for debugging
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      // Always return details for debugging (remove in production if needed)
      fullError: String(error)
    });
  }
}