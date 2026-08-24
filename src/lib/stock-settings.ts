export const DEFAULT_TARGET_STOCK = 20
export const DEFAULT_LOW_STOCK_PERCENT = 25

export type StockSettings = {
  targetStock: number
  lowStockPercent: number
  threshold: number
}

export function computeStockSettings(targetStock: number, lowStockPercent: number): StockSettings {
  const target = Number.isFinite(targetStock) ? Math.max(1, Math.round(targetStock)) : DEFAULT_TARGET_STOCK
  const percent = Number.isFinite(lowStockPercent)
    ? Math.min(100, Math.max(1, Math.round(lowStockPercent)))
    : DEFAULT_LOW_STOCK_PERCENT
  return {
    targetStock: target,
    lowStockPercent: percent,
    threshold: Math.max(0, Math.floor((target * percent) / 100)),
  }
}
