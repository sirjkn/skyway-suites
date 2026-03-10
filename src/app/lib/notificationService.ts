import { getNotificationSettings } from './api';

// Admin contact details
const ADMIN_WHATSAPP = '+254725689199';
const ADMIN_EMAIL = 'sirjkn@gmail.com';

interface NotificationData {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  checkInDate: string;
  checkOutDate: string;
  propertyName?: string;
  totalPrice?: number;
}

/**
 * Send WhatsApp notification using configured provider
 */
async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    const settings = await getNotificationSettings();
    if (!settings) {
      console.error('Notification settings not configured');
      return false;
    }

    const provider = settings.whatsappProvider || 'twilio';

    if (provider === 'twilio') {
      // Twilio WhatsApp API
      const accountSid = settings.whatsappAccountSid;
      const authToken = settings.whatsappAuthToken;
      const fromNumber = settings.whatsappFromNumber;

      if (!accountSid || !authToken || !fromNumber) {
        console.error('Twilio credentials not configured');
        return false;
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: `whatsapp:${fromNumber}`,
            To: `whatsapp:${to}`,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        console.error('Failed to send WhatsApp message via Twilio');
        return false;
      }

      console.log('WhatsApp message sent via Twilio');
      return true;
    } else if (provider === 'wesendr') {
      // Wesendr WhatsApp API
      const apiKey = settings.wesendrApiKey;
      const fromNumber = settings.whatsappFromNumber;

      if (!apiKey || !fromNumber) {
        console.error('Wesendr credentials not configured');
        return false;
      }

      const response = await fetch('https://api.wesendr.com/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromNumber,
          to: to,
          message: message,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send WhatsApp message via Wesendr');
        return false;
      }

      console.log('WhatsApp message sent via Wesendr');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

/**
 * Send email notification using configured provider
 */
async function sendEmail(to: string, subject: string, message: string): Promise<boolean> {
  try {
    const settings = await getNotificationSettings();
    if (!settings) {
      console.error('Notification settings not configured');
      return false;
    }

    const provider = settings.emailProvider || 'sendgrid';

    if (provider === 'sendgrid') {
      // SendGrid API
      const apiKey = settings.emailApiKey;
      const fromEmail = settings.emailFromAddress;
      const fromName = settings.emailFromName || 'Skyway Suites';

      if (!apiKey || !fromEmail) {
        console.error('SendGrid credentials not configured');
        return false;
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
              subject: subject,
            },
          ],
          from: {
            email: fromEmail,
            name: fromName,
          },
          content: [
            {
              type: 'text/plain',
              value: message,
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error('Failed to send email via SendGrid');
        return false;
      }

      console.log('Email sent via SendGrid');
      return true;
    } else if (provider === 'mailgun') {
      // Mailgun API
      const apiKey = settings.emailApiKey;
      const fromEmail = settings.emailFromAddress;
      const fromName = settings.emailFromName || 'Skyway Suites';

      if (!apiKey || !fromEmail) {
        console.error('Mailgun credentials not configured');
        return false;
      }

      // Note: You'll need to configure your Mailgun domain
      const domain = fromEmail.split('@')[1];
      
      const response = await fetch(
        `https://api.mailgun.net/v3/${domain}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`api:${apiKey}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            from: `${fromName} <${fromEmail}>`,
            to: to,
            subject: subject,
            text: message,
          }),
        }
      );

      if (!response.ok) {
        console.error('Failed to send email via Mailgun');
        return false;
      }

      console.log('Email sent via Mailgun');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send booking confirmation to customer
 */
export async function sendCustomerBookingConfirmation(data: NotificationData): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings || !settings.notificationActions) {
    console.error('Notification actions not configured');
    return;
  }

  const { bookingConfirmed } = settings.notificationActions;
  
  // Format dates
  const checkIn = new Date(data.checkInDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const checkOut = new Date(data.checkOutDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const message = `Hi ${data.customerName}, your booking has been confirmed from ${checkIn} to ${checkOut}. Thank you for choosing Skyway Suites!`;

  // Send WhatsApp if enabled and customer phone is available
  if (bookingConfirmed.whatsapp && data.customerPhone) {
    await sendWhatsAppMessage(data.customerPhone, message);
  }

  // Send Email if enabled and customer email is available
  if (bookingConfirmed.email && data.customerEmail) {
    await sendEmail(
      data.customerEmail,
      'Booking Confirmation - Skyway Suites',
      message
    );
  }
}

/**
 * Send booking notification to admin
 */
export async function sendAdminBookingNotification(data: NotificationData): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings || !settings.notificationActions) {
    console.error('Notification actions not configured');
    return;
  }

  const { bookingCreated } = settings.notificationActions;
  
  // Format dates
  const checkIn = new Date(data.checkInDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const checkOut = new Date(data.checkOutDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const message = `There is a customer booking on Skyway Suites website for ${data.customerName} from ${checkIn} to ${checkOut}. Please review the booking and payment.`;

  // Send WhatsApp to admin if enabled
  if (bookingCreated.whatsapp) {
    await sendWhatsAppMessage(ADMIN_WHATSAPP, message);
  }

  // Send Email to admin if enabled
  if (bookingCreated.email) {
    await sendEmail(
      ADMIN_EMAIL,
      `New Booking Alert - ${data.customerName}`,
      message
    );
  }
}

/**
 * Send account creation notification to customer
 */
export async function sendAccountCreationNotification(
  customerName: string,
  customerEmail: string,
  customerPhone?: string
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings || !settings.notificationActions) {
    console.error('Notification actions not configured');
    return;
  }

  const { accountCreated } = settings.notificationActions;
  
  const message = `Welcome to Skyway Suites, ${customerName}! Your account has been created successfully. You can now book amazing properties with us.`;

  // Send WhatsApp if enabled and phone is available
  if (accountCreated.whatsapp && customerPhone) {
    await sendWhatsAppMessage(customerPhone, message);
  }

  // Send Email if enabled
  if (accountCreated.email && customerEmail) {
    await sendEmail(
      customerEmail,
      'Welcome to Skyway Suites',
      message
    );
  }
}
