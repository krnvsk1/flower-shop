import { requireAdmin } from '@/lib/admin-auth'
import { createPromo, getPromos } from '@/lib/promo-store'
import { NextRequest, NextResponse } from 'next/server'

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === 'TITLE_REQUIRED') {
    return NextResponse.json({ error: 'Укажите название акции' }, { status: 400 })
  }
  if (error instanceof Error && error.message === 'FLOWERS_REQUIRED') {
    return NextResponse.json({ error: 'Выберите товары для акции' }, { status: 400 })
  }
  if (error instanceof Error && error.message === 'OVERLAP') {
    return NextResponse.json(
      { error: 'Один товар не может быть в двух акциях сразу' },
      { status: 400 }
    )
  }
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    return NextResponse.json({ error: 'Акция не найдена' }, { status: 404 })
  }
  console.error('Promo error:', error)
  return NextResponse.json({ error: 'Failed to save promo' }, { status: 500 })
}

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    return NextResponse.json({ promos: await getPromos() })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = await req.json()
    const saved = await createPromo(body)
    return NextResponse.json(saved, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
