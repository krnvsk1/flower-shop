'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Flower2,
  ClipboardList,
  ArrowRight,
} from 'lucide-react'

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
}

export type DashboardNav = {
  tab: 'dashboard' | 'flowers' | 'orders' | 'inbound' | 'writeoffs'
  orderStatus?: string
  lowStock?: boolean
}

const statCards: {
  key: keyof DashboardStats
  label: string
  icon: typeof Package
  color: string
  border: string
  format?: 'currency'
  nav: DashboardNav
}[] = [
  {
    key: 'pendingOrders',
    label: 'Новые заказы',
    icon: ClipboardList,
    color: 'bg-orange-100 text-orange-600',
    border: 'border-orange-200',
    nav: { tab: 'orders', orderStatus: 'new' },
  },
  {
    key: 'processingOrders',
    label: 'В работе',
    icon: ShoppingCart,
    color: 'bg-amber-100 text-amber-600',
    border: 'border-amber-200',
    nav: { tab: 'orders', orderStatus: 'processing' },
  },
  {
    key: 'lowStockCount',
    label: 'Мало на складе',
    icon: AlertTriangle,
    color: 'bg-rose-100 text-rose-600',
    border: 'border-rose-200',
    nav: { tab: 'inbound' },
  },
  {
    key: 'totalRevenue',
    label: 'Выручка',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-600',
    border: 'border-emerald-200',
    format: 'currency',
    nav: { tab: 'orders' },
  },
  {
    key: 'activeFlowers',
    label: 'На витрине',
    icon: Flower2,
    color: 'bg-emerald-100 text-emerald-600',
    border: 'border-emerald-200',
    nav: { tab: 'flowers' },
  },
  {
    key: 'totalFlowers',
    label: 'Всего товаров',
    icon: Package,
    color: 'bg-rose-100 text-rose-600',
    border: 'border-rose-200',
    nav: { tab: 'flowers' },
  },
]

function orderStatusBadge(status: string) {
  if (status === 'new') return { text: 'Новый', className: 'bg-sky-100 text-sky-700' }
  if (status === 'processing') return { text: 'В работе', className: 'bg-amber-100 text-amber-700' }
  return { text: status, className: 'bg-slate-100 text-slate-700' }
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
              className="text-left cursor-pointer"
            >
              <Card className={`border ${card.border} hover:shadow-md transition-shadow h-full`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
                      <p className="text-2xl font-bold text-foreground">{displayValue}</p>
                      <p className="text-xs text-primary flex items-center gap-1">
                        Открыть
                        <ArrowRight className="w-3 h-3" />
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Последние заказы</CardTitle>
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
                    className="rounded-lg border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
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
            <CardTitle className="text-base">Заканчивается на складе</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => onNavigate({ tab: 'inbound' })}
            >
              К закупке
            </Button>
          </CardHeader>
          <CardContent>
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
