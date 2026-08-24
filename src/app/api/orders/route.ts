import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientName, clientPhone, address, deliverySlot, comment, items } = body;

    // Validate required fields
    if (!clientName || typeof clientName !== 'string' || clientName.trim().length === 0) {
      return NextResponse.json({ error: 'Укажите имя' }, { status: 400 });
    }

    if (!clientPhone || typeof clientPhone !== 'string' || clientPhone.trim().length === 0) {
      return NextResponse.json({ error: 'Укажите телефон' }, { status: 400 });
    }

    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      return NextResponse.json({ error: 'Укажите адрес доставки' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }

    // Validate each item and check stock availability
    const validatedItems: { flowerId: string; quantity: number; name: string; price: number }[] = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (isNaN(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for item with flowerId: ${item.flowerId}` },
          { status: 400 }
        );
      }

      if (!item.flowerId || typeof item.flowerId !== 'string') {
        return NextResponse.json({ error: 'Each item must have a valid flowerId' }, { status: 400 });
      }

      const flower = await db.flower.findUnique({
        where: { id: item.flowerId },
      });

      if (!flower) {
        return NextResponse.json(
          { error: `Flower with id ${item.flowerId} not found` },
          { status: 400 }
        );
      }

      if (!flower.active) {
        return NextResponse.json(
          { error: `Flower "${flower.name}" is not available` },
          { status: 400 }
        );
      }

      if (flower.stock < quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${flower.name}". Available: ${flower.stock}, requested: ${quantity}` },
          { status: 400 }
        );
      }

      validatedItems.push({
        flowerId: flower.id,
        quantity,
        name: flower.name,
        price: flower.price,
      });
    }

    // Calculate total
    const totalAmount = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create order with items in a transaction
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          address: address.trim(),
          deliverySlot:
            typeof deliverySlot === 'string' && deliverySlot.trim()
              ? deliverySlot.trim()
              : null,
          comment:
            typeof comment === 'string' && comment.trim() ? comment.trim() : null,
          source: 'online',
          totalAmount,
          items: {
            create: validatedItems.map((item) => ({
              flowerId: item.flowerId,
              flowerName: item.name,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      // Deduct stock for each item
      for (const item of validatedItems) {
        await tx.flower.update({
          where: { id: item.flowerId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
