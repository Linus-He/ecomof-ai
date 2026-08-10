// @ts-nocheck
// ─── Theme ──────────────────────────────────────────────────────────────────

export const THEME_LIGHT = Object.freeze({
  bg: "#f0eee6", headerBg: "#f0eee6", panel: "#f7f5ef", surface: "#e8e5dc",
  sectionTint: "#ece9e0", card: "#fbfaf6",
  border: "#d1cfc5", borderStrong: "#a7a49b",
  text: "#33322f", textStrong: "#171714", muted: "#625f59",
  subtle: "#747069", faint: "#89857d", veryFaint: "#9c9890",
  accent: "#c6613f", accentStrong: "#a9472b", accentSoft: "#ead8cf", accentText: "#a9472b",
  performance: "#c6613f", lcaAccent: "#6f8355", lccAccent: "#3f7c83", sensitivityAccent: "#7c6b99", validationAccent: "#5e6f87",
  success: "#5f7a4b", warn: "#b94a42", danger: "#b94a42",
  info: "#3f7c83", rose: "#b85f7c", amber: "#a8733f", violet: "#7c6b99", cyan: "#3f7c83",
  tooltipBg: "#fffef9", divider: "#dedbd2",
  glass: "rgba(247,245,239,0.94)", glassStrong: "#fbfaf6",
  chartBg: "#fcfbf7", shadowSm: "0 8px 22px rgba(20,20,19,0.07)",
  shadowMd: "0 18px 45px rgba(20,20,19,0.10)",
  badgeInfoBg: "#e2eceb", badgeInfoText: "#356b70",
  badgeCalcBg: "#e4eadf", badgeCalcText: "#526b42",
  badgeProxyBg: "#ebe7f0", badgeProxyText: "#65577d",
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
  performance: "#e17b59", lcaAccent: "#91a778", lccAccent: "#6da7ad", sensitivityAccent: "#a392bd", validationAccent: "#8292a8",
  success: "#91a778", warn: "#e17b59", danger: "#e06f68",
  info: "#6da7ad", rose: "#d77b99", amber: "#c99a63", violet: "#a392bd", cyan: "#6da7ad",
  tooltipBg: "#292822", divider: "#403e37",
  glass: "rgba(37,36,31,0.84)", glassStrong: "rgba(50,48,41,0.95)",
  chartBg: "#1c1c18", shadowSm: "0 8px 24px rgba(0,0,0,0.24)",
  shadowMd: "0 20px 48px rgba(0,0,0,0.34)",
  badgeInfoBg: "#26393a", badgeInfoText: "#8fc1c5",
  badgeCalcBg: "#30392a", badgeCalcText: "#acc198",
  badgeProxyBg: "#383143", badgeProxyText: "#bcaed1",
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
