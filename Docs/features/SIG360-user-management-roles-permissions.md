# SIG360 User Management, Roles, Invites, Photos, and Permissions

## Purpose

This module manages SIG360 team users, client users, external portal users, permissions, statuses, profile photos, invites, role-based access, and user relationships across the platform.

Users should connect to everything inside SIG360, including:

* Clients
* Households
* Contacts
* Leads
* Prospects
* Appointments
* Meetings
* Tasks
* Workflows
* Notes
* Documents
* Events
* Campaigns
* Communications
* Opportunities
* AI Agent activity
* Audit logs

The goal is to create a secure role and permission system that allows each user to access only the tools, records, dashboards, workflows, and data they are allowed to see.

This module should support internal SIG team users, external client portal users, limited-access partners, investment committee submissions, prospects, event guests, and read-only compliance/review users.

---

## Core Requirements

SIG360 should support:

* User list page
* User profile page
* Invite user form
* Add user manually form
* Edit user form
* Profile photo upload
* Role selection
* Permission-based access
* User status controls
* Assigned client relationships
* Assigned household relationships
* Assigned planner relationships
* Assigned servicing advisor relationships
* Assigned task views
* Invite email flow
* Activity history
* Audit logs for role/status changes
* Route protection
* API/server action protection
* AI Agent permission protection

Do not rely only on frontend visibility. Permissions must be enforced in routes, server actions, API calls, and database access where applicable.

---

# User Types

SIG360 should organize users into two main groups:

1. Internal Users
2. External Users

Some records, such as Contacts and Leads, may exist in the CRM without having login access.

---

## Internal Users

Internal users are SIG team members or approved operational users.

Recommended internal roles:

* Super Admin
* Owner / Leadership
* Admin
* Financial Planner
* Writing Advisor
* Servicing Advisor
* Planner Administrator
* Client Service Associate
* Marketing Manager
* Event Coordinator
* Compliance Reviewer
* Support / Operations
* Read-Only / Auditor

---

## External Users

External users are people outside the SIG team who may have limited portal access.

Recommended external roles:

* Client
* Household Member
* Prospect
* Referral Partner
* Professional Partner
* Investment Committee
* Vendor / Partner
* Event Guest

---

## Record Types That May Not Need Login Access

These may exist as CRM or workflow records without becoming full users.

* Contact
* Lead
* Opportunity
* Campaign Subscriber
* Event Attendee

A Contact or Lead should only become a portal user if SIG intentionally invites them.

---

# Recommended Role Values

Use lowercase, stable role values for the database and permission system.

```text
super_admin
owner_leadership
admin
financial_planner
writing_advisor
servicing_advisor
planner_administrator
client_service_associate
marketing_manager
event_coordinator
compliance_reviewer
support_operations
client
household_member
prospect
referral_partner
professional_partner
investment_committee
vendor_partner
event_guest
read_only
```

Optional record-only values:

```text
contact
lead
opportunity
campaign_subscriber
event_attendee
```

---

# User Statuses

Recommended user statuses:

```text
invited
active
pending_setup
pending_review
suspended
inactive
archived
deleted
```

Display labels:

* Invited
* Active
* Pending Setup
* Pending Review
* Suspended
* Inactive
* Archived
* Deleted

For financial services, prefer **Archived** over hard delete when records, audit history, client history, compliance history, or communication history should be preserved.

---

# User Profile Fields

Each user profile should support:

* First Name
* Last Name
* Display Name
* Email
* Phone
* Mobile Phone
* Profile Photo
* Role
* Role Label
* Title
* Department
* Bio
* Calendar Link
* Timezone
* Status
* Assigned Planner
* Assigned Servicing Advisor
* Assigned Clients
* Assigned Households
* Assigned Tasks
* Assigned Events
* Company
* Household
* Client ID
* Contact ID
* Lead ID
* Prospect ID
* Is Internal User
* Is External User
* Can Login
* Created By
* Created At
* Updated At
* Last Login

Suggested database fields:

```text
id
user_id
first_name
last_name
display_name
email
phone
mobile_phone
profile_photo_url
role
role_label
title
department
bio
calendar_link
timezone
status
assigned_planner_id
assigned_servicing_advisor_id
company_id
household_id
client_id
contact_id
lead_id
prospect_id
is_internal_user
is_external_user
can_login
created_by
created_at
updated_at
last_login_at
```

---

# User Actions

Super Admin and approved Admin users should be able to:

* Invite user
* Add user manually
* Edit user
* Upload/change photo
* Change role
* Change status
* Suspend user
* Archive/remove user
* Reset invite
* Resend invite
* Assign clients
* Assign households
* Assign tasks
* Assign events
* Assign planner role
* Assign servicing advisor role
* View activity history
* View role/status change history
* View user audit logs

---

# Invite Flow

