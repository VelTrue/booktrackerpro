import type { Book } from '../types'

interface BookCardProps {
  book: Book
  onDelete: (id: string) => void
  onEdit: (book: Book) => void
}

const statusCfg: Record<Book['status'], { label: string; cssClass: string }> = {
  completed: { label: 'Прочитано', cssClass: 'status-completed' },
  reading: { label: 'Читаю', cssClass: 'status-reading' },
  planned: { label: 'В планах', cssClass: 'status-planned' },
  abandoned: { label: 'Брошено', cssClass: 'status-abandoned' },
}

export function BookCard({ book, onDelete, onEdit }: BookCardProps) {
  const cfg = statusCfg[book.status]
  const stars = Array.from({ length: 5 }, (_, j) => (
    <span key={j} className={`text-sm ${j < book.rating ? 'star-filled' : 'star-empty'}`}>★</span>
  ))

  return (
    <div className="book-card bg-white rounded-xl p-4 border border-slate-100 shadow-sm relative group flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 min-w-0">
        {book.cover ? (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <img
              src={book.cover}
              alt={book.title}
              className="w-20 h-28 object-cover rounded-lg shadow-md"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="font-semibold text-slate-900 text-sm leading-tight truncate">{book.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{book.author}</p>
              </div>
              <span className={`status-oval ${cfg.cssClass} flex-shrink-0`}>{cfg.label}</span>
            </div>
            {book.rating > 0 && (
              <div className="flex items-center gap-0.5 mt-2">{stars}</div>
            )}
            {book.comment ? (
              <div className="bg-slate-50 rounded-xl p-2.5 mt-2">
                <p className="text-xs text-slate-600 comment-truncate leading-relaxed">{book.comment}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-300 italic mt-2">Нет комментария</p>
            )}
            </div>
            </div>
        ) : (
          <>
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-semibold text-slate-900 text-sm leading-tight truncate">{book.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{book.author}</p>
            </div>
            <span className={`status-oval ${cfg.cssClass} flex-shrink-0`}>{cfg.label}</span>
          </div>

          {book.rating > 0 && (
            <div className="flex items-center gap-0.5 mb-2">{stars}</div>
          )}

          {book.comment ? (
            <div className="bg-slate-50 rounded-xl p-2.5 mb-2">
              <p className="text-xs text-slate-600 comment-truncate leading-relaxed">{book.comment}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-300 italic mb-2">Нет комментария</p>
          )}
        </>
      )}
    </div>

      {/* Actions pinned to bottom */}
      <div className="flex gap-2 pt-3 mt-auto">
        <button
          type="button"
          onClick={() => onEdit(book)}
          className="flex-1 px-2 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
        >
          Редактировать
        </button>
        <button
          type="button"
          onClick={() => onDelete(book.id)}
          className="flex-1 px-2 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-100 transition-colors"
        >
          Удалить
        </button>
      </div>
    </div>
  )
}

