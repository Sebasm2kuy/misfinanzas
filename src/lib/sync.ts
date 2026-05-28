// ─── GitHub Gist Sync ──────────────────────────────────────────
// Stores all app data in a private GitHub Gist for cross-device sync.

const GIST_FILE = 'misfinanzas-data.json';
const GIST_DESC = 'MiFinanzas Sync Data';

const AUTH_KEY = 'mf_auth_token';
const GIST_ID_KEY = 'mf_gist_id';
const USER_KEY = 'mf_github_user';
const LAST_SYNC_KEY = 'mf_last_sync';

// ─── Auth helpers (localStorage) ────────────────────────────────
export function getStoredAuth(): { token: string; gistId: string; username: string } | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(AUTH_KEY);
  const gistId = localStorage.getItem(GIST_ID_KEY);
  const username = localStorage.getItem(USER_KEY);
  if (token && gistId && username) return { token, gistId, username };
  return null;
}

export function setStoredAuth(token: string, gistId: string, username: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, token);
  localStorage.setItem(GIST_ID_KEY, gistId);
  localStorage.setItem(USER_KEY, username);
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(GIST_ID_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LAST_SYNC_KEY);
}

export function getLastSync(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastSync(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
}

// ─── GitHub API ────────────────────────────────────────────────
export async function getGitHubUser(token: string): Promise<string> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('TOKEN_INVALID');
    if (res.status === 403) throw new Error('TOKEN_FORBIDDEN');
    throw new Error('TOKEN_ERROR');
  }
  const data = await res.json();
  return data.login as string;
}

export async function findOrCreateGist(token: string): Promise<string> {
  // Try to find existing gist
  let page = 1;
  while (page <= 5) {
    const res = await fetch(`https://api.github.com/gists?page=${page}&per_page=100`, {
      headers: { Authorization: `token ${token}` },
    });
    if (!res.ok) break;
    const gists: Array<{ id: string; description: string }> = await res.json();
    if (!gists.length) break;
    const existing = gists.find((g) => g.description === GIST_DESC);
    if (existing) return existing.id;
    // Check if we got a full page (might be more)
    if (gists.length < 100) break;
    page++;
  }

  // Create new gist
  const createRes = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      description: GIST_DESC,
      public: false,
      files: { [GIST_FILE]: { content: '{}' } },
    }),
  });

  if (!createRes.ok) {
    if (createRes.status === 403) throw new Error('GIST_CREATE_FORBIDDEN');
    throw new Error('GIST_CREATE_ERROR');
  }

  const newGist = await createRes.json();
  return newGist.id as string;
}

export async function loadFromGist(token: string, gistId: string): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${token}` },
    });
    if (!res.ok) return null;
    const gist = await res.json();
    const file = gist.files?.[GIST_FILE];
    if (!file) return null;
    return JSON.parse(file.content);
  } catch {
    return null;
  }
}

export async function saveToGist(token: string, gistId: string, data: Record<string, any>): Promise<boolean> {
  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        files: { [GIST_FILE]: { content: JSON.stringify(data) } },
      }),
    });
    if (!res.ok) return false;
    setLastSync();
    return true;
  } catch {
    return false;
  }
}

// ─── LocalStorage Data Gather ──────────────────────────────────
const STORAGE_KEYS = ['mf_settings', 'mf_categories', 'mf_transactions', 'mf_goals', 'mf_seeded'];

export function gatherLocalData(): Record<string, any> {
  const data: Record<string, any> = {};
  for (const key of STORAGE_KEYS) {
    if (typeof window === 'undefined') continue;
    const raw = localStorage.getItem(key);
    data[key] = raw ? JSON.parse(raw) : null;
  }
  return data;
}

export function applyRemoteData(data: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  for (const key of STORAGE_KEYS) {
    if (data[key] !== undefined && data[key] !== null) {
      localStorage.setItem(key, JSON.stringify(data[key]));
    }
  }
}

// ─── Debounced Sync ────────────────────────────────────────────
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleSync(
  token: string,
  gistId: string,
  onSyncStatus: (status: 'idle' | 'syncing' | 'synced' | 'error') => void,
  delay: number = 3000
): void {
  if (syncTimeout) clearTimeout(syncTimeout);

  onSyncStatus('syncing');

  syncTimeout = setTimeout(async () => {
    try {
      const data = gatherLocalData();
      const ok = await saveToGist(token, gistId, data);
      onSyncStatus(ok ? 'synced' : 'error');
    } catch {
      onSyncStatus('error');
    }
  }, delay);
}

export function cancelPendingSync(): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
}
