import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'

type SortValue = 'newest' | 'oldest' | 'rating' | 'title'
type StatusFilterValue = 'all' | 'completed' | 'reading' | 'planned' | 'abandoned'

interface FiltersProps {
  search: string
  setSearch: (value: string) => void
  sort: SortValue
  setSort: (value: SortValue) => void
  statusFilter: StatusFilterValue
  setStatusFilter: (value: StatusFilterValue) => void
}

const sortOptions: { value: SortValue; label: string }[] = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
  { value: 'rating', label: 'По оценке' },
  { value: 'title', label: 'По названию' },
]

const statusOptions: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'completed', label: 'Прочитано' },
  { value: 'reading', label: 'Читаю' },
  { value: 'planned', label: 'В планах' },
  { value: 'abandoned', label: 'Брошено' },
]

const statusLabels: Record<StatusFilterValue, string> = {
  all: 'Все',
  completed: 'Прочитано',
  reading: 'Читаю',
  planned: 'В планах',
  abandoned: 'Брошено',
}

export function Filters({
  search,
  setSearch,
  sort,
  setSort,
  statusFilter,
  setStatusFilter,
}: FiltersProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative w-full min-w-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск по названию или автору..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="flex w-full flex-col gap-3">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortValue)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div ref={dropdownRef} className="relative w-full">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-left flex items-center justify-between hover:border-slate-400 transition-all"
          >
            <span>{statusLabels[statusFilter]}</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className={`dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
              {statusOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    setStatusFilter(opt.value)
                    setDropdownOpen(false)
                  }}
                  className={`dropdown-item ${statusFilter === opt.value ? 'active' : ''}`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
