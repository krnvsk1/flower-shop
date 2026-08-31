import { requireAdmin } from '@/lib/admin-auth'
import { getDeliveryZone, saveDeliveryZone } from '@/lib/delivery-zone-store'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    return NextResponse.json(await getDeliveryZone())
  } catch (error) {
    console.error('Delivery zone load error:', error)
    return NextResponse.json({ error: 'Failed to load delivery zone' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const body = await req.json()
    return NextResponse.json(await saveDeliveryZone(body))
  } catch (error) {
    console.error('Delivery zone save error:', error)
    return NextResponse.json({ error: 'Failed to save delivery zone' }, { status: 500 })
  }
}
