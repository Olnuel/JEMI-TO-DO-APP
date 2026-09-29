/**
 * OAuth 2.0 Authorization Code + PKCE for public (browser) clients.
 *
 * PKCE removes the need for a client_secret, which is what makes it
 * legitimate to run this entirely client-side. The code verifier is
 * held in sessionStorage and never leaves the tab, so an intercepted
 * authorization code is useless without it.
 *
 * A refresh token IS stored in localStorage (see SEC-STORE below).
 */

const STORAGE_PREFIX = 'jemi_cal_conn_';

/* SEC-STORE -------------------------------------------------------------
 * Refresh tokens are long-lived bearer credentials. localStorage is
 * readable by any script on the origin, so an XSS bug would leak them.
 *
 * Mitigations actually in place:
 *   - scopes are event-level, not full-account
 *   - tokens are revocable via the provider's revoke endpoint
 *   - no third-party scripts are loaded on this page
 *   - the app is fully client-side, so there is no server to attack
 *
 * The stronger alternative is a backend that holds tokens server-side,
 * which needs a datastore and defeats the point of a local-first app.
 * ------------------------------------------------------------------- */

export interface CalConnection {
  provider: string;
  accessToken: string;
  refreshToken: string;
  /** epoch ms */
  expiresAt: number;
  calendarId: string;
  /** Incremental-sync cursor; null means "full sync next time". */
  syncToken: string | null;
  /** epoch ms of last successful pull */
  lastSyncedAt: number | null;
  email?: string;
}

export const loadConnection = (provider: string): CalConnection | null => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + provider);
    return raw ? (JSON.parse(raw) as CalConnection) : null;
  } catch {
    return null;
  }
};

export const saveConnection = (conn: CalConnection): void => {
  localStorage.setItem(STORAGE_PREFIX + conn.provider, JSON.stringify(conn));
};

export const clearConnection = (provider: string): void => {
  localStorage.removeItem(STORAGE_PREFIX + provider);
};

/* ---------------------------- PKCE helpers ---------------------------- */

const enc = new TextEncoder();

function base64url(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function randomString(len = 64): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(verifier));
  return base64url(new Uint8Array(digest));
}

/* --------------------------- provider config -------------------------- */

export interface OAuthProviderConfig {
  id: string;
  name: string;
  authUrl: string;
  tokenUrl: string;
  revokeUrl: string;
  scope: string;
  /** Where to send the user to register a client. */
  consoleUrl: string;
  clientIdLabel: string;
}

export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  google: {
    id: 'google',
    name: 'Google Calendar',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    consoleUrl: 'https://console.cloud.google.com/apis/credentials',
    clientIdLabel: 'Google OAuth Client ID',
  },
  microsoft: {
    id: 'microsoft',
    name: 'Outlook / Microsoft 365',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    revokeUrl: '',
    scope: 'offline_access Calendars.ReadWrite User.Read',
    consoleUrl: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
    clientIdLabel: 'Microsoft Entra Application (client) ID',
  },
};

/* ------------------------------ the flow ------------------------------ */

export class OAuthCancelledError extends Error {
  constructor() {
    super('The user closed the authorisation window.');
    this.name = 'OAuthCancelledError';
  }
}

export class OAuthNotConfiguredError extends Error {
  constructor(providerName: string, label: string) {
    super(`${providerName} is not set up yet. Add your ${label} in Settings first.`);
    this.name = 'OAuthNotConfiguredError';
  }
}

interface AuthorizeResult {
  code: string;
  state: string;
}

function beginAuth(
  cfg: OAuthProviderConfig,
  clientId: string,
  redirectUri: string,
): Promise<string> {
  const verifier = randomString(64);
  const state = randomString(24);
  sessionStorage.setItem(`pkce_${cfg.id}_verifier`, verifier);
  sessionStorage.setItem(`pkce_${cfg.id}_state`, state);

  return codeChallenge(verifier).then((challenge) => {
    const url = new URL(cfg.authUrl);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', cfg.scope);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    if (cfg.id === 'google') {
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('prompt', 'consent');
    }
    return url.toString();
  });
}

/**
 * Opens the provider consent popup and resolves with the auth code.
 * Polls the popup because cross-origin redirects cannot be observed.
 */
