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

function looksLikeJunkLine(line: string) {
  const lower = line.toLowerCase()
  return (
    /^(итого|всего|сумма|ндс|подпись|м\.п\.|инн|кпп|р\/с|бик|тел)/i.test(lower) ||
    /накладн|поставщик|покупатель|грузополучатель|договор/.test(lower)
  )
}

/** Heuristic line parser for OCR text from Russian flower invoices. */
export function parseOcrTextToRows(text: string): ParsedInboundRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 3)

  const rows: ParsedInboundRow[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (looksLikeJunkLine(line)) continue

    // "25 Роза красная 120.00" — номер/кол-во в начале
    const leadingQty = line.match(
      /^(\d{1,5})[.)]?\s+(.+?)(?:\s+(\d+(?:[.,]\d{1,2})?)\s*(?:₽|руб\.?)?)?$/i
    )
    if (leadingQty) {
      const quantity = parseQuantity(leadingQty[1])
      const name = leadingQty[2].replace(/[–—-]+$/g, '').trim()
      const costPrice = leadingQty[3] ? parseMoney(leadingQty[3]) : null
      const nameHasDigitsOnly = /^\d+$/.test(name)
      if (
        name.length >= 2 &&
        quantity != null &&
        !nameHasDigitsOnly &&
        !looksLikeJunkLine(name) &&
        /[A-Za-zА-Яа-яЁё]/.test(name)
      ) {
        rows.push({ line: i + 1, name, quantity, costPrice })
        continue
      }
    }

    // "Название 25 120,50" or "Название — 25 шт × 120"
    const withQty = line.match(
      /^(.+?)\s+(\d{1,5})\s*(?:шт\.?|штук)?\s*(?:[xх×*]|по)?\s*(\d+(?:[.,]\d{1,2})?)?\s*(?:₽|руб\.?)?$/i
    )
    if (withQty) {
      const name = withQty[1]
        .replace(/^[\d.)\-]+\s*/, '')
        .replace(/[–—-]+$/g, '')
        .trim()
      const quantity = parseQuantity(withQty[2])
      const costPrice = withQty[3] ? parseMoney(withQty[3]) : null
      if (name.length >= 2 && quantity != null && !looksLikeJunkLine(name)) {
        rows.push({ line: i + 1, name, quantity, costPrice })
      }
    }
  }

  return rows
}

async function prepareImage(buffer: Buffer) {
  try {
    const sharp = (await import('sharp')).default
    return await sharp(buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
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
  try {
    const { data } = await worker.recognize(image)
    const rawText = data.text || ''
    return { rows: parseOcrTextToRows(rawText), rawText }
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
    if (rawText.trim()) {
      throw new Error(
        `Не удалось разобрать позиции с фото. Проверьте чёткость снимка или загрузите CSV/Excel.${errors.length ? ` (${errors[0]})` : ''}`
      )
    }
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
