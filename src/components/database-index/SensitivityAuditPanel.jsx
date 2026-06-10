// @ts-nocheck
import { useMemo } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { buildSensitivityAuditSummary } from "../../utils/databaseIndex/sensitivityAudit"

function stabilityTone(value) {
  if (value >= 0.8) return "pass"
  if (value >= 0.6) return "proxy"
  return "warn"
}

export function SensitivityAuditPanel({ records = [], lang, t, isMobile }) {
  const audit = useMemo(() => buildSensitivityAuditSummary(records), [records])

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "敏感性审计", "Sensitivity Audit")}</strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            <ChemicalText value={text(
              lang,
              "对预览排序做权重扰动等审计，检查 Top-N 是否稳定。报告稳定性而非精度，不修改 OACS/DMRS 公式。",
              "Audits the preview ordering under weight perturbation to check Top-N stability. It reports stability, not predictive precision, and does not modify OACS/DMRS formulas."
            )} />
          </span>
        </div>
        <StatusPill tone="warn" t={t}>{text(lang, "仅审计", "audit only")}</StatusPill>
      </header>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 9 }}>
          <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "Top-5 稳定性", "Top-5 stability")}</span>
          <StatusPill tone={stabilityTone(audit.top5Stability)} t={t}>{audit.top5Stability.toFixed(2)}</StatusPill>
        </article>
        <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 9 }}>
          <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "Top-10 稳定性", "Top-10 stability")}</span>
          <StatusPill tone={stabilityTone(audit.top10Stability)} t={t}>{audit.top10Stability.toFixed(2)}</StatusPill>
        </article>
        <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 9 }}>
          <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "不稳定候选", "Unstable candidates")}</span>
          <strong style={{ color: t.textStrong, fontSize: 16 }}>{audit.unstableCandidateCount}</strong>
        </article>
        <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 9 }}>
          <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "审计轮数", "Audit runs")}</span>
          <strong style={{ color: t.textStrong, fontSize: 16 }}>{audit.auditRuns}</strong>
        </article>
      </div>

      {audit.sensitiveDescriptors.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span style={{ color: t.muted, fontSize: 11.5, fontWeight: 800 }}>{text(lang, "敏感描述符", "Sensitive descriptors")}:</span>
          {audit.sensitiveDescriptors.slice(0, 6).map(key => (
            <StatusPill key={key} tone="proxy" t={t}>{key}</StatusPill>
          ))}
        </div>
      ) : null}

      <p style={{ color: t.muted, fontSize: 11.5, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(lang, audit.boundaryZh, audit.boundary)} />
      </p>
    </section>
  )
}

export default SensitivityAuditPanel
