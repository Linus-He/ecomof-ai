// @ts-nocheck
import { SCIENTIFIC_TOKEN_FONT, organicAcidPalette as palette } from "./FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const nodeLayout = {
  glucose: { x: 68, y: 60, w: 150, h: 58 },
  fructose: { x: 72, y: 208, w: 136, h: 58 },
  hco3_co2: { x: 676, y: 60, w: 150, h: 58 },
  environment_buffer: { x: 392, y: 50, w: 150, h: 48 },
  c3_intermediate: { x: 326, y: 198, w: 168, h: 64 },
  c2_intermediate: { x: 330, y: 364, w: 160, h: 58 },
  c1_intermediate: { x: 572, y: 206, w: 148, h: 58 },
  formate: { x: 746, y: 298, w: 154, h: 62 },
  organic_acid_pool: { x: 582, y: 440, w: 180, h: 62 },
  hmf_humins: { x: 118, y: 430, w: 150, h: 62 },
}

const categoryStyle = {
  carbon_input: { fill: "#E8F2FC", stroke: "#1A6DB5" },
  intermediate: { fill: "#FFF7DE", stroke: "#D48A16" },
  target_product: { fill: "#E9F8EF", stroke: "#147C43" },
  byproduct: { fill: "#FFF1E8", stroke: "#B24A2A" },
  environment: { fill: "#F8FAFC", stroke: "#94A3B8", dash: "5 4" },
}

function center(nodeId) {
  const box = nodeLayout[nodeId] || { x: 0, y: 0, w: 100, h: 40 }
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 }
}

function edgePath(edge) {
  const a = center(edge.source)
  const b = center(edge.target)
  const curve = Math.max(-80, Math.min(80, (b.y - a.y) * 0.28))
  return `M ${a.x} ${a.y} C ${a.x + 78} ${a.y + curve}, ${b.x - 78} ${b.y - curve}, ${b.x} ${b.y}`
}

function pathEdgeIds(pathways, ids) {
  return new Set(pathways.filter(path => ids.includes(path.id)).flatMap(path => path.edgeSequence || []))
}

function matchingEdges(edges, pathways, activeFilter, highlightedEdgeIds) {
  if (highlightedEdgeIds?.length) return new Set(highlightedEdgeIds)
  if (activeFilter === "all") return new Set(edges.map(edge => edge.id))
  if (activeFilter === "formate-main") return new Set([...pathEdgeIds(pathways, ["glucose-c3-c1-formate"]), "hco3-to-formate"])
  if (activeFilter === "organic-acid-byproduct") return pathEdgeIds(pathways, ["organic-acid-byproduct-pathway"])
  if (activeFilter === "hmf-humins") return pathEdgeIds(pathways, ["hmf-humins-pathway"])
  if (activeFilter === "hco3-participation") return pathEdgeIds(pathways, ["hco3-formate"])
  if (activeFilter === "mof-promoted") return new Set(edges.filter(edge => edge.promotedBy?.length).map(edge => edge.id))
  if (activeFilter === "mof-inhibited") return new Set(edges.filter(edge => edge.inhibitedBy?.length || edge.type === "competing").map(edge => edge.id))
  if (activeFilter === "high-confidence") return new Set(edges.filter(edge => Number(edge.confidence) >= 0.55).map(edge => edge.id))
  if (activeFilter === "validation-needed") return new Set(edges.filter(edge => ["high", "medium"].includes(edge.validationPriority)).map(edge => edge.id))
  return new Set(edges.map(edge => edge.id))
}

function edgeColor(edge) {
  if (edge.type === "competing") return "#B24A2A"
  if (edge.type === "environment") return "#94A3B8"
  if (edge.type?.startsWith("regulation")) return "#9B4CC2"
  return "#1A6DB5"
}

function edgeDash(edge) {
  if (edge.type === "candidate") return ""
  if (edge.type === "environment") return "6 6"
  return "7 5"
}

function formulaAscii(value = "") {
  return String(value)
    .replace(/HCO₃⁻/g, "HCO3-")
    .replace(/CO₂/g, "CO2")
    .replace(/CH₄/g, "CH4")
    .replace(/N₂/g, "N2")
    .replace(/C₂H₂/g, "C2H2")
    .replace(/C₂H₄/g, "C2H4")
    .replace(/NaH¹³CO₃/g, "NaH13CO3")
}

function SvgFormulaText({ value, x, y, color, size, weight, anchor = "middle" }) {
  const raw = formulaAscii(value)
  const chemicalLike = /^[A-Za-z0-9+\-/\s]+$/.test(raw) && /[A-Z]/.test(raw)
  if (!chemicalLike) {
    return <text x={x} y={y} fill={color} fontFamily={SCIENTIFIC_TOKEN_FONT} fontSize={size} fontWeight={weight} textAnchor={anchor}>{value}</text>
  }
  const parts = raw.split(/\s*\/\s*/).filter(Boolean)
  const tokens = []
  parts.forEach((part, partIndex) => {
    if (partIndex > 0) tokens.push({ text: " / " })
    let body = part
    let charge = ""
    if (/[+-]$/.test(body)) {
      const sign = body.slice(-1)
      body = body.slice(0, -1)
      charge = sign === "-" ? "−" : "+"
    }
    const matches = [...body.matchAll(/([A-Z][a-z]?)(\d*)/g)]
    if (!matches.length) tokens.push({ text: body })
    matches.forEach(match => {
      tokens.push({ text: match[1] })
      if (match[2]) tokens.push({ text: match[2], type: "sub" })
    })
    if (charge) tokens.push({ text: charge, type: "sup" })
  })
  return (
    <text x={x} y={y} fill={color} fontFamily={SCIENTIFIC_TOKEN_FONT} fontSize={size} fontWeight={weight} textAnchor={anchor}>
      {tokens.map((token, index) => (
        <tspan key={`${token.text}-${index}`} baselineShift={token.type === "sub" ? "-25%" : token.type === "sup" ? "42%" : "0"} fontSize={token.type ? Number(size) * 0.68 : size}>
          {token.text}
        </tspan>
      ))}
    </text>
  )
}

