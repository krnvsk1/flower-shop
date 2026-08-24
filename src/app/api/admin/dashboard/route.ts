import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const [
      totalFlowers,
      activeFlowers,
      totalOrders,
      pendingOrders,
      processingOrders,
      revenueResult,
      lowStockCount,
      recentOrders,
      lowStockItems,
    ] = await Promise.all([
      db.flower.count(),
      db.flower.count({ where: { active: true } }),
      db.order.count(),
      db.order.count({ where: { status: 'new' } }),
      db.order.count({ where: { status: 'processing' } }),
      db.order.aggregate({
        where: { status: { in: ['new', 'processing', 'completed'] } },
        _sum: { totalAmount: true },
      }),
      db.flower.count({ where: { stock: { lte: 5 }, active: true } }),
      db.order.findMany({
        where: { status: { in: ['new', 'processing'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true },
      }),
      db.flower.findMany({
        where: { stock: { lte: 5 }, active: true },
        orderBy: { stock: 'asc' },
        take: 8,
        select: { id: true, name: true, stock: true, category: true },
      }),
    ])

    return NextResponse.json({
      totalFlowers,
      activeFlowers,
      totalOrders,
      pendingOrders,
      processingOrders,
      totalRevenue: revenueResult._sum.totalAmount ?? 0,
      lowStockCount,
      recentOrders,
      lowStockItems,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
