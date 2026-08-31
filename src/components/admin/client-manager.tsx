'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ClientRow = {
  phone: string
  phoneLabel: string
  name: string
  names: string[]
  addresses: string[]
  lastAddress: string | null
  orderCount: number
  paidTotal: number
  bonusBalance: number
  bonusEarned: number
  bonusSpent: number
  lastOrderAt: string | null
}

type ClientOrder = {
  id: string
  clientName: string
  address: string | null
  deliverySlot: string | null
  comment: string | null
  source: string
  status: string
  totalAmount: number
  bonusSpent: number
  bonusEarned: number
  createdAt: string
  items: { flowerName: string; quantity: number; subtotal: number }[]
}

type ClientDetail = ClientRow & { orders: ClientOrder[] }

const STATUS: Record<string, string> = {
  new: 'Новый',
  processing: 'В обработке',
  completed: 'Выполнен',
  cancelled: 'Отменён',
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ClientManager() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ClientDetail | null>(null)
  const [bonusDraft, setBonusDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/clients')
      if (!res.ok) throw new Error()
      setClients(await res.json())
    } catch {
      toast.error('Не удалось загрузить клиентов')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((client) => {
      return (
        client.name.toLowerCase().includes(q) ||
        client.phoneLabel.toLowerCase().includes(q) ||
        client.phone.includes(q.replace(/\D/g, '')) ||
        client.addresses.some((address) => address.toLowerCase().includes(q))
      )
    })
  }, [clients, query])

  const openClient = async (row: ClientRow) => {
    try {
      const res = await fetch(`/api/admin/clients/${row.phone}`)
      if (!res.ok) throw new Error()
      const data = (await res.json()) as ClientDetail
      setSelected(data)
      setBonusDraft(String(data.bonusBalance))
    } catch {
      toast.error('Не удалось открыть карточку')
    }
  }

  const saveBonus = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/clients/${selected.phone}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: Number(bonusDraft) }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Не удалось сохранить баллы')
        return
      }
      setSelected({ ...selected, bonusBalance: data.balance })
      setClients((prev) =>
        prev.map((client) =>
          client.phone === selected.phone ? { ...client, bonusBalance: data.balance } : client
        )
      )
      toast.success('Баллы обновлены')
    } catch {
      toast.error('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Поиск по имени, телефону или адресу"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground ml-auto">
          {visible.length} из {clients.length}
        </span>
      </div>

      <div className="admin-surface overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Клиент</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Адрес</TableHead>
                <TableHead className="text-right">Заказы</TableHead>
                <TableHead className="text-right">Оплатил</TableHead>
                <TableHead className="text-right">Баллы</TableHead>
                <TableHead>Последний заказ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    {clients.length === 0
                      ? 'Пока нет клиентов с телефоном. Они появятся после заказов.'
                      : 'Никого не найдено'}
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((client) => (
                  <TableRow
                    key={client.phone}
                    className="cursor-pointer"
                    onClick={() => void openClient(client)}
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="font-mono text-sm">{client.phoneLabel}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                      {client.lastAddress || '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono">{client.orderCount}</TableCell>
                    <TableCell className="text-right font-mono">
                      {client.paidTotal.toLocaleString('ru-RU')} ₽
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{client.bonusBalance.toLocaleString('ru-RU')} ₽</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(client.lastOrderAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {selected.name}
                </DialogTitle>
                <DialogDescription>{selected.phoneLabel}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                {selected.names.length > 1 ? (
                  <p className="text-muted-foreground">Имена в заказах: {selected.names.join(', ')}</p>
                ) : null}
                <div>
                  <p className="font-medium mb-1">Адреса</p>
                  {selected.addresses.length === 0 ? (
                    <p className="text-muted-foreground">Нет адресов</p>
                  ) : (
                    <ul className="list-disc pl-5 space-y-1">
                      {selected.addresses.map((address) => (
                        <li key={address}>{address}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-muted-foreground">Заказов</p>
                    <p className="font-mono">{selected.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Оплатил</p>
                    <p className="font-mono">{selected.paidTotal.toLocaleString('ru-RU')} ₽</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Начислено</p>
                    <p className="font-mono">{selected.bonusEarned.toLocaleString('ru-RU')} ₽</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Списано</p>
                    <p className="font-mono">{selected.bonusSpent.toLocaleString('ru-RU')} ₽</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="client-bonus">Баллы сейчас</Label>
                    <Input
                      id="client-bonus"
                      type="number"
                      min={0}
                      className="w-32 font-mono"
                      value={bonusDraft}
                      onChange={(e) => setBonusDraft(e.target.value)}
                    />
                  </div>
                  <Button size="sm" className="cursor-pointer" disabled={saving} onClick={() => void saveBonus()}>
                    {saving ? 'Сохранение…' : 'Сохранить баллы'}
                  </Button>
                </div>
                <div>
                  <p className="font-medium mb-2">Заказы</p>
                  {selected.orders.length === 0 ? (
                    <p className="text-muted-foreground">Заказов нет, только бонусный счёт</p>
                  ) : (
                    <div className="admin-surface divide-y">
                      {selected.orders.map((order) => (
                        <div key={order.id} className="p-3 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>{formatDate(order.createdAt)}</span>
                            <Badge variant="secondary">{STATUS[order.status] || order.status}</Badge>
                          </div>
                          <p>
                            {order.totalAmount.toLocaleString('ru-RU')} ₽
                            {order.source === 'walkin' ? ' · зал' : ''}
                            {order.bonusSpent > 0 ? ` · списано ${order.bonusSpent} ₽` : ''}
                            {order.bonusEarned > 0 ? ` · начислено ${order.bonusEarned} ₽` : ''}
                          </p>
                          <p className="text-muted-foreground">
                            {order.items.map((item) => `${item.flowerName} × ${item.quantity}`).join(', ')}
                          </p>
                          {order.address ? <p className="text-muted-foreground">{order.address}</p> : null}
                          {order.comment ? <p className="text-muted-foreground">{order.comment}</p> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="cursor-pointer" onClick={() => setSelected(null)}>
                  Закрыть
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
