'use client'

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Circle, MapContainer, Marker, Polygon, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { LocateFixed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DeliveryZone, LatLng } from '@/lib/geo'
import 'leaflet/dist/leaflet.css'

const ZONE_COLOR = '#9a4a3c'

type Props = {
  zone: DeliveryZone
  marker?: LatLng | null
  height?: number
  active?: boolean
  showZone?: boolean
  trackLocation?: boolean
  onMapClick?: (point: LatLng) => void
  onMarkerDrag?: (point: LatLng) => void
  onMyLocation?: (point: LatLng) => void
}

function readBrowserLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('NO_GEO'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('DENIED')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30_000 }
    )
  })
}

function pinIcon(kind: 'addr' | 'me') {
  return L.divIcon({
    className: 'shop-map-pin',
    html: `<span class="shop-map-pin-dot shop-map-pin-dot--${kind}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function MapEvents({ onClick }: { onClick?: (point: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onClick?.({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })
  return null
}

function MapReady({ mapRef }: { mapRef: MutableRefObject<L.Map | null> }) {
  const map = useMap()
  useEffect(() => {
    mapRef.current = map
    const timer = window.setTimeout(() => map.invalidateSize(), 120)
    return () => window.clearTimeout(timer)
  }, [map, mapRef])
  return null
}

function FollowPoint({ point, zoom }: { point?: LatLng | null; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    if (!point) return
    map.setView([point.lat, point.lng], zoom ?? map.getZoom())
  }, [map, point?.lat, point?.lng, zoom])
  return null
}

export function LeafletMap({
  zone,
  marker,
  height = 280,
  active = true,
  showZone = true,
  trackLocation = false,
  onMapClick,
  onMarkerDrag,
  onMyLocation,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const clickRef = useRef(onMapClick)
  const dragRef = useRef(onMarkerDrag)
  const [myPoint, setMyPoint] = useState<LatLng | null>(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const addrIcon = useMemo(() => pinIcon('addr'), [])
  const meIcon = useMemo(() => pinIcon('me'), [])
  const start = marker ?? zone.center

  clickRef.current = onMapClick
  dragRef.current = onMarkerDrag

  useEffect(() => {
    if (!active || !trackLocation) return
    let cancelled = false
    void readBrowserLocation()
      .then((point) => {
        if (!cancelled) setMyPoint(point)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [active, trackLocation])

  const locate = async () => {
    setLocating(true)
    try {
      const point = await readBrowserLocation()
      setMyPoint(point)
      mapRef.current?.setView([point.lat, point.lng], 15)
      onMyLocation?.(point)
    } catch {
      setError('Разрешите доступ к геолокации в браузере')
    } finally {
      setLocating(false)
    }
  }

  if (!active) {
    return <div className="border border-border bg-muted/40" style={{ height }} />
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden border border-border" style={{ height }}>
        <MapContainer
          center={[start.lat, start.lng]}
          zoom={12}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapReady mapRef={mapRef} />
          <MapEvents onClick={(point) => clickRef.current?.(point)} />
          <FollowPoint point={marker ?? (!marker ? myPoint : null)} />
          {showZone && zone.polygon.length >= 3 ? (
            <Polygon
              positions={zone.polygon.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{ color: ZONE_COLOR, weight: 2, fillColor: ZONE_COLOR, fillOpacity: 0.12 }}
            />
          ) : null}
          {showZone && zone.polygon.length < 3 && zone.radiusKm > 0 ? (
            <Circle
              center={[zone.center.lat, zone.center.lng]}
              radius={zone.radiusKm * 1000}
              pathOptions={{ color: ZONE_COLOR, weight: 2, fillColor: ZONE_COLOR, fillOpacity: 0.12 }}
            />
          ) : null}
          {marker ? (
            <Marker
              position={[marker.lat, marker.lng]}
              icon={addrIcon}
              draggable={Boolean(onMarkerDrag)}
              eventHandlers={{
                dragend: (event) => {
                  const latlng = event.target.getLatLng()
                  dragRef.current?.({ lat: latlng.lat, lng: latlng.lng })
                },
              }}
            />
          ) : null}
          {myPoint ? <Marker position={[myPoint.lat, myPoint.lng]} icon={meIcon} /> : null}
        </MapContainer>
        {error ? (
          <p className="absolute bottom-2 left-2 right-2 text-xs bg-background/90 border border-border px-2 py-1">
            {error}
          </p>
        ) : null}
      </div>
      {trackLocation ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={locating}
          onClick={() => void locate()}
        >
          <LocateFixed className="w-4 h-4" />
          {locating ? 'Определяем…' : 'Моё место'}
        </Button>
      ) : null}
    </div>
  )
}
