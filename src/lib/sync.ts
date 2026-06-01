// ─── Password Auth ──────────────────────────────────────────
const PASS_HASH_KEY = 'mf_pass_hash';
const PASS_SALT_KEY = 'mf_pass_salt';

function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hasPassword(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(PASS_HASH_KEY) && !!localStorage.getItem(PASS_SALT_KEY);
}

export async function createPassword(password: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  localStorage.setItem(PASS_HASH_KEY, hash);
  localStorage.setItem(PASS_SALT_KEY, salt);
}

export async function verifyPassword(password: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const storedHash = localStorage.getItem(PASS_HASH_KEY);
  const salt = localStorage.getItem(PASS_SALT_KEY);
  if (!storedHash || !salt) return false;
  const hash = await hashPassword(password, salt);
  return hash === storedHash;
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
  const valid = await verifyPassword(oldPassword);
  if (!valid) return false;
  await createPassword(newPassword);
  return true;
}

export function clearPassword(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PASS_HASH_KEY);
  localStorage.removeItem(PASS_SALT_KEY);
}

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

export function hasStoredSync(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(AUTH_KEY) && !!localStorage.getItem(GIST_ID_KEY);
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
const PROJECTED_INCOMES_KEY = 'mf_projected_incomes';
const GOALS_KEY = 'mf_goals';
const QUINCE_GOAL_ID = 'quinceanera-2026';
const STORAGE_KEYS = [
  'mf_settings',
  'mf_categories',
  'mf_transactions',
  GOALS_KEY,
  'mf_accounts',
  'mf_seeded',
  PROJECTED_INCOMES_KEY,
];

// ─── Migrations ──────────────────────────────────────────────
const DEFAULT_QUINCE_PROJECTED = [
  { id: 'pi-1', date: '2026-06-05', amount: 41760, description: 'Sueldo', received: false },
  { id: 'pi-2', date: '2026-06-20', amount: 21000, description: '1/2 Aguinaldo', received: false },
  { id: 'pi-3', date: '2026-07-01', amount: 40000, description: 'Sueldo', received: false },
  { id: 'pi-4', date: '2026-07-30', amount: 9000, description: 'Ingreso extra', received: false },
  { id: 'pi-5', date: '2026-08-03', amount: 40000, description: 'Sueldo', received: false },
];

type ProjectedIncomeLike = {
  id: string;
  date: string;
  amount: number;
  description: string;
  received: boolean;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function isProjectedIncome(value: any): value is ProjectedIncomeLike {
  return (
    value &&
    typeof value.id === 'string' &&
    typeof value.date === 'string' &&
    typeof value.amount === 'number' &&
    typeof value.description === 'string'
  );
}

function mergeProjectedIncomes(...sources: unknown[]): ProjectedIncomeLike[] {
  const merged = new Map<string, ProjectedIncomeLike>();

  for (const source of sources) {
    if (!Array.isArray(source)) continue;
    for (const income of source) {
      if (!isProjectedIncome(income)) continue;
      merged.set(income.id, {
        id: income.id,
        date: income.date,
        amount: income.amount,
        description: income.description,
        received: Boolean(income.received),
      });
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function getQuinceProjectedFromGoals(goals: any): unknown[] {
  if (!Array.isArray(goals)) return [];
  return goals.find((goal: any) => goal?.id === QUINCE_GOAL_ID)?.projectedIncomes ?? [];
}

function persistProjectedIncomes(incomes: ProjectedIncomeLike[]): void {
  localStorage.setItem(PROJECTED_INCOMES_KEY, JSON.stringify(incomes));

  const goals = readJson<any[]>(GOALS_KEY, []);
  if (!Array.isArray(goals)) return;

  let changed = false;
  const updatedGoals = goals.map((goal: any) => {
    if (goal?.id !== QUINCE_GOAL_ID) return goal;
    changed = true;
    return { ...goal, projectedIncomes: incomes };
  });

  if (changed) {
    localStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
  }
}

function ensureProjectedIncomesPersisted(remoteData?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  const localStable = readJson<unknown[]>(PROJECTED_INCOMES_KEY, []);
  const localGoals = readJson<any[]>(GOALS_KEY, []);
  const remoteStable = remoteData?.[PROJECTED_INCOMES_KEY] ?? [];
  const remoteGoals = remoteData?.[GOALS_KEY] ?? [];

  const merged = mergeProjectedIncomes(
    DEFAULT_QUINCE_PROJECTED,
    getQuinceProjectedFromGoals(remoteGoals),
    remoteStable,
    getQuinceProjectedFromGoals(localGoals),
    localStable
  );

  persistProjectedIncomes(merged);
}

export function gatherLocalData(): Record<string, any> {
  if (typeof window !== 'undefined') {
    ensureProjectedIncomesPersisted();
  }

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
  // Run migrations after applying remote data
  runMigrations(data);
}

function runMigrations(remoteData?: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    if (!raw) return;
    const goals = JSON.parse(raw);
    let migrated = false;
    const updated = goals.map((g: any) => {
      if (!g.projectedIncomes || g.projectedIncomes.length === 0) {
        if (g.id === QUINCE_GOAL_ID) {
          migrated = true;
          return { ...g, projectedIncomes: DEFAULT_QUINCE_PROJECTED };
        }
        if (!g.projectedIncomes) {
          migrated = true;
          return { ...g, projectedIncomes: [] };
        }
      }
      return g;
    });
    if (migrated) {
      localStorage.setItem(GOALS_KEY, JSON.stringify(updated));
    }
    ensureProjectedIncomesPersisted(remoteData);
  } catch {}
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
