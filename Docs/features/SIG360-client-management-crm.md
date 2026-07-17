# SIG360 — Client Management CRM

## File Purpose

This document defines the SIG360 client management system, including clients, prospects, households, planner assignments, planning categories, relationships, notes, documents, communications, activity timelines, tasks, appointments, and events.

Recommended location:

```txt
/AI.SIG360/docs/SIG360-client-management-crm.md
```

## Feature Overview

Client Management is the heart of SIG360. The platform should give the SIG team one clear place to understand who the client is, who serves them, what has happened, what is scheduled next, what tasks are open, and what communications have been sent.

The client record should function like a financial services CRM profile and a relationship timeline.

## Recommended Navigation

```txt
Dashboard > Clients
Dashboard > Contacts
Dashboard > Households
```

Sub-navigation:

- All Clients
- Prospects
- Households
- Assigned to Me
- Recently Updated
- Upcoming Reviews
- Birthdays
- Client Journey
- Import / Export

## Client Record Sections

Each client profile should include:

- Profile Summary
- Household
- Assigned SIG Team
- Contact Information
- Client Status
- Planning Categories
- Appointment History
- Upcoming Appointments
- Event Attendance
- Open Tasks
- Completed Tasks
- Documents
- Forms
- Notes
- Communication History
- Marketing Preferences
- SMS Consent
- Activity Timeline
- AI Summary

## Client Fields

Suggested fields:

- id
- client_number_optional
- first_name
- last_name
- preferred_name
- email
- mobile_phone
- home_phone
- work_phone
- profile_photo_url
- mailing_address
- city
- state
- zip
- household_id
- spouse_partner_id
- client_status
- lifecycle_stage
- lead_source
- assigned_planner_id
- writing_advisor_id
- servicing_advisor_id
- client_service_associate_id
- birthday
- anniversary_optional
- occupation_optional
- employer_optional
- retirement_status
- risk_profile_optional
- planning_interests
- communication_preferences
- sms_opt_in_status
- email_opt_in_status
- last_contacted_at
- next_review_date
- created_at
- updated_at

## Client Statuses

Recommended statuses:

- Prospect
- Discovery Scheduled
- Discovery Completed
- Active Client
- Review Due
- Onboarding
- Service Only
- Inactive
- Archived

## Lifecycle Stages

Recommended lifecycle stages:

- New Lead
- Discovery
- Qualified Prospect
- Planning Process
- Client Onboarding
- Active Relationship
- Annual Review
- Ongoing Service
- Retention / Re-Engagement

## Planning Categories

Use these categories to organize client needs, tasks, forms, meetings, and documents:

- Retirement Planning
- Investment Management
- Insurance Planning
- Wealth Management
- Estate Planning
- Tax Planning Coordination
- Income Planning
- Cash Flow Planning
- Long-Term Care Planning
- Medicare Planning
- Business Owner Planning
- Legacy / Beneficiary Planning
- Charitable Giving
- Education Planning

## Household Management

A household groups related clients and family members.

Suggested household fields:

- id
- household_name
- primary_client_id
- secondary_client_id
- household_status
- assigned_planner_id
- servicing_advisor_id
- mailing_address
- notes
- created_at
- updated_at

Household should connect to:

- Clients
- Contacts
- Appointments
- Events
- Documents
- Planning tasks
- Communication history
- Marketing segmentation

## Assigned SIG Team

Each client should be able to connect to:

- Primary Financial Planner
- Writing Advisor
- Servicing Advisor
- Client Service Associate
- Marketing Owner optional
- Operations Owner optional

Show these in a clean `Client Team` card with profile photos, titles, email, phone, and quick actions.

## Notes and Activity Timeline

The activity timeline should show:

- Notes added
- Appointment booked
- Appointment completed
- Event RSVP submitted
- Event attended
- Email sent
- SMS sent
- Form submitted
- Document uploaded
- Task created
- Task completed
- Planner assignment changed
- Client status changed
- Portal invite sent
- Portal invite accepted

## Client Tasks

Client tasks should be able to connect to:

- Client
- Household
- Planner
- Appointment
- Event
- Document
- Form
- Planning category
- Marketing campaign
- Workflow template

Example client tasks:

- Follow up after discovery call
- Prepare annual review notes
- Send birthday message
- Request updated beneficiary info
- Confirm RSVP
- Review insurance planning needs
- Schedule investment review
- Send cash & expense worksheet
- Confirm document upload

## Client Forms

Forms may include:

- Contact Update Form
- Discovery Intake Form
- Event RSVP Form
- Appointment Request Form
- SMS Opt-In Form
- SMS Opt-Out Form
- Client Profile Update Form
- Risk/Planning Questionnaire Placeholder
- Cash & Long-Term Expense Review Form Placeholder

## Client Documents

Client documents should support:

- Upload
- Category
- Description
- Assigned client/household
- Visibility: internal only or client visible
- Uploaded by
- Date uploaded
- Version history if needed
- Secure download

Recommended categories:

- Intake
- Planning
- Investment
- Insurance
- Estate
- Tax Coordination
- Meeting Notes
- Event Materials
- Worksheets
- Signed Forms
- Other

## Communication Preferences

Track:

- Email opt-in
- SMS opt-in
- Phone call preference
- Preferred contact method
- Preferred meeting type
- Marketing opt-in
- Service notification opt-in
- Last consent date
- Consent source
- Opt-out date

## Client Search and Filters

Filters:

- Status
- Lifecycle stage
- Assigned planner
- Servicing advisor
- Client service associate
- Planning category
- Upcoming review date
- Birthday month
- SMS opt-in status
- Email opt-in status
- Event attendance
- Recent activity

## Client Dashboard View

Client-facing records should only show approved information:

- Upcoming appointments
- Booking options
- Events
- Approved documents
- Assigned team
- Forms to complete
- Communication preferences
- Profile details

Never expose internal notes, internal task comments, planner-only notes, or backend workflow status unless explicitly marked as client visible.

## Codex Implementation Notes

- Build client and contact records so they can become portal users later.
- Use households to group spouses/families.
- Make planner assignments first-class fields.
- Every important client action should write to an activity timeline.
- Design the client profile page as a modular dashboard with cards and tabs.
- Keep financial advice and AI-generated recommendations out of automated client-facing output unless reviewed and approved.
