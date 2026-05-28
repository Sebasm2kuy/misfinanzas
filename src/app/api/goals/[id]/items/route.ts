import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const items = await db.goalItem.findMany({
      where: { goalId: id },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching goal items:', error);
    return NextResponse.json({ error: 'Error al obtener items de la meta' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, estimatedCost, notes } = body;

    if (!name || estimatedCost === undefined) {
      return NextResponse.json({ error: 'Nombre y costo estimado son requeridos' }, { status: 400 });
    }

    const item = await db.goalItem.create({
      data: {
        goalId: id,
        name,
        estimatedCost: parseFloat(estimatedCost),
        actualCost: 0,
        isPaid: false,
        notes: notes || null,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating goal item:', error);
    return NextResponse.json({ error: 'Error al crear item' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: goalId } = await params;
    const body = await request.json();
    const { itemId, name, estimatedCost, actualCost, isPaid, notes } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'ID del item requerido' }, { status: 400 });
    }

    const item = await db.goalItem.update({
      where: { id: itemId },
      data: {
        ...(name !== undefined && { name }),
        ...(estimatedCost !== undefined && { estimatedCost: parseFloat(estimatedCost) }),
        ...(actualCost !== undefined && { actualCost: parseFloat(actualCost) }),
        ...(isPaid !== undefined && { isPaid }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });

    // If marking as paid and actualCost is 0, update actualCost to estimatedCost
    if (isPaid && !actualCost) {
      const updatedItem = await db.goalItem.update({
        where: { id: itemId },
        data: { actualCost: item.estimatedCost },
      });
      // Update goal savedAmount
      const goalItems = await db.goalItem.findMany({ where: { goalId } });
      const totalPaid = goalItems
        .filter((gi) => gi.isPaid)
        .reduce((sum, gi) => sum + gi.actualCost, 0);
      await db.goal.update({
        where: { id: goalId },
        data: { savedAmount: totalPaid },
      });
      return NextResponse.json(updatedItem);
    }

    // Recalculate goal savedAmount
    const goalItems = await db.goalItem.findMany({ where: { goalId } });
    const totalPaid = goalItems
      .filter((gi) => gi.isPaid)
      .reduce((sum, gi) => sum + gi.actualCost, 0);
    await db.goal.update({
      where: { id: goalId },
      data: { savedAmount: totalPaid },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating goal item:', error);
    return NextResponse.json({ error: 'Error al actualizar item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: goalId } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'ID del item requerido' }, { status: 400 });
    }

    await db.goalItem.delete({ where: { id: itemId } });

    // Recalculate goal savedAmount
    const goalItems = await db.goalItem.findMany({ where: { goalId } });
    const totalPaid = goalItems
      .filter((gi) => gi.isPaid)
      .reduce((sum, gi) => sum + gi.actualCost, 0);
    await db.goal.update({
      where: { id: goalId },
      data: { savedAmount: totalPaid },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal item:', error);
    return NextResponse.json({ error: 'Error al eliminar item' }, { status: 500 });
  }
}
