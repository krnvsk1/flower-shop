import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const inbounds = await db.stockInbound.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { items: true },
    })
    return NextResponse.json(inbounds)
  } catch (error) {
    console.error('Fetch inbound error:', error)
    return NextResponse.json({ error: 'Failed to fetch inbound' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = await req.json()
    const fileName = typeof body.fileName === 'string' ? body.fileName : null
    const note = typeof body.note === 'string' ? body.note.trim() : ''
    const items = Array.isArray(body.items) ? body.items : []

    const cleaned = items
      .map((item: { flowerId?: string; quantity?: number; costPrice?: number | null }) => {
        const rawCost = item.costPrice
        const costPrice =
          rawCost == null || rawCost === ''
            ? null
            : Number(String(rawCost).replace(',', '.'))
        return {
          flowerId: String(item.flowerId || ''),
          quantity: Math.round(Number(item.quantity)),
          costPrice:
            costPrice != null && Number.isFinite(costPrice) && costPrice >= 0 ? costPrice : null,
        }
      })
      .filter((item) => item.flowerId && Number.isFinite(item.quantity) && item.quantity > 0)

    if (cleaned.length === 0) {
      return NextResponse.json({ error: 'Нет строк для оприходования' }, { status: 400 })
    }

    const inbound = await db.$transaction(async (tx) => {
      const flowers = await tx.flower.findMany({
        where: { id: { in: cleaned.map((item) => item.flowerId) } },
      })
      const byId = new Map(flowers.map((flower) => [flower.id, flower]))

      for (const item of cleaned) {
        if (!byId.has(item.flowerId)) {
          throw new Error('FLOWER_NOT_FOUND')
        }
      }

      const created = await tx.stockInbound.create({
        data: {
          fileName,
          note: note || null,
          items: {
            create: cleaned.map((item) => ({
              flowerId: item.flowerId,
              flowerName: byId.get(item.flowerId)!.name,
              quantity: item.quantity,
              costPrice: item.costPrice,
            })),
          },
        },
        include: { items: true },
      })

      for (const item of cleaned) {
        await tx.flower.update({
          where: { id: item.flowerId },
          data: {
            stock: { increment: item.quantity },
            ...(item.costPrice != null ? { costPrice: item.costPrice } : {}),
          },
        })
      }

      return created
    })

    return NextResponse.json(inbound, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FLOWER_NOT_FOUND') {
      return NextResponse.json({ error: 'Товар из накладной не найден' }, { status: 400 })
    }
    console.error('Create inbound error:', error)
    return NextResponse.json({ error: 'Failed to apply inbound' }, { status: 500 })
  }
}
