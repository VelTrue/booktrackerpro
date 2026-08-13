import { useEffect } from 'react'

// Блокирует прокрутку body, пока модальное окно открыто.
// Множественные вызовы безопасны: восстанавливается исходное значение,
// только когда не осталось ни одного активного лока.
let lockCount = 0

export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return

    const prev = document.body.style.overflow
    lockCount++
    document.body.style.overflow = 'hidden'

    return () => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount === 0) {
        document.body.style.overflow = prev
      }
    }
  }, [active])
}
