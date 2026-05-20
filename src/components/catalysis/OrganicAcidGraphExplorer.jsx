import { useEffect, useMemo, useState } from "react"
import { FONT_MONO } from "../../constants/theme"
import { useLang, useT, useViewport } from "../../contexts"
import { fetchDataJson } from "../../services/dataService"
import { toolbarBtn } from "../../utils/styles"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const MODES = [
  { id: "formic", label: "Formic acid focus", labelZh: "Formic acid focus" },
  { id: "competing", label: "Competing products", labelZh: "Competing products" },
  { id: "mof", label: "MOF influence", labelZh: "MOF influence" },
  { id: "evidence", label: "Evidence view", labelZh: "Evidence view" },
]

const POSITIONS = {
  glucose: [110, 250],
  hco3: [110, 90],
  c1_intermediate: [340, 220],
  hcoo: [555, 160],
  formic_acid: [795, 150],
  lactic_acid: [365, 405],
  acetic_acid: [570, 430],
  glycolic_acid: [775, 380],
  humins_byproducts: [830, 520],
}

const NODE_COLORS = {
  feedstock: "#1A6DB5",
  co2_source: "#0E7490",
  intermediate: "#9333EA",
  target_product: "#15803D",
  competing_product: "#D97706",
  byproduct: "#B91C1C",
}

const FORMIC_EDGES = new Set(["glucose->c1_intermediate", "c1_intermediate->hcoo", "hco3->hcoo", "hcoo->formic_acid"])
const COMPETING_NODES = new Set(["lactic_acid", "acetic_acid", "glycolic_acid", "humins_byproducts"])

function edgeKey(edge) {
  return `${edge.source}->${edge.target}`
}

function isMofInfluenced(edge) {
  return Array.isArray(edge.possibleMofInfluence) && edge.possibleMofInfluence.length > 0
}

function nodeLabel(node) {
  return node?.label || node?.id || "pending"
}

function evidenceStyle(evidenceLevel) {
  const level = String(evidenceLevel || "pending").toLowerCase()
  if (level.includes("literature")) return { dash: "", opacity: 0.92 }
  if (level.includes("hypothesis")) return { dash: "7 5", opacity: 0.76 }
  return { dash: "4 7", opacity: 0.38 }
}

function modeEdgeActive(mode, edge) {
  const key = edgeKey(edge)
  if (mode === "formic") return FORMIC_EDGES.has(key)
  if (mode === "competing") return COMPETING_NODES.has(edge.target)
  if (mode === "mof") return isMofInfluenced(edge)
  if (mode === "evidence") return true
  return false
}

function modeNodeActive(mode, node) {
  if (mode === "formic") return ["glucose", "hco3", "c1_intermediate", "hcoo", "formic_acid"].includes(node.id)
  if (mode === "competing") return node.id === "glucose" || COMPETING_NODES.has(node.id)
  if (mode === "mof") return ["c1_intermediate", "hcoo", "formic_acid", "humins_byproducts"].includes(node.id)
  if (mode === "evidence") return true
  return false
}

function Card({ title, children, t, style }) {
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, display: "grid", gap: 9, minWidth: 0, ...style }}>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>{title}</div>
      {children}
    </section>
  )
}

