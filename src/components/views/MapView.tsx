'use client';

/**
 * Map view — OpenStreetMap tiles via Leaflet. No API key, no account, no
 * billing: the free option that stays free.
 *
 * Loaded through next/dynamic with ssr:false because Leaflet touches `window`
 * at import time and would break the server render.
 *
 * Addresses are resolved by /api/geocode, which caches and throttles on the
 * server. Records without a resolvable address are counted and reported rather
 * than silently dropped — a map that quietly omits half the caseload is worse
 * than one that admits it.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/page-parts';

export interface MapPoint<T> {
  item: T;
  id: string;
  title: string;
  subtitle?: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * A CSS-only marker. Leaflet's default icon resolves marker-icon.png through
 * the bundler and 404s under Next; a divIcon sidesteps that entirely and
 * inherits the app's brand colour.
 */
const pinIcon = L.divIcon({
  className: '',
  html: `<span style="
    display:block;width:18px;height:18px;border-radius:9999px;
    background:var(--brand,#0f766e);border:2px solid white;
    box-shadow:0 1px 4px rgba(0,0,0,.4);"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** Pan/zoom to fit whatever resolved, whenever that set changes. */
function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
      return;
    }
    map.fitBounds(
      L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])),
      { padding: [40, 40] },
    );
  }, [points, map]);
  return null;
}

export interface MapViewProps<T> {
  items: T[];
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  getSubtitle?: (item: T) => string | null;
  /** Full address string. Return null when the record has no address. */
  getAddress: (item: T) => string | null;
  onOpen?: (item: T) => void;
}

export default function MapView<T>({
  items,
  getId,
  getTitle,
  getSubtitle,
  getAddress,
  onOpen,
}: MapViewProps<T>) {
  const [coords, setCoords] = useState<Record<string, { lat: number; lng: number } | null>>({});
  const [loading, setLoading] = useState(false);
  const [deferred, setDeferred] = useState(0);
  const requested = useRef<Set<string>>(new Set());

  const addressed = useMemo(
    () =>
      items
        .map((item) => ({ item, address: getAddress(item) }))
        .filter((x): x is { item: T; address: string } => Boolean(x.address)),
    [items, getAddress],
  );

  useEffect(() => {
    const needed = [...new Set(addressed.map((a) => a.address))].filter(
      (a) => !requested.current.has(a.toLowerCase()),
    );
    if (needed.length === 0) return;
    needed.forEach((a) => requested.current.add(a.toLowerCase()));

    let alive = true;

    const resolve = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addresses: needed }),
        });
        const data = await res.json();
        if (!alive) return;
        const next: Record<string, { lat: number; lng: number } | null> = {};
        for (const r of data.results ?? []) {
          next[String(r.query).toLowerCase()] =
            r.latitude === null || r.longitude === null
              ? null
              : { lat: r.latitude, lng: r.longitude };
        }
        setCoords((prev) => ({ ...prev, ...next }));
        setDeferred(data.deferred ?? 0);
      } catch {
        // A failed lookup leaves the pin off the map; the counter below says so.
      } finally {
        if (alive) setLoading(false);
      }
    };

    resolve();
    return () => {
      alive = false;
    };
  }, [addressed]);

  const points: MapPoint<T>[] = useMemo(
    () =>
      addressed
        .map(({ item, address }): MapPoint<T> | null => {
          const c = coords[address.toLowerCase()];
          if (!c) return null;
          return {
            item,
            id: getId(item),
            title: getTitle(item),
            subtitle: getSubtitle?.(item) ?? undefined,
            address,
            lat: c.lat,
            lng: c.lng,
          };
        })
        .filter((p): p is MapPoint<T> => p !== null),
    [addressed, coords, getId, getTitle, getSubtitle],
  );

  const noAddress = items.length - addressed.length;
  const unresolved = addressed.length - points.length - (loading ? 0 : 0);

  if (items.length > 0 && addressed.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No addresses to map"
        description="Add an address to these records and they will appear here."
      />
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border">
        <MapContainer
          center={[33.4484, -112.074]} // Phoenix — CFS operates in Arizona.
          zoom={9}
          scrollWheelZoom
          style={{ height: 520, width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} />
          {points.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">{p.title}</p>
                  {p.subtitle && <p className="text-xs opacity-80">{p.subtitle}</p>}
                  <p className="text-xs opacity-70">{p.address}</p>
                  {onOpen && (
                    <button
                      type="button"
                      onClick={() => onOpen(p.item)}
                      className="text-xs font-medium underline"
                    >
                      Open record
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {loading && (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin" /> Locating addresses…
          </span>
        )}
        <span>
          {points.length} of {items.length} shown
        </span>
        {noAddress > 0 && <span>· {noAddress} with no address</span>}
        {!loading && unresolved > 0 && <span>· {unresolved} could not be located</span>}
        {deferred > 0 && (
          <span>· {deferred} still queued (open the map again to continue)</span>
        )}
      </div>
    </div>
  );
}
