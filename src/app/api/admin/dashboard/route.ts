import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [totalFlowers, activeFlowers, totalOrders, pendingOrders, revenueResult, lowStockFlowers] =
      await Promise.all([
        db.flower.count(),
        db.flower.count({ where: { active: true } }),
        db.order.count(),
        db.order.count({ where: { status: 'new' } }),
        db.order.aggregate({
          where: { status: { in: ['new', 'processing', 'completed'] } },
          _sum: { totalAmount: true },
        }),
        db.flower.count({ where: { stock: { lte: 5 }, active: true } }),
      ])

    return NextResponse.json({
      totalFlowers,
      activeFlowers,
      totalOrders,
      pendingOrders,
      totalRevenue: revenueResult._sum.totalAmount ?? 0,
      lowStockCount: lowStockFlowers,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
