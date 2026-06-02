import { Category, Transaction, Goal, GoalItem, Settings, Stats, ProjectedIncome } from './types';

// ─── localStorage helpers ────────────────────────────────────
const KEYS = {
  settings: 'mf_settings',
  categories: 'mf_categories',
  transactions: 'mf_transactions',
  goals: 'mf_goals',
  seeded: 'mf_seeded',
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function now(): string {
  return new Date().toISOString();
}

// ─── Seed data ───────────────────────────────────────────────
const DEFAULT_EXPENSE_CATS: Category[] = [
  { id: 'expense-comida', name: 'Comida', icon: 'UtensilsCrossed', color: '#ef4444', type: 'expense', createdAt: now(), updatedAt: now() },
  { id: 'expense-transporte', name: 'Transporte', icon: 'Car', color: '#f97316', type: 'expense', createdAt: now(), updatedAt: now() },
  { id: 'expense-ute', name: 'UTE', icon: 'Zap', color: '#eab308', type: 'expense', createdAt: now(), updatedAt: now() },
  { id: 'expense-movistar', name: 'Movistar', icon: 'Smartphone', color: '#06b6d4', type: 'expense', createdAt: now(), updatedAt: now() },
  { id: 'expense-internet', name: 'Internet', icon: 'Wifi', color: '#8b5cf6', type: 'expense', createdAt: now(), updatedAt: now() },
  { id: 'expense-antel', name: 'Antel', icon: 'Phone', color: '#ec4899', type: 'expense', createdAt: now(), updatedAt: now() },
  { id: 'expense-cuota', name: 'Cuota', icon: 'Landmark', color: '#6366f1', type: 'expense', createdAt: now(), updatedAt: now() },
  { id: 'expense-otros', name: 'Otros', icon: 'MoreHorizontal', color: '#6b7280', type: 'expense', createdAt: now(), updatedAt: now() },
];

const DEFAULT_INCOME_CATS: Category[] = [
  { id: 'income-liquido', name: 'Líquido', icon: 'Banknote', color: '#22c55e', type: 'income', createdAt: now(), updatedAt: now() },
  { id: 'income-aguinaldo', name: 'Aguinaldo / Licencia', icon: 'Gift', color: '#06b6d4', type: 'income', createdAt: now(), updatedAt: now() },
  { id: 'income-freelance', name: 'Freelance', icon: 'Laptop', color: '#8b5cf6', type: 'income', createdAt: now(), updatedAt: now() },
  { id: 'income-otros', name: 'Otros', icon: 'MoreHorizontal', color: '#6b7280', type: 'income', createdAt: now(), updatedAt: now() },
];

const DEFAULT_QUINCE_ITEMS: GoalItem[] = [
  { id: 'qi-1', goalId: 'quinceanera-2026', name: 'Salón / Venue', estimatedCost: 1200, actualCost: 0, isPaid: false, notes: null },
  { id: 'qi-2', goalId: 'quinceanera-2026', name: 'Catering / Comida', estimatedCost: 800, actualCost: 0, isPaid: false, notes: null },
  { id: 'qi-3', goalId: 'quinceanera-2026', name: 'Decoración', estimatedCost: 500, actualCost: 0, isPaid: false, notes: null },
  { id: 'qi-4', goalId: 'quinceanera-2026', name: 'Música / DJ', estimatedCost: 600, actualCost: 0, isPaid: false, notes: null },
  { id: 'qi-5', goalId: 'quinceanera-2026', name: 'Fotografía', estimatedCost: 400, actualCost: 0, isPaid: false, notes: null },
  { id: 'qi-6', goalId: 'quinceanera-2026', name: 'Vestido', estimatedCost: 350, actualCost: 0, isPaid: false, notes: null },
  { id: 'qi-7', goalId: 'quinceanera-2026', name: 'Invitaciones', estimatedCost: 150, actualCost: 0, isPaid: false, notes: null },
  { id: 'qi-8', goalId: 'quinceanera-2026', name: 'Pastel', estimatedCost: 250, actualCost: 0, isPaid: false, notes: null },
  { id: 'qi-9', goalId: 'quinceanera-2026', name: 'Recuerdos / Favors', estimatedCost: 200, actualCost: 0, isPaid: false, notes: null },
  { id: 'qi-10', goalId: 'quinceanera-2026', name: 'Otros / Imprevistos', estimatedCost: 550, actualCost: 0, isPaid: false, notes: null },
];

const DEFAULT_GOALS: Goal[] = [
  {
    id: 'quinceanera-2026',
    name: 'Quinceañera de mi hija',
    description: 'Fiesta de 15 años - Agosto 2026',
    targetAmount: 5000,
    savedAmount: 0,
    deadline: '2026-08-15T00:00:00.000Z',
    color: '#ec4899',
    createdAt: now(),
    updatedAt: now(),
    items: DEFAULT_QUINCE_ITEMS,
    projectedIncomes: [],
  },
];

// ─── Settings ────────────────────────────────────────────────
export const getSettings = (): Settings => {
  const existing = load<Settings | null>(KEYS.settings, null);
  if (existing) return existing;
  const defaults: Settings = { id: 'main', initialBalance: 0, currency: 'USD', updatedAt: now() };
  save(KEYS.settings, defaults);
  return defaults;
};

export const updateSettings = (data: { initialBalance?: number; currency?: string }): Settings => {
  const current = getSettings();
  const updated: Settings = {
    ...current,
    ...data,
    updatedAt: now(),
  };
  save(KEYS.settings, updated);
  return updated;
};

// ─── Categories ──────────────────────────────────────────────
export const getCategories = (): Category[] => {
  return load<Category[]>(KEYS.categories, []);
};

export const createCategory = (data: { name: string; icon: string; color: string; type: string }): Category => {
  const cats = getCategories();
  const cat: Category = {
    id: `${data.type}-${uid()}`,
    name: data.name,
    icon: data.icon,
    color: data.color,
    type: data.type as 'income' | 'expense',
    createdAt: now(),
    updatedAt: now(),
  };
  cats.push(cat);
  save(KEYS.categories, cats);
  return cat;
};

export const deleteCategory = (_id: string): { success: boolean } => {
  const cats = getCategories().filter(c => c.id !== _id);
  save(KEYS.categories, cats);
  return { success: true };
};

// ─── Transactions ────────────────────────────────────────────
export const getTransactions = (_month?: string): Transaction[] => {
  const all = load<Transaction[]>(KEYS.transactions, []);
  const cats = getCategories();
  return all
    .map(t => ({ ...t, category: cats.find(c => c.id === t.categoryId) ?? null }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const createTransaction = (data: {
  type: string;
  amount: number;
  description: string;
  categoryId?: string;
  date?: string;
}): Transaction => {
  const txs = load<Transaction[]>(KEYS.transactions, []);
  const tx: Transaction = {
    id: uid(),
    type: data.type as 'income' | 'expense',
    amount: data.amount,
    description: data.description,
    categoryId: data.categoryId ?? null,
    date: data.date ?? now(),
    createdAt: now(),
    updatedAt: now(),
    category: null,
  };
  txs.push(tx);
  save(KEYS.transactions, txs);
  return tx;
};

export const deleteTransaction = (id: string): { success: boolean } => {
  const txs = load<Transaction[]>(KEYS.transactions, []).filter(t => t.id !== id);
  save(KEYS.transactions, txs);
  return { success: true };
};

export const updateTransaction = (id: string, data: {
  type?: string;
  amount?: number;
  description?: string;
  categoryId?: string | null;
  accountId?: string | null;
  date?: string;
}): Transaction => {
  const txs = load<Transaction[]>(KEYS.transactions, []);
  const idx = txs.findIndex(t => t.id === id);
  if (idx === -1) throw new Error('Transacción no encontrada');
  txs[idx] = { ...txs[idx], ...data, updatedAt: now() };
  save(KEYS.transactions, txs);
  return txs[idx];
};

// ─── Goals ───────────────────────────────────────────────────
export const getGoals = (): Goal[] => {
  const goals = load<Goal[]>(KEYS.goals, []);
  // Migration: add projectedIncomes if missing on Quinceañera goal
  let migrated = false;
  for (const g of goals) {
    if (!g.projectedIncomes) {
      g.projectedIncomes = [];
      migrated = true;
    }
  }
  if (migrated) {
    save(KEYS.goals, goals);
  }
  return goals;
};

export const createGoal = (data: {
  name: string;
  description?: string;
  targetAmount: number;
  deadline?: string;
  color?: string;
}): Goal => {
  const goals = getGoals();
  const goal: Goal = {
    id: uid(),
    name: data.name,
    description: data.description ?? null,
    targetAmount: data.targetAmount,
    savedAmount: 0,
    deadline: data.deadline ?? null,
    color: data.color ?? '#6366f1',
    createdAt: now(),
    updatedAt: now(),
    items: [],
  };
  goals.push(goal);
  save(KEYS.goals, goals);
  return goal;
};

export const updateGoal = (data: {
  id: string;
  savedAmount?: number;
  name?: string;
  description?: string;
  targetAmount?: number;
  deadline?: string;
  color?: string;
}): Goal => {
  const goals = getGoals();
  const idx = goals.findIndex(g => g.id === data.id);
  if (idx === -1) throw new Error('Meta no encontrada');
  const goal = { ...goals[idx], ...data, updatedAt: now() };
  goals[idx] = goal;
  save(KEYS.goals, goals);
  return goal;
};

export const deleteGoal = (id: string): { success: boolean } => {
  const goals = getGoals().filter(g => g.id !== id);
  save(KEYS.goals, goals);
  return { success: true };
};

// ─── Goal Items ──────────────────────────────────────────────
export const getGoalItems = (goalId: string): GoalItem[] => {
  const goal = getGoals().find(g => g.id === goalId);
  return goal?.items ?? [];
};

export const createGoalItem = (
  goalId: string,
  data: { name: string; estimatedCost: number; notes?: string }
): GoalItem => {
  const goals = getGoals();
  const idx = goals.findIndex(g => g.id === goalId);
  if (idx === -1) throw new Error('Meta no encontrada');
  const item: GoalItem = {
    id: uid(),
    goalId,
    name: data.name,
    estimatedCost: data.estimatedCost,
    actualCost: 0,
    isPaid: false,
    notes: data.notes ?? null,
  };
  goals[idx].items.push(item);
  goals[idx].updatedAt = now();
  save(KEYS.goals, goals);
  return item;
};

export const updateGoalItem = (
  goalId: string,
  data: { itemId: string; isPaid?: boolean; actualCost?: number; name?: string; notes?: string }
): GoalItem => {
  const goals = getGoals();
  const idx = goals.findIndex(g => g.id === goalId);
  if (idx === -1) throw new Error('Meta no encontrada');
  const itemIdx = goals[idx].items.findIndex(i => i.id === data.itemId);
  if (itemIdx === -1) throw new Error('Item no encontrado');

  const item = { ...goals[idx].items[itemIdx] };

  if (data.isPaid !== undefined) {
    item.isPaid = data.isPaid;
    if (data.isPaid && item.actualCost === 0) {
      item.actualCost = item.estimatedCost;
    }
  }
  if (data.actualCost !== undefined) {
    item.actualCost = data.actualCost;
  }
  if (data.name !== undefined) item.name = data.name;
  if (data.notes !== undefined) item.notes = data.notes;

  goals[idx].items[itemIdx] = item;

  // Recalculate savedAmount from paid items
  goals[idx].savedAmount = goals[idx].items
    .filter(i => i.isPaid)
    .reduce((sum, i) => sum + i.actualCost, 0);

  goals[idx].updatedAt = now();
  save(KEYS.goals, goals);
  return item;
};

export const deleteGoalItem = (goalId: string, itemId: string): { success: boolean } => {
  const goals = getGoals();
  const idx = goals.findIndex(g => g.id === goalId);
  if (idx === -1) return { success: true };
  goals[idx].items = goals[idx].items.filter(i => i.id !== itemId);
  goals[idx].savedAmount = goals[idx].items
    .filter(i => i.isPaid)
    .reduce((sum, i) => sum + i.actualCost, 0);
  goals[idx].updatedAt = now();
  save(KEYS.goals, goals);
  return { success: true };
};

// ─── Stable Projected Incomes (NOT synced to Gist) ──────────
const STABLE_INCOMES_KEY = 'mf_projected_incomes';

export const getStableProjectedIncomes = (): ProjectedIncome[] => {
  try {
    const raw = localStorage.getItem(STABLE_INCOMES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  // Default Quinceañera incomes
  const defaults = [
    { id: 'pi-1', date: '2026-06-05', amount: 41760, description: 'Sueldo', received: false },
    { id: 'pi-2', date: '2026-06-20', amount: 21000, description: '1/2 Aguinaldo', received: false },
    { id: 'pi-3', date: '2026-07-01', amount: 40000, description: 'Sueldo', received: false },
    { id: 'pi-4', date: '2026-07-30', amount: 9000, description: 'Ingreso extra', received: false },
    { id: 'pi-5', date: '2026-08-03', amount: 40000, description: 'Sueldo', received: false },
  ];
  localStorage.setItem(STABLE_INCOMES_KEY, JSON.stringify(defaults));
  return defaults;
};

export const addStableProjectedIncome = (data: { description: string; amount: number; date: string }): ProjectedIncome => {
  const incomes = getStableProjectedIncomes();
  const income: ProjectedIncome = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 9),
    date: data.date,
    amount: data.amount,
    description: data.description,
    received: false,
  };
  incomes.push(income);
  localStorage.setItem(STABLE_INCOMES_KEY, JSON.stringify(incomes));
  return income;
};

export const deleteStableProjectedIncome = (incomeId: string): { success: boolean } => {
  const incomes = getStableProjectedIncomes().filter(pi => pi.id !== incomeId);
  localStorage.setItem(STABLE_INCOMES_KEY, JSON.stringify(incomes));
  return { success: true };
};

export const updateStableProjectedIncome = (incomeId: string, data: { description?: string; amount?: number; date?: string; received?: boolean }): { success: boolean } => {
  const incomes = getStableProjectedIncomes();
  const idx = incomes.findIndex(pi => pi.id === incomeId);
  if (idx === -1) return { success: false };
  if (data.description !== undefined) incomes[idx].description = data.description;
  if (data.amount !== undefined) incomes[idx].amount = data.amount;
  if (data.date !== undefined) incomes[idx].date = data.date;
  if (data.received !== undefined) incomes[idx].received = data.received;
  localStorage.setItem(STABLE_INCOMES_KEY, JSON.stringify(incomes));
  return { success: true };
};

export const toggleStableProjectedIncome = (incomeId: string): { success: boolean } => {
  const incomes = getStableProjectedIncomes();
  const idx = incomes.findIndex(pi => pi.id === incomeId);
  if (idx === -1) return { success: true };
  incomes[idx].received = !incomes[idx].received;
  localStorage.setItem(STABLE_INCOMES_KEY, JSON.stringify(incomes));
  return { success: true };
};

export const toggleProjectedIncome = (goalId: string, incomeId: string): { success: boolean } => {
  try {
    const incomes = getStableProjectedIncomes();
    const idx = incomes.findIndex(pi => pi.id === incomeId);
    if (idx !== -1) {
      incomes[idx].received = !incomes[idx].received;
      localStorage.setItem(STABLE_INCOMES_KEY, JSON.stringify(incomes));
    }
  } catch {}
  const goals = load<Goal[]>(KEYS.goals, []);
  const gIdx = goals.findIndex(g => g.id === goalId);
  if (gIdx !== -1 && goals[gIdx].projectedIncomes) {
    const piIdx = goals[gIdx].projectedIncomes.findIndex(pi => pi.id === incomeId);
    if (piIdx !== -1) {
      goals[gIdx].projectedIncomes[piIdx].received = !goals[gIdx].projectedIncomes[piIdx].received;
      save(KEYS.goals, goals);
    }
  }
  return { success: true };
};

// ─── Accounts ──────────────────────────────────────────────
const ACCOUNTS_KEY = 'mf_accounts';

export interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export const getAccounts = (): Account[] => {
  return load<Account[]>(ACCOUNTS_KEY, []);
};

export const createAccount = (data: { name: string; icon: string; color: string; balance: number }): Account => {
  const accounts = getAccounts();
  const account: Account = {
    id: 'acct-' + uid(),
    name: data.name,
    icon: data.icon,
    color: data.color,
    balance: data.balance,
    createdAt: now(),
    updatedAt: now(),
  };
  accounts.push(account);
  save(ACCOUNTS_KEY, accounts);
  return account;
};

export const updateAccount = (id: string, data: { name?: string; icon?: string; color?: string; balance?: number }): Account => {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) throw new Error('Cuenta no encontrada');
  accounts[idx] = { ...accounts[idx], ...data, updatedAt: now() };
  save(ACCOUNTS_KEY, accounts);
  return accounts[idx];
};

export const deleteAccount = (id: string): { success: boolean } => {
  const accounts = getAccounts().filter(a => a.id !== id);
  save(ACCOUNTS_KEY, accounts);
  return { success: true };
};

export const getAccountStats = (): Array<{ account: Account; income: number; expense: number; currentBalance: number }> => {
  const accounts = getAccounts();
  const txs = load<Transaction[]>(KEYS.transactions, []);
  return accounts.map(account => {
    const accTxs = txs.filter(t => t.accountId === account.id);
    const income = accTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = accTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { account, income, expense, currentBalance: account.balance + income - expense };
  });
};

// ─── Stats (computed client-side) ────────────────────────────
export const getStats = (): Stats => {
  const txs = load<Transaction[]>(KEYS.transactions, []);
  const cats = getCategories();

  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const nowDate = new Date();
  const currentMonth = nowDate.getFullYear() + '-' + String(nowDate.getMonth() + 1).padStart(2, '0');

  const currentMonthTxs = txs.filter(t => {
    const d = new Date(t.date);
    const m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    return m === currentMonth;
  });

  const currentMonthIncome = currentMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const currentMonthExpense = currentMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Group by month for averages
  const monthMap = new Map<string, { income: number; expense: number }>();
  txs.forEach(t => {
    const d = new Date(t.date);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (!monthMap.has(key)) monthMap.set(key, { income: 0, expense: 0 });
    const entry = monthMap.get(key)!;
    if (t.type === 'income') entry.income += t.amount;
    else entry.expense += t.amount;
  });

  const monthCount = monthMap.size || 1;
  const averageMonthlyIncome = Math.round(totalIncome / monthCount * 100) / 100;
  const averageMonthlyExpense = Math.round(totalExpense / monthCount * 100) / 100;

  // Last 6 months chart data
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const last6: { month: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const label = monthNames[d.getMonth()] + ' ' + d.getFullYear().toString().slice(2);
    const data = monthMap.get(key) ?? { income: 0, expense: 0 };
    last6.push({ month: label, income: data.income, expense: data.expense });
  }

  // Top expense categories
  const catMap = new Map<string, { name: string; color: string; icon: string; total: number }>();
  txs.filter(t => t.type === 'expense' && t.categoryId).forEach(t => {
    const cat = cats.find(c => c.id === t.categoryId);
    if (!cat) return;
    const existing = catMap.get(cat.id);
    if (existing) {
      existing.total += t.amount;
    } else {
      catMap.set(cat.id, { name: cat.name, color: cat.color, icon: cat.icon, total: t.amount });
    }
  });
  const topExpenseCategories = Array.from(catMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    averageMonthlyIncome,
    averageMonthlyExpense,
    currentMonthIncome,
    currentMonthExpense,
    last6Months: last6,
    topExpenseCategories,
  };
};

// ─── Seed ────────────────────────────────────────────────────
const SEED_VERSION = 2;

export const seedData = (): { success: boolean } => {
  const currentVersion = load<number>(KEYS.seeded, 0);

  // Always update categories when seed version changes
  if (currentVersion < SEED_VERSION) {
    save(KEYS.categories, [...DEFAULT_EXPENSE_CATS, ...DEFAULT_INCOME_CATS]);
  }

  const goals = getGoals();
  if (goals.length === 0) {
    save(KEYS.goals, DEFAULT_GOALS);
  }

  save(KEYS.seeded, SEED_VERSION);
  return { success: true };
};
