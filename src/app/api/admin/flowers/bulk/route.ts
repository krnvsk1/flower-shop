import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { ids, active } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0 || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'ids and active are required' }, { status: 400 })
    }

    await db.flower.updateMany({
      where: { id: { in: ids } },
      data: { active },
    })

    return NextResponse.json({ ok: true, count: ids.length })
  } catch (error) {
    console.error('Bulk update flowers error:', error)
    return NextResponse.json({ error: 'Failed to update flowers' }, { status: 500 })
  }
}
