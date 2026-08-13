import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface ConfirmDeleteProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDelete({ isOpen, onConfirm, onCancel }: ConfirmDeleteProps) {
  useBodyScrollLock(isOpen)
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl modal-enter text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Удалить книгу?</h3>
        <p className="text-sm text-slate-500 mb-6">Вы действительно хотите удалить книгу?<br />Это действие нельзя отменить.</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 hover:shadow-xl hover:shadow-rose-600/30"
          >
            Да, хочу
          </button>
        </div>
      </div>
    </div>
  )
}