1. Admin enters name, email, role, and optional title.
2. System creates user with `invited` status.
3. System sends invite email.
4. User accepts invite.
5. User sets password/auth method.
6. User completes profile.
7. Status changes to `active`.

Optional additional steps:

* Require profile photo upload
* Require phone number
* Require timezone selection
* Require assigned advisor confirmation
* Require compliance approval for certain external users
* Require Super Admin approval for Investment Committee, Vendor / Partner, or Read-Only access

---

# Role Hierarchy

```text
Super Admin
  └── Owner / Leadership
        └── Admin
              ├── Financial Planner
              ├── Writing Advisor
              │     └── Servicing Advisor
              │           └── Planner Administrator
              ├── Client Service Associate
              ├── Marketing Manager
              ├── Event Coordinator
              ├── Compliance Reviewer
              ├── Support / Operations
              └── Read-Only / Auditor

External / Limited Access
  ├── Client
  ├── Household Member
  ├── Prospect
  ├── Referral Partner
  ├── Professional Partner
  ├── Investment Committee
  ├── Vendor / Partner
  └── Event Guest
```

---

# Role Definitions and Permissions

## 1. Super Admin

### Purpose

Super Admin has full control over SIG360.

### Access

Super Admin can access:

* Full dashboard
* All users
* All clients
* All households
* All contacts
* All leads
* All prospects
* All appointments
* All meetings
* All tasks
* All workflows
* All notes
* All documents
* All events
* All marketing campaigns
* All communications
* All reports
* All settings
* All integrations
* All AI Agent settings
* Audit logs
* Role and permission management

### Permissions

Super Admin can:

* Create users
* Invite users
* Edit users
* Suspend users
* Archive users
* Delete users when allowed
* Assign roles
* Change permissions
* Assign clients to advisors
* Assign households to advisors
* Assign servicing advisors to planners
* View all client activity
* Create and manage events
* Create and manage marketing campaigns
* Approve outbound communication
* Configure integrations
* Manage AI Agent settings
* View audit trails
* Export data

---

## 2. Owner / Leadership

### Purpose

Owner / Leadership users need firm-wide visibility without necessarily having every system-level permission.

### Access

Owner / Leadership can access:

* Leadership dashboard
* Reports
* Clients
* Households
* Meetings
* Opportunities
* Campaigns
* Events
* Team workload
* Assigned advisor activity
* Firm-wide activity summaries
* AI summaries, if allowed
* Audit history, if allowed

### Permissions

Owner / Leadership can:

* View dashboards
* View reports
* View firm activity
* View team workload
* View client and household summaries
* Review campaign performance
* Review appointment and event activity
* Review opportunities and pipeline
* Export approved reports, if allowed

### Restrictions

Owner / Leadership should not automatically be able to:

* Delete users
* Modify system integrations
* Change global role permissions
* Change billing settings
* Access restricted compliance settings unless granted
* Send communications on behalf of other users unless permitted

---

## 3. Admin

### Purpose

Admin users help manage SIG360 operations, users, appointments, events, clients, documents, workflows, and general platform activity.

### Access

Admin can access:

* Team dashboard
* Users, limited
* Clients
* Households
* Contacts
* Leads
* Prospects
* Appointments
* Meetings
* Tasks
* Events
* Documents
* Workflows
* Marketing tools
* Reports, limited
* AI Agent tools, limited

### Permissions

Admin can:

* Create and edit contacts
* Create and edit clients
* Create and assign tasks
* Schedule appointments
* Manage events
* Invite clients
* Assign contacts to advisors
* Manage marketing lists
* View reports
* Upload documents
* Manage client statuses
* Assist with user management

### Restrictions

Admin should not be able to:

* Delete Super Admins
* Change core system settings
* Modify billing
* Change global permissions without approval
* Access private advisor-only notes unless allowed

---

## 4. Financial Planner

### Purpose

A Financial Planner is an advisor responsible for client relationships, planning conversations, meetings, and advisory workflows.

### Access

Financial Planner can access:

* Assigned clients
* Assigned households
* Assigned prospects
* Assigned leads
* Assigned contacts
* Assigned appointments
* Assigned meetings
* Assigned tasks
* Client files
* Client notes
* Client messages
* Client service history
* Planning workflows
* Booking calendar
* Follow-up reminders
* Client dashboard activity
* Marketing activity connected to assigned clients

### Permissions

Financial Planner can:

* View assigned client profiles
* View assigned household profiles
* Add client notes
* Create planning tasks
* Assign servicing advisor tasks
* Schedule client meetings
* View appointment history
* Send client messages
* Request documents
* Review client forms
* Add follow-up actions
* View birthday reminders
* View assigned marketing activity
* Review AI-generated summaries
* Approve certain client-facing messages, if enabled

### Restrictions

Financial Planner should not automatically access:

