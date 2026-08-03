import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const flowers = await db.flower.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        imageUrl: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(flowers);
  } catch (error) {
    console.error('Failed to fetch flowers:', error);
    return NextResponse.json({ error: 'Failed to fetch flowers' }, { status: 500 });
  }
}
