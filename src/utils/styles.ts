// @ts-nocheck
import { FONT_SANS } from "../constants/theme"
import { THEME_DARK } from "../constants/theme"

export function toolbarBtn(t) {
  return {
    background: t.panel, border: `1px solid ${t.borderStrong}`, color: t.muted,
    fontSize: 12, padding: "6px 12px", borderRadius: 6, cursor: "pointer",
    minHeight: 36,
    display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_SANS,
    fontWeight: 700,
  }
}

export function headerChipBtn(t, active = false) {
  return {
    background: active ? t.badgeInfoBg : t.panel,
    border: `1px solid ${active ? t.borderStrong : t.border}`,
    color: active ? t.accentText : t.muted,
    fontSize: 12,
    padding: "7px 12px",
    borderRadius: 6,
    cursor: "pointer",
    minHeight: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontFamily: FONT_SANS,
    fontWeight: active ? 800 : 700,
    whiteSpace: "nowrap",
    boxShadow: active ? "0 1px 0 rgba(15,23,42,0.04)" : "none",
    transition: "all 0.18s ease",
  }
}

export function headerInputStyle(t, borderColor = t.border) {
  return {
    background: t.panel,
    border: `1px solid ${borderColor}`,
    borderRadius: 6,
    padding: "9px 14px",
    color: t.text,
    fontSize: 12,
    outline: "none",
    fontFamily: FONT_SANS,
    minHeight: 38,
    boxShadow: "none",
  }
}

export function darkenLayer(t) {
  return t === THEME_DARK ? "#1A202C" : "transparent"
}
