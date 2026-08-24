import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const { status, previousStatus, restoreStock } = await req.json()

    const existingOrder = await db.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // If cancelling an order — handle stock based on choice
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      if (restoreStock === true) {
        await Promise.all(
          existingOrder.items
            .filter((item) => item.flowerId)
            .map((item) =>
              db.flower.update({
                where: { id: item.flowerId as string },
                data: { stock: { increment: item.quantity } },
              })
            )
        )
      } else if (restoreStock === false) {
        await Promise.all(
          existingOrder.items.map((item) =>
            db.writeOff.create({
              data: {
                flowerId: item.flowerId,
                flowerName: item.flowerName,
                quantity: item.quantity,
                reason: `Списание по отменённому заказу ${id.slice(0, 8)}`,
              },
            })
          )
        )
      }
    }

    const order = await db.order.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
