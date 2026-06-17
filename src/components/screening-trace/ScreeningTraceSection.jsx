// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { fetchJson } from "../../services/dataService"
import { buildScreeningTrace } from "../../utils/screeningTrace/buildScreeningTrace"
import { ScreeningTraceTimeline } from "./ScreeningTraceTimeline"
import { ScreeningFunnelPanel } from "./ScreeningFunnelPanel"
import { CandidateDecisionDashboard } from "./CandidateDecisionDashboard"
import { CandidateCompareMode } from "./CandidateCompareMode"
import { CandidateReadinessMatrix } from "./CandidateReadinessMatrix"
import { ScreeningDataGapPanel } from "./ScreeningDataGapPanel"
import { ScreeningNextActionPanel } from "./ScreeningNextActionPanel"

const DATABASE_PREVIEW_SUMMARY_FILE = "data/database_precompute/v2_2/scalable_database_preview_summary.json"
const DATABASE_PREVIEW_SUMMARY_FALLBACK_FILE = "data/database_precompute/v2_1/medium_database_preview_summary.json"

function normalizeSummary(payload) {
  if (!payload) return null
  return {
    sourceConfirmedCount: payload.sourceConfirmedCandidates ?? payload.sourceConfirmedCount,
    citationReadyCount: payload.citationReadyCandidates ?? payload.citationReadyCount,
    verifiedMetadataCount: payload.verifiedMetadataCount ?? payload.verifiedMetadataCandidates,
    quarantinedCount: payload.quarantinedCandidates ?? payload.quarantinedCount,
    licenseConfirmedCount: payload.licenseConfirmedCandidates ?? payload.licenseConfirmedCount,
    doiConfirmedCount: payload.doiConfirmedCandidates ?? payload.doiConfirmedCount,
    sourceUrlConfirmedCount: payload.sourceUrlConfirmedCandidates ?? payload.sourceUrlConfirmedCount,
  }
}

function Metric({ label, value, t, tone = "info" }) {
  const color = tone === "warn" ? t.warn : tone === "pass" ? (t.good || t.accentText) : t.textStrong
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 10 }}>
      <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color, fontSize: 18, fontWeight: 920, lineHeight: 1.12, marginTop: 5 }}>{value}</div>
    </div>
  )
}

function DatabasePreviewSummary({ trace, lang, t, isMobile }) {
  return (
    <section id="database-preview-summary" data-testid="database-preview-summary" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "Database Preview Summary", "Database Preview Summary")}</strong>
        <StatusPill tone="warn" t={t}>{text(lang, "Not Final Recommendation", "Not Final Recommendation")}</StatusPill>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <Metric label={text(lang, "Total candidates", "Total candidates")} value={trace.totalCandidates} t={t} />
        <Metric label={text(lang, "Ranked candidates", "Ranked candidates")} value={trace.finalCandidates} t={t} />
        <Metric label={text(lang, "Descriptor complete candidates", "Descriptor complete candidates")} value={trace.descriptorCompleteCount || 0} t={t} />
        <Metric label={text(lang, "Source confirmed candidates", "Source confirmed candidates")} value={trace.sourceConfirmedCount || 0} t={t} />
        <Metric label={text(lang, "Citation ready candidates", "Citation ready candidates")} value={trace.citationReadyCount || 0} t={t} />
        <Metric label={text(lang, "Verified metadata candidates", "Verified metadata candidates")} value={trace.verifiedMetadataCount || 0} t={t} tone={trace.verifiedMetadataCount > 0 ? "pass" : "warn"} />
        <Metric label={text(lang, "Quarantined candidates", "Quarantined candidates")} value={trace.quarantinedCount || 0} t={t} tone={(trace.quarantinedCount || 0) > 0 ? "warn" : "info"} />
        <Metric label={text(lang, "Data Gap Count", "Data Gap Count")} value={trace.dataGapCount || 0} t={t} tone={(trace.dataGapCount || 0) > 0 ? "warn" : "info"} />
      </div>
      {trace.verifiedMetadataCount === 0 ? (
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.muted, fontSize: 12, fontWeight: 850, lineHeight: 1.5, padding: 10 }}>
          {text(lang, "当前为 Database Preview，不是 Verified Screening。结果仅用于透明筛选流程展示和数据缺口识别。", "This is a Database Preview, not Verified Screening. Results are only for transparent screening flow display and data-gap identification.")}
        </div>
      ) : null}
    </section>
  )
}

