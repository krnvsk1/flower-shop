'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/payment'
import { saleUnitPrice, type PromoConfig } from '@/lib/promo'
import { earnBonuses, maxSpend, normalizePhone } from '@/lib/bonus'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

type Flower = {
  id: string
  name: string
  price: number
  stock: number
  category: string | null
  active: boolean
}

type CartLine = { flower: Flower; quantity: number }

export function PosSale({ onSold }: { onSold?: () => void }) {
  const [flowers, setFlowers] = useState<Flower[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [comment, setComment] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [promos, setPromos] = useState<PromoConfig[]>([])
  const [bonusEnabled, setBonusEnabled] = useState(false)
  const [bonusPercent, setBonusPercent] = useState(0)
  const [bonusBalance, setBonusBalance] = useState(0)
  const [spendBonuses, setSpendBonuses] = useState(false)

  const load = useCallback(async () => {
    try {
      const [flowersRes, promoRes, bonusRes] = await Promise.all([
        fetch('/api/admin/flowers'),
        fetch('/api/admin/promo'),
        fetch('/api/admin/bonus'),
      ])
      if (flowersRes.ok) setFlowers(await flowersRes.json())
      if (promoRes.ok) {
        const data = await promoRes.json()
        setPromos(Array.isArray(data?.promos) ? data.promos : [])
      }
      if (bonusRes.ok) {
        const data = await bonusRes.json()
        setBonusEnabled(Boolean(data.enabled))
        setBonusPercent(Number(data.percent) || 0)
      }
    } catch {
      toast.error('Не удалось загрузить товары')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const catalog = useMemo(() => {
    const q = query.trim().toLowerCase()
    return flowers
      .filter((flower) => flower.stock > 0)
      .filter((flower) => {
        if (!q) return true
        return (
          flower.name.toLowerCase().includes(q) ||
          (flower.category ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }, [flowers, query])

  const lines = useMemo<CartLine[]>(() => {
    return Object.entries(cart)
      .map(([id, quantity]) => {
        const flower = flowers.find((item) => item.id === id)
        if (!flower || quantity <= 0) return null
        return { flower, quantity }
      })
      .filter((line): line is CartLine => Boolean(line))
  }, [cart, flowers])

  const priceOf = (flower: Flower) => saleUnitPrice(flower.price, promos, flower.id)

  const total = lines.reduce((sum, line) => sum + priceOf(line.flower) * line.quantity, 0)
  const spendAmount = spendBonuses ? maxSpend(total, bonusBalance) : 0
  const payable = total - spendAmount
  const willEarn = bonusEnabled ? earnBonuses(payable, bonusPercent) : 0

  useEffect(() => {
    if (!bonusEnabled) {
      setBonusBalance(0)
      return
    }
    const key = normalizePhone(clientPhone)
    if (!key) {
      setBonusBalance(0)
      return
    }
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/bonus?phone=${encodeURIComponent(clientPhone)}`)
          if (!res.ok) return
          const data = await res.json()
          setBonusBalance(Number(data.balance) || 0)
        } catch {
          setBonusBalance(0)
        }
      })()
    }, 400)
    return () => window.clearTimeout(timer)
  }, [bonusEnabled, clientPhone])

  const add = (flower: Flower) => {
    setCart((prev) => {
      const next = (prev[flower.id] ?? 0) + 1
      if (next > flower.stock) {
        toast.error(`На складе только ${flower.stock} шт.`)
        return prev
      }
      return { ...prev, [flower.id]: next }
    })
  }

  const setQty = (flower: Flower, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        const copy = { ...prev }
        delete copy[flower.id]
        return copy
      }
      return { ...prev, [flower.id]: Math.min(quantity, flower.stock) }
    })
  }

  const checkout = async () => {
    if (lines.length === 0) {
      toast.error('Добавьте товары')
      return
    }
    if (!paymentMethod) {
      toast.error('Выберите способ оплаты')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientPhone,
          comment,
          paymentMethod,
          spendBonuses,
          items: lines.map((line) => ({ flowerId: line.flower.id, quantity: line.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Не удалось оформить')
        return
      }
      toast.success(`Продажа на ${payable.toLocaleString('ru-RU')} ₽ оформлена`)
      setCart({})
      setClientName('')
      setClientPhone('')
      setComment('')
      setPaymentMethod('')
      setSpendBonuses(false)
      await load()
      onSold?.()
    } catch {
      toast.error('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-3">
        <Input
          placeholder="Поиск по названию или категории, включая скрытые"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="admin-surface overflow-hidden">
          <div className="max-h-[520px] overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : catalog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Нет товаров с остатком
              </p>
            ) : (
              <ul>
                {catalog.map((flower) => (
                  <li
                    key={flower.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 border-b last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {flower.name}
                        {!flower.active ? (
                          <Badge variant="secondary" className="ml-2 align-middle">
                            скрыт
                          </Badge>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {priceOf(flower).toLocaleString('ru-RU')} ₽
                        {priceOf(flower) < flower.price
                          ? ` · было ${flower.price.toLocaleString('ru-RU')} ₽`
                          : ''}
                        {' · '}остаток {flower.stock}
                        {flower.category ? ` · ${flower.category}` : ''}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => add(flower)}>
                      <Plus className="w-4 h-4 mr-1" />
                      В чек
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="admin-surface p-4 space-y-4 h-fit">
        <h3 className="font-semibold flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Чек
        </h3>
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Добавьте цветы слева. Скрытые с витрины тоже можно продать.</p>
        ) : (
          <ul className="space-y-2">
            {lines.map((line) => (
              <li key={line.flower.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{line.flower.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(priceOf(line.flower) * line.quantity).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 cursor-pointer"
                    onClick={() => setQty(line.flower, line.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center font-mono text-sm">{line.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 cursor-pointer"
                    onClick={() => add(line.flower)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 cursor-pointer text-rose-600"
                    onClick={() => setQty(line.flower, 0)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          <Label>Оплата</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={cn(
                  'rounded-md border px-3 py-2 text-left cursor-pointer transition-colors',
                  paymentMethod === method.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted'
                )}
              >
                <p className="text-sm font-medium">{method.label}</p>
                <p className="text-xs text-muted-foreground">{method.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="space-y-1">
            <Label htmlFor="pos-name">Имя (необязательно)</Label>
            <Input id="pos-name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pos-phone">Телефон (необязательно)</Label>
            <Input id="pos-phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pos-comment">Комментарий</Label>
            <Input id="pos-comment" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-muted-foreground">Итого</span>
          <span className="font-mono text-lg font-semibold">{payable.toLocaleString('ru-RU')} ₽</span>
        </div>
        {bonusEnabled && bonusPercent > 0 && normalizePhone(clientPhone) ? (
          <p className="text-xs text-muted-foreground">
            Начислим {willEarn.toLocaleString('ru-RU')} ₽ бонусами
          </p>
        ) : null}
        {bonusEnabled && bonusBalance > 0 ? (
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <Checkbox checked={spendBonuses} onCheckedChange={(v) => setSpendBonuses(v === true)} />
            <span>
              Списать {maxSpend(total, bonusBalance).toLocaleString('ru-RU')} ₽ бонусами
            </span>
          </label>
        ) : null}
        <Button
          className="w-full cursor-pointer"
          disabled={saving || lines.length === 0 || !paymentMethod}
          onClick={() => void checkout()}
        >
          {saving ? 'Оформление…' : 'Оформить продажу'}
        </Button>
      </div>
    </div>
  )
}
