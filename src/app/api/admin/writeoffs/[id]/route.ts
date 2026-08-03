import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const writeoff = await db.writeOff.findUnique({ where: { id } })
    if (!writeoff) {
      return NextResponse.json({ error: 'Write-off not found' }, { status: 404 })
    }

    // Restore stock
    await db.flower.update({
      where: { id: writeoff.flowerId },
      data: { stock: { increment: writeoff.quantity } },
    })

    await db.writeOff.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete writeoff error:', error)
    return NextResponse.json({ error: 'Failed to revert writeoff' }, { status: 500 })
  }
}
