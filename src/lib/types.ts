export interface Settings {
  id: string;
  initialBalance: number;
  currency: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  categoryId: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  category: Category | null;
}

export interface GoalItem {
  id: string;
  goalId: string;
  name: string;
  estimatedCost: number;
  actualCost: number;
  isPaid: boolean;
  notes: string | null;
}

export interface Goal {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  savedAmount: number;
  deadline: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  items: GoalItem[];
}

export interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  averageMonthlyIncome: number;
  averageMonthlyExpense: number;
  currentMonthIncome: number;
  currentMonthExpense: number;
  last6Months: { month: string; income: number; expense: number }[];
  topExpenseCategories: { name: string; color: string; icon: string; total: number }[];
}
