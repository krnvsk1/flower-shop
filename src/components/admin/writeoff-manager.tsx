'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Separator } from '@/components/ui/separator'
import { Undo2, RotateCcw } from 'lucide-react'

type FlowerOption = {
  id: string
  name: string
  stock: number
}

type WriteOff = {
  id: string
  flowerId: string
  flowerName: string
  quantity: number
  reason: string | null
  createdAt: string
  flower: { name: string } | null
}

export function WriteOffManager() {
  const [flowers, setFlowers] = useState<FlowerOption[]>([])
  const [writeoffs, setWriteoffs] = useState<WriteOff[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedFlower, setSelectedFlower] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [revertDialog, setRevertDialog] = useState<{ open: boolean; writeoff: WriteOff | null }>({
    open: false,
    writeoff: null,
  })

  const fetchData = useCallback(async () => {
    try {
      const [flowersRes, writeoffsRes] = await Promise.all([
        fetch('/api/admin/flowers'),
        fetch('/api/admin/writeoffs'),
      ])

      if (flowersRes.ok) {
        const allFlowers = await flowersRes.json()
        // Only show active flowers with stock > 0 for selection
        setFlowers(
          allFlowers
            .filter((f: FlowerOption & { active: boolean }) => f.active && f.stock > 0)
            .map((f: FlowerOption) => ({ id: f.id, name: f.name, stock: f.stock }))
        )
      }

      if (writeoffsRes.ok) {
        setWriteoffs(await writeoffsRes.json())
      }
    } catch {
      toast.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleWriteOff = async () => {
    if (!selectedFlower || !quantity || parseInt(quantity, 10) <= 0) {
      toast.error('Выберите цветок и укажите количество')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/writeoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowerId: selectedFlower,
          quantity: parseInt(quantity, 10),
          reason: reason.trim() || null,
        }),
      })

      if (res.ok) {
        toast.success('Списание оформлено')
        setSelectedFlower('')
        setQuantity('')
        setReason('')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка списания')
      }
    } catch {
      toast.error('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  const handleRevert = async () => {
    if (!revertDialog.writeoff) return

    try {
      const res = await fetch(`/api/admin/writeoffs/${revertDialog.writeoff.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Списание отменено, остаток восстановлен')
        fetchData()
      }
    } catch {
      toast.error('Ошибка отмены списания')
    } finally {
      setRevertDialog({ open: false, writeoff: null })
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const selectedFlowerData = flowers.find((f) => f.id === selectedFlower)

  return (
    <div className="space-y-6">
      {/* Write-off Form */}
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Списать товар</h3>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>Цветок *</Label>
            <Select value={selectedFlower || undefined} onValueChange={setSelectedFlower}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите цветок" />
              </SelectTrigger>
              <SelectContent>
                {flowers.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} (ост: {f.stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wo-quantity">Количество *</Label>
            <Input
              id="wo-quantity"
              type="number"
              min="1"
              max={selectedFlowerData?.stock ?? 999}
              placeholder="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wo-reason">Причина</Label>
            <Input
              id="wo-reason"
              placeholder="Увяли, повреждены..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleWriteOff}
          disabled={saving || !selectedFlower || !quantity}
          className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
        >
          {saving ? 'Оформление...' : 'Оформить списание'}
        </Button>
      </div>

      {/* Write-off History */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[160px]">Цветок</TableHead>
                <TableHead className="min-w-[80px] text-right">Кол-во</TableHead>
                <TableHead className="min-w-[160px]">Причина</TableHead>
                <TableHead className="min-w-[140px]">Дата</TableHead>
                <TableHead className="min-w-[80px] text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : writeoffs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Списаний пока нет
                  </TableCell>
                </TableRow>
              ) : (
                writeoffs.map((wo) => (
                  <TableRow key={wo.id}>
                    <TableCell className="font-medium">
                      {wo.flowerName}
                    </TableCell>
                    <TableCell className="text-right font-mono text-rose-600 font-semibold">
                      -{wo.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {wo.reason || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(wo.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                        onClick={() => setRevertDialog({ open: true, writeoff: wo })}
                        title="Отменить списание"
                      >
                        <Undo2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Revert Confirmation Dialog */}
      <Dialog open={revertDialog.open} onOpenChange={(open) => setRevertDialog({ open, writeoff: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              Отменить списание?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Списание <strong>{revertDialog.writeoff?.quantity} шт.</strong> товара{' '}
                  <strong>&laquo;{revertDialog.writeoff?.flowerName}&raquo;</strong> будет отменено.
                </p>
                <p className="text-emerald-600 font-medium">
                  ✓ Остаток на складе будет увеличен на {revertDialog.writeoff?.quantity}.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRevertDialog({ open: false, writeoff: null })}
              className="cursor-pointer"
            >
              Назад
            </Button>
            <Button
              onClick={handleRevert}
              className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
            >
              <Undo2 className="w-4 h-4 mr-1" />
              Восстановить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
