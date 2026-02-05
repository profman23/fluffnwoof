import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Brand Colors
const BRAND_COLORS = {
  mint: '#CEE8DC',      // Primary - Mint Green
  pink: '#EAB8D5',      // Accent - Pink
  gold: '#F5DF59',      // Secondary - Gold
  dark: '#211E1F',      // Text/Headers
  white: '#FDFEFF',     // Background
};

// Check if Resend API key is available (for Render deployment)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const USE_RESEND = !!RESEND_API_KEY;

// Initialize Resend client if API key is available
const resend = USE_RESEND ? new Resend(RESEND_API_KEY) : null;

// Email configuration with enhanced deliverability settings (for local development)
const transporter = !USE_RESEND ? nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
}) : null;

// Verify connection on startup
if (USE_RESEND) {
  console.log('[Email Service] Using Resend API for email delivery');
} else if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('[Email Service] SMTP Connection error:', error.message);
    } else {
      console.log('[Email Service] SMTP Ready to send emails');
    }
  });
}

interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  recipientName?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  errorMessage?: string;
}

/**
 * Send an email with MAXIMUM deliverability optimizations
 * Supports both Resend API (for Render) and SMTP (for local development)
 */
export const sendEmail = async (params: SendEmailParams): Promise<SendEmailResult> => {
  const { to, subject, text, html, recipientName } = params;
  const clinicName = "Fluff N' Woof Veterinary Clinic";
  const plainText = text || generateBetterPlainText(html || '', recipientName || '');

  // Use Resend API if available (for Render deployment)
  if (USE_RESEND && resend) {
    try {
      // Resend requires a verified domain or use onboarding@resend.dev for testing
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      const { data, error } = await resend.emails.send({
        from: `${clinicName} <${fromEmail}>`,
        to: [to],
        subject,
        html: html || undefined,
        text: plainText,
        headers: {
          'X-Priority': '3',
        },
      });

      if (error) {
        console.error(`[Email Service - Resend] Failed to send email to ${to}:`, error.message);
        return {
          success: false,
          errorMessage: error.message,
        };
      }

      console.log(`[Email Service - Resend] Email sent to ${to}, id: ${data?.id}`);
      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error: any) {
      console.error(`[Email Service - Resend] Error sending email to ${to}:`, error.message);
      return {
        success: false,
        errorMessage: error.message,
      };
    }
  }

  // Use SMTP for local development
  if (!transporter) {
    console.error('[Email Service] No email transport configured');
    return {
      success: false,
      errorMessage: 'No email transport configured',
    };
  }

  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  // Generate unique Message-ID for better deliverability
  const domain = fromEmail?.split('@')[1] || 'fluffnwoof.com';
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@${domain}>`;

  try {
    const result = await transporter.sendMail({
      from: `"${clinicName}" <${fromEmail}>`,
      to: recipientName ? `"${recipientName}" <${to}>` : to,
      replyTo: fromEmail,
      subject,
      // IMPORTANT: Plain text MUST come first for better deliverability
      text: plainText,
      html,
      messageId,
      headers: {
        // Standard priority (1=high, 3=normal, 5=low) - normal is best for inbox
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        // Indicates this is a transactional email, not bulk marketing
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'Auto-Submitted': 'auto-generated',
        // Feedback loop - helps with reputation
        'Feedback-ID': `appointment:fluffnwoof:${Date.now()}`,
      },
    });

    console.log(`[Email Service - SMTP] Email sent to ${to}, messageId: ${result.messageId}`);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    console.error(`[Email Service - SMTP] Failed to send email to ${to}:`, error.message);

    return {
      success: false,
      errorMessage: error.message,
    };
  }
};

/**
 * Generate BETTER plain text for maximum deliverability
 * Gmail prefers emails with good plain text alternatives
 */
const generateBetterPlainText = (html: string, recipientName: string): string => {
  // Remove style and script tags
  let text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/tr>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&copy;/g, '©');

  // Clean up whitespace
  text = text
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
    .replace(/\n +/g, '\n')
    .replace(/ +\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Add personalized footer for better deliverability (shows it's a real business)
  const greeting = recipientName ? `Dear ${recipientName},\n` : '';
  const footer = `
---
Fluff N' Woof Veterinary Clinic
This is an automated message regarding your appointment.
If you have questions, please contact us directly.
`;

  return greeting ? text + footer : text + footer;
};

/**
 * Generate bilingual appointment email HTML template
 */
const generateAppointmentEmailHTML = (params: {
  type: 'BOOKED' | 'CONFIRMED' | 'CANCELLED' | 'REMINDER' | 'FOLLOWUP' | 'PENDING' | 'REJECTED';
  recipientName: string;
  petName: string;
  appointmentDate: string;
  appointmentTime: string;
  clinicName: string;
  rejectReason?: string;
}): string => {
  const { type, recipientName, petName, appointmentDate, appointmentTime, clinicName, rejectReason } = params;

  const typeConfig = {
    BOOKED: {
      headerColor: BRAND_COLORS.gold,
      accentColor: '#d4b82e',
      arabicTitle: 'تم حجز موعدك بنجاح!',
      englishTitle: 'Your Appointment is Booked!',
      arabicMessage: 'تم تأكيد حجز موعد',
      englishMessage: 'Your appointment has been booked',
      arabicFooter: 'نتطلع لرؤيتكم!',
      englishFooter: 'We look forward to seeing you!',
      icon: '📅',
    },
    PENDING: {
      headerColor: BRAND_COLORS.gold,
      accentColor: '#d4b82e',
      arabicTitle: 'تم استلام طلب الحجز',
      englishTitle: 'Booking Request Received',
      arabicMessage: 'تم استلام طلب حجز موعد',
      englishMessage: 'We have received your booking request for',
      arabicFooter: 'سيتم إشعاركم عند الموافقة على الحجز.',
      englishFooter: 'You will be notified once your booking is approved.',
      icon: '⏳',
    },
    CONFIRMED: {
      headerColor: BRAND_COLORS.mint,
      accentColor: '#5a9f7d',
      arabicTitle: 'تم تأكيد موعدك!',
      englishTitle: 'Your Appointment is Confirmed!',
      arabicMessage: 'تم تأكيد موعد',
      englishMessage: 'Your appointment has been confirmed',
      arabicFooter: 'نتطلع لرؤيتكم!',
      englishFooter: 'We look forward to seeing you!',
      icon: '✅',
    },
    REJECTED: {
      headerColor: '#ef4444',
      accentColor: '#dc2626',
      arabicTitle: 'تم رفض طلب الحجز',
      englishTitle: 'Booking Request Declined',
      arabicMessage: 'نأسف لإبلاغكم بأنه تم رفض طلب حجز موعد',
      englishMessage: 'We regret to inform you that the booking request for',
      arabicFooter: 'يمكنكم المحاولة بحجز موعد آخر.',
      englishFooter: 'You can try booking a different appointment.',
      icon: '❌',
    },
    CANCELLED: {
      headerColor: BRAND_COLORS.pink,
      accentColor: '#d07ba9',
      arabicTitle: 'تم إلغاء الموعد',
      englishTitle: 'Appointment Cancelled',
      arabicMessage: 'نود إعلامكم بإلغاء موعد',
      englishMessage: 'We would like to inform you that the appointment for',
      arabicFooter: 'لإعادة الحجز، يرجى التواصل معنا.',
      englishFooter: 'To reschedule, please contact us.',
      icon: '❌',
    },
    REMINDER: {
      headerColor: BRAND_COLORS.gold,
      accentColor: '#d4b82e',
      arabicTitle: 'تذكير بموعدك!',
      englishTitle: 'Appointment Reminder!',
      arabicMessage: 'نود تذكيركم بموعد',
      englishMessage: 'This is a reminder for the appointment of',
      arabicFooter: 'نتطلع لرؤيتكم!',
      englishFooter: 'We look forward to seeing you!',
      icon: '🔔',
    },
    FOLLOWUP: {
      headerColor: BRAND_COLORS.pink,
      accentColor: '#d07ba9',
      arabicTitle: `نتمنى السلامة لـ ${petName}!`,
      englishTitle: `Wishing ${petName} a Speedy Recovery!`,
      arabicMessage: 'نتمنى أن يكون بصحة جيدة بعد زيارتكم لنا',
      englishMessage: 'We hope is doing well after the visit',
      arabicFooter: 'إذا كانت لديكم أي استفسارات، لا تترددوا في التواصل معنا.',
      englishFooter: 'If you have any questions, please do not hesitate to contact us.',
      icon: '💚',
    },
  };

  const config = typeConfig[type];
  const showDateTime = type !== 'FOLLOWUP';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${config.englishTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto;">

          <!-- Header Gradient Line -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.mint} 0%, ${BRAND_COLORS.pink} 50%, ${BRAND_COLORS.gold} 100%); height: 6px; border-radius: 10px 10px 0 0;"></td>
          </tr>

          <!-- Logo Header -->
          <tr>
            <td style="background: ${BRAND_COLORS.dark}; padding: 25px; text-align: center;">
              <img src="https://res.cloudinary.com/fluffnwoof/image/upload/v1769442571/fluffnwoof/logo-email.png" alt="Fluff N' Woof" style="max-width: 180px; height: auto;">
              <p style="color: ${BRAND_COLORS.mint}; margin: 10px 0 0 0; font-size: 12px; letter-spacing: 2px; font-family: Arial, sans-serif;">VETERINARY CLINIC</p>
            </td>
          </tr>

          <!-- Status Header -->
          <tr>
            <td style="background: ${config.headerColor}; padding: 30px; text-align: center;">
              <span style="font-size: 40px;">${config.icon}</span>
              <h1 style="color: ${BRAND_COLORS.dark}; margin: 15px 0 5px 0; font-size: 24px; font-family: Arial, sans-serif;">${config.arabicTitle}</h1>
              <h2 style="color: ${BRAND_COLORS.dark}; margin: 0; font-size: 20px; font-family: Arial, sans-serif; font-weight: normal;">${config.englishTitle}</h2>
            </td>
          </tr>

          <!-- Arabic Content -->
          <tr>
            <td dir="rtl" style="background: ${BRAND_COLORS.white}; padding: 30px; font-family: 'Segoe UI', Tahoma, Arial, sans-serif;">
              <p style="font-size: 18px; color: ${BRAND_COLORS.dark}; margin: 0 0 15px 0; line-height: 1.6;">
                مرحباً <strong>${recipientName}</strong>،
              </p>
              <p style="font-size: 16px; color: ${BRAND_COLORS.dark}; margin: 0 0 20px 0; line-height: 1.6;">
                ${config.arabicMessage} <strong style="color: ${config.accentColor};">${petName}</strong>${type === 'CANCELLED' ? '' : '.'}
              </p>

              ${showDateTime ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border-radius: 12px; border-right: 4px solid ${config.accentColor};">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 5px 0;">
                          <span style="font-size: 15px; color: #666;">📅 التاريخ | Date:</span>
                          <span style="font-size: 16px; color: ${BRAND_COLORS.dark}; font-weight: bold; margin-right: 10px;">${appointmentDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;">
                          <span style="font-size: 15px; color: #666;">🕐 الوقت | Time:</span>
                          <span style="font-size: 16px; color: ${BRAND_COLORS.dark}; font-weight: bold; margin-right: 10px;">${appointmentTime}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${type === 'REJECTED' && rejectReason ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fef2f2; border-radius: 12px; border-right: 4px solid #ef4444; margin-top: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px;">
                      <strong>السبب:</strong> ${rejectReason}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="font-size: 14px; color: #666; margin: 25px 0 0 0; line-height: 1.6;">
                ${config.arabicFooter}<br>
                <strong style="color: ${BRAND_COLORS.dark};">فريق ${clinicName}</strong>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${BRAND_COLORS.mint} 0%, ${BRAND_COLORS.pink} 50%, ${BRAND_COLORS.gold} 100%);"></td>
          </tr>

          <!-- English Content -->
          <tr>
            <td dir="ltr" style="background: ${BRAND_COLORS.white}; padding: 30px; font-family: 'Segoe UI', Arial, sans-serif;">
              <p style="font-size: 18px; color: ${BRAND_COLORS.dark}; margin: 0 0 15px 0; line-height: 1.6;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="font-size: 16px; color: ${BRAND_COLORS.dark}; margin: 0 0 20px 0; line-height: 1.6;">
                ${config.englishMessage} <strong style="color: ${config.accentColor};">${petName}</strong>${type === 'CANCELLED' || type === 'REJECTED' ? ' has been declined.' : '.'}
              </p>

              ${showDateTime ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border-radius: 12px; border-left: 4px solid ${config.accentColor};">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 5px 0;">
                          <span style="font-size: 15px; color: #666;">📅 Date:</span>
                          <span style="font-size: 16px; color: ${BRAND_COLORS.dark}; font-weight: bold; margin-left: 10px;">${appointmentDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;">
                          <span style="font-size: 15px; color: #666;">🕐 Time:</span>
                          <span style="font-size: 16px; color: ${BRAND_COLORS.dark}; font-weight: bold; margin-left: 10px;">${appointmentTime}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${type === 'REJECTED' && rejectReason ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fef2f2; border-radius: 12px; border-left: 4px solid #ef4444; margin-top: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px;">
                      <strong>Reason:</strong> ${rejectReason}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="font-size: 14px; color: #666; margin: 25px 0 0 0; line-height: 1.6;">
                ${config.englishFooter}<br>
                <strong style="color: ${BRAND_COLORS.dark};">The ${clinicName} Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: ${BRAND_COLORS.dark}; padding: 25px; text-align: center;">
              <p style="color: ${BRAND_COLORS.white}; margin: 0 0 10px 0; font-size: 14px; font-weight: 600; font-family: Arial, sans-serif;">
                ${clinicName}
              </p>
              <div style="width: 60px; height: 3px; background: linear-gradient(90deg, ${BRAND_COLORS.mint}, ${BRAND_COLORS.pink}, ${BRAND_COLORS.gold}); margin: 0 auto; border-radius: 2px;"></div>
              <p style="color: #888; margin: 15px 0 0 0; font-size: 11px; font-family: Arial, sans-serif;">
                &copy; ${new Date().getFullYear()} Fluff N' Woof. All rights reserved.
              </p>
            </td>
          </tr>

          <!-- Footer Gradient Line -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.pink} 50%, ${BRAND_COLORS.mint} 100%); height: 6px; border-radius: 0 0 10px 10px;"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Send appointment reminder email
 */
export const sendAppointmentEmail = async (params: {
  to: string;
  recipientName: string;
  petName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  clinicName?: string;
  type: 'BOOKED' | 'CONFIRMED' | 'CANCELLED' | 'REMINDER' | 'FOLLOWUP' | 'WELCOME' | 'PENDING' | 'REJECTED';
  rejectReason?: string;
}): Promise<SendEmailResult> => {
  const { to, recipientName, petName = '', appointmentDate = '', appointmentTime = '', clinicName = "Fluff N' Woof", type, rejectReason } = params;

  // Generate bilingual subject line
  const getSubject = () => {
    switch (type) {
      case 'BOOKED':
        return `تم حجز موعدك | Appointment Booked - ${clinicName}`;
      case 'PENDING':
        return `تم استلام طلب الحجز | Booking Request Received - ${clinicName}`;
      case 'CONFIRMED':
        return `تم تأكيد موعدك | Appointment Confirmed - ${clinicName}`;
      case 'REJECTED':
        return `تم رفض طلب الحجز | Booking Request Declined - ${clinicName}`;
      case 'CANCELLED':
        return `تم إلغاء الموعد | Appointment Cancelled - ${clinicName}`;
      case 'REMINDER':
        return `تذكير بموعدك | Appointment Reminder - ${clinicName}`;
      case 'FOLLOWUP':
        return `متابعة بعد الزيارة | Follow-up - ${clinicName}`;
      case 'WELCOME':
        return `مرحباً بك في ${clinicName}! | Welcome to ${clinicName}!`;
      default:
        return clinicName;
    }
  };

  // Use new bilingual template for appointment emails
  if (type !== 'WELCOME') {
    const html = generateAppointmentEmailHTML({
      type,
      recipientName,
      petName,
      appointmentDate,
      appointmentTime,
      clinicName,
      rejectReason,
    });

    return sendEmail({
      to,
      subject: getSubject(),
      html,
      recipientName,
    });
  }

  // Welcome email template (already bilingual)
  const welcomeHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif;">

          <!-- Header with Brand Colors -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.mint} 0%, ${BRAND_COLORS.pink} 50%, ${BRAND_COLORS.gold} 100%); height: 8px; border-radius: 10px 10px 0 0;"></td>
          </tr>
          <tr>
            <td style="background: ${BRAND_COLORS.dark}; padding: 30px; text-align: center;">
              <img src="https://res.cloudinary.com/fluffnwoof/image/upload/v1769442571/fluffnwoof/logo-email.png" alt="Fluff N' Woof" style="max-width: 200px; height: auto; margin-bottom: 10px;">
              <p style="color: ${BRAND_COLORS.mint}; margin: 0; font-size: 14px; letter-spacing: 2px;">VETERINARY CLINIC</p>
            </td>
          </tr>

          <!-- Arabic Section -->
          <tr>
            <td dir="rtl" style="background: ${BRAND_COLORS.white}; padding: 40px 30px; font-family: 'Segoe UI', Tahoma, sans-serif;">
              <div style="background: ${BRAND_COLORS.pink}; padding: 25px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
                <h2 style="color: ${BRAND_COLORS.dark}; margin: 0; font-size: 28px; font-weight: 700;">🎉 مرحباً بك في عائلتنا!</h2>
              </div>

              <p style="font-size: 18px; color: ${BRAND_COLORS.dark}; line-height: 1.8; margin-bottom: 20px;">
                مرحباً <strong>${recipientName}</strong>،
              </p>

              ${petName ? `
              <p style="font-size: 17px; color: ${BRAND_COLORS.dark}; line-height: 1.9;">
                نحن سعداء جداً بانضمامك وانضمام <strong style="color: #d07ba9; font-size: 19px;">${petName}</strong> إلى عائلة <strong>${clinicName}</strong>! 🐾
              </p>
              ` : `
              <p style="font-size: 17px; color: ${BRAND_COLORS.dark}; line-height: 1.9;">
                نحن سعداء جداً بانضمامك إلى عائلة <strong>${clinicName}</strong>! 🐾
              </p>
              `}

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: ${BRAND_COLORS.mint}; border-radius: 16px; margin: 30px 0; border-right: 5px solid #5a9f7d;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0 0 15px 0; font-weight: 700; color: ${BRAND_COLORS.dark}; font-size: 17px;">نقدم لك ولحيوانك الأليف أفضل الخدمات البيطرية:</p>
                    <p style="color: ${BRAND_COLORS.dark}; margin: 0; line-height: 2.2; font-size: 15px;">
                      ✓ الفحوصات الدورية والاستشارات<br>
                      ✓ التطعيمات والتحصينات<br>
                      ✓ العناية والتجميل (Grooming)<br>
                      ✓ العمليات الجراحية<br>
                      ✓ خدمات الطوارئ على مدار الساعة
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 15px; color: #666; text-align: center; margin-top: 25px;">
                نتطلع لخدمتك وخدمة حيوانك الأليف!<br>
                <strong style="color: ${BRAND_COLORS.dark};">فريق ${clinicName}</strong>
              </p>
            </td>
          </tr>

          <!-- Gradient Divider -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, ${BRAND_COLORS.mint} 0%, ${BRAND_COLORS.pink} 50%, ${BRAND_COLORS.gold} 100%);"></td>
          </tr>

          <!-- English Section -->
          <tr>
            <td dir="ltr" style="background: ${BRAND_COLORS.white}; padding: 40px 30px; font-family: 'Segoe UI', Arial, sans-serif;">
              <div style="background: ${BRAND_COLORS.gold}; padding: 25px; border-radius: 16px; text-align: center; margin-bottom: 30px;">
                <h2 style="color: ${BRAND_COLORS.dark}; margin: 0; font-size: 26px; font-weight: 700;">🎉 Welcome to Our Family!</h2>
              </div>

              <p style="font-size: 18px; color: ${BRAND_COLORS.dark}; line-height: 1.8; margin-bottom: 20px;">
                Hello <strong>${recipientName}</strong>,
              </p>

              ${petName ? `
              <p style="font-size: 17px; color: ${BRAND_COLORS.dark}; line-height: 1.9;">
                We are thrilled to have you and <strong style="color: #d07ba9; font-size: 19px;">${petName}</strong> join the <strong>${clinicName}</strong> family! 🐾
              </p>
              ` : `
              <p style="font-size: 17px; color: ${BRAND_COLORS.dark}; line-height: 1.9;">
                We are thrilled to have you join the <strong>${clinicName}</strong> family! 🐾
              </p>
              `}

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: ${BRAND_COLORS.pink}; border-radius: 16px; margin: 30px 0; border-left: 5px solid #d07ba9;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0 0 15px 0; font-weight: 700; color: ${BRAND_COLORS.dark}; font-size: 17px;">We offer the best veterinary services for you and your pet:</p>
                    <p style="color: ${BRAND_COLORS.dark}; margin: 0; line-height: 2.2; font-size: 15px;">
                      ✓ Regular check-ups & consultations<br>
                      ✓ Vaccinations & immunizations<br>
                      ✓ Grooming & pet care<br>
                      ✓ Surgical procedures<br>
                      ✓ 24/7 Emergency services
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 15px; color: #666; text-align: center; margin-top: 25px;">
                We look forward to caring for you and your pet!<br>
                <strong style="color: ${BRAND_COLORS.dark};">The ${clinicName} Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: ${BRAND_COLORS.dark}; padding: 30px; text-align: center;">
              <p style="color: ${BRAND_COLORS.white}; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                Fluff N' Woof Veterinary Clinic
              </p>
              <div style="width: 80px; height: 4px; background: linear-gradient(90deg, ${BRAND_COLORS.mint}, ${BRAND_COLORS.pink}, ${BRAND_COLORS.gold}); margin: 10px auto; border-radius: 2px;"></div>
              <p style="color: #888; margin: 15px 0 0 0; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Fluff N' Woof. All rights reserved.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.pink} 50%, ${BRAND_COLORS.mint} 100%); height: 4px; border-radius: 0 0 10px 10px;"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to,
    subject: getSubject(),
    html: welcomeHtml,
    recipientName,
  });
};

/**
 * Generate OTP email HTML template (bilingual)
 */
const generateOtpEmailHTML = (params: {
  type: 'REGISTRATION' | 'PASSWORD_RESET';
  recipientName: string;
  otpCode: string;
  expiryMinutes: number;
}): string => {
  const { type, recipientName, otpCode, expiryMinutes } = params;

  const config = {
    REGISTRATION: {
      headerColor: BRAND_COLORS.mint,
      accentColor: '#5a9f7d',
      arabicTitle: 'تفعيل حسابك',
      englishTitle: 'Activate Your Account',
      arabicMessage: 'شكراً لتسجيلك في بوابة العملاء. استخدم الرمز التالي لتفعيل حسابك:',
      englishMessage: 'Thank you for registering on our customer portal. Use the following code to activate your account:',
      icon: '🔐',
    },
    PASSWORD_RESET: {
      headerColor: BRAND_COLORS.gold,
      accentColor: '#d4b82e',
      arabicTitle: 'إعادة تعيين كلمة المرور',
      englishTitle: 'Reset Your Password',
      arabicMessage: 'تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. استخدم الرمز التالي:',
      englishMessage: 'We received a request to reset your password. Use the following code:',
      icon: '🔑',
    },
  };

  const c = config[type];
  // Split OTP into digits for display
  const otpDigits = otpCode.split('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.englishTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto;">

          <!-- Header Gradient Line -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.mint} 0%, ${BRAND_COLORS.pink} 50%, ${BRAND_COLORS.gold} 100%); height: 6px; border-radius: 10px 10px 0 0;"></td>
          </tr>

          <!-- Logo Header -->
          <tr>
            <td style="background: ${BRAND_COLORS.dark}; padding: 25px; text-align: center;">
              <img src="https://res.cloudinary.com/fluffnwoof/image/upload/v1769442571/fluffnwoof/logo-email.png" alt="Fluff N' Woof" style="max-width: 180px; height: auto;">
              <p style="color: ${BRAND_COLORS.mint}; margin: 10px 0 0 0; font-size: 12px; letter-spacing: 2px; font-family: Arial, sans-serif;">CUSTOMER PORTAL</p>
            </td>
          </tr>

          <!-- Status Header -->
          <tr>
            <td style="background: ${c.headerColor}; padding: 30px; text-align: center;">
              <span style="font-size: 40px;">${c.icon}</span>
              <h1 style="color: ${BRAND_COLORS.dark}; margin: 15px 0 5px 0; font-size: 24px; font-family: Arial, sans-serif;">${c.arabicTitle}</h1>
              <h2 style="color: ${BRAND_COLORS.dark}; margin: 0; font-size: 20px; font-family: Arial, sans-serif; font-weight: normal;">${c.englishTitle}</h2>
            </td>
          </tr>

          <!-- Arabic Content -->
          <tr>
            <td dir="rtl" style="background: ${BRAND_COLORS.white}; padding: 30px; font-family: 'Segoe UI', Tahoma, Arial, sans-serif;">
              <p style="font-size: 18px; color: ${BRAND_COLORS.dark}; margin: 0 0 15px 0; line-height: 1.6;">
                مرحباً <strong>${recipientName}</strong>،
              </p>
              <p style="font-size: 16px; color: ${BRAND_COLORS.dark}; margin: 0 0 25px 0; line-height: 1.6;">
                ${c.arabicMessage}
              </p>

              <!-- OTP Code Display -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        ${otpDigits.map(digit => `
                          <td style="padding: 0 5px;">
                            <div style="width: 50px; height: 60px; background: #f9fafb; border: 2px solid ${c.accentColor}; border-radius: 10px; display: inline-block; line-height: 60px; text-align: center; font-size: 28px; font-weight: bold; color: ${BRAND_COLORS.dark}; font-family: 'Courier New', monospace;">${digit}</div>
                          </td>
                        `).join('')}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #666; margin: 20px 0 0 0; text-align: center;">
                ⏱️ صالح لمدة <strong>${expiryMinutes} دقائق</strong>
              </p>

              <p style="font-size: 13px; color: #999; margin: 25px 0 0 0; line-height: 1.6; border-top: 1px solid #eee; padding-top: 20px;">
                إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${BRAND_COLORS.mint} 0%, ${BRAND_COLORS.pink} 50%, ${BRAND_COLORS.gold} 100%);"></td>
          </tr>

          <!-- English Content -->
          <tr>
            <td dir="ltr" style="background: ${BRAND_COLORS.white}; padding: 30px; font-family: 'Segoe UI', Arial, sans-serif;">
              <p style="font-size: 18px; color: ${BRAND_COLORS.dark}; margin: 0 0 15px 0; line-height: 1.6;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="font-size: 16px; color: ${BRAND_COLORS.dark}; margin: 0 0 25px 0; line-height: 1.6;">
                ${c.englishMessage}
              </p>

              <!-- OTP Code Display -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        ${otpDigits.map(digit => `
                          <td style="padding: 0 5px;">
                            <div style="width: 50px; height: 60px; background: #f9fafb; border: 2px solid ${c.accentColor}; border-radius: 10px; display: inline-block; line-height: 60px; text-align: center; font-size: 28px; font-weight: bold; color: ${BRAND_COLORS.dark}; font-family: 'Courier New', monospace;">${digit}</div>
                          </td>
                        `).join('')}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #666; margin: 20px 0 0 0; text-align: center;">
                ⏱️ Valid for <strong>${expiryMinutes} minutes</strong>
              </p>

              <p style="font-size: 13px; color: #999; margin: 25px 0 0 0; line-height: 1.6; border-top: 1px solid #eee; padding-top: 20px;">
                If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: ${BRAND_COLORS.dark}; padding: 25px; text-align: center;">
              <p style="color: ${BRAND_COLORS.white}; margin: 0 0 10px 0; font-size: 14px; font-weight: 600; font-family: Arial, sans-serif;">
                Fluff N' Woof Veterinary Clinic
              </p>
              <div style="width: 60px; height: 3px; background: linear-gradient(90deg, ${BRAND_COLORS.mint}, ${BRAND_COLORS.pink}, ${BRAND_COLORS.gold}); margin: 0 auto; border-radius: 2px;"></div>
              <p style="color: #888; margin: 15px 0 0 0; font-size: 11px; font-family: Arial, sans-serif;">
                &copy; ${new Date().getFullYear()} Fluff N' Woof. All rights reserved.
              </p>
            </td>
          </tr>

          <!-- Footer Gradient Line -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.pink} 50%, ${BRAND_COLORS.mint} 100%); height: 6px; border-radius: 0 0 10px 10px;"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Send OTP email for customer portal
 */
export const sendOtpEmail = async (params: {
  to: string;
  recipientName: string;
  otpCode: string;
  type: 'REGISTRATION' | 'PASSWORD_RESET';
  expiryMinutes?: number;
}): Promise<SendEmailResult> => {
  const { to, recipientName, otpCode, type, expiryMinutes = 10 } = params;

  const subject = type === 'REGISTRATION'
    ? `رمز التفعيل | Activation Code - Fluff N' Woof`
    : `رمز إعادة التعيين | Reset Code - Fluff N' Woof`;

  const html = generateOtpEmailHTML({
    type,
    recipientName,
    otpCode,
    expiryMinutes,
  });

  return sendEmail({
    to,
    subject,
    html,
    recipientName,
  });
};

