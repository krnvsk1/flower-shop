'use client'

import dynamic from 'next/dynamic'
import type { DeliveryZone, LatLng } from '@/lib/geo'

const Inner = dynamic(() => import('@/components/map/leaflet-map').then((mod) => mod.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] border border-border bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
      Загрузка карты…
    </div>
  ),
})

export function ShopMap(props: {
  zone: DeliveryZone
  marker?: LatLng | null
  height?: number
  active?: boolean
  showZone?: boolean
  trackLocation?: boolean
  onMapClick?: (point: LatLng) => void
  onMarkerDrag?: (point: LatLng) => void
  onMyLocation?: (point: LatLng) => void
}) {
  return <Inner {...props} />
}
