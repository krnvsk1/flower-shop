'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Bell, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  notifyOrdersChanged,
  startOrderChime,
  stopOrderChime,
  unlockOrderChime,
} from '@/lib/order-chime'

type NewOrder = {
  id: string
  clientName: string
  totalAmount: number
  source?: string
  status: string
}

function isIncoming(order: NewOrder) {
  return order.status === 'new' && order.source !== 'walkin'
}

export function NewOrderAlert({ onOpenOrders }: { onOpenOrders: () => void }) {
  const [orders, setOrders] = useState<NewOrder[]>([])
  const [soundOn, setSoundOn] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const knownIds = useRef<Set<string>>(new Set())
  const primed = useRef(false)
  const titleRef = useRef(typeof document !== 'undefined' ? document.title : '')

  const incoming = orders.filter(isIncoming)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders')
      if (!res.ok) return
      const data = (await res.json()) as NewOrder[]
      const nextIncoming = data.filter(isIncoming)
      if (primed.current) {
        const fresh = nextIncoming.filter((order) => !knownIds.current.has(order.id))
        if (fresh.length === 1) {
          toast.warning(`Новый заказ от ${fresh[0].clientName}`)
        } else if (fresh.length > 1) {
          toast.warning(`Новых заказов: ${fresh.length}`)
        }
      }
      primed.current = true
      knownIds.current = new Set(data.map((order) => order.id))
      const incomingKey = nextIncoming.map((order) => order.id).join(',')
      setOrders((prev) => {
        const prevKey = prev.filter(isIncoming).map((order) => order.id).join(',')
        if (prevKey === incomingKey && prev.length === data.length) return prev
        return data
      })
    } catch {
      // keep last snapshot
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), 6000)
    const onChanged = () => void load()
    window.addEventListener('flower-admin-orders-changed', onChanged)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('flower-admin-orders-changed', onChanged)
    }
  }, [load])

  useEffect(() => {
    const enable = () => {
      unlockOrderChime()
      window.setTimeout(() => setSoundOn(true), 0)
    }
    window.addEventListener('pointerdown', enable, { once: true })
    return () => window.removeEventListener('pointerdown', enable)
  }, [])

  useEffect(() => {
    if (incoming.length > 0 && soundOn) startOrderChime()
    else stopOrderChime()
    return () => stopOrderChime()
  }, [incoming.length, soundOn])

  useEffect(() => {
    if (!incoming.length) {
      document.title = titleRef.current
      return
    }
    let on = false
    const timer = window.setInterval(() => {
      on = !on
      document.title = on ? `● Новый заказ (${incoming.length})` : titleRef.current
    }, 900)
    return () => {
      window.clearInterval(timer)
      document.title = titleRef.current
    }
  }, [incoming.length])

  const accept = async (order: NewOrder) => {
    if (accepting) return
    setAccepting(true)
    unlockOrderChime()
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'processing', previousStatus: 'new' }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Заказ ${order.clientName} принят в работу`)
      notifyOrdersChanged()
      await load()
    } catch {
      toast.error('Не удалось принять заказ')
    } finally {
      setAccepting(false)
    }
  }

  if (incoming.length === 0) return null

  const first = incoming[0]

  return (
    <div className="admin-order-alert fixed bottom-5 right-5 z-[80] w-[min(100%-2rem,22rem)] admin-surface no-lift p-5 space-y-4 pointer-events-auto">
      <div className="flex items-start gap-3">
        <Bell className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.22em] uppercase text-brass mb-1">Новый заказ</p>
          <p className="text-2xl leading-none">
            {incoming.length === 1 ? first.clientName : `${incoming.length} заказа`}
          </p>
          <p className="text-sm text-muted-foreground mt-2 truncate">
            {incoming.length === 1
              ? `${first.totalAmount.toLocaleString('ru-RU')} ₽`
              : `${first.clientName} · ${first.totalAmount.toLocaleString('ru-RU')} ₽`}
          </p>
          {!soundOn ? (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              Нажмите в кабинете, чтобы включить звук
            </p>
          ) : (
            <p className="text-xs text-primary mt-2">Мелодия играет, пока заказ не примут</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1 cursor-pointer rounded-none text-[11px] tracking-[0.18em] uppercase"
          disabled={accepting}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => void accept(first)}
        >
          {accepting ? 'Принимаем…' : 'Принять'}
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer rounded-none text-[11px] tracking-[0.18em] uppercase"
          onClick={onOpenOrders}
        >
          К заказам
        </Button>
      </div>
    </div>
  )
}