/**
 * Send customer portal booking confirmation email
 */
export const sendPortalBookingConfirmation = async (params: {
  to: string;
  recipientName: string;
  petName: string;
  vetName: string;
  visitType: string;
  appointmentDate: string;
  appointmentTime: string;
}): Promise<SendEmailResult> => {
  const { to, recipientName, petName, vetName, visitType, appointmentDate, appointmentTime } = params;

  // Use existing appointment email template with BOOKED type
  return sendAppointmentEmail({
    to,
    recipientName,
    petName,
    appointmentDate,
    appointmentTime,
    type: 'BOOKED',
  });
};

/**
 * Send pending booking notification email (awaiting staff approval)
 */
export const sendPendingBookingEmail = async (params: {
  to: string;
  recipientName: string;
  petName: string;
  appointmentDate: string;
  appointmentTime: string;
}): Promise<SendEmailResult> => {
  const { to, recipientName, petName, appointmentDate, appointmentTime } = params;

  return sendAppointmentEmail({
    to,
    recipientName,
    petName,
    appointmentDate,
    appointmentTime,
    type: 'PENDING',
  });
};

/**
 * Send booking approved email
 */
export const sendBookingApprovedEmail = async (params: {
  to: string;
  recipientName: string;
  petName: string;
  appointmentDate: string;
  appointmentTime: string;
}): Promise<SendEmailResult> => {
  const { to, recipientName, petName, appointmentDate, appointmentTime } = params;

  return sendAppointmentEmail({
    to,
    recipientName,
    petName,
    appointmentDate,
    appointmentTime,
    type: 'CONFIRMED',
  });
};

