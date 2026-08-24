import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { isPaymentMethod } from '@/lib/payment'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Fetch orders error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = await req.json()
    const { items } = body
    const paymentMethod = body.paymentMethod

    if (!isPaymentMethod(paymentMethod)) {
      return NextResponse.json(
        { error: 'Выберите оплату: наличные, терминал или QR' },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Добавьте хотя бы один товар' }, { status: 400 })
    }

    const clientName =
      typeof body.clientName === 'string' && body.clientName.trim()
        ? body.clientName.trim()
        : 'Офлайн'
    const clientPhone =
      typeof body.clientPhone === 'string' && body.clientPhone.trim()
        ? body.clientPhone.trim()
        : '—'
    const comment =
      typeof body.comment === 'string' && body.comment.trim() ? body.comment.trim() : null

    const order = await db.$transaction(async (tx) => {
      const validated: { flowerId: string; quantity: number; name: string; price: number }[] = []

      for (const item of items) {
        const quantity = Math.round(Number(item.quantity))
        if (!item.flowerId || !Number.isInteger(quantity) || quantity <= 0) {
          throw new Error('INVALID_ITEM')
        }

        const flower = await tx.flower.findUnique({ where: { id: String(item.flowerId) } })
        if (!flower) throw new Error('FLOWER_NOT_FOUND')
        if (flower.stock < quantity) {
          throw new Error(`STOCK:${flower.name}:${flower.stock}`)
        }

        validated.push({
          flowerId: flower.id,
          quantity,
          name: flower.name,
          price: flower.price,
        })
      }

      const totalAmount = validated.reduce((sum, item) => sum + item.price * item.quantity, 0)

      const created = await tx.order.create({
        data: {
          clientName,
          clientPhone,
          address: null,
          deliverySlot: null,
          comment,
          source: 'walkin',
          paymentMethod,
          status: 'completed',
          totalAmount,
          items: {
            create: validated.map((item) => ({
              flowerId: item.flowerId,
              flowerName: item.name,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
            })),
          },
        },
        include: { items: true },
      })

      for (const item of validated) {
        await tx.flower.update({
          where: { id: item.flowerId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      return created
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'INVALID_ITEM') {
        return NextResponse.json({ error: 'Некорректная позиция' }, { status: 400 })
      }
      if (error.message === 'FLOWER_NOT_FOUND') {
        return NextResponse.json({ error: 'Товар не найден' }, { status: 400 })
      }
      if (error.message.startsWith('STOCK:')) {
        const [, name, stock] = error.message.split(':')
        return NextResponse.json(
          { error: `Недостаточно «${name}». Остаток: ${stock}` },
          { status: 400 }
        )
      }
    }
    console.error('Walk-in order error:', error)
    return NextResponse.json({ error: 'Не удалось оформить продажу' }, { status: 500 })
  }
}
