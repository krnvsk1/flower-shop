import { db } from '@/lib/db'
import {
  computeStockSettings,
  DEFAULT_LOW_STOCK_PERCENT,
  DEFAULT_TARGET_STOCK,
  type StockSettings,
} from '@/lib/stock-settings'

export async function getStockSettings(): Promise<StockSettings> {
  const rows = await db.shopSetting.findMany({
    where: { key: { in: ['targetStock', 'lowStockPercent'] } },
  })
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]))
  return computeStockSettings(
    Number(map.targetStock) || DEFAULT_TARGET_STOCK,
    Number(map.lowStockPercent) || DEFAULT_LOW_STOCK_PERCENT,
  )
}

export async function saveStockSettings(input: {
  targetStock: number
  lowStockPercent: number
}): Promise<StockSettings> {
  const next = computeStockSettings(input.targetStock, input.lowStockPercent)
  await db.$transaction([
    db.shopSetting.upsert({
      where: { key: 'targetStock' },
      create: { key: 'targetStock', value: String(next.targetStock) },
      update: { value: String(next.targetStock) },
    }),
    db.shopSetting.upsert({
      where: { key: 'lowStockPercent' },
      create: { key: 'lowStockPercent', value: String(next.lowStockPercent) },
      update: { value: String(next.lowStockPercent) },
    }),
  ])
  return next
}
