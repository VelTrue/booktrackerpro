const HEX_RE = /^#?[0-9a-fA-F]{6}$/

export function normalizeHex(value: string): string | null {
  const trimmed = value.trim()
  if (!HEX_RE.test(trimmed)) return null
  const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  return hex.toLowerCase()
}

interface Rgb {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHex(hex) ?? '#000000'
  const value = normalized.slice(1)
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (n: number): string => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Смешивает hexA с hexB, weight — доля hexB (0..1)
export function mix(hexA: string, hexB: string, weight: number): string {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  return rgbToHex({
    r: a.r + (b.r - a.r) * weight,
    g: a.g + (b.g - a.g) * weight,
    b: a.b + (b.b - a.b) * weight,
  })
}

export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.5
}

// Производные оттенки интерфейса, вычисленные из трёх пользовательских цветов
export function getDerivedTheme(background: string, text: string) {
  const light = isLightColor(background)
  const cardBg = mix(background, '#ffffff', light ? 0.7 : 0.12)
  const cardBorder = mix(cardBg, text, light ? 0.12 : 0.25)
  const textSecondary = mix(text, background, 0.45)

  return { cardBg, cardBorder, textSecondary }
}
