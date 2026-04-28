import { createContext, useContext } from "react"
import { THEME_DARK } from "../constants/theme"
import { COPY } from "../i18n"

export const ThemeCtx = createContext(THEME_DARK)
export const useT = () => useContext(ThemeCtx)
export const LangCtx = createContext({ lang: "en", copy: COPY.en, setLang: () => {} })
export const useLang = () => useContext(LangCtx)
export const ViewportCtx = createContext({ isNarrow: false, isMobile: false })
export const useViewport = () => useContext(ViewportCtx)
