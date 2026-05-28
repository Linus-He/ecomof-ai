import { useEffect, useMemo, useState } from "react"
import { fetchDataJson, useViewport } from "../../shared"
import { ORGANIC_ACID_FONT, SCIENTIFIC_TOKEN_FONT, organicAcidPalette as palette } from "./FormulaInline"
import { CandidateCurationQueue } from "./CandidateCurationQueue"
import { CandidatePriorityMatrix } from "./CandidatePriorityMatrix"
import { CandidateRuleMatchExplorer } from "./CandidateRuleMatchExplorer"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const pct = value => `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`

function SummaryTile({ label, value }) {
  return (
    <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", gap: 4, padding: 10 }}>
      <strong style={{ color: palette.text, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 17 }}>{value}</strong>
      <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.35 }}>{label}</span>
    </div>
  )
}

function CandidateDetail({ candidate, ruleMap, lang }) {
  if (!candidate) return null
  return (
    <aside style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 12, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ color: palette.accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "候选物详情", "Candidate detail")}</div>
        <h3 style={{ color: palette.text, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 20, margin: 0 }}>{candidate.name}</h3>
      </div>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <SummaryTile label={text(lang, "路径相关性", "Pathway relevance")} value={pct(candidate.pathwayRelevance || 0)} />
        <SummaryTile label={text(lang, "证据就绪度", "Evidence readiness")} value={pct(candidate.evidenceReadiness || candidate.evidenceCompleteness || 0)} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(candidate.matchedRules || []).map(ruleId => {
          const rule = ruleMap.get(ruleId)
          return (
            <span key={ruleId} style={{ background: "#fff", border: `1px solid ${palette.border}`, borderRadius: 999, color: palette.muted, fontSize: 11.5, padding: "5px 8px" }}>
              {rule ? text(lang, rule.nameZh, rule.name) : ruleId}
            </span>
          )
        })}
      </div>
      <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>
        <strong style={{ color: palette.text }}>{text(lang, "缺失字段", "Missing fields")}:</strong> {(candidate.missingDescriptors || candidate.missingFields || []).join(", ") || "none"}
      </div>
      <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>
        <strong style={{ color: palette.text }}>{text(lang, "关联路径", "Related pathways")}:</strong> {(candidate.relatedPathways || []).join(", ") || "none"}
      </div>
      <div style={{ color: palette.risk, fontSize: 12, lineHeight: 1.5 }}>
        {(candidate.risks || candidate.risk || []).map(item => <div key={item}>- {item}</div>)}
      </div>
      <div style={{ background: palette.accentSoft, border: `1px solid ${palette.border}`, borderRadius: 9, color: palette.accent, fontSize: 12.5, fontWeight: 800, lineHeight: 1.5, padding: 10 }}>
        {candidate.recommendedAction}
      </div>
    </aside>
  )
}

