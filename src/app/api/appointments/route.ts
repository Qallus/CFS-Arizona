import { NextRequest, NextResponse } from 'next/server';

const WP_SITE_URL = process.env.WP_SITE_URL!;
const WP_APPLICATION_USERNAME = process.env.WP_APPLICATION_USERNAME!;
const WP_APPLICATION_PASSWORD = process.env.WP_APPLICATION_PASSWORD!;

const authHeader = 'Basic ' + Buffer.from(`${WP_APPLICATION_USERNAME}:${WP_APPLICATION_PASSWORD}`).toString('base64');

// GET - Fetch appointments/bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '20';
    const status = searchParams.get('status') || ''; // scheduled, completed, cancelled
    const period = searchParams.get('period') || ''; // upcoming, past

    // Fetch bookings/schedules
    const params = new URLSearchParams({
      page,
      per_page: perPage,
    });

    if (status) params.append('status', status);
    if (period) params.append('period', period);

    const [schedulesRes, calendarsRes] = await Promise.all([
      fetch(`${WP_SITE_URL}/wp-json/fluent-booking/v2/schedules?${params.toString()}`, {
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${WP_SITE_URL}/wp-json/fluent-booking/v2/calendars`, {
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
    ]);

    if (!schedulesRes.ok) {
      throw new Error(`Fluent Booking API error: ${schedulesRes.status}`);
    }

    const schedulesData = await schedulesRes.json();
    const calendarsData = await calendarsRes.json();

    // Extract events for booking creation
    const events = calendarsData.calendars?.data?.[0]?.slots || [];

    return NextResponse.json({
      appointments: schedulesData.schedules?.data || [],
      pagination: {
        total: schedulesData.schedules?.total || 0,
        perPage: schedulesData.schedules?.per_page || 20,
        currentPage: schedulesData.schedules?.current_page || 1,
        lastPage: schedulesData.schedules?.last_page || 1,
      },
      events: events.map((e: any) => ({
        id: e.id,
        title: e.title,
        duration: e.duration,
        description: e.description,
        publicUrl: e.public_url,
        calendarId: e.calendar_id,
        settings: e.settings,
      })),
      calendar: calendarsData.calendars?.data?.[0] || null,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

// POST - Create, cancel, or reschedule appointments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { 
        eventId, 
        calendarId, 
        guestName, 
        guestEmail, 
        guestPhone, 
        companyName,
        companyWebsite,
        meetingPreference,
        preferredAiProvider,
        startTime, 
        endTime, 
        timezone, 
        notes 
      } = body;

      // Build custom fields object
      const customFields: Record<string, string> = {};
      if (companyName) customFields['custom_company_name'] = companyName;
      if (guestPhone) customFields['custom_phone_number'] = guestPhone;
      if (companyWebsite) customFields['custom_website'] = companyWebsite;
      if (preferredAiProvider) customFields['custom_preferred_ai_provider'] = preferredAiProvider;

      // Create booking
      const response = await fetch(
        `${WP_SITE_URL}/wp-json/fluent-booking/v2/bookings/create/${eventId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            calendar_id: calendarId,
            slot_id: eventId,
            name: guestName,
            email: guestEmail,
            phone: guestPhone || '',
            start_time: startTime,
            end_time: endTime,
            timezone: timezone || 'America/Phoenix',
            location_type: meetingPreference || 'zoom_meeting',
            message: notes || '',
            source: 'sig360-dashboard',
            ...customFields,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Booking creation error:', errorText);
        throw new Error(`Failed to create booking: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json({ success: true, booking: data });
    }

    if (action === 'update') {
      const { 
        scheduleId,
        guestName, 
        guestEmail, 
        guestPhone, 
        companyName,
        companyWebsite,
        meetingPreference,
        preferredAiProvider,
        notes 
      } = body;

      // Parse name into first and last
      const nameParts = guestName?.trim().split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Build update payload
      const updatePayload: Record<string, any> = {};
      if (firstName) updatePayload.first_name = firstName;
      if (lastName !== undefined) updatePayload.last_name = lastName;
      if (guestEmail) updatePayload.email = guestEmail;
      if (guestPhone !== undefined) updatePayload.phone = guestPhone;
      if (notes !== undefined) updatePayload.message = notes;
      if (meetingPreference) {
        updatePayload.location_details = { type: meetingPreference };
      }
      
      // Custom fields
      if (companyName !== undefined) updatePayload.custom_company_name = companyName;
      if (guestPhone !== undefined) updatePayload.custom_phone_number = guestPhone;
      if (companyWebsite !== undefined) updatePayload.custom_website = companyWebsite;
      if (preferredAiProvider !== undefined) updatePayload.custom_preferred_ai_provider = preferredAiProvider;

      const response = await fetch(
        `${WP_SITE_URL}/wp-json/fluent-booking/v2/schedules/${scheduleId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update error:', errorText);
        throw new Error(`Failed to update booking: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json({ success: true, booking: data });
    }

    if (action === 'cancel') {
      const { scheduleId, reason } = body;

      const response = await fetch(
        `${WP_SITE_URL}/wp-json/fluent-booking/v2/schedules/${scheduleId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'cancelled',
            cancel_reason: reason || 'Cancelled via SIG360',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel booking: ${response.status}`);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'reschedule') {
      const { scheduleId, newStartTime, newEndTime } = body;

      const response = await fetch(
        `${WP_SITE_URL}/wp-json/fluent-booking/v2/schedules/${scheduleId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            start_time: newStartTime,
            end_time: newEndTime,
            status: 'scheduled',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to reschedule booking: ${response.status}`);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'get') {
      const { scheduleId } = body;

      const response = await fetch(
        `${WP_SITE_URL}/wp-json/fluent-booking/v2/schedules/${scheduleId}`,
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get booking: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json({ appointment: data.schedule });
    }

    if (action === 'getAvailability') {
      const { calendarId } = body;
      
      // Get availability schedules
      const response = await fetch(
        `${WP_SITE_URL}/wp-json/fluent-booking/v2/availability`,
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get availability: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json({ availability: data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error with appointment action:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
