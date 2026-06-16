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

const GATE_SUMMARY_FILE = "data/database_precompute/v2_0_m/verified_metadata_gate_summary.json"

export function ScreeningTraceSection({ model, verification: verificationProp = null, scenarioLabel = "general", lang, t, isMobile }) {
  const [verification, setVerification] = useState(verificationProp)

  useEffect(() => {
    if (verificationProp) { setVerification(verificationProp); return undefined }
    let active = true
    fetchJson(GATE_SUMMARY_FILE, null)
      .then(payload => { if (active && payload) setVerification(payload) })
      .catch(() => {})
    return () => { active = false }
  }, [verificationProp])

  const candidates = model?.candidates || []
  const candidatesById = useMemo(() => Object.fromEntries(candidates.map(c => [c.id || c.candidateId, c])), [candidates])
  const trace = useMemo(() => buildScreeningTrace({ model, verification: verification || {}, scenarioLabel }), [model, verification, scenarioLabel])

  return (
    <div id="screening-trace" style={{ display: "grid", gap: 12 }}>
      <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 8, padding: 12 }}>
        <StatusPill tone="proxy" t={t}>{text(lang, "数据库预览", "Database Preview")}</StatusPill>
        {trace.sourceConfirmedCount > 0 ? <StatusPill tone="info" t={t}>{text(lang, `来源确认可用 ${trace.sourceConfirmedCount}`, `Source Confirmed Available ${trace.sourceConfirmedCount}`)}</StatusPill> : null}
        <StatusPill tone={trace.verifiedMetadataCount > 0 ? "pass" : "warn"} t={t}>{text(lang, `已核验元数据 ${trace.verifiedMetadataCount}`, `Verified Metadata ${trace.verifiedMetadataCount}`)}</StatusPill>
        <StatusPill tone="warn" t={t}>{text(lang, "非最终推荐", "Not Final Recommendation")}</StatusPill>
      </section>
      <ScreeningTraceTimeline trace={trace} lang={lang} t={t} />
      <ScreeningFunnelPanel trace={trace} lang={lang} t={t} />
      <CandidateDecisionDashboard trace={trace} candidatesById={candidatesById} lang={lang} t={t} isMobile={isMobile} />
      <CandidateCompareMode candidates={candidates} lang={lang} t={t} isMobile={isMobile} />
      <CandidateReadinessMatrix candidates={candidates} lang={lang} t={t} />
      <ScreeningDataGapPanel trace={trace} lang={lang} t={t} isMobile={isMobile} />
      <ScreeningNextActionPanel trace={trace} lang={lang} t={t} />
    </div>
  )
}

export default ScreeningTraceSection
