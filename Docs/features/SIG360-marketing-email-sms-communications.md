# SIG360 — Marketing, Email, SMS, and Communications

## File Purpose

This document defines the marketing, email, SMS, consent, templates, delivery logs, campaigns, and automation requirements for SIG360.

Recommended location:

```txt
/AI.SIG360/docs/SIG360-marketing-email-sms-communications.md
```

## Feature Overview

SIG360 should support email and SMS communications for service notifications, appointment reminders, event reminders, client updates, marketing campaigns, and internal team notifications.

Communications must be tied to consent, contact records, client records, events, appointments, tasks, workflows, and marketing campaigns.

## Communication Channels

Supported channels:

- Email
- SMS
- Phone call log
- In-app notification
- AI draft

Potential providers:

- Resend for transactional email
- Twilio for SMS and voice
- Microsoft 365 / Outlook for team email/calendar context
- FluentCRM / WordPress imports if needed

## Communication Types

Recommended types:

- Appointment Confirmation
- Appointment Reminder
- Appointment Cancellation
- Appointment Reschedule
- Event Confirmation
- Event Reminder
- Event Waitlist Update
- Client Birthday Message
- Client Review Reminder
- Marketing Campaign
- Newsletter
- Internal Staff Notification
- Document Request
- Form Reminder
- SMS Opt-In Confirmation
- SMS Opt-Out Confirmation

## Email Template Fields

Suggested fields:

- id
- template_name
- template_type
- subject
- preheader
- body_html
- body_text
- variables_json
- status
- created_by
- approved_by_optional
- created_at
- updated_at

## SMS Template Fields

Suggested fields:

- id
- template_name
- template_type
- message_body
- variables_json
- status
- compliance_notes
- created_by
- approved_by_optional
- created_at
- updated_at

## Marketing Campaign Fields

Suggested fields:

- id
- campaign_name
- campaign_type
- audience_segment_id
- status
- goal
- start_date
- end_date
- owner_user_id
- email_template_id
- sms_template_id
- landing_page_url
- event_id_optional
- appointment_booking_page_id_optional
- created_at
- updated_at

## Segment Fields

Suggested fields:

- id
- segment_name
- description
- rules_json
- created_by
- created_at
- updated_at

Example segments:

- Active Clients
- Prospects
- Event Attendees
- Event No Shows
- Birthday This Month
- Annual Review Due
- Retirement Planning Interest
- Insurance Planning Interest
- SMS Opted In
- Email Opted In

## Consent Rules

Track consent separately for:

- SMS service notifications
- SMS marketing messages
- Email service notifications
- Email marketing messages

SMS opt-in should include:

- Consent status
- Consent source
- Consent text
- Consent timestamp
- Opt-out timestamp
- Related form submission
- IP/user agent if available

## SMS Compliance Behavior

- Do not send SMS if recipient is opted out.
- Allow STOP to opt out.
- Allow HELP to return support message.
- Store all opt-in and opt-out events.
- Keep checkbox unchecked by default.
- Do not require SMS consent to submit normal forms.
- Include message/data rate language where appropriate.

## Suggested SMS Templates

### Appointment Confirmation

```txt
Hi {{first_name}}, your {{appointment_type}} with Strategic Income Group is confirmed for {{appointment_date}} at {{appointment_time}}. Reply STOP to opt out or HELP for help.
```

### Appointment Reminder

```txt
Reminder: your {{appointment_type}} with Strategic Income Group is tomorrow at {{appointment_time}}. Reply STOP to opt out or HELP for help.
```

### Event Confirmation

```txt
Hi {{first_name}}, you're registered for {{event_title}} on {{event_date}} at {{event_time}}. Reply STOP to opt out or HELP for help.
```

### SMS Opt-In Confirmation

```txt
You've successfully opted in to Strategic Income Group SMS messages. You may receive appointment reminders, event reminders, and requested service updates. Reply STOP to opt out or HELP for help.
```

### SMS Opt-Out Confirmation

```txt
You've successfully opted out of Strategic Income Group SMS messages. To opt in again, visit https://strategicincomegroup.com/sms-opt-in/ or call (480) 466-7070.
```

## Suggested Email Templates

Core email templates:

- Appointment confirmation
- Appointment reminder
- Appointment reschedule notice
- Event registration confirmation
- Event reminder
- Event thank-you
- Client birthday
- Annual review reminder
- Document request
- Client portal invitation
- Staff task assignment

## Communication Log Fields

Suggested fields:

- id
- channel
- template_id
- campaign_id
- related_type
- related_id
- client_id
- contact_id
- sent_by_user_id
- recipient_email
- recipient_phone
- subject
- body_preview
- delivery_status
- provider
- provider_message_id
- opened_at
- clicked_at
- failed_reason
- consent_record_id
- created_at

## Staff Communication Views

Recommended pages:

- Communication Dashboard
- Email Templates
- SMS Templates
- Campaigns
- Segments
- Delivery Logs
- Consent Records
- Failed Messages

## AI Drafting Rules

AI can help draft:

- Email copy
- SMS copy
- Event reminders
- Staff notifications
- Meeting follow-up drafts
- Client-friendly summaries

AI should not auto-send messages by default. Use review and approval before sending, especially for client-facing financial services communication.

## Codex Implementation Notes

- Build templates before campaigns.
- Build consent records before SMS sending.
- Log every outbound message.
- Make SMS sending impossible when opted out.
- Use provider abstraction so Resend/Twilio can be swapped or extended.
- Add variables and preview rendering for templates.
- Add test mode for development.
