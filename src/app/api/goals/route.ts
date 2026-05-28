import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const goals = await db.goal.findMany({
      include: { items: { orderBy: { name: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Error al obtener metas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, targetAmount, deadline, color } = body;

    if (!name || !targetAmount) {
      return NextResponse.json({ error: 'Nombre y monto objetivo son requeridos' }, { status: 400 });
    }

    const goal = await db.goal.create({
      data: {
        name,
        description: description || null,
        targetAmount: parseFloat(targetAmount),
        savedAmount: 0,
        deadline: deadline ? new Date(deadline) : null,
        color: color || '#6366f1',
      },
      include: { items: true },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Error al crear meta' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, targetAmount, savedAmount, deadline, color } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const goal = await db.goal.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(targetAmount !== undefined && { targetAmount: parseFloat(targetAmount) }),
        ...(savedAmount !== undefined && { savedAmount: parseFloat(savedAmount) }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(color !== undefined && { color }),
      },
      include: { items: true },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Error al actualizar meta' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await db.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: 'Error al eliminar meta' }, { status: 500 });
  }
}
