import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status, previousStatus } = await req.json()

    const existingOrder = await db.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // If cancelling an order, restore stock
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      await Promise.all(
        existingOrder.items.map((item) =>
          db.flower.update({
            where: { id: item.flowerId },
            data: { stock: { increment: item.quantity } },
          })
        )
      )
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
