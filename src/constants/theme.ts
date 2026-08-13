// @ts-nocheck
// ─── Theme ──────────────────────────────────────────────────────────────────

export const THEME_LIGHT = Object.freeze({
  bg: "#ffffff", headerBg: "rgba(255,255,255,0.78)", panel: "#ffffff", surface: "#f5f5f5",
  sectionTint: "#f7f7f7", card: "#ffffff",
  border: "#dededb", borderStrong: "#aaa9a5",
  text: "#323230", textStrong: "#111110", muted: "#5f5f5b",
  subtle: "#70706b", faint: "#85857f", veryFaint: "#9a9a94",
  accent: "#4aa8d8", accentStrong: "#1677ad", accentSoft: "#dceff8", accentText: "#1677ad",
  performance: "#4aa8d8", lcaAccent: "#4aa8d8", lccAccent: "#4aa8d8", sensitivityAccent: "#4aa8d8", validationAccent: "#4aa8d8",
  success: "#5f7a4b", warn: "#b94a42", danger: "#b94a42",
  info: "#4aa8d8", rose: "#a85b78", amber: "#8b6f35", violet: "#6e6aa8", cyan: "#2e9bb7",
  tooltipBg: "#ffffff", divider: "#e8e8e5",
  glass: "rgba(255,255,255,0.72)", glassStrong: "rgba(255,255,255,0.9)",
  chartBg: "#ffffff", shadowSm: "0 8px 24px rgba(16,16,15,0.07)",
  shadowMd: "0 20px 48px rgba(16,16,15,0.10)",
  badgeInfoBg: "#e4f2f9", badgeInfoText: "#146f9f",
  badgeCalcBg: "#e4f2f9", badgeCalcText: "#146f9f",
  badgeProxyBg: "#e8f0f4", badgeProxyText: "#376d86",
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
  accent: "#68bde5", accentStrong: "#89d0f0", accentSoft: "#173b4d", accentText: "#7bc8eb",
  performance: "#68bde5", lcaAccent: "#68bde5", lccAccent: "#68bde5", sensitivityAccent: "#68bde5", validationAccent: "#68bde5",
  success: "#91a778", warn: "#e29a72", danger: "#e06f68",
  info: "#68bde5", rose: "#d28ba4", amber: "#d2b36f", violet: "#aaa2df", cyan: "#68c9d9",
  tooltipBg: "#292822", divider: "#403e37",
  glass: "rgba(37,36,31,0.84)", glassStrong: "rgba(50,48,41,0.95)",
  chartBg: "#1c1c18", shadowSm: "0 8px 24px rgba(0,0,0,0.24)",
  shadowMd: "0 20px 48px rgba(0,0,0,0.34)",
  badgeInfoBg: "#173b4d", badgeInfoText: "#7bc8eb",
  badgeCalcBg: "#173b4d", badgeCalcText: "#7bc8eb",
  badgeProxyBg: "#203943", badgeProxyText: "#8fc4d7",
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
