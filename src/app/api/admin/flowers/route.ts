import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { resolveImageUrl } from '@/lib/image-url'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const flowers = await db.flower.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(flowers)
  } catch (error) {
    console.error('Fetch flowers error:', error)
    return NextResponse.json({ error: 'Failed to fetch flowers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = await req.json()
    const { name, description, price, costPrice, imageUrl, category } = body

    if (!name || price == null) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
    }

    const parsedCost =
      costPrice === '' || costPrice == null ? null : Number(costPrice)

    const flower = await db.flower.create({
      data: {
        name,
        description: description ?? null,
        price: Number(price),
        costPrice: parsedCost != null && Number.isFinite(parsedCost) ? parsedCost : null,
        stock: 0,
        imageUrl: await resolveImageUrl(imageUrl),
        category: category ?? null,
        active: true,
      },
    })

    return NextResponse.json(flower, { status: 201 })
  } catch (error) {
    console.error('Create flower error:', error)
    return NextResponse.json({ error: 'Failed to create flower' }, { status: 500 })
  }
}
