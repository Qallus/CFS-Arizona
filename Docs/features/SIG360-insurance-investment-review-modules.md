# SIG360 Insurance and Investment Review Modules

## Purpose

This document defines SIG360 modules for tracking insurance planning and investment review workflows.

SIG360 should not try to replace custodial, portfolio, or financial planning systems in the first version. Instead, it should act as the workflow and client relationship layer around those systems.

## Insurance Planning Module

### Goals

- Track policies and review dates.
- Connect policies to clients and households.
- Store policy documents.
- Trigger insurance review workflows.
- Track recommendations and follow-ups.

### Insurance Policy Fields

- Policy Type
- Carrier
- Policy Number
- Insured Person
- Owner
- Beneficiary
- Coverage Amount
- Premium
- Issue Date
- Renewal Date
- Review Date
- Policy Status
- Documents
- Advisor Notes

### Policy Types

- Life Insurance
- Term Life
- Whole Life
- Universal Life
- Long-Term Care
- Disability
- Annuity
- Other

### Insurance Review Statuses

- Not Started
- Documents Requested
- Under Review
- Meeting Scheduled
- Recommendation Drafted
- Client Reviewing
- Completed
- Deferred

## Investment Review Module

### Goals

- Track investment review due dates.
- Prepare advisor meeting notes.
- Track risk tolerance updates.
- Track allocation discussion notes.
- Connect reviews to meetings and tasks.

### Investment Review Fields

- Client
- Household
- Assigned Advisor
- Review Type
- Review Due Date
- Meeting Date
- Risk Tolerance Status
- Planning Notes
- Client Concerns
- Follow-Up Tasks
- External System Links
- Review Status

### Review Types

- Annual Review
- Semi-Annual Review
- Quarterly Review
- Portfolio Review
- Retirement Income Review
- Risk Tolerance Review
- RMD Review

### Review Statuses

- Not Started
- Prep Needed
- Scheduled
- Completed
- Follow-Up Needed
- Deferred

## AI Features

AI can help:

- Generate review prep briefs.
- Summarize past review notes.
- Draft client follow-up emails.
- Identify missing documents.
- Suggest review tasks.
- Suggest next meeting agenda.

## Codex Implementation Tasks

- Build insurance policy model and UI.
- Build insurance review workflow.
- Build investment review model and UI.
- Add review due dashboard cards.
- Connect reviews to meetings, documents, and tasks.
- Add AI review prep prompts.
