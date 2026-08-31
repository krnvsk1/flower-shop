import { requireAdmin } from '@/lib/admin-auth'
import { listClients } from '@/lib/clients'
import { NextResponse } from 'next/server'

export async function GET() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  try {
    const clients = await listClients()
    return NextResponse.json(
      clients.map(({ orders, ...row }) => ({
        ...row,
        lastAddress: row.addresses[0] ?? null,
      }))
    )
  } catch (error) {
    console.error('Clients list error:', error)
    return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 })
  }
}
