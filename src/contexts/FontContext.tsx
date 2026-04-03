import { createContext, useContext, useState, useEffect } from 'react'
import type { FontId, FontOption } from '../types'

export const FONTS: FontOption[] = [
  { id: 'noto',       name: 'Noto Sans KR',  label: '노토 산스 (정갈한 기본체)',    family: "'Noto Sans KR', sans-serif" },
  { id: 'gothic',     name: 'Gothic A1',     label: '고딕 A1 (깔끔한 고딕)',        family: "'Gothic A1', sans-serif" },
  { id: 'nanum',      name: 'Nanum Gothic',  label: '나눔고딕 (친근한 고딕)',        family: "'Nanum Gothic', sans-serif" },
  { id: 'doHyeon',    name: 'Do Hyeon',      label: '도현 (모던 기하학)',            family: "'Do Hyeon', sans-serif" },
  { id: 'gowun',      name: 'Gowun Dodum',   label: '고운돋움 (둥글고 부드러운)',    family: "'Gowun Dodum', sans-serif" },
  { id: 'blackHan',   name: 'Black Han Sans', label: '검은고딕 (강렬한 굵은 고딕)', family: "'Black Han Sans', sans-serif" },
  { id: 'sunflower',  name: 'Sunflower',     label: '선플라워 (얇고 감성적)',        family: "'Sunflower', sans-serif" },
  { id: 'gaegu',      name: 'Gaegu',         label: '개구쟁이 (동글 손글씨)',        family: "'Gaegu', cursive" },
  { id: 'jua',        name: 'Jua',           label: '주아 (동글동글 귀여운)',        family: "'Jua', sans-serif" },
]

interface FontContextValue {
  fontId: FontId
  setFontId: (id: FontId) => void
  fonts: FontOption[]
}

const FontContext = createContext<FontContextValue | null>(null)

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [fontId, setFontIdState] = useState<FontId>(() => {
    return (localStorage.getItem('font') as FontId) ?? 'noto'
  })

  const setFontId = (id: FontId) => {
    setFontIdState(id)
    localStorage.setItem('font', id)
  }

  useEffect(() => {
    const font = FONTS.find(f => f.id === fontId)
    if (font) {
      document.documentElement.style.setProperty('--font-family', font.family)
    }
  }, [fontId])

  return (
    <FontContext.Provider value={{ fontId, setFontId, fonts: FONTS }}>
      {children}
    </FontContext.Provider>
  )
}

export function useFont() {
  const ctx = useContext(FontContext)
  if (!ctx) throw new Error('useFont must be used within FontProvider')
  return ctx
}
