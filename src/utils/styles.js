import { FONT_SANS } from "../constants/theme"
import { THEME_DARK } from "../constants/theme"

export function toolbarBtn(t) {
  return {
    background: t.surface, border: `1px solid ${t.border}`, color: t.text,
    fontSize: 12, padding: "6px 12px", borderRadius: 6, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_SANS,
  }
}

export function headerChipBtn(t, active = false) {
  return {
    background: active
      ? `linear-gradient(135deg, rgba(255,255,255,0.36), ${t.badgeInfoBg} 42%, ${t.glassStrong})`
      : `linear-gradient(135deg, rgba(255,255,255,0.26), ${t.glassStrong} 34%, ${t.glass})`,
    border: `1px solid ${active ? t.borderStrong : t.border}`,
    color: active ? t.accentText : t.subtle,
    fontSize: 12,
    padding: "7px 12px",
    borderRadius: 999,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontFamily: FONT_SANS,
    fontWeight: active ? 800 : 700,
    whiteSpace: "nowrap",
    boxShadow: active
      ? "inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -1px 0 rgba(255,255,255,0.10), 0 14px 30px rgba(46,94,170,0.14)"
      : "inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -1px 0 rgba(255,255,255,0.06), 0 7px 18px rgba(46,94,170,0.08)",
    backdropFilter: "blur(22px) saturate(165%)",
    transition: "all 0.18s ease",
  }
}

export function headerInputStyle(t, borderColor = t.border) {
  return {
    background: `linear-gradient(180deg, rgba(255,255,255,0.34), ${t.glassStrong} 20%, ${t.panel})`,
    border: `1px solid ${borderColor}`,
    borderRadius: 999,
    padding: "9px 14px",
    color: t.text,
    fontSize: 12,
    outline: "none",
    fontFamily: FONT_SANS,
    minHeight: 38,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(255,255,255,0.08), 0 14px 28px rgba(46,94,170,0.09)",
    backdropFilter: "blur(24px) saturate(165%)",
  }
}

export function darkenLayer(t) {
  return t === THEME_DARK ? "rgba(18,32,51,0.58)" : "rgba(255,255,255,0.54)"
}