* Clients assigned to other advisors
* Global admin settings
* User role management
* Full marketing system settings
* System integrations
* Audit logs, unless permitted

---

## 5. Writing Advisor

### Purpose

The Writing Advisor is the primary planning/advisor role connected to client planning notes, meeting notes, review workflows, and client recommendations.

### Access

Writing Advisor can access:

* Assigned clients
* Assigned households
* Assigned planning workflows
* Assigned meetings
* Assigned notes
* Assigned documents
* Assigned tasks
* Client review workflows
* Planning forms
* Advisor-facing AI summaries

### Permissions

Writing Advisor can:

* Manage assigned client planning notes
* Manage meeting notes
* Create planning tasks
* Review client forms
* Review client documents
* Create advisor follow-up items
* Send approved client messages
* Review AI-generated meeting summaries
* Approve draft notes or summaries where permitted

### Restrictions

Writing Advisor should not:

* Access unrelated client records
* Manage global settings
* Change user roles
* Send unapproved compliance-sensitive messages
* Access private administrative settings

---

## 6. Servicing Advisor

### Purpose

The Servicing Advisor supports ongoing client service, follow-ups, paperwork, appointment notes, workflows, and service tasks.

### Access

Servicing Advisor can access:

* Assigned clients
* Assigned households
* Assigned service tasks
* Assigned appointment notes
* Assigned workflow steps
* Client service history
* Client paperwork
* Document request workflows
* Follow-up reminders

### Permissions

Servicing Advisor can:

* Manage assigned client service tasks
* Add service notes
* Manage follow-ups
* Update appointment notes
* Update workflow steps
* Request missing documents
* Prepare meeting follow-up
* Notify the planner of client updates
* Mark assigned service tasks complete

### Restrictions

Servicing Advisor should not:

* Change advisor recommendations
* Access unrelated clients
* Manage user roles
* Delete client records
* Change system settings
* Send unapproved advice-related communication

---

## 7. Planner Administrator

### Purpose

The Planner Administrator assists planners and servicing advisors with paperwork, appointments, tasks, scheduling, forms, document collection, and client coordination.

### Access

Planner Administrator can access:

* Clients assigned to supported planners
* Client paperwork
* Client documents
* Client appointment details
* Assigned tasks
* Follow-up workflows
* Service requests
* Booking and calendar support
* Forms and intake documents
* Client communication history, if allowed

### Permissions

Planner Administrator can:

* Create and update client tasks
* Upload client paperwork
* Request missing documents
* Schedule or reschedule appointments
* Prepare meeting notes
* Update client statuses
* Track paperwork progress
* Add internal notes
* Send approved reminders
* Assist with onboarding workflows
* Mark tasks complete

### Restrictions

Planner Administrator should not:

* Change financial planning recommendations
* Approve advice-related content unless specifically permitted
* Access all firm clients by default
* Manage global settings
* Change user roles
* Delete client records
* Send unapproved marketing or compliance-sensitive communication

---

## 8. Client Service Associate

### Purpose

Client Service Associates support scheduling, service tasks, documents, reminders, forms, client updates, and general service workflows.

### Access

Client Service Associate can access:

* Assigned service tasks
* Assigned clients
* Assigned households
* Assigned documents
* Assigned forms
* Scheduling tools
* Appointment support
* Client update workflows
* Reminder workflows

### Permissions

Client Service Associate can:

* Manage service tasks
* Schedule appointments
* Upload documents
* Request forms
* Send approved reminders
* Update client service statuses
* Add service notes
* Assist with client onboarding
* Prepare internal follow-up tasks

### Restrictions

Client Service Associate should not:

* View sensitive planning notes unless permitted
* Approve planning recommendations
* Manage users
* Manage global settings
* Send unapproved client communications

---

## 9. Marketing Manager

### Purpose

Marketing Managers manage campaigns, segments, email/SMS templates, landing pages, event promotion, and campaign reporting.

### Access

Marketing Manager can access:

* Marketing dashboard
* Campaigns
* Segments
* Email templates
* SMS templates
* Landing pages
* Event marketing
* Campaign reporting
* Contact lists, where allowed
* Event attendee lists, where allowed

### Permissions

Marketing Manager can:

* Create campaigns
* Edit campaigns
* Manage segments
* Create email/SMS templates
* Manage landing pages
* View marketing performance
* Export approved marketing reports
* Create post-event follow-up workflows

### Restrictions

Marketing Manager should not:

* See sensitive planning notes unless permitted
* Access private client documents unless permitted
* Send compliance-sensitive messages without approval
* Access global admin settings
* Manage user roles

---

## 10. Event Coordinator

### Purpose

Event Coordinators manage events, RSVPs, check-ins, reminders, and post-event follow-up tasks.

### Access

Event Coordinator can access:

* Events
* Event registrations
* RSVP lists
* Check-in tools
* Event reminders
* Post-event follow-up tasks
* Event attendee reports

### Permissions

Event Coordinator can:

* Create events
* Edit events
* Manage RSVPs
* Check in guests
* Send approved event reminders
* Create follow-up tasks
* Export attendee lists, if allowed
* Convert event guests to leads, if permitted

### Restrictions

Event Coordinator should not:

* Access sensitive client planning notes
* Manage global system settings
* Change user roles
* Access unrelated client documents
* Send non-event marketing without permission

---

## 11. Compliance Reviewer

### Purpose

Compliance Reviewers review communications, AI notes, audit logs, approvals, and compliance-related workflows.

### Access

Compliance Reviewer can access:

* Communication review queue
* AI-generated notes and drafts
* Approval history
* Audit logs
* Marketing approval history
* Client communication records, if allowed
* Reports, if allowed

### Permissions

Compliance Reviewer can:

* Review communications
* Approve or reject communication drafts, if configured
* Review AI-generated notes
* Review audit logs
* Review marketing approvals
* View compliance history
* Export compliance reports, if allowed

### Restrictions

Compliance Reviewer should not:

* Change client data unless permitted
* Manage user roles unless permitted
* Send client communications unless permitted
* Modify planning recommendations

---

## 12. Support / Operations

### Purpose

Support / Operations users assist with general platform workflows, service tasks, data cleanup, and operational support.

### Access

Support / Operations can access:

* Assigned tasks
* Assigned workflows
* Assigned documents
* Operational dashboards
* Support requests
* Limited client/contact records, if assigned

### Permissions

Support / Operations can:

* Update assigned tasks
* Update workflow steps
* Assist with data cleanup
* Upload files where permitted
* Manage operational notes
* Support internal users

### Restrictions

Support / Operations should not:

* Access sensitive planning details unless allowed
* Manage user roles
* Change system permissions
* Access all clients by default
* Send unapproved communication

---

## 13. Client

### Purpose

Clients are external users who access their own secure client dashboard.

### Access

Client can access:

* Their own dashboard
* Their own appointments
* Their own forms
* Their own documents
* Their own messages
* Their own tasks or action items
* Their own event registrations
* Their own profile information
* Approved client-facing resources

### Permissions

Client can:

* View assigned advisor information
* Book appointments
* Complete forms
* Upload documents
* View requested documents
* Send messages
* Update contact information
* Register for events
* View client-visible task status
* View approved announcements

### Restrictions

Client cannot:

* View other clients
* View internal notes
* View staff-only tasks
* View advisor-only files
* Access marketing tools
* Access admin dashboards
* Access AI Agent admin tools
* View reports or analytics
* Change assigned advisor

---

## 14. Household Member

### Purpose

Household Members are related users connected to a client household. They may be spouses, family members, or approved participants.

### Access

Household Member can access:

* Their own profile
* Approved household-level information
* Their own documents
* Shared household documents, if permitted
* Appointments they are invited to
* Approved forms and tasks

### Permissions

Household Member can:

* Complete assigned forms
* Upload requested documents
* View approved household information
* Send messages
* Register for events
* Update their profile

### Restrictions

Household Member should not:

* See private documents not shared with them
* View internal notes
* Access advisor-only content
* Manage household members
* Change advisor assignments

---

## 15. Prospect

### Purpose

A Prospect is a qualified potential client. They may have booked a meeting, completed an intake form, shown serious interest, or started onboarding.

Prospects may receive limited portal access.

### Access

Prospect can access:

* Limited prospect dashboard
* Onboarding forms
* Requested documents
* Appointment booking
* Assigned advisor information
* Next steps
* Messages
* Event registration
* Limited educational resources

### Permissions

Prospect can:

* Complete onboarding forms
* Upload documents
* Book meetings
* View assigned advisor
* View next steps
* Send messages
* Register for events
* View limited resources

### Internal Staff Permissions

Staff can:

* Assign prospect to planner
* Assign servicing advisor
* Review intake forms
* Request documents
* Create tasks
* Schedule appointments
* Track onboarding stage
* Convert prospect to client

### Suggested Prospect Statuses

* New Prospect
* Intro Meeting Scheduled
* Intake Sent
* Intake Completed
* Documents Requested
* Documents Received
* Advisor Review
* Proposal / Plan Discussion
* Ready to Convert to Client
* Converted to Client
* Not a Fit
* Archived

---

## 16. Referral Partner

### Purpose

Referral Partners are external relationships who may submit referrals or collaborate with SIG.

### Access

Referral Partner can access:

* Referral submission form
* Their own submitted referrals, if enabled
* Approved resources
* Meeting request tools
* Their own profile

### Permissions

Referral Partner can:

* Submit referrals
* Update contact information
* Request meetings
* Register for events
* View limited shared resources

