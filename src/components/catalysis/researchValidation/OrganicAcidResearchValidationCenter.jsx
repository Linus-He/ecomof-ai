// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { ChemicalText } from "../../../shared"
import { ORGANIC_ACID_CONFIDENCE_LEVELS, ORGANIC_ACID_VALIDATION_EVIDENCE_TYPES, buildResearchValidationSummary } from "../../../utils/organicAcidResearchValidation"
import { Panel, ProvenanceButton, StatusPill, ValueWithSource, displayValue, formatScore, text } from "../organic-acid-final/FinalScreeningShared"

const COLORS = {
  Literature: "#2563EB",
  Experimental: "#059669",
  "Expert Review": "#B45309",
  Derived: "#7C3AED",
}

function pct(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return "Pending"
  return `${Math.round(Math.max(0, Math.min(1, numeric)) * 100)}%`
}

function buttonStyle(t, active = false) {
  return {
    background: active ? t.badgeInfoBg : t.surface,
    border: `1px solid ${active ? t.accent : t.border}`,
    borderRadius: 8,
    color: active ? t.accentText : t.textStrong,
    cursor: "pointer",
    fontSize: 11.5,
    fontWeight: 900,
    minHeight: 32,
    padding: "7px 9px",
    textDecoration: "none",
  }
}

function MiniSelect({ label, value, options, onChange, t }) {
  return (
    <label style={{ color: t.faint, display: "grid", fontSize: 10.5, fontWeight: 900, gap: 4, textTransform: "uppercase" }}>
      {label}
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, fontSize: 12, minHeight: 34, padding: "6px 8px" }}
      >
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function ValidationLoopReturnNav({ lang, t }) {
  const links = [
    ["#organic-acid-workbench", text(lang, "返回三路径网络", "Back to pathway network")],
    ["#algorithm-trace-explorer", text(lang, "返回算法追踪器", "Back to algorithm trace")],
    ["#priority", text(lang, "返回候选排序工作台", "Back to candidate prioritization")],
    ["#organic-acid-carbon-flow-graph", text(lang, "返回图论工作台", "Back to graph workbench")],
  ]
  return (
    <nav aria-label="Organic Acid validation loop return navigation" style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {links.map(([href, label]) => (
        <a key={href} href={href} style={buttonStyle(t)}>
          {label}
        </a>
      ))}
    </nav>
  )
}

function MetricTile({ metric, lang, t }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, minWidth: 0, padding: 10 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{metric.label}</span>
      <strong style={{ alignItems: "center", color: t.textStrong, display: "inline-flex", fontSize: 19, lineHeight: 1.12 }}>
        <span>{displayValue(metric.value)}</span>
        <ProvenanceButton source={metric.source} field={metric.id} label={metric.label} value={metric.value} lang={lang} t={t} />
      </strong>
    </article>
  )
}

export function LabelDiversityAudit({ audit, lang, t, isMobile }) {
  return (
    <section data-testid="label-diversity-audit" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div>
          <strong style={{ color: t.textStrong, fontSize: 15 }}>{text(lang, "Label Diversity Audit", "Label Diversity Audit")}</strong>
          <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45, margin: "4px 0 0" }}>
            {text(lang, "统计 DOI、论文、催化剂与实验多样性；DOI 缺口保持可见。", "Counts DOI, paper, catalyst, and experiment diversity; DOI gaps remain visible.")}
          </p>
        </div>
        <StatusPill tone={audit.grade === "Weak" ? "warn" : "pass"} t={t}>{audit.grade}</StatusPill>
      </header>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))" }}>
        {audit.metrics.map(metric => <MetricTile key={metric.id} metric={metric} lang={lang} t={t} />)}
      </div>
    </section>
  )
}