export function ScreeningTraceSection({ model, verification: verificationProp = null, scenarioLabel = "general", performancePriorityMode = null, lang, t, isMobile }) {
  const [verification, setVerification] = useState(verificationProp)

  useEffect(() => {
    if (verificationProp) { setVerification(verificationProp); return undefined }
    let active = true
    fetchJson(DATABASE_PREVIEW_SUMMARY_FILE, null)
      .then(payload => payload || fetchJson(DATABASE_PREVIEW_SUMMARY_FALLBACK_FILE, null))
      .then(payload => { if (active && payload) setVerification(normalizeSummary(payload)) })
      .catch(() => {})
    return () => { active = false }
  }, [verificationProp])

  const candidates = model?.candidates || []
  const candidatesById = useMemo(() => Object.fromEntries(candidates.map(c => [c.id || c.candidateId, c])), [candidates])
  const trace = useMemo(() => buildScreeningTrace({ model, verification: verification || {}, scenarioLabel, performancePriorityMode }), [model, verification, scenarioLabel, performancePriorityMode])
  const dataReady = candidates.length > 0

  return (
    <div id="screening-trace" data-testid="screening-trace-section" data-shell-ready="true" data-data-ready={dataReady ? "true" : "false"} style={{ display: "grid", gap: 12, scrollMarginTop: 118 }}>
      <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 8, padding: 12 }}>
        <StatusPill tone="proxy" t={t}>{text(lang, "数据库预览", "Database Preview")}</StatusPill>
        {trace.sourceConfirmedCount > 0 ? <StatusPill tone="info" t={t}>{text(lang, `来源确认可用 ${trace.sourceConfirmedCount}`, `Source Confirmed Available ${trace.sourceConfirmedCount}`)}</StatusPill> : null}
        <StatusPill tone={trace.verifiedMetadataCount > 0 ? "pass" : "warn"} t={t}>{text(lang, `已核验元数据 ${trace.verifiedMetadataCount}`, `Verified Metadata ${trace.verifiedMetadataCount}`)}</StatusPill>
        <StatusPill tone="warn" t={t}>{text(lang, "非最终推荐", "Not Final Recommendation")}</StatusPill>
      </section>
      <DatabasePreviewSummary trace={trace} lang={lang} t={t} isMobile={isMobile} />
      {!dataReady ? (
        <section data-testid="screening-trace-loading-shell" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12, lineHeight: 1.55, padding: 12 }}>
          {text(lang, "候选数据仍在加载；筛选过程 shell 已就绪，图表和候选明细会在数据返回后填充。", "Candidate data is still loading; the screening shell is ready and charts/candidate details will fill after data returns.")}
        </section>
      ) : null}
      <ScreeningTraceTimeline trace={trace} lang={lang} t={t} />
      <ScreeningFunnelPanel trace={trace} lang={lang} t={t} />
      <CandidateDecisionDashboard trace={trace} candidatesById={candidatesById} lang={lang} t={t} isMobile={isMobile} />
      <CandidateCompareMode candidates={candidates} lang={lang} t={t} isMobile={isMobile} />
      <CandidateReadinessMatrix candidates={candidates} lang={lang} t={t} isMobile={isMobile} />
      <ScreeningDataGapPanel trace={trace} lang={lang} t={t} isMobile={isMobile} />
      <ScreeningNextActionPanel trace={trace} lang={lang} t={t} />
    </div>
  )
}

export default ScreeningTraceSection
