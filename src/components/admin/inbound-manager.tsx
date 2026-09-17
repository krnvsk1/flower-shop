'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
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
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Camera, Download, FileSpreadsheet, ImagePlus, PackagePlus, Plus } from 'lucide-react'
import { LowStockSettings } from '@/components/admin/low-stock-settings'
import type { StockSettings } from '@/lib/stock-settings'
import { normalizeName } from '@/lib/inbound-match'

type FlowerOption = { id: string; name: string; stock: number; costPrice: number | null }

type PreviewRow = {
  line: number
  name: string
  quantity: number
  costPrice: number | null
  flowerId: string | null
  matchedName: string | null
  confidence: 'exact' | 'fuzzy' | 'none'
}

type InboundRecord = {
  id: string
  fileName: string | null
  note: string | null
  createdAt: string
  items: { id: string; flowerName: string; quantity: number; costPrice: number | null }[]
}

type PurchaseItem = {
  id: string
  name: string
  category: string | null
  stock: number
  suggestedQty: number
  costPrice: number | null
}

export function InboundManager() {
  const [flowers, setFlowers] = useState<FlowerOption[]>([])
  const [history, setHistory] = useState<InboundRecord[]>([])
  const [purchase, setPurchase] = useState<PurchaseItem[]>([])
  const [stockSettings, setStockSettings] = useState<StockSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [source, setSource] = useState<'file' | 'vision' | 'ocr' | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const tableInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [manualFlower, setManualFlower] = useState('')
  const [manualQty, setManualQty] = useState('')
  const [manualCost, setManualCost] = useState('')
  const [addDialog, setAddDialog] = useState<{
    open: boolean
    index: number
    name: string
    price: string
  }>({ open: false, index: -1, name: '', price: '' })

  const load = useCallback(async () => {
    try {
      const [flowersRes, historyRes, purchaseRes] = await Promise.all([
        fetch('/api/admin/flowers'),
        fetch('/api/admin/inbound'),
        fetch('/api/admin/inbound/purchase-list'),
      ])
      if (flowersRes.ok) {
        const all = await flowersRes.json()
        setFlowers(all.map((f: FlowerOption) => ({
          id: f.id,
          name: f.name,
          stock: f.stock,
          costPrice: f.costPrice ?? null,
        })))
      }
      if (historyRes.ok) setHistory(await historyRes.json())
      if (purchaseRes.ok) {
        const data = await purchaseRes.json()
        setPurchase(data.items || [])
        if (data.targetStock != null && data.lowStockPercent != null && data.lowStock != null) {
          setStockSettings({
            targetStock: data.targetStock,
            lowStockPercent: data.lowStockPercent,
            threshold: data.lowStock,
          })
        }
      }
    } catch {
      toast.error('Ошибка загрузки прихода')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const clearDocument = () => {
    setRows([])
    setFileName(null)
    setSource(null)
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  const readyRows = useMemo(
    () => rows.filter((row) => row.flowerId && row.quantity > 0),
    [rows]
  )
  const unmatched = rows.length - readyRows.length

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const isImage = (file.type || '').startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name)
    setFileName(file.name)
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return isImage ? URL.createObjectURL(file) : null
    })
    setParsing(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/inbound/preview', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Не удалось разобрать файл')
        return
      }
      setFileName(data.fileName)
      setSource(data.source || 'file')
      setRows(data.rows)
      if (data.flowers) {
        setFlowers(data.flowers)
      }
      const via =
        data.source === 'vision'
          ? ' по фото (AI)'
          : data.source === 'ocr'
            ? ' по фото (OCR)'
            : ''
      toast.success(`Найдено строк: ${data.rows.length}${via}`)
    } catch {
      toast.error('Сетевая ошибка')
    } finally {
      setParsing(false)
    }
  }

  const applyManual = async () => {
    const flower = flowers.find((f) => f.id === manualFlower)
    const quantity = parseInt(manualQty, 10)
    const costPrice = manualCost === '' ? null : Number(manualCost.replace(',', '.'))
    if (!flower || !Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Выберите цветок и количество')
      return
    }
    if (costPrice != null && (!Number.isFinite(costPrice) || costPrice < 0)) {
      toast.error('Некорректная закупочная цена')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'ручной ввод',
          items: [{ flowerId: flower.id, quantity, costPrice }],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Не удалось оприходовать')
        return
      }
      toast.success(`${flower.name}: +${quantity} шт.`)
      setManualFlower('')
      setManualQty('')
      setManualCost('')
      await load()
    } catch {
      toast.error('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  const applyInbound = async () => {
    if (rows.length === 0 || unmatched > 0) {
      toast.error('Сначала добавьте или привяжите все позиции из документа')
      return
    }
    if (readyRows.length === 0) {
      toast.error('Нет строк с количеством')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          items: readyRows.map((row) => ({
            flowerId: row.flowerId,
            quantity: row.quantity,
            costPrice: row.costPrice,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Не удалось оприходовать')
        return
      }
      toast.success('Остатки пополнены')
      clearDocument()
      await load()
    } catch {
      toast.error('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  const openAddDialog = (index: number) => {
    const row = rows[index]
    if (!row) return
    setAddDialog({ open: true, index, name: row.name, price: '' })
  }

  const createMissingFlower = async () => {
    const name = addDialog.name.trim()
    const price = Number(addDialog.price.replace(',', '.'))
    const row = rows[addDialog.index]
    if (!name) {
      toast.error('Укажите название')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Укажите цену продажи')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/flowers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price,
          costPrice: row?.costPrice ?? null,
        }),
      })
      const flower = await res.json()
      if (!res.ok) {
        toast.error(flower.error || 'Не удалось добавить товар')
        return
      }
      const option: FlowerOption = {
        id: flower.id,
        name: flower.name,
        stock: flower.stock,
        costPrice: flower.costPrice ?? null,
      }
      setFlowers((prev) =>
        prev.some((item) => item.id === option.id) ? prev : [...prev, option].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
      )
      const key = normalizeName(row?.name || name)
      const sourceIndex = addDialog.index
      setRows((prev) =>
        prev.map((item, i) => {
          if (i === sourceIndex) {
            return {
              ...item,
              flowerId: option.id,
              matchedName: option.name,
              confidence: 'exact',
              costPrice: item.costPrice ?? option.costPrice,
            }
          }
          if (item.flowerId || normalizeName(item.name) !== key) return item
          return {
            ...item,
            flowerId: option.id,
            matchedName: option.name,
            confidence: 'exact',
            costPrice: item.costPrice ?? option.costPrice,
          }
        })
      )
      toast.success(`«${flower.name}» добавлен в каталог`)
      setAddDialog({ open: false, index: -1, name: '', price: '' })
    } catch {
      toast.error('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <>
    <div className="space-y-6">
      <div className="admin-surface no-lift p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Приход по фото накладной</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Сфотографируйте бумажную накладную или выберите снимок из галереи. Сервис распознает названия, количество и закупочную цену — проверьте и оприходуйте.
            </p>
          </div>
          <Button variant="outline" asChild className="cursor-pointer">
            <a href="/api/admin/inbound/template">
              <Download className="w-4 h-4 mr-1" />
              Шаблон CSV
            </a>
          </Button>
        </div>
        <div
          className={cn(
            'rounded-xl border-2 border-dashed px-4 py-8 min-h-[220px] flex flex-col items-center justify-center gap-4 text-center transition-colors',
            dragOver ? 'border-emerald-600 bg-emerald-50/80' : 'border-emerald-700/30 bg-emerald-50/40',
            parsing && 'opacity-80'
          )}
          onDragEnter={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            void onFile(e.dataTransfer.files?.[0])
          }}
        >
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Предпросмотр накладной"
              className="max-h-48 w-auto rounded-lg object-contain shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white border border-emerald-200 flex items-center justify-center">
              <Camera className="w-7 h-7 text-emerald-700" />
            </div>
          )}
          <div className="space-y-1">
            <p className="font-medium">
              {parsing
                ? 'Распознаём накладную…'
                : photoPreview
                  ? fileName
                  : 'Перетащите фото сюда или сделайте снимок'}
            </p>
            <p className="text-sm text-muted-foreground">
              JPG, PNG, HEIC · до 8 МБ
              {source === 'vision' ? ' · распознано AI' : source === 'ocr' ? ' · распознано OCR' : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              disabled={parsing}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="w-4 h-4" />
              {parsing ? 'Распознаём…' : 'Сфотографировать'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer bg-white"
              disabled={parsing}
              onClick={() => photoInputRef.current?.click()}
            >
              <ImagePlus className="w-4 h-4" />
              Выбрать фото
            </Button>
          </div>
          <input
            ref={cameraInputRef}
            id="inbound-camera"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={parsing}
            onChange={(e) => {
              const picked = e.target.files?.[0]
              e.target.value = ''
              void onFile(picked)
            }}
          />
          <input
            ref={photoInputRef}
            id="inbound-photo"
            type="file"
            accept="image/*"
            className="hidden"
            disabled={parsing}
            onChange={(e) => {
              const picked = e.target.files?.[0]
              e.target.value = ''
              void onFile(picked)
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground">Нет фото — загрузите таблицу:</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={parsing}
            onClick={() => tableInputRef.current?.click()}
          >
            <FileSpreadsheet className="w-4 h-4" />
            CSV / Excel
          </Button>
          <input
            ref={tableInputRef}
            id="inbound-file"
            type="file"
            accept=".csv,.txt,.xlsx,.xls,.ods"
            className="hidden"
            disabled={parsing}
            onChange={(e) => {
              const picked = e.target.files?.[0]
              e.target.value = ''
              void onFile(picked)
            }}
          />
        </div>
      </div>

      <div className="admin-surface p-6 space-y-4">
        <h3 className="text-lg font-semibold">Добавить вручную</h3>
        <p className="text-sm text-muted-foreground">
          Без файла: выберите цветок и сколько пришло — остаток увеличится сразу.
        </p>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>Цветок</Label>
            <Select
              value={manualFlower || undefined}
              onValueChange={(id) => {
                setManualFlower(id)
                const flower = flowers.find((f) => f.id === id)
                if (flower?.costPrice != null) setManualCost(String(flower.costPrice))
              }}
            >
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
            <Label htmlFor="inbound-qty">Количество</Label>
            <Input
              id="inbound-qty"
              type="number"
              min="1"
              value={manualQty}
              onChange={(e) => setManualQty(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inbound-cost">Закупочная цена</Label>
            <Input
              id="inbound-cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="необязательно"
              value={manualCost}
              onChange={(e) => setManualCost(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer w-full"
              disabled={saving || !manualFlower || !manualQty}
              onClick={() => void applyManual()}
            >
              <PackagePlus className="w-4 h-4 mr-1" />
              {saving ? 'Сохранение…' : 'Оприходовать'}
            </Button>
          </div>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="admin-surface overflow-hidden">
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b">
            <p className="text-sm">
              К оприходованию: <strong>{readyRows.length}</strong>
              {unmatched > 0 ? (
                <span className="text-rose-600">
                  {' '}
                  · осталось {unmatched}: добавьте в каталог или привяжите к существующему
                </span>
              ) : (
                <span className="text-emerald-700"> · все позиции готовы</span>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={clearDocument}
              >
                Сбросить
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                disabled={saving || unmatched > 0 || readyRows.length === 0}
                onClick={() => void applyInbound()}
              >
                <PackagePlus className="w-4 h-4 mr-1" />
                {saving ? 'Сохранение…' : 'Оприходовать'}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Из документа</TableHead>
                  <TableHead className="w-[100px] text-right">Кол-во</TableHead>
                  <TableHead className="w-[130px] text-right">Закуп. цена</TableHead>
                  <TableHead>Товар в каталоге</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={`${row.line}-${index}`}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right font-mono">{row.quantity}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        className="h-8 w-[110px] ml-auto text-right font-mono"
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.costPrice ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value
                          const next = raw === '' ? null : Number(raw.replace(',', '.'))
                          setRows((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    costPrice: next != null && Number.isFinite(next) ? next : null,
                                  }
                                : item
                            )
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        {row.confidence !== 'exact' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="cursor-pointer shrink-0"
                            onClick={() => openAddDialog(index)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Добавить
                          </Button>
                        ) : null}
                        <Select
                          value={row.flowerId || 'none'}
                          onValueChange={(value) => {
                            const flower = flowers.find((f) => f.id === value)
                            setRows((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      flowerId: value === 'none' ? null : value,
                                      matchedName: flower?.name ?? null,
                                      confidence: value === 'none' ? 'none' : 'exact',
                                      costPrice: item.costPrice ?? flower?.costPrice ?? null,
                                    }
                                  : item
                              )
                            )
                          }}
                        >
                          <SelectTrigger className="max-w-md">
                            <SelectValue placeholder="Привязать к существующему" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Не выбран</SelectItem>
                            {flowers.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {row.confidence === 'exact' && row.flowerId ? (
                          <Badge className="bg-emerald-100 text-emerald-700">точно</Badge>
                        ) : row.confidence === 'fuzzy' ? (
                          <Badge className="bg-amber-100 text-amber-700">похоже</Badge>
                        ) : (
                          <Badge variant="secondary">нет в каталоге</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      <LowStockSettings
        value={stockSettings}
        onSaved={(next) => {
          setStockSettings(next)
          void load()
        }}
      />

      <div className="admin-surface overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b">
          <h3 className="font-semibold">Список закупки</h3>
          <Button variant="outline" size="sm" asChild className="cursor-pointer">
            <a href="/api/admin/inbound/purchase-list?format=csv">
              <Download className="w-4 h-4 mr-1" />
              Скачать CSV
            </a>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Товар</TableHead>
                <TableHead className="text-right">Остаток</TableHead>
                <TableHead className="text-right">Заказать</TableHead>
                <TableHead className="text-right">Закуп. цена</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : purchase.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Низкого остатка нет
                  </TableCell>
                </TableRow>
              ) : (
                purchase.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.name}
                      {item.category ? (
                        <span className="text-muted-foreground"> · {item.category}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right font-mono text-rose-600">{item.stock}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{item.suggestedQty}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {item.costPrice != null ? `${item.costPrice} ₽` : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="admin-surface overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold">История приходов</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Документ</TableHead>
                <TableHead>Позиции</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Приходов пока нет
                  </TableCell>
                </TableRow>
              ) : (
                history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.fileName || 'вручную'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.items
                        .map((line) =>
                          line.costPrice != null
                            ? `${line.flowerName} +${line.quantity} (${line.costPrice} ₽)`
                            : `${line.flowerName} +${line.quantity}`
                        )
                        .join(', ')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>

    <Dialog
      open={addDialog.open}
      onOpenChange={(open) => {
        if (!open) setAddDialog({ open: false, index: -1, name: '', price: '' })
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить в каталог</DialogTitle>
          <DialogDescription>
            Цветка нет среди товаров. Можно создать новый или закрыть окно и привязать строку к существующему.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="inbound-new-name">Название</Label>
            <Input
              id="inbound-new-name"
              value={addDialog.name}
              onChange={(e) => setAddDialog((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inbound-new-price">Цена продажи (₽)</Label>
            <Input
              id="inbound-new-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="150"
              value={addDialog.price}
              onChange={(e) => setAddDialog((prev) => ({ ...prev, price: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => setAddDialog({ open: false, index: -1, name: '', price: '' })}
          >
            Отмена
          </Button>
          <Button
            className="cursor-pointer"
            disabled={saving}
            onClick={() => void createMissingFlower()}
          >
            <Plus className="w-4 h-4 mr-1" />
            {saving ? 'Сохранение…' : 'Создать товар'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
