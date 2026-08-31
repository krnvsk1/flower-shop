import { db } from '@/lib/db'
import {
  normalizePromo,
  overlappingFlowerId,
  parsePromoList,
  type PromoConfig,
} from '@/lib/promo'

const PROMO_KEY = 'promo'

export async function getPromos(): Promise<PromoConfig[]> {
  const row = await db.shopSetting.findUnique({ where: { key: PROMO_KEY } })
  if (!row?.value) return []
  try {
    return parsePromoList(JSON.parse(row.value))
  } catch {
    return []
  }
}

async function persist(promos: PromoConfig[]): Promise<PromoConfig[]> {
  const overlap = overlappingFlowerId(promos)
  if (overlap) throw new Error('OVERLAP')
  await db.shopSetting.upsert({
    where: { key: PROMO_KEY },
    create: { key: PROMO_KEY, value: JSON.stringify(promos) },
    update: { value: JSON.stringify(promos) },
  })
  return promos
}

function assertPromo(input: unknown, id: string): PromoConfig {
  const next = normalizePromo(input, id)
  if (!next.title) throw new Error('TITLE_REQUIRED')
  if (next.flowerIds.length === 0) throw new Error('FLOWERS_REQUIRED')
  return { ...next, id }
}

export async function createPromo(input: unknown): Promise<PromoConfig> {
  const current = await getPromos()
  const created = assertPromo(input, crypto.randomUUID())
  return (await persist([...current, created])).find((promo) => promo.id === created.id)!
}

export async function updatePromo(id: string, input: unknown): Promise<PromoConfig> {
  const current = await getPromos()
  if (!current.some((promo) => promo.id === id)) throw new Error('NOT_FOUND')
  const updated = assertPromo(input, id)
  const next = current.map((promo) => (promo.id === id ? updated : promo))
  await persist(next)
  return updated
}

export async function deletePromo(id: string): Promise<void> {
  const current = await getPromos()
  if (!current.some((promo) => promo.id === id)) throw new Error('NOT_FOUND')
  await persist(current.filter((promo) => promo.id !== id))
}
