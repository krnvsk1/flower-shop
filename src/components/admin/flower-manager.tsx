'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'

type Flower = {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  imageUrl: string | null
  category: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

type Category = { id: string; name: string }

const emptyForm = {
  name: '',
  description: '',
  price: '',
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
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({})
  const [newCategory, setNewCategory] = useState('')

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

  useEffect(() => {
    void fetchFlowers()
    void fetchCategories()
  }, [fetchFlowers, fetchCategories])

  const handleSubmit = async () => {
    if (!form.name.trim() || form.price === '' || form.stock === '') {
      toast.error('Заполните название, цену и остаток')
      return
    }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
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

  const saveStock = async (flower: Flower) => {
    const raw = stockDrafts[flower.id]
    if (raw === undefined) return
    const next = parseInt(raw, 10)
    if (!Number.isInteger(next) || next < 0) {
      toast.error('Некорректный остаток')
      setStockDrafts((p) => {
        const copy = { ...p }
        delete copy[flower.id]
        return copy
      })
      return
    }
    if (next === flower.stock) {
      setStockDrafts((p) => {
        const copy = { ...p }
        delete copy[flower.id]
        return copy
      })
      return
    }
    try {
      await patchFlower(flower.id, { stock: next })
      toast.success(`Остаток «${flower.name}»: ${next}`)
    } catch {
      toast.error('Не удалось сохранить остаток')
    } finally {
      setStockDrafts((p) => {
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
      if (res.ok) {
        toast.success('Товар удалён (деактивирован)')
        void fetchFlowers()
      }
    } catch {
      toast.error('Ошибка удаления')
    } finally {
      setDeleteDialog({ open: false, flower: null })
    }
  }

  const handleEdit = (flower: Flower) => {
    setEditingId(flower.id)
    setForm({
      name: flower.name,
      description: flower.description ?? '',
      price: flower.price.toString(),
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

  const visibleFlowers = useMemo(
    () => (lowStockOnly ? flowers.filter((f) => f.stock <= 5) : flowers),
    [flowers, lowStockOnly]
  )

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
          <p className="text-sm text-rose-700 mb-3">
            Показаны только товары с остатком 5 шт. и меньше.
          </p>
        )}
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
                  <TableHead className="min-w-[160px]">Название</TableHead>
                  <TableHead className="min-w-[100px]">Категория</TableHead>
                  <TableHead className="min-w-[110px] text-right">Цена</TableHead>
                  <TableHead className="min-w-[90px] text-right">Остаток</TableHead>
                  <TableHead className="min-w-[90px] text-center">Статус</TableHead>
                  <TableHead className="min-w-[120px] text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : visibleFlowers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {flowers.length === 0
                        ? 'Нет товаров. Добавьте первый!'
                        : 'Нет товаров с низким остатком'}
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
                          className={`h-8 w-[80px] ml-auto text-right font-mono ${f.stock <= 5 ? 'text-rose-600 font-semibold' : ''}`}
                          value={stockDrafts[f.id] ?? String(f.stock)}
                          onChange={(e) =>
                            setStockDrafts((p) => ({ ...p, [f.id]: e.target.value }))
                          }
                          onBlur={() => void saveStock(f)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                          }}
                        />
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
          Цену и остаток можно менять прямо в таблице — сохраняется при уходе с поля.
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
                <Label htmlFor="flower-price">Цена (₽) *</Label>
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
                <Label htmlFor="flower-stock">Остаток *</Label>
                <Input
                  id="flower-stock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="50"
                  value={form.stock}
                  onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                />
              </div>
            </div>

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
                placeholder="https://example.com/flower.jpg"
                value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
              />
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
            <DialogTitle>Удалить товар?</DialogTitle>
            <DialogDescription>
              Товар &laquo;{deleteDialog.flower?.name}&raquo; будет деактивирован (скрыт с витрины). Это действие можно отменить, включив товар обратно.
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
            <Button variant="destructive" onClick={() => void handleDelete()} className="cursor-pointer">
              <Trash2 className="w-4 h-4 mr-1" />
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
