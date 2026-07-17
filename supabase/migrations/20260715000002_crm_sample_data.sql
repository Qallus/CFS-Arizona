-- ============================================================
-- CFS CRM — Sample data (for viewing/demo)
--
-- Inserts a spread of sample contacts + opportunities across every
-- stage and disposition so the Contacts views (table/list/calendar/
-- kanban) and tabs have data to show.
--
-- Idempotent: guarded by source='sample'. Safe to re-run.
-- To remove later:
--   DELETE FROM sig_contacts WHERE source = 'sample';
--   (opportunities cascade via contact_id ON DELETE CASCADE)
-- ============================================================

INSERT INTO sig_contacts (source, external_id, first_name, last_name, full_name, email, mobile_phone, matter_type, referral_source, contact_type, status)
VALUES
  ('sample','sample-1','Margaret','Ellison','Margaret Ellison','margaret.ellison@example.com','(602) 555-0111','trust','Liu Elder Law','prospect','Active'),
  ('sample','sample-2','Frank','Delacroix','Frank Delacroix','frank.delacroix@example.com','(480) 555-0122','estate','Hospital discharge','prospect','Active'),
  ('sample','sample-3','Rosa','Ibarra','Rosa & Manuel Ibarra','rosa.ibarra@example.com','(623) 555-0133','poa,estate','Family referral','prospect','Active'),
  ('sample','sample-4','Harold','Hartley','The Hartley Trust','hartley.trust@example.com','(602) 555-0144','trust,estate','Behrmann & Assoc.','client','Active'),
  ('sample','sample-5','Dorothy','Kwan','Dorothy Kwan','dorothy.kwan@example.com','(480) 555-0155','conservatorship','Website inquiry','prospect','Active'),
  ('sample','sample-6','Albert','Simmons','Albert Simmons','albert.simmons@example.com','(623) 555-0166','guardianship','Attorney referral','prospect','Active'),
  ('sample','sample-7','Lien','Nguyen','Nguyen Family','lien.nguyen@example.com','(602) 555-0177','estate','Prior client','prospect','Active'),
  ('sample','sample-8','Paul','Rutherford','Paul Rutherford','paul.rutherford@example.com','(480) 555-0188','other','Website inquiry','prospect','Inactive')
ON CONFLICT (source, external_id) DO NOTHING;

INSERT INTO sig_opportunities
  (source, contact_id, stage, disposition, next_follow_up_at, deferred_until,
   interest_meeting_at, intake_meeting_at, cif_complete, ep_docs_complete, fee_complete, closed_won_at, closed_at)
SELECT 'sample', c.id, v.stage, v.disposition, v.followup, v.deferred,
       v.interest_at, v.intake_at, v.cif, v.ep, v.fee, v.won, v.closed
FROM (VALUES
  -- ext,        stage,       disposition,           followup,                    deferred,                    interest_at,                 intake_at,                   cif,   ep,    fee,   won,                         closed
  ('sample-1','awareness','active',              (now()+interval '5 days'),   NULL::timestamptz,           NULL::timestamptz,           NULL::timestamptz,           false, false, false, NULL::timestamptz,           NULL::timestamptz),
  ('sample-2','interest', 'active',              (now()+interval '9 days'),   NULL::timestamptz,           (now()-interval '3 days'),   NULL::timestamptz,           false, false, false, NULL::timestamptz,           NULL::timestamptz),
  ('sample-3','intake',   'active',              (now()+interval '3 days'),   NULL::timestamptz,           (now()-interval '20 days'),  (now()-interval '2 days'),   true,  false, false, NULL::timestamptz,           NULL::timestamptz),
  ('sample-4','nurture',  'active',              (now()+interval '20 days'),  NULL::timestamptz,           (now()-interval '60 days'),  (now()-interval '45 days'),  true,  true,  true,  (now()-interval '30 days'),  NULL::timestamptz),
  ('sample-5','interest', 're_engagement',       (now()+interval '1 day'),    NULL::timestamptz,           (now()-interval '15 days'),  NULL::timestamptz,           false, false, false, NULL::timestamptz,           NULL::timestamptz),
  ('sample-6','awareness','dormant_no_response', NULL::timestamptz,           NULL::timestamptz,           NULL::timestamptz,           NULL::timestamptz,           false, false, false, NULL::timestamptz,           NULL::timestamptz),
  ('sample-7','intake',   'dormant_deferred',    NULL::timestamptz,           (now()+interval '60 days'),  (now()-interval '40 days'),  (now()-interval '30 days'),  true,  false, false, NULL::timestamptz,           NULL::timestamptz),
  ('sample-8','interest', 'exit',                NULL::timestamptz,           NULL::timestamptz,           (now()-interval '25 days'),  NULL::timestamptz,           false, false, false, NULL::timestamptz,           (now()-interval '10 days'))
) AS v(ext, stage, disposition, followup, deferred, interest_at, intake_at, cif, ep, fee, won, closed)
JOIN sig_contacts c ON c.source = 'sample' AND c.external_id = v.ext
WHERE NOT EXISTS (
  SELECT 1 FROM sig_opportunities o WHERE o.contact_id = c.id AND o.source = 'sample'
);
