export type ParsedInboundRow = {
  line: number
  name: string
  quantity: number
  costPrice: number | null
}

const NAME_HEADERS = [
  'название',
  'наименование',
  'товар',
  'номенклатура',
  'цветок',
  'позиция',
  'name',
  'product',
  'item',
]

const COST_HEADERS = [
  'закупочная',
  'закупк',
  'себестоимость',
  'cost',
  'purchase',
]

const QTY_HEADERS = [
  'количество',
  'кол-во',
  'колво',
  'кол',
  'qty',
  'quantity',
  'шт',
  'штук',
]

function decodeBuffer(buffer: Buffer) {
  const utf8 = buffer.toString('utf8')
  if (utf8.charCodeAt(0) === 0xfeff) return utf8.slice(1)
  if (utf8.includes('\u0000')) return buffer.toString('utf16le').replace(/^\uFEFF/, '')
  return utf8
}

function detectDelimiter(headerLine: string) {
  const commas = (headerLine.match(/,/g) || []).length
  const semis = (headerLine.match(/;/g) || []).length
  const tabs = (headerLine.match(/\t/g) || []).length
  if (tabs > commas && tabs > semis) return '\t'
  if (semis > commas) return ';'
  return ','
}

function parseDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current.trim())
  return cells
}

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function headerIndex(headers: string[], candidates: string[]) {
  return headers.findIndex((header) =>
    candidates.some((candidate) => header === candidate || header.includes(candidate))
  )
}

function parseQuantity(value: string) {
  const cleaned = value.replace(/\s/g, '').replace(',', '.')
  const match = cleaned.match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const qty = Math.round(Number(match[1]))
  return Number.isFinite(qty) && qty > 0 ? qty : null
}

function parseMoney(value: string) {
  const cleaned = value.replace(/\s/g, '').replace(',', '.')
  const match = cleaned.match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const amount = Number(match[1])
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

function costHeaderIndex(headers: string[]) {
  const specific = headerIndex(headers, COST_HEADERS)
  if (specific >= 0) return specific
  return headers.findIndex(
    (header) =>
      header.includes('цена') && !header.includes('рознич') && !header.includes('продаж')
  )
}

function looksLikeHeader(cells: string[]) {
  const joined = cells.map(normalizeHeader).join(' ')
  return NAME_HEADERS.some((h) => joined.includes(h)) && QTY_HEADERS.some((h) => joined.includes(h))
}

export function parseCsvInbound(text: string): ParsedInboundRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) return []

  const delimiter = detectDelimiter(lines[0])
  const rows = lines.map((line) => parseDelimitedLine(line, delimiter))
  let start = 0
  let nameIdx = 0
  let qtyIdx = 1
  let costIdx = -1

  if (looksLikeHeader(rows[0])) {
    const headers = rows[0].map(normalizeHeader)
    const foundName = headerIndex(headers, NAME_HEADERS)
    const foundQty = headerIndex(headers, QTY_HEADERS)
    if (foundName >= 0) nameIdx = foundName
    if (foundQty >= 0) qtyIdx = foundQty
    costIdx = costHeaderIndex(headers)
    start = 1
  } else if (rows[0].length === 1) {
    qtyIdx = -1
  } else if (rows[0].length >= 3) {
    costIdx = 2
  }

  const parsed: ParsedInboundRow[] = []

  for (let i = start; i < rows.length; i++) {
    const cells = rows[i]
    const name = (cells[nameIdx] || '').replace(/^["']|["']$/g, '').trim()
    if (!name || /^итого/i.test(name)) continue

    let quantity: number | null = null
    if (qtyIdx >= 0 && cells[qtyIdx]) {
      quantity = parseQuantity(cells[qtyIdx])
    }
    if (quantity == null) {
      const fallback = cells.find((cell, idx) => idx !== nameIdx && parseQuantity(cell) != null)
      quantity = fallback ? parseQuantity(fallback) : null
    }
    if (quantity == null) continue

    const costPrice =
      costIdx >= 0 && cells[costIdx] ? parseMoney(cells[costIdx]) : null

    parsed.push({ line: i + 1, name, quantity, costPrice })
  }

  return parsed
}

export async function parseInboundFile(buffer: Buffer, fileName: string): Promise<ParsedInboundRow[]> {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.ods')) {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return []
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName], { FS: ';' })
    return parseCsvInbound(csv)
  }

  return parseCsvInbound(decodeBuffer(buffer))
}
