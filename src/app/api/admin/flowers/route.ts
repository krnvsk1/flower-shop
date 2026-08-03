import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
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
  try {
    const body = await req.json()
    const { name, description, price, stock, imageUrl, category } = body

    if (!name || price == null || stock == null) {
      return NextResponse.json({ error: 'Name, price, and stock are required' }, { status: 400 })
    }

    const flower = await db.flower.create({
      data: {
        name,
        description: description ?? null,
        price: Number(price),
        stock: Number(stock),
        imageUrl: imageUrl ?? null,
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
