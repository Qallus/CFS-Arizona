# SIG360 Integrations and Architecture

## Purpose

This document defines the recommended integration architecture for SIG360.

SIG360 should be built so it can connect to current and future systems without locking the product into one vendor.

## Likely Integrations

- Microsoft Outlook / Microsoft 365 email
- Microsoft calendar
- Teams meeting links
- Twilio SMS and voice
- Resend email delivery
- Fluent Booking / WordPress data if needed
- Redtail CRM import/sync in future phase
- Financial planning tools in future phase
- Portfolio systems in future phase
- Document storage provider
- AI model providers

## Integration Principles

- Keep provider logic separate from business logic.
- Store external IDs when syncing data.
- Preserve audit history.
- Never assume SMS/email delivery equals client consent.
- Use retry and failure logging.
- Keep API keys in environment variables.
- Do not expose secrets to the browser.

## Suggested Environment Variables

```txt
DATABASE_URL=
APP_URL=
NEXT_PUBLIC_APP_URL=
OPENAI_API_KEY=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

## Provider Abstraction

Create services such as:

- emailService
- smsService
- calendarService
- documentStorageService
- aiService
- auditLogService
- notificationService

## AI Architecture

AI should support:

- Meeting prep generation
- Meeting summary generation
- Task extraction
- Email drafting
- SMS drafting
- Client profile summary
- Document/form extraction

All AI actions should return structured JSON where possible.

## Codex Implementation Tasks

- Create `/lib/services` for provider services.
- Create `/lib/ai` for prompts and structured outputs.
- Create `/lib/audit` for audit logging.
- Create `/lib/permissions` for access checks.
- Add error logging and retry handling.
- Add integration status page.
