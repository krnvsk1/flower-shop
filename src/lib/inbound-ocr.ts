import type { ParsedInboundRow } from './inbound-parse'
import { parseMoney, parseQuantity } from './inbound-parse'

export type InboundOcrSource = 'vision' | 'ocr'

export type InboundOcrResult = {
  rows: ParsedInboundRow[]
  source: InboundOcrSource
  rawText?: string
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i

const VISION_PROMPT = `Ты распознаёшь российскую приходную накладную (фото или скан).
Извлеки только товарные позиции: название, количество и закупочную цену за единицу, если она есть.
Игнорируй шапку, реквизиты, итоговые суммы, НДС, подписи и пустые строки.
Ответь строго JSON без markdown:
{"items":[{"name":"строка","quantity":1,"costPrice":null}]}
quantity — целое число > 0. costPrice — число или null.`

function ocrApiKey() {
  return process.env.INBOUND_OCR_API_KEY || process.env.OPENAI_API_KEY || ''
}

function ocrBaseUrl() {
  return (
    process.env.INBOUND_OCR_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    'https://api.openai.com/v1'
  ).replace(/\/$/, '')
}

function ocrModel() {
  return process.env.INBOUND_OCR_MODEL || process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini'
}

export function isInboundImage(fileName: string) {
  return IMAGE_EXT.test(fileName)
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] || trimmed).trim()
  try {
    return JSON.parse(candidate)
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1))
    }
    throw new Error('Модель не вернула JSON')
  }
}

export function rowsFromVisionPayload(payload: unknown): ParsedInboundRow[] {
  const root = payload as { items?: unknown; rows?: unknown }
  const list = Array.isArray(root?.items)
    ? root.items
    : Array.isArray(root?.rows)
      ? root.rows
      : Array.isArray(payload)
        ? payload
        : null

  if (!list) return []

  const rows: ParsedInboundRow[] = []
  for (let i = 0; i < list.length; i++) {
    const item = list[i] as {
      name?: unknown
      title?: unknown
      product?: unknown
      quantity?: unknown
      qty?: unknown
      costPrice?: unknown
      price?: unknown
      cost?: unknown
    }
    const name = String(item?.name ?? item?.title ?? item?.product ?? '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!name || /^итого/i.test(name)) continue

    const quantityRaw = item?.quantity ?? item?.qty
    const quantity =
      typeof quantityRaw === 'number'
        ? Math.round(quantityRaw)
        : parseQuantity(String(quantityRaw ?? ''))
    if (quantity == null || quantity <= 0) continue

    const costRaw = item?.costPrice ?? item?.price ?? item?.cost
    let costPrice: number | null = null
    if (typeof costRaw === 'number' && Number.isFinite(costRaw) && costRaw >= 0) {
      costPrice = costRaw
    } else if (costRaw != null && String(costRaw).trim() !== '') {
      costPrice = parseMoney(String(costRaw))
    }

    rows.push({ line: i + 1, name, quantity, costPrice })
  }
  return rows
}

const UNIT_RE = /(?:шт\.?|штук|упак\.?|пучк(?:ов|ки)?|связ(?:ок|ка)?)/i
const SIZE_RE = /\d+(?:[.,]\d+)?\s*(?:см|мм|мл|г|кг)(?![A-Za-zА-Яа-яЁё])/gi
const HEADER_RE =
  /^(?:№|n|п\/п|наименование|номенклатура|товар|кол-?во|количество|цена|сумма|ед(?:\.|иница)?)$/i

function looksLikeOverlayJunk(line: string) {
  const cyrillic = line.match(/[А-Яа-яЁё]/g) || []
  if (cyrillic.length >= 3) return false
  return (
    /\d{1,2}:\d{2}/.test(line) ||
    /[®©™]/.test(line) ||
    /(?:\bwil\b|\bwifi\b|\bhdr\b|\biso\b)/i.test(line)
  )
}

function looksLikeJunkLine(line: string) {
  const lower = line.toLowerCase()
  return (
    /^(итого|всего|сумма|ндс|подпись|м\.п\.|инн|кпп|р\/с|бик|тел|дата|страница)/i.test(lower) ||
    /накладн|поставщик|покупатель|грузополучатель|договор|универсальн/.test(lower) ||
    looksLikeOverlayJunk(line)
  )
}

function stripClockAndDates(line: string) {
  return line
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
    .replace(/\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/g, ' ')
}

function looksLikeProductName(name: string) {
  if (!name || /[®©™]/.test(name) || /\d{1,2}:\d{2}/.test(name)) return false
  const cyrillic = name.match(/[А-Яа-яЁё]/g) || []
  if (cyrillic.length < 3) return false
  if (HEADER_RE.test(name)) return false
  if (/^(итого|всего)\b/i.test(name)) return false
  return true
}

function glueThousands(value: string) {
  let next = value
  let prev = ''
  while (next !== prev) {
    prev = next
    next = next.replace(
      /(?<![.,]\d{0,2})(\d)[ \u00a0](?=\d{3}(?:[.,]\d+)?(?:\s|$))/g,
      '$1'
    )
  }
  return next
}

function stripRowIndex(line: string) {
  return line.replace(/^\d{1,3}[\.)]\s+/, '').replace(/^№\s*\d+\s+/, '').trim()
}

