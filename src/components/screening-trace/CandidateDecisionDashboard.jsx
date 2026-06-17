// @ts-nocheck
import { useMemo, useState } from "react"
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { CandidateRankingExplanation } from "./CandidateRankingExplanation"
import { FieldProvenanceButton } from "../ui"

function statusLabel(c, lang) {
  const v = c.verification || {}
  if (v.verifiedMetadata || c.verifiedMetadata) return { tone: "pass", label: text(lang, "已核验元数据", "Verified Metadata") }
  if (v.quarantined || c.quarantined || (v.ambiguityWarnings && v.ambiguityWarnings.length) || (c.ambiguityWarnings && c.ambiguityWarnings.length)) return { tone: "fail", label: text(lang, "歧义阻断", "Blocked by Ambiguity") }
  if (v.sourceConfirmed || c.sourceConfirmed || c.sourceStatus === "confirmed") return { tone: "info", label: text(lang, "仅来源确认", "Source Confirmed Only") }
  if (c.citationStatus === "ready" || c.citationStatus === "confirmed" || v.citationStatus === "ready" || v.citationStatus === "confirmed") return { tone: "proxy", label: text(lang, "仅引用可用", "Citation Ready Only") }
  return { tone: "warn", label: text(lang, "仅预览", "Preview Only") }
}

export function CandidateDecisionDashboard({ trace, candidatesById = {}, lang, t, isMobile }) {
  const traces = trace?.candidateTraces || []
  const [openId, setOpenId] = useState(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [page, setPage] = useState(0)
  const pageSize = 10
  const filteredTraces = useMemo(() => traces.filter(tr => {
    const c = candidatesById[tr.candidateId] || {}
    const haystack = `${tr.displayName || ""} ${tr.candidateId || ""} ${c.sourceDatabase || ""}`.toLowerCase()
    if (query && !haystack.includes(query.toLowerCase())) return false
    if (filter === "verified") return c.verifiedMetadata === true
    if (filter === "source") return c.sourceConfirmed === true || c.sourceStatus === "confirmed"
    if (filter === "blocked") return c.quarantined || (c.ambiguityWarnings || []).length || (c.verificationBlockers || c.verifiedBlockers || []).length
    if (filter === "synthetic") return c.isSyntheticFixture || c.syntheticFixture
    return true
  }), [traces, candidatesById, query, filter])
  const pageCount = Math.max(1, Math.ceil(filteredTraces.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const visibleTraces = filteredTraces.slice(safePage * pageSize, safePage * pageSize + pageSize)
  const totalRanked = trace?.finalCandidates ?? traces.length
  const metricFields = [
    ["surfaceArea", text(lang, "比表面积", "Surface area")],
    ["poreSizeA", text(lang, "孔径", "Pore size")],
    ["density", text(lang, "密度", "Density")],
    ["bandGap", text(lang, "带隙", "Band gap")],
  ]
  const priority = trace?.priorityImpactSummary
  return (
    <section id="candidate-decision-dashboard" data-testid="candidate-decision-dashboard" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "候选决策面板", "Candidate Dashboard")}</strong>
        <span style={{ color: t.faint, fontSize: 10.8, fontWeight: 850 }}>{text(lang, `默认展示 Top ${visibleTraces.length}/${totalRanked}`, `showing top ${visibleTraces.length}/${totalRanked}`)}</span>
      </div>
      <span style={{ color: t.faint, fontSize: 10.8, fontWeight: 850 }}>{text(lang, "排序解释 / Ranking Explanation 可在每个候选中展开。", "Ranking Explanation is available inside each candidate card.")}</span>
      {priority ? (
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, display: "grid", fontSize: 11.5, gap: 5, lineHeight: 1.5, padding: 10 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.4 }}>{text(lang, "当前筛选优先级", "Current performance priority")}: {text(lang, priority.modeLabelZh, priority.modeLabel)}</strong>
          <span>{text(lang, priority.summaryZh, priority.summaryEn)}</span>
          <span>{text(lang, "候选靠前原因会结合当前模式显示；切换优先级后，排序可能向证据、溯源、验证就绪或低风险候选倾斜。", "Candidate reasons reflect the active mode; switching priority can move evidence, provenance, validation-ready, or low-risk candidates upward.")}</span>
        </div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <input
          value={query}
          onChange={event => { setQuery(event.target.value); setPage(0) }}
          placeholder={text(lang, "搜索候选", "Search candidates")}
          style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, fontSize: 11, minHeight: 32, minWidth: isMobile ? "100%" : 190, padding: "6px 8px" }}
        />
        <select
          value={filter}
          onChange={event => { setFilter(event.target.value); setPage(0) }}
          style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, fontSize: 11, minHeight: 32, padding: "6px 8px" }}
        >
          <option value="all">{text(lang, "全部", "All")}</option>
          <option value="verified">{text(lang, "已核验 metadata", "Verified metadata")}</option>
          <option value="source">{text(lang, "来源确认", "Source confirmed")}</option>
          <option value="blocked">{text(lang, "阻断/隔离", "Blocked")}</option>
          <option value="synthetic">{text(lang, "Synthetic fixture", "Synthetic fixture")}</option>
        </select>
      </div>
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
      {filteredTraces.length > pageSize ? (
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <span style={{ color: t.faint, fontSize: 10.8 }}>{text(lang, `第 ${safePage + 1}/${pageCount} 页`, `Page ${safePage + 1}/${pageCount}`)}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" disabled={safePage === 0} onClick={() => setPage(value => Math.max(0, value - 1))} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: safePage === 0 ? t.faint : t.accentText, cursor: safePage === 0 ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 850, minHeight: 30, padding: "5px 8px" }}>
              {text(lang, "上一页", "Previous")}
            </button>
            <button type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: safePage >= pageCount - 1 ? t.faint : t.accentText, cursor: safePage >= pageCount - 1 ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 850, minHeight: 30, padding: "5px 8px" }}>
              {text(lang, "下一页", "Next")}
            </button>
          </div>
        </div>
      ) : null}
      <span style={{ color: t.faint, fontSize: 10.8 }}>{text(lang, "候选状态仅反映元数据与证据进度，不是最终推荐。", "Candidate status reflects metadata/evidence progress only, not a final recommendation.")}</span>
    </section>
  )
}

export default CandidateDecisionDashboard
