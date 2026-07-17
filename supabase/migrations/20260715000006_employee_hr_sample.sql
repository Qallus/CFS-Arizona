-- ============================================================
-- CFS — Employee HR sample data (demo only)
--
-- Adds a few sample staff with varying document completion so the
-- portal's stat cards are meaningful, plus sample mileage entries.
--
-- Idempotent. To remove later:
--   DELETE FROM sig_profiles WHERE email LIKE '%@example.com';
--   (their documents + mileage cascade)
-- ============================================================

-- ─── SAMPLE STAFF ─────────────────────────────────────────
INSERT INTO sig_profiles (first_name, last_name, display_name, email, role, status, is_internal_user)
SELECT v.first, v.last, v.display, v.email, v.role::sig_user_role, 'active'::sig_user_status, true
FROM (VALUES
  ('Maria','Reyes','Maria Reyes','maria.reyes@example.com','client_service_associate'),
  ('Daniel','Cho','Daniel Cho','daniel.cho@example.com','planner_administrator'),
  ('Tanya','Brooks','Tanya Brooks','tanya.brooks@example.com','support_operations'),
  ('Andre','Willis','Andre Willis','andre.willis@example.com','compliance_reviewer')
) AS v(first, last, display, email, role)
WHERE NOT EXISTS (SELECT 1 FROM sig_profiles p WHERE lower(p.email) = v.email);

-- ─── SAMPLE DOCUMENTS ─────────────────────────────────────
-- Completion is measured against the 7 REQUIRED types:
--   Maria 7/7 (100%) · Jeremy 5/7 · Daniel 4/7 · Tanya 2/7 · Andre 0/7
INSERT INTO sig_employee_documents (profile_id, doc_type_id, file_name, file_url, status, verified_at, uploaded_at)
SELECT p.id, t.id,
       v.doc_key || '.pdf',
       NULL,
       v.status,
       CASE WHEN v.status = 'verified' THEN now() - interval '10 days' ELSE NULL END,
       now() - interval '20 days'
FROM (VALUES
  -- Maria — fully up to date
  ('maria.reyes@example.com','auto_insurance','verified'),
  ('maria.reyes@example.com','drivers_license','verified'),
  ('maria.reyes@example.com','driving_record','verified'),
  ('maria.reyes@example.com','employment_agreement','verified'),
  ('maria.reyes@example.com','confidentiality','verified'),
  ('maria.reyes@example.com','background_check','verified'),
  ('maria.reyes@example.com','w4','verified'),
  -- Daniel — partial, one awaiting verification
  ('daniel.cho@example.com','auto_insurance','verified'),
  ('daniel.cho@example.com','drivers_license','verified'),
  ('daniel.cho@example.com','employment_agreement','verified'),
  ('daniel.cho@example.com','w4','verified'),
  ('daniel.cho@example.com','confidentiality','uploaded'),
  -- Tanya — just started
  ('tanya.brooks@example.com','auto_insurance','verified'),
  ('tanya.brooks@example.com','drivers_license','verified'),
  ('tanya.brooks@example.com','driving_record','uploaded'),
  -- Jeremy — mostly complete, one awaiting verification
  ('jeremy@channelcast.io','auto_insurance','verified'),
  ('jeremy@channelcast.io','drivers_license','verified'),
  ('jeremy@channelcast.io','driving_record','verified'),
  ('jeremy@channelcast.io','employment_agreement','verified'),
  ('jeremy@channelcast.io','confidentiality','verified'),
  ('jeremy@channelcast.io','background_check','uploaded')
) AS v(email, doc_key, status)
JOIN sig_profiles p ON lower(p.email) = v.email
JOIN sig_employee_doc_types t ON t.key = v.doc_key
ON CONFLICT (profile_id, doc_type_id) DO NOTHING;

-- ─── SAMPLE MILEAGE ───────────────────────────────────────
INSERT INTO sig_mileage_logs (profile_id, trip_date, purpose, from_location, to_location, miles, status)
SELECT p.id, (current_date - v.days_ago), v.purpose, v.from_loc, v.to_loc, v.miles, v.status
FROM (VALUES
  ('jeremy@channelcast.io',  2, 'Client visit — Prescott conservatorship',      'Office (Peoria)',  'Sunrise Senior Living',   18.4, 'submitted'),
  ('jeremy@channelcast.io',  5, 'Court filing — Maricopa County',               'Office (Peoria)',  'Maricopa County Court',   26.2, 'approved'),
  ('jeremy@channelcast.io', 12, 'Property check — Whitfield trust',             'Office (Peoria)',  '4th St. duplex',          31.8, 'reimbursed'),
  ('maria.reyes@example.com', 3, 'Care conference — Dr. Sandoval',              'Office (Chandler)','Banner Geriatrics',       14.6, 'submitted'),
  ('maria.reyes@example.com', 9, 'Intake meeting — Ibarra family',              'Office (Chandler)','Client residence',        22.1, 'approved')
) AS v(email, days_ago, purpose, from_loc, to_loc, miles, status)
JOIN sig_profiles p ON lower(p.email) = v.email
WHERE NOT EXISTS (
  SELECT 1 FROM sig_mileage_logs m WHERE m.profile_id = p.id AND m.purpose = v.purpose
);
