'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { RefreshCw, AlertTriangle, PackageCheck, PackageX, ChevronDown, Phone } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PosSale } from '@/components/admin/pos-sale'
import { paymentLabel } from '@/lib/payment'

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
  address: string | null
  deliverySlot: string | null
  comment: string | null
  source?: string
  paymentMethod?: string | null
  status: string
  totalAmount: number
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

const STATUSES = [
  { value: 'new', label: 'Новый', color: 'bg-sky-100 text-sky-700' },
  { value: 'processing', label: 'В обработке', color: 'bg-amber-100 text-amber-700' },
  { value: 'completed', label: 'Выполнен', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelled', label: 'Отменён', color: 'bg-rose-100 text-rose-700' },
] as const

function statusBadge(status: string) {
  const s = STATUSES.find((st) => st.value === status)
  return (
    <Badge variant="secondary" className={`${s?.color ?? 'bg-gray-100 text-gray-700'} font-medium`}>
      {s?.label ?? status}
    </Badge>
  )
}

export function OrderManager({ initialStatus = 'all' }: { initialStatus?: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState(initialStatus)
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean
    order: Order | null
    previousStatus: string
  }>({ open: false, order: null, previousStatus: '' })
  const knownIds = useRef<Set<string>>(new Set())
  const firstLoad = useRef(true)

  useEffect(() => {
    setFilterStatus(initialStatus)
  }, [initialStatus])

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      const res = await fetch('/api/admin/orders')
      if (!res.ok) return
      const data: Order[] = await res.json()
      if (!firstLoad.current) {
        const fresh = data.filter((o) => o.status === 'new' && !knownIds.current.has(o.id))
        if (fresh.length > 0) {
          toast.success(
            fresh.length === 1
              ? `Новый заказ от ${fresh[0].clientName}`
              : `Новых заказов: ${fresh.length}`
          )
        }
      }
      knownIds.current = new Set(data.map((o) => o.id))
      firstLoad.current = false
      setOrders(data)
    } catch {
      if (!silent) toast.error('Ошибка загрузки заказов')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchOrders()
    const timer = setInterval(() => void fetchOrders(true), 20000)
    return () => clearInterval(timer)
  }, [fetchOrders])

  const handleStatusChange = async (order: Order, newStatus: string) => {
    if (newStatus === 'cancelled' && order.status !== 'cancelled') {
      setCancelDialog({ open: true, order, previousStatus: order.status })
      return
    }

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, previousStatus: order.status }),
      })
      if (res.ok) {
        toast.success(`Статус: «${STATUSES.find((s) => s.value === newStatus)?.label}»`)
        void fetchOrders(true)
      }
    } catch {
      toast.error('Ошибка изменения статуса')
    }
  }

  const confirmCancel = async (restoreStock: boolean) => {
    if (!cancelDialog.order) return
    const order = cancelDialog.order
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          previousStatus: cancelDialog.previousStatus,
          restoreStock,
        }),
      })
      if (res.ok) {
        toast.success(restoreStock ? 'Заказ отменён, цветы на складе.' : 'Заказ отменён, товары списаны.')
        void fetchOrders(true)
      }
    } catch {
      toast.error('Ошибка отмены заказа')
    } finally {
      setCancelDialog({ open: false, order: null, previousStatus: '' })
    }
  }

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      const statusOk = filterStatus === 'all' || o.status === filterStatus
      if (!statusOk) return false
      if (!q) return true
      return (
        o.clientName.toLowerCase().includes(q) ||
        o.clientPhone.toLowerCase().includes(q) ||
        (o.address ?? '').toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        paymentLabel(o.paymentMethod).toLowerCase().includes(q)
      )
    })
  }, [orders, filterStatus, query])

  const newCount = orders.filter((o) => o.status === 'new').length

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <Tabs defaultValue="list">
      <TabsList className="mb-4">
        <TabsTrigger value="list" className="cursor-pointer">
          Заказы
        </TabsTrigger>
        <TabsTrigger value="pos" className="cursor-pointer">
          Продажа в зале
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pos">
        <PosSale onSold={() => void fetchOrders(true)} />
      </TabsContent>

      <TabsContent value="list">
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {newCount > 0 && (
          <Badge className="bg-rose-600 text-white hover:bg-rose-600">Новых: {newCount}</Badge>
        )}
        <Input
          placeholder="Поиск: имя, телефон, адрес"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
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
        <Button variant="ghost" size="sm" onClick={() => void fetchOrders()} className="ml-auto cursor-pointer">
          <RefreshCw className="w-4 h-4 mr-1" />
          Обновить
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Список обновляется каждые 20 секунд.</p>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8" />
                <TableHead className="min-w-[110px]">Клиент</TableHead>
                <TableHead className="min-w-[120px]">Телефон</TableHead>
                <TableHead className="min-w-[160px]">Доставка</TableHead>
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
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {orders.length === 0 ? 'Заказов пока нет' : 'Ничего не найдено'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.flatMap((order) => {
                  const open = expandedId === order.id
                  const rows = [
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedId(open ? null : order.id)}
                    >
                      <TableCell>
                        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{order.clientName}</div>
                        {order.source === 'walkin' ? (
                          <Badge variant="outline" className="mt-1 font-normal">
                            зал · {paymentLabel(order.paymentMethod)}
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`tel:${order.clientPhone}`}
                          className="inline-flex items-center gap-1 text-rose-700 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3 h-3" />
                          {order.clientPhone}
                        </a>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{order.source === 'walkin' ? 'Самовывоз / зал' : order.deliverySlot || '—'}</div>
                        <div className="text-muted-foreground truncate max-w-[180px]">
                          {order.source === 'walkin' ? 'Офлайн' : order.address || 'Адрес не указан'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {order.totalAmount.toLocaleString('ru-RU')} ₽
                      </TableCell>
                      <TableCell className="text-center">{statusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {order.status === 'cancelled' ? (
                          <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                            Отменён
                          </Badge>
                        ) : (
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
                        )}
                      </TableCell>
                    </TableRow>,
                  ]
                  if (open) {
                    rows.push(
                      <TableRow key={`${order.id}-details`}>
                        <TableCell colSpan={8} className="bg-muted/30">
                          <div className="grid gap-3 sm:grid-cols-2 text-sm py-2">
                            <div>
                              <p className="font-medium mb-1">Состав</p>
                              <ul className="space-y-1">
                                {order.items.map((item) => (
                                  <li key={item.id}>
                                    {item.flowerName} × {item.quantity} —{' '}
                                    {item.subtotal.toLocaleString('ru-RU')} ₽
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-1">
                              <p><span className="text-muted-foreground">Адрес:</span> {order.address || '—'}</p>
                              <p><span className="text-muted-foreground">Время:</span> {order.deliverySlot || '—'}</p>
                              <p><span className="text-muted-foreground">Источник:</span> {order.source === 'walkin' ? 'Продажа в зале' : 'Сайт'}</p>
                              <p><span className="text-muted-foreground">Оплата:</span> {paymentLabel(order.paymentMethod)}</p>
                              <p><span className="text-muted-foreground">Комментарий:</span> {order.comment || '—'}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }
                  return rows
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ open, order: null, previousStatus: '' })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Отменить заказ?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Заказ от <strong>{cancelDialog.order?.clientName}</strong> на сумму{' '}
                  <strong>{cancelDialog.order?.totalAmount.toLocaleString('ru-RU')} ₽</strong> будет отменён.
                </p>
                <p className="text-sm text-muted-foreground">Что сделать с товарами?</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Button
              variant="outline"
              className="h-auto py-4 px-4 flex items-start gap-3 cursor-pointer border-emerald-200 hover:bg-emerald-50 justify-start"
              onClick={() => void confirmCancel(true)}
            >
              <PackageCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-emerald-700">Вернуть на склад</p>
                <p className="text-xs text-muted-foreground mt-1">Цветы снова в продаже.</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 px-4 flex items-start gap-3 cursor-pointer border-rose-200 hover:bg-rose-50 justify-start"
              onClick={() => void confirmCancel(false)}
            >
              <PackageX className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-rose-700">Списать</p>
                <p className="text-xs text-muted-foreground mt-1">Запись появится в «Списаниях».</p>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCancelDialog({ open: false, order: null, previousStatus: '' })}
            >
              Назад
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
      </TabsContent>
    </Tabs>
  )
}
