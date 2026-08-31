import { db } from '@/lib/db'
import { DEFAULT_ZONE, normalizeDeliveryZone, type DeliveryZone } from '@/lib/geo'

const ZONE_KEY = 'deliveryZone'

export async function getDeliveryZone(): Promise<DeliveryZone> {
  const row = await db.shopSetting.findUnique({ where: { key: ZONE_KEY } })
  if (!row?.value) return DEFAULT_ZONE
  try {
    return normalizeDeliveryZone(JSON.parse(row.value))
  } catch {
    return DEFAULT_ZONE
  }
}

export async function saveDeliveryZone(input: unknown): Promise<DeliveryZone> {
  const next = normalizeDeliveryZone(input)
  await db.shopSetting.upsert({
    where: { key: ZONE_KEY },
    create: { key: ZONE_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  })
  return next
}