function CoverageBars({ buckets, activeType, onSelect, t, lang }) {
  const total = buckets.reduce((sum, row) => sum + row.count, 0)
  return (
    <div data-testid="evidence-coverage-profile" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 10, padding: 11 }}>
      <div style={{ alignItems: "baseline", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", paddingBottom: 8 }}>
        <strong style={{ color: t.textStrong, fontSize: 20 }}>{total}</strong>
        <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "证据记录", "evidence records")}</span>
      </div>
      {buckets.map(bucket => {
        const active = activeType === "All" || activeType === bucket.type
        return (
          <button
            key={bucket.type}
            type="button"
            aria-pressed={activeType === bucket.type}
            onClick={() => onSelect(bucket.type)}
            style={{ background: "transparent", border: "none", cursor: "pointer", display: "grid", gap: 5, opacity: active ? 1 : .42, padding: 0, textAlign: "left" }}
          >
            <span style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <strong style={{ color: COLORS[bucket.type] || t.accent, fontSize: 10.8 }}>{bucket.type}</strong>
              <span style={{ color: t.muted, fontSize: 10.5 }}>{bucket.count} · {Math.round(bucket.percent * 100)}%</span>
            </span>
            <span style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 3, display: "block", height: 10, overflow: "hidden" }}>
              <span style={{ background: COLORS[bucket.type] || t.accent, display: "block", height: "100%", width: `${bucket.percent * 100}%` }} />
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function EvidenceCoverageDashboard({ coverage, lang, t, isMobile }) {
  const [activeType, setActiveType] = useState("All")
  const rows = activeType === "All" ? coverage.rows : coverage.rows.filter(row => row.coverageType === activeType)
  return (
    <section id="organic-acid-evidence-coverage" data-testid="evidence-coverage-dashboard" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 12, scrollMarginTop: 118 }}>
      <header>
        <strong style={{ color: t.textStrong, fontSize: 15 }}>{text(lang, "Evidence Coverage Dashboard", "Evidence Coverage Dashboard")}</strong>
        <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45, margin: "4px 0 0" }}>
          {text(lang, "点击证据类型即可筛选，下方表格会同步显示对应记录。", "Select an evidence type to filter the linked table.")}
        </p>
      </header>
      <div style={{ alignItems: "center", display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "180px minmax(0, 1fr)" }}>
        <CoverageBars buckets={coverage.buckets} activeType={activeType} onSelect={setActiveType} t={t} lang={lang} />
        <div style={{ alignContent: "start", display: "grid", gap: 10 }}>
          <button type="button" onClick={() => setActiveType("All")} style={{ background: activeType === "All" ? t.badgeInfoBg : t.surface, border: `1px solid ${activeType === "All" ? t.accent : t.border}`, borderRadius: 8, color: activeType === "All" ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.5, fontWeight: 900, minHeight: 30 }}>
            All Evidence
          </button>
          <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>
            {text(lang, "左侧按证据类型显示记录规模与占比。选择任一类型后，表格只保留对应记录；选择 All Evidence 恢复全部来源。", "The profile shows record volume and share by evidence type. Select a type to filter the table, or All Evidence to restore every source.")}
          </p>
        </div>
      </div>
      <div data-testid="evidence-table" style={{ maxHeight: 260, overflow: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: "0 6px", minWidth: 720, width: "100%" }}>
          <thead>
            <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
              <th>Type</th><th>Record ID</th><th>Evidence Tier</th><th>Claim / Source</th><th>Provenance</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 40).map((row, index) => {
              const source = {
                sourceDatabase: row.coverageType,
                sourceRecordId: row.id || row.labelId || row.recordId || `evidence-${index}`,
                sourceUrl: "public/data/organic_acid_final_screening/organic_acid_evidence_records.json",
                sourceDoi: row.sourceDoi,
                evidenceTier: row.evidenceTier,
                value: row.claim || row.sourceCitation || row.taskType,
              }
              return (
                <tr key={`${source.sourceRecordId}-${index}`} style={{ color: t.muted, fontSize: 11.5 }}>
                  <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, color: COLORS[row.coverageType] || t.textStrong, fontWeight: 900, padding: 8 }}>{row.coverageType}</td>
                  <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 8 }}>{source.sourceRecordId}</td>
                  <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 8 }}>{row.evidenceTier}</td>
                  <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 8 }}><ChemicalText value={row.claim || row.sourceCitation || row.taskType || "pending"} /></td>
                  <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 8 }}>
                    <ProvenanceButton source={source} field="evidenceCoverage" label="Evidence Coverage" value={source.value} lang={lang} t={t} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function PathwayConfidenceMatrix({ points, lang, t, isMobile, activeCandidateId, onSelectPoint, onSelectCell }) {
  const [activeId, setActiveId] = useState(points[0]?.id)
  const [targetFilter, setTargetFilter] = useState("all")
  const [evidenceFilter, setEvidenceFilter] = useState("all")
  const [confidenceFilter, setConfidenceFilter] = useState("all")
  const [activeCell, setActiveCell] = useState(null)
  const width = 420
  const height = 260
  const pad = 34
  const targetOptions = useMemo(() => ["all", ...Array.from(new Set(points.map(point => point.targetProduct || "unknown")))], [points])
  const evidenceOptions = useMemo(() => ["all", ...ORGANIC_ACID_VALIDATION_EVIDENCE_TYPES], [])
  const confidenceOptions = useMemo(() => ["all", ...ORGANIC_ACID_CONFIDENCE_LEVELS], [])
  const filteredPoints = useMemo(() => points.filter(point => (
    (targetFilter === "all" || point.targetProduct === targetFilter) &&
    (evidenceFilter === "all" || point.evidenceType === evidenceFilter) &&
    (confidenceFilter === "all" || point.confidenceLevel === confidenceFilter)
  )), [points, targetFilter, evidenceFilter, confidenceFilter])
  const active = filteredPoints.find(point => point.id === activeCandidateId) ||
    filteredPoints.find(point => point.id === activeId) ||
    filteredPoints[0] ||
    null
  const bins = [
    { id: "low", label: "Low", min: 0, max: 0.5 },
    { id: "medium", label: "Moderate", min: 0.5, max: 0.72 },
    { id: "high", label: "High", min: 0.72, max: 1.01 },
  ]
  const selectPoint = (point) => {
    if (!point) return
    setActiveId(point.id)
    setActiveCell(null)
    onSelectPoint?.(point)
  }
  const selectCell = (xBin, yBin, cellPoints) => {
    const cell = { id: `${xBin.id}-${yBin.id}`, xBin, yBin, points: cellPoints }
    setActiveCell(cell)
    if (cellPoints[0]) {
      setActiveId(cellPoints[0].id)
      onSelectPoint?.(cellPoints[0])
    }
    onSelectCell?.(cell)
  }
  return (
    <section id="organic-acid-confidence-matrix" data-testid="pathway-confidence-matrix" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 12, scrollMarginTop: 118 }}>
      <header>
        <strong style={{ color: t.textStrong, fontSize: 15 }}>{text(lang, "Pathway Confidence Matrix", "Pathway Confidence Matrix")}</strong>
        <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45, margin: "4px 0 0" }}>
          X = Evidence Strength · Y = Data Quality · {text(lang, "按目标产物、证据类型和置信等级筛选。", "Filter by target product, evidence type, and confidence level.")}
        </p>
      </header>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        <MiniSelect label="Target product" value={targetFilter} options={targetOptions} onChange={setTargetFilter} t={t} />
        <MiniSelect label="Evidence type" value={evidenceFilter} options={evidenceOptions} onChange={setEvidenceFilter} t={t} />
        <MiniSelect label="Confidence level" value={confidenceFilter} options={confidenceOptions} onChange={setConfidenceFilter} t={t} />
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 300px" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, minHeight: 260, width: "100%" }}>
          {bins.map((xBin, xIndex) => bins.map((yBin, yIndex) => {
            const cellPoints = filteredPoints.filter(point => point.x >= xBin.min && point.x < xBin.max && point.y >= yBin.min && point.y < yBin.max)
            const rectWidth = (width - pad * 2) / bins.length
            const rectHeight = (height - pad * 2) / bins.length
            const x = pad + xIndex * rectWidth
            const y = pad + (bins.length - 1 - yIndex) * rectHeight
            const selected = activeCell?.id === `${xBin.id}-${yBin.id}`
            return (
              <g key={`${xBin.id}-${yBin.id}`} data-testid="confidence-matrix-cell" onClick={() => selectCell(xBin, yBin, cellPoints)} style={{ cursor: "pointer" }}>
                <rect x={x} y={y} width={rectWidth} height={rectHeight} fill={selected ? t.badgeInfoBg : cellPoints.length ? "rgba(37,99,235,0.08)" : "transparent"} stroke={t.border} strokeWidth="1" />
                {cellPoints.length ? <text x={x + rectWidth - 8} y={y + 14} textAnchor="end" fill={t.faint} fontSize="10">{cellPoints.length}</text> : null}
              </g>
            )
          }))}
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke={t.borderStrong} />
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke={t.borderStrong} />
          <text x={width / 2} y={height - 7} textAnchor="middle" fill={t.muted} fontSize="11">Evidence Strength</text>
          <text x="12" y={height / 2} textAnchor="middle" fill={t.muted} fontSize="11" transform={`rotate(-90 12 ${height / 2})`}>Data Quality</text>
          {filteredPoints.map(point => {
            const x = pad + point.x * (width - pad * 2)
            const y = height - pad - point.y * (height - pad * 2)
            const isActive = point.id === active?.id
            const fill = point.confidenceLevel === "high" ? "#059669" : point.confidenceLevel === "medium" ? "#2563EB" : "#B45309"
            return (
              <g key={point.id} onClick={() => selectPoint(point)} style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={isActive ? 9 : 6} fill={isActive ? t.accent : fill} opacity={0.9} stroke={isActive ? t.textStrong : "transparent"} strokeWidth="2" />
                <text x={x + 9} y={y - 7} fill={t.textStrong} fontSize="10">{point.rank || ""}</text>
              </g>
            )
          })}
        </svg>
        {active ? (
          <aside data-testid="evidence-inspector" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "Evidence Inspector", "Evidence Inspector")}</strong>
            <ValueWithSource record={{}} source={active.source} field="candidate" label="Candidate" value={active.name} lang={lang} t={t} />
            <ValueWithSource record={{}} source={active.source} field="targetProduct" label="Target Product" value={active.targetProduct} lang={lang} t={t} />
            <ValueWithSource record={{}} source={active.source} field="evidenceType" label="Evidence Type" value={active.evidenceType} lang={lang} t={t} />
            <ValueWithSource record={{}} source={active.source} field="confidenceLevel" label="Confidence Level" value={active.confidenceLevel} lang={lang} t={t} />
            <ValueWithSource record={{}} source={active.source} field="evidenceStrength" label="Evidence Strength" value={formatScore(active.evidenceStrength)} lang={lang} t={t} />
            <ValueWithSource record={{}} source={active.source} field="dataQuality" label="Data Quality" value={formatScore(active.dataQuality)} lang={lang} t={t} />
            <StatusPill tone={active.confidenceLevel === "low" || active.dataQuality < 0.5 ? "warn" : "pass"} t={t}>{active.recommendationClass || "candidate"}</StatusPill>
            <div style={{ display: "grid", gap: 5 }}>
              <strong style={{ color: t.textStrong, fontSize: 11.8 }}>Low-confidence reason / 低置信度原因</strong>
              {(active.lowConfidenceReasons || [active.confidenceReason]).map(reason => (
                <span key={reason} style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{reason}</span>
              ))}
            </div>
            {activeCell ? (
              <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 11.5, lineHeight: 1.45, padding: 8 }}>
                {text(lang, "当前单元格", "Active cell")}: {activeCell.xBin.label} evidence / {activeCell.yBin.label} quality · {activeCell.points.length} candidates
              </div>
            ) : null}
            <a href="#organic-acid-knowledge-graph" style={{ ...buttonStyle(t, true), textAlign: "center" }}>
              {text(lang, "联动知识图谱", "Highlight in Knowledge Graph")}
            </a>
          </aside>
        ) : (
          <aside data-testid="evidence-inspector" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, color: t.muted, fontSize: 12, lineHeight: 1.5, padding: 10 }}>
            {text(lang, "当前筛选无候选；保留 unknown / missing fallback，不填充无来源结果。", "No candidate matches the filters; unknown / missing fallback is shown without fabricated results.")}
          </aside>
        )}
      </div>
    </section>
  )
}

