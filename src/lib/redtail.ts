type RedtailPrimitive = string | number | boolean | null | undefined;

export type RedtailContact = Record<string, unknown>;

export interface Sig360Contact {
  id: string | number;
  external_id: string;
  source: 'redtail';
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  mobile_phone: string | null;
  home_phone: string | null;
  work_phone: string | null;
  status: string;
  contact_type: string;
  photo: string;
  avatar: string;
  city: string | null;
  state: string | null;
  zip_code: string;
  country: string;
  household_id: string | number | null;
  company_name: string;
  servicing_advisor: string | null;
  writing_advisor: string | null;
  assigned_planner: string | null;
  tags: unknown[];
  lists: unknown[];
  companies: unknown[];
  created_at: string | null;
  updated_at: string | null;
  last_activity: string | null;
  raw_redtail: RedtailContact;
}

export interface RedtailHousehold {
  external_id: string;
  name: string;
  raw: RedtailContact;
}

export interface RedtailNote {
  external_id: string;
  contact_external_id: string | null;
  body: string;
  category: string | null;
  note_type: string | null;
  author: string | null;
  redtail_created_at: string | null;
  raw: RedtailContact;
}

export interface RedtailAppointment {
  external_id: string;
  contact_external_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string | null;
  end_at: string | null;
  all_day: boolean;
  status: string | null;
  activity_type: string | null;
  assigned_to: string | null;
  raw: RedtailContact;
}

export interface RedtailContactsResult {
  contacts: Sig360Contact[];
  pagination: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
}

export interface RedtailContactsQuery {
  page?: string | number;
  perPage?: string | number;
  search?: string;
  status?: string;
  type?: string;
}

const DEFAULT_RETAIL_BASE_URL = 'https://api2.redtailtechnology.com/crm/v1/rest';

function cleanEnv(value: string | undefined) {
  if (!value) return '';
  if (value.startsWith('REPLACE_WITH_') || value.startsWith('your-')) return '';
  return value.trim();
}