function extractAmounts(line: string) {
  const stripped = stripClockAndDates(line)
  const skip = new Set<number>()
  const sizey = /\d+(?:[.,]\d+)?\s*(?:см|мм|мл|г|кг)(?![A-Za-zА-Яа-яЁё])/gi
  let sizeMatch: RegExpExecArray | null
  while ((sizeMatch = sizey.exec(stripped))) skip.add(sizeMatch.index)

  const amounts: number[] = []
  const numberRe = /\d+(?:[.,]\d+)?/g
  let match: RegExpExecArray | null
  while ((match = numberRe.exec(stripped))) {
    if (skip.has(match.index)) continue
    const value = Number(match[0].replace(',', '.'))
    if (Number.isFinite(value)) amounts.push(value)
  }
  return amounts
}

function extractName(line: string, quantity: number) {
  let name = line.replace(/^\d{1,3}[.)]\s+/, '')
  name = name
    .replace(new RegExp(`\\s*${UNIT_RE.source}\\s*`, 'gi'), ' ')
    .replace(/[₽]/g, ' ')
    .replace(/\b(?:руб\.?|р\.)\b/gi, ' ')
    .replace(/[–—_|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  while (/\s+\d+(?:[.,]\d+)?$/.test(name)) {
    name = name.replace(/\s+\d+(?:[.,]\d+)?$/, '').trim()
  }
  name = name.replace(new RegExp(`^${quantity}\\s+`), '').trim()
  name = name.replace(/^\d{1,3}\s+(?=[A-Za-zА-Яа-яЁё])/, '').trim()
  name = name.replace(/[-–—_|]+$/g, '').trim()
  return name
}

function plausibleQty(value: number) {
  const qty = Math.round(value)
  if (qty < 1 || qty > 5000) return false
  if (qty >= 2020 && qty <= 2035) return false
  return true
}

function pickQtyAndPrice(amounts: number[]): { quantity: number; costPrice: number | null } | null {
  const rounded = amounts.filter((value) => Number.isFinite(value))
  if (rounded.length === 0) return null

  if (rounded.length >= 3) {
    for (let i = 0; i < rounded.length; i++) {
      if (!plausibleQty(rounded[i])) continue
      for (let j = 0; j < rounded.length; j++) {
        if (i === j || rounded[j] <= 0) continue
        const product = rounded[i] * rounded[j]
        const hasSum = rounded.some(
          (value, k) => k !== i && k !== j && Math.abs(value - product) <= 1
        )
        if (hasSum) {
          return { quantity: Math.round(rounded[i]), costPrice: rounded[j] }
        }
      }
    }
  }

  const qtyFromUnit = rounded.find((value) => plausibleQty(value) && Number.isInteger(value))
  if (rounded.length >= 2 && qtyFromUnit != null) {
    const price = rounded.find((value) => value !== qtyFromUnit && value > 0) ?? null
    return { quantity: Math.round(qtyFromUnit), costPrice: price }
  }

  const only = rounded[0]
  if (only != null && plausibleQty(only)) {
    return { quantity: Math.round(only), costPrice: rounded[1] ?? null }
  }
  return null
}

function parseTableLine(line: string, lineNo: number): ParsedInboundRow | null {
  if (looksLikeJunkLine(line) || HEADER_RE.test(line)) return null

  const cleaned = glueThousands(stripRowIndex(line.replace(SIZE_RE, ' ').replace(/\s+/g, ' ').trim()))
  if (cleaned.length < 2) return null

  const unitQty =
    cleaned.match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${UNIT_RE.source}`, 'i')) ||
    cleaned.match(new RegExp(`${UNIT_RE.source}\\s+(\\d+(?:[.,]\\d+)?)`, 'i'))

  let picked = pickQtyAndPrice(extractAmounts(cleaned))
  if (unitQty) {
    const unitValue = parseQuantity(unitQty[1])
    if (unitValue != null && plausibleQty(unitValue)) {
      const amounts = extractAmounts(cleaned)
      const price =
        amounts.find(
          (value, idx) =>
            value !== unitValue &&
            value >= 1 &&
            !(idx === 0 && value <= 40 && amounts.length >= 3)
        ) ?? null
      picked = { quantity: unitValue, costPrice: price }
    }
  }
  if (!picked) return null

  const name = extractName(stripClockAndDates(line), picked.quantity)
  if (!looksLikeProductName(name)) {
    return null
  }

  return {
    line: lineNo,
    name,
    quantity: picked.quantity,
    costPrice: picked.costPrice,
  }
}

function joinBrokenLines(lines: string[]) {
  const merged: string[] = []
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    const hasLetters = /[А-Яа-яЁё]/.test(line)
    const amounts = extractAmounts(line.replace(SIZE_RE, ' '))
    if (hasLetters && !looksLikeJunkLine(line) && amounts.length === 0) {
      const extras: string[] = []
      while (i + 1 < lines.length && /^\d+(?:[.,]\d+)?(?:\s*(?:шт\.?|штук))?$/.test(lines[i + 1])) {
        extras.push(lines[i + 1])
        i++
        if (extras.length >= 3) break
      }
      if (extras.length > 0) line = `${line} ${extras.join(' ')}`
    }
    merged.push(line)
  }
  return merged
}

function parseOcrLines(text: string): ParsedInboundRow[] {
  const lines = joinBrokenLines(
    text
      .split(/\r?\n/)
      .map((line) => glueThousands(line.replace(/\s+/g, ' ').trim()))
      .filter((line) => line.length >= 2 && !looksLikeOverlayJunk(line))
  )

  const rows: ParsedInboundRow[] = []
  const seen = new Set<string>()
  for (let i = 0; i < lines.length; i++) {
    const row = parseTableLine(lines[i], i + 1)
    if (!row) continue
    const key = `${row.name.toLowerCase()}|${row.quantity}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push(row)
  }
  return rows
}

