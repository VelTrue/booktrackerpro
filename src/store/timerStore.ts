import { create } from 'zustand'
import { useSessionStore } from './sessionStore'

export type TimerStatus = 'idle' | 'running' | 'paused'

interface TimerStore {
  elapsed: number
  status: TimerStatus
  savedMessage: boolean
  intervalId: number | null
  start: () => void
  pause: () => void
  stop: () => void
}

export function formatTimer(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')

  return `${hh}:${mm}:${ss}`
}

export function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  const parts: string[] = []
  if (h > 0) parts.push(String(h))
  parts.push(String(m).padStart(2, '0'))
  parts.push(String(s).padStart(2, '0'))
  return parts.join(':')
}

const statusLabels: Record<TimerStatus, string> = {
  idle: 'Готов к старту',
  running: 'Чтение...',
  paused: 'Пауза',
}

export function getTimerStatusLabel(status: TimerStatus): string {
  return statusLabels[status]
}

export const useTimerStore = create<TimerStore>()((set, get) => ({
  elapsed: 0,
  status: 'idle',
  savedMessage: false,
  intervalId: null,

  start: () => {
    const prevId = get().intervalId
    if (prevId !== null) window.clearInterval(prevId)

    const isNewRun = get().status === 'idle'
    set({
      status: 'running',
      savedMessage: false,
      elapsed: isNewRun ? 0 : get().elapsed,
      intervalId: null,
    })

    const id = window.setInterval(() => {
      set({ elapsed: get().elapsed + 1 })
    }, 1000)
    set({ intervalId: id })
  },

  pause: () => {
    const prevId = get().intervalId
    if (prevId !== null) window.clearInterval(prevId)
    set({ intervalId: null, status: 'paused', savedMessage: false })
  },

  stop: () => {
    const prevId = get().intervalId
    if (prevId !== null) window.clearInterval(prevId)

    const elapsed = get().elapsed
    let saved = false
    if (elapsed >= 60) {
      useSessionStore.getState().addSession(Math.floor(elapsed / 60))
      saved = true
    }

    set({ intervalId: null, elapsed: 0, status: 'idle', savedMessage: saved })
  },
}))
