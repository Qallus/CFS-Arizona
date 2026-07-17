-- ============================================================
-- CFS CRM — Lead servicing workflow (Salesforce-style path)
--
-- Adds the full lead lifecycle path onto sig_opportunities:
--   Lead Source -> Lead -> Qualification -> Conversion ->
--   Opportunity -> Closed (Won/Lost) -> Onboarding
--
-- These complement the fiduciary funnel (stage/disposition); the
-- workflow_stage drives the guided Path UI so every lead is serviced
-- through a consistent process.
--
-- Additive + idempotent.
-- ============================================================

ALTER TABLE sig_opportunities ADD COLUMN IF NOT EXISTS workflow_stage text NOT NULL DEFAULT 'lead_source';
ALTER TABLE sig_opportunities ADD COLUMN IF NOT EXISTS closed_status  text;  -- won | lost | NULL
ALTER TABLE sig_opportunities ADD COLUMN IF NOT EXISTS lead_source    text;
ALTER TABLE sig_opportunities ADD COLUMN IF NOT EXISTS campaign       text;

CREATE INDEX IF NOT EXISTS idx_sig_opps_workflow ON sig_opportunities (workflow_stage);

-- Seed the sample records with a spread of workflow stages so the Path UI
-- shows variety. Maps the fiduciary funnel stage onto the lifecycle.
UPDATE sig_opportunities o
SET workflow_stage = m.wf,
    closed_status  = m.cs,
    lead_source    = c.referral_source
FROM sig_contacts c,
     (VALUES
       ('sample-1','lead',          NULL),
       ('sample-2','qualification', NULL),
       ('sample-3','conversion',    NULL),
       ('sample-4','onboarding',    'won'),
       ('sample-5','qualification', NULL),
       ('sample-6','lead',          NULL),
       ('sample-7','conversion',    NULL),
       ('sample-8','lost',          'lost')
     ) AS m(ext, wf, cs)
WHERE o.contact_id = c.id
  AND c.source = 'sample'
  AND c.external_id = m.ext
  AND o.source = 'sample';
