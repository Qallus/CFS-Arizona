# SIG360 Compliance and Audit Logs

## Purpose

SIG360 operates in a financial services environment. The system should track key actions, communication history, consent changes, document access, AI-generated content approvals, and client record changes.

## Audit Goals

- Show who changed what and when.
- Support compliance review.
- Preserve communication history.
- Track AI-generated content approvals.
- Track document access and uploads.
- Track SMS/email consent changes.
- Track user role/status changes.

## Audit Events to Track

- User created/edited/deactivated
- User role changed
- Client created/edited/archived
- Household created/edited/archived
- Advisor assignment changed
- Appointment created/rescheduled/canceled
- Meeting notes created/edited/approved
- AI summary generated
- AI summary approved
- Email drafted/sent
- SMS drafted/sent
- SMS opt-in/opt-out changed
- Document uploaded/downloaded/deleted
- Form submitted
- Workflow started/completed
- Task completed/reopened
- Event RSVP created/updated
- Portal login/access event where appropriate

## Audit Log Fields

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

## AI Content Review

AI-generated items should include:

- ai_generated = true
- generated_by_model
- generated_at
- reviewed_by_user_id
- review_status
- approved_at
- rejected_at
- rejection_reason

Review statuses:

- Draft
- Needs Review
- Approved
- Rejected
- Archived

## Compliance Review Queue

Add a queue for:

- AI-generated meeting summaries
- Client-facing recaps
- Email drafts
- SMS drafts
- Sensitive notes
- Document access concerns

## Codex Implementation Tasks

- Add audit log model.
- Add audit logging helper.
- Add audit log viewer.
- Add filters by user, entity, date, action.
- Add AI review status fields.
- Add compliance review queue.
- Add communication consent snapshots.
