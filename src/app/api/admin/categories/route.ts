import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_CATEGORIES = [
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

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const count = await db.category.count()
    if (count === 0) {
      await db.category.createMany({
        data: DEFAULT_CATEGORIES.map((name) => ({ name })),
      })
    }

    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Fetch categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { name } = await req.json()
    const trimmed = typeof name === 'string' ? name.trim() : ''
    if (!trimmed) {
      return NextResponse.json({ error: 'Название категории обязательно' }, { status: 400 })
    }

    const category = await db.category.create({ data: { name: trimmed } })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Категория уже существует или ошибка сохранения' }, { status: 400 })
  }
}
