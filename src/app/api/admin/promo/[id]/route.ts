import { requireAdmin } from '@/lib/admin-auth'
import { deletePromo, updatePromo } from '@/lib/promo-store'
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const body = await req.json()
    return NextResponse.json(await updatePromo(id, body))
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    await deletePromo(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
