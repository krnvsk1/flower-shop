import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

const LOW_STOCK = 5
const TARGET_STOCK = 15

function toCsv(rows: { name: string; category: string | null; stock: number; suggestedQty: number }[]) {
  const header = 'Название;Категория;Остаток;Заказать'
  const body = rows.map((row) =>
    [row.name, row.category || '', String(row.stock), String(row.suggestedQty)]
      .map((cell) => `"${cell.replace(/"/g, '""')}"`)
      .join(';')
  )
  return [header, ...body].join('\n')
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const flowers = await db.flower.findMany({
      where: { active: true, stock: { lte: LOW_STOCK } },
      orderBy: { stock: 'asc' },
      select: { id: true, name: true, category: true, stock: true },
    })

    const items = flowers.map((flower) => ({
      ...flower,
      suggestedQty: Math.max(TARGET_STOCK - flower.stock, 1),
    }))

    if (req.nextUrl.searchParams.get('format') === 'csv') {
      return new NextResponse('\uFEFF' + toCsv(items), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="zakupka.csv"',
        },
      })
    }

    return NextResponse.json({ targetStock: TARGET_STOCK, lowStock: LOW_STOCK, items })
  } catch (error) {
    console.error('Purchase list error:', error)
    return NextResponse.json({ error: 'Failed to build purchase list' }, { status: 500 })
  }
}
