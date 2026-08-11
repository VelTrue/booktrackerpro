export interface Book {
  id: string
  title: string
  author: string
  isbn?: string               
  totalPages?: number         
  currentPage?: number        
  status: 'completed' | 'reading' | 'planned' | 'abandoned'
  rating: number              
  comment: string
  cover?: string
  createdAt: Date
  updatedAt: Date
}

export interface BookStats {
  totalBooks: number
  completed: number
  reading: number
  planned: number
  abandoned: number
  totalPagesRead: number
}

export type BookStatus = 'completed' | 'reading' | 'planned' | 'abandoned'

export interface Session {
  date: string // 'YYYY-MM-DD'
  minutes: number
}

