import { Task, Priority, EnergyLevel } from '../types/todo';
import { CalConnection } from './oauth';

/**
 * Two-way sync engine for providers with a real public REST API.
 *
 * Providers without one (Apple, Proton, Notion, TimeTree, Any.do) are
 * ICS-only by necessity, not by choice — see LIVE_SYNC_PROVIDERS.
 */

export const LIVE_SYNC_PROVIDERS = ['google', 'microsoft'] as const;
export type LiveSyncProvider = (typeof LIVE_SYNC_PROVIDERS)[number];

export const isLiveCapable = (id: string): id is LiveSyncProvider =>
  (LIVE_SYNC_PROVIDERS as readonly string[]).includes(id);

/* Remembers which remote event belongs to which local task, per provider.
   Without this, a full re-pull cannot tell "new remote event" from
   "event I created last time". */
const LINK_PREFIX = 'jemi_cal_link_';

export interface EventLink {
  taskId: string;
  eventId: string;
  etag?: string;
  lastSynced: number;
}

function loadLinks(provider: string): Record<string, EventLink> {
  try {
    const raw = localStorage.getItem(LINK_PREFIX + provider);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLinks(provider: string, links: Record<string, EventLink>): void {
  try {
    localStorage.setItem(LINK_PREFIX + provider, JSON.stringify(links));
  } catch {
    // Quota exceeded on a very long history; sync still works this pass.
  }
}

export function getLinks(provider: string): Record<string, EventLink> {
  return loadLinks(provider);
}

export function resetLinks(provider: string): void {
  localStorage.removeItem(LINK_PREFIX + provider);
}

/* ------------------------------ mapping ------------------------------- */

const PRIORITY_TO_ICS: Record<Priority, number> = {
  urgent: 1,
  important: 3,
  soft: 5,
  chill: 7,
};

function icsToPriority(n: number | undefined): Priority {
  if (!n) return 'important';
  if (n <= 2) return 'urgent';
  if (n <= 4) return 'important';
  if (n <= 6) return 'soft';
  return 'chill';
}

function energyFromTag(tags: string[]): EnergyLevel {
  const found = tags.find((t) => t.startsWith('jemi-energy-'));
  if (found === 'jemi-energy-boss') return 'boss';
  if (found === 'jemi-energy-cozy') return 'cozy';
  return 'flow';
}

/** Tag every task with its energy so a round-trip restores it exactly. */
export function withSyncTags(task: Task): Task {
  const tags = task.tags.filter((t) => !t.startsWith('jemi-energy-'));
  tags.push(`jemi-energy-${task.energy}`);
  return { ...task, tags };
}

/**
 * Strips a task back to what the user wrote. Sync metadata and category
 * bookkeeping must not appear in their exported/imported data.
 */
export function stripSyncTags(task: Task): Task {
  return { ...task, tags: task.tags.filter((t) => !t.startsWith('jemi-energy-')) };
}

export interface RemoteEvent {
  id: string;
  etag?: string;
  summary: string;
  description?: string;
  /** ISO date (YYYY-MM-DD) */
  date?: string;
  /** HH:mm */
  time?: string;
  priority?: number;
  tags: string[];
  allDay: boolean;
}

/* ------------------------------- Google ------------------------------- */

const GOOGLE_API = 'https://www.googleapis.com/calendar/v3';

interface GoogleEvent {
  id?: string;
  etag?: string;
  status?: string;
  summary?: string;
  description?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  extendedProperties?: { private?: Record<string, string> };
}

function splitGoogleDateTime(dt: string): { date: string; time?: string } {
  // 2026-09-30T15:30:00 or with a zone suffix we drop.
  const m = dt.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (m) return { date: m[1], time: m[2] };
  return { date: dt.slice(0, 10) };
}

function toRemote(ev: GoogleEvent): RemoteEvent | null {
  const start = ev.start?.dateTime ?? ev.start?.date;
  if (!start) return null;
  const allDay = Boolean(ev.start?.date);
  const { date, time } = allDay
    ? { date: (ev.start!.date as string).slice(0, 10), time: undefined }
    : splitGoogleDateTime(start);
  const tags = (ev.description ?? '')
    .split(/\s+/)
    .filter((t) => t.startsWith('#'))
    .map((t) => t.slice(1));
  return {
    id: ev.id ?? '',
    etag: ev.etag,
    summary: ev.summary ?? '(untitled)',
    description: ev.description,
    date,
    time,
    tags,
    allDay,
  };
}

function googleEventBody(task: Task): object {
  const t = withSyncTags(task);
  const date = task.dueDate!;
  const start = task.dueTime
    ? { dateTime: `${date}T${task.dueTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    : { date };
  const endDate = new Date(`${date}T00:00:00`);
  endDate.setDate(endDate.getDate() + 1);
  const end = task.dueTime
    ? { dateTime: `${date}T${addMinutes(task.dueTime, 45)}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    : { date: endDate.toISOString().slice(0, 10) };

  const descLines: string[] = [];
  if (task.notes) descLines.push(task.notes);
  if (t.tags.length) descLines.push(t.tags.map((x) => `#${x}`).join(' '));

  return {
    summary: task.title,
    description: descLines.join('\n\n'),
    start,
    end,
    // Extended properties are the reliable place to stash our link id;
    // the description is user-visible and can be edited freely.
    extendedProperties: { private: { jemiTaskId: task.id } },
  };
}

async function googleFetch(
  conn: CalConnection,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(`${GOOGLE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${conn.accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 410) {
    // syncToken is stale; caller should fall back to a full sync.
    throw new SyncCursorInvalidError();
  }
  if (res.status === 401) throw new TokenExpiredError();
  if (!res.ok) throw new Error(`Google API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

export class SyncCursorInvalidError extends Error {
  constructor() {
    super('Sync cursor expired');
    this.name = 'SyncCursorInvalidError';
  }
}

export class TokenExpiredError extends Error {
  constructor() {
    super('Access token expired');
    this.name = 'TokenExpiredError';
  }
}

/**
 * Pulls changed events. Uses the incremental syncToken when we have
 * one, which is far cheaper and avoids rewriting every task.
 */
export async function pullGoogle(
  conn: CalConnection,
): Promise<{ events: RemoteEvent[]; nextToken: string | null }> {
  const events: RemoteEvent[] = [];
  let pageToken: string | null = null;
  let nextSync: string | null = null;

  do {
    const params = new URLSearchParams({
      maxResults: '250',
      showDeleted: 'true',
      singleEvents: 'true',
    });
    if (conn.syncToken) {
      params.set('syncToken', conn.syncToken);
    } else {
      // Bounded window: a full history import is rarely what people want.
      const from = new Date();
      from.setFullYear(from.getFullYear() - 2);
      params.set('timeMin', from.toISOString());
      params.set('orderBy', 'startTime');
    }
    if (pageToken) params.set('pageToken', pageToken);

    const res = await googleFetch(conn, `/calendars/${encodeURIComponent(conn.calendarId)}/events?${params}`);
    const data = await res.json();
    for (const ev of (data.items ?? []) as GoogleEvent[]) {
      if (ev.status === 'cancelled') {
        events.push({ id: ev.id!, etag: ev.etag, summary: '', tags: [], allDay: false });
        continue;
      }
      const mapped = toRemote(ev);
      if (mapped) events.push(mapped);
    }
    pageToken = data.nextPageToken ?? null;
    nextSync = data.nextSyncToken ?? nextSync;
  } while (pageToken);

  return { events, nextToken: nextSync };
}

export async function createGoogleEvent(conn: CalConnection, task: Task): Promise<RemoteEvent> {
  const res = await googleFetch(conn, `/calendars/${encodeURIComponent(conn.calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(googleEventBody(task)),
  });
  return toRemote(await res.json())!;
}

export async function updateGoogleEvent(
  conn: CalConnection,
  eventId: string,
  task: Task,
  etag?: string,
): Promise<RemoteEvent> {
  const headers: Record<string, string> = {};
  if (etag) headers.IfMatch = etag;
  const res = await googleFetch(
    conn,
    `/calendars/${encodeURIComponent(conn.calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'PUT', body: JSON.stringify(googleEventBody(task)), headers },
  );
  return toRemote(await res.json())!;
}

export async function deleteGoogleEvent(conn: CalConnection, eventId: string): Promise<void> {
  await googleFetch(
    conn,
    `/calendars/${encodeURIComponent(conn.calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE' },
  );
}

export async function listGoogleCalendars(conn: CalConnection): Promise<{ id: string; name: string; primary: boolean }[]> {
  const res = await fetch(`${GOOGLE_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${conn.accessToken}` },
  });
  if (!res.ok) throw new Error(`Could not list calendars (${res.status})`);
  const data = await res.json();
  return (data.items ?? []).map((c: { id: string; summary: string; primary?: boolean }) => ({
    id: c.id,
    name: c.summary,
    primary: Boolean(c.primary),
  }));
}

/* ----------------------------- Microsoft ------------------------------ */

const GRAPH = 'https://graph.microsoft.com/v1.0';

interface GraphEvent {
  id: string;
  '@odata.etag'?: string;
  subject?: string;
  body?: { contentType?: string; content?: string };
  start?: { dateTime: string; timeZone?: string };
  end?: { dateTime: string; timeZone?: string };
  isAllDay?: boolean;
  categories?: string[];
  importance?: 'low' | 'normal' | 'high';
  showAs?: string;
}

function graphToRemote(ev: GraphEvent): RemoteEvent | null {
  if (!ev.start?.dateTime) return null;
  const { date, time } = splitGoogleDateTime(ev.start.dateTime);
  return {
    id: ev.id,
    etag: ev['@odata.etag'],
    summary: ev.subject ?? '(untitled)',
    description: ev.body?.content,
    date,
    time,
    tags: (ev.categories ?? []).filter((c) => c !== 'jemi'),
    allDay: Boolean(ev.isAllDay),
  };
}

function graphBody(task: Task): object {
  const t = withSyncTags(task);
  const date = task.dueDate!;
  const startTime = task.dueTime ?? '09:00';
  const endTime = task.dueTime ? addMinutes(task.dueTime, 45) : '09:45';
  const desc: string[] = [];
  if (task.notes) desc.push(task.notes);
  if (t.tags.length) desc.push(t.tags.map((x) => `#${x}`).join(' '));

  return {
    subject: task.title,
    body: { contentType: 'text', content: desc.join('\n\n') },
    start: { dateTime: `${date}T${startTime}:00`, timeZone: 'UTC' },
    end: { dateTime: `${date}T${endTime}:00`, timeZone: 'UTC' },
    isAllDay: !task.dueTime,
    importance: task.priority === 'urgent' ? 'high' : task.priority === 'chill' ? 'low' : 'normal',
    // Free rather than Busy: a to-do item should not block your calendar.
    showAs: 'free',
    categories: ['jemi', ...t.tags],
  };
}

async function graphFetch(conn: CalConnection, path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${conn.accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'outlook.timezone="UTC"',
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 410) throw new SyncCursorInvalidError();
  if (res.status === 401) throw new TokenExpiredError();
  if (!res.ok) throw new Error(`Graph API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

export async function pullMicrosoft(
  conn: CalConnection,
): Promise<{ events: RemoteEvent[]; nextToken: string | null }> {
  // Graph uses $deltatoken for incremental sync.
  const deltaPath = conn.syncToken
    ? `/me/calendars/${encodeURIComponent(conn.calendarId)}/calendarView/delta?$deltatoken=${encodeURIComponent(conn.syncToken)}`
    : `/me/calendars/${encodeURIComponent(conn.calendarId)}/events?$top=250&$select=id,subject,body,start,end,isAllDay,categories,importance`;

  const events: RemoteEvent[] = [];
  let path: string | null = deltaPath;
  let deltaLink: string | null = null;

  while (path) {
    const res: Response = await graphFetch(conn, path);
    const data: { value?: GraphEvent[]; '@odata.deltaLink'?: string; '@odata.nextLink'?: string } =
      await res.json();
    for (const ev of data.value ?? []) {
      if (ev['@odata.etag'] === undefined && ev.subject === undefined) {
        events.push({ id: ev.id, summary: '', tags: [], allDay: false });
        continue;
      }
      const mapped = graphToRemote(ev);
      if (mapped) events.push(mapped);
    }
    if (data['@odata.nextLink']) {
      path = data['@odata.nextLink'].replace(GRAPH, '');
    } else {
      deltaLink = data['@odata.deltaLink'] ?? null;
      path = null;
    }
  }

  return { events, nextToken: deltaLink };
}

export async function createMicrosoftEvent(conn: CalConnection, task: Task): Promise<RemoteEvent> {
  const res = await graphFetch(
    conn,
    `/me/calendars/${encodeURIComponent(conn.calendarId)}/events`,
    { method: 'POST', body: JSON.stringify(graphBody(task)) },
  );
  return graphToRemote(await res.json())!;
}

export async function updateMicrosoftEvent(
  conn: CalConnection,
  eventId: string,
  task: Task,
  etag?: string,
): Promise<RemoteEvent> {
  const headers: Record<string, string> = {};
  if (etag) headers['If-Match'] = etag;
  const res = await graphFetch(conn, `/me/calendars/${encodeURIComponent(conn.calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: JSON.stringify(graphBody(task)),
    headers,
  });
  return graphToRemote(await res.json())!;
}

export async function deleteMicrosoftEvent(conn: CalConnection, eventId: string): Promise<void> {
  await graphFetch(conn, `/me/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
}

export async function listMicrosoftCalendars(conn: CalConnection): Promise<{ id: string; name: string; primary: boolean }[]> {
  const res = await graphFetch(conn, '/me/calendars?$select=id,name,isDefaultCalendar');
  const data = await res.json();
  return (data.value ?? []).map((c: { id: string; name: string; isDefaultCalendar?: boolean }) => ({
    id: c.id,
    name: c.name,
    primary: Boolean(c.isDefaultCalendar),
  }));
}

/* ------------------------------ dispatch ------------------------------ */

export function pull(conn: CalConnection) {
  return conn.provider === 'google' ? pullGoogle(conn) : pullMicrosoft(conn);
}

export function createEvent(conn: CalConnection, task: Task) {
  return conn.provider === 'google'
    ? createGoogleEvent(conn, task)
    : createMicrosoftEvent(conn, task);
}

export function updateEvent(conn: CalConnection, eventId: string, task: Task, etag?: string) {
  return conn.provider === 'google'
    ? updateGoogleEvent(conn, eventId, task, etag)
    : updateMicrosoftEvent(conn, eventId, task, etag);
}

export function deleteEvent(conn: CalConnection, eventId: string) {
  return conn.provider === 'google'
    ? deleteGoogleEvent(conn, eventId)
    : deleteMicrosoftEvent(conn, eventId);
}

export function listCalendars(conn: CalConnection) {
  return conn.provider === 'google' ? listGoogleCalendars(conn) : listMicrosoftCalendars(conn);
}

/* ------------------------------- helpers ------------------------------ */

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function remoteToTask(remote: RemoteEvent, categoryId: string): Task {
  return {
    id: `cal-${remote.id}`,
    title: remote.summary,
    notes: remote.description,
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate: remote.date,
    dueTime: remote.allDay ? undefined : remote.time,
    priority: icsToPriority(remote.priority),
    energy: energyFromTag(remote.tags),
    category: categoryId,
    isPinned: false,
    subtasks: [],
    recurring: 'none',
    tags: remote.tags.filter((t) => !t.startsWith('jemi-energy-')),
  };
}
