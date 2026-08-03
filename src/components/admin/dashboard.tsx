'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, ShoppingCart, DollarSign, AlertTriangle, Flower2, ClipboardList } from 'lucide-react'

type DashboardStats = {
  totalFlowers: number
  activeFlowers: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  lowStockCount: number
}

const statCards = [
  {
    key: 'totalFlowers' as const,
    label: 'Всего товаров',
    icon: Package,
    color: 'bg-rose-100 text-rose-600',
    border: 'border-rose-200',
  },
  {
    key: 'activeFlowers' as const,
    label: 'Активные товары',
    icon: Flower2,
    color: 'bg-emerald-100 text-emerald-600',
    border: 'border-emerald-200',
  },
  {
    key: 'totalOrders' as const,
    label: 'Всего заказов',
    icon: ShoppingCart,
    color: 'bg-amber-100 text-amber-600',
    border: 'border-amber-200',
  },
  {
    key: 'pendingOrders' as const,
    label: 'Новые заказы',
    icon: ClipboardList,
    color: 'bg-orange-100 text-orange-600',
    border: 'border-orange-200',
  },
  {
    key: 'totalRevenue' as const,
    label: 'Общая выручка',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-600',
    border: 'border-emerald-200',
    format: 'currency' as const,
  },
  {
    key: 'lowStockCount' as const,
    label: 'Мало на складе',
    icon: AlertTriangle,
    color: 'bg-rose-100 text-rose-600',
    border: 'border-rose-200',
  },
]

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard')
        if (res.ok) {
          setStats(await res.json())
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon
        const value = stats[card.key]
        const displayValue =
          card.format === 'currency'
            ? `${value.toLocaleString('ru-RU')} ₽`
            : value.toString()

        return (
          <Card key={card.key} className={`border ${card.border} hover:shadow-md transition-shadow`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground">{displayValue}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
