export interface BookCandidate {
  id: string
  title: string
  authors: string[]
  coverUrl?: string
  rawCategories: string[]
}

export class BookSearchError extends Error {}

const ENDPOINT = 'https://www.googleapis.com/books/v1/volumes'
const MAX_CANDIDATES = 3
const TIMEOUT_MS = 8000
const CACHE_KEY = 'bookTracker_googleBooksCache'
const CACHE_LIMIT = 300
const RETRY_DELAYS_MS = [1000, 2000]
const MIN_REQUEST_INTERVAL_MS = 600

let lastRequestAt = 0

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

function upgradeToHttps(url: string): string {
  return url.replace(/^http:\/\//, 'https://')
}

// Простой FIFO-кэш результатов поиска в localStorage.
// Ограничен по размеру (CACHE_LIMIT), старые записи вытесняются.
function loadCache(): Record<string, BookCandidate[]> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, BookCandidate[]>
  } catch {
    return {}
  }
}

function saveCacheEntry(key: string, value: BookCandidate[]): void {
  const cache = loadCache()
  cache[key] = value
  const keys = Object.keys(cache)
  if (keys.length > CACHE_LIMIT) {
    // Вытесняем самые старые записи
    const toRemove = keys.length - CACHE_LIMIT
    for (let i = 0; i < toRemove; i++) {
      delete cache[keys[i]]
    }
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage может быть переполнен — просто пропускаем
  }
}

function normalizeTitleForCache(s: string): string {
  return s.trim().toLowerCase()
}

interface GoogleBooksItem {
  id: string
  volumeInfo?: {
    title?: string
    authors?: string[]
    categories?: string[]
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
  }
}

interface GoogleBooksResponse {
  items?: GoogleBooksItem[]
}

export async function searchBookMetadata(
  title: string,
  author?: string,
  externalSignal?: AbortSignal,
): Promise<BookCandidate[]> {
  const titleQuery = title.trim()
  if (!titleQuery) return []

  // Свободный текстовый запрос (а не intitle:/inauthor:) находит переводные
  // издания надёжнее, чем строгий поиск по конкретному полю.
  const searchText = author?.trim() ? `${titleQuery} ${author.trim()}` : titleQuery
  const cacheKey = `${normalizeTitleForCache(titleQuery)}::${(author ?? '').trim().toLowerCase()}`
  const cached = loadCache()[cacheKey]
  if (cached?.length) {
    return cached
  }

  const params = new URLSearchParams({
    q: searchText,
    maxResults: '8',
  })
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
  if (apiKey) params.set('key', apiKey)
  const url = `${ENDPOINT}?${params.toString()}`

  const controller = new AbortController()
  externalSignal?.addEventListener('abort', () => controller.abort())

  // Не даём двум запросам уйти впритык друг к другу — это само по себе
  // провоцирует 429 при быстрых повторных поисках.
  const sinceLastRequest = Date.now() - lastRequestAt
  if (sinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - sinceLastRequest, controller.signal)
  }

  let res: Response
  let attempt = 0
  for (;;) {
    lastRequestAt = Date.now()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      res = await fetch(url, { signal: controller.signal })
    } catch {
      throw new BookSearchError('Не удалось выполнить поиск. Проверьте соединение')
    } finally {
      clearTimeout(timer)
    }

    const isRetryable = res.status === 429 || res.status >= 500
    if (isRetryable && attempt < RETRY_DELAYS_MS.length) {
      await sleep(RETRY_DELAYS_MS[attempt], controller.signal)
      attempt++
      continue
    }
    break
  }

  if (res.status === 429) {
    if (cached?.length) {
      return cached
    }
    throw new BookSearchError('Слишком много запросов. Попробуйте позже')
  }
  if (!res.ok) {
    if (cached?.length) {
      return cached
    }
    throw new BookSearchError('Сервис книг временно недоступен')
  }

  let data: GoogleBooksResponse
  try {
    data = (await res.json()) as GoogleBooksResponse
  } catch {
    throw new BookSearchError('Некорректный ответ сервера')
  }

  const items = data.items ?? []
  const candidates: BookCandidate[] = items
    .filter((it) => it.volumeInfo?.title)
    .map((it) => {
      const info = it.volumeInfo!
      const raw = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail
      return {
        id: it.id,
        title: info.title!,
        authors: info.authors ?? [],
        coverUrl: raw ? upgradeToHttps(raw) : undefined,
        rawCategories: info.categories ?? [],
      }
    })

  const withCoverOnly = candidates.filter((c) => c.coverUrl)
  const pool = withCoverOnly.length > 0 ? withCoverOnly : candidates
  const result = pool.slice(0, MAX_CANDIDATES)
  if (result.length > 0) {
    saveCacheEntry(cacheKey, result)
  }
  return result
}

