import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Book } from '../types'

interface BookStore {
  books: Book[]
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => void
  removeBook: (id: string) => void
  updateBook: (id: string, updates: Partial<Book>) => void
  mergeBooks: (imported: Book[]) => void
  loadBooks: () => void
  saveBooks: () => void
}

export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      books: [],

      addBook: (book) => {
        const now = new Date()

        const newBook: Book = {
          ...book,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        }

        set({ books: [...get().books, newBook] })
      },

      removeBook: (id) => {
        set({ books: get().books.filter((b) => b.id !== id) })
      },

      updateBook: (id, updates) => {
        set({
          books: get().books.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b,
          ),
        })
      },

      mergeBooks: (imported) => {
        const merged = new Map(get().books.map((b) => [b.id, b]))
        for (const book of imported) {
          merged.set(book.id, book)
        }
        set({ books: Array.from(merged.values()) })
      },

      loadBooks: () => {
        const stored = localStorage.getItem('bookTracker_books')
        if (stored) {
          try {
            const parsed: Book[] = JSON.parse(stored) as Book[]
            set({ books: parsed })
          } catch {
            set({ books: [] })
          }
        }
      },

      saveBooks: () => {
        localStorage.setItem('bookTracker_books', JSON.stringify(get().books))
      },
    }),
    {
      name: 'bookTracker_books',
    },
  ),
)

