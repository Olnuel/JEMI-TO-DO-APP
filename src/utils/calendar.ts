import { Task } from '../types/todo';

export type CalendarProviderId =
  | 'google'
  | 'outlook'
  | 'apple'
  | 'proton'
  | 'notion'
  | 'timetree'
  | 'anydo';

export interface CalendarProvider {
  id: CalendarProviderId;
  name: string;
  shortName: string;
  emoji: string;
  brandColor: string;
  /** Can open a pre-filled event composer in the browser */
  supportsDeepLink: boolean;
  /** Can import a standard .ics file */
  supportsIcs: boolean;
  /** How the user should expect to use this option */
  connectLabel: string;
  notes: string;
  docsUrl: string;
}

export const CALENDAR_PROVIDERS: CalendarProvider[] = [
  {
    id: 'google',
    name: 'Google Calendar',
    shortName: 'Google',
    emoji: '📅',
    brandColor: '#4285F4',
    supportsDeepLink: true,
    supportsIcs: true,
    connectLabel: 'Open in Google Calendar',
    notes:
      'Deep link opens a pre-filled event. Or import the .ics file into any Google calendar via Settings → Import & export.',
    docsUrl: 'https://support.google.com/calendar/answer/37064',
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook Calendar',
    shortName: 'Outlook',
    emoji: '🗓️',
    brandColor: '#0F6CBD',
    supportsDeepLink: true,
    supportsIcs: true,
    connectLabel: 'Open in Outlook',
    notes:
      'Works with Outlook.com, Microsoft 365 and the desktop app. The .ics file also imports into Apple Calendar and Google.',
    docsUrl: 'https://support.microsoft.com/office/open-calendar-events-from-an-ics-file-94a9e1d0-0c37-4d5f-9ba2-0b1b0d0b0b0b',
  },
  {
    id: 'apple',
    name: 'Apple Calendar',
    shortName: 'Apple',
    emoji: '🍎',
    brandColor: '#0071E3',
    supportsDeepLink: false,
    supportsIcs: true,
    connectLabel: 'Download for Apple Calendar',
    notes:
      'Apple Calendar has no web composer, so use the .ics file: open it on macOS/iOS and choose "Add All".',
    docsUrl: 'https://support.apple.com/guide/calendar/subscribe-to-calendars-cg7h9b0f5cbb',
  },
  {
    id: 'proton',
    name: 'Proton Calendar',
    shortName: 'Proton',
    emoji: '🔐',
    brandColor: '#6D4AFF',
    supportsDeepLink: false,
    supportsIcs: true,
    connectLabel: 'Download for Proton',
    notes:
      'Proton has no public compose deep link. Import the .ics file from Settings → Import & export, or add it as a subscribed calendar.',
    docsUrl: 'https://proton.me/support/calendar-caldav-import',
  },
  {
    id: 'notion',
    name: 'Notion Calendar',
    shortName: 'Notion',
    emoji: '📓',
    brandColor: '#37352F',
    supportsDeepLink: false,
    supportsIcs: true,
    connectLabel: 'Subscribe Notion Calendar',
    notes:
      'Connect by adding your calendar feed URL inside Notion Calendar, or import the .ics file. Notion keeps your tasks in sync only if the calendar itself is shared.',
    docsUrl: 'https://www.notion.com/help/notion-calendars',
  },
  {
    id: 'timetree',
    name: 'TimeTree',
    shortName: 'TimeTree',
    emoji: '🌳',
    brandColor: '#0B8C6A',
    supportsDeepLink: true,
    supportsIcs: true,
    connectLabel: 'Open in TimeTree',
    notes:
      'TimeTree accepts .ics imports and shared calendar links. Pair with a shared calendar to see tasks on your phone.',
    docsUrl: 'https://help.timetreeapp.com/hc/en-us',
  },
  {
    id: 'anydo',
    name: 'Any.do',
    shortName: 'Any.do',
    emoji: '✅',
    brandColor: '#4A4A4A',
    supportsDeepLink: false,
    supportsIcs: true,
    connectLabel: 'Download for Any.do',
    notes:
      'Any.do imports .ics and syncs it to your lists. It does not offer a browser compose deep link.',
    docsUrl: 'https://help.any.do/en/articles/10020-importing-events',
  },
];

export function getProvider(id: CalendarProviderId): CalendarProvider {
  return CALENDAR_PROVIDERS.find((p) => p.id === id) ?? CALENDAR_PROVIDERS[0];
}

/* ------------------------------------------------------------------
   ICS GENERATION (RFC 5545)
   Works with every provider above — this is the one mechanism that
   needs no API keys, no OAuth and no backend.
   ------------------------------------------------------------------ */

