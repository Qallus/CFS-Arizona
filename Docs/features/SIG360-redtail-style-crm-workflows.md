# SIG360 Redtail-Style CRM Workflows

## Purpose

This document defines repeatable workflow automation for SIG360.

The goal is to give Strategic Income Group a consistent process for client onboarding, meeting follow-up, reviews, service requests, events, marketing, birthdays, referrals, and advisor accountability.

## Workflow Principles

- Workflows should create repeatable task sequences.
- Workflows should assign tasks by role or specific user.
- Workflows should connect to clients, households, meetings, appointments, opportunities, and events.
- Workflows should support due date offsets.
- Workflows should show progress.
- Workflows should create an audit trail.

## Core Workflow Types

### New Lead Workflow

Steps:

1. Review lead source.
2. Assign advisor.
3. Send intro email.
4. Create discovery call task.
5. Schedule discovery meeting.
6. Update lead status.
7. Add to nurture campaign if not ready.

### New Client Onboarding Workflow

Steps:

1. Create household.
2. Confirm contact information.
3. Assign advisor team.
4. Send welcome email.
5. Request onboarding documents.
6. Schedule onboarding meeting.
7. Complete client profile fields.
8. Create planning review tasks.
9. Add client to applicable marketing lists.

### Annual Review Workflow

Steps:

1. Identify client due for review.
2. Create review appointment task.
3. Generate meeting prep brief.
4. Request updated documents.
5. Hold review meeting.
6. Generate meeting summary.
7. Create follow-up tasks.
8. Draft client recap email.
9. Update next review date.

### Insurance Review Workflow

Steps:

1. Confirm current policies.
2. Request policy documents.
3. Review coverage details.
4. Create advisor analysis task.
5. Schedule insurance review meeting.
6. Draft recommendations/follow-up.
7. Set next review date.

### Investment Review Workflow

Steps:

1. Confirm review due date.
2. Prepare investment review notes.
3. Add agenda items.
4. Schedule review meeting.
5. Capture meeting notes.
6. Create follow-up tasks.
7. Update next review date.

### Birthday Workflow

Steps:

1. Identify birthday two days away.
2. Draft/send birthday email.
3. Notify assigned advisor.
4. Create optional personal touchpoint task.
5. Log birthday communication.

### Event RSVP Workflow

Steps:

1. RSVP received.
2. Create/update attendee record.
3. Send confirmation email.
4. Send reminder email/SMS if opted in.
5. Check in attendee.
6. Create post-event follow-up task.
7. Add attendee to appropriate campaign.

### Meeting Follow-Up Workflow

Steps:

1. Meeting completed.
2. Generate notes.
3. Review AI summary.
4. Create tasks from action items.
5. Draft follow-up email.
6. Send approved follow-up.
7. Schedule next appointment if needed.

## Workflow Data Model

### workflows

- id
- name
- description
- workflow_type
- trigger_type
- default_owner_user_id
- default_owner_role
- status
- created_at
- updated_at

### workflow_steps

- id
- workflow_id
- step_name
- step_description
- step_type
- assigned_user_id
- assigned_role
- due_offset_days
- template_id
- sort_order
- required
- created_at
- updated_at

### workflow_runs

- id
- workflow_id
- related_type
- related_id
- client_id
- household_id
- status
- started_by_user_id
- started_at
- completed_at
- created_at
- updated_at

### workflow_run_steps

- id
- workflow_run_id
- workflow_step_id
- assigned_to_user_id
- status
- due_date
- completed_at
- notes
- created_at
- updated_at

## Workflow UI

Pages:

- Workflow Templates
- Active Workflows
- Workflow Detail
- My Workflow Tasks
- Workflow Reports

Components:

- Workflow progress bar
- Step checklist
- Assigned role badge
- Due date badge
- Status badge
- Start workflow button
- Complete step button

## Codex Implementation Tasks

- Build workflow template CRUD.
- Build workflow run system.
- Add workflow task generation.
- Add workflow progress display.
- Add workflow triggers from appointments, events, clients, and birthdays.
- Add workflow reports.
