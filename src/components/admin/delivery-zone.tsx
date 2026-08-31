'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ShopMap } from '@/components/map/shop-map'
import { DEFAULT_ZONE, type DeliveryZone, type LatLng } from '@/lib/geo'
import { cn } from '@/lib/utils'

type Mode = 'shop' | 'polygon'

export function DeliveryZoneManager() {
  const [zone, setZone] = useState<DeliveryZone>(DEFAULT_ZONE)
  const [mode, setMode] = useState<Mode>('shop')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/delivery-zone')
        if (!res.ok) throw new Error()
        setZone(await res.json())
      } catch {
        toast.error('Не удалось загрузить зону доставки')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const onMapClick = (point: LatLng) => {
    if (mode === 'shop') {
      setZone((prev) => ({ ...prev, center: point }))
      return
    }
    setZone((prev) => ({ ...prev, polygon: [...prev.polygon, point] }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/delivery-zone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zone),
      })
      if (!res.ok) throw new Error()
      setZone(await res.json())
      toast.success('Зона доставки сохранена')
    } catch {
      toast.error('Не удалось сохранить зону')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка карты…</p>
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="admin-surface no-lift p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Ограничить доставку зоной</p>
            <p className="text-sm text-muted-foreground">
              Заказ с витрины пройдёт только если адрес внутри круга или многоугольника.
            </p>
          </div>
          <Switch
            checked={zone.enabled}
            onCheckedChange={(checked) => setZone((prev) => ({ ...prev, enabled: checked }))}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Радиус круга, км</Label>
            <Input
              type="number"
              min={0.5}
              max={80}
              step={0.5}
              value={zone.radiusKm}
              onChange={(e) =>
                setZone((prev) => ({ ...prev, radiusKm: Number(e.target.value) || prev.radiusKm }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Круг строится от точки магазина. Если нарисован многоугольник (от 3 точек), он важнее круга.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Режим клика по карте</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'shop' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setMode('shop')}
              >
                Точка магазина
              </Button>
              <Button
                type="button"
                variant={mode === 'polygon' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setMode('polygon')}
              >
                Вершины зоны
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-surface no-lift p-3 space-y-3">
        <p className="text-sm text-muted-foreground px-1">
          {mode === 'shop'
            ? 'Кликните по карте, чтобы поставить магазин. Круг обновится вокруг этой точки.'
            : 'Кликайте по карте, чтобы добавить вершины многоугольника.'}
        </p>
        <ShopMap
          zone={zone}
          marker={zone.center}
          height={420}
          trackLocation
          onMapClick={onMapClick}
        />
        <div className="flex flex-wrap items-center gap-2 px-1">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={zone.polygon.length === 0}
            onClick={() => setZone((prev) => ({ ...prev, polygon: prev.polygon.slice(0, -1) }))}
          >
            Убрать последнюю точку
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={zone.polygon.length === 0}
            onClick={() => setZone((prev) => ({ ...prev, polygon: [] }))}
          >
            Очистить многоугольник
          </Button>
          <span
            className={cn(
              'text-sm text-muted-foreground ml-auto',
              zone.polygon.length >= 3 && 'text-foreground'
            )}
          >
            Вершин: {zone.polygon.length}
          </span>
        </div>
      </div>

      <Button className="cursor-pointer" disabled={saving} onClick={() => void save()}>
        {saving ? 'Сохранение…' : 'Сохранить зону'}
      </Button>
    </div>
  )
}