function DetailPanel({ selection, nodesById, t, lang }) {
  if (!selection) return null
  const isEdge = selection.kind === "edge"
  const item = selection.item
  const title = isEdge
    ? `${nodeLabel(nodesById[item.source])} -> ${nodeLabel(nodesById[item.target])}`
    : nodeLabel(item)
  const rows = isEdge ? [
    [text(lang, "Reaction type", "Reaction type"), item.reactionType],
    [text(lang, "Possible MOF influence", "Possible MOF influence"), (item.possibleMofInfluence || []).join(", ") || "pending"],
    [text(lang, "Evidence level", "Evidence level"), item.evidenceLevel || "pending"],
    [text(lang, "Confidence", "Confidence"), item.confidence || "pending"],
  ] : [
    [text(lang, "Node type", "Node type"), item.type],
    [text(lang, "Evidence level", "Evidence level"), item.evidenceLevel || "pending"],
    [text(lang, "Data status", "Data status"), item.dataStatus || "pending"],
  ]
  return (
    <Card t={t} title={text(lang, "Selected Node / Edge Details", "Selected Node / Edge Details")}>
      <div style={{ color: t.textStrong, fontSize: 16, lineHeight: 1.25, fontWeight: 930 }}>{title}</div>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
        {isEdge ? item.label : item.description}
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "grid", gap: 3 }}>
            <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{String(value || "pending").replace(/_/g, " ")}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function PathwaySummary({ graph, mode, t, lang }) {
  const nodes = graph.nodes || []
  const edges = graph.edges || []
  const target = nodes.find(node => node.id === "formic_acid")
  return (
    <Card t={t} title={text(lang, "Pathway Summary", "Pathway Summary")}>
      <div style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.15, fontWeight: 940 }}>
        {text(lang, "Organic Acid Pathway Graph", "Organic Acid Pathway Graph")}
      </div>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
        {text(
          lang,
          "从 glucose / HCO3- 到 formic acid 与竞争有机酸的图论路径演示。当前仅用于 hypothesis-layer mapping。",
          "Graph-based pathway mapping from glucose / HCO3- toward formic acid and competing organic acids. Current use is hypothesis-layer mapping only."
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        {[
          [text(lang, "Nodes", "Nodes"), nodes.length],
          [text(lang, "Edges", "Edges"), edges.length],
          [text(lang, "Active mode", "Active mode"), MODES.find(item => item.id === mode)?.label],
          [text(lang, "Target", "Target"), target?.label || "Formic acid"],
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

function MofInfluenceSummary({ graph, t, lang }) {
  const points = graph.mofInfluencePoints || []
  return (
    <Card t={t} title={text(lang, "MOF influence summary", "MOF influence summary")}>
      <div style={{ display: "grid", gap: 8 }}>
        {points.map((point, index) => (
          <article key={point.feature} style={{ borderTop: index ? `1px solid ${t.border}` : "none", paddingTop: index ? 8 : 0, display: "grid", gap: 4 }}>
            <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{point.label}</div>
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>{point.description}</div>
            <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.45 }}>
              {text(lang, "Related nodes", "Related nodes")}: {(point.relatedNodes || []).join(", ") || "pending"} · {point.evidenceLevel || "pending"}
            </div>
          </article>
        ))}
      </div>
    </Card>
  )
}

function PathwayGraph({ graph, mode, selection, setSelection, t }) {
  const nodesById = useMemo(() => Object.fromEntries((graph.nodes || []).map(node => [node.id, node])), [graph.nodes])
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, minWidth: 0, overflowX: "auto" }}>
      <svg viewBox="0 0 950 610" role="img" aria-label="Organic Acid Graph Explorer pathway network" style={{ display: "block", minWidth: 760, width: "100%", height: "auto" }}>
        <defs>
          <marker id="organic-acid-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10 Z" fill={t.faint} />
          </marker>
        </defs>
        {(graph.edges || []).map(edge => {
          const source = POSITIONS[edge.source]
          const target = POSITIONS[edge.target]
          if (!source || !target) return null
          const active = modeEdgeActive(mode, edge) || selection?.kind === "edge" && edgeKey(selection.item) === edgeKey(edge)
          const selected = selection?.kind === "edge" && edgeKey(selection.item) === edgeKey(edge)
          const evidence = evidenceStyle(edge.evidenceLevel)
          const color = FORMIC_EDGES.has(edgeKey(edge)) ? (t.success || "#15803D") : COMPETING_NODES.has(edge.target) ? (t.warn || "#D97706") : t.accentText
          const stroke = mode === "evidence" ? color : active ? color : t.borderStrong
          const width = selected ? 4 : active ? 3 : 1.4
          const opacity = mode === "evidence" ? evidence.opacity : active ? 0.95 : 0.28
          const [sx, sy] = source
          const [tx, ty] = target
          const c1x = sx + (tx - sx) * 0.45
          const c2x = sx + (tx - sx) * 0.65
          const bend = edge.target === "humins_byproducts" ? 58 : edge.target === "glycolic_acid" ? 35 : 0
          return (
            <g key={edgeKey(edge)}>
              <path
                d={`M ${sx + 50} ${sy} C ${c1x} ${sy + bend}, ${c2x} ${ty - bend}, ${tx - 54} ${ty}`}
                fill="none"
                stroke={stroke}
                strokeWidth={width}
                strokeDasharray={mode === "evidence" ? evidence.dash : edge.evidenceLevel === "hypothesis" ? "7 5" : edge.evidenceLevel === "pending" ? "4 7" : ""}
                opacity={opacity}
                markerEnd="url(#organic-acid-arrow)"
                style={{ cursor: "pointer" }}
                onClick={event => {
                  event.stopPropagation()
                  setSelection({ kind: "edge", item: edge })
                }}
              />
              {(active || selected) && (
                <text x={(sx + tx) / 2} y={(sy + ty) / 2 - 12 - bend * 0.12} textAnchor="middle" fill={t.subtle} fontSize="10.5" fontFamily={FONT_MONO}>
                  {edge.label}
                </text>
              )}
            </g>
          )
        })}
        {(graph.nodes || []).map(node => {
          const [x, y] = POSITIONS[node.id] || [0, 0]
          const active = modeNodeActive(mode, node)
          const selected = selection?.kind === "node" && selection.item.id === node.id
          const color = NODE_COLORS[node.type] || t.accentText
          const muted = mode !== "evidence" && !active && !selected
          const radius = node.id === "formic_acid" ? 43 : node.type === "competing_product" ? 35 : 38
          return (
            <g
              key={node.id}
              role="button"
              tabIndex="0"
              onClick={() => setSelection({ kind: "node", item: node })}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") setSelection({ kind: "node", item: node })
              }}
              style={{ cursor: "pointer" }}
              opacity={muted ? 0.38 : 1}
            >
              <circle cx={x} cy={y} r={radius} fill={selected ? color : t.panel} stroke={color} strokeWidth={selected ? 3 : active ? 2.5 : 1.4} />
              <text x={x} y={y - 3} textAnchor="middle" fill={selected ? "#fff" : t.textStrong} fontSize="12" fontWeight="900">
                {node.label}
              </text>
              <text x={x} y={y + 14} textAnchor="middle" fill={selected ? "rgba(255,255,255,0.82)" : t.faint} fontSize="9.5" fontFamily={FONT_MONO}>
                {String(node.evidenceLevel || "pending").replace("literature-derived", "literature")}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function OrganicAcidGraphExplorer({ t: tone, lang: forcedLang, isMobile: forcedMobile }) {
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
    <section id="organic-acid-graph-explorer" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: isMobile ? 12 : 14, display: "grid", gap: 12, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) auto", gap: 10, alignItems: "start" }}>
        <div>
          <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0 }}>
            Organic Acid Graph Explorer
          </div>
          <h2 style={{ color: t.textStrong, fontSize: isMobile ? 20 : 24, lineHeight: 1.14, margin: "5px 0 0", fontWeight: 940 }}>
            {text(lang, "有机酸图论路径演示器", "Organic Acid Graph Explorer")}
          </h2>
          <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 6, maxWidth: 900 }}>
            A graph-based view of glucose / bicarbonate conversion pathways and possible MOF influence points.
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

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(210px, 0.74fr) minmax(0, 1.75fr) minmax(260px, 0.86fr)", gap: 12, alignItems: "stretch" }}>
        {!isMobile && <PathwaySummary graph={graph} mode={mode} t={t} lang={lang} />}
        <PathwayGraph graph={graph} mode={mode} selection={selection} setSelection={setSelection} t={t} />
        <DetailPanel selection={selection} nodesById={nodesById} t={t} lang={lang} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", gap: 12 }}>
        {isMobile && <PathwaySummary graph={graph} mode={mode} t={t} lang={lang} />}
        <MofInfluenceSummary graph={graph} t={t} lang={lang} />
        <Card t={t} title={text(lang, "How to read", "How to read")}>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
            {text(
              lang,
              "绿色主路径强调 glucose / HCO3- 到 formic acid 的假设层映射；橙色竞争路径保留为副产物与竞争有机酸解释；虚线表示 hypothesis 或 pending validation。",
              "The green main path highlights hypothesis-layer mapping from glucose / HCO3- toward formic acid; orange competing paths remain visible for side-product and competing organic-acid interpretation; dashed lines mark hypothesis or pending validation."
            )}
          </div>
        </Card>
      </div>
    </section>
  )
}
