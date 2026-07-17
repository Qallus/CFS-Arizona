# SIG360 Codex Docs — Redtail + Zocks Inspired Build Pack

## Purpose

This folder is the source-of-truth documentation pack for building the SIG360 webapp inside VS Code with Codex.

SIG360 is the internal and client-facing operating system for Strategic Income Group. It should combine the strengths of advisor CRM systems, AI meeting intelligence, booking, client management, marketing automation, communication tracking, and team workflows.

This documentation should guide Codex when building features for:

- Strategic Income Group team members
- Financial planners and advisors
- Client service associates
- Marketing team members
- Admins and leadership
- Clients and households
- Prospects, event attendees, and referral partners

## Product Direction

SIG360 should feel like a private, custom-built advisor platform for Strategic Income Group.

The system should support:

- Client and household CRM
- Advisor/team assignment
- Appointment booking
- Event management
- Meeting prep
- AI meeting notes
- Follow-up emails
- Task and workflow automation
- Client portal features
- Email and SMS tracking
- Compliance/audit history
- Documents and forms
- Marketing campaigns
- Referral tracking
- Insurance and investment review workflows
- AI assistant features for the SIG team

## How Codex Should Use These Docs

Codex should treat these files as implementation guides, not marketing copy.

When building features:

1. Read `SIG360-product-source-of-truth.md` first.
2. Review the specific module file before coding.
3. Preserve SIG360 naming, roles, and data model intent.
4. Build reusable components and API patterns.
5. Keep all client-facing features permission-aware.
6. Include audit logging for sensitive CRM actions.
7. Keep AI-generated content in draft/review status until approved.

## Suggested Folder Placement

Place this folder in:

```txt
AI.SIG360/docs/
```

Suggested VS Code layout:

```txt
AI.SIG360/
  docs/
    README-SIG360-CODEX-DOCS.md
    SIG360-product-source-of-truth.md
    SIG360-data-model-map.md
    SIG360-client-household-crm.md
    SIG360-ai-meeting-assistant-zocks-style.md
    SIG360-redtail-style-crm-workflows.md
    SIG360-user-management-roles-permissions.md
    SIG360-booking-appointments-events.md
    SIG360-client-portal.md
    SIG360-marketing-email-sms.md
    SIG360-compliance-audit-logs.md
    SIG360-documents-forms-vault.md
    SIG360-insurance-investment-review-modules.md
    SIG360-referrals-opportunities-pipeline.md
    SIG360-dashboard-reporting.md
    SIG360-integrations-architecture.md
    SIG360-codex-master-build-prompt.md
```