### Restrictions

Referral Partner cannot:

* View client records
* View referral details beyond allowed visibility
* Access internal notes
* Access advisor dashboards
* Access marketing tools

---

## 17. Professional Partner

### Purpose

Professional Partners may include CPAs, attorneys, realtors, business advisors, insurance partners, or other professional relationships.

### Access

Professional Partner can access:

* Their own profile
* Shared resources
* Meeting request forms
* Approved collaboration records, if enabled
* Event registration

### Permissions

Professional Partner can:

* Update profile
* Submit referrals
* Upload requested documents, if allowed
* Request meetings
* Register for events

### Restrictions

Professional Partner cannot:

* View clients unless explicitly connected and approved
* View internal notes
* Access advisor dashboards
* Access marketing tools
* Access other professional partner records

---

## 18. Investment Committee

### Purpose

The Investment Committee role is for outside firms, fund managers, investment companies, or service providers who are pitching investment services, products, platforms, or strategies to SIG.

This role should be highly restricted.

### Access

Investment Committee users can access:

* A secure submission portal
* Their own company profile
* Their own submitted materials
* Meeting request forms
* Pitch documents
* Due diligence forms
* Status of their submission, if allowed
* Approved communication threads

### Permissions

Investment Committee users can:

* Submit company information
* Upload pitch decks
* Upload due diligence documents
* Submit investment strategy details
* Request a meeting
* Respond to information requests
* Update their own contact information

### Restrictions

Investment Committee users cannot:

* View SIG clients
* View internal SIG notes
* View other investment companies
* View advisor dashboards
* Access marketing tools
* Access client data
* See internal evaluation notes unless shared
* Message clients
* Access reports

### Suggested Investment Committee Statuses

* New Submission
* Under Review
* More Information Requested
* Meeting Scheduled
* Approved for Consideration
* Not a Fit
* Archived

---

## 19. Vendor / Partner

### Purpose

Vendors and partners are external business relationships that support SIG operations, events, marketing, technology, compliance, or client service.

Most vendors should not need dashboard access. If they do, access should be limited to the specific area they support.

### Vendor / Partner Types

* Event Partner
* Marketing Partner
* Technology Vendor
* Compliance Vendor
* Professional Partner
* Insurance Partner
* Investment Platform
* Operations Vendor

### Permissions

Vendor / Partner users can:

* Upload requested files
* View assigned tasks
* Communicate with SIG staff
* Access shared project details, if approved
* Submit service requests
* Register for events

### Restrictions

Vendor / Partner users cannot:

* View client records
* View financial planning information
* Access internal reports
* Access marketing lists unless explicitly approved
* Access admin tools

---

## 20. Event Guest

### Purpose

Event Guests are users or contacts connected to SIG events, workshops, luncheons, client appreciation events, or educational seminars.

Event Guests may not need full accounts. They may only need registration access.

### Permissions

Event Guests can:

* Register for events
* Update RSVP
* Add guest information
* Receive event reminders
* Submit post-event interest forms
* Request a meeting
* Join marketing list, if consent is given

### Suggested Event Guest Statuses

* Invited
* Registered
* Attended
* No-Show
* Canceled
* Follow-Up Needed
* Converted to Lead
* Converted to Prospect

---

## 21. Read-Only / Auditor

### Purpose

This role is for compliance, leadership, or trusted review users who need visibility without the ability to modify records.

### Access

Read-Only users can access approved areas such as:

* Reports
* Client records
* Activity logs
* Marketing activity
* Event activity
* Communication history
* Audit trails

### Permissions

Read-Only users can:

* View approved records
* Export reports, if permitted
* Review communication history
* Review audit logs

### Restrictions

Read-Only users cannot:

* Create records
* Edit records
* Delete records
* Send messages
* Change statuses
* Modify users
* Trigger automations

---

# Contact, Lead, and Prospect Distinction

SIG360 should treat Contact, Lead, and Prospect differently.

## Contact

A Contact is a relationship record. Contacts may include referral partners, CPAs, attorneys, family members, business owners, vendors, or event attendees.

Most contacts do not need login access.

## Lead

A Lead is an early-stage potential opportunity. Leads may come from website forms, phone calls, referrals, events, marketing campaigns, or AI-generated lead workflows.

Most leads do not need login access.

Suggested Lead Statuses:

* New
* Contacted
* Needs Follow-Up
* Qualified
* Not Qualified
* Meeting Scheduled
* Converted to Prospect
* Converted to Client
* Lost
* Archived

## Prospect

A Prospect is more qualified than a Lead and may receive limited portal access for onboarding, document upload, meetings, and intake forms.

Suggested flow:

```text
Contact
  ↓
Lead
  ↓
Prospect
  ↓
Client
```

---

# Lead Sources

SIG360 should support lead source tracking.

Recommended lead sources:

