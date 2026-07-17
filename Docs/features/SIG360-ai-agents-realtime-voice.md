# SIG360 — AI Agents, Realtime Voice, and Automation

## File Purpose

This document adapts the uploaded OpenAI Agents SDK and Realtime Audio app concepts into a SIG360-specific AI assistant and automation architecture.

Recommended location:

```txt
/AI.SIG360/docs/SIG360-ai-agents-realtime-voice.md
```

## Feature Overview

SIG360 should eventually include AI-assisted tools for internal staff, planners, operations, and marketing. AI should help the team organize information, draft communications, summarize records, prepare meetings, and route tasks.

AI should be assistive, not autonomous in sensitive financial planning decisions.

## AI Assistant Name Options

Potential internal names:

- Siggy
- SIG Assistant
- SIG360 Agent
- Planner Assistant
- Service Desk Agent

## Core AI Agent Use Cases

### Internal Staff Assistant

Helps staff:

- Summarize client record.
- Summarize appointment history.
- Draft follow-up emails.
- Draft SMS reminders.
- Create tasks from notes.
- Prepare event summaries.
- Find client/team records.
- Suggest next administrative steps.

### Planner Meeting Prep Assistant

Helps planners:

- Generate pre-meeting summary.
- List open tasks.
- List recent communications.
- List documents/forms received.
- Identify upcoming birthdays/reviews/events.
- Draft post-meeting follow-up tasks.

### Marketing Assistant

Helps marketing:

- Draft email campaigns.
- Draft social copy.
- Draft event reminders.
- Create campaign checklists.
- Summarize campaign results.
- Build audience segment ideas.

### Event Assistant

Helps event staff:

- Summarize RSVP count.
- Show waitlist.
- Draft event reminders.
- Create day-of checklist.
- Draft thank-you email.
- Produce attendance summary.

### Realtime Voice Assistant

Optional future feature for internal use:

- Staff can speak to SIG360 to retrieve high-level information.
- Assistant can create draft notes or tasks.
- Assistant can summarize today’s appointments.
- Assistant can help prepare for meetings.

## OpenAI Agents SDK Direction

Build a structured agent app with:

- Frontend UI for staff interaction.
- Server API route for agent calls.
- Agent instructions separated from UI.
- Tool definitions for SIG360 records.
- Streaming response support.
- Tracing/observability where available.
- Validation checklist.

Avoid deprecated Assistants API patterns unless there is a specific compatibility reason.

## Suggested Agent Tools

Tools the agent may call through backend APIs:

- `search_clients`
- `get_client_summary`
- `list_client_appointments`
- `list_client_tasks`
- `create_task_draft`
- `draft_email`
- `draft_sms`
- `list_event_rsvps`
- `get_appointment_summary`
- `search_documents`
- `create_activity_note`
- `get_marketing_campaign_summary`

## Realtime Audio Direction

For realtime voice, use low-latency audio patterns through a browser client and secure server session/token route.

Responsibilities:

### Browser / Client

- Request microphone permission.
- Display mic/session state.
- Stream audio to realtime session.
- Play assistant audio.
- Show transcript if available.
- Handle disconnect/reconnect states.

### Server

- Hold OpenAI API key securely.
- Create ephemeral session/token.
- Enforce user authentication.
- Scope agent permissions.
- Log session metadata.
- Do not expose API key to browser.

## Security and Compliance Guardrails

AI should not:

- Provide personalized investment advice directly to clients.
- Recommend specific securities or insurance products.
- Send messages without approval.
- Access records outside user permissions.
- Expose internal notes to clients.
- Make irreversible changes without confirmation.

AI can:

- Draft content for review.
- Summarize records for authorized staff.
- Create draft tasks.
- Extract action items.
- Prepare meeting summaries.
- Suggest administrative next steps.

## AI Conversation Model

Suggested fields:

- id
- user_id
- conversation_title
- related_type
- related_id
- client_id_optional
- appointment_id_optional
- event_id_optional
- agent_name
- status
- created_at
- updated_at

## AI Agent Run Model

Suggested fields:

- id
- conversation_id
- user_id
- agent_name
- prompt
- response_summary
- tool_calls_json
- status
- error_message
- created_at

## Validation Checklist

- Agent only sees records the user can access.
- Agent streams progressive output in UI.
- Agent can call at least one backend tool.
- Agent can draft an email without sending it.
- Agent can create a draft task without completing it.
- Realtime session does not expose API key.
- Microphone permissions are handled gracefully.
- Disconnect/reconnect states are visible.
- Sensitive outputs are marked for review.

## Codex Implementation Notes

- Start with text-based internal agent first.
- Add realtime voice after the core agent tools are stable.
- Build AI output as drafts requiring review.
- Log agent runs.
- Create a visible “AI generated — review before use” label.
- Add environment variable setup for `OPENAI_API_KEY`.
