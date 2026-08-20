// @ts-nocheck
// ─── Theme ──────────────────────────────────────────────────────────────────

export const THEME_LIGHT = Object.freeze({
  bg: "#ffffff", headerBg: "rgba(255,255,255,0.78)", panel: "#ffffff", surface: "#f5f5f5",
  sectionTint: "#f7f7f7", card: "#ffffff",
  border: "#dededb", borderStrong: "#aaa9a5",
  text: "#323230", textStrong: "#111110", muted: "#5f5f5b",
  subtle: "#70706b", faint: "#85857f", veryFaint: "#9a9a94",
  accent: "#111110", accentStrong: "#000000", accentSoft: "#ececea", accentText: "#111110",
  performance: "#111110", lcaAccent: "#3f6252", lccAccent: "#756334", sensitivityAccent: "#4f5b6b", validationAccent: "#111110",
  success: "#4f6f45", warn: "#9a5d2e", danger: "#a5453f",
  info: "#4f5b6b", rose: "#8b5b67", amber: "#756334", violet: "#68636f", cyan: "#4f6b74",
  tooltipBg: "#ffffff", divider: "#e8e8e5",
  glass: "rgba(255,255,255,0.72)", glassStrong: "rgba(255,255,255,0.9)",
  chartBg: "#ffffff", shadowSm: "0 8px 24px rgba(16,16,15,0.07)",
  shadowMd: "0 20px 48px rgba(16,16,15,0.10)",
  badgeInfoBg: "#ececea", badgeInfoText: "#323230",
  badgeCalcBg: "#ececea", badgeCalcText: "#323230",
  badgeProxyBg: "#efefed", badgeProxyText: "#4d4d49",
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
  accent: "#fffaf2", accentStrong: "#ffffff", accentSoft: "#34332e", accentText: "#fffaf2",
  performance: "#fffaf2", lcaAccent: "#9cb49b", lccAccent: "#c0ad77", sensitivityAccent: "#aeb6c0", validationAccent: "#fffaf2",
  success: "#9cb49b", warn: "#d09a68", danger: "#de7c76",
  info: "#aeb6c0", rose: "#c99aa6", amber: "#c0ad77", violet: "#b8b1c2", cyan: "#9eb8bf",
  tooltipBg: "#292822", divider: "#403e37",
  glass: "rgba(37,36,31,0.84)", glassStrong: "rgba(50,48,41,0.95)",
  chartBg: "#1c1c18", shadowSm: "0 8px 24px rgba(0,0,0,0.24)",
  shadowMd: "0 20px 48px rgba(0,0,0,0.34)",
  badgeInfoBg: "#34332e", badgeInfoText: "#fffaf2",
  badgeCalcBg: "#34332e", badgeCalcText: "#fffaf2",
  badgeProxyBg: "#38362f", badgeProxyText: "#d8d3c8",
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