* Website form
* Event registration
* Referral
* Phone call
* Email inquiry
* Social media
* Marketing campaign
* Webinar
* Imported list
* Advisor-created
* AI-generated
* Redtail sync

---

# User Connections

Users should connect to:

* Clients
* Households
* Appointments
* Meetings
* Tasks
* Workflows
* Notes
* Documents
* Events
* Campaigns
* Communications
* Opportunities
* Audit logs

Additional relationship fields:

* Assigned Planner
* Assigned Writing Advisor
* Assigned Servicing Advisor
* Assigned Planner Administrator
* Assigned Client Service Associate
* Assigned Marketing Manager
* Assigned Event Coordinator
* Assigned Compliance Reviewer

---

# Permission Categories

SIG360 should support permission categories so access can expand beyond a single role field.

## User Management

* View users
* Invite users
* Add users
* Edit users
* Suspend users
* Archive users
* Delete users
* Assign roles
* Reset invites
* View user activity history

## Client Management

* View all clients
* View assigned clients
* Create clients
* Edit clients
* Archive clients
* Assign advisors
* View household details
* View client documents
* View client notes
* View client service history

## Household Management

* View all households
* View assigned households
* Create households
* Edit households
* Assign household members
* Archive households
* View household documents
* View household notes

## Contact / Lead / Prospect Management

* View contacts
* View leads
* View prospects
* Create contacts
* Create leads
* Create prospects
* Assign leads
* Assign prospects
* Convert leads
* Convert prospects
* Archive leads
* Archive prospects

## Planner Workflow

* View assigned planner dashboard
* View assigned servicing advisor dashboard
* Create planning tasks
* Assign tasks
* Complete tasks
* View advisor notes
* View service notes
* View planning workflows
* Update workflow steps

## Appointments and Meetings

* View appointments
* Create appointments
* Edit appointments
* Cancel appointments
* View all calendars
* View assigned calendar only
* View meeting notes
* Create meeting notes
* Edit meeting notes

## Events

* Create events
* Edit events
* Manage registrations
* View attendees
* Check in attendees
* Send event reminders
* Export attendee lists
* Create post-event follow-up tasks

## Marketing

* View campaigns
* Create campaigns
* Edit campaigns
* Approve campaigns
* Send campaigns
* View marketing lists
* Manage subscribers
* Manage segments
* Manage email templates
* Manage SMS templates
* View campaign reports

## Documents

* Upload documents
* View documents
* Delete documents
* Share documents
* Request documents
* View client uploads
* View household uploads
* View prospect uploads

## Communications

* View communications
* Send approved messages
* Draft messages
* Approve messages
* View communication history
* View SMS/email logs
* Manage templates

## AI Agent

* Use AI Agent
* View AI summaries
* Create AI drafts
* Approve AI drafts
* Send AI-generated messages
* Manage AI settings
* View AI audit logs
* Run AI lead generation tasks
* View AI-generated recommendations

## Reports

* View reports
* Export reports
* View firm-wide analytics
* View assigned analytics only
* View campaign reporting
* View event reporting
* View advisor workload reports

## Settings

* View settings
* Edit app settings
* Manage integrations
* Manage automations
* Manage billing
* Manage compliance settings
* Manage AI Agent settings

---

# Recommended Access Matrix

| Feature / Area         | Super Admin | Owner / Leadership |   Admin | Planner / Advisor | Servicing / Planner Admin |      Marketing |    Event Coord. |     Compliance |           Client |         Prospect | Investment Committee |
| ---------------------- | ----------: | -----------------: | ------: | ----------------: | ------------------------: | -------------: | --------------: | -------------: | ---------------: | ---------------: | -------------------: |
| Full Dashboard         |         Yes |            Limited |     Yes |           Limited |                   Limited |        Limited |         Limited |        Limited |               No |               No |                   No |
| User Management        |         Yes |               View | Limited |                No |                        No |             No |              No |             No |               No |               No |                   No |
| All Clients            |         Yes |                Yes |     Yes |                No |                        No |             No |              No |    Review Only |               No |               No |                   No |
| Assigned Clients       |         Yes |                Yes |     Yes |               Yes |                       Yes |             No |              No |    Review Only |         Own Only |               No |                   No |
| Households             |         Yes |                Yes |     Yes |          Assigned |                  Assigned |             No |              No |    Review Only |         Own Only |               No |                   No |
| Client Documents       |         Yes |                Yes |     Yes |          Assigned |                  Assigned |             No |              No |    Review Only |         Own Only |      Own Uploads |                   No |
| Leads                  |         Yes |                Yes |     Yes |          Assigned |                  Assigned | Marketing View |      Event View |             No |               No |               No |                   No |
| Prospects              |         Yes |                Yes |     Yes |          Assigned |                  Assigned |        Limited |         Limited |             No |               No |         Own Only |                   No |
| Appointments           |         Yes |                Yes |     Yes |          Assigned |                  Assigned |             No |      Event Only |             No |         Own Only |         Own Only |  Pitch Meetings Only |
| Tasks                  |         Yes |                Yes |     Yes |          Assigned |                  Assigned |       Assigned |        Assigned |    Review Only | Own Action Items | Own Action Items |         Own Requests |
| Events                 |         Yes |                Yes |     Yes |     View/Register |             View/Register |            Yes |             Yes |    Review Only |         Register |         Register |                   No |
| Marketing              |         Yes |            Reports |     Yes |           Limited |                   Limited |            Yes | Event Campaigns |    Review Only |               No |               No |                   No |
| Communications         |         Yes |             Review |     Yes |          Assigned |                  Assigned |      Campaigns |  Event Messages | Review/Approve |         Own Only |         Own Only |             Own Only |
| AI Agent               |         Yes |          Summaries |     Yes |           Limited |                   Limited |        Limited |         Limited |         Review |          Limited |          Limited |                   No |
| Investment Submissions |         Yes |                Yes |     Yes |   View If Allowed |                        No |             No |              No |         Review |               No |               No |             Own Only |
| Reports                |         Yes |                Yes |     Yes |     Assigned Only |             Assigned Only |      Marketing |          Events |     Compliance |               No |               No |                   No |
| Settings               |         Yes |               View | Limited |                No |                        No |             No |              No |             No |               No |               No |                   No |

