import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { parseInboundFile } from '@/lib/inbound-parse'
import { matchInboundRows } from '@/lib/inbound-match'
import { NextRequest, NextResponse } from 'next/server'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = /\.(csv|txt|xlsx|xls|ods)$/i

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Загрузите файл накладной' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Файл больше 2 МБ' }, { status: 400 })
    }
    if (!ALLOWED.test(file.name)) {
      return NextResponse.json(
        { error: 'Нужен CSV или Excel (.csv, .xlsx, .xls)' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const rows = await parseInboundFile(buffer, file.name)
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'В файле не нашлись строки с названием и количеством' },
        { status: 400 }
      )
    }

    const flowers = await db.flower.findMany({
      select: { id: true, name: true, stock: true, costPrice: true },
      orderBy: { name: 'asc' },
    })

    const matched = matchInboundRows(rows, flowers).map((row) => {
      if (row.costPrice != null) return row
      const flower = flowers.find((item) => item.id === row.flowerId)
      return { ...row, costPrice: flower?.costPrice ?? null }
    })

    return NextResponse.json({
      fileName: file.name,
      rows: matched,
      flowers,
    })
  } catch (error) {
    console.error('Inbound preview error:', error)
    return NextResponse.json({ error: 'Не удалось разобрать файл' }, { status: 500 })
  }
}
