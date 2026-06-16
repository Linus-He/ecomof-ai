// @ts-nocheck
import { useState } from "react"
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { CandidateRankingExplanation } from "./CandidateRankingExplanation"
import { FieldProvenanceButton } from "../ui"

function statusLabel(c, lang) {
  const v = c.verification || {}
  if (v.verifiedMetadata) return { tone: "pass", label: text(lang, "已核验元数据", "Verified Metadata") }
  if (v.quarantined || (v.ambiguityWarnings && v.ambiguityWarnings.length)) return { tone: "fail", label: text(lang, "歧义阻断", "Blocked by Ambiguity") }
  if (v.sourceConfirmed || c.sourceStatus === "confirmed") return { tone: "info", label: text(lang, "仅来源确认", "Source Confirmed Only") }
  if (c.citationStatus === "ready" || v.citationStatus === "ready") return { tone: "proxy", label: text(lang, "仅引用可用", "Citation Ready Only") }
  return { tone: "warn", label: text(lang, "仅预览", "Preview Only") }
}

export function CandidateDecisionDashboard({ trace, candidatesById = {}, lang, t, isMobile }) {
  const traces = trace?.candidateTraces || []
  const [openId, setOpenId] = useState(null)
  const visibleTraces = traces.slice(0, 10)
  const totalRanked = trace?.finalCandidates ?? traces.length
  const metricFields = [
    ["surfaceArea", text(lang, "比表面积", "Surface area")],
    ["poreSizeA", text(lang, "孔径", "Pore size")],
    ["density", text(lang, "密度", "Density")],
    ["bandGap", text(lang, "带隙", "Band gap")],
  ]
  return (
    <section id="candidate-decision-dashboard" data-testid="candidate-decision-dashboard" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "候选决策面板", "Candidate Dashboard")}</strong>
        <span style={{ color: t.faint, fontSize: 10.8, fontWeight: 850 }}>{text(lang, `默认展示 Top ${visibleTraces.length}/${totalRanked}`, `showing top ${visibleTraces.length}/${totalRanked}`)}</span>
      </div>
      <span style={{ color: t.faint, fontSize: 10.8, fontWeight: 850 }}>{text(lang, "排序解释 / Ranking Explanation 可在每个候选中展开。", "Ranking Explanation is available inside each candidate card.")}</span>
      {!visibleTraces.length ? <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "候选 dashboard shell 已就绪，等待候选数据填充。", "Candidate dashboard shell is ready; waiting for candidate data.")}</span> : null}
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {visibleTraces.map(tr => {
          const c = candidatesById[tr.candidateId] || {}
          const st = statusLabel(c, lang)
          return (
            <article key={tr.candidateId} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 10, minWidth: 0 }}>
              <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "space-between" }}>
                <strong style={{ color: t.textStrong, fontSize: 12.6, overflowWrap: "anywhere" }}>#{tr.rank ?? "-"} {tr.displayName}</strong>
                <StatusPill tone={st.tone} t={t}>{st.label}</StatusPill>
              </div>
              <span style={{ color: t.muted, fontSize: 11.2 }}>{text(lang, "最终得分", "Final score")}: {tr.finalScore}</span>
              <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.4, overflowWrap: "anywhere" }}>{text(lang, tr.mainReasonZh, tr.mainReasonEn)}</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                {metricFields.map(([fieldKey, label]) => {
                  const source = c.fieldSources?.[fieldKey]
                  const value = c[fieldKey] ?? source?.value ?? "missing"
                  return (
                    <div key={fieldKey} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, minWidth: 0, padding: "6px 7px" }}>
                      <span style={{ color: t.faint, display: "block", fontSize: 9.8, fontWeight: 850, textTransform: "uppercase" }}>{label}</span>
                      <span style={{ alignItems: "center", color: t.textStrong, display: "inline-flex", fontFamily: "monospace", fontSize: 10.8, fontWeight: 850, marginTop: 3, maxWidth: "100%" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value === null || value === undefined || value === "" ? "missing" : String(value)}</span>
                        <FieldProvenanceButton fieldKey={fieldKey} fieldLabel={label} source={source} lang={lang} />
                      </span>
                    </div>
                  )
                })}
              </div>
              <button type="button" onClick={() => setOpenId(openId === tr.candidateId ? null : tr.candidateId)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontSize: 11, fontWeight: 800, minHeight: 30, padding: "5px 8px" }}>
                {openId === tr.candidateId ? text(lang, "收起决策追踪", "Hide Decision Trace") : text(lang, "查看决策追踪", "View Decision Trace")}
              </button>
              {openId === tr.candidateId ? <CandidateRankingExplanation explanation={tr} lang={lang} t={t} /> : null}
            </article>
          )
        })}
      </div>
      <span style={{ color: t.faint, fontSize: 10.8 }}>{text(lang, "候选状态仅反映元数据与证据进度，不是最终推荐。", "Candidate status reflects metadata/evidence progress only, not a final recommendation.")}</span>
    </section>
  )
}

export default CandidateDecisionDashboard
