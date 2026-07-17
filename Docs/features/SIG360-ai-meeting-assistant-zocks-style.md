# SIG360 AI Meeting Assistant — Zocks-Style Workflow

## Purpose

This module gives SIG360 an AI meeting assistant for financial advisors.

The assistant should help before, during, and after client meetings by preparing advisors, capturing notes, extracting action items, drafting follow-ups, and suggesting CRM updates.

## Core Concept

Every appointment should be able to become a structured meeting record.

The meeting assistant should support:

- Pre-meeting prep
- Agenda creation
- Live notes or post-meeting notes
- AI summary
- Action item extraction
- CRM update suggestions
- Follow-up email draft
- Task creation
- Compliance review
- Client-visible recap

## Meeting Lifecycle

### 1. Before Meeting

Generate a prep brief that includes:

- Client/household overview
- Advisor team
- Last meeting summary
- Recent emails/SMS/calls
- Open tasks
- Open documents/forms
- Important dates
- Current planning focus
- Insurance review notes
- Investment review notes
- Suggested agenda
- Suggested questions
- Potential follow-up opportunities

### 2. During Meeting

Support one or more modes:

- Manual note-taking
- AI-assisted note-taking
- Uploaded transcript summary
- Realtime voice note capture in future phase

Required visible states:

- Meeting not started
- Notes in progress
- AI processing
- Draft ready for review
- Approved
- Archived

### 3. After Meeting

AI should generate:

- Internal meeting summary
- Client-facing recap
- Action items
- Suggested CRM field updates
- Suggested tasks
- Suggested follow-up email
- Suggested SMS, if compliant and opted-in
- Suggested next meeting type
- Suggested workflow trigger

## AI Output Types

### Internal Summary

For advisor/team only.

Should include:

- Main topics discussed
- Client concerns
- Planning opportunities
- Decisions made
- Open questions
- Risk/compliance considerations
- Advisor notes

### Client Recap

Polished client-safe version.

Should include:

- Thank-you intro
- Summary of what was discussed
- Action items for SIG
- Action items for client
- Documents needed
- Next steps
- Next appointment details if known

### Action Items

Each action item should include:

- Title
- Description
- Owner
- Related client/household
- Due date
- Priority
- Category
- Client-visible toggle

### CRM Update Suggestions

AI should suggest but not automatically apply updates unless enabled.

Examples:

- Update phone number
- Update email
- Add spouse/child
- Add CPA/attorney
- Update preferred contact method
- Update planning priority
- Add insurance review date
- Add investment review due date

## Suggested Meeting Types

- Discovery Meeting
- Client Review Meeting
- Annual Review
- Retirement Income Review
- Investment Review
- Insurance Review
- Estate Planning Discussion
- New Client Onboarding
- Event Follow-Up
- Referral Introduction
- Service Request Meeting

## Data Model Fields

### ai_meeting_sessions

- id
- meeting_id
- appointment_id
- client_id
- household_id
- status
- input_type
- transcript_text
- raw_notes
- ai_summary
- client_recap
- action_items_json
- crm_suggestions_json
- followup_email_draft
- followup_sms_draft
- reviewed_by_user_id
- approved_at
- created_at
- updated_at

## Compliance Rules

- AI-generated content should default to Draft.
- Client-facing content requires advisor review.
- CRM field updates should require confirmation.
- Audio/transcripts should follow firm retention policy.
- Store who approved each AI-generated note or email.
- Do not send AI-generated email/SMS automatically unless explicitly approved.

## UI Components

- Meeting Prep Card
- Agenda Builder
- Notes Editor
- AI Summary Panel
- Action Items Review Table
- CRM Suggestions Review Table
- Follow-Up Email Draft Panel
- Client Recap Preview
- Approval Status Badge

## Codex Implementation Tasks

- Add meeting assistant route/page.
- Add meeting session data model.
- Add generate prep brief action.
- Add generate summary action.
- Add extract action items action.
- Add draft follow-up email action.
- Add create tasks from approved action items.
- Add apply approved CRM updates.
- Add approval/review workflow.
- Add audit logs for generated and approved content.
