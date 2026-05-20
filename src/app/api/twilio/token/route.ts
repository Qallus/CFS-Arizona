import { NextResponse } from 'next/server';
import { generateVoiceToken } from '@/lib/twilio';

export async function POST(request: Request) {
  try {
    const { identity } = await request.json();
    
    if (!identity) {
      return NextResponse.json({ error: 'Identity required' }, { status: 400 });
    }

    const token = generateVoiceToken(identity);
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
