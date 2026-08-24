const PRIVATE =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|0\.|169\.254\.)/i

export function unwrapImageUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  try {
    const parsed = new URL(trimmed)
    const params = parsed.searchParams
    const nested =
      params.get('imgurl') ||
      params.get('img_url') ||
      params.get('image_url') ||
      params.get('mediaurl')
    if (nested && /^https?:\/\//i.test(nested)) return nested

    const host = parsed.hostname.replace(/^www\./, '')
    if (host.includes('google.') && (parsed.pathname === '/url' || parsed.pathname.endsWith('/url'))) {
      const dest = params.get('url') || params.get('q')
      if (dest && /^https?:\/\//i.test(dest)) return dest
    }
    return trimmed
  } catch {
    return trimmed
  }
}

export function looksLikeDirectImage(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (PRIVATE.test(parsed.hostname)) return false
    if (/\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?|$)/i.test(parsed.pathname + parsed.search)) return true
    const host = parsed.hostname.replace(/^www\./, '')
    return /gstatic\.com|googleusercontent\.com|ggpht\.com|cloudinary\.com|imgur\.com|unsplash\.com|images\.unsplash\.com|twimg\.com|pinimg\.com|wikimedia\.org|shopify\.com|cloudfront\.net|flowwow-images\.com/.test(
      host
    )
  } catch {
    return false
  }
}

function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    if (PRIVATE.test(parsed.hostname)) return false
    return true
  } catch {
    return false
  }
}

function pickMeta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const prop = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      'i'
    )
    const propFlip = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      'i'
    )
    const match = html.match(prop) || html.match(propFlip)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

async function fetchOgImage(pageUrl: string): Promise<string | null> {
  if (!isSafeHttpUrl(pageUrl)) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    const type = res.headers.get('content-type') || ''
    if (type.startsWith('image/')) return res.url || pageUrl
    if (!type.includes('html')) return null
    const html = (await res.text()).slice(0, 80_000)
    const og = pickMeta(html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'])
    if (og) {
      const absolute = new URL(og, res.url || pageUrl).href
      return isSafeHttpUrl(absolute) ? absolute : null
    }
    return null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function resolveImageUrl(raw: string | null | undefined): Promise<string | null> {
  if (raw == null || String(raw).trim() === '') return null
  const unwrapped = unwrapImageUrl(String(raw))
  if (!isSafeHttpUrl(unwrapped)) return null
  if (looksLikeDirectImage(unwrapped)) return unwrapped
  const og = await fetchOgImage(unwrapped)
  return og
}
