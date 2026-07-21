// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { text } from "./FinalScreeningShared"

export function roleColor(role, gateStatus, t) {
  if (gateStatus === "fail") return t.faint || "#94a3b8"
  if (gateStatus === "needs_review") return t.warn || "#d97706"
  if (role === "curated real example") return "#16a34a"
  if (role === "selected curated example") return "#15803d"
  if (role === "mapped fixture") return "#6366f1"
  if (role === "demo proxy") return "#0ea5e9"
  if (role === "primary hypothesis") return t.accentText || "#0ea5e9"
  if (role === "backup hypothesis") return "#38bdf8"
  if (role === "blind baseline") return t.faint || "#94a3b8"
  if (role === "selected scaffold") return t.accentText || "#0ea5e9"
  if (role === "hot spot region") return t.badgeGoodBg || "#d1fae5"
  if (role === "rejected by hard gate") return t.faint || "#94a3b8"
  if (role === "needs review") return t.warn || "#d97706"
  return t.textStrong || "#334155"
}

export function HotSpotMapLegend({ lang, t }) {
  const items = [
    ["primary hypothesis", text(lang, "主假设", "Primary hypothesis")],
    ["backup hypothesis", text(lang, "备用假设", "Backup hypothesis")],
    ["competitive metal", text(lang, "竞争金属", "Competitive metal")],
    ["blind baseline", text(lang, "盲基线", "Blind baseline")],
    ["demo proxy", text(lang, "演示代理", "Demo proxy")],
    ["mapped fixture", text(lang, "映射样例", "Mapped fixture")],
    ["curated real example", text(lang, "已整理真实样例", "Curated real example")],
    ["evidence pending", text(lang, "证据待补", "Evidence pending")],
    ["hot spot region", text(lang, "热点区域", "Hot spot region")],
    ["rejected by hard gate", text(lang, "被硬门控拦截", "Rejected by hard gate")],
    ["needs review", text(lang, "需要复核", "Needs review")],
  ]

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {items.map(([role, label]) => (
        <span key={role} style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, color: t.muted, display: "inline-flex", fontSize: 10.5, fontWeight: 850, gap: 6, lineHeight: 1.1, padding: "5px 8px" }}>
          <span style={{ background: roleColor(role, null, t), border: `1px solid ${role === "demo proxy" || role === "evidence pending" ? t.border : "transparent"}`, borderRadius: 999, display: "inline-flex", height: 9, width: 9 }} />
          <ChemicalText value={label} />
        </span>
      ))}
    </div>
  )
}
