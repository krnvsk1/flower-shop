import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { findPromoForFlower, saleUnitPrice, toPublicPromos } from '@/lib/promo';
import { getPromos } from '@/lib/promo-store';

export async function GET() {
  try {
    const [flowers, promos] = await Promise.all([
      db.flower.findMany({
        where: { active: true, stock: { gt: 0 } },
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
      }),
      getPromos(),
    ]);

    return NextResponse.json({
      promo: toPublicPromos(promos)[0] ?? null,
      promos: toPublicPromos(promos),
      flowers: flowers.map((flower) => {
        const match = findPromoForFlower(promos, flower.id);
        return {
          ...flower,
          salePrice: match ? saleUnitPrice(flower.price, promos, flower.id) : null,
          discountPercent: match ? match.discountPercent : null,
        };
      }),
    });
  } catch (error) {
    console.error('Failed to fetch flowers:', error);
    return NextResponse.json({ error: 'Failed to fetch flowers' }, { status: 500 });
  }
}
