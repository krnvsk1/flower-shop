'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { StockSettings } from '@/lib/stock-settings'
import { computeStockSettings, DEFAULT_LOW_STOCK_PERCENT, DEFAULT_TARGET_STOCK } from '@/lib/stock-settings'

type Props = {
  value?: StockSettings | null
  onSaved?: (settings: StockSettings) => void
  compact?: boolean
}

export function LowStockSettings({ value, onSaved, compact = false }: Props) {
  const [settings, setSettings] = useState<StockSettings>(
    value ?? computeStockSettings(DEFAULT_TARGET_STOCK, DEFAULT_LOW_STOCK_PERCENT)
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (value) setSettings(value)
  }, [value])

  const persist = async (next: StockSettings) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/stock-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetStock: next.targetStock,
          lowStockPercent: next.lowStockPercent,
        }),
      })
      if (!res.ok) throw new Error()
      const saved = (await res.json()) as StockSettings
      setSettings(saved)
      onSaved?.(saved)
    } catch {
      toast.error('Не удалось сохранить порог остатка')
    } finally {
      setSaving(false)
    }
  }

  const preview = computeStockSettings(settings.targetStock, settings.lowStockPercent)

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4 admin-surface p-4'}>
      {!compact && (
        <div>
          <h3 className="font-semibold">Мало на складе</h3>
          <p className="text-sm text-muted-foreground">
            Товар попадает в список, если остаток не выше выбранного процента от нормы.
          </p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="low-stock-percent">Порог</Label>
            <span className="font-mono text-sm">{preview.lowStockPercent}%</span>
          </div>
          <Slider
            id="low-stock-percent"
            min={1}
            max={100}
            step={1}
            value={[preview.lowStockPercent]}
            disabled={saving}
            onValueChange={([percent]) =>
              setSettings(computeStockSettings(preview.targetStock, percent ?? preview.lowStockPercent))
            }
            onValueCommit={([percent]) =>
              void persist(computeStockSettings(preview.targetStock, percent ?? preview.lowStockPercent))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="target-stock">Норма, шт.</Label>
          <Input
            id="target-stock"
            type="number"
            min={1}
            className="font-mono"
            value={preview.targetStock}
            disabled={saving}
            onChange={(e) =>
              setSettings(computeStockSettings(Number(e.target.value), preview.lowStockPercent))
            }
            onBlur={() => void persist(preview)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Сейчас «мало» — остаток ≤ <span className="font-mono text-foreground">{preview.threshold}</span> шт.
        ({preview.lowStockPercent}% от {preview.targetStock}). В закупке предлагается добрать до нормы.
      </p>
    </div>
  )
}
