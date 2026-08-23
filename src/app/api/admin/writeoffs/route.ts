import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const writeoffs = await db.writeOff.findMany({
      orderBy: { createdAt: 'desc' },
      include: { flower: { select: { name: true } } },
    })
    return NextResponse.json(writeoffs)
  } catch (error) {
    console.error('Fetch writeoffs error:', error)
    return NextResponse.json({ error: 'Failed to fetch writeoffs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { flowerId, quantity, reason } = await req.json()

    if (!flowerId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Flower ID and valid quantity are required' },
        { status: 400 }
      )
    }

    const flower = await db.flower.findUnique({ where: { id: flowerId } })
    if (!flower) {
      return NextResponse.json({ error: 'Flower not found' }, { status: 404 })
    }

    if (flower.stock < quantity) {
      return NextResponse.json(
        { error: `Недостаточно на складе. Доступно: ${flower.stock}` },
        { status: 400 }
      )
    }

    const writeoff = await db.writeOff.create({
      data: {
        flowerId,
        flowerName: flower.name,
        quantity,
        reason: reason ?? null,
      },
    })

    // Decrease stock
    await db.flower.update({
      where: { id: flowerId },
      data: { stock: { decrement: quantity } },
    })

    return NextResponse.json(writeoff, { status: 201 })
  } catch (error) {
    console.error('Create writeoff error:', error)
    return NextResponse.json({ error: 'Failed to create writeoff' }, { status: 500 })
  }
}