function numberFrom(value: RedtailPrimitive, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function firstString(record: RedtailContact, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function firstValue(record: RedtailContact, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function stringOrNumber(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value;
  return null;
}

function booleanFrom(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return false;
}

function parseRedtailDate(value: unknown) {
  if (!value) return null;
  if (typeof value !== 'string') return null;

  const match = value.match(/\/Date\((\d+)(?:[+-]\d+)?\)\//);
  if (match) return new Date(Number(match[1])).toISOString();

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? value : new Date(parsed).toISOString();
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function buildRedtailAuthHeader() {
  const apiKey = cleanEnv(process.env.REDTAIL_API_KEY);
  const username = cleanEnv(process.env.REDTAIL_USERNAME);
  const password = cleanEnv(process.env.REDTAIL_PASSWORD);

  if (!apiKey || !username || !password) return '';

  return `Basic ${Buffer.from(`${apiKey}:${username}:${password}`).toString('base64')}`;
}

export function isRedtailConfigured() {
  return Boolean(
    cleanEnv(process.env.REDTAIL_API_BASE_URL) ||
      cleanEnv(process.env.REDTAIL_API_KEY)
  ) && Boolean(buildRedtailAuthHeader());
}

export function getRedtailConfigStatus() {
  return {
    hasBaseUrl: Boolean(cleanEnv(process.env.REDTAIL_API_BASE_URL) || DEFAULT_RETAIL_BASE_URL),
    hasApiKey: Boolean(cleanEnv(process.env.REDTAIL_API_KEY)),
    hasUsername: Boolean(cleanEnv(process.env.REDTAIL_USERNAME)),
    hasPassword: Boolean(cleanEnv(process.env.REDTAIL_PASSWORD)),
    syncEnabled: cleanEnv(process.env.REDTAIL_SYNC_ENABLED).toLowerCase() === 'true',
    syncDirection: cleanEnv(process.env.REDTAIL_SYNC_DIRECTION) || 'redtail_to_sig360',
  };
}

async function redtailRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = cleanEnv(process.env.REDTAIL_API_BASE_URL) || DEFAULT_RETAIL_BASE_URL;
  const authHeader = buildRedtailAuthHeader();

  if (!authHeader) {
    throw new Error('Redtail credentials are not configured. Set REDTAIL_API_KEY, REDTAIL_USERNAME, and REDTAIL_PASSWORD.');
  }

  const url = new URL(path.replace(/^\//, ''), `${baseUrl.replace(/\/$/, '')}/`);
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: authHeader,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Redtail API error: ${response.status}${body ? ` - ${body.slice(0, 300)}` : ''}`);
  }

  return response.json() as Promise<T>;
}

function extractContacts(payload: unknown): RedtailContact[] {
  if (Array.isArray(payload)) return payload as RedtailContact[];
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  const possibleCollections = [
    record.contacts,
    record.Contacts,
    record.data,
    record.Data,
    record.results,
    record.Results,
  ];

  for (const collection of possibleCollections) {
    if (Array.isArray(collection)) return collection as RedtailContact[];
  }

  return [];
}

function getPayloadTotal(payload: unknown, fallback: number) {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  return numberFrom(
    (record.total ?? record.Total ?? record.totalRecords ?? record.TotalRecords) as RedtailPrimitive,
    fallback
  );
}

function matchesSearch(contact: Sig360Contact, search: string) {
  if (!search) return true;
  const needle = search.toLowerCase();
  return [
    contact.full_name,
    contact.email,
    contact.phone || '',
    contact.mobile_phone || '',
    contact.company_name,
    contact.city || '',
    contact.state || '',
  ].some((value) => value.toLowerCase().includes(needle));
}

function matchesStatus(contact: Sig360Contact, status: string) {
  if (!status) return true;
  return contact.status.toLowerCase() === status.toLowerCase();
}

function matchesType(contact: Sig360Contact, type: string) {
  if (!type) return true;
  if (type === 'client') return !['prospect', 'lead'].includes(contact.contact_type.toLowerCase());
  if (type === 'lead') return ['prospect', 'lead'].includes(contact.contact_type.toLowerCase());
  if (type === 'company') return contact.contact_type.toLowerCase() === 'company';
  return true;
}

export function normalizeRedtailContact(contact: RedtailContact): Sig360Contact {
  const externalId = stringOrNumber(firstValue(contact, ['id', 'contactId', 'ContactID', 'ClientID', 'RecID', 'clientId']));
  const firstName = firstString(contact, ['firstName', 'FirstName', 'first_name', 'Firstname']);
  const lastName = firstString(contact, ['lastName', 'LastName', 'last_name', 'Lastname']);
  const fullName =
    firstString(contact, ['fullName', 'FullName', 'name', 'Name']) ||
    `${firstName} ${lastName}`.trim() ||
    firstString(contact, ['email', 'Email']) ||
    'Unknown';
  const email = firstString(contact, ['email', 'Email', 'emailAddress', 'EmailAddress']);
  const mobilePhone = firstString(contact, ['mobilePhone', 'MobilePhone', 'cellPhone', 'CellPhone']);
  const homePhone = firstString(contact, ['homePhone', 'HomePhone']);
  const workPhone = firstString(contact, ['workPhone', 'WorkPhone', 'officePhone', 'OfficePhone']);
  const phone = mobilePhone || homePhone || workPhone || firstString(contact, ['phone', 'Phone']);
  const isCompany = booleanFrom(contact.isCompany ?? contact.IsCompany);
  const isProspect = booleanFrom(contact.isProspect ?? contact.IsProspect);
  const householdId = stringOrNumber(firstValue(contact, ['householdId', 'HouseholdID']));
  const status =
    firstString(contact, ['status', 'Status', 'relationshipStatus', 'RelationshipStatus']) ||
    cleanEnv(process.env.REDTAIL_DEFAULT_CONTACT_STATUS) ||
    'Client';
  const contactType = isCompany ? 'company' : isProspect ? 'lead' : 'client';

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0E2971&color=fff`;

  return {
    id: externalId ?? `redtail-${email || fullName}`,
    external_id: String(externalId ?? ''),
    source: 'redtail',
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email,
    phone: phone || null,
    mobile_phone: mobilePhone || null,
    home_phone: homePhone || null,
    work_phone: workPhone || null,
    status,
    contact_type: contactType,
    photo: avatar,
    avatar,
    city: firstString(contact, ['city', 'City']) || null,
    state: firstString(contact, ['state', 'State']) || null,
    zip_code: firstString(contact, ['zip', 'Zip', 'postalCode', 'PostalCode']),
    country: firstString(contact, ['country', 'Country']),
    household_id: householdId,
    company_name: firstString(contact, ['companyName', 'CompanyName', 'businessName', 'BusinessName']),
    servicing_advisor:
      firstString(contact, ['servicingAdvisor', 'ServicingAdvisor', 'servicing_advisor', 'servicingAdvisorName']) ||
      null,
    writing_advisor:
      firstString(contact, ['writingAdvisor', 'WritingAdvisor', 'writing_advisor', 'writingAdvisorName']) || null,
    assigned_planner:
      firstString(contact, ['assignedPlanner', 'AssignedPlanner', 'planner', 'Planner', 'advisorName', 'AdvisorName']) ||
      null,
    tags: asArray(contact.tags ?? contact.Tags),
    lists: [],
    companies: [],
    created_at: parseRedtailDate(contact.createdOn ?? contact.CreatedOn ?? contact.RecAdd),
    updated_at: parseRedtailDate(contact.lastModifiedOn ?? contact.LastModifiedOn ?? contact.LastUpdate),
    last_activity: parseRedtailDate(contact.lastActivity ?? contact.LastActivity),
    raw_redtail: contact,
  };
}

export async function fetchRedtailContacts(query: RedtailContactsQuery = {}): Promise<RedtailContactsResult> {
  const page = numberFrom(query.page, 1);
  const perPage = numberFrom(
    query.perPage,
    numberFrom(cleanEnv(process.env.REDTAIL_SYNC_BATCH_SIZE), 100)
  );

  const payload = await redtailRequest<unknown>('/contacts');
  const normalized = extractContacts(payload)
    .map(normalizeRedtailContact)
    .filter((contact) => matchesSearch(contact, query.search || ''))
    .filter((contact) => matchesStatus(contact, query.status || ''))
    .filter((contact) => matchesType(contact, query.type || ''));

  const total = getPayloadTotal(payload, normalized.length);
  const start = (page - 1) * perPage;
  const contacts = normalized.slice(start, start + perPage);

  return {
    contacts,
    pagination: {
      total,
      perPage,
      currentPage: page,
      lastPage: Math.max(1, Math.ceil(total / perPage)),
    },
  };
}

// ─── Generic paginated collection fetch (for full sync) ─────
function extractCollection(payload: unknown, keys: string[]): RedtailContact[] {
  if (Array.isArray(payload)) return payload as RedtailContact[];
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as RedtailContact[];
  }
  // Common Redtail envelopes.
  for (const key of ['data', 'Data', 'results', 'Results', 'records', 'Records']) {
    const value = record[key];
    if (Array.isArray(value)) return value as RedtailContact[];
  }
  return [];
}

function payloadLastPage(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null;
  const meta = payload as Record<string, unknown>;
  const candidates = [meta.total_pages, meta.totalPages, meta.last_page, meta.lastPage, meta.pages];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const pagination = (meta.meta ?? meta.pagination) as Record<string, unknown> | undefined;
  if (pagination) {
    const n = Number(pagination.total_pages ?? pagination.last_page ?? pagination.pages);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function syncMaxPages(): number {
  return numberFrom(cleanEnv(process.env.REDTAIL_SYNC_MAX_PAGES), 50);
}

/**
 * Fetch every page of a Redtail collection. Bounded by REDTAIL_SYNC_MAX_PAGES
 * so a misconfigured endpoint can't loop forever. Returns raw records.
 */
async function fetchAllPages(path: string, keys: string[]): Promise<RedtailContact[]> {
  const maxPages = syncMaxPages();
  const out: RedtailContact[] = [];
  let lastPage: number | null = null;

  for (let page = 1; page <= maxPages; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const payload = await redtailRequest<unknown>(`${path}${sep}page=${page}`);
    const rows = extractCollection(payload, keys);
    if (!rows.length) break;
    out.push(...rows);
    if (lastPage === null) lastPage = payloadLastPage(payload);
    if (lastPage && page >= lastPage) break;
  }
  return out;
}

// ─── Households ─────────────────────────────────────────────
export function normalizeRedtailHousehold(raw: RedtailContact): RedtailHousehold {
  const externalId = stringOrNumber(firstValue(raw, ['id', 'familyId', 'FamilyID', 'householdId', 'HouseholdID']));
  const name =
    firstString(raw, ['name', 'Name', 'familyName', 'FamilyName', 'householdName', 'HouseholdName']) || 'Household';
  return { external_id: String(externalId ?? ''), name, raw };
}

/** Redtail "families" == SIG households. Returns [] if the endpoint is absent. */
export async function fetchRedtailHouseholds(): Promise<RedtailHousehold[]> {
  try {
    const rows = await fetchAllPages('/families', ['families', 'Families', 'family']);
    return rows.map(normalizeRedtailHousehold).filter((h) => h.external_id);
  } catch {
    return [];
  }
}

// ─── Activities → notes + appointments ──────────────────────
function activityContactId(raw: RedtailContact): string | null {
  const v = firstValue(raw, ['contactId', 'ContactID', 'contact_id', 'clientId', 'ClientID']);
  const s = stringOrNumber(v);
  return s !== null ? String(s) : null;
}

function isAppointmentActivity(raw: RedtailContact): boolean {
  const type = firstString(raw, ['activityType', 'ActivityType', 'type', 'Type', 'category', 'Category']).toLowerCase();
  if (/appointment|meeting|event|calendar/.test(type)) return true;
  // Has a start time → treat as calendar item.
  return Boolean(firstValue(raw, ['startDate', 'StartDate', 'start', 'Start', 'startTime', 'StartTime']));
}

function isNoteActivity(raw: RedtailContact): boolean {
  const type = firstString(raw, ['activityType', 'ActivityType', 'type', 'Type', 'category', 'Category']).toLowerCase();
  return /note/.test(type) || Boolean(firstValue(raw, ['note', 'Note', 'body', 'Body']));
}

export function normalizeRedtailNote(raw: RedtailContact): RedtailNote {
  const externalId = stringOrNumber(firstValue(raw, ['id', 'noteId', 'NoteID', 'activityId', 'ActivityID']));
  return {
    external_id: String(externalId ?? ''),
    contact_external_id: activityContactId(raw),
    body: firstString(raw, ['note', 'Note', 'body', 'Body', 'description', 'Description', 'text', 'Text']),
    category: firstString(raw, ['category', 'Category', 'noteCategory']) || null,
    note_type: firstString(raw, ['activityType', 'ActivityType', 'type', 'Type']) || null,
    author: firstString(raw, ['author', 'Author', 'createdBy', 'CreatedBy', 'user', 'User']) || null,
    redtail_created_at: parseRedtailDate(raw.createdOn ?? raw.CreatedOn ?? raw.date ?? raw.Date ?? raw.RecAdd),
    raw,
  };
}

export function normalizeRedtailAppointment(raw: RedtailContact): RedtailAppointment {
  const externalId = stringOrNumber(firstValue(raw, ['id', 'activityId', 'ActivityID', 'appointmentId', 'AppointmentID']));
  return {
    external_id: String(externalId ?? ''),
    contact_external_id: activityContactId(raw),
    title: firstString(raw, ['subject', 'Subject', 'title', 'Title', 'name', 'Name']) || 'Appointment',
    description: firstString(raw, ['description', 'Description', 'note', 'Note', 'body', 'Body']) || null,
    location: firstString(raw, ['location', 'Location']) || null,
    start_at: parseRedtailDate(
      raw.startDate ?? raw.StartDate ?? raw.start ?? raw.Start ?? raw.startTime ?? raw.StartTime,
    ),
    end_at: parseRedtailDate(raw.endDate ?? raw.EndDate ?? raw.end ?? raw.End ?? raw.endTime ?? raw.EndTime),
    all_day: booleanFrom(raw.allDay ?? raw.AllDay),
    status: firstString(raw, ['status', 'Status', 'activityCode', 'ActivityCode']) || null,
    activity_type: firstString(raw, ['activityType', 'ActivityType', 'type', 'Type']) || null,
    assigned_to: firstString(raw, ['assignedTo', 'AssignedTo', 'owner', 'Owner', 'user', 'User', 'advisor']) || null,
    raw,
  };
}

export interface RedtailActivitiesResult {
  notes: RedtailNote[];
  appointments: RedtailAppointment[];
}

/**
 * Fetch Redtail activities and split into notes vs appointments.
 * Tolerant of endpoint shape; returns empty sets if /activities is absent.
 */
export async function fetchRedtailActivities(): Promise<RedtailActivitiesResult> {
  let rows: RedtailContact[] = [];
  try {
    rows = await fetchAllPages('/activities', ['activities', 'Activities', 'activity']);
  } catch {
    return { notes: [], appointments: [] };
  }
  const notes: RedtailNote[] = [];
  const appointments: RedtailAppointment[] = [];
  for (const raw of rows) {
    if (isAppointmentActivity(raw)) {
      const a = normalizeRedtailAppointment(raw);
      if (a.external_id) appointments.push(a);
    } else if (isNoteActivity(raw)) {
      const n = normalizeRedtailNote(raw);
      if (n.external_id) notes.push(n);
    }
  }
  return { notes, appointments };
}

/** Fetch all contacts across pages (normalized) for a full sync. */
export async function fetchAllRedtailContacts(): Promise<Sig360Contact[]> {
  const rows = await fetchAllPages('/contacts', ['contacts', 'Contacts']);
  return rows.map(normalizeRedtailContact).filter((c) => c.external_id);
}
