export type BonusSettings = {
  enabled: boolean
  percent: number
}

export const DEFAULT_BONUS: BonusSettings = {
  enabled: true,
  percent: 5,
}

export function normalizeBonusSettings(raw: unknown): BonusSettings {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const percent = Math.round(Number(row.percent))
  return {
    enabled: row.enabled === undefined ? DEFAULT_BONUS.enabled : Boolean(row.enabled),
    percent: Number.isFinite(percent) ? Math.min(50, Math.max(0, percent)) : DEFAULT_BONUS.percent,
  }
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return `7${digits.slice(1)}`
  }
  if (digits.length === 10) return `7${digits}`
  return null
}

export function earnBonuses(paidAmount: number, percent: number): number {
  if (percent <= 0 || paidAmount <= 0) return 0
  return Math.floor((paidAmount * percent) / 100)
}

export function maxSpend(goodsTotal: number, balance: number): number {
  return Math.max(0, Math.min(Math.floor(balance), Math.floor(goodsTotal)))
}

export function formatPhone(normalized: string): string {
  if (normalized.length === 11 && normalized.startsWith('7')) {
    return `+7 ${normalized.slice(1, 4)} ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9)}`
  }
  return normalized
}
