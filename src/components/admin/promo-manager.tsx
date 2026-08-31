'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { emptyPromo, occupiedFlowerIds, type PromoConfig } from '@/lib/promo'
import { BonusSettingsCard } from '@/components/admin/bonus-settings'

type FlowerOption = {
  id: string
  name: string
  price: number
  active: boolean
}

export function PromoManager() {
  const [promos, setPromos] = useState<PromoConfig[]>([])
  const [flowers, setFlowers] = useState<FlowerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editor, setEditor] = useState<PromoConfig | null>(null)

  const load = async () => {
    try {
      const [promoRes, flowersRes] = await Promise.all([
        fetch('/api/admin/promo'),
        fetch('/api/admin/flowers'),
      ])
      if (promoRes.ok) {
        const data = await promoRes.json()
        setPromos(Array.isArray(data.promos) ? data.promos : [])
      }
      if (flowersRes.ok) {
        const data = await flowersRes.json()
        setFlowers(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error('Не удалось загрузить акции')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const takenIds = useMemo(
    () => occupiedFlowerIds(promos, editor?.id || undefined),
    [promos, editor?.id]
  )

  const previewPrice = useMemo(() => {
    if (!editor) return 0
    return Math.max(1, Math.round((1000 * (100 - editor.discountPercent)) / 100))
  }, [editor])

  const flowerNames = (ids: string[]) => {
    const names = ids
      .map((id) => flowers.find((flower) => flower.id === id)?.name)
      .filter(Boolean)
    if (names.length === 0) return 'Нет товаров'
    if (names.length <= 3) return names.join(', ')
    return `${names.slice(0, 3).join(', ')} и ещё ${names.length - 3}`
  }

  const toggleFlower = (id: string, checked: boolean) => {
    setEditor((prev) => {
      if (!prev) return prev
      const next = new Set(prev.flowerIds)
      if (checked) next.add(id)
      else next.delete(id)
      return { ...prev, flowerIds: [...next] }
    })
  }

  const save = async () => {
    if (!editor) return
    setSaving(true)
    try {
      const isNew = !editor.id
      const res = await fetch(isNew ? '/api/admin/promo' : `/api/admin/promo/${editor.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editor),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Не удалось сохранить')
        return
      }
      toast.success(isNew ? 'Акция добавлена' : 'Акция сохранена')
      setEditor(null)
      await load()
    } catch {
      toast.error('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (promo: PromoConfig) => {
    if (!confirm(`Удалить акцию «${promo.title}»?`)) return
    try {
      const res = await fetch(`/api/admin/promo/${promo.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Не удалось удалить')
        return
      }
      toast.success('Акция удалена')
      await load()
    } catch {
      toast.error('Сетевая ошибка')
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 max-w-3xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <BonusSettingsCard />
      <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Несколько акций сразу. Один цветок может быть только в одной.
        </p>
        <Button className="cursor-pointer" onClick={() => setEditor(emptyPromo())}>
          <Plus className="w-4 h-4 mr-1" />
          Добавить акцию
        </Button>
      </div>

      {promos.length === 0 ? (
        <div className="admin-surface p-8 text-center text-muted-foreground">
          Пока нет акций. Нажмите «Добавить акцию».
        </div>
      ) : (
        <div className="admin-surface overflow-hidden divide-y">
          {promos.map((promo) => (
            <div key={promo.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{promo.title || 'Без названия'}</h3>
                  <Badge variant={promo.active ? 'default' : 'secondary'}>
                    {promo.active ? 'На сайте' : 'Скрыта'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">−{promo.discountPercent}%</span>
                </div>
                <p className="text-sm text-muted-foreground">{flowerNames(promo.flowerIds)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => setEditor({ ...promo })}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Изменить
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => void remove(promo)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Удалить
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={Boolean(editor)} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editor?.id ? 'Изменить акцию' : 'Новая акция'}</DialogTitle>
            <DialogDescription>
              Выберите цветы, которых ещё нет в других акциях.
            </DialogDescription>
          </DialogHeader>
          {editor ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="promo-active">Показывать на сайте</Label>
                <Switch
                  id="promo-active"
                  checked={editor.active}
                  onCheckedChange={(checked) => setEditor((p) => (p ? { ...p, active: checked } : p))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-title">Название</Label>
                <Input
                  id="promo-title"
                  placeholder="Весенняя акция"
                  value={editor.title}
                  onChange={(e) => setEditor((p) => (p ? { ...p, title: e.target.value } : p))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-subtitle">Короткий текст</Label>
                <Textarea
                  id="promo-subtitle"
                  placeholder="Скидка на свежий срез."
                  value={editor.subtitle}
                  onChange={(e) => setEditor((p) => (p ? { ...p, subtitle: e.target.value } : p))}
                  rows={2}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="promo-badge">Плашка</Label>
                  <Input
                    id="promo-badge"
                    value={editor.badge}
                    onChange={(e) => setEditor((p) => (p ? { ...p, badge: e.target.value } : p))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-percent">Скидка, %</Label>
                  <Input
                    id="promo-percent"
                    type="number"
                    min={1}
                    max={70}
                    value={editor.discountPercent}
                    onChange={(e) =>
                      setEditor((p) =>
                        p ? { ...p, discountPercent: Number(e.target.value) } : p
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    1 000 ₽ → {previewPrice.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Товары</Label>
                <div className="admin-surface max-h-64 overflow-y-auto divide-y">
                  {flowers.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3">Нет товаров</p>
                  ) : (
                    flowers.map((flower) => {
                      const taken = takenIds.has(flower.id)
                      return (
                        <label
                          key={flower.id}
                          className={`flex items-center gap-3 px-3 py-2 ${
                            taken ? 'opacity-50' : 'cursor-pointer hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={editor.flowerIds.includes(flower.id)}
                            disabled={taken}
                            onCheckedChange={(checked) =>
                              toggleFlower(flower.id, checked === true)
                            }
                          />
                          <span className="flex-1 text-sm">
                            {flower.name}
                            {taken ? (
                              <span className="text-muted-foreground"> · уже в другой акции</span>
                            ) : null}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {flower.price.toLocaleString('ru-RU')} ₽
                          </span>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setEditor(null)}>
              Отмена
            </Button>
            <Button className="cursor-pointer" disabled={saving} onClick={() => void save()}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
