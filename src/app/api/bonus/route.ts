import { getBonusBalance, getBonusSettings } from '@/lib/bonus-store'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const settings = await getBonusSettings()
    const phone = req.nextUrl.searchParams.get('phone') || ''
    const balance = phone ? await getBonusBalance(phone) : 0
    return NextResponse.json({
      enabled: settings.enabled,
      percent: settings.percent,
      balance,
    })
  } catch (error) {
    console.error('Public bonus error:', error)
    return NextResponse.json({ enabled: false, percent: 0, balance: 0 })
  }
}
