# SIG360 — Backend Architecture and Data Models

## File Purpose

This document defines backend architecture, database models, API concepts, relationships, audit logging, communications, integrations, and permissions for SIG360.

Recommended location:

```txt
/AI.SIG360/docs/SIG360-backend-architecture-data-models.md
```

## Backend Goals

The SIG360 backend should provide secure, reliable, role-based access to clients, contacts, users, appointments, events, tasks, documents, communications, marketing campaigns, and AI workflows.

The backend should be designed so every important record can be connected, searched, audited, and extended later.

## Core Models

Recommended core models:

- User
- Role
- Permission
- Client
- Contact
- Household
- Appointment
- BookingPage
- Event
- RSVP
- Task
- Project / Workflow
- Document
- Note
- ActivityLog
- EmailTemplate
- SMSTemplate
- CommunicationLog
- MarketingCampaign
- Segment
- FormSubmission
- ConsentRecord
- AIConversation
- AIAgentRun
- IntegrationAccount

## Relationship Principles

- Users can be assigned to clients, appointments, events, tasks, and campaigns.
- Clients can belong to households.
- Contacts can become clients.
- Appointments can connect to clients, contacts, households, planners, tasks, and communications.
- Events can connect to RSVPs, clients, contacts, marketing campaigns, emails, SMS messages, and attendance.
- Tasks can connect to almost anything.
- Documents can connect to clients, households, appointments, events, tasks, and forms.
- Every key action should create an activity log entry.

## User Model

Fields:

- id
- first_name
- last_name
- display_name
- email
- phone
- profile_photo_url
- role_id
- user_type
- status
- timezone
- department
- title
- last_login_at
- created_at
- updated_at

## Role Model

Fields:

- id
- name
- description
- permission_keys
- is_system_role
- created_at
- updated_at

## Client Model

Fields:

- id
- first_name
- last_name
- preferred_name
- email
- mobile_phone
- household_id
- status
- lifecycle_stage
- assigned_planner_id
- servicing_advisor_id
- client_service_associate_id
- birthday
- planning_categories
- sms_opt_in_status
- email_opt_in_status
- created_at
- updated_at

## Household Model

Fields:

- id
- household_name
- primary_client_id
- secondary_client_id
- status
- assigned_planner_id
- address
- notes
- created_at
- updated_at

## Appointment Model

Fields:

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
- meeting_url
- meeting_provider
- external_calendar_id
- external_event_id
- status
- reminder_status
- created_at
- updated_at

## BookingPage Model

Fields:

- id
- name
- slug
- appointment_type
- assigned_user_id
- assigned_team_id
- duration_minutes
- buffer_before_minutes
- buffer_after_minutes
- available_days
- available_time_windows
- timezone
- location_type
- active
- intake_questions
- confirmation_template_id
- reminder_template_id
- created_at
- updated_at

## Event Model

Fields:

- id
- event_title
- event_slug
- event_type
- description
- event_date
- start_time
- end_time
- timezone
- venue_name
- venue_address
- virtual_url
- capacity
- waitlist_enabled
- registration_status
- event_status
- featured_image_url
- owner_user_id
- marketing_campaign_id
- created_at
- updated_at

## RSVP Model

Fields:

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
- rsvp_status
- attendance_status
- consent_record_id
- checked_in_at
- created_at
- updated_at

## Task Model

Fields:

- id
- title
- description
- task_type
- status
- priority
- assigned_to_user_id
- created_by_user_id
- related_type
- related_id
- client_id
- household_id
- appointment_id
- event_id
- due_date
- completed_at
- internal_notes
- client_visible
- created_at
- updated_at

Recommended task types:

- Client Follow-Up
- Appointment Prep
- Appointment Follow-Up
- Event Follow-Up
- Document Request
- Planning Review
- Marketing Task
- Operations Task
- AI Review Task

## Project / Workflow Model

Use this for internal strategic projects and client journey workflows.

Fields:

- id
- name
- description
- workflow_type
- owner_user_id
- status
- start_date
- target_date
- related_client_id
- related_household_id
- created_at
- updated_at

## Document Model

Fields:

- id
- title
- file_url
- file_type
- category
- visibility
- related_type
- related_id
- uploaded_by_user_id
- client_id
- household_id
- version
- created_at
- updated_at

## Note Model

Fields:

- id
- title
- body
- note_type
- visibility
- related_type
- related_id
- client_id
- household_id
- created_by_user_id
- created_at
- updated_at

## CommunicationLog Model

Fields:

- id
- channel
- direction
- subject
- body_preview
- body_full_optional
- from_user_id
- to_client_id
- to_contact_id
- to_email
- to_phone
- related_type
- related_id
- provider
- provider_message_id
- delivery_status
- opened_at
- clicked_at
- failed_reason
- consent_record_id
- created_at

Channels:

- Email
- SMS
- Phone
- In-App
- AI Draft

## ConsentRecord Model

Fields:

- id
- person_type
- person_id
- channel
- consent_status
- consent_source
- consent_text
- consent_date
- opt_out_date
- ip_address_optional
- user_agent_optional
- created_at
- updated_at

## ActivityLog Model

Fields:

- id
- actor_user_id
- action
- related_type
- related_id
- client_id
- household_id
- metadata_json
- created_at

## API Route Groups

Recommended API groups:

```txt
/api/users
/api/roles
/api/clients
/api/contacts
/api/households
/api/appointments
/api/booking-pages
/api/events
/api/rsvps
/api/tasks
/api/documents
/api/notes
/api/communications
/api/marketing
/api/consent
/api/activity
/api/ai/agents
/api/integrations
```

## Permission Requirements

Every API route must check:

- Authenticated user
- Role permissions
- Record ownership/assignment
- Client visibility rules
- Staff vs client portal scope

## Audit Logging

Create an activity log for:

- Client created/updated
- User invited/updated
- Appointment booked/rescheduled/canceled
- Event created/updated
- RSVP submitted/updated
- Email/SMS sent
- Consent updated
- Document uploaded/downloaded
- Task created/completed
- Role changed
- AI draft created

## Integration Accounts

Potential integrations:

- Microsoft 365 / Outlook Calendar
- Teams Meeting Links
- Google Calendar optional
- Fluent Booking Pro imported records
- Twilio SMS/Voice
- Resend Email
- Redtail CRM future sync
- WordPress / SIG website
- OpenAI Agents / Realtime

## Codex Implementation Notes

- Start with clean TypeScript types or schema definitions.
- Use consistent naming across frontend and backend.
- Make `related_type` + `related_id` available for flexible relationships, but use direct foreign keys for core relationships.
- Validate all public form submissions server-side.
- Never expose integration secrets to frontend code.
- Use environment variables for providers.
- Create seed data for roles and statuses.
- Add test data for clients, appointments, events, and tasks.
