import { useEffect, useMemo, useState } from "react"
import { useLang, useT, useViewport } from "../../contexts"
import { fetchDataJson } from "../../services/dataService"
import { toolbarBtn } from "../../utils/styles"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const MODES = [
  { id: "formic", label: "Formic acid focus", labelZh: "甲酸路径" },
  { id: "competing", label: "Competing products", labelZh: "竞争产物" },
  { id: "mof", label: "MOF influence", labelZh: "MOF 影响" },
  { id: "evidence", label: "Evidence view", labelZh: "证据视图" },
]

const DESKTOP_LAYOUT = {
  viewBox: "0 0 920 560",
  nodes: {
    glucose: { x: 36, y: 245, w: 168, h: 78 },
    hco3: { x: 36, y: 96, w: 168, h: 78 },
    c1_intermediate: { x: 366, y: 205, w: 178, h: 78 },
    hcoo: { x: 366, y: 82, w: 178, h: 78 },
    formic_acid: { x: 708, y: 90, w: 176, h: 82 },
    lactic_acid: { x: 708, y: 224, w: 176, h: 76 },
    acetic_acid: { x: 708, y: 318, w: 176, h: 76 },
    glycolic_acid: { x: 708, y: 412, w: 176, h: 76 },
    humins_byproducts: { x: 366, y: 410, w: 178, h: 78 },
  },
}

const MOBILE_LAYOUT = {
  viewBox: "0 0 420 820",
  nodes: {
    glucose: { x: 30, y: 76, w: 158, h: 76 },
    hco3: { x: 232, y: 76, w: 158, h: 76 },
    c1_intermediate: { x: 30, y: 230, w: 158, h: 76 },
    hcoo: { x: 232, y: 230, w: 158, h: 76 },
    formic_acid: { x: 131, y: 380, w: 158, h: 80 },
    lactic_acid: { x: 30, y: 535, w: 158, h: 74 },
    acetic_acid: { x: 232, y: 535, w: 158, h: 74 },
    glycolic_acid: { x: 30, y: 665, w: 158, h: 74 },
    humins_byproducts: { x: 232, y: 665, w: 158, h: 74 },
  },
}

const NODE_TONES = {
  reactant: { stroke: "#1D4ED8", fill: "rgba(37, 99, 235, 0.1)" },
  "co-reactant": { stroke: "#0E7490", fill: "rgba(14, 116, 144, 0.12)" },
  intermediate: { stroke: "#7C3AED", fill: "rgba(124, 58, 237, 0.11)" },
  "target product": { stroke: "#15803D", fill: "rgba(22, 163, 74, 0.14)" },
  "competing product": { stroke: "#D97706", fill: "rgba(217, 119, 6, 0.11)" },
  "by-product": { stroke: "#9F3A38", fill: "rgba(159, 58, 56, 0.1)" },
}

const FORMIC_EDGES = new Set(["glucose->c1_intermediate", "c1_intermediate->hcoo", "hco3->hcoo", "hcoo->formic_acid"])
const COMPETING_NODES = new Set(["lactic_acid", "acetic_acid", "glycolic_acid", "humins_byproducts"])

const EDGE_SHORT_LABELS = {
  "glucose->c1_intermediate": "C1 step",
  "hco3->hcoo": "formate step",
  "c1_intermediate->hcoo": "C1 -> HCOO⁻",
  "hcoo->formic_acid": "release",
  "glucose->lactic_acid": "competing",
  "glucose->acetic_acid": "competing",
  "glucose->glycolic_acid": "competing",
  "glucose->humins_byproducts": "side path",
}

const NODE_RELEVANCE = {
  glucose: "Carbon-source entry point for competing organic-acid routes.",
  hco3: "Bicarbonate pool that may connect to HCOO⁻ interaction hypotheses.",
  c1_intermediate: "Possible mapping target for active motifs and local stabilization hypotheses.",
  hcoo: "Possible mapping target for functional-group and metal-node interaction hypotheses.",
  formic_acid: "Target-product node for formic-acid-oriented decision support.",
  lactic_acid: "Competing product branch retained for selectivity context.",
  acetic_acid: "Competing C2 branch retained for selectivity context.",
  glycolic_acid: "Competing organic-acid branch retained for product-distribution context.",
  humins_byproducts: "Side-product sink retained as a risk branch.",
}

