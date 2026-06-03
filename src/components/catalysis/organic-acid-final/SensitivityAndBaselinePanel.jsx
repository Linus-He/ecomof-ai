// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { formatPercent, MiniMetric, Panel, StatusPill, text } from "./FinalScreeningShared"

export function SensitivityAndBaselinePanel({ sensitivity, moRecommendation, rules, lang, t, isMobile }) {
  const mo = sensitivity?.targetMetal || moRecommendation?.sensitivity
  const robust = Boolean(mo?.robust)
  return (
    <Panel
      id="organic-acid-final-sensitivity"
      eyebrow={text(lang, "稳健性检验", "Robustness check")}
      title={text(lang, "Sensitivity Analysis Card", "Sensitivity Analysis Card")}
      t={t}
      actions={<StatusPill tone={robust ? "pass" : "warn"} t={t}>{robust ? "robust recommendation" : "hypothesis-generating"}</StatusPill>}
    >
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))" }}>
        <MiniMetric label="Monte Carlo" value={`${sensitivity?.iterations || rules?.sensitivityAnalysis?.iterations || 1000}`} t={t} />
        <MiniMetric label={text(lang, "权重扰动", "Weight perturbation")} value={mo?.perturbationRange || "+/-20%"} t={t} />
        <MiniMetric label="Mo Top 1" value={formatPercent(mo?.top1Probability)} t={t} />
        <MiniMetric label="Mo Top 3" value={formatPercent(mo?.top3Probability)} t={t} />
        <MiniMetric label={text(lang, "平均排名", "Mean rank")} value={mo?.meanRank} t={t} />
      </div>
      <div style={{ background: robust ? t.badgeInfoBg : t.badgeWarnBg, border: `1px solid ${robust ? t.accent : t.warn}`, borderRadius: 10, color: t.muted, display: "grid", gap: 6, fontSize: 12.5, lineHeight: 1.58, padding: 12 }}>
        <strong style={{ color: robust ? t.accentText : t.warn, fontSize: 13 }}>
          {robust
            ? text(lang, "Mo Top 3 probability >=85%: Robust high-priority dopant recommendation", "Mo Top 3 probability >=85%: Robust high-priority dopant recommendation")
            : text(lang, "Mo Top 3 probability <85%: Hypothesis-generating candidate", "Mo Top 3 probability <85%: Hypothesis-generating candidate")}
        </strong>
        <span>
          <ChemicalText value={text(
            lang,
            `本轮使用 CRITIC+AHP 基准权重并进行 +/-20% 扰动；Mo 排名标准差 ${mo?.rankStd ?? "Pending"}。`,
            `This run uses CRITIC+AHP base weights with +/-20% perturbation; Mo rank standard deviation is ${mo?.rankStd ?? "Pending"}.`
          )} />
        </span>
      </div>
    </Panel>
  )
}
