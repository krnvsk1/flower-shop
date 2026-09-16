import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { parseInboundFile } from '@/lib/inbound-parse'
import { matchInboundRows } from '@/lib/inbound-match'
import { isInboundImage, recognizeInboundImage } from '@/lib/inbound-ocr'
import { NextRequest, NextResponse } from 'next/server'

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = /\.(csv|txt|xlsx|xls|ods|jpe?g|png|webp|gif|bmp|heic|heif)$/i

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Загрузите файл или фото накладной' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Файл больше 8 МБ' }, { status: 400 })
    }
    if (!ALLOWED.test(file.name)) {
      return NextResponse.json(
        { error: 'Нужен CSV, Excel или фото (.jpg, .png, .webp)' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let rows
    let source: 'file' | 'vision' | 'ocr' = 'file'

    if (isInboundImage(file.name) || (file.type || '').startsWith('image/')) {
      const recognized = await recognizeInboundImage(
        buffer,
        file.name,
        file.type || 'image/jpeg'
      )
      rows = recognized.rows
      source = recognized.source
    } else {
      rows = await parseInboundFile(buffer, file.name)
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            source === 'file'
              ? 'В файле не нашлись строки с названием и количеством'
              : 'На фото не нашлись позиции с названием и количеством',
        },
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
      source,
      rows: matched,
      flowers,
    })
  } catch (error) {
    console.error('Inbound preview error:', error)
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Не удалось разобрать файл'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
