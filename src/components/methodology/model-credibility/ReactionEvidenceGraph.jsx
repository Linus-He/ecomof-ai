// @ts-nocheck
// V3.5 Reaction Evidence Graph — interactive SVG of the CO₂ → intermediate →
// formic-acid pathway. Each edge shows evidence count + confidence (colored by
// level). Click a node to highlight / trace the connected edges; click an edge
// for its evidence breakdown. Evidence counts come from the frozen datasets.
import { useMemo, useState } from "react"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const POS = {
  co2: { x: 70, y: 130 },
  hco3: { x: 230, y: 50 },
  c1_intermediate: { x: 400, y: 50 },
  hcoo: { x: 520, y: 130 },
  formic_acid: { x: 660, y: 130 },
}

export function ReactionEvidenceGraph({ graph = null, lang = "en", t, isMobile = false }) {
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedEdge, setSelectedEdge] = useState(null)
  const nodeById = useMemo(() => Object.fromEntries((graph?.nodes || []).map(n => [n.id, n])), [graph])
  if (!graph?.nodes?.length) return null
  const confColor = level => (level === "High" ? t.success : level === "Medium" ? t.accent : t.warn)

  const edgeActive = e => !selectedNode || e.source === selectedNode || e.target === selectedNode

  return (
    <section
      id="organic-acid-reaction-evidence-graph"
      data-testid="reaction-evidence-graph"
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 10, minWidth: 0, padding: 14 }}
    >
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Reaction Evidence Graph</span>
        <h3 style={{ color: t.textStrong, fontSize: 16, margin: 0 }}>{text(lang, "反应证据图 · CO₂ → 甲酸", "Reaction Evidence Graph · CO₂ → Formic Acid")}</h3>
        <p style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.5, margin: 0 }}>{text(lang, "每条边显示证据数量与置信度；点击节点追踪路径。证据数来自现有数据集，假设边已标注。", "Each edge shows evidence count + confidence; click a node to trace its path. Evidence counts come from existing datasets; hypothesis edges are flagged.")}</p>
      </header>

      <div style={{ overflowX: "auto" }}>
        <svg viewBox="0 0 730 200" role="img" aria-label="CO2 to formic acid reaction evidence graph" style={{ display: "block", minWidth: isMobile ? 560 : "100%", width: "100%" }}>
          {graph.edges.map((e, i) => {
            const a = POS[e.source]; const b = POS[e.target]
            if (!a || !b) return null
            const active = edgeActive(e)
            const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2
            return (
              <g key={i} opacity={active ? 1 : 0.25} style={{ cursor: "pointer" }} onClick={() => setSelectedEdge(selectedEdge === i ? null : i)} data-testid={`edge-${e.source}-${e.target}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={confColor(e.confidence)} strokeWidth={selectedEdge === i ? 4 : 2 + Math.min(3, e.evidenceCount / 15)} />
                <circle cx={mx} cy={my} r="9" fill={t.panel} stroke={confColor(e.confidence)} />
                <text x={mx} y={my + 3} textAnchor="middle" fontSize="9" fontWeight="800" fill={confColor(e.confidence)}>{e.evidenceCount}</text>
              </g>
            )
          })}
          {graph.nodes.map(n => {
            const p = POS[n.id]; if (!p) return null
            const sel = selectedNode === n.id
            return (
              <g key={n.id} style={{ cursor: "pointer" }} onClick={() => setSelectedNode(sel ? null : n.id)} data-testid={`node-${n.id}`}>
                <rect x={p.x - 46} y={p.y - 16} width="92" height="32" rx="8" fill={sel ? t.accent : t.surface} stroke={sel ? t.accentStrong || t.accent : t.border} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={sel ? t.panel : t.textStrong}>{n.label}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {selectedEdge != null ? (
        <div data-testid="edge-detail" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 11.3, lineHeight: 1.5, padding: 10 }}>
          {(() => { const e = graph.edges[selectedEdge]; return text(lang,
            `${nodeById[e.source]?.label} → ${nodeById[e.target]?.label}：${e.label}。证据 ${e.evidenceCount}（实验 ${e.experimentalCount} · 文献 ${e.literatureCount} · 派生 ${e.derivedCount}）；置信度 ${e.confidence}。`,
            `${nodeById[e.source]?.label} → ${nodeById[e.target]?.label}: ${e.label}. Evidence ${e.evidenceCount} (experimental ${e.experimentalCount} · literature ${e.literatureCount} · derived ${e.derivedCount}); confidence ${e.confidence}.`) })()}
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[["High", t.success], ["Medium", t.accent], ["Low", t.warn]].map(([label, color]) => (
            <span key={label} style={{ alignItems: "center", color: t.muted, display: "inline-flex", fontSize: 10.8, gap: 5 }}><span style={{ background: color, borderRadius: 2, display: "inline-block", height: 10, width: 14 }} />{label}</span>
          ))}
          <span style={{ color: t.faint, fontSize: 10.8, marginLeft: "auto" }}>{text(lang, `实验证据 ${graph.summary.experimentalEvidence} · 文献 ${graph.summary.literatureEvidence} · 派生 ${graph.summary.derivedEvidence}`, `Experimental ${graph.summary.experimentalEvidence} · Literature ${graph.summary.literatureEvidence} · Derived ${graph.summary.derivedEvidence}`)}</span>
        </div>
      )}
    </section>
  )
}

export default ReactionEvidenceGraph
