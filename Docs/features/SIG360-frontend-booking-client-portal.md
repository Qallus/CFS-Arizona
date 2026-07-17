# SIG360 — Frontend Booking, Event Pages, and Client Portal Features

## File Purpose

This document defines the frontend booking experience, event pages, client portal views, forms, UX behavior, and client-facing communication flows for SIG360.

Recommended location:

```txt
/AI.SIG360/docs/SIG360-frontend-booking-client-portal.md
```

## Feature Overview

SIG360 should include polished client-facing pages for booking appointments, registering for events, managing profile information, viewing assigned planners, and accessing approved documents/forms.

The frontend should feel simple, trustworthy, fast, and professional. Clients and prospects should not feel like they are inside an internal admin tool.

## Frontend Routes

Recommended public/client-facing routes:

```txt
/book
/book/[appointment-type]
/events
/events/[event-slug]
/rsvp/[event-slug]
/client/login
/client/dashboard
/client/appointments
/client/book
/client/events
/client/documents
/client/forms
/client/profile
/client/team
/sms-opt-in
/sms-opt-out
```

## Booking Page Features

A booking page should include:

- Appointment title
- Short description
- Planner/team photo if applicable
- Appointment duration
- Location type
- Calendar date selector
- Time slot selector
- Contact fields
- Planning topic field
- SMS consent checkbox
- Email consent checkbox
- Submit button
- Confirmation screen

## Booking Page UX

Recommended flow:

1. Select appointment type.
2. Choose date and time.
3. Enter contact information.
4. Answer intake questions.
5. Agree to communication preferences.
6. Submit booking.
7. Show confirmation page.
8. Send confirmation email and optional SMS.

## Event Page Features

An event page should include:

- Event title
- Event category/type
- Featured image
- Date and time
- Location or virtual link details
- Event description
- Capacity/spots remaining if enabled
- RSVP form
- Add-to-calendar buttons
- Contact/support details
- Confirmation screen after RSVP

## RSVP UX

Recommended flow:

1. Client/prospect lands on event page.
2. Reviews date, time, location, and description.
3. Completes RSVP form.
4. Adds guest count and guest names if allowed.
5. Confirms communication consent.
6. Receives confirmation.
7. System updates event capacity.
8. System sends staff notification if needed.

## Client Dashboard Home

Client dashboard should show:

- Welcome message
- Assigned SIG team card
- Upcoming appointments
- Upcoming events
- Open forms
- Recent documents
- Communication preferences
- Quick actions

Recommended quick actions:

- Book a Meeting
- RSVP to Event
- Update Profile
- Upload Document
- Contact My Team

## Client Appointment Page

Should show:

- Upcoming appointments
- Past appointments
- Appointment type
- Date/time
- Location/meeting link if authorized
- Assigned planner
- Status
- Add to calendar
- Request reschedule button if enabled

## Client Events Page

Should show:

- Available events
- Registered events
- Past events
- RSVP status
- Event details
- Add to calendar
- Cancel RSVP if enabled

## Client Documents Page

Should show approved client-visible documents only.

Features:

- Document list
- Category filter
- Download button
- Upload button if enabled
- Document status
- Date uploaded

## Client Forms Page

Should show:

- Assigned forms
- Completed forms
- Form due dates
- Status
- Start/continue button

## Client Profile Page

Should allow clients to update:

- Name
- Preferred Name
- Email
- Phone
- Address
- Preferred contact method
- SMS opt-in/opt-out
- Email preferences
- Timezone

Important: changing contact information should create an internal review notification if needed.

## Assigned Team Card

Show:

- Financial Planner photo/name/title
- Servicing Advisor photo/name/title
- Client Service Associate photo/name/title
- Office phone
- Email/contact button

## Frontend Form Requirements

All public forms should include:

- Clear labels
- Required field indicators
- Error states
- Success states
- Loading states
- Spam protection if needed
- Accessibility-friendly markup
- Mobile-friendly spacing
- Consent language where required

## SMS Consent UX

SMS opt-in checkbox should be unchecked by default.

Suggested checkbox language:

> I agree to receive SMS messages from Strategic Income Group related to appointments, event reminders, account/service updates, and requested communications. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help.

Do not make SMS consent required for booking or event registration unless a specific workflow legally requires it.

## Design Requirements

- Clean ShadCN-style components.
- Professional financial services feel.
- Use cards, badges, tabs, and tables.
- Keep public forms minimal.
- Use clear confirmation messages.
- Avoid clutter and internal language.
- Use responsive mobile-first layouts.

## Codex Implementation Notes

- Build reusable booking form components.
- Build reusable event RSVP components.
- Keep frontend validation and backend validation aligned.
- Connect submissions to activity timeline.
- Respect visibility rules before showing documents, notes, or meeting links.
- Use loading skeletons for dashboard cards.
- Use clean error messages that do not expose backend details.
