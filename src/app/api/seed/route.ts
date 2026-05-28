import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Seed expense categories
    const expenseCategories = [
      { name: 'Alimentación', icon: 'UtensilsCrossed', color: '#ef4444', type: 'expense' },
      { name: 'Transporte', icon: 'Car', color: '#f97316', type: 'expense' },
      { name: 'Vivienda', icon: 'Home', color: '#eab308', type: 'expense' },
      { name: 'Entretenimiento', icon: 'Gamepad2', color: '#22c55e', type: 'expense' },
      { name: 'Salud', icon: 'Heart', color: '#06b6d4', type: 'expense' },
      { name: 'Educación', icon: 'GraduationCap', color: '#8b5cf6', type: 'expense' },
      { name: 'Ropa', icon: 'Shirt', color: '#ec4899', type: 'expense' },
      { name: 'Servicios', icon: 'Wifi', color: '#6366f1', type: 'expense' },
      { name: 'Otros', icon: 'MoreHorizontal', color: '#6b7280', type: 'expense' },
    ];

    const incomeCategories = [
      { name: 'Salario', icon: 'Banknote', color: '#22c55e', type: 'income' },
      { name: 'Freelance', icon: 'Laptop', color: '#06b6d4', type: 'income' },
      { name: 'Inversiones', icon: 'TrendingUp', color: '#8b5cf6', type: 'income' },
      { name: 'Otros', icon: 'MoreHorizontal', color: '#6b7280', type: 'income' },
    ];

    for (const cat of [...expenseCategories, ...incomeCategories]) {
      await db.category.upsert({
        where: { id: `${cat.type}-${cat.name.toLowerCase().replace(/\s+/g, '-')}` },
        update: { name: cat.name, icon: cat.icon, color: cat.color },
        create: { id: `${cat.type}-${cat.name.toLowerCase().replace(/\s+/g, '-')}`, ...cat },
      });
    }

    // Seed Quinceañera goal
    const goalId = 'quinceanera-2026';
    const existingGoal = await db.goal.findUnique({ where: { id: goalId } });

    if (!existingGoal) {
      await db.goal.create({
        data: {
          id: goalId,
          name: 'Quinceañera de mi hija',
          description: 'Fiesta de 15 años - Agosto 2026',
          targetAmount: 5000,
          savedAmount: 0,
          deadline: new Date('2026-08-15T00:00:00.000Z'),
          color: '#ec4899',
          items: {
            create: [
              { name: 'Salón / Venue', estimatedCost: 1200, actualCost: 0, isPaid: false },
              { name: 'Catering / Comida', estimatedCost: 800, actualCost: 0, isPaid: false },
              { name: 'Decoración', estimatedCost: 500, actualCost: 0, isPaid: false },
              { name: 'Música / DJ', estimatedCost: 600, actualCost: 0, isPaid: false },
              { name: 'Fotografía', estimatedCost: 400, actualCost: 0, isPaid: false },
              { name: 'Vestido', estimatedCost: 350, actualCost: 0, isPaid: false },
              { name: 'Invitaciones', estimatedCost: 150, actualCost: 0, isPaid: false },
              { name: 'Pastel', estimatedCost: 250, actualCost: 0, isPaid: false },
              { name: 'Recuerdos / Favors', estimatedCost: 200, actualCost: 0, isPaid: false },
              { name: 'Otros / Imprevistos', estimatedCost: 550, actualCost: 0, isPaid: false },
            ],
          },
        },
        include: { items: true },
      });
    }

    return NextResponse.json({ success: true, message: 'Datos iniciales creados exitosamente' });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Error al crear datos iniciales' }, { status: 500 });
  }
}
