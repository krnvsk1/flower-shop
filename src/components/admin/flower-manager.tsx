'use client'

import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowDown, ArrowUp, ArrowUpDown, X } from 'lucide-react'
import { LowStockSettings } from '@/components/admin/low-stock-settings'
import type { StockSettings } from '@/lib/stock-settings'
import { computeStockSettings, DEFAULT_LOW_STOCK_PERCENT, DEFAULT_TARGET_STOCK } from '@/lib/stock-settings'

type Flower = {
  id: string
  name: string
  description: string | null
  price: number
  costPrice: number | null
  stock: number
  imageUrl: string | null
  category: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

type Category = { id: string; name: string }

type SortKey = 'name' | 'category' | 'price' | 'costPrice' | 'stock' | 'active'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'active' | 'hidden'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  costPrice: '',
  stock: '',
  imageUrl: '',
  category: '',
}

export function FlowerManager({ lowStockOnly = false }: { lowStockOnly?: boolean }) {
  const [flowers, setFlowers] = useState<Flower[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tab, setTab] = useState('list')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; flower: Flower | null }>({
    open: false,
    flower: null,
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({})
  const [costDrafts, setCostDrafts] = useState<Record<string, string>>({})
  const [newCategory, setNewCategory] = useState('')
  const [stockSettings, setStockSettings] = useState<StockSettings>(
    computeStockSettings(DEFAULT_TARGET_STOCK, DEFAULT_LOW_STOCK_PERCENT)
  )
  const [query, setQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const fetchFlowers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/flowers')
      if (res.ok) setFlowers(await res.json())
    } catch {
      toast.error('Ошибка загрузки товаров')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories')
      if (res.ok) setCategories(await res.json())
    } catch {
      toast.error('Ошибка загрузки категорий')
    }
  }, [])

  const fetchStockSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stock-settings')
      if (res.ok) setStockSettings(await res.json())
    } catch {
      // keep defaults
    }
  }, [])

  useEffect(() => {
    void fetchFlowers()
    void fetchCategories()
    void fetchStockSettings()
  }, [fetchFlowers, fetchCategories, fetchStockSettings])

  const handleSubmit = async () => {
    if (!form.name.trim() || form.price === '') {
      toast.error('Заполните название и цену')
      return
    }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        costPrice: form.costPrice === '' ? null : parseFloat(form.costPrice.replace(',', '.')),
        imageUrl: form.imageUrl.trim() || null,
        category: form.category || null,
      }

      if (editingId) {
        const res = await fetch(`/api/admin/flowers/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          toast.success('Товар обновлён')
          setEditingId(null)
          setForm(emptyForm)
          setTab('list')
        } else {
          toast.error('Ошибка обновления')
        }
      } else {
        const res = await fetch('/api/admin/flowers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          toast.success('Товар добавлен')
          setForm(emptyForm)
          setTab('list')
        } else {
          toast.error('Ошибка добавления')
        }
      }
      void fetchFlowers()
    } catch {
      toast.error('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  const patchFlower = async (id: string, data: Partial<Flower>) => {
    const res = await fetch(`/api/admin/flowers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('update failed')
    const updated = (await res.json()) as Flower
    setFlowers((prev) => prev.map((f) => (f.id === id ? { ...f, ...updated } : f)))
  }

  const savePrice = async (flower: Flower) => {
    const raw = priceDrafts[flower.id]
    if (raw === undefined) return
    const next = Number(raw.replace(',', '.'))
    if (!Number.isFinite(next) || next < 0) {
      toast.error('Некорректная цена')
      setPriceDrafts((p) => {
        const copy = { ...p }
        delete copy[flower.id]
        return copy
      })
      return
    }
    if (next === flower.price) {
      setPriceDrafts((p) => {
        const copy = { ...p }
        delete copy[flower.id]
        return copy
      })
      return
    }
    try {
      await patchFlower(flower.id, { price: next })
      toast.success(`Цена «${flower.name}»: ${next.toLocaleString('ru-RU')} ₽`)
    } catch {
      toast.error('Не удалось сохранить цену')
    } finally {
      setPriceDrafts((p) => {
        const copy = { ...p }
        delete copy[flower.id]
        return copy
      })
    }
  }

  const saveCost = async (flower: Flower) => {
    const raw = costDrafts[flower.id]
    if (raw === undefined) return
    const trimmed = raw.trim()
    const next = trimmed === '' ? null : Number(trimmed.replace(',', '.'))
    if (next != null && (!Number.isFinite(next) || next < 0)) {
      toast.error('Некорректная закупочная цена')
      setCostDrafts((p) => {
        const copy = { ...p }
        delete copy[flower.id]
        return copy
      })
      return
    }
    if (next === flower.costPrice) {
      setCostDrafts((p) => {
        const copy = { ...p }
        delete copy[flower.id]
        return copy
      })
      return
    }
    try {
      await patchFlower(flower.id, { costPrice: next })
      toast.success(
        next == null
          ? `Закупка «${flower.name}» очищена`
          : `Закупка «${flower.name}»: ${next.toLocaleString('ru-RU')} ₽`
      )
    } catch {
      toast.error('Не удалось сохранить закупочную цену')
    } finally {
      setCostDrafts((p) => {
        const copy = { ...p }
        delete copy[flower.id]
        return copy
      })
    }
  }

  const handleToggleActive = async (flower: Flower) => {
    try {
      await patchFlower(flower.id, { active: !flower.active })
      toast.success(flower.active ? 'Товар скрыт' : 'Товар активирован')
    } catch {
      toast.error('Ошибка изменения статуса')
    }
  }

  const bulkSetActive = async (active: boolean) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    try {
      const res = await fetch('/api/admin/flowers/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, active }),
      })
      if (!res.ok) throw new Error()
      toast.success(active ? `Показано: ${ids.length}` : `Скрыто: ${ids.length}`)
      setSelectedIds(new Set())
      void fetchFlowers()
    } catch {
      toast.error('Не удалось обновить товары')
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.flower) return
    try {
      const res = await fetch(`/api/admin/flowers/${deleteDialog.flower.id}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'Ошибка удаления')
        return
      }
      toast.success('Товар удалён')
      void fetchFlowers()
    } catch {
      toast.error('Ошибка удаления')
    } finally {
      setDeleteDialog({ open: false, flower: null })
    }
  }

  const handleHideInsteadOfDelete = async () => {
    if (!deleteDialog.flower) return
    const flower = deleteDialog.flower
    setDeleteDialog({ open: false, flower: null })
    if (flower.active) await handleToggleActive(flower)
  }

  const handleEdit = (flower: Flower) => {
    setEditingId(flower.id)
    setForm({
      name: flower.name,
      description: flower.description ?? '',
      price: flower.price.toString(),
      costPrice: flower.costPrice != null ? String(flower.costPrice) : '',
      stock: flower.stock.toString(),
      imageUrl: flower.imageUrl ?? '',
      category: flower.category ?? '',
    })
    setTab('add')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
    setTab('list')
  }

  const addCategory = async () => {
    const name = newCategory.trim()
    if (!name) return
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error()
      setNewCategory('')
      toast.success('Категория добавлена')
      void fetchCategories()
    } catch {
      toast.error('Не удалось добавить категорию')
    }
  }

  const removeCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Категория удалена')
      void fetchCategories()
    } catch {
      toast.error('Не удалось удалить категорию')
    }
  }

  const categoryOptions = useMemo(() => {
    const names = new Set<string>()
    for (const category of categories) names.add(category.name)
    for (const flower of flowers) {
      if (flower.category) names.add(flower.category)
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'ru'))
  }, [categories, flowers])

  const visibleFlowers = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = flowers.filter((flower) => {
      if (lowStockOnly && flower.stock > stockSettings.threshold) return false
      if (filterCategory === 'none' && flower.category) return false
      if (filterCategory !== 'all' && filterCategory !== 'none' && flower.category !== filterCategory) return false
      if (filterStatus === 'active' && !flower.active) return false
      if (filterStatus === 'hidden' && flower.active) return false
      if (q && !flower.name.toLowerCase().includes(q)) return false
      return true
    })

    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const cmp = (() => {
        switch (sortKey) {
          case 'name':
            return a.name.localeCompare(b.name, 'ru')
          case 'category':
            return (a.category ?? '').localeCompare(b.category ?? '', 'ru')
          case 'price':
            return a.price - b.price
          case 'costPrice':
            return (a.costPrice ?? Number.POSITIVE_INFINITY) - (b.costPrice ?? Number.POSITIVE_INFINITY)
          case 'stock':
            return a.stock - b.stock
          case 'active':
            return Number(a.active) - Number(b.active)
        }
      })()
      return cmp * dir
    })
  }, [flowers, lowStockOnly, stockSettings.threshold, query, filterCategory, filterStatus, sortKey, sortDir])

  const filtersActive =
    query.trim() !== '' || filterCategory !== 'all' || filterStatus !== 'all' || sortKey !== 'name' || sortDir !== 'asc'

  const clearFilters = () => {
    setQuery('')
    setFilterCategory('all')
    setFilterStatus('all')
    setSortKey('name')
    setSortDir('asc')
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir(key === 'name' || key === 'category' ? 'asc' : 'desc')
  }

  const SortHead = ({
    field,
    children,
    className,
    align = 'left',
  }: {
    field: SortKey
    children: ReactNode
    className?: string
    align?: 'left' | 'right' | 'center'
  }) => {
    const active = sortKey === field
    const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown
    return (
      <TableHead className={className}>
        <button
          type="button"
          onClick={() => toggleSort(field)}
          className={`inline-flex items-center gap-1 cursor-pointer hover:text-foreground ${
            align === 'right' ? 'w-full justify-end' : align === 'center' ? 'w-full justify-center' : ''
          }`}
        >
          {children}
          <Icon className={`w-3.5 h-3.5 ${active ? 'text-foreground' : 'text-muted-foreground'}`} />
        </button>
      </TableHead>
    )
  }

  const allVisibleSelected =
    visibleFlowers.length > 0 && visibleFlowers.every((f) => selectedIds.has(f.id))

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(visibleFlowers.map((f) => f.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const isEditing = editingId !== null

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="list" className="cursor-pointer">
          Все товары
        </TabsTrigger>
        <TabsTrigger value="add" className="cursor-pointer">
          <Plus className="w-4 h-4 mr-1" />
          {isEditing ? 'Редактирование' : 'Добавить цветок'}
        </TabsTrigger>
        <TabsTrigger value="categories" className="cursor-pointer">
          Категории
        </TabsTrigger>
      </TabsList>

      <TabsContent value="list">
        {lowStockOnly && (
          <div className="mb-4 space-y-3">
            <LowStockSettings
              value={stockSettings}
              onSaved={(next) => setStockSettings(next)}
            />
            <p className="text-sm text-rose-700">
              Показаны товары с остатком {stockSettings.threshold} шт. и меньше
              ({stockSettings.lowStockPercent}% от нормы {stockSettings.targetStock} шт.).
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <Input
            placeholder="Поиск по названию"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              <SelectItem value="none">Без категории</SelectItem>
              {categoryOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StatusFilter)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">На витрине</SelectItem>
              <SelectItem value="hidden">Скрытые</SelectItem>
            </SelectContent>
          </Select>
          {filtersActive && (
            <Button variant="ghost" size="sm" className="cursor-pointer" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Сбросить
            </Button>
          )}
          <span className="text-sm text-muted-foreground ml-auto">
            {visibleFlowers.length} из {flowers.length}
          </span>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-sm text-muted-foreground">Выбрано: {selectedIds.size}</span>
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => void bulkSetActive(true)}>
              <Eye className="w-4 h-4 mr-1" />
              Показать на витрине
            </Button>
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => void bulkSetActive(false)}>
              <EyeOff className="w-4 h-4 mr-1" />
              Скрыть с витрины
            </Button>
          </div>
        )}
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(v) => toggleSelectAll(v === true)}
                      aria-label="Выбрать все"
                    />
                  </TableHead>
                  <SortHead field="name" className="min-w-[160px]">Название</SortHead>
                  <SortHead field="category" className="min-w-[100px]">Категория</SortHead>
                  <SortHead field="price" className="min-w-[110px] text-right" align="right">Цена</SortHead>
                  <SortHead field="costPrice" className="min-w-[110px] text-right" align="right">Закупка</SortHead>
                  <SortHead field="stock" className="min-w-[90px] text-right" align="right">Остаток</SortHead>
                  <SortHead field="active" className="min-w-[90px] text-center" align="center">Статус</SortHead>
                  <TableHead className="min-w-[120px] text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : visibleFlowers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {flowers.length === 0
                        ? 'Нет товаров. Добавьте первый!'
                        : filtersActive || lowStockOnly
                          ? 'Нет товаров по выбранным фильтрам'
                          : 'Нет товаров'}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleFlowers.map((f) => (
                    <TableRow key={f.id} className={!f.active ? 'opacity-60' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(f.id)}
                          onCheckedChange={(v) => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev)
                              if (v === true) next.add(f.id)
                              else next.delete(f.id)
                              return next
                            })
                          }}
                          aria-label={`Выбрать ${f.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell>
                        {f.category ? (
                          <Badge variant="outline" className="font-normal">
                            {f.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 w-[100px] ml-auto text-right font-mono"
                          value={priceDrafts[f.id] ?? String(f.price)}
                          onChange={(e) =>
                            setPriceDrafts((p) => ({ ...p, [f.id]: e.target.value }))
                          }
                          onBlur={() => void savePrice(f)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 w-[100px] ml-auto text-right font-mono"
                          value={costDrafts[f.id] ?? (f.costPrice == null ? '' : String(f.costPrice))}
                          onChange={(e) =>
                            setCostDrafts((p) => ({ ...p, [f.id]: e.target.value }))
                          }
                          onBlur={() => void saveCost(f)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                          }}
                        />
                      </TableCell>
                      <TableCell className={`text-right font-mono ${f.stock <= stockSettings.threshold ? 'text-rose-600 font-semibold' : ''}`}>
                        {f.stock}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={f.active ? 'default' : 'secondary'}
                          className={f.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                        >
                          {f.active ? 'Активен' : 'Скрыт'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer"
                            onClick={() => handleEdit(f)}
                            title="Редактировать"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer"
                            onClick={() => void handleToggleActive(f)}
                            title={f.active ? 'Скрыть' : 'Активировать'}
                          >
                            {f.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                            onClick={() => setDeleteDialog({ open: true, flower: f })}
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Цену продажи и закупку можно менять прямо в таблице — сохраняется при уходе с поля.
          Остаток меняется только через приход и списания.
        </p>
      </TabsContent>

      <TabsContent value="add">
        <div className="max-w-lg">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flower-name">Название *</Label>
              <Input
                id="flower-name"
                placeholder='Например: "Роза красная"'
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flower-desc">Описание</Label>
              <Input
                id="flower-desc"
                placeholder="Краткое описание"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flower-price">Цена продажи (₽) *</Label>
                <Input
                  id="flower-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="150"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flower-cost">Закупочная цена (₽)</Label>
                <Input
                  id="flower-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="80"
                  value={form.costPrice}
                  onChange={(e) => setForm((p) => ({ ...p, costPrice: e.target.value }))}
                />
              </div>
            </div>
            {isEditing && (
              <p className="text-sm text-muted-foreground">
                Остаток: <span className="font-mono text-foreground">{form.stock || '0'}</span> шт. Меняется через приход и списания.
              </p>
            )}
            {!isEditing && (
              <p className="text-sm text-muted-foreground">
                Новый товар создаётся с остатком 0. Пополнить можно во вкладке «Приход».
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="flower-category">Категория</Label>
              <Select
                value={form.category || undefined}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger id="flower-category">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flower-image">URL изображения</Label>
              <Input
                id="flower-image"
                placeholder="https://…/photo.jpg"
                value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Вставьте прямую ссылку на файл (.jpg, .png, .webp) или адрес картинки из Google:
                правый клик по фото → «Копировать адрес изображения». Ссылки на страницу магазина
                или google.com/url мы попробуем развернуть в картинку при сохранении.
              </p>
              {form.imageUrl.trim() ? (
                <img
                  src={form.imageUrl.trim()}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-28 w-28 object-cover bg-muted"
                  onError={(e) => {
                    e.currentTarget.style.opacity = '0.3'
                  }}
                />
              ) : null}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => void handleSubmit()}
                disabled={saving}
                className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {saving ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Добавить товар'}
              </Button>
              {isEditing && (
                <Button variant="outline" onClick={handleCancelEdit} className="cursor-pointer">
                  Отмена
                </Button>
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="categories">
        <div className="max-w-lg space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Новая категория"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void addCategory()
              }}
            />
            <Button className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white" onClick={() => void addCategory()}>
              <Plus className="w-4 h-4 mr-1" />
              Добавить
            </Button>
          </div>
          <div className="rounded-lg border divide-y">
            {categories.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Категорий пока нет</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-3 py-2">
                  <span>{cat.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-600 cursor-pointer"
                    onClick={() => void removeCategory(cat.id)}
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </TabsContent>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, flower: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {(deleteDialog.flower?.stock ?? 0) > 0 ? 'Нельзя удалить товар' : 'Удалить товар?'}
            </DialogTitle>
            <DialogDescription>
              {(deleteDialog.flower?.stock ?? 0) > 0 ? (
                <>
                  У «{deleteDialog.flower?.name}» остаток {deleteDialog.flower?.stock} шт.
                  Полностью удалить можно только при нулевом остатке — сначала продайте или спишите.
                  {deleteDialog.flower?.active ? ' Можно скрыть товар с витрины.' : ''}
                </>
              ) : (
                <>
                  Товар «{deleteDialog.flower?.name}» будет удалён из каталога навсегда.
                  История заказов и приходов сохранится по названию.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, flower: null })}
              className="cursor-pointer"
            >
              Отмена
            </Button>
            {(deleteDialog.flower?.stock ?? 0) > 0 ? (
              deleteDialog.flower?.active ? (
                <Button
                  variant="secondary"
                  onClick={() => void handleHideInsteadOfDelete()}
                  className="cursor-pointer"
                >
                  <EyeOff className="w-4 h-4 mr-1" />
                  Скрыть с витрины
                </Button>
              ) : null
            ) : (
              <Button variant="destructive" onClick={() => void handleDelete()} className="cursor-pointer">
                <Trash2 className="w-4 h-4 mr-1" />
                Удалить
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
