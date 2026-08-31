export type PromoConfig = {
  id: string
  active: boolean
  title: string
  subtitle: string
  badge: string
  discountPercent: number
  flowerIds: string[]
}

export type PublicPromo = {
  id: string
  title: string
  subtitle: string
  badge: string
  discountPercent: number
}

export const DEFAULT_BADGE = 'Акция'

export function emptyPromo(): PromoConfig {
  return {
    id: '',
    active: true,
    title: '',
    subtitle: '',
    badge: DEFAULT_BADGE,
    discountPercent: 15,
    flowerIds: [],
  }
}

export function normalizePromo(raw: unknown, fallbackId = ''): PromoConfig {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const percent = Math.round(Number(row.discountPercent))
  const flowerIds = Array.isArray(row.flowerIds)
    ? row.flowerIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : []
  const id = typeof row.id === 'string' && row.id.trim() ? row.id.trim() : fallbackId
  return {
    id,
    active: Boolean(row.active),
    title: typeof row.title === 'string' ? row.title.trim() : '',
    subtitle: typeof row.subtitle === 'string' ? row.subtitle.trim() : '',
    badge: typeof row.badge === 'string' && row.badge.trim() ? row.badge.trim() : DEFAULT_BADGE,
    discountPercent: Number.isFinite(percent) ? Math.min(70, Math.max(1, percent)) : 15,
    flowerIds: [...new Set(flowerIds)],
  }
}

export function parsePromoList(raw: unknown): PromoConfig[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item, index) => normalizePromo(item, `legacy-${index}`))
      .filter((promo) => promo.id)
  }
  if (raw && typeof raw === 'object') {
    const row = raw as Record<string, unknown>
    if (Array.isArray(row.promos)) return parsePromoList(row.promos)
    const one = normalizePromo(row, 'legacy')
    if (one.title || one.flowerIds.length > 0) return [one]
  }
  return []
}

export function isPromoLive(promo: PromoConfig): boolean {
  return promo.active && promo.discountPercent > 0 && promo.title.length > 0 && promo.flowerIds.length > 0
}

export function findPromoForFlower(promos: PromoConfig[], flowerId: string): PromoConfig | null {
  return promos.find((promo) => isPromoLive(promo) && promo.flowerIds.includes(flowerId)) ?? null
}

export function saleUnitPrice(listPrice: number, promos: PromoConfig[], flowerId: string): number {
  const promo = findPromoForFlower(promos, flowerId)
  if (!promo) return listPrice
  return Math.max(1, Math.round((listPrice * (100 - promo.discountPercent)) / 100))
}

export function toPublicPromos(promos: PromoConfig[]): PublicPromo[] {
  return promos.filter(isPromoLive).map((promo) => ({
    id: promo.id,
    title: promo.title,
    subtitle: promo.subtitle,
    badge: promo.badge,
    discountPercent: promo.discountPercent,
  }))
}

export function occupiedFlowerIds(promos: PromoConfig[], exceptId?: string): Set<string> {
  const taken = new Set<string>()
  for (const promo of promos) {
    if (exceptId && promo.id === exceptId) continue
    for (const id of promo.flowerIds) taken.add(id)
  }
  return taken
}

export function overlappingFlowerId(promos: PromoConfig[]): string | null {
  const seen = new Set<string>()
  for (const promo of promos) {
    for (const id of promo.flowerIds) {
      if (seen.has(id)) return id
      seen.add(id)
    }
  }
  return null
}
