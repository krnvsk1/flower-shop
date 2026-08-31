import { getDeliveryZone } from '@/lib/delivery-zone-store'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json(await getDeliveryZone())
  } catch (error) {
    console.error('Public delivery zone error:', error)
    return NextResponse.json({ enabled: false, center: { lat: 55.7558, lng: 37.6173 }, radiusKm: 8, polygon: [] })
  }
}
