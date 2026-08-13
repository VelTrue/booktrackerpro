import { GENRES } from '../constants/genres'
import type { Book } from '../types'
import { getGenreCounts } from '../utils/genreUtils'
import { useEffectiveCustomTheme } from '../store/settingsStore'

interface GenreRadarChartProps {
  books: Book[]
}

const CX = 100
const CY = 100
const R = 85
const ANGLE_STEP = (2 * Math.PI) / GENRES.length

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace('#', '')
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const int = parseInt(full, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function pointFor(index: number, radius: number) {
  const angle = -Math.PI / 2 + index * ANGLE_STEP
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  }
}

function labelAnchor(x: number): 'start' | 'middle' | 'end' {
  if (x < CX - 4) return 'end'
  if (x > CX + 4) return 'start'
  return 'middle'
}

export function GenreRadarChart({ books }: GenreRadarChartProps) {
  const { radar } = useEffectiveCustomTheme()
  const radarColor = radar || '#6366f1'
  const counts = getGenreCounts(books)
  const maxCount = Math.max(0, ...GENRES.map((g) => counts[g]))

  const polygonPoints = GENRES.map((g, i) => {
    const radius = maxCount > 0 ? (counts[g] / maxCount) * R : 0
    const { x, y } = pointFor(i, radius)
    return `${x},${y}`
  }).join(' ')

  const filledPoints = GENRES.map((g, i) => {
    const radius = maxCount > 0 ? (counts[g] / maxCount) * R : 0
    const { x, y } = pointFor(i, radius)
    return { x, y, has: counts[g] > 0 }
  })
  const filledPolygon =
    filledPoints.some((p) => p.has)
      ? filledPoints.filter((p) => p.has).map((p) => `${p.x},${p.y}`).join(' ')
      : ''

  return (
    <div className="genre-radar-container flex flex-col items-center">
      <svg width={300} height={300} viewBox="-50 -50 300 300">
        <circle cx={CX} cy={CY} r={R} fill="var(--card-bg)" stroke="#e2e8f0" strokeWidth="3" />
        {GENRES.map((_, i) => {
          const { x, y } = pointFor(i, R)
          return (
            <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#eef0f4" strokeWidth="1" />
          )
        })}
        {maxCount > 0 && (
          <polygon
            points={polygonPoints}
            fill={hexToRgba(radarColor, 0.35)}
            stroke={radarColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
        {maxCount > 0 && filledPolygon && (
          <polygon
            points={filledPolygon}
            fill={hexToRgba(radarColor, 0.45)}
            stroke={radarColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
        {GENRES.map((g, i) => {
          const { x, y } = pointFor(i, R + 14)
          const parts = g.split(' ')
          const two = parts.length > 1
          const line1 = two ? parts.slice(0, -1).join(' ') : g
          const line2 = two ? parts[parts.length - 1] : null
          const anchor = labelAnchor(x)
          return (
            <text key={g} x={x} y={y} fontSize="9" fontWeight="600" fill="var(--text)" textAnchor={anchor} dominantBaseline="middle">
              {two ? (
                <>
                  <tspan x={x} dy="-6">{line1}</tspan>
                  <tspan x={x} dy="12">{line2}</tspan>
                </>
              ) : (
                <tspan x={x}>{g}</tspan>
              )}
            </text>
          )
        })}
      </svg>
      {maxCount === 0 && <p className="text-xs text-slate-400 mt-1">Нет данных о жанрах</p>}
    </div>
  )
}
