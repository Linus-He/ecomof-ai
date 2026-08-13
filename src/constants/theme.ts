// @ts-nocheck
// ─── Theme ──────────────────────────────────────────────────────────────────

export const THEME_LIGHT = Object.freeze({
  bg: "#ffffff", headerBg: "rgba(255,255,255,0.78)", panel: "#ffffff", surface: "#f5f5f5",
  sectionTint: "#f7f7f7", card: "#ffffff",
  border: "#dededb", borderStrong: "#aaa9a5",
  text: "#323230", textStrong: "#111110", muted: "#5f5f5b",
  subtle: "#70706b", faint: "#85857f", veryFaint: "#9a9a94",
  accent: "#c6613f", accentStrong: "#a9472b", accentSoft: "#ead8cf", accentText: "#a9472b",
  performance: "#c6613f", lcaAccent: "#c6613f", lccAccent: "#c6613f", sensitivityAccent: "#c6613f", validationAccent: "#c6613f",
  success: "#5f7a4b", warn: "#b94a42", danger: "#b94a42",
  info: "#c6613f", rose: "#c6613f", amber: "#c6613f", violet: "#c6613f", cyan: "#c6613f",
  tooltipBg: "#ffffff", divider: "#e8e8e5",
  glass: "rgba(255,255,255,0.72)", glassStrong: "rgba(255,255,255,0.9)",
  chartBg: "#ffffff", shadowSm: "0 8px 24px rgba(16,16,15,0.07)",
  shadowMd: "0 20px 48px rgba(16,16,15,0.10)",
  badgeInfoBg: "#f3e8e3", badgeInfoText: "#9d442b",
  badgeCalcBg: "#f3e8e3", badgeCalcText: "#9d442b",
  badgeProxyBg: "#f3e8e3", badgeProxyText: "#9d442b",
  badgeUserBg: "#e9e7e0", badgeUserText: "#5c5952",
  badgeWarnBg: "#f1dfdc", badgeWarnText: "#a63f38",
  badgeDangerBg: "#f1dfdc", badgeDangerText: "#a63f38",
})

export const THEME_DARK = Object.freeze({
  bg: "#141411", headerBg: "#1b1b17", panel: "#25241f", surface: "#323029",
  sectionTint: "#2a2923", card: "#2b2923",
  border: "#4e4b42", borderStrong: "#6b665b",
  text: "#e7e3da", textStrong: "#fffaf2", muted: "#c2bdb2",
  subtle: "#b0aa9f", faint: "#969188", veryFaint: "#7c776f",
  accent: "#e17b59", accentStrong: "#f08b67", accentSoft: "#4b3027", accentText: "#ef9270",
  performance: "#e17b59", lcaAccent: "#e17b59", lccAccent: "#e17b59", sensitivityAccent: "#e17b59", validationAccent: "#e17b59",
  success: "#91a778", warn: "#e17b59", danger: "#e06f68",
  info: "#e17b59", rose: "#e17b59", amber: "#e17b59", violet: "#e17b59", cyan: "#e17b59",
  tooltipBg: "#292822", divider: "#403e37",
  glass: "rgba(37,36,31,0.84)", glassStrong: "rgba(50,48,41,0.95)",
  chartBg: "#1c1c18", shadowSm: "0 8px 24px rgba(0,0,0,0.24)",
  shadowMd: "0 20px 48px rgba(0,0,0,0.34)",
  badgeInfoBg: "#4b3027", badgeInfoText: "#ef9270",
  badgeCalcBg: "#4b3027", badgeCalcText: "#ef9270",
  badgeProxyBg: "#4b3027", badgeProxyText: "#ef9270",
  badgeUserBg: "#34332e", badgeUserText: "#c5c0b5",
  badgeWarnBg: "#462d27", badgeWarnText: "#ef9270",
  badgeDangerBg: "#472a2a", badgeDangerText: "#ee8a84",
})

// Compatibility entry point for modules that need the default palette without
// owning appearance state. Runtime surfaces should consume ThemeCtx.
export const GLOBAL_RESEARCH_THEME = THEME_LIGHT

export const FONT_DISPLAY = '"Iowan Old Style", Baskerville, "Songti SC", STSong, "Noto Serif SC", SimSun, "Times New Roman", serif'
export const FONT_SANS = 'Inter, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", system-ui, -apple-system, "Segoe UI", sans-serif'
// v1.0.2 font unification: numerals stay on the body family and align with
// tabular-nums. Use this spread for metric values, badges, tables, and chart ticks.
export const NUMERIC_FONT_STYLE = {
  fontFamily: FONT_SANS,
  fontVariantNumeric: "tabular-nums",
} as const
