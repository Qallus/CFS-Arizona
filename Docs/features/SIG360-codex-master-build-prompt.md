# SIG360 Codex Master Build Prompt

Use this prompt when asking Codex to build or modify SIG360.

```txt
You are working inside the SIG360 webapp project for Strategic Income Group.

Before coding, review the files inside AI.SIG360/docs. Treat these files as the source of truth for product direction, naming, data relationships, user roles, client/household CRM, booking, events, meetings, AI assistant features, marketing, SMS/email, compliance, documents, workflows, and reporting.

Build SIG360 as a role-based advisor operations platform inspired by advisor CRM systems like Redtail CRM and AI advisor assistants like Zocks, but do not clone either product. SIG360 is a private Strategic Income Group platform.

Primary goals:
- Manage clients and households.
- Connect each client to advisors, service team members, appointments, tasks, documents, meetings, workflows, events, emails, SMS, and opportunities.
- Add Redtail-style CRM workflows, activities, tasks, calendar, reporting, and relationship tracking.
- Add Zocks-style AI meeting prep, meeting notes, action item extraction, CRM update suggestions, and follow-up email drafts.
- Add secure client portal features.
- Add marketing, email, SMS, event, and communication tracking.
- Add user management with roles, invites, status, photos, permissions, and audit logs.

Implementation rules:
1. Do not hard-code sample data unless needed for seed/demo files.
2. Keep components reusable.
3. Keep provider integrations abstracted behind service files.
4. All client-facing content must respect permissions and visibility rules.
5. All sensitive CRM changes must create audit log records.
6. AI-generated content must default to draft/review status.
7. SMS must respect opt-in/opt-out fields.
8. Email and SMS communications must connect back to clients, households, campaigns, events, tasks, or meetings when possible.
9. Add TypeScript types/interfaces where appropriate.
10. Add clear validation and error handling.

Start by identifying the current app structure. Then create a phased implementation plan before making code changes.

Recommended build sequence:
Phase 1: Data models, permissions, and navigation.
Phase 2: User management and role-based dashboards.
Phase 3: Client and household CRM.
Phase 4: Appointments, booking, events, and RSVPs.
Phase 5: Tasks, workflows, and advisor activity tracking.
Phase 6: AI meeting assistant and follow-up drafts.
Phase 7: Documents, forms, and client portal.
Phase 8: Marketing, email, SMS, and compliance logs.
Phase 9: Reporting and integrations.
```