export function ReactionNetworkGraph({
  nodes,
  edges,
  pathways,
  activeFilter,
  selectedNodeId,
  selectedEdgeId,
  selectedPathwayId,
  highlightedEdgeIds,
  onSelectNode,
  onSelectEdge,
  onSelectPathway,
  lang,
}) {
  const activeEdges = matchingEdges(edges, pathways, activeFilter, highlightedEdgeIds)
  const selectedPath = pathways.find(path => path.id === selectedPathwayId)
  const selectedPathEdges = new Set(selectedPath?.edgeSequence || [])
  const selectedPathNodes = new Set(selectedPath?.nodeSequence || [])
  const activeNodes = new Set()
  edges.forEach(edge => {
    if (activeEdges.has(edge.id) || selectedPathEdges.has(edge.id)) {
      activeNodes.add(edge.source)
      activeNodes.add(edge.target)
    }
  })

  return (
    <div style={{ background: "#fff", border: `1px solid ${palette.border}`, borderRadius: 12, overflowX: "auto", padding: 10 }}>
      <svg viewBox="0 0 960 560" role="img" aria-label={text(lang, "有机酸碳流反应网络", "Organic acid carbon-flow reaction network")} style={{ display: "block", minWidth: 760, width: "100%" }}>
        <defs>
          <marker id="graph-arrow-blue" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M0,0 L8,4 L0,8 Z" fill="#1A6DB5" />
          </marker>
          <marker id="graph-arrow-red" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M0,0 L8,4 L0,8 Z" fill="#B24A2A" />
          </marker>
          <marker id="graph-arrow-gray" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M0,0 L8,4 L0,8 Z" fill="#94A3B8" />
          </marker>
        </defs>

        <text x="26" y="34" fill={palette.accent} fontFamily={SCIENTIFIC_TOKEN_FONT} fontSize="18" fontWeight="900">
          {text(lang, "Carbon-flow graph", "Carbon-flow graph")}
        </text>

        {edges.map(edge => {
          const active = activeEdges.has(edge.id)
          const selected = selectedEdgeId === edge.id || selectedPathEdges.has(edge.id)
          const color = selected ? "#0F4C81" : edgeColor(edge)
          const marker = edge.type === "competing" ? "url(#graph-arrow-red)" : edge.type === "environment" ? "url(#graph-arrow-gray)" : "url(#graph-arrow-blue)"
          return (
            <g key={edge.id} opacity={active || selected ? 1 : 0.18}>
              <path
                d={edgePath(edge)}
                fill="none"
                stroke="transparent"
                strokeLinecap="round"
                strokeWidth="16"
                style={{ cursor: "pointer" }}
                onClick={() => onSelectEdge(edge)}
              />
              <path
                d={edgePath(edge)}
                fill="none"
                markerEnd={marker}
                pointerEvents="none"
                stroke={color}
                strokeDasharray={edgeDash(edge)}
                strokeLinecap="round"
                strokeWidth={selected ? 4 : 2.4}
              />
            </g>
          )
        })}

        {nodes.map(node => {
          const box = nodeLayout[node.id]
          if (!box) return null
          const style = categoryStyle[node.category] || categoryStyle.intermediate
          const selected = selectedNodeId === node.id || selectedPathNodes.has(node.id)
          const active = activeNodes.has(node.id) || activeFilter === "all"
          return (
            <g
              key={node.id}
              opacity={active || selected ? 1 : 0.28}
              onClick={() => onSelectNode(node)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx="13"
                fill={style.fill}
                stroke={selected ? "#0F4C81" : style.stroke}
                strokeDasharray={style.dash || ""}
                strokeWidth={selected ? 3 : 1.6}
              />
              <SvgFormulaText x={box.x + box.w / 2} y={box.y + 23} color={palette.text} size="15" weight="900" value={text(lang, node.labelZh, node.label)?.split(" / ")[0]} />
              <SvgFormulaText x={box.x + box.w / 2} y={box.y + 43} color={palette.muted} size="12" weight="700" value={text(lang, node.labelZh, node.label)?.split(" / ").slice(1).join(" / ") || node.role} />
            </g>
          )
        })}

        <g transform="translate(40 520)">
          <rect width="884" height="28" rx="8" fill={palette.surface} stroke={palette.border} />
          <text x="14" y="19" fill={palette.muted} fontSize="11" fontWeight="800">
            {text(lang, "图例：蓝色实线 = 候选反应步骤；红色虚线 = 竞争副路径；灰色虚线 = 环境/缓冲调控；点击节点、边或路径查看详情。", "Legend: blue solid = candidate transformation; red dashed = competing branch; gray dashed = environment/buffer control; click nodes, edges, or pathways for detail.")}
          </text>
        </g>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {pathways.map(pathway => {
          const active = selectedPathwayId === pathway.id
          return (
            <button
              key={pathway.id}
              type="button"
              onClick={() => onSelectPathway(pathway)}
              style={{
                background: active ? palette.accentSoft : palette.surface,
                border: `1px solid ${active ? palette.accent : palette.border}`,
                borderRadius: 999,
                color: active ? palette.accent : palette.text,
                cursor: "pointer",
                fontSize: 11.5,
                fontWeight: 800,
                padding: "6px 9px",
              }}
            >
              {text(lang, pathway.nameZh, pathway.name)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
