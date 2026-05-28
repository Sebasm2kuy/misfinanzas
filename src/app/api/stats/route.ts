import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get all transactions
    const transactions = await db.transaction.findMany({
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    // Total income and expense
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Current month
    const currentMonthTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const currentMonthIncome = currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const currentMonthExpense = currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate averages based on months with data
    const monthMap = new Map<string, { income: number; expense: number }>();
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, { income: 0, expense: 0 });
      }
      const entry = monthMap.get(key)!;
      if (t.type === 'income') entry.income += t.amount;
      else entry.expense += t.amount;
    });

    const monthCount = monthMap.size || 1;
    const averageMonthlyIncome = totalIncome / monthCount;
    const averageMonthlyExpense = totalExpense / monthCount;

    // Last 6 months chart data
    const last6Months: { month: string; income: number; expense: number }[] = [];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthMap.get(key) || { income: 0, expense: 0 };
      last6Months.push({
        month: monthNames[d.getMonth()],
        income: entry.income,
        expense: entry.expense,
      });
    }

    // Top expense categories
    const categoryMap = new Map<string, { name: string; color: string; icon: string; total: number }>();
    transactions
      .filter((t) => t.type === 'expense' && t.category)
      .forEach((t) => {
        const cat = t.category!;
        if (!categoryMap.has(cat.id)) {
          categoryMap.set(cat.id, { name: cat.name, color: cat.color, icon: cat.icon, total: 0 });
        }
        categoryMap.get(cat.id)!.total += t.amount;
      });

    const topExpenseCategories = Array.from(categoryMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return NextResponse.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      averageMonthlyIncome,
      averageMonthlyExpense,
      currentMonthIncome,
      currentMonthExpense,
      last6Months,
      topExpenseCategories,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
