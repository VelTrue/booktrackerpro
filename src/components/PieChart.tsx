import type { Book } from '../types'
import { useEffectiveStatusColors } from '../store/settingsStore'

interface PieChartProps {
  books: Book[]
}

type StatusKey = Book['status']

interface Segment {
  status: StatusKey
  label: string
}

const segments: Segment[] = [
  { status: 'completed', label: 'Прочитано' },
  { status: 'reading', label: 'Читаю' },
  { status: 'planned', label: 'В планах' },
  { status: 'abandoned', label: 'Брошено' },
]

export function PieChart({ books }: PieChartProps) {
  const statusColors = useEffectiveStatusColors()
  const total = books.length

  const counts: Record<StatusKey, number> = {
    completed: 0,
    reading: 0,
    planned: 0,
    abandoned: 0,
  }

  for (const book of books) {
    counts[book.status]++
  }

  const cx = 100
  const cy = 100
  const r = 75
  let offset = 0
  const circumference = 2 * Math.PI * r

  return (
    <div className="dash-card p-6 mb-6" style={{ animationDelay: '0.3s' }}>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">Соотношение статусов</h3>
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="pie-chart-container">
          <svg width={200} height={200} viewBox="0 0 200 200">
            {total > 0 ? (
              segments.map((seg) => {
                const count = counts[seg.status]
                if (count === 0) return null
                const percentage = count / total
                const dashArray = percentage * circumference
                const currentOffset = offset
                offset += dashArray
                return (
                  <circle
                    key={seg.status}
                    className="pie-segment"
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"

                    stroke={statusColors[seg.status]}
                    strokeWidth="22"
                    strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                    strokeDashoffset={-currentOffset}
                    transform={`rotate(-90 ${cx} ${cy})`}
                  />
                )
              })
            ) : (
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="22" />
            )}
            <circle cx={cx} cy={cy} r={55} fill="var(--card-bg)" />
          </svg>
          <div className="pie-center">
            <div className="text-3xl font-bold text-slate-900">{total}</div>
            <div className="text-xs text-slate-400">книг</div>
          </div>
        </div>
        <div className="flex flex-col gap-3 min-w-[160px]">
          {total > 0 ? (
            segments.map((seg) => {
              const count = counts[seg.status]
              const percent = total > 0 ? Math.round((count / total) * 100) : 0
              return count > 0 ? (
                <div key={seg.status} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: statusColors[seg.status] }} />
                  <span className="text-sm text-slate-600">{seg.label}</span>
                  <span className="text-sm font-semibold text-slate-900 ml-auto">{count}</span>
                  <span className="text-xs text-slate-400 w-10 text-right">{percent}%</span>
                </div>
              ) : null
            })
          ) : (
            <p className="text-sm text-slate-400">Нет данных</p>
          )}
        </div>
      </div>
    </div>
  )
}
