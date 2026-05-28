import { Category, Transaction, Goal, GoalItem, Settings, Stats } from './types';

const BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error de servidor' }));
    throw new Error(error.error || 'Error de servidor');
  }
  return res.json();
}

// Settings
export const getSettings = () => fetchJSON<Settings>(`${BASE}/settings`);
export const updateSettings = (data: { initialBalance?: number; currency?: string }) =>
  fetchJSON<Settings>(`${BASE}/settings`, { method: 'PUT', body: JSON.stringify(data) });

// Transactions
export const getTransactions = (month?: string) => {
  const url = month ? `${BASE}/transactions?month=${month}` : `${BASE}/transactions`;
  return fetchJSON<Transaction[]>(url);
};
export const createTransaction = (data: {
  type: string;
  amount: number;
  description: string;
  categoryId?: string;
  date?: string;
}) => fetchJSON<Transaction>(`${BASE}/transactions`, { method: 'POST', body: JSON.stringify(data) });

export const deleteTransaction = (id: string) =>
  fetchJSON<{ success: boolean }>(`${BASE}/transactions?id=${id}`, { method: 'DELETE' });

// Categories
export const getCategories = () => fetchJSON<Category[]>(`${BASE}/categories`);
export const createCategory = (data: { name: string; icon: string; color: string; type: string }) =>
  fetchJSON<Category>(`${BASE}/categories`, { method: 'POST', body: JSON.stringify(data) });
export const deleteCategory = (id: string) =>
  fetchJSON<{ success: boolean }>(`${BASE}/categories?id=${id}`, { method: 'DELETE' });

// Goals
export const getGoals = () => fetchJSON<Goal[]>(`${BASE}/goals`);
export const createGoal = (data: {
  name: string;
  description?: string;
  targetAmount: number;
  deadline?: string;
  color?: string;
}) => fetchJSON<Goal>(`${BASE}/goals`, { method: 'POST', body: JSON.stringify(data) });
export const updateGoal = (data: {
  id: string;
  savedAmount?: number;
  name?: string;
  description?: string;
  targetAmount?: number;
  deadline?: string;
  color?: string;
}) => fetchJSON<Goal>(`${BASE}/goals`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteGoal = (id: string) =>
  fetchJSON<{ success: boolean }>(`${BASE}/goals?id=${id}`, { method: 'DELETE' });

// Goal Items
export const getGoalItems = (goalId: string) => fetchJSON<GoalItem[]>(`${BASE}/goals/${goalId}/items`);
export const createGoalItem = (
  goalId: string,
  data: { name: string; estimatedCost: number; notes?: string }
) =>
  fetchJSON<GoalItem>(`${BASE}/goals/${goalId}/items`, { method: 'POST', body: JSON.stringify(data) });
export const updateGoalItem = (
  goalId: string,
  data: { itemId: string; isPaid?: boolean; actualCost?: number; name?: string; notes?: string }
) =>
  fetchJSON<GoalItem>(`${BASE}/goals/${goalId}/items`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteGoalItem = (goalId: string, itemId: string) =>
  fetchJSON<{ success: boolean }>(`${BASE}/goals/${goalId}/items?itemId=${itemId}`, { method: 'DELETE' });

// Stats
export const getStats = () => fetchJSON<Stats>(`${BASE}/stats`);

// Seed
export const seedData = () => fetchJSON<{ success: boolean }>(`${BASE}/seed`, { method: 'POST' });
