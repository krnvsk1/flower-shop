import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const flower = await db.flower.update({
      where: { id },
      data: body,
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
