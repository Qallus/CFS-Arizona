-- ============================================================
-- CFS — Geocoding cache + client addresses  v1
--
-- Backs the Map view. Coordinates are cached by normalized address
-- rather than stored as lat/lng columns on every table, so any record
-- with an address becomes mappable without a schema change.
--
-- The cache is not an optimization: Nominatim (OpenStreetMap's free
-- geocoder) permits roughly one request per second and asks that
-- results be cached rather than re-requested. Without this table the
-- Map view would hammer a free public service on every page load.
--
-- Idempotent: safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS sig_geocode_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query        TEXT NOT NULL,
  latitude     DOUBLE PRECISION,
  longitude    DOUBLE PRECISION,
  display_name TEXT,
  -- A miss is cached too. Re-asking for an address that cannot be
  -- resolved, on every render, is the worst case for a rate-limited
  -- free service.
  resolved     BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sig_geocode_query ON sig_geocode_cache (lower(query));

-- ─── CLIENT ADDRESSES ─────────────────────────────────────
-- Where a ward physically is. sig_clients already carries the facility
-- name; these give it somewhere on a map.
ALTER TABLE sig_clients ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE sig_clients ADD COLUMN IF NOT EXISTS city          TEXT;
ALTER TABLE sig_clients ADD COLUMN IF NOT EXISTS state         TEXT;
ALTER TABLE sig_clients ADD COLUMN IF NOT EXISTS postal_code   TEXT;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
-- The cache holds addresses of protected persons. Server-side only.
ALTER TABLE sig_geocode_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sig_geocode_read ON sig_geocode_cache;
CREATE POLICY sig_geocode_read ON sig_geocode_cache
  FOR SELECT USING (sig_is_active_internal());