function edgeKey(edge) {
  return `${edge.source}->${edge.target}`
}

function nodeLabel(node) {
  return node?.label || node?.id || "pending"
}

function chemicalLabel(label) {
  return String(label || "")
    .replace(/HCO3[−-]/g, "HCO₃⁻")
    .replace(/HCOO[−-]/g, "HCOO⁻")
    .replace(/CO2/g, "CO₂")
    .replace(/NaHCO3/g, "NaHCO₃")
}

function cleanText(value) {
  return chemicalLabel(String(value || "pending").replace(/_/g, " "))
}

function evidenceStyle(evidenceLevel, dataStatus) {
  const level = `${evidenceLevel || ""} ${dataStatus || ""}`.toLowerCase()
  if (level.includes("literature")) return { dash: "", opacity: 0.95 }
  if (level.includes("hypothesis")) return { dash: "8 6", opacity: 0.76 }
  return { dash: "4 8", opacity: 0.34 }
}

function isMofInfluenced(edge) {
  return Array.isArray(edge.possibleMofInfluence) && edge.possibleMofInfluence.length > 0
}

function candidateRelatedNodes(selectedCandidate) {
  const roles = selectedCandidate?.organicAcidRelevance?.possibleRoles
  if (!Array.isArray(roles)) return new Set()
  return new Set(roles.map(role => role.relatedPathwayNode).filter(Boolean))
}

function candidateRolesForNode(selectedCandidate, nodeId) {
  const roles = selectedCandidate?.organicAcidRelevance?.possibleRoles
  if (!Array.isArray(roles)) return []
  return roles.filter(role => role.relatedPathwayNode === nodeId)
}

function modeEdgeActive(mode, edge, relatedNodes) {
  const key = edgeKey(edge)
  if (relatedNodes?.size && (relatedNodes.has(edge.source) || relatedNodes.has(edge.target))) return true
  if (mode === "formic") return FORMIC_EDGES.has(key)
  if (mode === "competing") return COMPETING_NODES.has(edge.target)
  if (mode === "mof") return isMofInfluenced(edge)
  if (mode === "evidence") return true
  return false
}

function modeNodeActive(mode, node, relatedNodes) {
  if (relatedNodes?.has(node.id)) return true
  if (mode === "formic") return ["glucose", "hco3", "c1_intermediate", "hcoo", "formic_acid"].includes(node.id)
  if (mode === "competing") return node.id === "glucose" || COMPETING_NODES.has(node.id)
  if (mode === "mof") return ["c1_intermediate", "hcoo", "formic_acid", "humins_byproducts"].includes(node.id)
  if (mode === "evidence") return true
  return false
}

function pointFor(layout, id, side) {
  const box = layout.nodes[id]
  if (!box) return { x: 0, y: 0 }
  if (side === "left") return { x: box.x, y: box.y + box.h / 2 }
  if (side === "right") return { x: box.x + box.w, y: box.y + box.h / 2 }
  if (side === "top") return { x: box.x + box.w / 2, y: box.y }
  if (side === "bottom") return { x: box.x + box.w / 2, y: box.y + box.h }
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 }
}

