import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let settings = await db.settings.findUnique({ where: { id: 'main' } });
    if (!settings) {
      settings = await db.settings.create({
        data: { id: 'main', initialBalance: 0, currency: 'USD' },
      });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = await db.settings.upsert({
      where: { id: 'main' },
      update: {
        ...(body.initialBalance !== undefined && { initialBalance: body.initialBalance }),
        ...(body.currency !== undefined && { currency: body.currency }),
      },
      create: {
        id: 'main',
        initialBalance: body.initialBalance ?? 0,
        currency: body.currency ?? 'USD',
      },
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
  }
}