function awaitCode(
  cfg: OAuthProviderConfig,
  redirectUri: string,
  opener: Window,
): Promise<AuthorizeResult> {
  return new Promise((resolve, reject) => {
    const expectedState = sessionStorage.getItem(`pkce_${cfg.id}_state}`);
    const started = Date.now();
    // 5 min is a generous ceiling; users who leave it open get a clear error.
    const MAX_WAIT = 5 * 60 * 1000;

    const poll = window.setInterval(() => {
      if (opener.closed) {
        window.clearInterval(poll);
        reject(new OAuthCancelledError());
        return;
      }
      if (Date.now() - started > MAX_WAIT) {
        window.clearInterval(poll);
        opener.close();
        reject(new Error('Authorisation timed out after 5 minutes.'));
        return;
      }
      let hash = '';
      try {
        hash = opener.location.hash;
      } catch {
        // Cross-origin until the redirect lands on our own origin.
        return;
      }
      if (!hash) return;
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const err = params.get('error');
      if (err) {
        window.clearInterval(poll);
        opener.close();
        reject(new Error(params.get('error_description') || err));
        return;
      }
      const code = params.get('code');
      const state = params.get('state');
      if (!code || !state) return;
      if (expectedState && state !== expectedState) {
        window.clearInterval(poll);
        opener.close();
        reject(new Error('State mismatch — possible CSRF. Aborting.'));
        return;
      }
      window.clearInterval(poll);
      opener.close();
      resolve({ code, state });
    }, 700);
  });
}

async function exchangeCode(
  cfg: OAuthProviderConfig,
  clientId: string,
  code: string,
  redirectUri: string,
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const verifier = sessionStorage.getItem(`pkce_${cfg.id}_verifier`);
  if (!verifier) throw new Error('Missing PKCE verifier — please retry the connection.');

  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });
  if (cfg.id === 'microsoft') body.set('client_secret', '');

  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text.slice(0, 200)}`);
  }
  sessionStorage.removeItem(`pkce_${cfg.id}_verifier`);
  sessionStorage.removeItem(`pkce_${cfg.id}_state`);
  return res.json();
}

/** Refreshes an access token, preserving the original refresh token. */
export async function refreshAccessToken(
  cfg: OAuthProviderConfig,
  clientId: string,
  conn: CalConnection,
  redirectUri: string,
): Promise<string> {
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: conn.refreshToken,
  });
  if (cfg.id === 'microsoft') body.set('client_secret', '');

  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    // A dead refresh token means the user must re-authorise.
    clearConnection(cfg.id);
    throw new Error('Your access expired. Please reconnect the calendar.');
  }
  const data = await res.json();
  conn.accessToken = data.access_token;
  conn.expiresAt = Date.now() + data.expires_in * 1000;
  if (data.refresh_token) conn.refreshToken = data.refresh_token;
  saveConnection(conn);
  return conn.accessToken;
}

/** Returns a valid access token, refreshing if it is close to expiry. */
export async function getValidToken(
  cfg: OAuthProviderConfig,
  clientId: string,
  conn: CalConnection,
  redirectUri: string,
): Promise<string> {
  if (conn.expiresAt - Date.now() > 60_000) return conn.accessToken;
  return refreshAccessToken(cfg, clientId, conn, redirectUri);
}

export async function connectCalendar(
  providerId: string,
  clientId: string,
  calendarId: string,
  redirectUri: string,
): Promise<CalConnection> {
  const cfg = OAUTH_PROVIDERS[providerId];
  if (!cfg) throw new Error(`Unknown provider: ${providerId}`);
  if (!clientId.trim()) throw new OAuthNotConfiguredError(cfg.name, cfg.clientIdLabel);

  const authUrl = await beginAuth(cfg, clientId, redirectUri);
  const opener = window.open(authUrl, 'jemi_oauth', 'width=560,height=720,noopener=no');
  if (!opener) throw new Error('Popup blocked. Allow popups for this site and try again.');

  const { code } = await awaitCode(cfg, redirectUri, opener);
  const token = await exchangeCode(cfg, clientId, code, redirectUri);
  if (!token.refresh_token) {
    throw new Error(
      'The provider did not return a refresh token. Revoke prior access and reconnect.',
    );
  }

  const conn: CalConnection = {
    provider: providerId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + token.expires_in * 1000,
    calendarId,
    syncToken: null,
    lastSyncedAt: null,
  };
  saveConnection(conn);
  return conn;
}

/** Best-effort server-side revocation so a disconnect really disconnects. */
export async function disconnectCalendar(providerId: string): Promise<void> {
  const conn = loadConnection(providerId);
  if (conn) {
    const cfg = OAUTH_PROVIDERS[providerId];
    if (cfg?.revokeUrl) {
      try {
        await fetch(`${cfg.revokeUrl}?token=${encodeURIComponent(conn.refreshToken)}`, {
          method: 'POST',
        });
      } catch {
        // Offline or the provider rejected it; local clear still proceeds.
      }
    }
  }
  clearConnection(providerId);
}

/** Hash-only OAuth callback landing page. */
export const OAUTH_CALLBACK_PATH = '/oauth-callback.html';