export function ValidationPriorityQueue({ rows, lang, t, activeCandidateId, onSelectCandidate }) {
  return (
    <section id="organic-acid-priority-queue" data-testid="validation-priority-queue" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12, scrollMarginTop: 118 }}>
      <header>
        <strong style={{ color: t.textStrong, fontSize: 15 }}>{text(lang, "Validation Priority Queue", "Validation Priority Queue")}</strong>
        <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45, margin: "4px 0 0" }}>
          {text(lang, "研究任务队列：每个候选展示目标产物、风险、缺失数据、下一步实验、现在验证原因和字段级溯源。", "Research task queue: each candidate shows target product, risks, missing data, next experiment, why-now rationale, and source trace.")}
        </p>
      </header>
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((row, index) => {
          const active = row.id === activeCandidateId
          return (
            <article key={row.id} data-testid="priority-queue-item" style={{ background: active ? t.badgeInfoBg : t.surface, border: `1px solid ${active ? t.accent : t.border}`, borderRadius: 10, display: "grid", gap: 9, padding: 10 }}>
              <button type="button" onClick={() => onSelectCandidate?.(row)} style={{ alignItems: "start", background: "transparent", border: "none", color: "inherit", cursor: "pointer", display: "grid", gap: 8, padding: 0, textAlign: "left" }}>
                <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
                  <strong style={{ color: t.textStrong, fontSize: 13.2, lineHeight: 1.35 }}>
                    #{index + 1} <ChemicalText value={row.candidate || row.name} /> · {row.mof || row.name}
                  </strong>
                  <span style={{ color: t.accentText, fontSize: 18, fontWeight: 950 }}>{row.priorityScore}</span>
                </div>
                <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", width: "100%" }}>
                  <span style={{ color: t.muted, fontSize: 11.5 }}><strong style={{ color: t.faint }}>Pathway</strong><br />{row.pathway}</span>
                  <span style={{ color: t.muted, fontSize: 11.5 }}><strong style={{ color: t.faint }}>Target product</strong><br />{row.targetProduct}</span>
                  <span style={{ color: t.muted, fontSize: 11.5 }}><strong style={{ color: t.faint }}>Evidence coverage</strong><br />{pct(row.evidenceCoverage?.score ?? row.experimentalCoverage)} · {row.evidenceType}</span>
                  <span style={{ color: t.muted, fontSize: 11.5 }}><strong style={{ color: t.faint }}>Confidence level</strong><br />{row.confidenceLevel}</span>
                </div>
              </button>
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
                <div style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.45 }}>
                  <strong style={{ color: t.textStrong }}>Key risks</strong><br />
                  {(row.keyRisks || []).slice(0, 3).join(" · ")}
                </div>
                <div style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.45 }}>
                  <strong style={{ color: t.textStrong }}>Missing data</strong><br />
                  {(row.missingData || []).slice(0, 4).join(" · ")}
                </div>
                <div style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.45 }}>
                  <strong style={{ color: t.textStrong }}>Suggested next experiment</strong><br />
                  {row.suggestedNextExperiment}
                </div>
              </div>
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, display: "grid", fontSize: 11.5, gap: 5, lineHeight: 1.45, padding: 8 }}>
                <span><strong style={{ color: t.textStrong }}>Why this candidate now</strong>: {row.whyNow}</span>
                <span><strong style={{ color: t.textStrong }}>Score explanation</strong>: {row.scoreExplanation}</span>
                <span>
                  <strong style={{ color: t.textStrong }}>Source trace</strong>
                  <ProvenanceButton source={row.source} field="priorityScore" label="Priority Score" value={row.priorityScore} lang={lang} t={t} />
                  {(row.sourceTrace || []).slice(0, 3).map(trace => (
                    <span key={`${trace.label}-${trace.sourceRecordId}`} style={{ display: "block", marginTop: 3 }}>
                      {trace.label}: {trace.sourceDatabase} · {trace.sourceRecordId} · {trace.evidenceTier}
                    </span>
                  ))}
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function ValidationKnowledgeGraph({ graph, lang, t, isMobile, activeCandidateId, highlightedCandidateIds = [], onSelectCandidate }) {
  const [edgeType, setEdgeType] = useState("all")
  const [activeNodeId, setActiveNodeId] = useState(graph.nodes[0]?.id)
  const [activeEdgeId, setActiveEdgeId] = useState("")
  const visibleEdges = edgeType === "all" ? graph.edges : graph.edges.filter(edge => edge.type === edgeType)
  const highlighted = new Set([activeCandidateId, ...highlightedCandidateIds].filter(Boolean))
  const activeNode = graph.nodes.find(node => node.id === activeNodeId) || graph.nodes.find(node => highlighted.has(node.candidateId)) || graph.nodes[0]
  const activeEdge = graph.edges.find(edge => edge.id === activeEdgeId)
  const width = 520
  const height = 300
  const positions = graph.nodes.reduce((acc, node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, graph.nodes.length)
    acc[node.id] = {
      x: width / 2 + Math.cos(angle) * 190,
      y: height / 2 + Math.sin(angle) * 105,
    }
    return acc
  }, {})
  useEffect(() => {
    if (!activeCandidateId) return
    const candidateNode = graph.nodes.find(node => node.candidateId === activeCandidateId && node.type === "Candidate")
    if (candidateNode) {
      setActiveNodeId(candidateNode.id)
      setActiveEdgeId("")
    }
  }, [activeCandidateId, graph.nodes])
  const selectNode = (node) => {
    setActiveNodeId(node.id)
    setActiveEdgeId("")
    if (node.candidateId) onSelectCandidate?.({ id: node.candidateId, name: node.label })
  }
  const selectEdge = (edge, event) => {
    event?.stopPropagation?.()
    setActiveEdgeId(edge.id)
    if (edge.candidateId) onSelectCandidate?.({ id: edge.candidateId, name: edge.candidateId })
  }
  return (
    <section id="organic-acid-knowledge-graph" data-testid="validation-knowledge-graph" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 12, scrollMarginTop: 118 }}>
      <header style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div>
          <strong style={{ color: t.textStrong, fontSize: 15 }}>{text(lang, "Validation Knowledge Graph", "Validation Knowledge Graph")}</strong>
          <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45, margin: "4px 0 0" }}>
            Candidate / Evidence / Reaction / Experiment nodes · {text(lang, "与 Priority Queue 和 Confidence Matrix 联动高亮。", "Linked highlights from Priority Queue and Confidence Matrix.")}
          </p>
        </div>
        <ProvenanceButton source={graph.source} field="validationKnowledgeGraph" label="Validation Knowledge Graph" value={`${graph.nodes.length}/${graph.edges.length}`} lang={lang} t={t} />
      </header>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {["all", "supports", "contradicts", "pending"].map(type => (
          <button key={type} type="button" onClick={() => setEdgeType(type)} style={{ background: edgeType === type ? t.badgeInfoBg : t.surface, border: `1px solid ${edgeType === type ? t.accent : t.border}`, borderRadius: 7, color: edgeType === type ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.5, fontWeight: 900, minHeight: 30, padding: "6px 8px" }}>
            {type}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 280px" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, minHeight: 280, width: "100%" }}>
          {visibleEdges.map(edge => {
            const from = positions[edge.from]
            const to = positions[edge.to]
            if (!from || !to) return null
            const color = edge.type === "supports" ? "#059669" : edge.type === "contradicts" ? "#DC2626" : "#B45309"
            const active = edge.id === activeEdgeId || highlighted.has(edge.candidateId)
            return <line key={edge.id} data-testid="knowledge-graph-edge" x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={active ? "5" : "2"} opacity={active ? "0.95" : "0.62"} onClick={(event) => selectEdge(edge, event)} style={{ cursor: "pointer" }} />
          })}
          {graph.nodes.map(node => {
            const point = positions[node.id]
            const active = node.id === activeNode?.id || highlighted.has(node.candidateId)
            const fill = node.type === "Candidate" ? "#2563EB" : node.type === "Evidence" ? "#7C3AED" : node.type === "Experiment" ? "#059669" : "#B45309"
            return (
              <g key={node.id} data-testid="knowledge-graph-node" onClick={() => selectNode(node)} style={{ cursor: "pointer" }}>
                <circle cx={point.x} cy={point.y} r={active ? 13 : 9} fill={fill} stroke={active ? t.textStrong : "transparent"} strokeWidth="2" />
                <text x={point.x + 12} y={point.y - 8} fill={t.textStrong} fontSize="10">{node.type}</text>
              </g>
            )
          })}
        </svg>
        <aside data-testid="path-analysis" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 10 }}>
          {activeEdge ? (
            <>
              <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "关系证据", "Edge Evidence")}</strong>
              <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}><ChemicalText value={activeEdge.explanation || activeEdge.id} /></span>
              <StatusPill tone={activeEdge.type === "contradicts" ? "fail" : activeEdge.type === "pending" ? "warn" : "pass"} t={t}>{activeEdge.relationType || activeEdge.type}</StatusPill>
              <ValueWithSource record={{}} source={activeEdge.source} field="edgeEvidenceTier" label="Evidence Tier" value={activeEdge.evidenceTier} lang={lang} t={t} />
              <ValueWithSource record={{}} source={activeEdge.source} field="edgeSource" label="Source" value={activeEdge.source?.sourceRecordId || activeEdge.id} lang={lang} t={t} />
            </>
          ) : (
            <>
              <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "路径分析", "Path Analysis")}</strong>
              <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}><ChemicalText value={activeNode?.label || "pending"} /></span>
              <StatusPill tone="info" t={t}>{activeNode?.type || "Node"}</StatusPill>
              <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{activeNode?.explanation || "Node explanation pending."}</span>
              <ValueWithSource record={{}} source={activeNode?.source} field="nodeConfidence" label="Confidence" value={activeNode?.confidence || "pending"} lang={lang} t={t} />
              <span style={{ color: t.faint, fontSize: 11.2, lineHeight: 1.45 }}>
                {visibleEdges.filter(edge => edge.from === activeNode?.id || edge.to === activeNode?.id).length} visible linked edges under filter "{edgeType}".
              </span>
              <span style={{ color: t.faint, fontSize: 11.2, lineHeight: 1.45 }}>
                Related candidates: {(activeNode?.relatedCandidates || []).join(", ") || "pending"}
              </span>
              <a href="#organic-acid-final-decision-board" style={{ ...buttonStyle(t, true), textAlign: "center" }}>
                Candidate Explanation
              </a>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}

