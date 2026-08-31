import { toPublicPromos } from '@/lib/promo'
import { getPromos } from '@/lib/promo-store'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({ items: toPublicPromos(await getPromos()) })
  } catch (error) {
    console.error('Public promo error:', error)
    return NextResponse.json({ items: [] })
  }
}
