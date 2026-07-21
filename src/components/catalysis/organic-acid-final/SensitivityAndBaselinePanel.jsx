// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { formatPercent, MiniMetric, Panel, StatusPill, text } from "./FinalScreeningShared"

export function SensitivityAndBaselinePanel({ sensitivity, moRecommendation, audit, rules, lang, t, isMobile }) {
  const mo = sensitivity?.targetMetal || moRecommendation?.sensitivity
  const robust = Boolean(mo?.robust)
  const auditRequired = audit?.status === "audit_required" || mo?.top1Probability >= 1
  return (
    <Panel
      id="organic-acid-final-sensitivity"
      eyebrow={text(lang, "稳健性检验", "Robustness check")}
      title={text(lang, "敏感性分析", "Sensitivity Analysis Card")}
      t={t}
      actions={<StatusPill tone={auditRequired ? "warn" : robust ? "pass" : "warn"} t={t}>{auditRequired ? text(lang, "稳健但需审计", "robust but audit required") : robust ? text(lang, "稳健推荐", "robust recommendation") : text(lang, "假设生成", "hypothesis-generating")}</StatusPill>}
    >
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))" }}>
        <MiniMetric label="Monte Carlo" value={`${sensitivity?.iterations || rules?.sensitivityAnalysis?.iterations || 1000}`} t={t} />
        <MiniMetric label={text(lang, "权重扰动", "Weight perturbation")} value={mo?.perturbationRange || "+/-20%"} t={t} />
        <MiniMetric label="Mo Top 1" value={formatPercent(mo?.top1Probability)} t={t} />
        <MiniMetric label="Mo Top 3" value={formatPercent(mo?.top3Probability)} t={t} />
        <MiniMetric label={text(lang, "平均排名", "Mean rank")} value={mo?.meanRank} t={t} />
      </div>
      <div style={{ background: auditRequired || !robust ? t.badgeWarnBg : t.badgeInfoBg, border: `1px solid ${auditRequired || !robust ? t.warn : t.accent}`, borderRadius: 10, color: t.muted, display: "grid", gap: 6, fontSize: 12.5, lineHeight: 1.58, padding: 12 }}>
        <strong style={{ color: auditRequired || !robust ? t.warn : t.accentText, fontSize: 13 }}>
          {auditRequired
            ? text(lang, "Mo Top 1 = 100%：结果看似稳健，但仍需审计；这不是 Mo 最优性的证明。", "Mo Top1 = 100%: robust but audit required, not proof of Mo optimality")
            : robust
            ? text(lang, "Mo 进入前三的概率 >=85%：可作为稳健高优先级第二金属推荐。", "Mo Top 3 probability >=85%: Robust high-priority dopant recommendation")
            : text(lang, "Mo 进入前三的概率 <85%：仅作为假设生成候选。", "Mo Top 3 probability <85%: Hypothesis-generating candidate")}
        </strong>
        <span>
          <ChemicalText value={text(
            lang,
            `本轮使用 CRITIC+AHP 基准权重并进行 +/-20% 扰动；Mo 排名标准差 ${mo?.rankStd ?? "Pending"}。${auditRequired ? "若排名完全不变，需审计 descriptor 饱和、source bias 和竞品方差。" : ""}`,
            `This run uses CRITIC+AHP base weights with +/-20% perturbation; Mo rank standard deviation is ${mo?.rankStd ?? "Pending"}. ${auditRequired ? "When the rank is unchanged, descriptor saturation, source bias, and competitor variance must be audited." : ""}`
          )} />
        </span>
        {auditRequired ? (
          <span>
            <ChemicalText value={audit?.recommendedAction} />
          </span>
        ) : null}
      </div>
    </Panel>
  )
}
