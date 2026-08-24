import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { resolveImageUrl } from '@/lib/image-url'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const body = await req.json()
    const imageUrl =
      body.imageUrl === undefined ? undefined : await resolveImageUrl(body.imageUrl)

    const flower = await db.flower.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.costPrice !== undefined && {
          costPrice:
            body.costPrice === '' || body.costPrice == null ? null : Number(body.costPrice),
        }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.active !== undefined && { active: Boolean(body.active) }),
      },
    })

    return NextResponse.json(flower)
  } catch (error) {
    console.error('Update flower error:', error)
    return NextResponse.json({ error: 'Failed to update flower' }, { status: 500 })
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
    const flower = await db.flower.findUnique({ where: { id } })
    if (!flower) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 })
    }
    if (flower.stock > 0) {
      return NextResponse.json(
        { error: `Нельзя удалить товар с остатком ${flower.stock} шт. Сначала продайте или спишите.` },
        { status: 409 }
      )
    }

    await db.flower.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Delete flower error:', error)
    return NextResponse.json({ error: 'Failed to delete flower' }, { status: 500 })
  }
}