/** Heuristic parser for OCR text from Russian flower invoices. */
export function parseOcrTextToRows(text: string): ParsedInboundRow[] {
  const normalized = glueThousands(
    text
      .replace(/\u00a0/g, ' ')
      .replace(/[|]/g, ' ')
      .replace(/[–—]/g, '-')
  )
  const fromLines = parseOcrLines(normalized)
  if (fromLines.length > 0) return fromLines

  const collapsed = normalized.replace(/\s+/g, ' ').trim()
  if (!collapsed) return []
  return parseOcrLines(collapsed.replace(new RegExp(`(${UNIT_RE.source})`, 'gi'), '$1\n'))
}

async function prepareImage(buffer: Buffer) {
  try {
    const sharp = (await import('sharp')).default
    const image = sharp(buffer).rotate()
    const meta = await image.metadata()
    const width = meta.width || 0
    const shouldUpscale = width > 0 && width < 1400
    return await image
      .resize({
        width: shouldUpscale ? 2200 : Math.min(width || 2200, 2600),
        height: 2600,
        fit: 'inside',
        withoutEnlargement: !shouldUpscale,
      })
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer()
  } catch {
    return buffer
  }
}

async function recognizeWithOpenAi(
  image: Buffer,
  mimeType: string
): Promise<ParsedInboundRow[]> {
  const apiKey = ocrApiKey()
  if (!apiKey) throw new Error('NO_OPENAI')

  const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${image.toString('base64')}`
  const response = await fetch(`${ocrBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: ocrModel(),
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: VISION_PROMPT },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Vision API ${response.status}: ${body.slice(0, 240)}`)
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = json.choices?.[0]?.message?.content
  if (!content) throw new Error('Пустой ответ vision-модели')
  return rowsFromVisionPayload(extractJsonObject(content))
}

async function recognizeWithZai(image: Buffer, mimeType: string): Promise<ParsedInboundRow[]> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()
  const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${image.toString('base64')}`
  const body: {
    messages: {
      role: 'user'
      content: (
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
      )[]
    }[]
    thinking: { type: 'disabled' }
    model?: string
  } = {
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: VISION_PROMPT },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  }
  if (process.env.INBOUND_OCR_MODEL) {
    body.model = process.env.INBOUND_OCR_MODEL
  }

  const response = await zai.chat.completions.createVision(body as never)
  const content = response?.choices?.[0]?.message?.content
  if (!content) throw new Error('Пустой ответ ZAI vision')
  return rowsFromVisionPayload(extractJsonObject(String(content)))
}