export function CandidatePrioritizationWorkspace({ lang, selectedCandidateId: externalSelectedCandidateId, onSelectCandidate, onSelectRule, onHighlightEdges }) {
  const { isNarrow } = useViewport()
  const [rules, setRules] = useState([])
  const [queue, setQueue] = useState([])
  const [matrix, setMatrix] = useState([])
  const [selectedRuleId, setSelectedRuleId] = useState("")
  const [selectedCandidateId, setSelectedCandidateId] = useState(externalSelectedCandidateId || "")

  useEffect(() => {
    let active = true
    Promise.all([
      fetchDataJson("organic_acid_candidate_rules.json", []),
      fetchDataJson("organic_acid_candidate_queue.json", []),
      fetchDataJson("organic_acid_priority_matrix.json", []),
    ]).then(([nextRules, nextQueue, nextMatrix]) => {
      if (!active) return
      setRules(Array.isArray(nextRules) ? nextRules : [])
      setQueue(Array.isArray(nextQueue) ? nextQueue : [])
      setMatrix(Array.isArray(nextMatrix) ? nextMatrix : [])
      const first = Array.isArray(nextMatrix) ? nextMatrix[0] : null
      if (first && !selectedCandidateId) setSelectedCandidateId(first.id)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (externalSelectedCandidateId) setSelectedCandidateId(externalSelectedCandidateId)
  }, [externalSelectedCandidateId])

  const ruleMap = useMemo(() => new Map(rules.map(rule => [rule.id, rule])), [rules])
  const mergedCandidate = useMemo(() => {
    const matrixRow = matrix.find(row => row.id === selectedCandidateId)
    const queueRow = queue.find(row => row.id === selectedCandidateId)
    return matrixRow || queueRow ? { ...(queueRow || {}), ...(matrixRow || {}) } : null
  }, [matrix, queue, selectedCandidateId])

  const summary = useMemo(() => {
    const total = matrix.length || queue.length
    const high = matrix.filter(row => row.priorityTier === "high").length
    const needReview = queue.filter(row => row.curationStatus !== "ready_for_screening").length
    const hco3 = rules.find(rule => rule.id === "rule-hco3-activation")?.matchedCandidates?.length || 0
    const avg = queue.length ? queue.reduce((sum, row) => sum + (Number(row.evidenceCompleteness) || 0), 0) / queue.length : 0
    return { total, high, needReview, hco3, avg }
  }, [matrix, queue, rules])

  const selectRule = rule => {
    setSelectedRuleId(rule.id)
    onSelectRule?.(rule.id)
    onHighlightEdges?.(rule.relatedEdges || [])
  }

  const selectCandidate = candidateId => {
    setSelectedCandidateId(candidateId)
    onSelectCandidate?.(candidateId)
    const row = matrix.find(item => item.id === candidateId) || queue.find(item => item.id === candidateId)
    onHighlightEdges?.(row?.relatedEdges || [])
  }

  return (
    <section id="candidate-prioritization-workspace" style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 12, display: "grid", fontFamily: ORGANIC_ACID_FONT, gap: 14, padding: isNarrow ? 12 : 16, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <div style={{ color: palette.accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "Candidate Prioritization Workspace", "Candidate Prioritization Workspace")}
        </div>
        <h2 style={{ color: palette.text, fontSize: isNarrow ? 21 : 24, lineHeight: 1.14, margin: 0 }}>
          {text(lang, "候选物优先级与规则匹配工作台", "Candidate prioritization and rule-match workspace")}
        </h2>
        <p style={{ color: palette.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          {text(lang, "本区把候选物规则匹配、待整理队列和优先级矩阵合并为一个工作台，用于解释哪些 MOF 候选物适合进入路径验证、为什么需要补数据，以及下一步应优先验证什么。", "This workspace merges candidate rule matching, curation queue, and priority matrix to explain which MOF candidates should enter pathway validation, why data gaps matter, and what should be validated next.")}
        </p>
      </header>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <SummaryTile label={text(lang, "候选物总数", "Candidates")} value={summary.total} />
        <SummaryTile label={text(lang, "高优先级候选物", "High priority")} value={summary.high} />
        <SummaryTile label={text(lang, "需要整理", "Need review")} value={summary.needReview} />
        <SummaryTile label={text(lang, "命中 HCO₃⁻ 活化规则", "Match HCO3 activation")} value={summary.hco3} />
        <SummaryTile label={text(lang, "平均证据完整度", "Avg evidence completeness")} value={pct(summary.avg)} />
      </div>

      <div style={{ display: "grid", gap: 13, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.2fr) minmax(280px, 0.8fr)", alignItems: "start" }}>
        <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
          <CandidateRuleMatchExplorer rules={rules} selectedRuleId={selectedRuleId} onSelectRule={selectRule} lang={lang} />
          <CandidateCurationQueue queue={queue} selectedCandidateId={selectedCandidateId} onSelectCandidate={selectCandidate} lang={lang} />
          <CandidatePriorityMatrix rows={matrix} selectedCandidateId={selectedCandidateId} onSelectCandidate={selectCandidate} lang={lang} />
        </div>
        <CandidateDetail candidate={mergedCandidate} ruleMap={ruleMap} lang={lang} />
      </div>
    </section>
  )
}
