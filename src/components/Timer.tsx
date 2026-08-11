import { useTimerStore, formatTimer, getTimerStatusLabel } from '../store/timerStore'
export function Timer() {
  const elapsed = useTimerStore((s) => s.elapsed)
  const status = useTimerStore((s) => s.status)
  const savedMessage = useTimerStore((s) => s.savedMessage)
  const start = useTimerStore((s) => s.start)
  const pause = useTimerStore((s) => s.pause)
  const stop = useTimerStore((s) => s.stop)

  const displayStatus = savedMessage ? 'Сохранено!' : getTimerStatusLabel(status)
  return (
    <div className="bg-slate-50 rounded-2xl p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">⏱️ Таймер</h3>

      <div className="text-center mb-5">
        <div className={`timer-display ${status === 'running' ? 'running' : ''}`}>
          {formatTimer(elapsed)}
        </div>
        <p className="text-xs text-slate-400 mt-1 transition-all">{displayStatus}</p>
      </div>

      <div className="flex items-center justify-center gap-4">
        {(status === 'idle' || status === 'paused') && (
          <button
            type="button"
            onClick={start}
            className="timer-btn timer-play"
          >
            <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </button>
        )}

        {status === 'running' && (
          <button
            type="button"
            onClick={pause}
            className="timer-btn timer-pause"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
          </button>
        )}

        {(status === 'running' || status === 'paused') && (
          <button
            type="button"
            onClick={stop}
            className="timer-btn timer-stop"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
          </button>
        )}
      </div>
    </div>
  )
}

