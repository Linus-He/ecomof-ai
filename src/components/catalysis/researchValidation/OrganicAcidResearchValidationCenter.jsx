// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText } from "../../../shared"
import { buildResearchValidationSummary } from "../../../utils/organicAcidResearchValidation"
import { Panel, ProvenanceButton, StatusPill, ValueWithSource, displayValue, formatScore, text } from "../organic-acid-final/FinalScreeningShared"

const COLORS = {
  Literature: "#2563EB",
  Experimental: "#059669",
  "Expert Review": "#B45309",
  Derived: "#7C3AED",
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

function DonutChart({ buckets, activeType, onSelect, t }) {
  const size = 154
  const radius = 56
  const circumference = 2 * Math.PI * radius
  let offset = 0
  return (
    <svg data-testid="evidence-coverage-donut" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Evidence coverage donut" style={{ height: size, maxWidth: "100%", width: size }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={t.surface} strokeWidth="22" />
      {buckets.map(bucket => {
        const dash = Math.max(0.001, bucket.percent) * circumference
        const strokeDasharray = `${dash} ${circumference - dash}`
        const strokeDashoffset = -offset
        offset += dash
        return (
          <circle
            key={bucket.type}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={COLORS[bucket.type] || t.accent}
            strokeWidth={activeType === bucket.type ? 25 : 20}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ cursor: "pointer", opacity: activeType === "All" || activeType === bucket.type ? 1 : 0.3 }}
            onClick={() => onSelect(bucket.type)}
          />
        )
      })}
      <text x="50%" y="47%" textAnchor="middle" fill={t.textStrong} fontSize="16" fontWeight="900">{buckets.reduce((sum, row) => sum + row.count, 0)}</text>
      <text x="50%" y="60%" textAnchor="middle" fill={t.muted} fontSize="11" fontWeight="700">records</text>
    </svg>
  )
}

