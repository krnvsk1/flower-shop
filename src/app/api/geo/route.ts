import { getDeliveryZone } from '@/lib/delivery-zone-store'
import { reverseAddress, suggestAddresses } from '@/lib/geo-search'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const latRaw = searchParams.get('lat')
    const lngRaw = searchParams.get('lng')
    if (latRaw !== null && lngRaw !== null) {
      const reverseLat = Number(latRaw)
      const reverseLng = Number(lngRaw)
      if (Number.isFinite(reverseLat) && Number.isFinite(reverseLng)) {
        const label = await reverseAddress({ lat: reverseLat, lng: reverseLng })
        return NextResponse.json({ label })
      }
    }

    const q = searchParams.get('q') || ''
    const zone = await getDeliveryZone()
    const items = await suggestAddresses(q, zone.center)
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Geo suggest error:', error)
    return NextResponse.json({ items: [], label: null })
  }
}
