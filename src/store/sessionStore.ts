import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session } from '../types'

interface SessionStore {
  sessions: Session[]
  addSession: (minutes: number) => void
  mergeSessions: (imported: Session[]) => void
  getTodayMinutes: () => number
  getWeekMinutes: () => number
  getMonthMinutes: () => number
}

function getTodayKey(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function isSameWeek(dateStr: string): boolean {
  const now = new Date()
  const date = new Date(dateStr + 'T00:00:00')

  const nowDay = now.getDay()
  const diffToMonday = nowDay === 0 ? 6 : nowDay - 1

  const monday = new Date(now)
  monday.setDate(now.getDate() - diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return date >= monday && date <= sunday
}

function isSameMonth(dateStr: string): boolean {
  const now = new Date()
  const date = new Date(dateStr + 'T00:00:00')
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  )
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (minutes) => {
        const today = getTodayKey()
        const existing = get().sessions.find((s) => s.date === today)

        if (existing) {
          set({
            sessions: get().sessions.map((s) =>
              s.date === today
                ? { ...s, minutes: s.minutes + minutes }
                : s,
            ),
          })
        } else {
          set({
            sessions: [...get().sessions, { date: today, minutes }],
          })
        }
      },

      mergeSessions: (imported) => {
        const merged = new Map(get().sessions.map((s) => [s.date, s]))
        for (const session of imported) {
          merged.set(session.date, session)
        }
        set({ sessions: Array.from(merged.values()) })
      },

      getTodayMinutes: () => {
        const today = getTodayKey()
        const found = get().sessions.find((s) => s.date === today)
        return found?.minutes ?? 0
      },

      getWeekMinutes: () => {
        return get().sessions
          .filter((s) => isSameWeek(s.date))
          .reduce((sum, s) => sum + s.minutes, 0)
      },

      getMonthMinutes: () => {
        return get().sessions
          .filter((s) => isSameMonth(s.date))
          .reduce((sum, s) => sum + s.minutes, 0)
      },
    }),
    {
      name: 'bookTracker_sessions',
    },
  ),
)