function edgePath(edge, layout, isMobile) {
  const source = layout.nodes[edge.source]
  const target = layout.nodes[edge.target]
  if (!source || !target) return ""
  const vertical = isMobile
  const from = vertical ? pointFor(layout, edge.source, "bottom") : pointFor(layout, edge.source, "right")
  const to = vertical ? pointFor(layout, edge.target, "top") : pointFor(layout, edge.target, "left")
  if (vertical) {
    const midY = from.y + (to.y - from.y) * 0.52
    return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`
  }
  const offset = edge.target === "humins_byproducts" ? 55 : edge.target === "glycolic_acid" ? 30 : edge.target === "acetic_acid" ? 18 : 0
  const midX = from.x + (to.x - from.x) * 0.54
  return `M ${from.x} ${from.y} C ${midX} ${from.y + offset}, ${midX} ${to.y - offset}, ${to.x} ${to.y}`
}

function labelPosition(edge, layout, isMobile) {
  const source = layout.nodes[edge.source]
  const target = layout.nodes[edge.target]
  if (!source || !target) return { x: 0, y: 0 }
  const from = verticalPoint(source, isMobile, "source")
  const to = verticalPoint(target, isMobile, "target")
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2 - (isMobile ? 12 : 10),
  }
}

function verticalPoint(box, isMobile, role) {
  if (isMobile) {
    return role === "source"
      ? { x: box.x + box.w / 2, y: box.y + box.h }
      : { x: box.x + box.w / 2, y: box.y }
  }
  return role === "source"
    ? { x: box.x + box.w, y: box.y + box.h / 2 }
    : { x: box.x, y: box.y + box.h / 2 }
}

function Card({ title, children, t, style }) {
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, display: "grid", gap: 9, minWidth: 0, ...style }}>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>{title}</div>
      {children}
    </section>
  )
}

function DetailPanel({ selection, nodesById, selectedCandidate, t, lang }) {
  if (!selection) return null
  const isEdge = selection.kind === "edge"
  const item = selection.item
  const title = isEdge
    ? `${chemicalLabel(nodeLabel(nodesById[item.source]))} -> ${chemicalLabel(nodeLabel(nodesById[item.target]))}`
    : chemicalLabel(nodeLabel(item))
  const roles = !isEdge ? candidateRolesForNode(selectedCandidate, item.id) : []
  const rows = isEdge ? [
    [text(lang, "反应类型", "Reaction type"), item.reactionType],
    [text(lang, "可能的 MOF 影响", "Possible MOF influence"), (item.possibleMofInfluence || []).join(", ") || "pending"],
    [text(lang, "证据等级", "Evidence level"), item.evidenceLevel || "pending"],
    [text(lang, "置信度", "Confidence"), item.confidence || "pending"],
    [text(lang, "需要验证", "Validation needed"), "Pending experimental / DFT validation"],
  ] : [
    [text(lang, "含义", "Meaning"), item.description],
    [text(lang, "节点类型", "Node type"), item.type],
    [text(lang, "证据等级", "Evidence level"), item.evidenceLevel || "pending"],
    [text(lang, "数据状态", "Data status"), item.dataStatus || "pending"],
    [text(lang, "可能的 MOF 相关性", "Possible MOF relevance"), NODE_RELEVANCE[item.id] || "pending"],
  ]
  return (
    <Card t={t} title={text(lang, "选中节点 / 边详情", "Selected Node / Edge Details")}>
      <div style={{ color: t.textStrong, fontSize: 16, lineHeight: 1.25, fontWeight: 930 }}>{title}</div>
      {isEdge && (
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
          {cleanText(item.label)}
        </div>
      )}
      <div style={{ display: "grid", gap: 7 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "grid", gap: 3 }}>
            <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{cleanText(value)}</div>
          </div>
        ))}
      </div>
      {roles.length > 0 && (
        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 8, display: "grid", gap: 7 }}>
          <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>
            {text(lang, "Candidate-related MOF roles", "Candidate-related MOF roles")}
          </div>
          {roles.map((role, index) => (
            <div key={`${role.role || role.label}-${index}`} style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
              <strong style={{ color: t.textStrong }}>{role.label || cleanText(role.role)}:</strong> {cleanText(role.relatedFeature)} · {cleanText(role.evidenceLevel)}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function PathwaySummary({ graph, mode, t, lang }) {
  const nodes = graph.nodes || []
  const edges = graph.edges || []
  const activeMode = MODES.find(item => item.id === mode)
  return (
    <Card t={t} title={text(lang, "路径摘要", "Pathway Summary")}>
      <div style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.15, fontWeight: 940 }}>
        {text(lang, "有机酸路径图", "Organic Acid Pathway Graph")}
      </div>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
        {text(
          lang,
          "以图论方式展示 glucose / HCO₃⁻ 到甲酸与竞争有机酸的路径关系。当前仅用于假设层映射。",
          "Graph-based pathway mapping from glucose / HCO₃⁻ toward formic acid and competing organic acids. Current use is hypothesis-layer mapping only."
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        {[
          [text(lang, "节点", "Nodes"), nodes.length],
          [text(lang, "边", "Edges"), edges.length],
          [text(lang, "当前模式", "Active mode"), lang === "zh" ? activeMode?.labelZh : activeMode?.label],
          [text(lang, "目标产物", "Target"), "Formic acid"],
        ].map(([label, value]) => (
          <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: 9, minWidth: 0 }}>
            <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
            <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900, marginTop: 5, overflowWrap: "anywhere" }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55 }}>
        Decision-support preview · Hypothesis layer · Pending experimental / DFT validation
      </div>
    </Card>
  )
}

function MofInfluenceSummary({ graph, selectedCandidate, t, lang }) {
  const points = graph.mofInfluencePoints || []
  const roles = selectedCandidate?.organicAcidRelevance?.possibleRoles || []
  return (
    <Card t={t} title={text(lang, "MOF 影响摘要", "MOF influence summary")}>
      {roles.length > 0 && (
        <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 7, padding: 9, color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
          <strong style={{ color: t.textStrong }}>{selectedCandidate?.name || selectedCandidate?.id}</strong>{" "}
          {text(lang, "已按候选相关角色高亮路径节点。", "candidate-related pathway nodes are highlighted.")}
        </div>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        {points.map((point, index) => (
          <article key={point.feature} style={{ borderTop: index ? `1px solid ${t.border}` : "none", paddingTop: index ? 8 : 0, display: "grid", gap: 4 }}>
            <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{point.label}</div>
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>{cleanText(point.description)}</div>
            <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.45 }}>
              {text(lang, "相关节点", "Related nodes")}: {(point.relatedNodes || []).join(", ") || "pending"} · {point.evidenceLevel || "pending"}
            </div>
          </article>
        ))}
      </div>
    </Card>
  )
}

function NodeCard({ node, box, active, selected, related, muted, t, onSelect }) {
  const tone = NODE_TONES[node.type] || { stroke: t.accentText, fill: t.badgeInfoBg }
  const status = cleanText(node.evidenceLevel || "pending").replace("literature-derived", "literature")
  const nodeType = cleanText(node.type)
  const fill = selected ? tone.stroke : related ? t.badgeInfoBg : tone.fill
  const textColor = selected ? "#fff" : t.textStrong
  const subColor = selected ? "rgba(255,255,255,0.82)" : t.faint
  return (
    <g
      role="button"
      tabIndex="0"
      onClick={() => onSelect({ kind: "node", item: node })}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") onSelect({ kind: "node", item: node })
      }}
      style={{ cursor: "pointer" }}
      opacity={muted ? 0.42 : 1}
    >
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx="8"
        fill={fill}
        stroke={related ? t.accent : tone.stroke}
        strokeWidth={selected ? 3 : related ? 2.6 : active ? 2.2 : 1.4}
      />
      <text
        x={box.x + 14}
        y={box.y + 25}
        fill={textColor}
        fontSize="14"
        fontWeight="900"
        fontFamily="inherit"
        letterSpacing="0"
        wordSpacing="0"
      >
        {chemicalLabel(node.label)}
      </text>
      <text
        x={box.x + 14}
        y={box.y + 47}
        fill={subColor}
        fontSize="11"
        fontWeight="800"
        fontFamily="inherit"
        letterSpacing="0"
        wordSpacing="0"
      >
        {status}
      </text>
      <text
        x={box.x + 14}
        y={box.y + 64}
        fill={subColor}
        fontSize="10.5"
        fontWeight="720"
        fontFamily="inherit"
        letterSpacing="0"
        wordSpacing="0"
      >
        {nodeType}
      </text>
    </g>
  )
}

function PathwayGraph({ graph, mode, selection, setSelection, selectedCandidate, t, isMobile }) {
  const layout = isMobile ? MOBILE_LAYOUT : DESKTOP_LAYOUT
  const [hoveredEdge, setHoveredEdge] = useState(null)
  const relatedNodes = useMemo(() => candidateRelatedNodes(selectedCandidate), [selectedCandidate])

  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: isMobile ? 8 : 10, minWidth: 0, overflow: "hidden" }}>
      <svg
        viewBox={layout.viewBox}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Organic Acid Graph Explorer pathway network"
        style={{ display: "block", width: "100%", maxWidth: "100%", height: "auto", fontFamily: "inherit", letterSpacing: 0, wordSpacing: 0 }}
      >
        <defs>
          <marker id="organic-acid-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L9,4.5 L0,9 Z" fill={t.faint} />
          </marker>
        </defs>
        {(graph.edges || []).map(edge => {
          const key = edgeKey(edge)
          if (!layout.nodes[edge.source] || !layout.nodes[edge.target]) return null
          const selected = selection?.kind === "edge" && edgeKey(selection.item) === key
          const hovered = hoveredEdge === key
          const active = modeEdgeActive(mode, edge, relatedNodes) || selected || hovered
          const evidence = evidenceStyle(edge.evidenceLevel, edge.dataStatus)
          const formic = FORMIC_EDGES.has(key)
          const competing = COMPETING_NODES.has(edge.target)
          const color = formic ? (t.success || "#15803D") : competing ? (t.warn || "#D97706") : t.accentText
          const stroke = mode === "evidence" || active ? color : t.borderStrong
          const width = selected ? 4 : active ? 3 : 1.3
          const opacity = mode === "evidence" ? evidence.opacity : active ? 0.96 : mode === "formic" && competing ? 0.28 : 0.34
          const label = EDGE_SHORT_LABELS[key]
          const labelPos = labelPosition(edge, layout, isMobile)
          return (
            <g key={key}>
              <path
                d={edgePath(edge, layout, isMobile)}
                fill="none"
                stroke={stroke}
                strokeWidth={width}
                strokeDasharray={mode === "evidence" ? evidence.dash : edge.evidenceLevel === "literature-derived" ? "" : "8 6"}
                opacity={opacity}
                markerEnd="url(#organic-acid-arrow)"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredEdge(key)}
                onMouseLeave={() => setHoveredEdge(null)}
                onClick={event => {
                  event.stopPropagation()
                  setSelection({ kind: "edge", item: edge })
                }}
              />
              {(selected || hovered) && label && (
                <g pointerEvents="none">
                  <rect x={labelPos.x - 48} y={labelPos.y - 15} width="96" height="22" rx="8" fill={t.tooltipBg || t.panel} stroke={t.border} />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    fill={t.textStrong}
                    fontSize="10.5"
                    fontWeight="850"
                    fontFamily="inherit"
                    letterSpacing="0"
                    wordSpacing="0"
                  >
                    {label}
                  </text>
                </g>
              )}
            </g>
          )
        })}
        {(graph.nodes || []).map(node => {
          const box = layout.nodes[node.id]
          if (!box) return null
          const selected = selection?.kind === "node" && selection.item.id === node.id
          const related = relatedNodes.has(node.id)
          const active = modeNodeActive(mode, node, relatedNodes)
          const muted = mode !== "evidence" && !active && !selected
          return (
            <NodeCard
              key={node.id}
              node={node}
              box={box}
              active={active}
              selected={selected}
              related={related}
              muted={muted}
              t={t}
              onSelect={setSelection}
            />
          )
        })}
      </svg>
    </div>
  )
}

export function OrganicAcidGraphExplorer({ t: tone, lang: forcedLang, isMobile: forcedMobile, selectedCandidate }) {
  const theme = useT()
  const { lang: contextLang } = useLang()
  const viewport = useViewport()
  const t = tone || theme
  const lang = forcedLang || contextLang
  const isMobile = forcedMobile ?? viewport.isMobile
  const isNarrow = isMobile || viewport.isNarrow
  const [graph, setGraph] = useState({ nodes: [], edges: [], mofInfluencePoints: [] })
  const [status, setStatus] = useState("loading")
  const [mode, setMode] = useState("formic")
  const [selection, setSelection] = useState(null)

  useEffect(() => {
    let live = true
    setStatus("loading")
    fetchDataJson("organic_acid_pathway_graph.json", {})
      .then(data => {
        if (!live) return
        setGraph(data && typeof data === "object" ? data : { nodes: [], edges: [], mofInfluencePoints: [] })
        const defaultNode = data?.nodes?.find(node => node.id === "formic_acid") || data?.nodes?.[0] || null
        setSelection(defaultNode ? { kind: "node", item: defaultNode } : null)
        setStatus("loaded")
      })
      .catch(() => {
        if (!live) return
        setGraph({ nodes: [], edges: [], mofInfluencePoints: [] })
        setSelection(null)
        setStatus("error")
      })
    return () => { live = false }
  }, [])

  const nodesById = useMemo(() => Object.fromEntries((graph.nodes || []).map(node => [node.id, node])), [graph.nodes])

  return (
    <section id="organic-acid-graph-explorer" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: isMobile ? 12 : 14, display: "grid", gap: 12, scrollMarginTop: 118, minWidth: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) auto", gap: 10, alignItems: "start" }}>
        <div>
          <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0 }}>
            Organic Acid Graph Explorer
          </div>
          <h2 style={{ color: t.textStrong, fontSize: isMobile ? 20 : 24, lineHeight: 1.14, margin: "5px 0 0", fontWeight: 940 }}>
            {text(lang, "有机酸图论路径工作台", "Organic Acid Graph Workspace")}
          </h2>
          <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6, maxWidth: 900 }}>
            {text(
              lang,
              "以图结构展示 glucose / HCO₃⁻ 转化路径与可能的 MOF 影响点。",
              "A graph-based view of glucose / bicarbonate conversion pathways and possible MOF influence points."
            )}
          </div>
        </div>
        <div style={{ color: t.warn, background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, padding: "8px 10px", fontSize: 11.5, fontWeight: 850, lineHeight: 1.35 }}>
          Decision-support preview · Hypothesis layer · Pending experimental / DFT validation
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {MODES.map(item => {
          const active = mode === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              style={{
                ...toolbarBtn(t),
                background: active ? t.badgeInfoBg : t.surface,
                borderColor: active ? t.accent : t.border,
                color: active ? t.accentText : t.muted,
                minHeight: 34,
              }}
            >
              {lang === "zh" ? item.labelZh : item.label}
            </button>
          )
        })}
      </div>

      {status === "error" && (
        <div style={{ color: t.warn, background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, padding: 11, fontSize: 12 }}>
          Organic acid pathway graph data could not be loaded.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(210px, 0.72fr) minmax(0, 1.9fr) minmax(260px, 0.9fr)", gap: 12, alignItems: "stretch", minWidth: 0 }}>
        {!isMobile && <PathwaySummary graph={graph} mode={mode} t={t} lang={lang} />}
        <PathwayGraph graph={graph} mode={mode} selection={selection} setSelection={setSelection} selectedCandidate={selectedCandidate} t={t} isMobile={isMobile} />
        <DetailPanel selection={selection} nodesById={nodesById} selectedCandidate={selectedCandidate} t={t} lang={lang} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", gap: 12 }}>
        {isMobile && <PathwaySummary graph={graph} mode={mode} t={t} lang={lang} />}
        <MofInfluenceSummary graph={graph} selectedCandidate={selectedCandidate} t={t} lang={lang} />
        <Card t={t} title={text(lang, "阅读规则", "How to read")}>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
            {text(
              lang,
              "甲酸路径模式突出 glucose / HCO₃⁻ 到 HCOO⁻ 与 formic acid 的假设层映射；竞争产物保留但弱化；证据视图用实线、虚线和透明度区分 literature-derived、hypothesis 与 pending validation。",
              "Formic acid focus highlights the hypothesis-layer mapping from glucose / HCO₃⁻ toward HCOO⁻ and formic acid; competing pathways remain visible but subdued; evidence view separates literature-derived, hypothesis, and pending validation by line style and opacity."
            )}
          </div>
        </Card>
      </div>
    </section>
  )
}
