# SIG360 Client and Household CRM

## Purpose

This module is the core CRM for Strategic Income Group.

It should allow the SIG team to manage clients, prospects, households, family members, professional contacts, advisor assignments, notes, tasks, meetings, documents, and communications.

## Primary Goals

- Centralize every client relationship.
- Organize clients by household.
- Connect each client to their advisor team.
- Track meetings, notes, documents, tasks, and communications.
- Support client lifecycle stages from prospect to active client.
- Give advisors a fast client snapshot before every meeting.

## Client Profile Sections

Each client profile should include:

- Header with client name, status, photo/avatar, household, and assigned advisor team
- Contact information
- Household members
- Related professionals
- Important dates
- Communication preferences
- SMS/email consent status
- Client timeline
- Notes
- Open tasks
- Appointments
- Meeting summaries
- Documents
- Forms
- Opportunities
- Insurance reviews
- Investment reviews
- Marketing segments
- Audit history

## Household Profile Sections

Each household profile should include:

- Household name
- Primary client
- Spouse/partner
- Children/dependents
- Related clients
- Shared address
- Household advisor team
- Household timeline
- Shared planning notes
- Shared documents
- Family relationship map
- Planning priorities
- Open tasks
- Upcoming meetings

## Client Statuses

Recommended statuses:

- Prospect
- New Lead
- Discovery Scheduled
- Discovery Completed
- Onboarding
- Active Client
- Review Needed
- Service Needed
- Inactive
- Archived
- Deceased

## Household Statuses

Recommended statuses:

- Prospect Household
- Active Household
- Planning Review Due
- Service Attention Needed
- Inactive
- Archived

## Client Types

- Individual
- Couple
- Family
- Business Owner
- Retiree
- Pre-Retiree
- Referral Partner
- Event Attendee
- Professional Contact

## Advisor Team Fields

Each client and household should support:

- Primary Advisor
- Writing Advisor
- Servicing Advisor
- Client Service Associate
- Insurance Specialist
- Marketing Owner
- Backup Advisor

## Client Timeline

The timeline should show:

- Meetings
- Appointments
- Calls
- Emails
- SMS messages
- Notes
- Tasks
- Documents uploaded
- Forms submitted
- Event RSVPs
- Marketing campaign activity
- Workflow step completions
- AI summaries
- Audit-sensitive updates

## Relationship Mapping

Support relationships such as:

- Spouse
- Child
- Parent
- Sibling
- Trustee
- Beneficiary
- CPA
- Attorney
- Insurance Agent
- Business Partner
- Referral Source
- Friend
- Other

## Forms Required

### Create/Edit Client Form

Fields:

- First Name
- Last Name
- Preferred Name
- Email
- Mobile Phone
- Date of Birth
- Address
- Client Status
- Client Type
- Household
- Advisor Team
- Communication Preference
- SMS Consent
- Email Consent
- Notes

### Create/Edit Household Form

Fields:

- Household Name
- Primary Client
- Household Members
- Address
- Advisor Team
- Household Status
- Notes

### Relationship Form

Fields:

- Related Client / Contact
- Relationship Type
- Notes
- Visibility

## AI Features

Add AI support for:

- Client profile summary
- Household summary
- Last interaction summary
- Missing information detection
- Suggested next action
- Meeting preparation brief
- Follow-up recommendations

## Permissions

- Super Admin can view and manage all clients.
- Advisors can view assigned clients and households.
- Client Service can manage service tasks and client details.
- Marketing can view marketing-safe fields and segments.
- Clients can only view their own portal-safe profile data.

## Codex Implementation Tasks

- Build client list page.
- Build household list page.
- Build client detail page.
- Build household detail page.
- Add search, filters, and status badges.
- Add relationship mapping.
- Add advisor team assignment.
- Add timeline component.
- Add create/edit forms.
- Add API routes/server actions.
- Add audit logs for sensitive changes.
