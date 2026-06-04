// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { displayValue, formatScore, StatusPill, statusTone, text } from "./FinalScreeningShared"

export function CandidateDecisionDrawer({ candidateTrace, open, onClose, lang, t }) {
  if (!open || !candidateTrace) return null
  const reasons = lang === "zh" ? candidateTrace.reasonsZh || candidateTrace.reasons : candidateTrace.reasons
  const penalties = lang === "zh" ? candidateTrace.penaltiesZh || candidateTrace.penalties : candidateTrace.penalties
  const passed = candidateTrace.decision === "passed"
  const failed = candidateTrace.decision === "failed"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={text(lang, "候选决策抽屉", "Candidate decision drawer")}
      onClick={onClose}
      style={{
        alignItems: "stretch",
        background: "rgba(15, 23, 42, 0.42)",
        display: "grid",
        inset: 0,
        justifyItems: "end",
        position: "fixed",
        zIndex: 9000,
      }}
    >
      <aside
        onClick={event => event.stopPropagation()}
        style={{
          background: t.panel,
          borderLeft: `1px solid ${t.borderStrong || t.border}`,
          boxShadow: t.shadowLg || t.shadowMd,
          display: "grid",
          gap: 12,
          maxWidth: 560,
          overflowY: "auto",
          padding: 16,
          width: "min(94vw, 560px)",
        }}
      >
        <header style={{ alignItems: "start", display: "flex", gap: 10, justifyContent: "space-between" }}>
          <div style={{ display: "grid", gap: 5 }}>
            <strong style={{ color: t.textStrong, fontSize: 18 }}>
              <ChemicalText value={candidateTrace.candidateName} />
            </strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              <StatusPill tone={statusTone(candidateTrace.gateStatus)} t={t}>{candidateTrace.gateStatus}</StatusPill>
              <StatusPill tone={failed ? "fail" : passed ? "pass" : "warn"} t={t}>{candidateTrace.decision}</StatusPill>
              <StatusPill tone={candidateTrace.dataStatus?.tone || "warn"} t={t}>{candidateTrace.dataStatus?.label || "Demo proxy"}</StatusPill>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", minHeight: 32, padding: "5px 9px" }}
          >
            Esc
          </button>
        </header>

        <section style={{ background: failed ? t.badgeWarnBg : t.surface, border: `1px solid ${failed ? t.warn : t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: failed ? t.warn : t.textStrong, fontSize: 13 }}>
            {passed
              ? text(lang, "Why this candidate passed", "Why this candidate passed")
              : failed
                ? text(lang, "Why this candidate failed", "Why this candidate failed")
                : text(lang, "Why this candidate needs review", "Why this candidate needs review")}
          </strong>
          <div style={{ display: "grid", gap: 6 }}>
            {(reasons || []).map(item => (
              <span key={item} style={{ color: t.muted, fontSize: 12.4, lineHeight: 1.5 }}>
                <ChemicalText value={`${passed ? "+" : failed ? "x" : "!"} ${item}`} />
              </span>
            ))}
          </div>
        </section>

        <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>OACS contribution</strong>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            {Object.entries(candidateTrace.oacsContribution || {}).map(([key, value]) => (
              <div key={key} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 3, paddingTop: 7 }}>
                <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{key}</span>
                <strong style={{ color: Number(value) < 0 ? t.warn : t.textStrong, fontSize: 12.5 }}>{formatScore(value)}</strong>
              </div>
            ))}
          </div>
          <div style={{ background: failed ? t.badgeWarnBg : t.badgeInfoBg, border: `1px solid ${failed ? t.warn : t.accent}`, borderRadius: 8, color: t.muted, fontSize: 12.2, lineHeight: 1.45, padding: 9 }}>
            <ChemicalText value={failed || candidateTrace.decision === "needs_review"
              ? text(lang, "OACS forced to 0。高比表面积不能抵消水热稳定性失败。", "OACS forced to 0. High surface area does not override hydrothermal failure.")
              : text(lang, "候选通过硬阈值后才进入 OACS 排序。", "The candidate enters OACS ranking only after passing the hard gate.")}
            />
          </div>
        </section>

        <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "Field-level provenance", "Field-level provenance")}</strong>
          {[
            [text(lang, "来源数据库", "Source database"), candidateTrace.fieldProvenance?.sourceDatabase],
            [text(lang, "来源记录 ID", "Source record ID"), candidateTrace.fieldProvenance?.sourceRecordId],
            [text(lang, "最高水热温度", "Max hydrothermal temp"), `${displayValue(candidateTrace.fieldProvenance?.waterStability?.max_tested_temp_C, "Pending")}C`],
            [text(lang, "处理后 PXRD", "Post-treatment PXRD"), candidateTrace.fieldProvenance?.waterStability?.post_treatment_PXRD_retained === true ? "retained" : "evidence pending"],
          ].map(([label, value]) => (
            <div key={label} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 3, paddingTop: 7 }}>
              <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
              <span style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.45 }}><ChemicalText value={displayValue(value)} /></span>
            </div>
          ))}
        </section>

        {penalties?.length ? (
          <section style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, display: "grid", gap: 6, padding: 11 }}>
            <strong style={{ color: t.warn, fontSize: 13 }}>{text(lang, "Penalties / missing evidence", "Penalties / missing evidence")}</strong>
            {penalties.map(item => (
              <span key={item} style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.45 }}><ChemicalText value={item} /></span>
            ))}
          </section>
        ) : null}
      </aside>
    </div>
  )
}
