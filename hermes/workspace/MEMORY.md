# Memory

Long-term memory index for the SIG360 AI.  
Update this file when important facts, preferences, or decisions need to persist across sessions.

---

## System

- **Platform**: SIG360 — deployed at sig360.com
- **Agent**: Hermes (NousResearch) via Docker on Coolify / Hostinger VPS
- **Initialized**: 2026-05-12
- **Next.js App**: sig360-dashboard (Next.js 16, React 19, Tailwind 4)

## Business Context

- **Company**: Qallus (qallus.co)
- **Owner**: Jeremy Waters (jwaters@qallus.co)
- **Industry**: Business services
- **Primary market**: Small-to-medium businesses

## Active Integrations

| Service | URL | Status |
|---------|-----|--------|
| Supabase | supabase.cueallus.com | Active |
| Twilio | — | Active |
| Square | — | Active |
| n8n | n8n.cueallus.com | Active |
| NocoDB | nocodb.cueallus.com | Active |
| Cal.com | meet.cueallus.com | Active |
| WordPress | channelcast.io | Active |
| Resend | — | Active |
| Directus | directus.cueallus.com | Active |

## Key Operational Facts

- Lead follow-up target: within 24 hours of capture
- All client data lives in Supabase; NocoDB is read-only reporting
- Invoice reminders: 3 days before due → day-of → 3 days after overdue
- Dashboard is primary management interface; Telegram for quick tasks

## Daily Logs

Daily memory logs are stored in `memory/YYYY-MM-DD.md`.
Browse and edit them in the SIG360 dashboard → Memory page.
