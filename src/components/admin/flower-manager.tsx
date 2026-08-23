'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
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

const CATEGORIES = [
  'Розы',
  'Тюльпаны',
  'Гвоздики',
  'Лилии',
  'Хризантемы',
  'Орхидеи',
  'Сезонные',
  'Композиции',
  'Другое',
]

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  imageUrl: '',
  category: '',
}

export function FlowerManager() {
  const [flowers, setFlowers] = useState<Flower[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tab, setTab] = useState('list')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; flower: Flower | null }>({
    open: false,
    flower: null,
  })

  const fetchFlowers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/flowers')
      if (res.ok) {
        setFlowers(await res.json())
      }
    } catch {
      toast.error('Ошибка загрузки товаров')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFlowers()
  }, [fetchFlowers])

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
      fetchFlowers()
    } catch {
      toast.error('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (flower: Flower) => {
    try {
      const res = await fetch(`/api/admin/flowers/${flower.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !flower.active }),
      })
      if (res.ok) {
        toast.success(flower.active ? 'Товар скрыт' : 'Товар активирован')
        fetchFlowers()
      }
    } catch {
      toast.error('Ошибка изменения статуса')
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
        fetchFlowers()
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
      </TabsList>

      {/* List Tab */}
      <TabsContent value="list">
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[160px]">Название</TableHead>
                  <TableHead className="min-w-[100px]">Категория</TableHead>
                  <TableHead className="min-w-[80px] text-right">Цена</TableHead>
                  <TableHead className="min-w-[70px] text-right">Остаток</TableHead>
                  <TableHead className="min-w-[90px] text-center">Статус</TableHead>
                  <TableHead className="min-w-[120px] text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-14 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : flowers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Нет товаров. Добавьте первый!
                    </TableCell>
                  </TableRow>
                ) : (
                  flowers.map((f) => (
                    <TableRow key={f.id} className={!f.active ? 'opacity-50' : ''}>
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
                      <TableCell className="text-right font-mono">
                        {f.price.toLocaleString('ru-RU')} ₽
                      </TableCell>
                      <TableCell className={`text-right font-mono ${f.stock <= 5 ? 'text-rose-600 font-semibold' : ''}`}>
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
                            onClick={() => handleToggleActive(f)}
                            title={f.active ? 'Скрыть' : 'Активировать'}
                          >
                            {f.active ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
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
      </TabsContent>

      {/* Add/Edit Tab */}
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
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
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
                onClick={handleSubmit}
                disabled={saving}
                className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {saving ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Добавить товар'}
              </Button>
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="cursor-pointer"
                >
                  Отмена
                </Button>
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Delete Confirmation Dialog */}
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
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
