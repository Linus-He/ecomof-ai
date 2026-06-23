// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { displayValue, formatScore, Panel, StatusPill, text } from "./FinalScreeningShared"

/**
 * @deprecated Legacy DMRS additive contribution view. The current Organic Acid
 * host-guest HGCPS route waterfall is centralized in
 * scoreProvenance/FactorCompressionWaterfall and used by the Step Why Panel.
 */
function labelFor(key, fallback, lang) {
  const labels = {
    co2ActivationPotential: text(lang, "CO2 活化", "CO2 activation"),
    redoxAdaptability: text(lang, "氧化还原适应性", "Redox adaptability"),
    lewisAcidContribution: text(lang, "Lewis 酸贡献", "Lewis acid contribution"),
    defectAnchoringFeasibility: text(lang, "缺陷锚定可行性", "Defect anchoring feasibility"),
    formateAffinityProxy: text(lang, "甲酸盐亲和 proxy", "Formate affinity proxy"),
    aqueousStability: text(lang, "水相稳定支持", "Aqueous stability support"),
    evidenceSupport: text(lang, "证据支持", "Evidence support"),
    leachingRisk: text(lang, "浸出风险", "Leaching risk"),
    aggregationRisk: text(lang, "聚集风险", "Aggregation risk"),
    nodeSubstitutionMismatch: text(lang, "节点取代错配", "Node substitution mismatch"),
  }
  return labels[key] || fallback
}

export function WhyMoWaterfall({ moRecommendation, audit, comparisons, onCompareMoW, lang, t, isMobile }) {
  const contributions = moRecommendation?.contributionBreakdown || []
  const wComparison = (comparisons || []).find(row => row.competitor === "W")
  const maxAbs = Math.max(0.04, ...contributions.map(item => Math.abs(item.value || 0)), moRecommendation?.dmrs || 0)
  const positive = contributions.filter(item => item.value > 0).reduce((sum, item) => sum + item.value, 0)
  const negative = contributions.filter(item => item.value < 0).reduce((sum, item) => sum + item.value, 0)
  return (
    <Panel
      id="organic-acid-final-why-mo"
      eyebrow={text(lang, "解释层", "Explanation layer")}
      title={text(lang, "Why Mo? Waterfall Chart", "Why Mo? Waterfall Chart")}
      t={t}
    >
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.58, padding: 11 }}>
        <ChemicalText value={text(
          lang,
          "瀑布图把 Mo 的活性位价值、缺陷锚定可行性、甲酸盐 proxy、证据支持与浸出 / 聚集 / 节点取代错配惩罚分开展示。",
          "The waterfall separates Mo active-site value, defect anchoring feasibility, formate proxy, evidence support, and leaching / aggregation / node-substitution mismatch penalties."
        )} />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {contributions.map(item => {
          const isPositive = item.value >= 0
          const width = `${Math.max(6, Math.abs(item.value || 0) / maxAbs * 100)}%`
          return (
            <div key={item.key} style={{ display: "grid", gap: 6, gridTemplateColumns: isMobile ? "1fr" : "220px minmax(0, 1fr) 70px", alignItems: "center" }}>
              <strong style={{ color: t.textStrong, fontSize: 12.2, lineHeight: 1.3 }}>
                <ChemicalText value={labelFor(item.key, item.label, lang)} />
              </strong>
              <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, height: 24, overflow: "hidden", position: "relative" }}>
                <div
                  style={{
                    background: isPositive ? (t.accentSoft || t.accent) : (t.warnSoft || t.warn),
                    borderRight: `1px solid ${isPositive ? t.accent : t.warn}`,
                    height: "100%",
                    marginLeft: isPositive ? 0 : "auto",
                    width,
                  }}
                />
                <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, left: "50%", position: "absolute", top: "50%", transform: "translate(-50%, -50%)" }}>
                  {isPositive ? "+" : "-"}
                </span>
              </div>
              <span style={{ color: isPositive ? t.accentText : t.warn, fontSize: 12, fontWeight: 900 }}>
                {isPositive ? "+" : ""}{formatScore(item.value, "0.000")}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))" }}>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 10 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "Positive subtotal", "Positive subtotal")}</span>
          <strong style={{ color: t.textStrong, display: "block", fontSize: 18, marginTop: 4 }}>+{formatScore(positive)}</strong>
        </article>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 10 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "Penalty subtotal", "Penalty subtotal")}</span>
          <strong style={{ color: t.warn, display: "block", fontSize: 18, marginTop: 4 }}>{formatScore(negative)}</strong>
        </article>
        <article style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 9, padding: 10 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "Final DMRS", "Final DMRS")}</span>
          <strong style={{ color: t.textStrong, display: "block", fontSize: 18, marginTop: 4 }}>{formatScore(moRecommendation?.dmrs)}</strong>
        </article>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 10 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "Closest competitor", "Closest competitor")}</span>
          <strong style={{ color: t.textStrong, display: "block", fontSize: 18, marginTop: 4 }}>W</strong>
        </article>
        <article style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, padding: 10 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>DMRS gap</span>
          <strong style={{ color: t.warn, display: "block", fontSize: 18, marginTop: 4 }}>{formatScore(wComparison?.dmrsGap)}</strong>
        </article>
      </div>

      <div style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.55 }}>
        <ChemicalText value={text(
          lang,
          `最可能形态：${displayValue(moRecommendation?.mostLikelyForm)}。节点取代路径不是主解释。`,
          `Most likely form: ${displayValue(moRecommendation?.mostLikelyForm)}. Node substitution is not the primary explanation.`
        )} />
      </div>

      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <StatusPill tone="warn" t={t}>W backup hypothesis</StatusPill>
        <button
          type="button"
          onClick={onCompareMoW}
          style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 34, padding: "7px 10px" }}
        >
          {text(lang, "比较 Mo vs W", "Compare Mo vs W")}
        </button>
      </div>

      {audit?.status === "audit_required" ? (
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, fontSize: 12.3, lineHeight: 1.55, padding: 11 }}>
          <strong style={{ color: t.warn, display: "block", fontSize: 13, marginBottom: 4 }}>
            {text(lang, "Waterfall audit note", "Waterfall audit note")}
          </strong>
          <ChemicalText value={text(
            lang,
            "瀑布图解释当前 demo descriptor 下 Mo 为什么排在第一；若所有扰动中排名不变，需要进一步审计 descriptor 饱和和证据偏倚，不能把该图解读为 Mo 最优性证明。",
            "The waterfall explains why Mo ranks first under the current demo descriptors. If the rank is unchanged across all perturbations, descriptor saturation and evidence bias must be audited; this chart must not be read as proof of Mo optimality."
          )} />
        </div>
      ) : null}
    </Panel>
  )
}
