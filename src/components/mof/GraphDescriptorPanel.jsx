import { FONT_MONO } from "../../constants/theme"
import { useLang, useT, useViewport } from "../../contexts"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const NODE_TYPE_LABELS = {
  metal: ["Metal", "金属节点"],
  metal_node: ["Metal", "金属节点"],
  linker: ["Linker", "配体"],
  functional_group: ["Functional group", "官能团"],
}

const EDGE_TYPE_LABELS = {
  coordination_bond: ["Coordination bond", "配位键"],
  organic_bond: ["Organic bond", "有机键"],
}

function displayList(values, labels, lang) {
  const items = Array.isArray(values) ? values : []
  if (!items.length) return text(lang, "Pending", "Pending")
  return items.map(value => {
    const key = String(value || "").trim()
    const label = labels[key]
    return label ? (lang === "zh" ? label[1] : label[0]) : key.replace(/_/g, " ")
  }).join(", ")
}

function scoreLabel(value, prefix = "") {
  if (value === null || value === undefined || value === "") return "pending"
  const number = Number(value)
  if (!Number.isFinite(number)) return "pending"
  return `${prefix}${number.toFixed(prefix ? 0 : 2)}`
}

function MiniStructureGraph({ t, lang }) {
  return (
    <svg viewBox="0 0 360 180" role="img" aria-label={text(lang, "候选 MOF 小型结构关系图", "Mini MOF structure relationship graph")} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <marker id="graph-panel-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={t.faint} />
        </marker>
      </defs>
      {[
        ["Metal", 72, 50, t.accentText],
        ["Linker", 72, 130, t.cyan || t.accentText],
        ["Functional", 178, 90, t.violet || t.accentText],
        ["Active motif", 288, 90, t.success || t.accentText],
      ].map(([label, x, y, color]) => (
        <g key={label}>
          <circle cx={x} cy={y} r={label === "Active motif" ? 32 : 24} fill={t.panel} stroke={color} strokeWidth="2" />
          <text x={x} y={y + 4} textAnchor="middle" fill={t.textStrong} fontSize={label === "Functional" ? 10 : 11} fontWeight="800">{label}</text>
        </g>
      ))}
      {[
        [96, 50, 255, 86],
        [96, 130, 255, 94],
        [202, 90, 255, 90],
      ].map(([x1, y1, x2, y2], index) => (
        <path key={index} d={`M${x1},${y1} C${150},${y1} ${210},${y2} ${x2},${y2}`} fill="none" stroke={t.borderStrong} strokeWidth="1.6" markerEnd="url(#graph-panel-arrow)" />
      ))}
    </svg>
  )
}

function InfoBlock({ title, children, t }) {
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11, display: "grid", gap: 8, minWidth: 0 }}>
      <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{title}</div>
      {children}
    </section>
  )
}

function MiniBadge({ children, t, tone = "proxy" }) {
  const colors = {
    info: { bg: t.badgeInfoBg, color: t.badgeInfoText },
    calc: { bg: t.badgeCalcBg, color: t.badgeCalcText },
    proxy: { bg: t.badgeProxyBg, color: t.badgeProxyText },
    warn: { bg: t.badgeWarnBg, color: t.badgeWarnText },
  }[tone] || { bg: t.surface, color: t.subtle }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", border: `1px solid ${t.border}`, borderRadius: 6, background: colors.bg, color: colors.color, fontSize: 10.5, fontWeight: 850, lineHeight: 1, padding: "5px 7px" }}>
      {children}
    </span>
  )
}

export function GraphDescriptorPanel({ graphMetadata, t: tone, lang: forcedLang, isMobile: forcedMobile }) {
  const theme = useT()
  const { lang: contextLang } = useLang()
  const viewport = useViewport()
  const t = tone || theme
  const lang = forcedLang || contextLang
  const isMobile = forcedMobile ?? viewport.isMobile
  const graph = graphMetadata || {
    graphStatus: "pending",
    nodeTypes: [],
    edgeTypes: [],
    activeMotifs: [],
    graphCluster: "pending",
    diversityScore: null,
    graphMotifScore: 0,
    graphConfidence: "pending",
    notes: "Graph metadata pending curation.",
  }
  const motifs = Array.isArray(graph.activeMotifs) ? graph.activeMotifs : []

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
            {text(lang, "Graph Descriptor Panel", "Graph Descriptor Panel")}
          </div>
          <div style={{ color: t.textStrong, fontSize: 13.5, lineHeight: 1.25, fontWeight: 900, marginTop: 3 }}>
            {text(lang, "Structure graph explanation layer", "Structure graph explanation layer")}
          </div>
        </div>
        <MiniBadge t={t} tone={/computed|literature/i.test(graph.graphConfidence || graph.graphStatus) ? "info" : "proxy"}>
          {graph.graphConfidence || graph.graphStatus || "pending"}
        </MiniBadge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", gap: 10 }}>
        <InfoBlock t={t} title={text(lang, "Graph status", "Graph status")}>
          <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 850 }}>{graph.graphStatus || "pending"}</div>
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
            {text(lang, "Node types", "Node types")}: {displayList(graph.nodeTypes, NODE_TYPE_LABELS, lang)}
          </div>
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
            {text(lang, "Edge types", "Edge types")}: {displayList(graph.edgeTypes, EDGE_TYPE_LABELS, lang)}
          </div>
        </InfoBlock>

        <InfoBlock t={t} title={text(lang, "Diversity & cluster", "Diversity & cluster")}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 7, color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
            <span>{text(lang, "Graph cluster", "Graph cluster")}</span>
            <strong style={{ color: t.textStrong }}>{graph.graphCluster || "pending"}</strong>
            <span>{text(lang, "Diversity score", "Diversity score")}</span>
            <strong style={{ color: t.textStrong, fontFamily: FONT_MONO }}>{scoreLabel(graph.diversityScore)}</strong>
            <span>{text(lang, "Graph motif score", "Graph motif score")}</span>
            <strong style={{ color: t.success || t.accentText, fontFamily: FONT_MONO }}>{scoreLabel(graph.graphMotifScore, "+")}</strong>
          </div>
        </InfoBlock>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(230px, 0.8fr) minmax(0, 1.2fr)", gap: 10 }}>
        <InfoBlock t={t} title={text(lang, "Mini structure relation", "Mini structure relation")}>
          <MiniStructureGraph t={t} lang={lang} />
        </InfoBlock>

        <InfoBlock t={t} title={text(lang, "Active motifs", "Active motifs")}>
          {motifs.length === 0 ? (
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
              {text(lang, "No active motif has been computed; keep graph status as pending validation.", "No active motif has been computed; keep graph status as pending validation.")}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {motifs.map((item, index) => (
                <article key={`${item.motif}-${index}`} style={{ borderTop: index ? `1px solid ${t.border}` : "none", paddingTop: index ? 8 : 0 }}>
                  <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{item.motif}</div>
                  <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 3 }}>
                    {text(lang, "Role", "Role")}: {item.role}
                  </div>
                  <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.45, marginTop: 3 }}>
                    {text(lang, "Evidence", "Evidence")}: {item.evidenceLevel || "pending validation"}
                  </div>
                </article>
              ))}
            </div>
          )}
        </InfoBlock>
      </div>

      <InfoBlock t={t} title={text(lang, "Confidence notes", "Confidence notes")}>
        <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
          {graph.notes || text(lang, "Graph information is used for explanation and prioritization only. Pending DFT/GNN validation.", "Graph information is used for explanation and prioritization only. Pending DFT/GNN validation.")}
        </div>
      </InfoBlock>
    </div>
  )
}
