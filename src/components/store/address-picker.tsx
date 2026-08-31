'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { ShopMap } from '@/components/map/shop-map'
import { DEFAULT_ZONE, isInsideZone, zoneRestricts, type DeliveryZone, type GeoSuggestion, type LatLng } from '@/lib/geo'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  address: string
  disabled?: boolean
  onAddressChange: (value: string) => void
  onPointChange: (point: LatLng | null) => void
  onErrorClear?: () => void
}

export function AddressPicker({
  open,
  address,
  disabled,
  onAddressChange,
  onPointChange,
  onErrorClear,
}: Props) {
  const [zone, setZone] = useState<DeliveryZone>(DEFAULT_ZONE)
  const [marker, setMarker] = useState<LatLng | null>(null)
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([])
  const [openList, setOpenList] = useState(false)
  const [outside, setOutside] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const load = async () => {
      try {
        const res = await fetch('/api/delivery-zone')
        if (!res.ok) return
        setZone(await res.json())
      } catch {
        setZone(DEFAULT_ZONE)
      }
    }
    void load()
  }, [open])

  useEffect(() => {
    if (!open) return
    const q = address.trim()
    if (q.length < 3) {
      setSuggestions([])
      return
    }
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/geo?q=${encodeURIComponent(q)}`)
          if (!res.ok) return
          const data = (await res.json()) as { items?: GeoSuggestion[] }
          setSuggestions(data.items ?? [])
          setOpenList(true)
        } catch {
          setSuggestions([])
        }
      })()
    }, 280)
    return () => window.clearTimeout(timer)
  }, [address, open])

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpenList(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const applyPoint = async (point: LatLng, label?: string) => {
    setMarker(point)
    onPointChange(point)
    setOutside(zoneRestricts(zone) && !isInsideZone(point, zone))
    setOpenList(false)
    onErrorClear?.()
    if (label) {
      onAddressChange(label)
      return
    }
    try {
      const res = await fetch(`/api/geo?lat=${point.lat}&lng=${point.lng}`)
      if (!res.ok) return
      const data = (await res.json()) as { label?: string | null }
      if (data.label) onAddressChange(data.label)
    } catch {
      // keep typed address
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div ref={boxRef} className="relative">
        <Input
          id="checkout-address"
          placeholder="Улица, дом — или точка на карте"
          value={address}
          autoComplete="off"
          disabled={disabled}
          onChange={(e) => {
            onAddressChange(e.target.value)
            onPointChange(null)
            setOutside(false)
            onErrorClear?.()
          }}
          onFocus={() => suggestions.length > 0 && setOpenList(true)}
        />
        {openList && suggestions.length > 0 ? (
          <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-auto border border-border bg-card shadow-md">
            {suggestions.map((item) => (
              <li key={`${item.label}-${item.lat}`}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                  onClick={() => void applyPoint({ lat: item.lat, lng: item.lng }, item.label)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <ShopMap
        zone={zone}
        marker={marker}
        height={240}
        active={open}
        showZone={zone.enabled}
        trackLocation
        onMapClick={(point) => void applyPoint(point)}
        onMarkerDrag={(point) => void applyPoint(point)}
        onMyLocation={(point) => void applyPoint(point)}
      />
      <p className={cn('text-xs', outside ? 'text-destructive' : 'text-muted-foreground')}>
        {outside
          ? 'Адрес вне зоны доставки. Выберите другую точку.'
          : 'Подсказка из списка, клик по карте или кнопка «Моё место» — так видно, где вы сейчас.'}
      </p>
    </div>
  )
}
