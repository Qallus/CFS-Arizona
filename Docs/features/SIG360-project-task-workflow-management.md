# SIG360 — Project, Task, Timeline, and Workflow Management

## File Purpose

This document converts the previous Gantt/project management direction into a SIG360 financial-services workflow system.

Recommended location:

```txt
/AI.SIG360/docs/SIG360-project-task-workflow-management.md
```

## Feature Overview

SIG360 needs project and task management, but it should be shaped around Strategic Income Group operations, not construction schedules.

This module should support internal projects, client journey workflows, planner task lists, appointment follow-ups, event tasks, marketing launches, document requests, and recurring review workflows.

## Recommended Navigation

```txt
Tasks
Projects
Workflows
Timeline
Templates
```

## Core Use Cases

- Annual client review workflow.
- New client onboarding workflow.
- Discovery call follow-up workflow.
- Investment review preparation.
- Insurance planning follow-up.
- Retirement planning checklist.
- Client birthday automation task.
- Event planning workflow.
- Marketing campaign workflow.
- Internal SIG operations project.
- Website/content project.
- Compliance review task list.

## Project / Workflow Fields

Suggested fields:

- id
- name
- description
- workflow_type
- owner_user_id
- related_client_id
- related_household_id
- related_event_id
- related_campaign_id
- start_date
- target_completion_date
- actual_completion_date
- status
- priority
- visibility
- created_at
- updated_at

## Workflow Types

Recommended types:

- Client Onboarding
- Discovery Follow-Up
- Annual Review
- Investment Review
- Insurance Review
- Retirement Planning
- Event Management
- Marketing Campaign
- Internal Operations
- Website / Content
- Compliance Review
- AI Automation Project

## Task Fields

Suggested fields:

- id
- title
- description
- task_type
- related_project_id
- related_client_id
- related_household_id
- related_appointment_id
- related_event_id
- assigned_to_user_id
- created_by_user_id
- due_date
- start_date_optional
- status
- priority
- percent_complete
- dependency_task_id_optional
- client_visible
- internal_notes
- created_at
- updated_at

## Task Statuses

- Not Started
- Scheduled
- In Progress
- Waiting on Client
- Waiting on Planner
- Waiting on Documents
- Needs Review
- Completed
- Canceled
- Blocked

## Task Priorities

- Low
- Normal
- High
- Urgent
- Compliance Sensitive

## Timeline Behavior

SIG360 may use a Gantt-style timeline for internal workflows, but this should be called `Workflow Timeline` or `Project Timeline`, not construction Gantt.

Timeline should show:

- Workflow phases
- Tasks
- Due dates
- Dependencies
- Assigned staff
- Status
- Overdue indicators
- Completion progress
- Client-visible vs internal-only items

## Standard Workflow Phases

Use these general phases:

1. Intake
2. Assignment
3. Preparation
4. Review
5. Client Communication
6. Follow-Up
7. Completion
8. Archive

## Client Onboarding Template

| Phase | Task | Suggested Owner | Timing |
|---|---|---|---|
| Intake | Create client record | Client Service | Day 0 |
| Intake | Create household record | Client Service | Day 0 |
| Assignment | Assign planner/advisor team | Admin | Day 0 |
| Preparation | Send welcome email | Admin/Marketing | Day 0 |
| Preparation | Request required documents | Client Service | Day 1 |
| Review | Planner reviews intake | Planner | Day 2 |
| Client Communication | Schedule onboarding meeting | Admin | Day 3 |
| Follow-Up | Add meeting notes | Planner | After meeting |
| Completion | Mark onboarding complete | Client Service | Final step |

## Annual Review Template

| Phase | Task | Suggested Owner | Timing |
|---|---|---|---|
| Intake | Identify review due | Automation | 30 days before |
| Preparation | Confirm client contact info | Client Service | 21 days before |
| Preparation | Send worksheet/resources | Client Service | 14 days before |
| Preparation | Prepare planner notes | Planner | 7 days before |
| Client Communication | Send meeting reminder | System | 1 day before |
| Review | Conduct annual review | Planner | Meeting day |
| Follow-Up | Add notes and next steps | Planner | 1 day after |
| Follow-Up | Create follow-up tasks | Planner/CSA | 1 day after |
| Completion | Mark review complete | Planner | Final step |

## Event Planning Template

| Phase | Task | Suggested Owner | Timing |
|---|---|---|---|
| Planning | Create event record | Marketing/Admin | 6-8 weeks before |
| Planning | Build event page | Marketing | 6 weeks before |
| Marketing | Create email campaign | Marketing | 5 weeks before |
| Marketing | Create SMS reminder draft | Marketing | 4 weeks before |
| Registration | Open RSVP | Admin | 4 weeks before |
| Registration | Monitor capacity | Admin | Weekly |
| Reminder | Send event reminder | System | 7 days before |
| Reminder | Send final reminder | System | 1 day before |
| Event Day | Check in attendees | Staff | Event day |
| Follow-Up | Send thank-you email | Marketing | 1 day after |
| Completion | Review attendance report | Admin | 2 days after |

## Marketing Campaign Template

| Phase | Task | Suggested Owner | Timing |
|---|---|---|---|
| Strategy | Define campaign goal | Marketing | Start |
| Content | Draft email copy | Marketing | Day 1 |
| Content | Draft SMS copy if applicable | Marketing | Day 1 |
| Content | Build landing page | Marketing/Web | Day 2 |
| Review | Internal approval | Owner/Compliance | Day 3 |
| Launch | Schedule email | Marketing | Day 4 |
| Launch | Schedule social post | Marketing | Day 4 |
| Follow-Up | Review results | Marketing | After launch |
| Completion | Create summary report | Marketing | Final step |

## Notifications

Task notifications can trigger:

- Assigned task
- Due soon
- Overdue
- Status changed
- Waiting on client
- Client submitted form
- Appointment completed
- Event RSVP threshold reached
- Workflow completed

Notification channels:

- In-app
- Email
- SMS where consent and business rules allow

## Codex Implementation Notes

- Build tasks so they can attach to any major record.
- Create workflow templates that generate task lists.
- Make timeline optional but supported.
- Add filters by owner, client, household, event, appointment, due date, status, and priority.
- Respect client visibility settings.
- Keep internal notes private.
