import type { ParsedInboundRow } from './inbound-parse'

export type CatalogFlower = {
  id: string
  name: string
  stock: number
}

export type MatchedInboundRow = ParsedInboundRow & {
  flowerId: string | null
  matchedName: string | null
  confidence: 'exact' | 'fuzzy' | 'none'
}

export function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/["«»„“]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[a.length][b.length]
}

export function matchInboundRows(
  rows: ParsedInboundRow[],
  flowers: CatalogFlower[]
): MatchedInboundRow[] {
  const catalog = flowers.map((flower) => ({
    ...flower,
    key: normalizeName(flower.name),
  }))

  return rows.map((row) => {
    const key = normalizeName(row.name)
    if (!key) {
      return { ...row, flowerId: null, matchedName: null, confidence: 'none' as const }
    }

    const exact = catalog.filter((flower) => flower.key === key)
    if (exact.length === 1) {
      return {
        ...row,
        flowerId: exact[0].id,
        matchedName: exact[0].name,
        confidence: 'exact' as const,
      }
    }

    const contains = catalog.filter(
      (flower) => flower.key.includes(key) || key.includes(flower.key)
    )
    if (contains.length === 1 && Math.min(contains[0].key.length, key.length) >= 4) {
      return {
        ...row,
        flowerId: contains[0].id,
        matchedName: contains[0].name,
        confidence: 'fuzzy' as const,
      }
    }

    const fuzzy = catalog
      .map((flower) => ({ flower, distance: levenshtein(flower.key, key) }))
      .filter(({ flower, distance }) => {
        const max = Math.max(flower.key.length, key.length)
        return distance <= (max <= 6 ? 1 : 2)
      })
      .sort((a, b) => a.distance - b.distance)

    if (fuzzy.length === 1 || (fuzzy.length > 1 && fuzzy[0].distance < fuzzy[1].distance)) {
      return {
        ...row,
        flowerId: fuzzy[0].flower.id,
        matchedName: fuzzy[0].flower.name,
        confidence: 'fuzzy' as const,
      }
    }

    return { ...row, flowerId: null, matchedName: null, confidence: 'none' as const }
  })
}
