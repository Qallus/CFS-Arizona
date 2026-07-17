# SIG360 Data Model Map

## Purpose

This document defines the major SIG360 database objects and how they connect.

Codex should adapt field names to the selected stack, ORM, and database convention, but the relationships should remain consistent.

## Core Relationship Map

```txt
User
  -> Role
  -> Team Assignment
  -> Tasks
  -> Meetings
  -> Appointments
  -> Notes
  -> Communications

Client
  -> Household
  -> Contacts
  -> Advisor Team
  -> Appointments
  -> Meetings
  -> Notes
  -> Tasks
  -> Documents
  -> Forms
  -> Communications
  -> Opportunities
  -> Insurance Reviews
  -> Investment Reviews
  -> Events

Household
  -> Primary Client
  -> Spouse / Family Members
  -> Related Professionals
  -> Shared Documents
  -> Shared Tasks
  -> Shared Planning Reviews

Meeting
  -> Client / Household
  -> Appointment
  -> Participants
  -> AI Notes
  -> Action Items
  -> Follow-up Emails
  -> CRM Updates

Event
  -> RSVPs
  -> Attendees
  -> Guests
  -> Campaigns
  -> Emails
  -> SMS
  -> Follow-up Tasks
```

## Suggested Tables / Collections

### users

- id
- first_name
- last_name
- display_name
- email
- phone
- photo_url
- role_id
- status
- title
- department
- timezone
- calendar_connected
- email_connected
- sms_enabled
- created_at
- updated_at

### roles

- id
- role_name
- description
- permissions_json
- is_system_role
- created_at
- updated_at

### clients

- id
- household_id
- first_name
- last_name
- preferred_name
- email
- mobile_phone
- home_phone
- date_of_birth
- client_status
- client_type
- lead_source
- communication_preference
- sms_opt_in_status
- email_opt_in_status
- primary_advisor_id
- servicing_advisor_id
- client_service_associate_id
- notes_summary
- created_at
- updated_at

### households

- id
- household_name
- primary_client_id
- household_status
- address_line_1
- address_line_2
- city
- state
- postal_code
- timezone
- household_summary
- created_at
- updated_at

### contacts

- id
- contact_type
- first_name
- last_name
- company_name
- email
- phone
- relationship_to_client
- related_client_id
- related_household_id
- notes
- created_at
- updated_at

### appointments

- id
- meeting_type_id
- client_id
- household_id
- advisor_id
- title
- description
- location_type
- location_details
- start_time
- end_time
- timezone
- status
- external_calendar_event_id
- meeting_link
- created_by
- created_at
- updated_at

### meeting_types

- id
- name
- description
- duration_minutes
- default_location_type
- default_preparation_checklist
- default_followup_workflow_id
- is_client_bookable
- created_at
- updated_at

### meetings

- id
- appointment_id
- client_id
- household_id
- primary_advisor_id
- meeting_title
- meeting_date
- meeting_status
- agenda
- ai_summary
- advisor_notes
- client_visible_summary
- compliance_review_status
- created_at
- updated_at

### meeting_notes

- id
- meeting_id
- note_type
- note_body
- ai_generated
- reviewed_by_user_id
- approved_at
- created_at
- updated_at

### tasks

- id
- title
- description
- related_type
- related_id
- client_id
- household_id
- assigned_to_user_id
- created_by_user_id
- priority
- status
- due_date
- completed_at
- workflow_id
- created_at
- updated_at

### workflows

- id
- name
- description
- workflow_type
- default_owner_role
- trigger_type
- status
- created_at
- updated_at

### workflow_steps

- id
- workflow_id
- step_name
- step_type
- assigned_role
- due_offset_days
- template_id
- order_index
- created_at
- updated_at

### communications

- id
- communication_type
- direction
- client_id
- household_id
- related_type
- related_id
- from_user_id
- to_contact_id
- subject
- body
- status
- provider
- provider_message_id
- consent_snapshot_json
- created_at
- updated_at

### documents

- id
- title
- document_type
- client_id
- household_id
- related_type
- related_id
- file_url
- visibility
- status
- uploaded_by_user_id
- requires_review
- reviewed_by_user_id
- created_at
- updated_at

### events

- id
- title
- description
- event_type
- start_time
- end_time
- timezone
- location_type
- location_details
- capacity
- status
- registration_url
- created_by_user_id
- created_at
- updated_at

### event_rsvps

- id
- event_id
- client_id
- prospect_id
- contact_id
- attendee_name
- attendee_email
- attendee_phone
- guest_count
- rsvp_status
- checked_in_at
- followup_status
- created_at
- updated_at

### opportunities

- id
- client_id
- household_id
- opportunity_name
- opportunity_type
- stage
- estimated_value
- probability
- assigned_advisor_id
- lead_source
- next_step
- next_step_due_date
- status
- created_at
- updated_at

### audit_logs

- id
- actor_user_id
- action
- entity_type
- entity_id
- before_json
- after_json
- ip_address
- user_agent
- created_at

## Data Model Rules

- Most entities should support created_at and updated_at.
- Client-facing content should include visibility settings.
- AI-generated content should include ai_generated and review/approval fields.
- Communications should preserve consent status at time of send.
- Sensitive changes should create audit log records.
- Users should be soft-deleted or set inactive rather than hard-deleted.
