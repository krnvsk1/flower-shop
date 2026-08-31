export type LatLng = { lat: number; lng: number }

export type DeliveryZone = {
  enabled: boolean
  center: LatLng
  radiusKm: number
  polygon: LatLng[]
}

export const DEFAULT_CENTER: LatLng = { lat: 55.7558, lng: 37.6173 }

export const DEFAULT_ZONE: DeliveryZone = {
  enabled: false,
  center: DEFAULT_CENTER,
  radiusKm: 8,
  polygon: [],
}

export type GeoSuggestion = {
  label: string
  lat: number
  lng: number
}

function num(value: unknown, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function normalizeLatLng(raw: unknown): LatLng | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const lat = Number(row.lat)
  const lng = Number(row.lng ?? row.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}

export function normalizeDeliveryZone(raw: unknown): DeliveryZone {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const center = normalizeLatLng(row.center) ?? DEFAULT_CENTER
  const radius = Math.round(num(row.radiusKm, DEFAULT_ZONE.radiusKm) * 10) / 10
  const polygon = Array.isArray(row.polygon)
    ? row.polygon.map((item) => normalizeLatLng(item)).filter((item): item is LatLng => Boolean(item))
    : []
  return {
    enabled: Boolean(row.enabled),
    center,
    radiusKm: Math.min(80, Math.max(0.5, radius)),
    polygon,
  }
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

export function pointInPolygon(point: LatLng, ring: LatLng[]): boolean {
  if (ring.length < 3) return false
  const x = point.lng
  const y = point.lat
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].lng
    const yi = ring[i].lat
    const xj = ring[j].lng
    const yj = ring[j].lat
    const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (hit) inside = !inside
  }
  return inside
}

export function zoneRestricts(zone: DeliveryZone): boolean {
  return zone.enabled && (zone.polygon.length >= 3 || zone.radiusKm > 0)
}

export function isInsideZone(point: LatLng, zone: DeliveryZone): boolean {
  if (!zoneRestricts(zone)) return true
  if (zone.polygon.length >= 3) return pointInPolygon(point, zone.polygon)
  return haversineKm(point, zone.center) <= zone.radiusKm
}
