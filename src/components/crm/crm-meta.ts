// Shared labels, tones, and tab logic for the CFS CRM funnel.
// Keeps the UI consistent with the outline's stage/disposition vocabulary.

export type Stage = 'awareness' | 'interest' | 'intake' | 'nurture';
export type Disposition =
  | 'active'
  | 're_engagement'
  | 'dormant_no_response'
  | 'dormant_deferred'
  | 'exit';

type Tone = 'neutral' | 'brand' | 'good' | 'warning' | 'critical' | 'info';

export const STAGES: Stage[] = ['awareness', 'interest', 'intake', 'nurture'];

export const stageLabel: Record<Stage, string> = {
  awareness: 'Awareness',
  interest: 'Interest',
  intake: 'Intake',
  nurture: 'FF Client',
};

export const stageBlurb: Record<Stage, string> = {
  awareness: 'Inquiry or referral received; booking the interest meeting.',
  interest: 'Interest meeting held; CIF engagement has begun.',
  intake: 'Intake meeting held; completion items may be outstanding.',
  nurture: 'CIF, EP docs, and fee complete — active future-fee client.',
};

export const stageTone: Record<Stage, Tone> = {
  awareness: 'info',
  interest: 'brand',
  intake: 'warning',
  nurture: 'good',
};

export const dispositionLabel: Record<Disposition, string> = {
  active: 'Active',
  re_engagement: 'Re-engagement',
  dormant_no_response: 'Dormant · no response',
  dormant_deferred: 'Dormant · deferred',
  exit: 'Exit',
};

export const dispositionTone: Record<Disposition, Tone> = {
  active: 'good',
  re_engagement: 'warning',
  dormant_no_response: 'neutral',
  dormant_deferred: 'neutral',
  exit: 'critical',
};

export const matterTypeLabel: Record<string, string> = {
  trust: 'Trust',
  estate: 'Estate',
  poa: 'Power of attorney',
  conservatorship: 'Conservatorship',
  guardianship: 'Guardianship',
  other: 'Other',
};

export const MATTER_TYPES = ['trust', 'estate', 'poa', 'conservatorship', 'guardianship', 'other'];

/** Matter type is stored as a comma-separated string to allow multiple. */
export function parseMatterTypes(value?: string | null): string[] {
  if (!value) return [];
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

export function formatMatterTypes(value?: string | null): string {
  const parts = parseMatterTypes(value);
  if (parts.length === 0) return '';
  return parts.map((v) => matterTypeLabel[v] ?? v).join(', ');
}

// Tab definitions (full funnel + dispositions).
export type TabKey = 'all' | 'prospects' | 'prospective_ff' | 'ff_clients' | 'dormant' | 'exit';

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'prospects', label: 'Prospects' },
  { key: 'prospective_ff', label: 'Prospective FF' },
  { key: 'ff_clients', label: 'FF Clients' },
  { key: 'dormant', label: 'Dormant' },
  { key: 'exit', label: 'Exit' },
];

export interface FunnelRecord {
  stage: Stage;
  disposition: Disposition;
}

/** Whether a record belongs in a given tab. Mapping is intentionally simple
 *  and easy to adjust as CFS refines definitions. */
export function matchesTab(rec: FunnelRecord, tab: TabKey): boolean {
  const isDormant = rec.disposition === 'dormant_no_response' || rec.disposition === 'dormant_deferred';
  const isExit = rec.disposition === 'exit';
  switch (tab) {
    case 'all':
      return true;
    case 'prospects':
      return !isDormant && !isExit && (rec.stage === 'awareness' || rec.stage === 'interest');
    case 'prospective_ff':
      return !isDormant && !isExit && rec.stage === 'intake';
    case 'ff_clients':
      return !isExit && rec.stage === 'nurture';
    case 'dormant':
      return isDormant;
    case 'exit':
      return isExit;
    default:
      return false;
  }
}

export function contactDisplayName(c: { fullName?: string | null; firstName?: string | null; lastName?: string | null } | null | undefined): string {
  if (!c) return 'Unnamed';
  if (c.fullName) return c.fullName;
  const n = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
  return n || 'Unnamed';
}
