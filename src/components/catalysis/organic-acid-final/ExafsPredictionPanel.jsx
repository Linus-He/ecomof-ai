// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { Panel, StatusPill, text } from "./FinalScreeningShared"

export function ExafsPredictionPanel({ signature, lang, t, isMobile }) {
  const features = signature?.expectedFeatures || []
  const criteria = signature?.falsificationCriteria || []
  return (
    <Panel
      id="organic-acid-final-exafs"
      eyebrow={text(lang, "可证伪设计假设", "Falsifiable design hypothesis")}
      title={text(lang, "Predicted Mo K-edge EXAFS Signature", "Predicted Mo K-edge EXAFS Signature")}
      t={t}
      actions={<StatusPill tone="warn" t={t}>must-have validation</StatusPill>}
    >
      <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.58, padding: 11 }}>
        <ChemicalText value={text(
          lang,
          `假设：${signature?.hypothesis || "defect-anchored Mo-oxo species"}。反应后 Mo K-edge XANES/EXAFS 是 must-have validation，不能用页面评分替代表征。`,
          `Hypothesis: ${signature?.hypothesis || "defect-anchored Mo-oxo species"}. Post-reaction Mo K-edge XANES/EXAFS is must-have validation and cannot be replaced by page scoring.`
        )} />
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        {features.map(feature => (
          <article key={feature.feature} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 12 }}>
            <strong style={{ color: t.textStrong, fontSize: 13.5 }}><ChemicalText value={feature.feature} /></strong>
            <span style={{ color: t.accentText, fontSize: 12, fontWeight: 900 }}>
              <ChemicalText value={feature.expectedDistanceA ? `${feature.expectedDistanceA} Å` : feature.expectedIntensity || feature.expectedResult} />
            </span>
            <span style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.5 }}>
              <ChemicalText value={feature.interpretation} />
            </span>
          </article>
        ))}
      </div>

      <article style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, display: "grid", gap: 8, padding: 12 }}>
        <strong style={{ color: t.warn, fontSize: 13 }}>{text(lang, "可证伪标准", "Falsification criteria")}</strong>
        <div style={{ display: "grid", gap: 6 }}>
          {criteria.map(item => (
            <span key={item} style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.5 }}>
              <ChemicalText value={item} />
            </span>
          ))}
        </div>
      </article>
    </Panel>
  )
}
