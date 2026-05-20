import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Handle SMS status updates from Twilio
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string;
    const errorCode = formData.get('ErrorCode') as string;
    const errorMessage = formData.get('ErrorMessage') as string;
    
    console.log(`SMS ${messageSid} status: ${messageStatus}`);

    // Update message status in database
    const updateData: any = { status: messageStatus };
    
    if (errorCode) {
      updateData.error_code = errorCode;
      updateData.error_message = errorMessage;
    }

    await supabaseAdmin
      .from('sms_messages')
      .update(updateData)
      .eq('message_sid', messageSid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling SMS status:', error);
    return NextResponse.json({ error: 'Failed to process status' }, { status: 500 });
  }
}
