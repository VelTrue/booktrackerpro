import { GENRES, type Genre } from '../constants/genres'
import type { Book } from '../types'

export const NO_GENRE_LABEL = 'Без жанра'

export function getGenreCounts(books: Book[]): Record<Genre, number> {
  const counts = Object.fromEntries(GENRES.map((g) => [g, 0])) as Record<Genre, number>
  for (const book of books) {
    for (const genre of book.genres ?? []) {
      counts[genre]++
    }
  }
  return counts
}
