import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
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

    const flower = await db.flower.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.stock !== undefined && { stock: Number(body.stock) }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
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

    const flower = await db.flower.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json(flower)
  } catch (error) {
    console.error('Delete flower error:', error)
    return NextResponse.json({ error: 'Failed to delete flower' }, { status: 500 })
  }
}
