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

function upgradeToHttps(url: string): string {
  return url.replace(/^http:\/\//, 'https://')
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
  const params = new URLSearchParams({
    q: searchText,
    maxResults: '8',
  })
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
  if (apiKey) params.set('key', apiKey)
  const url = `${ENDPOINT}?${params.toString()}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  externalSignal?.addEventListener('abort', () => controller.abort())

  let res: Response
  try {
    res = await fetch(url, { signal: controller.signal })
  } catch {
    throw new BookSearchError('Не удалось выполнить поиск. Проверьте соединение')
  } finally {
    clearTimeout(timer)
  }

  if (res.status === 429) {
    throw new BookSearchError('Слишком много запросов. Попробуйте позже')
  }
  if (!res.ok) {
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
  return pool.slice(0, MAX_CANDIDATES)
}