---

# Route and API Protection Rules

Role checks should be enforced in:

* Dashboard navigation
* Page routes
* Server actions
* API routes
* Database queries
* Supabase RLS policies, if used
* File access
* Document uploads
* AI Agent actions
* Export actions
* Invite actions

Do not allow frontend-only checks to be the only layer of security.

---

# AI Agent Permission Rules

SIG360 AI Agent features must respect user roles and permissions.

The AI Agent should not:

* Bypass role permissions
* Show client data to unauthorized users
* Show internal notes to clients
* Send client communications without permission
* Auto-send compliance-sensitive content
* Access unrelated client records
* Run lead generation tasks unless the user has permission
* Generate or publish campaigns unless allowed
* Change client statuses unless allowed

AI-generated content should be saved as drafts when approval is required.

Suggested AI permissions:

* Use AI Agent
* View AI summaries
* Create AI drafts
* Approve AI drafts
* Send AI-generated messages
* Manage AI settings
* View AI audit logs
* Run AI lead generation tasks

---

# Audit Logging Requirements

Audit logs should be created when:

* User is invited
* User accepts invite
* User role changes
* User status changes
* User is suspended
* User is archived
* User is deleted
* User profile photo changes
* User permissions change
* Client assignment changes
* Household assignment changes
* Planner assignment changes
* Servicing advisor assignment changes
* AI Agent performs an action
* Admin sends or approves communication
* External portal user uploads a document

Audit log fields should include:

```text
id
actor_user_id
target_user_id
action
entity_type
entity_id
old_value
new_value
metadata_json
created_at
ip_address
user_agent
```

---

# Codex / Claude Implementation Tasks

## Before Coding

Review the current implementation and identify:

1. Current auth provider and session handling
2. Current dashboard route structure
3. Current user/profile database table
4. Existing role fields, if any
5. Existing permission fields, if any
6. Existing route guards
7. Existing middleware
8. Existing Supabase RLS policies, if used
9. Existing user invite flow
10. Existing profile photo upload flow
11. Existing staff/client dashboard separation
12. Existing AI Agent access patterns
13. Existing audit logging, if any

Do not duplicate role utilities if they already exist.

---

## First Stable Build

Implement the first stable version in this order:

1. Define role constants.
2. Define role labels.
3. Define user status constants.
4. Define user status labels.
5. Define permission constants.
6. Create a role-to-permission map.
7. Add helper utilities:

   * `hasRole`
   * `hasAnyRole`
   * `hasPermission`
   * `isInternalUser`
   * `isExternalUser`
   * `canAccessClient`
   * `canAccessHousehold`
   * `canManageUser`
   * `canUseAIAgent`
8. Add route protection for dashboard sections.
9. Add API/server action protection.
10. Add dashboard visibility filtering based on role.
11. Build or update the user list page.
12. Build or update the user profile page.
13. Build or update the invite user form.
14. Build or update the edit user form.
15. Add profile photo upload.
16. Add user status controls.
17. Add role and permission system.
18. Add assigned clients/tasks views.
19. Add assigned household views.
20. Add assigned planner and assigned servicing advisor relationships.
21. Add safe client/prospect portal access rules.
22. Add audit logging for role/status changes.
23. Add tests or validation checks where the project supports them.

---

# Suggested Utility Structure

