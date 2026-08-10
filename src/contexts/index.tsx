// @ts-nocheck
import { createContext, useContext } from "react"
import { GLOBAL_RESEARCH_THEME } from "../constants/theme"
import { COPY } from "../i18n"

export const ThemeCtx = createContext(GLOBAL_RESEARCH_THEME)
export const useT = () => useContext(ThemeCtx)
export const LangCtx = createContext<{
  lang: string
  locale?: string
  copy: typeof COPY.en
  setLang: (lang: string) => void
}>({ lang: "en", locale: "en", copy: COPY.en, setLang: () => {} })
export const useLang = () => useContext(LangCtx)
export const ViewportCtx = createContext({ isNarrow: false, isMobile: false })
export const useViewport = () => useContext(ViewportCtx)
