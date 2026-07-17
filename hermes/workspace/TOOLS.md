# Tool Configuration & Notes

## Communication Tools

### Twilio
- **Voice number**: `TWILIO_PHONE_NUMBER`
- **SMS number**: `TWILIO_SMS_PHONE_NUMBER`
- **TwiML App SID**: `TWILIO_TWIML_APP_SID`
- **Account SID**: `TWILIO_ACCOUNT_SID`
- Use voice for outbound sales calls, SMS for quick follow-ups and confirmations

### Email (IMAP/SMTP — Hostinger)
- **Address**: hello@channelcast.io
- **IMAP**: imap.hostinger.com:993 (SSL)
- **SMTP**: smtp.hostinger.com:465 (SSL)
- Check inbox before composing — avoid duplicating outreach

### Resend
- Use for bulk/marketing email
- Templates available via `/api/email/templates`
- API key in environment: `RESEND_API_KEY`

## Data Tools

### Supabase
- **URL**: 
- Primary CRM data store: contacts, leads, deals, invoices, projects, tasks
- Auth: `SUPABASE_SERVICE_ROLE_KEY` for server-side writes


### n8n
- **URL**: https://n8n.sig360.com
- Handles webhook-triggered automations
- Call workflows via the n8n REST API when orchestration is needed


## Content Tools

### WordPress (channelcast.io)
- **REST API**: 
- Use for publishing blog posts and marketing content
- Auth: Application Password via `WP_APPLICATION_USERNAME` / `WP_APPLICATION_PASSWORD`

### Cal.com (Self-Hosted)
- **URL**: 
- Appointment scheduling
- Webhook: `/api/appointments` receives booking/cancellation events

## Scheduling (Cron)

- Manage via SIG360 dashboard → Cron page
- Or via gateway API: `GET /api/cron/list`, `POST /api/cron`
- Use descriptive job names (e.g. "Daily lead follow-up check", "Weekly pipeline review")

## Notes

- All secrets are stored as environment variables in the Hermes container
- Never hard-code credentials in skills, memory, or tool config files
- For new integrations: add to `.env`, document here, then reload Hermes
