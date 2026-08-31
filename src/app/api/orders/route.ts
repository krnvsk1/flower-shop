import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { saleUnitPrice } from '@/lib/promo';
import { getPromos } from '@/lib/promo-store';
import { applyBonuses, getBonusSettings } from '@/lib/bonus-store';
import { isPaymentMethod } from '@/lib/payment';
import { getDeliveryZone } from '@/lib/delivery-zone-store';
import { isInsideZone, normalizeLatLng, zoneRestricts } from '@/lib/geo';

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

    const point = normalizeLatLng({ lat: body.addressLat, lng: body.addressLng });
    if (!point) {
      return NextResponse.json(
        { error: 'Выберите адрес из подсказок или укажите точку на карте' },
        { status: 400 }
      );
    }

    const zone = await getDeliveryZone();
    if (zoneRestricts(zone) && !isInsideZone(point, zone)) {
      return NextResponse.json(
        { error: 'Этот адрес вне зоны доставки' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }

    if (!isPaymentMethod(body.paymentMethod)) {
      return NextResponse.json(
        { error: 'Выберите оплату: наличные, терминал или QR' },
        { status: 400 }
      );
    }

    // Validate each item and check stock availability
    const promos = await getPromos();
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
        price: saleUnitPrice(flower.price, promos, flower.id),
      });
    }

    // Calculate total
    const goodsTotal = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const spendRequested = body.spendBonuses === true ? goodsTotal : Math.max(0, Math.floor(Number(body.bonusSpend) || 0));
    const bonusSettings = await getBonusSettings();

    const order = await db.$transaction(async (tx) => {
      const bonus = await applyBonuses(tx, {
        phone: clientPhone.trim(),
        goodsTotal,
        spendRequested,
        settings: bonusSettings,
      });

      const newOrder = await tx.order.create({
        data: {
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          address: address.trim(),
          addressLat: point.lat,
          addressLng: point.lng,
          deliverySlot:
            typeof deliverySlot === 'string' && deliverySlot.trim()
              ? deliverySlot.trim()
              : null,
          comment:
            typeof comment === 'string' && comment.trim() ? comment.trim() : null,
          source: 'online',
          paymentMethod: body.paymentMethod,
          totalAmount: bonus.totalAmount,
          bonusSpent: bonus.spent,
          bonusEarned: bonus.earned,
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
