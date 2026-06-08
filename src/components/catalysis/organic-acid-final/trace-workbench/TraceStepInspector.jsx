// @ts-nocheck
import { ChemicalText } from "../../../common/ChemicalFormula"
import { StatusPill, displayValue, text } from "../FinalScreeningShared"

function Row({ label, value, t }) {
  return (
    <div style={{ borderTop: `1px solid ${t.divider || t.border}`, display: "grid", gap: 3, paddingTop: 7 }}>
      <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}><ChemicalText value={displayValue(value)} /></span>
    </div>
  )
}

export function TraceStepInspector({ step, lang, t }) {
  if (!step) return null
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 14.5 }}><ChemicalText value={text(lang, step.titleZh, step.title)} /></strong>
        <StatusPill tone={step.status === "warning" ? "warn" : "pass"} t={t}>{step.status}</StatusPill>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Row label={text(lang, "输入", "Input")} value={`${step.input?.count || 0} ${step.input?.label || "records"}`} t={t} />
        <Row label={text(lang, "规则", "Rule")} value={text(lang, step.rule?.summaryZh, step.rule?.summary)} t={t} />
        <Row label={text(lang, "公式 / 转换", "Formula / transform")} value={text(lang, step.formula?.summaryZh, step.formula?.summary)} t={t} />
        <Row label={text(lang, "输出", "Output")} value={`${step.output?.count || 0}: ${text(lang, step.output?.decisionZh, step.output?.decision)}`} t={t} />
      </div>
      {step.blockedRecords?.length ? (
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, display: "grid", gap: 6, padding: 9 }}>
          <strong style={{ color: t.warn, fontSize: 12.4 }}>{text(lang, "Blocked records", "Blocked records")}</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {step.blockedRecords.slice(0, 8).map(row => <StatusPill key={row.id} tone="warn" t={t}>{`${row.label}: ${row.status}`}</StatusPill>)}
          </div>
        </div>
      ) : null}
      {step.warnings?.length ? (
        <div style={{ color: t.warn, display: "grid", fontSize: 12.2, fontWeight: 850, gap: 4, lineHeight: 1.45 }}>
          {(lang === "zh" && step.warningsZh?.length ? step.warningsZh : step.warnings).map(item => <span key={item}>• <ChemicalText value={item} /></span>)}
        </div>
      ) : null}
      <div style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}>
        {text(lang, "Evidence IDs", "Evidence IDs")}: {step.evidenceIds?.length ? step.evidenceIds.join(" / ") : text(lang, "待核验", "Pending")}
      </div>
    </section>
  )
}
