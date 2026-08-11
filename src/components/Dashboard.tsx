import type { Book } from '../types'
import { useEffectiveStatusColors } from '../store/settingsStore'

interface DashboardProps {
  books: Book[]
}

export function Dashboard({ books }: DashboardProps) {
  const statusColors = useEffectiveStatusColors()
  const items = [
    {
      key: 'total',
      count: books.length,
      label: 'Всего книг',
      dashClass: 'total',
      bg: 'bg-indigo-50',
      svgColor: 'text-indigo-600',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      key: 'completed',
      count: books.filter((b) => b.status === 'completed').length,
      label: 'Прочитано',
      dashClass: 'completed',
      bg: 'bg-emerald-50',
      svgColor: 'text-emerald-600',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      key: 'reading',
      count: books.filter((b) => b.status === 'reading').length,
      label: 'Читаю',
      dashClass: 'reading',
      bg: 'bg-blue-50',
      svgColor: 'text-blue-600',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      key: 'planned',
      count: books.filter((b) => b.status === 'planned').length,
      label: 'В планах',
      dashClass: 'planned',
      bg: 'bg-gray-100',
      svgColor: 'text-gray-500',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: 'abandoned',
      count: books.filter((b) => b.status === 'abandoned').length,
      label: 'Брошено',
      dashClass: 'abandoned',
      bg: 'bg-rose-50',
      svgColor: 'text-rose-600',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {items.map((item) => {
        const isStatus = item.key !== 'total'
        const statusColor = isStatus
          ? statusColors[item.key as keyof typeof statusColors]
          : undefined
        const iconStyle = statusColor
          ? { background: `${statusColor}26`, color: statusColor }
          : undefined
        return (
          <div key={item.key} className={`dash-card ${item.dashClass} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl ${isStatus ? '' : item.bg} flex items-center justify-center transition-transform hover:scale-110 ${isStatus ? '' : item.svgColor}`}
                style={iconStyle}
              >
                {item.svg}
              </div>
              <span className="text-2xl font-bold text-slate-900 stat-number">{item.count}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{item.label}</p>
          </div>
        )
      })}
    </div>
  )
}

