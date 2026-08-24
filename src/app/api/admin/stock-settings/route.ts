import { requireAdmin } from '@/lib/admin-auth'
import { getStockSettings, saveStockSettings } from '@/lib/stock-settings-store'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    return NextResponse.json(await getStockSettings())
  } catch (error) {
    console.error('Stock settings error:', error)
    return NextResponse.json({ error: 'Failed to load stock settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = await req.json()
    const settings = await saveStockSettings({
      targetStock: Number(body.targetStock),
      lowStockPercent: Number(body.lowStockPercent),
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Save stock settings error:', error)
    return NextResponse.json({ error: 'Failed to save stock settings' }, { status: 500 })
  }
}
