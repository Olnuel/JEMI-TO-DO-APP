import { Task } from '../types/todo';
import {
  CalConnection,
  loadConnection,
  saveConnection,
  getValidToken,
  OAUTH_PROVIDERS,
} from './oauth';
import {
  pull,
  createEvent,
  updateEvent,
  deleteEvent,
  getLinks,
  saveLinks,
  resetLinks,
  remoteToTask,
  stripSyncTags,
  SyncCursorInvalidError,
  TokenExpiredError,
  EventLink,
  RemoteEvent,
} from './calendarSync';

export type SyncDirection = 'pull' | 'push' | 'both';

export interface SyncConflict {
  taskId: string;
  taskTitle: string;
  local: Task;
  remote: RemoteEvent;
  /** Which side changed more recently, per the provider's updated stamp. */
  resolution: 'local' | 'remote';
}

export interface SyncResult {
  pulled: number;
  pushed: number;
  updated: number;
  deleted: number;
  conflicts: SyncConflict[];
  errors: string[];
  durationMs: number;
}

const DEFAULT_CATEGORY = 'daily';

export async function syncCalendar(
  providerId: string,
  clientId: string,
  redirectUri: string,
  tasks: Task[],
  direction: SyncDirection = 'both',
  onProgress?: (msg: string) => void,
): Promise<{ result: SyncResult; tasks: Task[]; conn: CalConnection }> {
  const started = Date.now();
  const conn = loadConnection(providerId);
  if (!conn) throw new Error('Not connected. Authorise the calendar first.');

  const cfg = OAUTH_PROVIDERS[providerId];
  const result: SyncResult = {
    pulled: 0,
    pushed: 0,
    updated: 0,
    deleted: 0,
    conflicts: [],
    errors: [],
    durationMs: 0,
  };

  // Refresh the access token up front so mid-sync 401s are rare.
  try {
    await getValidToken(cfg, clientId, conn, redirectUri);
  } catch (e) {
    result.errors.push(e instanceof Error ? e.message : String(e));
    result.durationMs = Date.now() - started;
    return { result, tasks, conn };
  }

  const links = getLinks(providerId);
  const next = tasks.slice();
  const indexById = new Map(next.map((t) => [t.id, t]));
  let remoteEvents: RemoteEvent[] = [];

  /* ------------------------------ PULL ------------------------------ */
  if (direction === 'pull' || direction === 'both') {
    onProgress?.('Reading calendar changes…');
    try {
      const { events, nextToken } = await pull(conn);
      remoteEvents = events;
      if (nextToken) {
        conn.syncToken = nextToken;
      } else {
        // Provider gave no cursor (e.g. one-shot page) — force a full pass next time.
        conn.syncToken = null;
      }

      for (const ev of events) {
        if (!ev.summary) {
          // A cancellation; drop the local task if we created it.
          const link = Object.values(links).find((l) => l.eventId === ev.id);
          if (link) {
            const i = next.findIndex((t) => t.id === link.taskId);
            if (i >= 0) {
              next.splice(i, 1);
              result.deleted++;
              delete links[link.taskId];
            }
          }
          continue;
        }

        const link = Object.values(links).find((l) => l.eventId === ev.id);
        if (link) {
          const localTask = indexById.get(link.taskId);
          if (localTask) {
            const remoteTask = remoteToTask(ev, localTask.category);
            const localChanged = localTask.updatedAt ?? 0;
            const remoteChanged = ev.etag ? 1 : 0; // etag presence implies a remote write
            if (remoteChanged && !localChanged) {
              next[next.findIndex((t) => t.id === link.taskId)] = stripSyncTags(remoteTask);
              result.pulled++;
            } else if (localChanged) {
              // Both sides touched it — last local edit wins unless it is
              // clearly stale, and we surface it so the user can review.
              if (ev.summary !== localTask.title || ev.date !== localTask.dueDate) {
                result.conflicts.push({
                  taskId: link.taskId,
                  taskTitle: localTask.title,
                  local: localTask,
                  remote: ev,
                  resolution: 'local',
                });
              }
            }
            links[link.taskId] = { ...link, etag: ev.etag, lastSynced: Date.now() };
          }
        } else if (!ev.description?.includes('Exported from Jemi')) {
          // Genuinely new remote event, so import it.
          const imported = remoteToTask(ev, DEFAULT_CATEGORY);
          next.push(imported);
          indexById.set(imported.id, imported);
          links[imported.id] = {
            taskId: imported.id,
            eventId: ev.id,
            etag: ev.etag,
            lastSynced: Date.now(),
          };
          result.pulled++;
        }
      }
    } catch (e) {
      if (e instanceof SyncCursorInvalidError) {
        // Google/Graph expire cursors after ~2 weeks or 250 changes.
        conn.syncToken = null;
        resetLinks(providerId);
        result.errors.push('Sync history had expired — starting a fresh full sync. Run again.');
      } else if (e instanceof TokenExpiredError) {
        result.errors.push('Your access token expired. Please reconnect the calendar.');
      } else {
        result.errors.push(`Pull failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  /* ------------------------------ PUSH ------------------------------ */
  if (direction === 'push' || direction === 'both') {
    onProgress?.('Uploading your changes…');
    const pushable = next.filter((t) => t.dueDate && t.category !== DEFAULT_CATEGORY + '@external');
    for (const task of pushable) {
      const link = links[task.id];
      try {
        if (link) {
          const ev = await updateEvent(conn, link.eventId, task, link.etag);
          links[task.id] = { ...link, etag: ev.etag, lastSynced: Date.now() };
          result.updated++;
        } else {
          const ev = await createEvent(conn, task);
          links[task.id] = {
            taskId: task.id,
            eventId: ev.id,
            etag: ev.etag,
            lastSynced: Date.now(),
          };
          result.pushed++;
        }
      } catch (e) {
        if (e instanceof TokenExpiredError) {
          result.errors.push('Access token expired mid-sync. Please reconnect.');
          break;
        }
        // 404 means the event was deleted remotely; recreate it.
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('404')) {
          try {
            const ev = await createEvent(conn, task);
            links[task.id] = { taskId: task.id, eventId: ev.id, etag: ev.etag, lastSynced: Date.now() };
            result.pushed++;
          } catch (inner) {
            result.errors.push(`Could not create "${task.title}": ${String(inner)}`);
          }
        } else {
          result.errors.push(`Could not sync "${task.title}": ${msg}`);
        }
      }
    }
  }

  saveLinks(providerId, links);
  conn.lastSyncedAt = Date.now();
  saveConnection(conn);
  result.durationMs = Date.now() - started;
  onProgress?.('Sync complete.');
  return { result, tasks: next, conn };
}

/** Removes a task's event from the provider without deleting the task. */
export async function unlinkTask(
  providerId: string,
  clientId: string,
  redirectUri: string,
  taskId: string,
): Promise<void> {
  const conn = loadConnection(providerId);
  if (!conn) return;
  const links = getLinks(providerId);
  const link: EventLink | undefined = links[taskId];
  if (!link) return;
  try {
    await getValidToken(OAUTH_PROVIDERS[providerId], clientId, conn, redirectUri);
    await deleteEvent(conn, link.eventId);
  } catch {
    // Best effort: a stale event is better than a failed task operation.
  }
  delete links[taskId];
  saveLinks(providerId, links);
}

export function isTaskLinked(providerId: string, taskId: string): boolean {
  return Boolean(getLinks(providerId)[taskId]);
}
