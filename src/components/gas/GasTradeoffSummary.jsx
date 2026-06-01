// @ts-nocheck
import { BasisBadge, ChemicalText, SectionTitle, formatGasPairLabel, formatScore100 } from "../../shared"
import { metricNormalizedValue, text } from "./gasViewUtils"

function pickMax(rows, metric) {
  return [...rows].sort((a, b) => (metricNormalizedValue(b, metric, rows) || 0) - (metricNormalizedValue(a, metric, rows) || 0))[0]
}

export function GasTradeoffSummary({ ranked = [], scenario = {}, lang, t }) {
  if (!ranked.length) {
    return (
      <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{text(lang, "Gas trade-off 摘要", "Gas Trade-off Summary")}</SectionTitle>
        <div style={{ color: t.muted, fontSize: 12, marginTop: 8 }}>{text(lang, "当前场景无候选。", "No candidates for this scenario.")}</div>
      </section>
    )
  }
  const balanced = ranked[0]
  const selectivity = pickMax(ranked, "selectivity")
  const capacity = pickMax(ranked, "workingCapacity")
  const regenGap = Math.abs((metricNormalizedValue(selectivity, "selectivity", ranked) || 0) - (metricNormalizedValue(selectivity, "regenerability", ranked) || 0))
  const mainTradeoff = regenGap > 0.34
    ? text(lang, "选择性与可再生性之间存在明显权衡。", "There is a clear trade-off between selectivity and regenerability.")
    : text(lang, "当前候选更接近均衡型排序，但仍需证据等级校正。", "The current set is closer to balanced ranking, but still needs evidence adjustment.")
  const validationPriority = String(balanced?.dataType || "").includes("simulated")
    ? text(lang, "IAST 验证 / 穿透实验", "IAST validation / breakthrough experiment")
    : text(lang, "GCMC 模拟 / 证据升级", "GCMC simulation / evidence upgrade")

  const cards = [
    [text(lang, "综合最均衡候选", "Best balanced candidate"), balanced.displayName, formatScore100(balanced.score, lang), "calc"],
    [text(lang, "选择性最高候选", "Highest selectivity candidate"), selectivity.displayName, `${selectivity.selectivity}`, "info"],
    [text(lang, "工作容量最高候选", "Highest working capacity candidate"), capacity.displayName, `${capacity.workingCapacity} mmol/g`, "proxy"],
    [text(lang, "验证优先级", "Validation priority"), validationPriority, formatGasPairLabel(scenario.gasPair || balanced.gasPair), "warn"],
  ]

  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, minWidth: 0 }}>
      <SectionTitle>{text(lang, "Gas trade-off 摘要", "Gas Trade-off Summary")}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginTop: 12 }}>
        {cards.map(([label, value, note, tone]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <BasisBadge tone={tone}>{label}</BasisBadge>
            <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900, lineHeight: 1.25, marginTop: 8, overflowWrap: "anywhere" }}><ChemicalText value={value} /></div>
            <div style={{ color: t.subtle, fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}><ChemicalText value={note} /></div>
          </div>
        ))}
      </div>
      <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 9, color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 12, padding: 11 }}>
        {text(
          lang,
          `当前候选集中，${balanced.displayName} 更接近均衡型候选；${selectivity.displayName} 选择性突出，但综合优先级仍受可再生性、证据等级或风险扣分限制。建议优先对 ${balanced.displayName} 进行 IAST 或穿透曲线验证，同时保留 ${selectivity.displayName} 作为高选择性机理候选。`,
          `In the current candidate set, ${balanced.displayName} is the most balanced candidate. ${selectivity.displayName} shows strong selectivity, but its overall priority is limited by regenerability, evidence level, or risk penalty. Prioritize IAST or breakthrough validation for ${balanced.displayName}, while keeping ${selectivity.displayName} as a high-selectivity mechanistic candidate.`
        )}{" "}
        {mainTradeoff}
      </div>
    </section>
  )
}
