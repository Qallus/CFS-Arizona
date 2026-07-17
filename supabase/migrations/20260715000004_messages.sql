-- ============================================================
-- CFS — Internal direct messages
--
-- Lightweight staff messaging. Sender/recipient are captured by
-- label now (single-owner phase); a recipient_id FK to sig_profiles
-- can be added when real staff accounts exist.
--
-- Additive + idempotent.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS sig_messages (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name   text,
  recipient     text,
  subject       text,
  body          text        NOT NULL,
  read_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sig_messages_created ON sig_messages (created_at DESC);

ALTER TABLE sig_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sig_messages_read ON sig_messages;
CREATE POLICY sig_messages_read ON sig_messages FOR SELECT USING (sig_is_active_internal());

-- Seed a welcome message so the inbox isn't empty.
INSERT INTO sig_messages (sender_name, recipient, subject, body)
SELECT 'Steward', 'Team', 'Welcome to Steward messaging',
       'This is your internal message inbox. Direct messages between staff will appear here as your team grows.'
WHERE NOT EXISTS (SELECT 1 FROM sig_messages);
