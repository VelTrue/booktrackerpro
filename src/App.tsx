
import { useState, useRef, useEffect } from 'react'
import { useBookStore } from './store/bookStore'
import { useSessionStore } from './store/sessionStore'
import { useEffectiveCustomTheme, useEffectiveStatusColors, useEffectiveTheme } from './store/settingsStore'
import type { Book, Session } from './types'
import { Dashboard } from './components/Dashboard'
import { PieChart } from './components/PieChart'
import { BookForm } from './components/BookForm'
import { BookBrowser } from './components/BookBrowser'
import { SettingsModal } from './components/SettingsModal'
import { Timer } from './components/Timer'
import { TimeChart } from './components/TimeChart'
import { ConfirmDelete } from './components/ConfirmDelete'
import { getDerivedTheme } from './utils/colorUtils'

function App() {
  const { books, addBook, removeBook, updateBook, mergeBooks } = useBookStore()
  const { sessions, mergeSessions } = useSessionStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [isTimerOpen, setIsTimerOpen] = useState(false)
  const [isDataOpen, setIsDataOpen] = useState(false)
  const [isBrowserOpen, setIsBrowserOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [timerPos, setTimerPos] = useState<{ x: number; y: number } | null>(null)
  const [timerDragging, setTimerDragging] = useState(false)
  const timerDragOffset = useRef({ dx: 0, dy: 0 })
  const timerRef = useRef<HTMLDivElement>(null)

  // Пока открыто окно настроек, эти хуки отдают черновые значения предпросмотра,
  // а не сохранённые в сторе, до нажатия "Сохранить"
  const effectiveTheme = useEffectiveTheme()
  const effectiveStatusColors = useEffectiveStatusColors()
  const effectiveCustomTheme = useEffectiveCustomTheme()

  useEffect(() => {
    document.body.classList.toggle('dark', effectiveTheme === 'dark')
    document.body.classList.toggle('custom-theme', effectiveTheme === 'custom')
  }, [effectiveTheme])

  useEffect(() => {
    const root = document.body.style
    root.setProperty('--status-completed', effectiveStatusColors.completed)
    root.setProperty('--status-reading', effectiveStatusColors.reading)
    root.setProperty('--status-planned', effectiveStatusColors.planned)
    root.setProperty('--status-abandoned', effectiveStatusColors.abandoned)
  }, [effectiveStatusColors])

  useEffect(() => {
    const root = document.body.style
    if (effectiveTheme !== 'custom') {
      root.removeProperty('--bg')
      root.removeProperty('--card-bg')
      root.removeProperty('--card-border')
      root.removeProperty('--text')
      root.removeProperty('--text-secondary')
      root.removeProperty('--accent')
      return
    }

    const { cardBg, cardBorder, textSecondary } = getDerivedTheme(effectiveCustomTheme.background, effectiveCustomTheme.text)
    root.setProperty('--bg', effectiveCustomTheme.background)
    root.setProperty('--card-bg', cardBg)
    root.setProperty('--card-border', cardBorder)
    root.setProperty('--text', effectiveCustomTheme.text)
    root.setProperty('--text-secondary', textSecondary)
    root.setProperty('--accent', effectiveCustomTheme.buttons)
  }, [effectiveTheme, effectiveCustomTheme])

  function openTimerFromSidebar() {
    setIsSidebarOpen(false)
    setIsTimerOpen(true)
  }

  function openSettingsFromSidebar() {
    setIsSidebarOpen(false)
    setIsSettingsOpen(true)
  }

  function handleDelete(id: string) {
    setDeleteTargetId(id)
  }

  function handleDeleteConfirm() {
    if (deleteTargetId) {
      removeBook(deleteTargetId)
      setDeleteTargetId(null)
    }
  }

  function handleDeleteCancel() {
    setDeleteTargetId(null)
  }

  function handleEdit(book: Book) {
    setEditingBook(book)
    setIsFormOpen(true)
  }

  function handleSave(data: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editingBook) {
      updateBook(editingBook.id, data)
    } else {
      addBook(data)
    }
    setIsFormOpen(false)
    setEditingBook(null)
  }

  function handleCloseForm() {
    setIsFormOpen(false)
    setEditingBook(null)
  }

  function handleExport() {
    const payload = {
      books,
      sessions,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `book-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setIsDataOpen(false)
  }

  function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as {
          books?: Book[]
          sessions?: Session[]
        }
        if (Array.isArray(parsed.books) && parsed.books.length > 0) {
          mergeBooks(parsed.books)
        }
        if (Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
          mergeSessions(parsed.sessions)
        }
      } catch {
        // ignore invalid files
      }
      event.target.value = ''
    }
    reader.readAsText(file)
    setIsDataOpen(false)
  }

  function handleTimerPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    const rect = timerRef.current?.getBoundingClientRect()
    if (!rect) return
    timerDragOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
    setTimerDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handleTimerPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!timerDragging) return
    const w = timerRef.current?.offsetWidth ?? 0
    const h = timerRef.current?.offsetHeight ?? 0
    const margin = 8
    const maxX = Math.max(margin, window.innerWidth - w - margin)
    const maxY = Math.max(margin, window.innerHeight - h - margin)
    const x = Math.min(Math.max(margin, e.clientX - timerDragOffset.current.dx), maxX)
    const y = Math.min(Math.max(margin, e.clientY - timerDragOffset.current.dy), maxY)
    setTimerPos({ x, y })
  }

  function handleTimerPointerUp() {
    setTimerDragging(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Book Tracker</h1>
          <p className="text-slate-500 mt-1 text-base">Фиксируйте свои достижения</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDataOpen(true)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all hover:shadow-md"
            title="Экспорт / Импорт"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 6v12m0 0l-4-4m4 4l4-4" />
              <path d="M15 18V6m0 0l-4 4m4-4l4 4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all hover:shadow-md"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="btn-primary bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all mb-6 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5"
        >
          + Добавить книгу
        </button>

        <Dashboard books={books} />
      </div>

      <div className="mb-6">
        <PieChart books={books} />
      </div>

      <button
        type="button"
        onClick={() => setIsBrowserOpen(true)}
        className="btn-primary w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 hover:-translate-y-0.5 mb-6"
      >
        Посмотреть добавленные
      </button>

      {/* Timer Modal (draggable) */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          isTimerOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        onClick={(e) => { if (e.target === e.currentTarget) setIsTimerOpen(false) }}
      >
        <div
          ref={timerRef}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md fixed z-50 ${timerDragging ? 'cursor-grabbing' : ''}`}
          style={{
            left: timerPos ? timerPos.x : '50%',
            top: timerPos ? timerPos.y : '50%',
            transform: timerPos ? undefined : 'translate(-50%, -50%)',
            touchAction: 'none',
          }}
        >
          <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div
              onPointerDown={handleTimerPointerDown}
              onPointerMove={handleTimerPointerMove}
              onPointerUp={handleTimerPointerUp}
              className="flex cursor-grab items-center justify-between border-b border-slate-200 px-6 py-4 select-none"
              title="Перетащите окно"
            >
              <h2 className="text-lg font-bold text-slate-900">Меню</h2>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setIsTimerOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <Timer />
              <TimeChart />
    </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Data Modal (Export / Import) */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          isDataOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        onClick={(e) => { if (e.target === e.currentTarget) setIsDataOpen(false) }}
      >
        <div
          className={`w-full max-w-sm transition-all duration-300 ${
            isDataOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col rounded-2xl bg-white p-6 shadow-2xl modal-enter">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Данные</h2>
              <button
                type="button"
                onClick={() => setIsDataOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="btn-primary flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 18h16M12 4v12m0 0l-5-5m5 5l5-5" />
                </svg>

                Экспорт (скачать данные)
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 20V8m0 0l-5 5m5-5l5 5" />
                </svg>
                Импорт (загрузить данные)
              </button>
            </div>
          </div>
        </div>
      </div>

      {isBrowserOpen && (
        <BookBrowser
          books={books}
          onClose={() => setIsBrowserOpen(false)}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          isSidebarOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setIsSidebarOpen(false)}
        />
        <div
          className={`absolute left-0 top-0 h-full w-72 bg-white shadow-2xl transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Menu</h2>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-3 space-y-1">
            <button
              type="button"
              onClick={openTimerFromSidebar}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-slate-700">Таймер</span>
            </button>

            <button
              type="button"
              onClick={openSettingsFromSidebar}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-slate-700">Настройки</span>
            </button>
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <BookForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSave}
        initialData={editingBook || undefined}
      />

      <ConfirmDelete
        isOpen={deleteTargetId !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}

export default App