import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import {
  DEFAULT_BONUS,
  earnBonuses,
  maxSpend,
  normalizeBonusSettings,
  normalizePhone,
  type BonusSettings,
} from '@/lib/bonus'

const ENABLED_KEY = 'bonusEnabled'
const PERCENT_KEY = 'bonusPercent'

export async function getBonusSettings(): Promise<BonusSettings> {
  const rows = await db.shopSetting.findMany({
    where: { key: { in: [ENABLED_KEY, PERCENT_KEY] } },
  })
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]))
  return normalizeBonusSettings({
    enabled: map[ENABLED_KEY] === undefined ? DEFAULT_BONUS.enabled : map[ENABLED_KEY] === '1',
    percent: map[PERCENT_KEY] === undefined ? DEFAULT_BONUS.percent : Number(map[PERCENT_KEY]),
  })
}

export async function saveBonusSettings(input: unknown): Promise<BonusSettings> {
  const next = normalizeBonusSettings(input)
  await db.$transaction([
    db.shopSetting.upsert({
      where: { key: ENABLED_KEY },
      create: { key: ENABLED_KEY, value: next.enabled ? '1' : '0' },
      update: { value: next.enabled ? '1' : '0' },
    }),
    db.shopSetting.upsert({
      where: { key: PERCENT_KEY },
      create: { key: PERCENT_KEY, value: String(next.percent) },
      update: { value: String(next.percent) },
    }),
  ])
  return next
}

export async function getBonusBalance(phone: string): Promise<number> {
  const key = normalizePhone(phone)
  if (!key) return 0
  const account = await db.customerBonus.findUnique({ where: { phone: key } })
  return account?.balance ?? 0
}

export async function setBonusBalance(phone: string, balance: number): Promise<number> {
  const key = normalizePhone(phone)
  if (!key) throw new Error('INVALID_PHONE')
  const next = Math.max(0, Math.round(Number(balance)))
  await db.customerBonus.upsert({
    where: { phone: key },
    create: { phone: key, balance: next },
    update: { balance: next },
  })
  return next
}

export async function applyBonuses(
  tx: Prisma.TransactionClient,
  opts: {
    phone: string
    goodsTotal: number
    spendRequested: number
    settings: BonusSettings
  }
) {
  const key = normalizePhone(opts.phone)
  const goodsTotal = Math.max(0, Math.round(opts.goodsTotal))
  if (!key || !opts.settings.enabled) {
    return { spent: 0, earned: 0, totalAmount: goodsTotal, phoneKey: key }
  }

  const account = await tx.customerBonus.findUnique({ where: { phone: key } })
  const balance = account?.balance ?? 0
  const spent = maxSpend(goodsTotal, Math.min(balance, Math.max(0, Math.floor(opts.spendRequested))))
  const paid = goodsTotal - spent
  const earned = earnBonuses(paid, opts.settings.percent)
  const nextBalance = balance - spent + earned

  await tx.customerBonus.upsert({
    where: { phone: key },
    create: { phone: key, balance: nextBalance },
    update: { balance: nextBalance },
  })

  return { spent, earned, totalAmount: paid, phoneKey: key }
}

export async function revertBonuses(
  tx: Prisma.TransactionClient,
  opts: { phone: string; spent: number; earned: number }
) {
  const key = normalizePhone(opts.phone)
  if (!key || (opts.spent <= 0 && opts.earned <= 0)) return
  const account = await tx.customerBonus.findUnique({ where: { phone: key } })
  const balance = account?.balance ?? 0
  const next = Math.max(0, balance + opts.spent - opts.earned)
  await tx.customerBonus.upsert({
    where: { phone: key },
    create: { phone: key, balance: next },
    update: { balance: next },
  })
}
