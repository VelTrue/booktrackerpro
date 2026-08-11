import { useState, useEffect } from 'react'
import { useSettingsStore, type CustomTheme, type CustomThemeKey, type StatusKey, type Theme } from '../store/settingsStore'
import { ColorPicker } from './ColorPicker'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const statusLabels: { key: StatusKey; label: string }[] = [
  { key: 'completed', label: 'Прочитано' },
  { key: 'reading', label: 'Читаю' },
  { key: 'planned', label: 'В планах' },
  { key: 'abandoned', label: 'Брошено' },
]

const customThemeFields: { key: CustomThemeKey; label: string }[] = [
  { key: 'background', label: 'Фон' },
  { key: 'buttons', label: 'Кнопки' },
  { key: 'text', label: 'Текст и цифры' },
]

// Современная палитра: нейтральные оттенки + насыщенные акцентные цвета,
// общая для фона/кнопок/текста и цветов статусов
const palette = [
  '#f8fafc',
  '#e2e8f0',
  '#94a3b8',
  '#475569',
  '#1e293b',
  '#0f172a',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#0ea5e9',
]

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme, statusColors, setStatusColor, customTheme, setCustomColor, setPreview } = useSettingsStore()
  const [draftTheme, setDraftTheme] = useState<Theme>(theme)
  const [draftColors, setDraftColors] = useState({ ...statusColors })
  const [draftCustomTheme, setDraftCustomTheme] = useState<CustomTheme>({ ...customTheme })
  const [openPicker, setOpenPicker] = useState<StatusKey | null>(null)

  // Синхронизируем черновик со стором каждый раз при открытии
  useEffect(() => {
    if (isOpen) {
      setDraftTheme(theme)
      setDraftColors({ ...statusColors })
      setDraftCustomTheme({ ...customTheme })
      setOpenPicker(null)
    }
  }, [isOpen, theme, statusColors, customTheme])

  // Живой предпросмотр: пока окно открыто, приложение отражает черновик,
  // а не сохранённые настройки — до нажатия "Сохранить" ничего не персистится
  useEffect(() => {
    if (!isOpen) return
    setPreview({ theme: draftTheme, statusColors: draftColors, customTheme: draftCustomTheme })
  }, [isOpen, draftTheme, draftColors, draftCustomTheme, setPreview])

  if (!isOpen) return null

  function togglePicker(key: StatusKey) {
    setOpenPicker((prev) => (prev === key ? null : key))
  }

  function updateDraftColor(key: StatusKey, color: string) {
    setDraftColors((prev) => ({ ...prev, [key]: color }))
  }

  function isColorTaken(color: string, currentKey: StatusKey): boolean {
    return Object.entries(draftColors).some(
      ([key, value]) => key !== currentKey && value.toLowerCase() === color.toLowerCase(),
    )
  }

  function pickColor(key: StatusKey, color: string) {
    if (!isColorTaken(color, key)) {
      updateDraftColor(key, color)
    }
  }

  function updateDraftCustomColor(key: CustomThemeKey, color: string) {
    setDraftCustomTheme((prev) => ({ ...prev, [key]: color }))
  }

  function handleSave() {
    setTheme(draftTheme)
    setStatusColor('completed', draftColors.completed)
    setStatusColor('reading', draftColors.reading)
    setStatusColor('planned', draftColors.planned)
    setStatusColor('abandoned', draftColors.abandoned)
    setCustomColor('background', draftCustomTheme.background)
    setCustomColor('buttons', draftCustomTheme.buttons)
    setCustomColor('text', draftCustomTheme.text)
    setPreview(null)
    onClose()
  }

  function handleCancel() {
    setPreview(null)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel()
      }}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-5 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Настройки</h2>
          <button
            type="button"
            onClick={handleCancel}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto px-6">
          {/* Theme */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Тема</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDraftTheme('light')}
                className={`px-3 py-3 rounded-xl text-sm font-medium transition-all border ${
                  draftTheme === 'light'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Светлая
              </button>
              <button
                type="button"
                onClick={() => setDraftTheme('dark')}
                className={`px-3 py-3 rounded-xl text-sm font-medium transition-all border ${
                  draftTheme === 'dark'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Тёмная
              </button>
              <button
                type="button"
                onClick={() => setDraftTheme('custom')}
                className={`px-3 py-3 rounded-xl text-sm font-medium transition-all border ${
                  draftTheme === 'custom'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Своя
              </button>
            </div>
          </div>

          {/* Custom theme colors */}
          {draftTheme === 'custom' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Пользовательская палитра</h3>
              <div className="space-y-3">
                {customThemeFields.map((field) => (
                  <div key={field.key} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-200"
                        style={{ background: draftCustomTheme[field.key] }}
                      />
                      <span className="text-sm text-slate-700">{field.label}</span>
                    </div>
                    <ColorPicker
                      value={draftCustomTheme[field.key]}
                      onChange={(color) => updateDraftCustomColor(field.key, color)}
                      palette={palette}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status colors */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Цвета статусов</h3>
            <div className="space-y-2">
              {statusLabels.map((item) => (
                <div key={item.key} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ background: draftColors[item.key] }}
                      />
                      <span className="text-sm text-slate-700">{item.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePicker(item.key)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      {openPicker === item.key ? 'Закрыть' : 'Изменить цвет'}
                    </button>
                  </div>

                  {openPicker === item.key && (
                    <div className="border-t border-slate-100 p-3">
                      <ColorPicker
                        value={draftColors[item.key]}
                        onChange={(color) => pickColor(item.key, color)}
                        palette={palette}
                        disabledColors={Object.entries(draftColors)
                          .filter(([key]) => key !== item.key)
                          .map(([, value]) => value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 px-6 pt-6 pb-6 shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/20"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}