export function EvidenceCoverageDashboard({ coverage, lang, t, isMobile }) {
  const [activeType, setActiveType] = useState("All")
  const rows = activeType === "All" ? coverage.rows : coverage.rows.filter(row => row.coverageType === activeType)
  return (
    <section data-testid="evidence-coverage-dashboard" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 12 }}>
      <header>
        <strong style={{ color: t.textStrong, fontSize: 15 }}>{text(lang, "Evidence Coverage Dashboard", "Evidence Coverage Dashboard")}</strong>
        <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45, margin: "4px 0 0" }}>
          {text(lang, "Donut Chart 可点击筛选，Evidence Table 同步联动。", "The donut chart filters the linked Evidence Table.")}
        </p>
      </header>
      <div style={{ alignItems: "center", display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "180px minmax(0, 1fr)" }}>
        <DonutChart buckets={coverage.buckets} activeType={activeType} onSelect={setActiveType} t={t} />
        <div style={{ display: "grid", gap: 8 }}>
          <button type="button" onClick={() => setActiveType("All")} style={{ background: activeType === "All" ? t.badgeInfoBg : t.surface, border: `1px solid ${activeType === "All" ? t.accent : t.border}`, borderRadius: 8, color: activeType === "All" ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.5, fontWeight: 900, minHeight: 30 }}>
            All Evidence
          </button>
          <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            {coverage.buckets.map(bucket => (
              <button key={bucket.type} type="button" onClick={() => setActiveType(bucket.type)} style={{ background: activeType === bucket.type ? t.badgeInfoBg : t.surface, border: `1px solid ${activeType === bucket.type ? COLORS[bucket.type] : t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", display: "grid", gap: 3, padding: 8, textAlign: "left" }}>
                <span style={{ color: COLORS[bucket.type], fontSize: 11, fontWeight: 950 }}>{bucket.type}</span>
                <span style={{ color: t.muted, fontSize: 11 }}>{bucket.count} · {Math.round(bucket.percent * 100)}%</span>
              </button>
            ))}
          </div>
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

export function PathwayConfidenceMatrix({ points, lang, t, isMobile }) {
  const [activeId, setActiveId] = useState(points[0]?.id)
  const active = points.find(point => point.id === activeId) || points[0]
  const width = 420
  const height = 260
  const pad = 34
  return (
    <section data-testid="pathway-confidence-matrix" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 12 }}>
      <header>
        <strong style={{ color: t.textStrong, fontSize: 15 }}>{text(lang, "Pathway Confidence Matrix", "Pathway Confidence Matrix")}</strong>
        <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45, margin: "4px 0 0" }}>X = Evidence Strength · Y = Data Quality</p>
      </header>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 300px" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, minHeight: 260, width: "100%" }}>
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke={t.borderStrong} />
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke={t.borderStrong} />
          <text x={width / 2} y={height - 7} textAnchor="middle" fill={t.muted} fontSize="11">Evidence Strength</text>
          <text x="12" y={height / 2} textAnchor="middle" fill={t.muted} fontSize="11" transform={`rotate(-90 12 ${height / 2})`}>Data Quality</text>
          {points.map(point => {
            const x = pad + point.x * (width - pad * 2)
            const y = height - pad - point.y * (height - pad * 2)
            return (
              <g key={point.id} onClick={() => setActiveId(point.id)} style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={point.id === active?.id ? 8 : 6} fill={point.id === active?.id ? t.accent : "#2563EB"} opacity={0.9} />
                <text x={x + 9} y={y - 7} fill={t.textStrong} fontSize="10">{point.rank || ""}</text>
              </g>
            )
          })}
        </svg>
        {active ? (
          <aside data-testid="evidence-inspector" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "Evidence Inspector", "Evidence Inspector")}</strong>
            <ValueWithSource record={{}} source={active.source} field="candidate" label="Candidate" value={active.name} lang={lang} t={t} />
            <ValueWithSource record={{}} source={active.source} field="evidenceStrength" label="Evidence Strength" value={formatScore(active.evidenceStrength)} lang={lang} t={t} />
            <ValueWithSource record={{}} source={active.source} field="dataQuality" label="Data Quality" value={formatScore(active.dataQuality)} lang={lang} t={t} />
            <StatusPill tone={active.dataQuality < 0.5 ? "warn" : "pass"} t={t}>{active.recommendationClass || "candidate"}</StatusPill>
          </aside>
        ) : null}
      </div>
    </section>
  )
}

export function ValidationPriorityQueue({ rows, lang, t }) {
  return (
    <section data-testid="validation-priority-queue" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <header>
        <strong style={{ color: t.textStrong, fontSize: 15 }}>{text(lang, "Validation Priority Queue", "Validation Priority Queue")}</strong>
        <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45, margin: "4px 0 0" }}>
          Priority Score = Evidence Strength + Data Quality + Experimental Coverage + Confidence.
        </p>
      </header>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: "0 6px", minWidth: 760, width: "100%" }}>
          <thead>
            <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
              <th>Rank</th><th>Candidate</th><th>Priority Score</th><th>Evidence</th><th>Data Quality</th><th>Experimental Coverage</th><th>Provenance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} style={{ color: t.muted, fontSize: 11.5 }}>
                <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, color: t.accentText, fontWeight: 900, padding: 8 }}>#{index + 1}</td>
                <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, color: t.textStrong, fontWeight: 900, padding: 8 }}><ChemicalText value={row.name} /></td>
                <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 8 }}>{row.priorityScore}</td>
                <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 8 }}>{formatScore(row.evidenceStrength)}</td>
                <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 8 }}>{formatScore(row.dataQuality)}</td>
                <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 8 }}>{formatScore(row.experimentalCoverage)}</td>
                <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 8 }}>
                  <ProvenanceButton source={row.source} field="priorityScore" label="Priority Score" value={row.priorityScore} lang={lang} t={t} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function ValidationKnowledgeGraph({ graph, lang, t, isMobile }) {
  const [edgeType, setEdgeType] = useState("all")
  const [activeNodeId, setActiveNodeId] = useState(graph.nodes[0]?.id)
  const visibleEdges = edgeType === "all" ? graph.edges : graph.edges.filter(edge => edge.type === edgeType)
  const activeNode = graph.nodes.find(node => node.id === activeNodeId) || graph.nodes[0]
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
  return (
    <section data-testid="validation-knowledge-graph" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 12 }}>
      <header style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div>
          <strong style={{ color: t.textStrong, fontSize: 15 }}>{text(lang, "Validation Knowledge Graph", "Validation Knowledge Graph")}</strong>
          <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45, margin: "4px 0 0" }}>Candidate / Evidence / Reaction / Experiment nodes.</p>
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
            return <line key={edge.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth="2" opacity="0.75" />
          })}
          {graph.nodes.map(node => {
            const point = positions[node.id]
            const active = node.id === activeNode?.id
            const fill = node.type === "Candidate" ? "#2563EB" : node.type === "Evidence" ? "#7C3AED" : node.type === "Experiment" ? "#059669" : "#B45309"
            return (
              <g key={node.id} onClick={() => setActiveNodeId(node.id)} style={{ cursor: "pointer" }}>
                <circle cx={point.x} cy={point.y} r={active ? 12 : 9} fill={fill} />
                <text x={point.x + 12} y={point.y - 8} fill={t.textStrong} fontSize="10">{node.type}</text>
              </g>
            )
          })}
        </svg>
        <aside data-testid="path-analysis" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 10 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "路径分析", "Path Analysis")}</strong>
          <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}><ChemicalText value={activeNode?.label || "pending"} /></span>
          <StatusPill tone="info" t={t}>{activeNode?.type || "Node"}</StatusPill>
          <span style={{ color: t.faint, fontSize: 11.2, lineHeight: 1.45 }}>
            {visibleEdges.filter(edge => edge.from === activeNode?.id || edge.to === activeNode?.id).length} visible linked edges under filter "{edgeType}".
          </span>
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

  return (
    <Panel
      id="organic-acid-research-validation"
      eyebrow={text(lang, "Research Validation Platform", "Research Validation Platform")}
      title={text(lang, "Organic Acid Research Validation", "Organic Acid Research Validation")}
      t={t}
      style={{ borderColor: t.accent }}
    >
      <div data-testid="organic-acid-research-validation-center" style={{ display: "grid", gap: 12 }}>
        <LabelDiversityAudit audit={summary.labelDiversity} lang={lang} t={t} isMobile={isMobile} />
        <EvidenceCoverageDashboard coverage={summary.evidenceCoverage} lang={lang} t={t} isMobile={isMobile} />
        <PathwayConfidenceMatrix points={summary.confidenceMatrix} lang={lang} t={t} isMobile={isMobile} />
        <ValidationPriorityQueue rows={summary.validationQueue} lang={lang} t={t} />
        <ValidationKnowledgeGraph graph={summary.knowledgeGraph} lang={lang} t={t} isMobile={isMobile} />
      </div>
    </Panel>
  )
}

export default OrganicAcidResearchValidationCenter
