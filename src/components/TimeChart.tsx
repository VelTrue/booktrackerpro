import { useState, useMemo } from 'react'
import { useSessionStore } from '../store/sessionStore'

type Range = 'week' | 'month' | 'year' | 'all'

const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

function getWeekDays(): { date: string; label: string }[] {
  const now = new Date()
  const nowDay = now.getDay()
  const diffToMonday = nowDay === 0 ? 6 : nowDay - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const days: { date: string; label: string }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    days.push({ date: `${yyyy}-${mm}-${dd}`, label: dayNames[i] })
  }
  return days
}

function getMonthWeeks(): { dateStart: string; dateEnd: string; label: string }[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const weeks: { dateStart: string; dateEnd: string; label: string }[] = []
  for (let d = 1; d <= daysInMonth; d += 7) {
    const start = d
    const end = Math.min(d + 6, daysInMonth)
    const mm = String(month + 1).padStart(2, '0')
    const startStr = `${year}-${mm}-${String(start).padStart(2, '0')}`
    const endStr = `${year}-${mm}-${String(end).padStart(2, '0')}`
    weeks.push({ dateStart: startStr, dateEnd: endStr, label: `${start}-${end}` })
  }
  return weeks
}

function getYearMonths(): { month: string; label: string }[] {
  const now = new Date()
  const year = now.getFullYear()
  const months: { month: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const mm = String(i + 1).padStart(2, '0')
    months.push({ month: `${year}-${mm}`, label: monthNames[i] })
  }
  return months
}

function getTotalYears(sessions: { date: string }[]): { year: string; label: string }[] {
  const now = new Date()
  const currentYear = String(now.getFullYear())
  const yearsSet = new Set<string>()

  // Добавляем все года из сессий
  sessions.forEach((s) => {
    const y = s.date.slice(0, 4)
    yearsSet.add(y)
  })

  // Текущий год всегда должен быть
  if (!yearsSet.has(currentYear)) {
    yearsSet.add(currentYear)
  }

  const sortedYears = [...yearsSet].sort()
  return sortedYears.map((y) => ({ year: y, label: y }))
}

function hoursWord(h: number): string {
  if (h % 10 === 1 && h % 100 !== 11) return 'час'
  if (h % 10 >= 2 && h % 10 <= 4 && (h % 100 < 10 || h % 100 >= 20)) return 'часа'
  return 'часов'
}

function formatDuration(minutes: number): string {
  if (minutes === 0) return '0 мин'
  if (minutes < 60) return `${minutes} мин`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h} ${hoursWord(h)}`
  return `${h} ${hoursWord(h)}, ${m} мин`
}

export function TimeChart() {
  const sessions = useSessionStore((s) => s.sessions)
  const [range, setRange] = useState<Range>('week')

  const { chartData, title } = useMemo(() => {
    switch (range) {
      case 'week': {
        const days = getWeekDays()
        return {
          chartData: days.map((d) => ({
            key: d.date,
            label: d.label,
            minutes: sessions.find((s) => s.date === d.date)?.minutes ?? 0,
          })),
          title: 'Эта неделя',
        }
      }
      case 'month': {
        const weeks = getMonthWeeks()
        return {
          chartData: weeks.map((w) => ({
            key: w.dateStart,
            label: w.label,
            minutes: sessions
              .filter((s) => s.date >= w.dateStart && s.date <= w.dateEnd)
              .reduce((sum, s) => sum + s.minutes, 0),
          })),
          title: 'Этот месяц',
        }
      }
      case 'year': {
        const months = getYearMonths()
        return {
          chartData: months.map((m) => ({
            key: m.month,
            label: m.label,
            minutes: sessions
              .filter((s) => s.date.startsWith(m.month))
              .reduce((sum, s) => sum + s.minutes, 0),
          })),
          title: 'Этот год',
        }
      }
      case 'all': {
        const years = getTotalYears(sessions)
        return {
          chartData: years.map((y) => ({
            key: y.year,
            label: y.label,
            minutes: sessions
              .filter((s) => s.date.startsWith(y.year))
              .reduce((sum, s) => sum + s.minutes, 0),
          })),
          title: 'Всего времени',
        }
      }
    }
  }, [sessions, range])

  const maxMinutes = Math.max(...chartData.map((d) => d.minutes), 1)
  const totalMinutes = chartData.reduce((sum, d) => sum + d.minutes, 0)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Статистика</h3>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-full sm:w-auto">
          {(['week', 'month', 'year', 'all'] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`time-tab flex-1 sm:flex-none text-center ${range === r ? 'active' : ''}`}
            >
              {r === 'week' ? 'Неделя' : r === 'month' ? 'Месяц' : r === 'year' ? 'Год' : 'Всего'}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500">{title}</span>
          <span className="text-lg font-bold text-slate-900 transition-all">{formatDuration(totalMinutes)}</span>
        </div>
        <div className="time-bar-container">
          {chartData.map((d, i) => {
            const height = d.minutes > 0 ? Math.max((d.minutes / maxMinutes) * 120, 4) : 4
            const barColor = d.minutes > 0 ? '#6366f1' : '#e2e8f0'
            return (
              <div key={d.key} className="time-bar-wrapper" style={{ animation: `fadeIn 0.4s ${i * 0.04}s cubic-bezier(0.4, 0, 0.2, 1) forwards`, opacity: 0 }}>
                <span className="time-bar-value">{d.minutes > 0 ? formatDuration(d.minutes) : ''}</span>
                <div
                  className="time-bar"
                  style={{ height: `${height}px`, background: barColor }}
                />
                <span className="time-bar-label">{d.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

