import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

// Initialize Twilio client
const client = twilio(accountSid, authToken);

interface SendWhatsappParams {
  phone: string;
  message: string;
  recipientName?: string;
}

// Format phone number to WhatsApp format
function formatWhatsappPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  // Remove leading zeros
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = '966' + cleaned.substring(1);
  }

  // Add 966 if not present (Saudi Arabia)
  if (!cleaned.startsWith('966')) {
    cleaned = '966' + cleaned;
  }

  return '+' + cleaned;
}

// Send WhatsApp message via Twilio
export const sendWhatsapp = async (params: SendWhatsappParams): Promise<{
  success: boolean;
  messageId?: string;
  status: string;
  errorMessage?: string;
}> => {
  const { phone, message } = params;

  // Format phone number
  const formattedPhone = formatWhatsappPhone(phone);

  console.log('[WhatsApp Twilio] Sending message to:', formattedPhone);

  try {
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${formattedPhone}`,
    });

    console.log('[WhatsApp Twilio] Message sent:', result.sid, 'Status:', result.status);

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
    };
  } catch (error: any) {
    console.error('[WhatsApp Twilio] Send failed:', error.message);

    return {
      success: false,
      status: 'FAILED',
      errorMessage: error.message,
    };
  }
};

// Test WhatsApp connection
export const testConnection = async (): Promise<{
  success: boolean;
  message: string;
  account?: any;
}> => {
  console.log('[WhatsApp Twilio] Testing connection...');

  try {
    const account = await client.api.accounts(accountSid!).fetch();

    console.log('[WhatsApp Twilio] Account:', account.friendlyName, 'Status:', account.status);

    return {
      success: true,
      message: `Connected to Twilio account: ${account.friendlyName}`,
      account: {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
      },
    };
  } catch (error: any) {
    console.error('[WhatsApp Twilio] Connection test failed:', error.message);

    return {
      success: false,
      message: error.message,
    };
  }
};

// Get Twilio WhatsApp templates (Content Templates)
export const getTemplates = async (): Promise<{
  success: boolean;
  templates?: any[];
  message?: string;
}> => {
  try {
    // Twilio Content API for templates
    const templates = await client.content.v1.contents.list({ limit: 20 });

    return {
      success: true,
      templates: templates.map(t => ({
        sid: t.sid,
        friendlyName: t.friendlyName,
        language: t.language,
        variables: t.variables,
      })),
    };
  } catch (error: any) {
    console.error('[WhatsApp Twilio] Get templates failed:', error.message);

    return {
      success: false,
      message: error.message,
    };
  }
};
