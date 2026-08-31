import { db } from '@/lib/db'
import { formatPhone, normalizePhone } from '@/lib/bonus'

export type ClientOrder = {
  id: string
  clientName: string
  clientPhone: string
  address: string | null
  deliverySlot: string | null
  comment: string | null
  source: string
  paymentMethod: string | null
  status: string
  totalAmount: number
  bonusSpent: number
  bonusEarned: number
  createdAt: Date
  items: { flowerName: string; quantity: number; subtotal: number }[]
}

export type ClientRecord = {
  phone: string
  phoneLabel: string
  name: string
  names: string[]
  addresses: string[]
  orderCount: number
  paidTotal: number
  bonusBalance: number
  bonusEarned: number
  bonusSpent: number
  lastOrderAt: string | null
  orders: ClientOrder[]
}

function emptyClient(phone: string): Omit<ClientRecord, 'orders'> & { orders: ClientOrder[] } {
  return {
    phone,
    phoneLabel: formatPhone(phone),
    name: '',
    names: [],
    addresses: [],
    orderCount: 0,
    paidTotal: 0,
    bonusBalance: 0,
    bonusEarned: 0,
    bonusSpent: 0,
    lastOrderAt: null,
    orders: [],
  }
}

export async function listClients(): Promise<ClientRecord[]> {
  const [orders, bonuses] = await Promise.all([
    db.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: { select: { flowerName: true, quantity: true, subtotal: true } },
      },
    }),
    db.customerBonus.findMany(),
  ])

  const map = new Map<string, ClientRecord>()

  for (const row of bonuses) {
    const client = emptyClient(row.phone)
    client.bonusBalance = row.balance
    map.set(row.phone, client)
  }

  for (const order of orders) {
    const phone = normalizePhone(order.clientPhone)
    if (!phone) continue
    const client = map.get(phone) ?? emptyClient(phone)
    const name = order.clientName.trim()
    if (name && name !== 'Офлайн' && !client.names.includes(name)) client.names.push(name)
    const address = order.address?.trim()
    if (address && !client.addresses.includes(address)) client.addresses.push(address)
    client.orderCount += 1
    if (order.status !== 'cancelled') client.paidTotal += order.totalAmount
    client.bonusEarned += order.bonusEarned
    client.bonusSpent += order.bonusSpent
    if (!client.lastOrderAt) client.lastOrderAt = order.createdAt.toISOString()
    client.orders.push({
      id: order.id,
      clientName: order.clientName,
      clientPhone: order.clientPhone,
      address: order.address,
      deliverySlot: order.deliverySlot,
      comment: order.comment,
      source: order.source,
      paymentMethod: order.paymentMethod,
      status: order.status,
      totalAmount: order.totalAmount,
      bonusSpent: order.bonusSpent,
      bonusEarned: order.bonusEarned,
      createdAt: order.createdAt,
      items: order.items,
    })
    map.set(phone, client)
  }

  return [...map.values()]
    .map((client) => ({
      ...client,
      name: client.names[0] || 'Без имени',
    }))
    .sort((a, b) => {
      const aTime = a.lastOrderAt ? Date.parse(a.lastOrderAt) : 0
      const bTime = b.lastOrderAt ? Date.parse(b.lastOrderAt) : 0
      return bTime - aTime
    })
}
