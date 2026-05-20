import { NextRequest, NextResponse } from 'next/server';

// Share listing via email or SMS
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, to, listingId, listingName, listingUrl } = body;

  if (!type || !to || !listingUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    if (type === 'email') {
      // Use Resend or configured email provider
      const emailApiKey = process.env.RESEND_API_KEY;
      
      if (emailApiKey) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${emailApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'noreply@channelcast.io',
            to: [to],
            subject: `Check out this advertising opportunity: ${listingName}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #14532d;">Advertising Opportunity</h2>
                <p>You've been invited to view this advertising listing:</p>
                <h3 style="margin: 20px 0;">${listingName}</h3>
                <a href="${listingUrl}" 
                   style="display: inline-block; background: #14532d; color: #ecfdf5; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
                  View Listing
                </a>
                <p style="color: #666; margin-top: 30px; font-size: 12px;">
                  Powered by ChannelCast Advertising
                </p>
              </div>
            `,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send email');
        }
      } else {
        // Fallback: log for development
        console.log('Email would be sent to:', to, 'with link:', listingUrl);
      }

      return NextResponse.json({ success: true, message: 'Email sent' });
    }

    if (type === 'sms') {
      // Use Twilio
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (accountSid && authToken && fromNumber) {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        
        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: to,
            From: fromNumber,
            Body: `Check out this advertising opportunity: ${listingName}\n\n${listingUrl}`,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send SMS');
        }
      } else {
        // Fallback: log for development
        console.log('SMS would be sent to:', to, 'with link:', listingUrl);
      }

      return NextResponse.json({ success: true, message: 'SMS sent' });
    }

    return NextResponse.json({ error: 'Invalid share type' }, { status: 400 });
  } catch (error) {
    console.error('Error sharing listing:', error);
    return NextResponse.json({ error: 'Failed to share listing' }, { status: 500 });
  }
}
