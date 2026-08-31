import type { GeoSuggestion, LatLng } from '@/lib/geo'

const UA = 'AtelierFlowerShop/1.0 (delivery-address)'

type NominatimHit = {
  lat?: string
  lon?: string
  display_name?: string
}

export async function suggestAddresses(query: string, near?: LatLng | null): Promise<GeoSuggestion[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '7')
  url.searchParams.set('accept-language', 'ru')
  if (near) {
    url.searchParams.set('lat', String(near.lat))
    url.searchParams.set('lon', String(near.lng))
  }
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ru' } })
  if (!res.ok) return []
  const data = (await res.json()) as NominatimHit[]
  const seen = new Set<string>()
  const items: GeoSuggestion[] = []
  for (const hit of data) {
    const lat = Number(hit.lat)
    const lng = Number(hit.lon)
    const label = hit.display_name?.trim()
    if (!label || !Number.isFinite(lat) || !Number.isFinite(lng) || seen.has(label)) continue
    seen.add(label)
    items.push({ label, lat, lng })
  }
  return items
}

export async function reverseAddress(point: LatLng): Promise<string | null> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('lat', String(point.lat))
  url.searchParams.set('lon', String(point.lng))
  url.searchParams.set('format', 'json')
  url.searchParams.set('accept-language', 'ru')
  url.searchParams.set('zoom', '18')
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ru' } })
  if (!res.ok) return null
  const data = (await res.json()) as NominatimHit
  return data.display_name?.trim() || null
}
