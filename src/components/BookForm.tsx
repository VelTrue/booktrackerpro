import { useState, useEffect, useRef, type FormEvent } from 'react'
import type { Book } from '../types'
import { ImageCropper } from './ImageCropper'

interface BookFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialData?: Book
}

const statusOptions: { value: Book['status']; label: string }[] = [
  { value: 'planned', label: 'В планах' },
  { value: 'reading', label: 'Читаю' },
  { value: 'completed', label: 'Прочитано' },
  { value: 'abandoned', label: 'Брошено' },
]

export function BookForm({ isOpen, onClose, onSave, initialData }: BookFormProps) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState<Book['status']>('planned')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [cover, setCover] = useState('')
  const [coverSrc, setCoverSrc] = useState('')
  const [coverError, setCoverError] = useState('')
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [titleError, setTitleError] = useState('')
  const [authorError, setAuthorError] = useState('')

  const isEditing = initialData !== undefined

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title)
        setAuthor(initialData.author)
        setStatus(initialData.status)
        setRating(initialData.rating)
        setComment(initialData.comment)
        setCover(initialData.cover || '')
      } else {
        setTitle('')
        setAuthor('')
        setStatus('planned')
        setRating(0)
        setComment('')
        setCover('')
      }
      setTitleError('')
      setAuthorError('')
      setCoverError('')
      setCoverSrc('')
      setIsCropperOpen(false)
    }
  }, [isOpen, initialData])

  function handleCoverSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setCoverError('Файл больше 5 МБ')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCoverSrc(reader.result as string)
      setCoverError('')
      setIsCropperOpen(true)
    }
    reader.readAsDataURL(file)
  }

  function handleCoverConfirm(croppedDataUrl: string) {
    setCover(croppedDataUrl)
    setCoverSrc('')
    setIsCropperOpen(false)
  }

  function handleCoverCancel() {
    setCoverSrc('')
    setIsCropperOpen(false)
  }

  function removeCover() {
    setCover('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    let hasError = false

    if (!title.trim()) {
      setTitleError('Введите название книги')
      hasError = true
    } else {
      setTitleError('')
    }

    if (!author.trim()) {
      setAuthorError('Введите имя автора')
      hasError = true
    } else {
      setAuthorError('')
    }

    if (hasError) return

    onSave({
      title: title.trim(),
      author: author.trim(),
      isbn: initialData?.isbn,
      totalPages: initialData?.totalPages,
      currentPage: initialData?.currentPage,
      status,
      rating,
      comment: comment.trim(),
      cover: cover || undefined,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl modal-enter" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-900 mb-5">
          {isEditing ? 'Редактировать книгу' : 'Добавить книгу'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Название книги <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (titleError) setTitleError('')
              }}
              className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm transition-all ${titleError ? 'input-error' : 'border-slate-200'}`}
              placeholder="Например, 1984"
            />
            {titleError && <p className="text-xs text-slate-400 mt-1">{titleError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Имя автора <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value)
                if (authorError) setAuthorError('')
              }}
              className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm transition-all ${authorError ? 'input-error' : 'border-slate-200'}`}
              placeholder="Например, Джордж Оруэлл"
            />
            {authorError && <p className="text-xs text-slate-400 mt-1">{authorError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Book['status'])}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm cursor-pointer transition-all hover:border-slate-300"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Оценка</label>
              <div className="flex items-center gap-0.5 pt-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`star text-xl ${i < rating ? 'star-filled' : 'star-empty'}`}
                    onClick={() => setRating(i + 1)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Комментарий <span className="text-slate-400 font-normal">(необязательно)</span>
            </label>
            <textarea
              rows={3}
              maxLength={250}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm resize-none transition-all"
              placeholder="Ваши мысли о книге..."
            />
            <div className="text-right text-xs text-slate-400 mt-1">{comment.length}/250</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Обложка <span className="text-slate-400 font-normal">(необязательно)</span>
            </label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverSelect}
            />
            {cover ? (
              <div className="flex items-center gap-3">
                <img
                  src={cover}
                  alt="Обложка"
                  className="w-16 h-24 object-cover rounded-lg shadow-sm"
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    onClick={removeCover}
                    className="px-3 py-2 border border-rose-200 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 rounded-xl py-6 text-sm text-slate-500 hover:border-slate-400 hover:bg-slate-50 transition-colors"
              >
                Нажмите, чтобы загрузить обложку
              </button>
            )}
            {coverError && <p className="text-xs text-rose-500 mt-1">{coverError}</p>}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/20"
            >
              {isEditing ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>

      {isCropperOpen && coverSrc && (
        <ImageCropper
          imageSrc={coverSrc}
          aspect={3 / 4}
          onCancel={handleCoverCancel}
          onConfirm={handleCoverConfirm}
        />
      )}
    </div>
  )
}
