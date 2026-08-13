import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'custom'
export type StatusKey = 'completed' | 'reading' | 'planned' | 'abandoned'
export type CustomThemeKey = 'background' | 'buttons' | 'text' | 'radar'
export type CustomTheme = Record<CustomThemeKey, string>

export interface SettingsPreview {
  theme: Theme
  statusColors: Record<StatusKey, string>
  customTheme: CustomTheme
}

interface SettingsStore {
  theme: Theme
  statusColors: Record<StatusKey, string>
  customTheme: CustomTheme
  // Черновой предпросмотр из открытого окна настроек, до нажатия "Сохранить".
  // Не персистится (partialize её не включает).
  preview: SettingsPreview | null
  setTheme: (theme: Theme) => void
  setStatusColor: (status: StatusKey, color: string) => void
  setCustomColor: (key: CustomThemeKey, color: string) => void
  setPreview: (preview: SettingsPreview | null) => void
}

const defaultStatusColors: Record<StatusKey, string> = {
  completed: '#10b981',
  reading: '#3b82f6',
  planned: '#9ca3af',
  abandoned: '#f43f5e',
}

const defaultCustomTheme: CustomTheme = {
  background: '#f8fafc',
  buttons: '#6366f1',
  text: '#0f172a',
  radar: '#6366f1',
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'light',
      statusColors: defaultStatusColors,
      customTheme: defaultCustomTheme,
      preview: null,
      setTheme: (theme) => set({ theme }),
      setStatusColor: (status, color) =>
        set((state) => ({
          statusColors: { ...state.statusColors, [status]: color },
        })),
      setCustomColor: (key, color) =>
        set((state) => ({
          customTheme: { ...state.customTheme, [key]: color },
        })),
      setPreview: (preview) => set({ preview }),
    }),
    {
      name: 'bookTracker_settings',
      partialize: (state) => ({
        theme: state.theme,
        statusColors: state.statusColors,
        customTheme: state.customTheme,
      }),
    },
  ),
)

// "Действующие" значения: пока окно настроек открыто и preview заполнен,
// интерфейс должен отражать черновик, а не сохранённые настройки
export function useEffectiveTheme(): Theme {
  return useSettingsStore((s) => s.preview?.theme ?? s.theme)
}

export function useEffectiveStatusColors(): Record<StatusKey, string> {
  return useSettingsStore((s) => s.preview?.statusColors ?? s.statusColors)
}

export function useEffectiveCustomTheme(): CustomTheme {
  return useSettingsStore((s) => s.preview?.customTheme ?? s.customTheme)
}

