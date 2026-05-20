import { NextRequest, NextResponse } from 'next/server';

// Twilio pricing (approximate US rates)
const TWILIO_PRICING = {
  outbound: 0.014, // per minute
  inbound: 0.0085, // per minute
  recording: 0.0025, // per minute stored
  transcription: 0.05, // per minute transcribed
};

interface CallAnalytics {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  missedCalls: number;
  completedCalls: number;
  totalTalkTime: number; // in seconds
  avgCallDuration: number; // in seconds
  totalCost: number;
  costBreakdown: {
    outboundCost: number;
    inboundCost: number;
    recordingCost: number;
  };
  callsByDay: Array<{
    date: string;
    inbound: number;
    outbound: number;
    missed: number;
  }>;
  callsByHour: Array<{
    hour: number;
    count: number;
  }>;
  topCallers: Array<{
    number: string;
    name?: string;
    count: number;
    totalDuration: number;
  }>;
}

export async function GET(req: NextRequest) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return NextResponse.json({ error: 'Twilio not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '30');
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  try {
    // Fetch all calls from Twilio
    const callsResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json?StartTime>=${startDateStr}&PageSize=1000`,
      {
        headers: { 'Authorization': authHeader },
        cache: 'no-store',
      }
    );

    if (!callsResponse.ok) {
      throw new Error('Failed to fetch calls from Twilio');
    }

    const callsData = await callsResponse.json();
    const calls = callsData.calls || [];

    // Initialize analytics
    let totalCalls = calls.length;
    let inboundCalls = 0;
    let outboundCalls = 0;
    let missedCalls = 0;
    let completedCalls = 0;
    let totalTalkTime = 0;
    let outboundMinutes = 0;
    let inboundMinutes = 0;
    let recordingMinutes = 0;

    // Initialize calls by day
    const callsByDayMap: Record<string, { inbound: number; outbound: number; missed: number }> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      callsByDayMap[dateStr] = { inbound: 0, outbound: 0, missed: 0 };
    }

    // Initialize calls by hour
    const callsByHourMap: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      callsByHourMap[i] = 0;
    }

    // Track callers
    const callerMap: Record<string, { count: number; totalDuration: number; name?: string }> = {};

    // Process each call
    calls.forEach((call: any) => {
      const direction = call.direction === 'inbound' ? 'inbound' : 'outbound';
      const status = call.status;
      const duration = parseInt(call.duration) || 0;
      const durationMinutes = Math.ceil(duration / 60);
      
      // Get date from call
      const callDate = new Date(call.start_time || call.date_created);
      const dateStr = callDate.toISOString().split('T')[0];
      const hour = callDate.getHours();

      // Count by direction
      if (direction === 'inbound') {
        inboundCalls++;
        inboundMinutes += durationMinutes;
      } else {
        outboundCalls++;
        outboundMinutes += durationMinutes;
      }

      // Count by status
      if (status === 'completed') {
        completedCalls++;
        totalTalkTime += duration;
      } else if (status === 'no-answer' || status === 'busy' || status === 'failed') {
        missedCalls++;
      }

      // Recording tracking (if duration > 0, assume recorded)
      if (duration > 0) {
        recordingMinutes += durationMinutes;
      }

      // Count by day
      if (callsByDayMap[dateStr]) {
        if (direction === 'inbound') {
          callsByDayMap[dateStr].inbound++;
        } else {
          callsByDayMap[dateStr].outbound++;
        }
        if (status === 'no-answer' || status === 'busy' || status === 'failed') {
          callsByDayMap[dateStr].missed++;
        }
      }

      // Count by hour
      callsByHourMap[hour]++;

      // Track callers
      const callerNumber = direction === 'inbound' ? call.from : call.to;
      if (callerNumber) {
        if (!callerMap[callerNumber]) {
          callerMap[callerNumber] = { count: 0, totalDuration: 0 };
        }
        callerMap[callerNumber].count++;
        callerMap[callerNumber].totalDuration += duration;
      }
    });

    // Calculate costs
    const outboundCost = outboundMinutes * TWILIO_PRICING.outbound;
    const inboundCost = inboundMinutes * TWILIO_PRICING.inbound;
    const recordingCost = recordingMinutes * TWILIO_PRICING.recording;
    const totalCost = outboundCost + inboundCost + recordingCost;

    // Calculate average duration
    const avgCallDuration = completedCalls > 0 ? Math.round(totalTalkTime / completedCalls) : 0;

    // Format calls by day (sorted by date)
    const callsByDay = Object.entries(callsByDayMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Format calls by hour
    const callsByHour = Object.entries(callsByHourMap)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour);

    // Get top callers (sorted by count)
    const topCallers = Object.entries(callerMap)
      .map(([number, data]) => ({ number, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const analytics: CallAnalytics = {
      totalCalls,
      inboundCalls,
      outboundCalls,
      missedCalls,
      completedCalls,
      totalTalkTime,
      avgCallDuration,
      totalCost: Math.round(totalCost * 100) / 100,
      costBreakdown: {
        outboundCost: Math.round(outboundCost * 100) / 100,
        inboundCost: Math.round(inboundCost * 100) / 100,
        recordingCost: Math.round(recordingCost * 100) / 100,
      },
      callsByDay,
      callsByHour,
      topCallers,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching call analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch call analytics' }, { status: 500 });
  }
}
