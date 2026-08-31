import { requireAdmin } from '@/lib/admin-auth'
import { getBonusSettings, saveBonusSettings } from '@/lib/bonus-store'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    return NextResponse.json(await getBonusSettings())
  } catch (error) {
    console.error('Bonus settings error:', error)
    return NextResponse.json({ error: 'Failed to load bonus settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = await req.json()
    return NextResponse.json(await saveBonusSettings(body))
  } catch (error) {
    console.error('Bonus settings save error:', error)
    return NextResponse.json({ error: 'Failed to save bonus settings' }, { status: 500 })
  }
}
