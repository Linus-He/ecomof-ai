// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { Panel, StatusBadge, text } from "./FinalScreeningShared"
import { AlgorithmTraceDrawer } from "./AlgorithmTraceDrawer"

export function ExafsPredictionPanel({ signature, trace, lang, t, isMobile }) {
  const features = signature?.expectedFeatures || []
  const criteria = signature?.falsificationCriteria || []
  return (
    <Panel
      id="organic-acid-final-exafs"
      eyebrow={text(lang, "可证伪设计假设", "Falsifiable design hypothesis")}
      title={text(lang, "预测结果 vs 可证伪标准 / Prediction vs Falsification", "Prediction vs Falsification")}
      t={t}
      actions={<div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}><StatusBadge tone="warn" t={t}>must-have validation</StatusBadge><AlgorithmTraceDrawer trace={trace} lang={lang} t={t} compact /></div>}
    >
      <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.58, padding: 11 }}>
        <ChemicalText value={text(
          lang,
          `假设：${signature?.hypothesis || "defect-anchored Mo-oxo species"}。反应后 Mo K-edge XANES/EXAFS 是 must-have validation，不能用页面评分替代表征。`,
          `Hypothesis: ${signature?.hypothesis || "defect-anchored Mo-oxo species"}. Post-reaction Mo K-edge XANES/EXAFS is must-have validation and cannot be replaced by page scoring.`
        )} />
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 12 }}>
          <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{text(lang, "If hypothesis is correct", "If hypothesis is correct")}</strong>
          {features.map(feature => (
            <div key={feature.feature} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 4, paddingTop: 8 }}>
              <strong style={{ color: t.accentText, fontSize: 12.5 }}>
                <ChemicalText value={`+ ${feature.feature} ${feature.expectedDistanceA ? `at ${feature.expectedDistanceA} A` : feature.expectedIntensity || feature.expectedResult}`} />
              </strong>
              <span style={{ color: t.muted, fontSize: 12.1, lineHeight: 1.45 }}>
                <ChemicalText value={feature.interpretation} />
              </span>
            </div>
          ))}
        </article>

        <article style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, display: "grid", gap: 8, padding: 12 }}>
          <strong style={{ color: t.warn, fontSize: 13.5 }}>{text(lang, "If hypothesis fails", "If hypothesis fails")}</strong>
          <div style={{ display: "grid", gap: 7 }}>
            {criteria.map(item => (
              <span key={item} style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.5 }}>
                <ChemicalText value={`x ${item}`} />
              </span>
            ))}
          </div>
        </article>
      </div>
    </Panel>
  )
}