/**
 * Send booking rejected email
 */
export const sendBookingRejectedEmail = async (params: {
  to: string;
  recipientName: string;
  petName: string;
  appointmentDate: string;
  appointmentTime: string;
  rejectReason?: string;
}): Promise<SendEmailResult> => {
  const { to, recipientName, petName, appointmentDate, appointmentTime, rejectReason } = params;

  return sendAppointmentEmail({
    to,
    recipientName,
    petName,
    appointmentDate,
    appointmentTime,
    type: 'REJECTED',
    rejectReason,
  });
};

/**
 * Send cancellation notice email (when customer or staff cancels)
 */
export const sendCancellationNotice = async (params: {
  to: string;
  recipientName: string;
  petName: string;
  appointmentDate: string;
  appointmentTime: string;
  cancelledBy: 'CUSTOMER' | 'STAFF';
}): Promise<SendEmailResult> => {
  const { to, recipientName, petName, appointmentDate, appointmentTime } = params;

  // Use existing appointment email template with CANCELLED type
  return sendAppointmentEmail({
    to,
    recipientName,
    petName,
    appointmentDate,
    appointmentTime,
    type: 'CANCELLED',
  });
};

/**
 * Send form notification email (when a form needs client signature)
 */
export const sendFormNotificationEmail = async (params: {
  ownerEmail: string;
  ownerName: string;
  petName: string;
  formName: string;
  formNameAr: string;
  signUrl: string;
}): Promise<SendEmailResult> => {
  const { ownerEmail, ownerName, petName, formName, formNameAr, signUrl } = params;
  const clinicName = "Fluff N' Woof";

  const subject = `📝 ${formNameAr} - ${formName} | ${clinicName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, ${BRAND_COLORS.mint}20 0%, ${BRAND_COLORS.pink}15 50%, ${BRAND_COLORS.gold}10 100%);">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 30px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%; background: ${BRAND_COLORS.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.mint} 0%, ${BRAND_COLORS.pink} 50%, ${BRAND_COLORS.gold} 100%); height: 8px;"></td>
          </tr>

          <!-- Logo -->
          <tr>
            <td style="padding: 30px; text-align: center; background: ${BRAND_COLORS.white};">
              <h1 style="margin: 0; color: ${BRAND_COLORS.dark}; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 24px;">📝 ${clinicName}</h1>
            </td>
          </tr>

          <!-- Arabic Section -->
          <tr>
            <td dir="rtl" style="background: ${BRAND_COLORS.white}; padding: 30px; font-family: 'Segoe UI', Tahoma, sans-serif;">
              <div style="background: ${BRAND_COLORS.mint}; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
                <h2 style="color: ${BRAND_COLORS.dark}; margin: 0; font-size: 22px;">نموذج جديد يحتاج توقيعك</h2>
              </div>

              <p style="font-size: 16px; color: ${BRAND_COLORS.dark}; line-height: 1.8; margin-bottom: 15px;">
                مرحباً <strong>${ownerName}</strong> 👋
              </p>

              <p style="font-size: 15px; color: ${BRAND_COLORS.dark}; line-height: 1.8;">
                يوجد نموذج جديد يحتاج توقيعك لـ <strong style="color: #d07ba9;">${petName}</strong>
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f8fafc; border-radius: 12px; margin: 20px 0; border-right: 4px solid ${BRAND_COLORS.pink};">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; font-weight: 700; color: ${BRAND_COLORS.dark}; font-size: 18px;">
                      📄 ${formNameAr}
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${signUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                      ✍️ وقّع الآن
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gradient Divider -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${BRAND_COLORS.mint} 0%, ${BRAND_COLORS.pink} 50%, ${BRAND_COLORS.gold} 100%);"></td>
          </tr>

          <!-- English Section -->
          <tr>
            <td dir="ltr" style="background: ${BRAND_COLORS.white}; padding: 30px; font-family: 'Segoe UI', Arial, sans-serif;">
              <div style="background: ${BRAND_COLORS.gold}; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
                <h2 style="color: ${BRAND_COLORS.dark}; margin: 0; font-size: 20px;">New Form Requires Your Signature</h2>
              </div>

              <p style="font-size: 16px; color: ${BRAND_COLORS.dark}; line-height: 1.8; margin-bottom: 15px;">
                Hello <strong>${ownerName}</strong> 👋
              </p>

              <p style="font-size: 15px; color: ${BRAND_COLORS.dark}; line-height: 1.8;">
                A new form requires your signature for <strong style="color: #d07ba9;">${petName}</strong>
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f8fafc; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${BRAND_COLORS.mint};">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; font-weight: 700; color: ${BRAND_COLORS.dark}; font-size: 18px;">
                      📄 ${formName}
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${signUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                      ✍️ Sign Now
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: ${BRAND_COLORS.dark}; padding: 25px; text-align: center;">
              <p style="color: ${BRAND_COLORS.white}; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">
                ${clinicName} Veterinary Clinic
              </p>
              <div style="width: 60px; height: 3px; background: linear-gradient(90deg, ${BRAND_COLORS.mint}, ${BRAND_COLORS.pink}, ${BRAND_COLORS.gold}); margin: 0 auto; border-radius: 2px;"></div>
              <p style="color: #888; margin: 15px 0 0 0; font-size: 11px;">
                &copy; ${new Date().getFullYear()} ${clinicName}. All rights reserved.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.pink} 50%, ${BRAND_COLORS.mint} 100%); height: 6px; border-radius: 0 0 10px 10px;"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: ownerEmail,
    subject,
    html,
    recipientName: ownerName,
  });
};

/**
 * Test email connection
 */
export const testConnection = async (): Promise<{ success: boolean; error?: string; provider?: string }> => {
  // If using Resend, we can't really test without sending an email
  // But we can verify the API key is set
  if (USE_RESEND) {
    if (resend) {
      return { success: true, provider: 'resend' };
    }
    return { success: false, error: 'Resend API key not configured', provider: 'resend' };
  }

  // Test SMTP connection
  if (!transporter) {
    return { success: false, error: 'SMTP not configured', provider: 'smtp' };
  }

  try {
    await transporter.verify();
    return { success: true, provider: 'smtp' };
  } catch (error: any) {
    return { success: false, error: error.message, provider: 'smtp' };
  }
};

export const emailService = {
  sendEmail,
  sendAppointmentEmail,
  sendOtpEmail,
  sendPortalBookingConfirmation,
  sendPendingBookingEmail,
  sendBookingApprovedEmail,
  sendBookingRejectedEmail,
  sendCancellationNotice,
  sendFormNotificationEmail,
  testConnection,
};

export default emailService;
