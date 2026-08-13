import { useState, useMemo } from 'react'
import type { Book } from '../types'
import { GENRES, type Genre } from '../constants/genres'
import { BookCard } from './BookCard'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface BookBrowserProps {
  books: Book[]
  onClose: () => void
  onDelete: (id: string) => void
  onEdit: (book: Book) => void
}

type StatusFilter = 'all' | Book['status']
type DateSort = 'newest' | 'oldest'
type TitleSort = 'asc' | 'desc'
type RatingFilter = number
type GenreFilter = 'all' | 'none' | Genre

const PER_PAGE = 10
const WINDOW = 10

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Все статусы' },
  { value: 'completed', label: 'Прочитано' },
  { value: 'reading', label: 'Читаю' },
  { value: 'planned', label: 'В планах' },
  { value: 'abandoned', label: 'Брошено' },
]

const ratingOptions: { value: RatingFilter; label: string }[] = [
  { value: 0, label: 'Любая оценка' },
  { value: 5, label: '5 ★' },
  { value: 4, label: '4 ★' },
  { value: 3, label: '3 ★' },
  { value: 2, label: '2 ★' },
  { value: 1, label: '1 ★' },
]

export function BookBrowser({ books, onClose, onDelete, onEdit }: BookBrowserProps) {
  useBodyScrollLock(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [genreFilter, setGenreFilter] = useState<GenreFilter>('all')
  const [dateSort, setDateSort] = useState<DateSort>('newest')
  const [titleSort, setTitleSort] = useState<TitleSort>('asc')
  const [rating, setRating] = useState<RatingFilter>(0)
  const [page, setPage] = useState(1)
  const [isJumpOpen, setIsJumpOpen] = useState(false)
  const [jumpValue, setJumpValue] = useState('')

  const filtered = useMemo(() => {
    let result: Book[] = [...books]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q),
      )
    }

    if (status !== 'all') {
      result = result.filter((b) => b.status === status)
    }

    if (genreFilter === 'none') {
      result = result.filter((b) => !b.genres || b.genres.length === 0)
    } else if (genreFilter !== 'all') {
      result = result.filter((b) => b.genres?.includes(genreFilter))
    }

    if (rating > 0) {
      result = result.filter((b) => b.rating === rating)
    }

    result.sort((a, b) => {
      const diff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return dateSort === 'newest' ? -diff : diff
    })

    result.sort((a, b) => {
      const diff = a.title.localeCompare(b.title, 'ru')
      return titleSort === 'asc' ? diff : -diff
    })

    return result
  }, [books, search, status, genreFilter, rating, dateSort, titleSort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(Math.max(1, page), totalPages)

  const start = Math.max(1, safePage - Math.floor(WINDOW / 2))
  let end = Math.min(totalPages, start + WINDOW - 1)
  const windowStart = Math.max(1, end - WINDOW + 1)

  const pageNumbers: number[] = []
  for (let p = windowStart; p <= end; p++) {
    pageNumbers.push(p)
  }

  const currentBooks = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE,
  )

  function goToPage(target: number) {
    setPage(Math.min(Math.max(1, target), totalPages))
  }

  function handleJumpSubmit() {
    const value = parseInt(jumpValue, 10)
    if (!Number.isNaN(value)) {
      goToPage(value)
    }
    setJumpValue('')
    setIsJumpOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl modal-enter">
        {/* Header + search */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Посмотреть добавленные</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pt-4">
          <input
            type="text"
            placeholder="Поиск по названию или автору..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 px-5 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Статус
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as StatusFilter)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 cursor-pointer"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Жанр
              </label>
              <select
                value={genreFilter}
                onChange={(e) => {
                  setGenreFilter(e.target.value as GenreFilter)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 cursor-pointer"
              >
                <option value="all">Все жанры</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
                <option value="none">Без жанра</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Дата
              </label>
              <select
                value={dateSort}
                onChange={(e) => {
                  setDateSort(e.target.value as DateSort)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 cursor-pointer"
              >
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Оценка
              </label>
              <select
                value={rating}
                onChange={(e) => {
                  setRating(Number(e.target.value))
                  setPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 cursor-pointer"
              >
                {ratingOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Название
              </label>
              <select
                value={titleSort}
                onChange={(e) => {
                  setTitleSort(e.target.value as TitleSort)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 cursor-pointer"
              >
                <option value="asc">А-Я</option>
                <option value="desc">Я-А</option>
              </select>
            </div>
          </div>
        </div>

        {/* Books list */}
        <div className="mx-5 mt-4 flex-1 overflow-y-auto rounded-xl border border-slate-200 p-3">
          {currentBooks.length === 0 ? (
            <p className="text-center text-slate-400 py-16">Ничего не найдено</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-200 px-5 py-4">
          <span className="text-sm text-slate-500">
            Показано {currentBooks.length} из {filtered.length}
            {totalPages > 1 && ` · стр. ${safePage} из ${totalPages}`}
          </span>

          {totalPages > 1 ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => goToPage(1)}
                disabled={safePage === 1}
                className="square-btn"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage === 1}
                className="square-btn"
              >
                ‹
              </button>

              {pageNumbers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  className={`square-btn ${p === safePage ? 'active' : ''}`}
                >
                  {p}
                </button>
              ))}

              {isJumpOpen ? (
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpValue}
                  autoFocus
                  onChange={(e) => setJumpValue(e.target.value)}
                  onBlur={handleJumpSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJumpSubmit()
                    if (e.key === 'Escape') {
                      setIsJumpOpen(false)
                      setJumpValue('')
                    }
                  }}
                  className="w-14 rounded-xl border border-slate-300 px-2 py-2 text-center text-sm outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsJumpOpen(true)}
                  className="square-btn"
                  title="Перейти на страницу"
                >
                  …
                </button>
              )}

              <button
                type="button"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages}
                className="square-btn"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => goToPage(totalPages)}
                disabled={safePage === totalPages}
                className="square-btn"
              >
                »
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button type="button" disabled className="square-btn active">
                1
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
