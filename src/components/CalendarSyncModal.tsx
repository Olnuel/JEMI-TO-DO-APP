import React, { useEffect, useState } from 'react';
import {
  X,
  RefreshCw,
  Plug,
  Unplug,
  ExternalLink,
  Check,
  Loader2,
  AlertTriangle,
  CloudDownload,
  CloudUpload,
  ArrowLeftRight,
  KeyRound,
  Info,
} from 'lucide-react';
import { Task } from '../types/todo';
import {
  CalConnection,
  OAUTH_PROVIDERS,
  connectCalendar,
  disconnectCalendar,
  loadConnection,
  clearConnection,
  OAUTH_CALLBACK_PATH,
} from '../utils/oauth';
import { isLiveCapable, listCalendars } from '../utils/calendarSync';
import { syncCalendar, SyncDirection, SyncResult } from '../utils/syncEngine';
import { CALENDAR_PROVIDERS, CalendarProviderId, downloadICS, getSchedulableTasks } from '../utils/calendar';

const CLIENT_ID_KEY = 'jemi_cal_client_ids';

function loadClientIds(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CLIENT_ID_KEY) || '{}');
  } catch {
    return {};
  }
}

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  soundEnabled: boolean;
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onTasksChange,
  soundEnabled,
}) => {
  const [tab, setTab] = useState<'export' | 'live'>('live');
  const [providerId, setProviderId] = useState<CalendarProviderId>('google');
  const [conn, setConn] = useState<CalConnection | null>(null);
  const [clientIds, setClientIds] = useState<Record<string, string>>({});
  const [clientIdDraft, setClientIdDraft] = useState('');
  const [calendars, setCalendars] = useState<{ id: string; name: string; primary: boolean }[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState('');

  const liveCapable = isLiveCapable(providerId);
  const cfg = OAUTH_PROVIDERS[providerId];
  const provider = CALENDAR_PROVIDERS.find((p) => p.id === providerId)!;
  const redirectUri = `${window.location.origin}${OAUTH_CALLBACK_PATH}`;

  useEffect(() => {
    if (!isOpen) return;
    const ids = loadClientIds();
    setClientIds(ids);
    setClientIdDraft(ids[providerId] ?? '');
    setConn(loadConnection(providerId));
    setLastResult(null);
    setError('');
  }, [isOpen, providerId]);

  if (!isOpen) return null;

  const saveClientId = () => {
    const next = { ...clientIds, [providerId]: clientIdDraft.trim() };
    setClientIds(next);
    localStorage.setItem(CLIENT_ID_KEY, JSON.stringify(next));
  };

  const handleConnect = async () => {
    setBusy(true);
    setError('');
    try {
      saveClientId();
      setStatus('Opening authorisation window…');
      // Authorise against "primary" first so we can enumerate calendars.
      const c = await connectCalendar(providerId, clientIdDraft.trim(), 'primary', redirectUri);
      setConn(c);
      setStatus('Fetching your calendars…');
      const list = await listCalendars(c);
      setCalendars(list);
      setStatus(`Connected. Found ${list.length} calendar${list.length === 1 ? '' : 's'}.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  const handleSelectCalendar = async (calendarId: string) => {
    if (!conn) return;
    const next = { ...conn, calendarId, syncToken: null };
    setConn(next);
    // localStorage write happens inside loadConnection's sibling helper
    const ids = loadClientIds();
    localStorage.setItem(
      'jemi_cal_conn_' + providerId,
      JSON.stringify(next),
    );
    void ids;
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await disconnectCalendar(providerId);
      setConn(null);
      setCalendars([]);
      setStatus('Disconnected and access revoked.');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async (direction: SyncDirection) => {
    if (!conn) return;
    setBusy(true);
    setError('');
    setLastResult(null);
    try {
      const { result, tasks: next } = await syncCalendar(
        providerId,
        clientIdDraft.trim(),
        redirectUri,
        tasks,
        direction,
        setStatus,
      );
      setLastResult(result);
      onTasksChange(next);
      if (result.errors.length) setError(result.errors[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setStatus('');
    }
  };

  const handleExportICS = () => {
    const schedulable = getSchedulableTasks(tasks);
    if (!schedulable.length) return;
    downloadICS(schedulable, `jemi-${providerId}-${new Date().toISOString().slice(0, 10)}.ics`);
  };

  const clientIdMissing = !clientIdDraft.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glow-card relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 rounded-3xl p-6 sm:p-7 shadow-2xl border border-pink-200/90 text-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔗</span>
            <h2 className="text-xl font-serif-chic font-bold text-rose-950">
              Calendar Sync
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-pink-100 text-stone-400 hover:text-rose-600 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 mt-4 rounded-2xl bg-pink-100/70 border border-pink-200/60">
          <button
            onClick={() => setTab('live')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'live' ? 'bg-white text-rose-600 shadow-sm' : 'text-stone-600 hover:text-rose-800'
            }`}
          >
            <RefreshCw size={13} /> Live Two-Way Sync
          </button>
          <button
            onClick={() => setTab('export')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'export' ? 'bg-white text-rose-600 shadow-sm' : 'text-stone-600 hover:text-rose-800'
            }`}
          >
            <ArrowLeftRight size={13} /> One-Time Export
          </button>
        </div>

        {/* Provider picker */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1.5">
            Choose a calendar service
          </label>
          <div className="relative">
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value as CalendarProviderId)}
              className="w-full appearance-none px-4 py-3 rounded-2xl bg-pink-50/60 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm text-stone-800 font-semibold cursor-pointer"
            >
              {CALENDAR_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                  {isLiveCapable(p.id) ? '' : ' (export only)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ------------------------------ EXPORT TAB ----------------------------- */}
        {tab === 'export' && (
          <div className="mt-4 space-y-3">
            <div className="p-3.5 rounded-2xl bg-pink-50/50 border border-pink-200/80 flex items-start gap-2.5">
              <span className="text-xl">{provider.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-rose-950">{provider.name}</p>
                <p className="text-[11px] text-stone-600 leading-relaxed mt-1">{provider.notes}</p>
              </div>
            </div>
            <button
              onClick={handleExportICS}
              disabled={getSchedulableTasks(tasks).length === 0}
              className="w-full py-3 rounded-2xl bg-pink-100 text-rose-800 border border-pink-200 font-bold text-sm hover:bg-pink-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download .ics ({getSchedulableTasks(tasks).length} events)
            </button>
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[11px] text-rose-500 hover:text-rose-700 font-semibold inline-flex items-center gap-1 hover:underline mx-auto"
            >
              {provider.name} import help <ExternalLink size={10} />
            </a>
          </div>
        )}

        {/* ------------------------------- LIVE TAB ------------------------------ */}
        {tab === 'live' && (
          <div className="mt-4 space-y-3">
            {!liveCapable && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    {provider.name} has no public two-way API
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed mt-1">
                    Live sync needs an API that lets an app read and write events. Apple,
                    Proton, Notion, TimeTree and Any.do either don't publish one or gate it
                    behind a business agreement. Use the One-Time Export tab, which works
                    with all of them.
                  </p>
                </div>
              </div>
            )}

            {liveCapable && (
              <>
                {/* Step 1 — credentials */}
                <div className="p-3.5 rounded-2xl bg-pink-50/50 border border-pink-200/80">
                  <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <KeyRound size={12} /> 1 · {cfg?.clientIdLabel}
                  </label>
                  <input
                    type="text"
                    value={clientIdDraft}
                    onChange={(e) => setClientIdDraft(e.target.value)}
                    placeholder="Paste your client ID"
                    spellCheck={false}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs font-mono text-stone-800 placeholder:text-stone-400"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[11px] text-stone-500">
                      Stored only in this browser. Never sent anywhere but the provider.
                    </p>
                    <a
                      href={cfg?.consoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold inline-flex items-center gap-1 hover:underline shrink-0"
                    >
                      Get one <ExternalLink size={10} />
                    </a>
                  </div>
                  {clientIdMissing && (
                    <p className="text-[11px] text-rose-600 mt-1.5">
                      A free client ID is required before you can connect. Register one in the{' '}
                      {providerId === 'google' ? 'Google Cloud console' : 'Azure portal'}, then
                      paste it above.
                    </p>
                  )}
                </div>

                {/* Step 2 — connect / status */}
                {!conn ? (
                  <button
                    onClick={handleConnect}
                    disabled={busy || clientIdMissing}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-bold text-sm shadow-md shadow-pink-300 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Plug size={16} />}
                    {busy ? 'Connecting…' : `Connect ${provider.shortName}`}
                  </button>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <Check size={15} className="text-emerald-600" />
                      <p className="text-xs font-bold text-emerald-900">
                        Connected to {provider.name}
                      </p>
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-1">
                      {conn.lastSyncedAt
                        ? `Last synced ${new Date(conn.lastSyncedAt).toLocaleString()}`
                        : 'Not synced yet — run a sync below.'}
                    </p>

                    {/* Calendar picker */}
                    <div className="mt-2.5">
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                        Syncing with
                      </label>
                      <select
                        value={conn.calendarId}
                        onChange={(e) => handleSelectCalendar(e.target.value)}
                        disabled={calendars.length === 0}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-stone-800 disabled:opacity-60"
                      >
                        {calendars.length === 0 && <option value={conn.calendarId}>Primary calendar</option>}
                        {calendars.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                            {c.primary ? ' (primary)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleDisconnect}
                      disabled={busy}
                      className="mt-2.5 text-[11px] text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1"
                    >
                      <Unplug size={11} /> Disconnect &amp; revoke access
                    </button>
                  </div>
                )}

                {/* Step 3 — sync actions */}
                {conn && (
                  <div>
                    <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1.5">
                      3 · Sync now
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleSync('pull')}
                        disabled={busy}
                        className="py-2.5 rounded-2xl bg-pink-100 text-rose-800 border border-pink-200 font-bold text-[11px] hover:bg-pink-200 transition-colors flex flex-col items-center gap-1 disabled:opacity-50"
                      >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <CloudDownload size={14} />}
                        Pull
                      </button>
                      <button
                        onClick={() => handleSync('push')}
                        disabled={busy}
                        className="py-2.5 rounded-2xl bg-pink-100 text-rose-800 border border-pink-200 font-bold text-[11px] hover:bg-pink-200 transition-colors flex flex-col items-center gap-1 disabled:opacity-50"
                      >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
                        Push
                      </button>
                      <button
                        onClick={() => handleSync('both')}
                        disabled={busy}
                        className="py-2.5 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white font-bold text-[11px] shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-1 disabled:opacity-50"
                      >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Both
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1.5 text-center">
                      Syncs tasks with a due date. Events are created as free/busy-free so they
                      never block your time.
                    </p>
                  </div>
                )}

                {/* Security note */}
                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200 flex items-start gap-2">
                  <Info size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Jemi requests the narrowest scope that works ({' '}
                    <span className="font-mono text-[10px]">calendar.events</span> for Google) and
                    can only create, edit and delete events. It cannot read your email or files.
                    Disconnecting revokes the token at the provider.
                  </p>
                </div>
              </>
            )}

            {/* Result summary */}
            {lastResult && (
              <div className="p-3 rounded-2xl bg-pink-50/70 border border-pink-200">
                <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1.5">
                  Last sync · {(lastResult.durationMs / 1000).toFixed(1)}s
                </p>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-white/80 rounded-lg py-1.5">
                    <p className="text-sm font-bold text-rose-700">{lastResult.pulled}</p>
                    <p className="text-[9px] text-stone-500">pulled</p>
                  </div>
                  <div className="bg-white/80 rounded-lg py-1.5">
                    <p className="text-sm font-bold text-rose-700">{lastResult.pushed}</p>
                    <p className="text-[9px] text-stone-500">created</p>
                  </div>
                  <div className="bg-white/80 rounded-lg py-1.5">
                    <p className="text-sm font-bold text-rose-700">{lastResult.updated}</p>
                    <p className="text-[9px] text-stone-500">updated</p>
                  </div>
                  <div className="bg-white/80 rounded-lg py-1.5">
                    <p className="text-sm font-bold text-rose-700">{lastResult.deleted}</p>
                    <p className="text-[9px] text-stone-500">removed</p>
                  </div>
                </div>
                {lastResult.conflicts.length > 0 && (
                  <p className="text-[11px] text-amber-700 mt-2">
                    {lastResult.conflicts.length} item
                    {lastResult.conflicts.length === 1 ? '' : 's'} changed in both places — your
                    Jemi copy was kept.
                  </p>
                )}
                {lastResult.errors.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {lastResult.errors.slice(0, 3).map((err, i) => (
                      <li key={i} className="text-[11px] text-rose-700">
                        • {err}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status / error bar */}
        {(status || error) && (
          <div
            className={`mt-3 px-3 py-2 rounded-xl text-[11px] flex items-center gap-2 ${
              error
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-pink-50 text-rose-700 border border-pink-200'
            }`}
          >
            {busy && <Loader2 size={12} className="animate-spin shrink-0" />}
            <span className="break-words">{error || status}</span>
          </div>
        )}
      </div>
    </div>
  );
};
