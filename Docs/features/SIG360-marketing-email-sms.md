# SIG360 Marketing, Email, and SMS Communications

## Purpose

This module manages marketing campaigns, client communication, email templates, SMS messaging, event campaigns, newsletter campaigns, and communication history.

## Core Goals

- Centralize email and SMS history.
- Connect communications to clients, households, events, campaigns, and tasks.
- Support compliant SMS opt-in/opt-out.
- Give marketing a clean campaign builder.
- Give advisors approved templates and AI drafts.
- Track engagement and follow-up needs.

## Communication Types

- Email
- SMS
- Phone Call Note
- Meeting Note
- Internal Note
- Portal Message
- Event Reminder
- Campaign Message

## Campaign Types

- Monthly Strategic Insights
- Client Journey Series
- Birthday Campaign
- Event Invitation
- Event Reminder
- Post-Event Follow-Up
- Retirement Planning Campaign
- Insurance Review Campaign
- Investment Review Campaign
- Referral Partner Campaign
- Prospect Nurture Campaign
- Client Appreciation Campaign

## Segments

Recommended segments:

- Active Clients
- Prospects
- Event Attendees
- Pre-Retirees
- Retirees
- Insurance Planning
- Investment Management
- Business Owners
- Referral Partners
- Birthday This Month
- Annual Review Due
- Recently Attended Event
- SMS Opted-In
- Email Opted-In

## Email Template Fields

- Template Name
- Subject
- Preview Text
- Body HTML/Text
- Category
- Personalization Fields
- Compliance Footer
- Status
- Created By
- Approved By

## SMS Template Fields

- Template Name
- Message Body
- Category
- Opt-Out Language
- Status
- Created By
- Approved By

## SMS Compliance Rules

- Do not send SMS unless contact is opted in.
- Store opt-in source, date, and consent language when possible.
- Respect STOP/HELP handling.
- Keep a history of SMS consent changes.
- Store consent snapshot with each SMS send.
- Include approved opt-out language where appropriate.

## Communication Center

Should include:

- Unified inbox/history
- Filters by client, household, campaign, advisor, date, type
- Email drafts
- SMS drafts
- Sent messages
- Failed messages
- Opt-in status
- Communication preferences

## AI Features

AI should help draft:

- Meeting follow-up email
- Client recap email
- Event invitation
- Event reminder
- Post-event thank-you
- Birthday email
- Document request
- Referral thank-you
- Insurance review reminder
- Investment review reminder

AI-generated communications should default to Draft and require review before sending.

## Codex Implementation Tasks

- Build communication history table.
- Build email template manager.
- Build SMS template manager.
- Build campaign list/detail pages.
- Build segment manager.
- Add opt-in/opt-out tracking.
- Add send/draft status handling.
- Add AI draft generation hooks.
- Add compliance/audit logging.
