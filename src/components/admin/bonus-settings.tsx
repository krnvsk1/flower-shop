'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DEFAULT_BONUS, earnBonuses, type BonusSettings } from '@/lib/bonus'

export function BonusSettingsCard() {
  const [settings, setSettings] = useState<BonusSettings>(DEFAULT_BONUS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/bonus')
        if (res.ok) setSettings(await res.json())
      } catch {
        toast.error('Не удалось загрузить бонусы')
      }
    }
    void load()
  }, [])

  const persist = async (next: BonusSettings) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/bonus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (!res.ok) throw new Error()
      setSettings(await res.json())
      toast.success('Бонусы сохранены')
    } catch {
      toast.error('Не удалось сохранить бонусы')
    } finally {
      setSaving(false)
    }
  }

  const preview = earnBonuses(1000, settings.enabled ? settings.percent : 0)

  return (
    <div className="admin-surface p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Бонусы</h3>
          <p className="text-sm text-muted-foreground">
            Клиенту по номеру телефона начисляется процент от оплаченной суммы. 1 бонус = 1 ₽.
          </p>
        </div>
        <Switch
          checked={settings.enabled}
          disabled={saving}
          onCheckedChange={(enabled) => {
            const next = { ...settings, enabled }
            setSettings(next)
            void persist(next)
          }}
        />
      </div>
      <div className="max-w-[160px] space-y-2">
        <Label htmlFor="bonus-percent">Процент</Label>
        <Input
          id="bonus-percent"
          type="number"
          min={0}
          max={50}
          className="font-mono"
          value={settings.percent}
          disabled={saving || !settings.enabled}
          onChange={(e) => setSettings((p) => ({ ...p, percent: Number(e.target.value) }))}
          onBlur={() => void persist(settings)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {settings.enabled
          ? `С заказа на 1 000 ₽ начислится ${preview.toLocaleString('ru-RU')} ₽ бонусами. Их можно списать в следующем заказе.`
          : 'Бонусы выключены — на витрине не показываются и не начисляются.'}
      </p>
    </div>
  )
}
