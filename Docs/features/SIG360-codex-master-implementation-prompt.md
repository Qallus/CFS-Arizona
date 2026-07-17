# SIG360 — Codex Master Implementation Prompt

## Purpose

Use this prompt in Codex after adding the SIG360 docs folder to the project.

Recommended location:

```txt
/AI.SIG360/docs/SIG360-codex-master-implementation-prompt.md
```

## Prompt

You are working inside the SIG360 webapp codebase for Strategic Income Group.

Before writing code, review the documentation files inside:

```txt
/AI.SIG360/docs/
```

Read these files first, in this order:

1. `SIG360-product-source-of-truth.md`
2. `SIG360-user-management-roles-permissions.md`
3. `SIG360-client-management-crm.md`
4. `SIG360-booking-events-appointment-management.md`
5. `SIG360-frontend-booking-client-portal.md`
6. `SIG360-backend-architecture-data-models.md`
7. `SIG360-project-task-workflow-management.md`
8. `SIG360-marketing-email-sms-communications.md`
9. `SIG360-ai-agents-realtime-voice.md`

Your job is to implement SIG360 as a Strategic Income Group internal and client-facing webapp. This is not a construction CRM and should not use Constructed Matter, CMI, Buildertrend, subcontractor, punch list, jobsite, change order, or construction-specific language unless a legacy file requires migration.

Use Strategic Income Group language:

- Clients
- Prospects
- Households
- Financial Planners
- Advisors
- Writing Advisors
- Servicing Advisors
- Client Service Associates
- Appointments
- Events
- RSVP
- Planning Tasks
- Wealth Management
- Investment Planning
- Insurance Planning
- Retirement Planning
- Client Journey
- Marketing Campaigns
- Email
- SMS
- AI Agents

## Implementation Instructions

1. Inspect the existing app structure before creating new folders.
2. Reuse existing components, layouts, auth patterns, database utilities, and API conventions where possible.
3. Do not duplicate functionality if a module already exists.
4. If existing names are construction-specific, propose a safe rename plan before changing large areas.
5. Build in phases and keep the app working after each phase.
6. Add clear TypeScript types or schema definitions.
7. Add role-based permissions at both API and UI levels.
8. Add activity logging for key actions.
9. Add consent checks before SMS sending.
10. Treat AI output as drafts that require review before sending to clients.

## Phase 1 Build Target

Start with these modules:

- User Management
- Client Management
- Appointments
- Events / RSVP
- Tasks
- Communications Log
- Consent Records

## Phase 2 Build Target

Add:

- Booking Pages
- Client Portal Dashboard
- Event Pages
- Reminder Templates
- Email/SMS Template Preview
- Planner Assignment Workflows

## Phase 3 Build Target

Add:

- Marketing Campaigns
- Workflow Templates
- AI Draft Assistant
- Meeting Prep Summary
- Reports

## Required Review Before Coding

After reading the docs, provide:

1. A short summary of the existing app structure.
2. What already exists that maps to the SIG360 docs.
3. What needs to be created.
4. Any risky rename/migration areas.
5. A phased implementation plan.
6. The first safe code changes to make.

Then begin implementation only after the plan is clear.

## Quality Bar

The SIG360 webapp should feel polished, modern, and professional. Use clean dashboard UI patterns, strong empty states, loading states, form validation, filters, search, status badges, and reusable components.

Do not leave placeholder construction terms in the user-facing UI.
