import { requireAdmin } from '@/lib/admin-auth'
import { setBonusBalance } from '@/lib/bonus-store'
import { normalizePhone } from '@/lib/bonus'
import { listClients } from '@/lib/clients'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { phone } = await params
    const key = normalizePhone(phone)
    if (!key) return NextResponse.json({ error: 'Некорректный телефон' }, { status: 400 })
    const client = (await listClients()).find((row) => row.phone === key)
    if (!client) return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    return NextResponse.json(client)
  } catch (error) {
    console.error('Client load error:', error)
    return NextResponse.json({ error: 'Failed to load client' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const { phone } = await params
    const body = await req.json()
    const balance = await setBonusBalance(phone, Number(body.balance))
    return NextResponse.json({ phone: normalizePhone(phone), balance })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_PHONE') {
      return NextResponse.json({ error: 'Некорректный телефон' }, { status: 400 })
    }
    console.error('Client bonus save error:', error)
    return NextResponse.json({ error: 'Failed to save bonus' }, { status: 500 })
  }
}
