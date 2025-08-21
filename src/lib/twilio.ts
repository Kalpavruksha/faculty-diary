// Real Twilio implementation
import twilio from 'twilio';

// Initialize client with environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const isTwilioTrial = process.env.TWILIO_TRIAL_ACCOUNT === 'true';

// Initialize Twilio client
let client: any = null;
try {
  if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Twilio client:', error);
}

// Format phone number for Indian numbers
const formatPhoneNumber = (phoneNumber: string) => {
  if (phoneNumber.startsWith('+91') && !phoneNumber.startsWith('+91 ')) {
    return phoneNumber.replace('+91', '+91 ');
  }
  return phoneNumber;
};

/**
 * Send an SMS message via Twilio
 */
export async function sendSMS(to: string, body: string) {
  if (!client) {
    console.error('Twilio client not initialized');
    return {
      success: false,
      status: 'failed',
      errorMessage: 'Twilio client not initialized'
    };
  }
  
  if (!twilioPhone) {
    console.error('Twilio phone number not configured');
    return {
      success: false,
      status: 'failed',
      errorMessage: 'Twilio phone number not configured'
    };
  }
  
  const formattedTo = formatPhoneNumber(to);
  
  try {
    console.log(`[TWILIO] Sending SMS to ${formattedTo}`);
    console.log(`From: ${twilioPhone}`);
    console.log(`To: ${formattedTo}`);
    console.log(`Body: ${body}`);
    
    // Send message using Twilio client
    const message = await client.messages.create({
      body: body,
      from: twilioPhone, 
      to: formattedTo
    });
    
    console.log(`SMS sent with SID: ${message.sid}, Status: ${message.status}`);
    
    return {
      success: true,
      sid: message.sid,
      status: message.status
    };
  } catch (error: any) {
    // Handle specific Twilio errors
    console.error('Error sending SMS:', error);
    
    // Format error response
    return {
      success: false,
      status: 'failed',
      errorCode: error.code,
      errorMessage: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Make a voice call via Twilio
 */
export async function makeCall(to: string, message: string) {
  if (!client) {
    console.error('Twilio client not initialized');
    return {
      success: false,
      status: 'failed',
      errorMessage: 'Twilio client not initialized'
    };
  }
  
  if (!twilioPhone) {
    console.error('Twilio phone number not configured');
    return {
      success: false,
      status: 'failed',
      errorMessage: 'Twilio phone number not configured'
    };
  }
  
  const formattedTo = formatPhoneNumber(to);
  
  try {
    console.log(`[TWILIO] Making call to ${formattedTo}`);
    
    // Escape message for TwiML
    const escapedMessage = message.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    // Create TwiML for voice message
    const twiml = `
      <Response>
        <Say voice="alice" language="en-US">
          Hello. This is an important message from Work Diary.
        </Say>
        <Pause length="1"/>
        <Say voice="alice" language="en-US">
          ${escapedMessage}
        </Say>
        <Pause length="1"/>
        <Say voice="alice" language="en-US">
          Thank you.
        </Say>
      </Response>
    `;
    
    // Make call using Twilio client
    const call = await client.calls.create({
      twiml: twiml,
      to: formattedTo,
      from: twilioPhone
    });
    
    console.log(`Call initiated with SID: ${call.sid}, Status: ${call.status}`);
    
    return {
      success: true,
      sid: call.sid,
      status: call.status
    };
  } catch (error: any) {
    // Handle specific Twilio errors
    console.error('Error making call:', error);
    
    // Format error response
    return {
      success: false,
      status: 'failed',
      errorCode: error.code,
      errorMessage: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Send a notification via SMS, call, or both
 */
export async function sendNotification(
  to: string, 
  message: string, 
  method: 'sms' | 'call' | 'both',
  title?: string
) {
  const results: any = {};
  
  if (method === 'sms' || method === 'both') {
    try {
      // For SMS, include the title in the message if available
      const smsMessage = title ? `${title}: ${message}` : message;
      results.sms = await sendSMS(to, smsMessage);
    } catch (error: any) {
      results.sms = { 
        success: false, 
        error: error.message || 'Unknown error' 
      };
    }
  }
  
  if (method === 'call' || method === 'both') {
    try {
      // For calls, prepend the title if available
      const callMessage = title ? `${title}. ${message}` : message;
      results.call = await makeCall(to, callMessage);
    } catch (error: any) {
      results.call = { 
        success: false, 
        error: error.message || 'Unknown error' 
      };
    }
  }
  
  return results;
} 