/** ICS requires CRLF line breaks and escaping of ; , \ and newlines. */
function escapeICS(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * RFC 5545 folds any content line longer than 75 OCTETS using a
 * leading space. Byte length matters because multi-byte characters
 * (emoji, em-dashes) count as more than one.
 */
function foldLine(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;

  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;
  // First segment may use the full 75 octets; continuations reserve
  // one octet for the leading space.
  let limit = 75;
  for (const ch of line) {
    const size = enc.encode(ch).length;
    if (currentBytes + size > limit) {
      parts.push(current);
      current = '';
      currentBytes = 0;
      limit = 74;
    }
    current += ch;
    currentBytes += size;
  }
  if (current) parts.push(current);
  return parts.join('\r\n ');
}

function toUTCStamp(d: Date): string {
  return `${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

/** "2026-09-29" (+ optional "09:00") → floating local ICS timestamp. */
function toLocalStamp(date: string, time?: string): string {
  const [y, m, d] = date.split('-');
  if (!time) return `${y}${m}${d}`;
  const [hh, mm] = time.split(':');
  return `${y}${m}${d}T${hh}${mm}00`;
}

/**
 * Adds whole days to a YYYY-MM-DD string.
 *
 * Must read back the LOCAL calendar fields, not toISOString(): parsing
 * as local midnight and then converting to UTC rolls the date back a
 * day for anyone east of Greenwich.
 */
function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = String(dt.getFullYear()).padStart(4, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

const PRIORITY_MAP: Record<Task['priority'], number> = {
  urgent: 1,
  important: 3,
  soft: 5,
  chill: 7,
};

const CATEGORY_MAP: Record<Task['energy'], string> = {
  boss: 'High Energy',
  flow: 'Medium Energy',
  cozy: 'Low Energy',
};

export function buildICS(tasks: Task[], calendarName = 'Jemi Planner'): string {
  const stamp = toUTCStamp(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Jemi//Aesthetic To-Do//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const task of tasks) {
    if (!task.dueDate) continue;

    const dueTime = task.dueTime;
    const hasTime = Boolean(dueTime);
    const start = toLocalStamp(task.dueDate, dueTime);
    // Timed events run 45 minutes. All-day events are date-only, and
    // must use the compact YYYYMMDD form for BOTH DTSTART and DTEND.
    const end = hasTime
      ? toLocalStamp(task.dueDate, addMinutes(dueTime as string, 45))
      : addDays(task.dueDate, 1).replace(/-/g, '');

    const descriptionParts: string[] = [];
    if (task.notes) descriptionParts.push(task.notes);
    if (task.subtasks.length) {
      descriptionParts.push('');
      descriptionParts.push('Checklist:');
      task.subtasks.forEach((st) => {
        descriptionParts.push(`${st.completed ? '[x]' : '[ ]'} ${st.text}`);
      });
    }
    if (task.tags.length) {
      descriptionParts.push('', `Tags: ${task.tags.map((t) => `#${t}`).join(' ')}`);
    }
    descriptionParts.push('', 'Exported from Jemi — Aesthetic To-Do & Daily Glow Planner');

    const category = [task.category, CATEGORY_MAP[task.energy]].filter(Boolean).join(',');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${task.id}@jemi-planner`,
      `DTSTAMP:${stamp}`,
      hasTime ? `DTSTART:${start}` : `DTSTART;VALUE=DATE:${start}`,
      hasTime ? `DTEND:${end}` : `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeICS(task.title)}`,
      `DESCRIPTION:${escapeICS(descriptionParts.join('\n'))}`,
      `CATEGORIES:${escapeICS(category)}`,
      `PRIORITY:${PRIORITY_MAP[task.priority]}`,
      task.completed ? 'STATUS:CONFIRMED' : 'STATUS:TENTATIVE',
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICS(task.title)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n');
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Triggers a browser download of the generated .ics file. */
export function downloadICS(tasks: Task[], filename: string): void {
  const ics = buildICS(tasks);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------
   DEEP LINKS — pre-fill an event in the provider's web composer.
   No API key required; the user confirms the save.
   ------------------------------------------------------------------ */

function nextRange(task: Task): { start: string; end: string } {
  const date = task.dueDate ?? new Date().toISOString().slice(0, 10);
  if (task.dueTime) {
    return {
      start: `${date.replace(/-/g, '')}T${task.dueTime.replace(':', '')}00`,
      end: `${date.replace(/-/g, '')}T${addMinutes(task.dueTime, 45).replace(':', '')}00`,
    };
  }
  return { start: date.replace(/-/g, ''), end: addDays(date, 1).replace(/-/g, '') };
}

function bodyFor(task: Task): string {
  const parts: string[] = [];
  if (task.notes) parts.push(task.notes);
  if (task.subtasks.length) {
    parts.push('', 'Checklist:');
    task.subtasks.forEach((st) => parts.push(`${st.completed ? '[x]' : '[ ]'} ${st.text}`));
  }
  if (task.tags.length) parts.push('', task.tags.map((t) => `#${t}`).join(' '));
  return parts.join('\n');
}

export function buildDeepLink(providerId: CalendarProviderId, task: Task): string | null {
  const { start, end } = nextRange(task);
  const title = encodeURIComponent(task.title);
  const body = encodeURIComponent(bodyFor(task));

  switch (providerId) {
    case 'google':
      return `https://calendar.google.com/calendar/u/0/r/eventedit?text=${title}&dates=${start}/${end}&details=${body}`;
    case 'outlook':
      return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${start}&enddt=${end}&body=${body}`;
    case 'timetree':
      // TimeTree deep links open the app/web app; scheduling is done by
      // importing the shared calendar, so point the user at the app.
      return 'https://timetreeapp.com/intl/en/webapp/';
    default:
      return null;
  }
}

/** Tasks that actually carry a date, newest due date last. */
export function getSchedulableTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.dueDate)
    .slice()
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
}
