import { useEffect, useState } from 'react'
import { normalizeHex } from '../utils/colorUtils'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  palette: string[]
  disabledColors?: string[]
}

export function ColorPicker({ value, onChange, palette, disabledColors = [] }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value ?? '')
  const [hexError, setHexError] = useState(false)

  useEffect(() => {
    setHexInput(value ?? '')
    setHexError(false)
  }, [value])

  function isTaken(color: string): boolean {
    return disabledColors.some((c) => c.toLowerCase() === color.toLowerCase())
  }

  function applyHexInput(): void {
    const normalized = normalizeHex(hexInput)
    if (!normalized || isTaken(normalized)) {
      setHexError(true)
      return
    }
    setHexError(false)
    onChange(normalized)
  }

  return (
    <div>
      <div className="grid grid-cols-8 gap-2">
        {palette.map((color) => {
          const taken = isTaken(color)
          return (
            <button
              key={color}
              type="button"
              onClick={() => !taken && onChange(color)}
              title={taken ? 'Цвет уже используется' : color}
              disabled={taken}
              className={`aspect-square w-full rounded-lg transition-transform ${
                (value ?? '').toLowerCase() === color.toLowerCase() ? 'ring-2 ring-offset-2 ring-slate-400' : ''
              } ${taken ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
              style={{ background: color }}
            />
          )
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="color"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          title="Выбрать на цветовом круге"
          className="w-8 h-8 shrink-0 rounded-lg border border-slate-200 bg-transparent p-0 cursor-pointer"
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => {
            setHexInput(e.target.value)
            setHexError(false)
          }}
          onBlur={applyHexInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              applyHexInput()
            }
          }}
          placeholder="#RRGGBB"
          maxLength={7}
          className={`min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-xs font-mono uppercase outline-none transition-colors ${
            hexError ? 'input-error' : 'border-slate-200 focus:border-slate-400'
          }`}
        />
      </div>
      {hexError && <p className="mt-1 text-xs text-rose-500">Некорректный или уже занятый HEX-код</p>}
    </div>
  )
}
