'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RefreshCw, AlertTriangle } from 'lucide-react'

type OrderItem = {
  id: string
  flowerName: string
  quantity: number
  price: number
  subtotal: number
}

type Order = {
  id: string
  clientName: string
  clientPhone: string
  status: string
  totalAmount: number
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

type StatusOption = {
  value: string
  label: string
  color: string
}

const STATUSES: StatusOption[] = [
  { value: 'new', label: 'Новый', color: 'bg-sky-100 text-sky-700' },
  { value: 'processing', label: 'В обработке', color: 'bg-amber-100 text-amber-700' },
  { value: 'completed', label: 'Выполнен', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelled', label: 'Отменён', color: 'bg-rose-100 text-rose-700' },
]

function getStatusBadge(status: string) {
  const s = STATUSES.find((st) => st.value === status)
  return (
    <Badge variant="secondary" className={`${s?.color ?? 'bg-gray-100 text-gray-700'} font-medium`}>
      {s?.label ?? status}
    </Badge>
  )
}

export function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; order: Order | null }>({
    open: false,
    order: null,
  })

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders')
      if (res.ok) {
        setOrders(await res.json())
      }
    } catch {
      toast.error('Ошибка загрузки заказов')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusChange = async (order: Order, newStatus: string) => {
    if (newStatus === 'cancelled' && order.status !== 'cancelled') {
      setCancelDialog({ open: true, order: { ...order, status: newStatus } })
      return
    }

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, previousStatus: order.status }),
      })
      if (res.ok) {
        toast.success(`Статус изменён на «${STATUSES.find((s) => s.value === newStatus)?.label}»`)
        fetchOrders()
      }
    } catch {
      toast.error('Ошибка изменения статуса')
    }
  }

  const confirmCancel = async () => {
    if (!cancelDialog.order) return
    const order = cancelDialog.order

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', previousStatus: order.status }),
      })
      if (res.ok) {
        toast.success('Заказ отменён. Остатки на складе восстановлены.')
        fetchOrders()
      }
    } catch {
      toast.error('Ошибка отмены заказа')
    } finally {
      setCancelDialog({ open: false, order: null })
    }
  }

  const filteredOrders =
    filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium">Фильтр:</span>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchOrders}
          className="ml-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Обновить
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[90px]">ID</TableHead>
                <TableHead className="min-w-[120px]">Клиент</TableHead>
                <TableHead className="min-w-[120px]">Телефон</TableHead>
                <TableHead className="min-w-[80px] text-right">Сумма</TableHead>
                <TableHead className="min-w-[110px] text-center">Статус</TableHead>
                <TableHead className="min-w-[140px]">Дата</TableHead>
                <TableHead className="min-w-[150px] text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-14 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {orders.length === 0 ? 'Заказов пока нет' : 'Нет заказов с таким статусом'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">{order.clientName}</TableCell>
                    <TableCell className="font-mono text-sm">{order.clientPhone}</TableCell>
                    <TableCell className="text-right font-mono">
                      {order.totalAmount.toLocaleString('ru-RU')} ₽
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={order.status}
                        onValueChange={(v) => handleStatusChange(order, v)}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs ml-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, order: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Отменить заказ?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Заказ от <strong>{cancelDialog.order?.clientName}</strong> на сумму{' '}
                  <strong>{cancelDialog.order?.totalAmount.toLocaleString('ru-RU')} ₽</strong> будет отменён.
                </p>
                <p className="text-amber-600 font-medium">
                  ⚠️ Остатки товаров на складе будут восстановлены.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, order: null })}
              className="cursor-pointer"
            >
              Назад
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
              className="cursor-pointer"
            >
              Отменить заказ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
