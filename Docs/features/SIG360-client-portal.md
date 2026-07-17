# SIG360 Client Portal

## Purpose

The client portal gives clients a clean, trustworthy place to view appointments, meeting summaries, documents, forms, action items, events, and communication preferences.

## Portal Goals

- Reduce client confusion.
- Give clients one place to find SIG resources.
- Allow secure document upload/download.
- Show appointment history and upcoming meetings.
- Share approved meeting summaries.
- Collect forms and updates.
- Manage email/SMS preferences.

## Client Portal Navigation

- Home
- My Advisor Team
- Appointments
- Meeting Summaries
- Documents
- Forms
- Action Items
- Events
- Messages
- Preferences

## Home Dashboard

Should include:

- Welcome message
- Advisor team card
- Upcoming appointment
- Open action items
- Documents requested
- Recent meeting summary
- Upcoming events
- Quick links

## Advisor Team Card

Display:

- Primary Advisor
- Servicing Advisor
- Client Service Associate
- Phone
- Email
- Booking link
- Photos if available

## Appointments

Clients can:

- View upcoming appointments
- Request appointment
- Reschedule/cancel if enabled
- View location/meeting link
- See appointment status

## Meeting Summaries

Clients can view advisor-approved meeting summaries.

Do not expose:

- Internal notes
- Compliance notes
- Draft AI notes
- Sensitive advisor-only comments

## Documents

Clients can:

- Upload documents
- Download shared documents
- View requested documents
- See document status

Document statuses:

- Requested
- Uploaded
- Under Review
- Accepted
- Needs Update
- Archived

## Forms

Client-facing forms:

- Contact Update Form
- SMS Opt-In / Opt-Out
- Insurance Review Intake
- Investment Review Intake
- Retirement Planning Worksheet
- Event RSVP
- Document Request Response

## Preferences

Clients can manage:

- Email preference
- SMS preference
- Phone preference
- Mailing address
- Preferred contact method
- Appointment reminder settings

## Security and Permissions

- Clients can only view their own data.
- Household access should be explicit.
- Sensitive documents require permission checks.
- Portal actions should be logged.
- Client-uploaded documents should be scanned/validated before processing if supported.

## Codex Implementation Tasks

- Build client portal layout.
- Build portal dashboard.
- Build advisor team card.
- Build appointments page.
- Build document upload/download.
- Build forms page.
- Build preferences page.
- Add portal-specific permission checks.
- Add audit logs for document access and preference changes.
