/**
 * POST /api/geocode — resolve addresses to coordinates for the Map view.
 *
 * Uses Nominatim, OpenStreetMap's geocoder: free, no API key, no account.
 * In exchange it asks for at most ~1 request/second, a real User-Agent, and
 * that callers cache results. All three are honoured here — which is why this
 * is a server route rather than a browser fetch: the browser cannot be trusted
 * to rate-limit itself across tabs, and a client-side call would expose every
 * lookup as a separate hit from a different IP.
 *
 * Misses are cached too, so an unresolvable address is asked once, not once
 * per render.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, crmError } from '@/lib/crm/http';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
/** Nominatim's policy asks for an identifying User-Agent with contact info. */
const USER_AGENT =
  process.env.GEOCODER_USER_AGENT || 'CFS-Arizona-Dashboard/1.0 (hello@cfsarizona.com)';
/** Their guidance is 1 req/sec; leave headroom. */
const THROTTLE_MS = 1200;
/** Cap per request so one page load cannot start a minutes-long crawl. */
const MAX_UNCACHED_LOOKUPS = 8;

interface Resolved {
  query: string;
  latitude: number | null;
  longitude: number | null;
  displayName: string | null;
}

function normalize(address: string): string {
  return address.trim().replace(/\s+/g, ' ');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function lookupUpstream(query: string): Promise<Resolved> {
  const url = `${NOMINATIM}?format=json&limit=1&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!res.ok) return { query, latitude: null, longitude: null, displayName: null };
    const hits = (await res.json()) as { lat?: string; lon?: string; display_name?: string }[];
    const hit = Array.isArray(hits) ? hits[0] : undefined;
    if (!hit?.lat || !hit?.lon) return { query, latitude: null, longitude: null, displayName: null };
    return {
      query,
      latitude: Number(hit.lat),
      longitude: Number(hit.lon),
      displayName: hit.display_name ?? null,
    };
  } catch {
    return { query, latitude: null, longitude: null, displayName: null };
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;

  let addresses: string[];
  try {
    const body = (await req.json()) as { addresses?: unknown };
    addresses = Array.isArray(body.addresses)
      ? [...new Set(body.addresses.map((a) => normalize(String(a))).filter(Boolean))]
      : [];
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (addresses.length === 0) return NextResponse.json({ results: [] });

  try {
    // 1. Everything already known, in one query.
    const { data: cached } = await supabaseAdmin
      .from('sig_geocode_cache')
      .select('query, latitude, longitude, display_name')
      .in('query', addresses);

    const results = new Map<string, Resolved>();
    for (const row of (cached ?? []) as {
      query: string;
      latitude: number | null;
      longitude: number | null;
      display_name: string | null;
    }[]) {
      results.set(row.query.toLowerCase(), {
        query: row.query,
        latitude: row.latitude,
        longitude: row.longitude,
        displayName: row.display_name,
      });
    }

    // 2. Whatever is left, sequentially and throttled.
    const missing = addresses.filter((a) => !results.has(a.toLowerCase()));
    const toLookup = missing.slice(0, MAX_UNCACHED_LOOKUPS);

    for (let i = 0; i < toLookup.length; i++) {
      if (i > 0) await sleep(THROTTLE_MS);
      const resolved = await lookupUpstream(toLookup[i]);
      results.set(toLookup[i].toLowerCase(), resolved);

      await supabaseAdmin.from('sig_geocode_cache').upsert(
        {
          query: resolved.query,
          latitude: resolved.latitude,
          longitude: resolved.longitude,
          display_name: resolved.displayName,
          resolved: resolved.latitude !== null,
        },
        { onConflict: 'query' },
      );
    }

    return NextResponse.json({
      results: [...results.values()],
      // Tell the client what was skipped so the map can say so rather than
      // silently omitting pins.
      deferred: Math.max(0, missing.length - toLookup.length),
    });
  } catch (err) {
    return crmError(err);
  }
}