async function recognizeWithTesseract(image: Buffer): Promise<{ rows: ParsedInboundRow[]; rawText: string }> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(['rus', 'eng'])
  const texts: string[] = []
  try {
    const { data: first } = await worker.recognize(image)
    texts.push(first.text || '')
    let rows = parseOcrTextToRows(texts[0])
    if (rows.length === 0) {
      await worker.setParameters({
        tessedit_pageseg_mode: '6',
        preserve_interword_spaces: '1',
      })
      const { data: second } = await worker.recognize(image)
      texts.push(second.text || '')
      rows = parseOcrTextToRows(second.text || '')
      if (rows.length === 0) {
        rows = parseOcrTextToRows(texts.join('\n'))
      }
    }
    const rawText = texts.filter(Boolean).join('\n').trim()
    return { rows, rawText }
  } finally {
    await worker.terminate()
  }
}

export async function recognizeInboundImage(
  buffer: Buffer,
  fileName: string,
  mimeType = 'image/jpeg'
): Promise<InboundOcrResult> {
  const image = await prepareImage(buffer)
  const errors: string[] = []

  if (ocrApiKey()) {
    try {
      const rows = await recognizeWithOpenAi(image, mimeType.startsWith('image/') ? mimeType : 'image/jpeg')
      if (rows.length > 0) return { rows, source: 'vision' }
      errors.push('Vision API не нашла позиции')
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Vision API error')
    }
  }

  try {
    const rows = await recognizeWithZai(image, mimeType.startsWith('image/') ? mimeType : 'image/jpeg')
    if (rows.length > 0) return { rows, source: 'vision' }
    errors.push('ZAI vision не нашла позиции')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ZAI error'
    if (!/Configuration file not found/i.test(message)) {
      errors.push(message)
    }
  }

  try {
    const { rows, rawText } = await recognizeWithTesseract(image)
    if (rows.length > 0) return { rows, source: 'ocr', rawText }
    errors.push('Локальный OCR не нашёл строки с количеством')
    const snippet = rawText.replace(/\s+/g, ' ').trim().slice(0, 180)
    throw new Error(
      snippet
        ? `Не удалось разобрать позиции с фото. Распознано: «${snippet}». Нужны название и количество в каждой строке, либо загрузите CSV/Excel.`
        : 'Не удалось разобрать позиции с фото. Снимок слишком размытый — сфотографируйте таблицу ближе или загрузите CSV/Excel.'
    )
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Не удалось разобрать')) {
      throw error
    }
    errors.push(error instanceof Error ? error.message : 'OCR error')
  }

  throw new Error(
    errors[0]
      ? `Не удалось распознать накладную: ${errors[0]}`
      : 'Не удалось распознать накладную по фото'
  )
}
