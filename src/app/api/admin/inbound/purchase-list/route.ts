import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { getStockSettings } from '@/lib/stock-settings-store'
import { NextRequest, NextResponse } from 'next/server'

function toCsv(rows: { name: string; category: string | null; stock: number; suggestedQty: number; costPrice: number | null }[]) {
  const header = 'Название;Категория;Остаток;Заказать;Закупочная цена'
  const body = rows.map((row) =>
    [row.name, row.category || '', String(row.stock), String(row.suggestedQty), row.costPrice == null ? '' : String(row.costPrice)]
      .map((cell) => `"${cell.replace(/"/g, '""')}"`)
      .join(';')
  )
  return [header, ...body].join('\n')
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const settings = await getStockSettings()
    const flowers = await db.flower.findMany({
      where: { active: true, stock: { lte: settings.threshold } },
      orderBy: { stock: 'asc' },
      select: { id: true, name: true, category: true, stock: true, costPrice: true },
    })

    const items = flowers.map((flower) => ({
      ...flower,
      suggestedQty: Math.max(settings.targetStock - flower.stock, 1),
    }))

    if (req.nextUrl.searchParams.get('format') === 'csv') {
      return new NextResponse('\uFEFF' + toCsv(items), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="zakupka.csv"',
        },
      })
    }

    return NextResponse.json({
      targetStock: settings.targetStock,
      lowStockPercent: settings.lowStockPercent,
      lowStock: settings.threshold,
      items,
    })
  } catch (error) {
    console.error('Purchase list error:', error)
    return NextResponse.json({ error: 'Failed to build purchase list' }, { status: 500 })
  }
}