Follow the project’s existing folder structure. If no convention exists, use something like:

```text
src/lib/auth/roles.ts
src/lib/auth/permissions.ts
src/lib/auth/role-permissions.ts
src/lib/auth/access-control.ts
src/lib/auth/role-labels.ts
src/lib/auth/user-statuses.ts
src/lib/auth/route-guards.ts
```

Possible files:

```text
roles.ts
permissions.ts
role-permissions.ts
access-control.ts
role-labels.ts
user-statuses.ts
route-guards.ts
```

---

# Suggested Role Labels

```ts
export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  owner_leadership: 'Owner / Leadership',
  admin: 'Admin',
  financial_planner: 'Financial Planner',
  writing_advisor: 'Writing Advisor',
  servicing_advisor: 'Servicing Advisor',
  planner_administrator: 'Planner Administrator',
  client_service_associate: 'Client Service Associate',
  marketing_manager: 'Marketing Manager',
  event_coordinator: 'Event Coordinator',
  compliance_reviewer: 'Compliance Reviewer',
  support_operations: 'Support / Operations',
  client: 'Client',
  household_member: 'Household Member',
  prospect: 'Prospect',
  referral_partner: 'Referral Partner',
  professional_partner: 'Professional Partner',
  investment_committee: 'Investment Committee',
  vendor_partner: 'Vendor / Partner',
  event_guest: 'Event Guest',
  read_only: 'Read-Only / Auditor',
}
```

---

# Suggested User Status Labels

```ts
export const USER_STATUS_LABELS = {
  invited: 'Invited',
  active: 'Active',
  pending_setup: 'Pending Setup',
  pending_review: 'Pending Review',
  suspended: 'Suspended',
  inactive: 'Inactive',
  archived: 'Archived',
  deleted: 'Deleted',
}
```

---

# Important Rules

* Do not expose internal dashboard features to external users.
* Do not expose client records across households or unrelated users.
* Do not expose household records to unrelated users.
* Do not expose investment submissions to other investment committee users.
* Do not expose advisor-only notes to clients.
* Do not expose servicing advisor notes unless permissions allow it.
* Do not hard delete financial-service-related records unless the current application already supports it safely.
* Do not allow AI Agent actions to bypass role permissions.
* Do not allow frontend-only checks to be the only layer of security.
* Protect server actions, API routes, and database access.
* Preserve existing workflows.

---

# Acceptance Criteria

The implementation is complete when:

* Roles are defined in a central reusable location.
* Role labels are defined in a central reusable location.
* User statuses are defined in a central reusable location.
* Permissions are defined in a central reusable location.
* Each role has a clear permission map.
* User list page supports role and status visibility.
* User profile page shows connected records.
* Invite user flow works.
* Edit user flow works.
* Profile photo upload works.
* Role/status changes are logged.
* Dashboard navigation changes based on role.
* Super Admin can access user management.
* Admin has limited user management access.
* Owner / Leadership has firm-wide visibility without unnecessary system control.
* Financial Planner can access assigned clients and workflows.
* Writing Advisor can access assigned planning workflows.
* Servicing Advisor can access assigned service workflows.
* Planner Administrator can access assigned support workflows.
* Client Service Associate can access assigned service tasks.
* Marketing Manager can access campaigns and marketing tools.
* Event Coordinator can access events and event workflows.
* Compliance Reviewer can access approval and audit workflows.
* Clients can access only their own portal data.
* Household Members can access only approved household data.
* Prospects can access only their own onboarding or portal data.
* Investment Committee users can access only their own submission workflow.
* Unauthorized users are redirected or blocked.
* Protected API routes/server actions enforce permissions.
* AI Agent features respect role permissions.
* Existing SIG360 workflows continue working.

---

# Recommended Build Phases

## Phase 1: Internal Role Foundation

Build:

* Super Admin
* Owner / Leadership
* Admin
* Financial Planner
* Writing Advisor
* Servicing Advisor
* Planner Administrator
* Client Service Associate

## Phase 2: External Portal Access

Build:

* Client
* Household Member
* Prospect

## Phase 3: Marketing and Event Roles

Build:

* Marketing Manager
* Event Coordinator
* Referral Partner
* Professional Partner
* Event Guest

## Phase 4: Compliance and Special Access

Build:

* Compliance Reviewer
* Investment Committee
* Vendor / Partner
* Read-Only / Auditor
* Support / Operations

---

# Final Instruction for Claude Code

Start by reviewing the existing SIG360 auth, user profile, invite, user management, dashboard access, and permissions implementation.

Then implement the first stable role-based access control foundation while preserving the current user management workflow, invite flow, profile photo workflow, assigned client/task views, and audit logging requirements.

Do not break existing dashboard routes, client workflows, appointment workflows, event workflows, marketing workflows, Redtail-related data structures, AI Agent workflows, or authentication.