export function OrganicAcidResearchValidationCenter({ result, evidenceRecords, experimentalLabels, benchmarkDataset, lang, t, isMobile }) {
  const summary = useMemo(() => buildResearchValidationSummary({
    result,
    evidenceRecords,
    labels: experimentalLabels,
    benchmarkDataset,
  }), [result, evidenceRecords, experimentalLabels, benchmarkDataset])
  const [activeCandidateId, setActiveCandidateId] = useState("")
  const [highlightedCandidateIds, setHighlightedCandidateIds] = useState([])
  const defaultCandidateId = summary.validationQueue?.[0]?.id || summary.confidenceMatrix?.[0]?.id || ""

  useEffect(() => {
    if (!activeCandidateId && defaultCandidateId) setActiveCandidateId(defaultCandidateId)
  }, [activeCandidateId, defaultCandidateId])

  const selectCandidate = (candidate) => {
    const id = candidate?.id || candidate?.candidateId
    if (!id) return
    setActiveCandidateId(id)
    setHighlightedCandidateIds([id])
  }

  return (
    <Panel
      id="organic-acid-research-validation"
      eyebrow={text(lang, "Research Validation Platform", "Research Validation Platform")}
      title={text(lang, "Organic Acid Research Validation", "Organic Acid Research Validation")}
      t={t}
      style={{ borderColor: t.accent }}
    >
      <div data-testid="organic-acid-research-validation-center" style={{ display: "grid", gap: 12 }}>
        <ValidationLoopReturnNav lang={lang} t={t} />
        <LabelDiversityAudit audit={summary.labelDiversity} lang={lang} t={t} isMobile={isMobile} />
        <EvidenceCoverageDashboard coverage={summary.evidenceCoverage} lang={lang} t={t} isMobile={isMobile} />
        <PathwayConfidenceMatrix
          points={summary.confidenceMatrix}
          lang={lang}
          t={t}
          isMobile={isMobile}
          activeCandidateId={activeCandidateId}
          onSelectPoint={selectCandidate}
          onSelectCell={(cell) => setHighlightedCandidateIds(cell.points.map(point => point.id))}
        />
        <ValidationPriorityQueue rows={summary.validationQueue} lang={lang} t={t} activeCandidateId={activeCandidateId} onSelectCandidate={selectCandidate} />
        <ValidationKnowledgeGraph graph={summary.knowledgeGraph} lang={lang} t={t} isMobile={isMobile} activeCandidateId={activeCandidateId} highlightedCandidateIds={highlightedCandidateIds} onSelectCandidate={selectCandidate} />
      </div>
    </Panel>
  )
}

export default OrganicAcidResearchValidationCenter
