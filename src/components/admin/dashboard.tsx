'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight } from 'lucide-react'
import { LowStockSettings } from '@/components/admin/low-stock-settings'
import type { StockSettings } from '@/lib/stock-settings'
import { notifyOrdersChanged } from '@/lib/order-chime'

type RecentOrder = {
  id: string
  clientName: string
  clientPhone: string
  address: string | null
  deliverySlot: string | null
  status: string
  totalAmount: number
  createdAt: string
  items: { flowerName: string; quantity: number }[]
}

type LowStockItem = {
  id: string
  name: string
  stock: number
  category: string | null
}

type DashboardStats = {
  totalFlowers: number
  activeFlowers: number
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  totalRevenue: number
  lowStockCount: number
  recentOrders: RecentOrder[]
  lowStockItems: LowStockItem[]
  stockSettings: StockSettings
}

export type DashboardNav = {
  tab: 'dashboard' | 'flowers' | 'orders' | 'inbound' | 'writeoffs'
  orderStatus?: string
  lowStock?: boolean
}

const statCards: {
  key: keyof DashboardStats
  label: string
  accent: string
  format?: 'currency'
  nav: DashboardNav
}[] = [
  {
    key: 'pendingOrders',
    label: 'Новые заказы',
    accent: 'text-primary',
    nav: { tab: 'orders', orderStatus: 'new' },
  },
  {
    key: 'processingOrders',
    label: 'В работе',
    accent: 'text-brass',
    nav: { tab: 'orders', orderStatus: 'processing' },
  },
  {
    key: 'lowStockCount',
    label: 'Мало на складе',
    accent: 'text-primary',
    nav: { tab: 'flowers', lowStock: true },
  },
  {
    key: 'totalRevenue',
    label: 'Выручка',
    accent: 'text-sage',
    format: 'currency',
    nav: { tab: 'orders' },
  },
  {
    key: 'activeFlowers',
    label: 'На витрине',
    accent: 'text-sage',
    nav: { tab: 'flowers' },
  },
  {
    key: 'totalFlowers',
    label: 'Всего товаров',
    accent: 'text-foreground',
    nav: { tab: 'flowers' },
  },
]

function orderStatusBadge(status: string) {
  if (status === 'new') return { text: 'Новый', className: 'rounded-none bg-secondary text-primary' }
  if (status === 'processing') return { text: 'В работе', className: 'rounded-none bg-accent text-brass' }
  return { text: status, className: 'rounded-none bg-muted text-muted-foreground' }
}

export function Dashboard({ onNavigate }: { onNavigate: (nav: DashboardNav) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [takingId, setTakingId] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      if (res.ok) setStats(await res.json())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const takeInProgress = async (order: RecentOrder) => {
    setTakingId(order.id)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'processing', previousStatus: order.status }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Заказ ${order.clientName} взят в работу`)
      notifyOrdersChanged()
      await load()
    } catch {
      toast.error('Не удалось обновить заказ')
    } finally {
      setTakingId(null)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Не удалось загрузить статистику
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = stats[card.key]
          const displayValue =
            card.format === 'currency' && typeof value === 'number'
              ? `${value.toLocaleString('ru-RU')} ₽`
              : String(value)

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onNavigate(card.nav)}
              className="text-left cursor-pointer group"
            >
              <Card className="border-border/70 hover:border-foreground/30 transition-colors h-full">
                <CardContent className="p-6">
                  <p className="text-[11px] tracking-[0.22em] uppercase text-muted-foreground">
                    {card.label}
                  </p>
                  <p className={`text-4xl leading-none mt-3 ${card.accent}`}>
                    {displayValue}
                  </p>
                  <p className="mt-4 text-[11px] tracking-[0.22em] uppercase text-foreground/50 group-hover:text-primary flex items-center gap-1 transition-colors">
                    Открыть
                    <ArrowRight className="w-3 h-3" />
                  </p>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-medium">Последние заказы</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => onNavigate({ tab: 'orders', orderStatus: 'new' })}
            >
              Все новые
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Нет активных заказов</p>
            ) : (
              stats.recentOrders.map((order) => {
                const badge = orderStatusBadge(order.status)
                return (
                  <div
                    key={order.id}
                    className="bg-muted/40 border border-border/80 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.clientName}</p>
                        <Badge variant="secondary" className={badge.className}>
                          {badge.text}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.deliverySlot || 'Время не указано'} · {order.address || 'без адреса'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.map((i) => `${i.flowerName} × ${i.quantity}`).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-sm">
                        {order.totalAmount.toLocaleString('ru-RU')} ₽
                      </span>
                      {order.status === 'new' && (
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer rounded-none"
                          disabled={takingId === order.id}
                          onClick={() => void takeInProgress(order)}
                        >
                          В работу
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-medium">Мало на складе</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => onNavigate({ tab: 'inbound' })}
            >
              К закупке
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <LowStockSettings compact value={stats.stockSettings} onSaved={() => void load()} />
            {stats.lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Остатки в норме
              </p>
            ) : (
              <ul className="space-y-2">
                {stats.lowStockItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span>
                      {item.name}
                      {item.category ? (
                        <span className="text-muted-foreground"> · {item.category}</span>
                      ) : null}
                    </span>
                    <span className="font-mono text-primary font-medium">{item.stock} шт.</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
