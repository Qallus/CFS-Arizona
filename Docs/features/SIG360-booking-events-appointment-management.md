# SIG360 — Booking, Events, Appointment and Event Management

## File Purpose

This document defines the SIG360 booking, appointments, event management, RSVP, attendance, reminder, and staff management workflows.

Recommended location:

```txt
/AI.SIG360/docs/SIG360-booking-events-appointment-management.md
```

## Feature Overview

SIG360 should support both appointment booking and event registration. The system should work for client meetings, prospect discovery calls, annual reviews, webinar registrations, seminar events, volunteer events, internal meetings, and client appreciation events.

This module should connect to clients, contacts, households, users, planners, tasks, communications, marketing campaigns, forms, and activity timelines.

## Main Concepts

### Appointment

A scheduled one-to-one or small group meeting involving a client/prospect and one or more SIG team members.

Examples:

- Discovery Call
- Annual Review
- Investment Review
- Insurance Planning Meeting
- Retirement Planning Meeting
- Client Service Call
- Document Review
- Follow-Up Meeting

### Event

A one-time or recurring larger gathering with registration/RSVP.

Examples:

- Client appreciation event
- Educational seminar
- Webinar
- FMSC volunteer event
- Retirement planning event
- Medicare planning workshop
- Tax planning webinar
- Internal team event

## Dashboard Navigation

Recommended staff navigation:

```txt
Appointments
Events
Booking Pages
RSVPs
Attendance
Reminder Logs
Calendar
```

## Appointment Fields

Suggested fields:

- id
- appointment_title
- appointment_type
- client_id
- contact_id
- household_id
- assigned_planner_id
- assigned_staff_ids
- start_time
- end_time
- timezone
- location_type
- physical_location
- meeting_url
- meeting_provider
- calendar_event_id
- booking_page_id
- status
- confirmation_status
- reminder_status
- notes_internal
- notes_client_visible
- intake_form_response_id
- created_by
- created_at
- updated_at

## Appointment Types

Recommended appointment types:

- Discovery Call
- Initial Consultation
- Annual Review
- Investment Review
- Insurance Review
- Retirement Planning
- Wealth Management Review
- Client Service Call
- Document Review
- Event Follow-Up
- Internal Meeting

## Appointment Statuses

Recommended statuses:

- Requested
- Scheduled
- Confirmed
- Rescheduled
- Completed
- No Show
- Canceled
- Needs Follow-Up

## Event Fields

Suggested fields:

- id
- event_title
- event_slug
- event_type
- event_description
- event_date
- event_start_time
- event_end_time
- timezone
- venue_name
- venue_address
- virtual_event_url
- capacity
- spots_remaining
- waitlist_enabled
- registration_status
- event_status
- featured_image_url
- assigned_owner_id
- marketing_campaign_id
- email_template_id
- sms_template_id
- created_at
- updated_at

## Event Types

Recommended event types:

- Client Appreciation
- Educational Seminar
- Webinar
- Volunteer Event
- Workshop
- Retirement Planning
- Investment Education
- Insurance Planning
- Medicare / Long-Term Care
- Internal Team Event

## Event Statuses

Recommended statuses:

- Draft
- Published
- Registration Open
- Registration Closed
- Waitlist Only
- Full
- Completed
- Canceled
- Archived

## RSVP Fields

Suggested fields:

- id
- event_id
- client_id
- contact_id
- household_id
- first_name
- last_name
- email
- phone
- number_of_guests
- guest_names
- dietary_notes_optional
- shirt_size_optional
- special_notes
- rsvp_status
- attendance_status
- sms_consent_status
- email_consent_status
- confirmation_sent_at
- reminder_sent_at
- checked_in_at
- created_at
- updated_at

## RSVP Statuses

- Registered
- Confirmed
- Waitlisted
- Canceled
- Declined
- Attended
- No Show

## Appointment Forms

### Booking Page Setup Form

Fields:

- Booking Page Name
- Appointment Type
- Assigned Planner / Team
- Available Days
- Available Times
- Duration
- Buffer Before / After
- Location Type
- Physical Location
- Virtual Meeting Toggle
- Intake Questions
- Confirmation Email Template
- Reminder Email Template
- SMS Reminder Toggle
- Active Status

### Appointment Booking Form

Fields:

- First Name
- Last Name
- Email
- Phone
- Preferred Meeting Type
- Appointment Type
- Selected Date/Time
- Existing Client Toggle
- Planning Topic
- Notes / Questions
- SMS Consent Checkbox
- Email Consent Checkbox

### Appointment Management Form

Fields:

- Appointment Title
- Client / Contact
- Assigned Planner
- Additional Staff
- Date / Time
- Location
- Meeting URL
- Status
- Internal Notes
- Client-Visible Notes
- Reminder Settings

## Event Forms

### Event Setup Form

Fields:

- Event Title
- Event Type
- Date
- Start Time
- End Time
- Venue / Location
- Virtual URL
- Capacity
- Waitlist Enabled
- Featured Image
- Description
- Registration Open/Close Date
- Assigned Owner
- Marketing Campaign
- Confirmation Email
- Reminder Email
- SMS Reminder
- Status

### Event Registration / RSVP Form

Fields:

- First Name
- Last Name
- Email
- Phone
- Number of Attendees
- Guest Names
- Notes
- SMS Consent Checkbox
- Email Consent Checkbox

### Event Check-In Form

Fields:

- RSVP Search
- Attendee Name
- Guest Count
- Attendance Status
- Check-In Time
- Notes

## Reminder Rules

Appointment reminders:

- Confirmation immediately after booking.
- Reminder 24 hours before.
- Optional reminder 2 hours before.
- Planner notification when booked.
- Planner notification if canceled or rescheduled.

Event reminders:

- Confirmation immediately after RSVP.
- Reminder 7 days before.
- Reminder 1 day before.
- Optional same-day reminder.
- Staff notification when capacity is near full.
- Staff notification when event is full.
- Waitlist notification when a spot opens.

## Email and SMS Connections

Every appointment and event should connect to:

- Email templates
- SMS templates
- Consent status
- Delivery logs
- Open/click tracking if available
- Staff notifications
- Client/prospect notifications
- Marketing campaign source

## Staff Views

### Appointment Overview

Should include:

- Today’s appointments
- Upcoming appointments
- Appointment type
- Client/contact
- Assigned planner
- Status
- Meeting link
- Location
- Reminder status
- Quick actions

### Event Overview

Should include:

- Upcoming events
- Event status
- RSVP count
- Capacity
- Waitlist count
- Attended count
- Assigned owner
- Marketing campaign
- Quick actions

## Client-Facing Views

Clients should be able to:

- Book appointments.
- View upcoming appointments.
- Cancel or request reschedule if enabled.
- RSVP to events.
- View event details.
- Add events to calendar.
- Manage reminders and preferences.

## Calendar Integration Notes

Future implementation may connect to:

- Microsoft Outlook / Microsoft 365
- Google Calendar
- Teams meetings
- Zoom meetings
- Fluent Booking Pro imported records

Store external IDs where possible:

- calendar_provider
- external_calendar_id
- external_event_id
- meeting_provider
- meeting_url
- organizer_email

## Codex Implementation Notes

- Build appointments and events as separate models but connect both to clients, contacts, users, tasks, and communications.
- Support public booking pages and private client portal booking pages.
- Make meeting links visible only to authorized users.
- Log every confirmation and reminder.
- Respect SMS consent before sending text reminders.
- Add capacity calculations for events.
- Add waitlist behavior for full events.
