import { requireAdmin } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

const TEMPLATE = `\uFEFFНазвание;Количество;Закупочная цена
Роза красная;20;80
Тюльпан жёлтый;15;45
`

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  return new NextResponse(TEMPLATE, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="prihod-shablon.csv"',
    },
  })
}
