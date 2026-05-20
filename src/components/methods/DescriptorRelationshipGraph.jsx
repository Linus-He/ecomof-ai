import { useMemo, useState } from "react"
import { FONT_MONO } from "../../constants/theme"
import { useLang, useT, useViewport } from "../../contexts"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const NODES = [
  {
    id: "surfaceArea",
    label: "Surface Area",
    labelZh: "比表面积",
    group: "descriptor",
    description: "Represents accessible internal surface area and contributes to adsorption-related screening.",
    descriptionZh: "表示 MOF 可接触内表面积，是吸附相关筛选的传统描述符。",
    influences: "Adsorption-related screening and descriptor score.",
    influencesZh: "影响吸附相关筛选与 Descriptor Score。",
    dataStatus: "Curated / estimated / pending",
    role: "Contributes to Descriptor Score.",
  },
  {
    id: "poreSizeA",
    label: "Pore Size",
    labelZh: "孔径",
    group: "descriptor",
    description: "Controls molecular accessibility and diffusion feasibility.",
    descriptionZh: "控制分子可达性和扩散可行性。",
    influences: "Molecular accessibility, pore matching, and descriptor score.",
    influencesZh: "影响分子可达性、孔径匹配和 Descriptor Score。",
    dataStatus: "Curated / estimated / pending",
    role: "Contributes to Descriptor Score.",
  },
  {
    id: "poreVolume",
    label: "Pore Volume",
    labelZh: "孔体积",
    group: "descriptor",
    description: "Contributes to adsorption capacity and guest accommodation.",
    descriptionZh: "用于解释吸附容量和客体分子容纳能力。",
    influences: "Capacity-related screening and descriptor score.",
    influencesZh: "影响容量相关筛选与 Descriptor Score。",
    dataStatus: "Curated / estimated / pending",
    role: "Contributes to Descriptor Score.",
  },
  {
    id: "co2Uptake",
    label: "CO2 Uptake",
    labelZh: "CO2 吸附量",
    group: "descriptor",
    description: "Directly reflects CO2 adsorption performance under reported conditions.",
    descriptionZh: "反映特定条件下的 CO2 吸附表现。",
    influences: "Adsorption-performance input and descriptor score.",
    influencesZh: "影响吸附性能输入与 Descriptor Score。",
    dataStatus: "Curated / reported / pending validation",
    role: "Contributes to Descriptor Score.",
  },
  {
    id: "waterStability",
    label: "Water Stability",
    labelZh: "水稳定性",
    group: "feasibility",
    description: "Constrains whether a candidate remains practical under aqueous or humid conditions.",
    descriptionZh: "约束候选物在水相或湿度条件下是否具有实际可行性。",
    influences: "Feasibility-constrained descriptor score.",
    influencesZh: "影响可行性约束下的 Descriptor Score。",
    dataStatus: "Literature-derived / pending validation",
    role: "Feasibility constraint.",
  },
  {
    id: "thermalStability",
    label: "Thermal Stability",
    labelZh: "热稳定性",
    group: "feasibility",
    description: "Indicates whether the framework can survive processing or reaction conditions.",
    descriptionZh: "说明框架是否可能承受加工或反应条件。",
    influences: "Feasibility-constrained descriptor score.",
    influencesZh: "影响可行性约束下的 Descriptor Score。",
    dataStatus: "Literature-derived / pending validation",
    role: "Feasibility constraint.",
  },
  {
    id: "toxicityConcern",
    label: "Toxicity Concern",
    labelZh: "毒性关注",
    group: "risk",
    description: "Acts as a penalty factor in sustainability-oriented screening.",
    descriptionZh: "作为可持续性导向筛选中的风险惩罚项。",
    influences: "Sustainability risk and descriptor score.",
    influencesZh: "影响可持续风险与 Descriptor Score。",
    dataStatus: "Curated / estimated / pending",
    role: "Risk penalty.",
  },
  {
    id: "metalNode",
    label: "Metal Node",
    labelZh: "金属节点",
    group: "graph",
    description: "Represents the metal center or secondary building unit in the MOF graph.",
    descriptionZh: "表示 MOF 图结构中的金属中心或二级构筑单元。",
    influences: "Local coordination environment and active motif annotation.",
    influencesZh: "影响局部配位环境和 active motif 标注。",
    dataStatus: "Demo / computed / pending validation",
    role: "Forms Active Motif.",
  },
  {
    id: "linker",
    label: "Linker",
    labelZh: "配体",
    group: "graph",
    description: "Represents organic linkers that connect metal nodes and shape pore chemistry.",
    descriptionZh: "表示连接金属节点并塑造孔道化学环境的有机配体。",
    influences: "Connectivity, pore chemistry, and motif context.",
    influencesZh: "影响连接方式、孔道化学和结构基元语境。",
    dataStatus: "Demo / computed / pending validation",
    role: "Connects Active Motif.",
  },
  {
    id: "functionalGroup",
    label: "Functional Group",
    labelZh: "官能团",
    group: "graph",
    description: "Represents chemical groups that may affect local adsorption or catalytic interaction.",
    descriptionZh: "表示可能影响局部吸附或催化相互作用的化学基团。",
    influences: "Local interaction hypothesis and motif context.",
    influencesZh: "影响局部相互作用假设和结构基元语境。",
    dataStatus: "Demo / literature-derived / pending validation",
    role: "Modulates Active Motif.",
  },
  {
    id: "activeMotif",
    label: "Active Motif",
    labelZh: "活性结构基元",
    group: "graph",
    description: "Represents a potentially useful local structure formed by metal nodes, linkers, and functional groups.",
    descriptionZh: "表示由金属节点、配体和官能团形成的潜在有利局部结构。",
    influences: "Graph motif score and structural explanation.",
    influencesZh: "影响 Graph Motif Score 和结构解释。",
    dataStatus: "Demo / literature-derived / pending validation",
    role: "Feeds Graph Motif Score.",
  },
  {
    id: "descriptorScore",
    label: "Descriptor Score",
    labelZh: "描述符评分",
    group: "score",
    description: "Aggregated score from curated traditional descriptors.",
    descriptionZh: "由传统描述符聚合得到的基础评分。",
    influences: "Base component of evidence-adjusted final score.",
    influencesZh: "作为 evidence-adjusted final score 的基础项。",
    dataStatus: "Computed from selected descriptor preset",
    role: "Base score.",
  },
  {
    id: "graphMotifScore",
    label: "Graph Motif Score",
    labelZh: "图基元评分",
    group: "score",
    description: "Additional score reflecting potentially favorable graph-based structural motifs.",
    descriptionZh: "用于表达潜在有利图结构基元的解释性加分。",
    influences: "Adds graph-informed structural context to final score.",
    influencesZh: "向 Final Score 添加图论辅助结构语境。",
    dataStatus: "Demo / computed / pending validation",
    role: "Motif bonus.",
  },
  {
    id: "evidenceModifier",
    label: "Evidence Modifier",
    labelZh: "证据修正",
    group: "evidence",
    description: "Adjusts the final score according to data provenance and validation level.",
    descriptionZh: "根据数据来源与验证等级修正最终评分。",
    influences: "Evidence penalty or confidence adjustment.",
    influencesZh: "影响 evidence penalty 或置信修正。",
    dataStatus: "Demo / literature-derived / computed / pending validation",
    role: "Confidence adjustment.",
  },
  {
    id: "finalScore",
    label: "Final Score",
    labelZh: "最终评分",
    group: "final",
    description: "Evidence-adjusted decision-support score for candidate prioritization.",
    descriptionZh: "用于候选优先级排序的证据修正决策支持评分。",
    influences: "Combines descriptor score, graph motif bonus, diversity bonus, and evidence penalty.",
    influencesZh: "综合 Descriptor Score、Graph Motif Bonus、Diversity Bonus 与 Evidence Penalty。",
    dataStatus: "Evidence-adjusted / decision-support preview",
    role: "Descriptor Score + Graph Motif Score + Diversity Bonus - Evidence Penalty.",
  },
]

const EDGES = [
  { source: "surfaceArea", target: "descriptorScore", label: "contributes to" },
  { source: "poreSizeA", target: "descriptorScore", label: "controls accessibility" },
  { source: "poreVolume", target: "descriptorScore", label: "supports capacity" },
  { source: "co2Uptake", target: "descriptorScore", label: "direct performance input" },
  { source: "waterStability", target: "descriptorScore", label: "feasibility constraint" },
  { source: "thermalStability", target: "descriptorScore", label: "feasibility constraint" },
  { source: "toxicityConcern", target: "descriptorScore", label: "risk penalty" },
  { source: "metalNode", target: "activeMotif", label: "forms" },
  { source: "linker", target: "activeMotif", label: "connects" },
  { source: "functionalGroup", target: "activeMotif", label: "modulates" },
  { source: "activeMotif", target: "graphMotifScore", label: "adds structural context" },
  { source: "descriptorScore", target: "finalScore", label: "base score" },
  { source: "graphMotifScore", target: "finalScore", label: "motif bonus" },
  { source: "evidenceModifier", target: "finalScore", label: "confidence adjustment" },
]

const POSITIONS = {
  surfaceArea: [95, 52],
  poreSizeA: [95, 104],
  poreVolume: [95, 156],
  co2Uptake: [95, 208],
  waterStability: [95, 260],
  thermalStability: [95, 312],
  toxicityConcern: [95, 364],
  descriptorScore: [395, 208],
  metalNode: [115, 450],
  linker: [115, 505],
  functionalGroup: [115, 560],
  activeMotif: [395, 505],
  graphMotifScore: [620, 505],
  evidenceModifier: [620, 338],
  finalScore: [825, 338],
}

const PALETTE = {
  descriptor: { fill: "rgba(26,109,181,0.13)", stroke: "#1A6DB5" },
  feasibility: { fill: "rgba(21,128,61,0.12)", stroke: "#15803D" },
  risk: { fill: "rgba(180,83,9,0.12)", stroke: "#B45309" },
  graph: { fill: "rgba(14,116,144,0.13)", stroke: "#0E7490" },
  evidence: { fill: "rgba(217,119,6,0.14)", stroke: "#D97706" },
  score: { fill: "rgba(21,94,117,0.12)", stroke: "#155E75" },
  final: { fill: "rgba(26,109,181,0.18)", stroke: "#1A6DB5" },
}

function nodeLabel(node, lang) {
  return lang === "zh" ? node.labelZh || node.label : node.label
}

function selectedNodeInfo(node, lang) {
  return [
    [text(lang, "Meaning", "Meaning"), lang === "zh" ? node.descriptionZh : node.description],
    [text(lang, "Influences", "Influences"), lang === "zh" ? node.influencesZh : node.influences],
    [text(lang, "Data status", "Data status"), node.dataStatus],
    [text(lang, "Current role", "Current role"), node.role],
  ]
}

export function DescriptorRelationshipGraph({ t: tone, lang: forcedLang, isMobile: forcedMobile }) {
  const theme = useT()
  const { lang: contextLang } = useLang()
  const viewport = useViewport()
  const t = tone || theme
  const lang = forcedLang || contextLang
  const isMobile = forcedMobile ?? viewport.isMobile
  const [selectedId, setSelectedId] = useState("finalScore")
  const nodesById = useMemo(() => Object.fromEntries(NODES.map(node => [node.id, node])), [])
  const selected = nodesById[selectedId] || nodesById.finalScore
  const activeEdge = edge => edge.source === selectedId || edge.target === selectedId

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.35fr) minmax(280px, 0.65fr)", gap: 12, alignItems: "stretch" }}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 10, minWidth: 0, overflowX: "auto" }}>
        <svg
          viewBox="0 0 960 625"
          role="img"
          aria-label={text(lang, "图论辅助描述符关系网络", "Graph-informed descriptor relationship network")}
          style={{ display: "block", minWidth: isMobile ? 780 : 0, width: "100%", height: "auto" }}
        >
          <defs>
            <marker id="descriptor-graph-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L9,4.5 L0,9 Z" fill={t.faint} />
            </marker>
          </defs>
          {EDGES.map(edge => {
            const [sx, sy] = POSITIONS[edge.source]
            const [tx, ty] = POSITIONS[edge.target]
            const isActive = activeEdge(edge)
            const midX = (sx + tx) / 2
            const midY = (sy + ty) / 2
            return (
              <g key={`${edge.source}-${edge.target}`}>
                <path
                  d={`M ${sx + 82} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx - 82} ${ty}`}
                  fill="none"
                  stroke={isActive ? t.accentText : t.borderStrong}
                  strokeWidth={isActive ? 2.3 : 1.25}
                  markerEnd="url(#descriptor-graph-arrow)"
                  opacity={isActive ? 0.95 : 0.6}
                />
                {isActive && (
                  <text x={midX} y={midY - 5} textAnchor="middle" fill={t.subtle} fontSize="10" fontFamily={FONT_MONO}>
                    {edge.label}
                  </text>
                )}
              </g>
            )
          })}
          {NODES.map(node => {
            const [x, y] = POSITIONS[node.id]
            const palette = PALETTE[node.group] || PALETTE.descriptor
            const selectedNode = node.id === selectedId
            const connected = selectedNode || EDGES.some(edge => activeEdge(edge) && (edge.source === node.id || edge.target === node.id))
            return (
              <g
                key={node.id}
                role="button"
                tabIndex="0"
                onClick={() => setSelectedId(node.id)}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") setSelectedId(node.id)
                }}
                style={{ cursor: "pointer" }}
                opacity={connected || selectedId === "finalScore" ? 1 : 0.72}
              >
                <rect
                  x={x - 82}
                  y={y - 18}
                  width="164"
                  height="36"
                  rx="7"
                  fill={palette.fill}
                  stroke={selectedNode ? t.textStrong : palette.stroke}
                  strokeWidth={selectedNode ? 2.6 : 1.2}
                />
                <text x={x} y={y + 4} textAnchor="middle" fill={t.textStrong} fontSize="12" fontWeight="800">
                  {nodeLabel(node, lang)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <aside style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 13, display: "grid", gap: 11, alignContent: "start", minWidth: 0 }}>
        <div>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {text(lang, "Selected node", "Selected node")}
          </div>
          <h3 style={{ color: t.textStrong, fontSize: 16, lineHeight: 1.24, margin: "5px 0 0", fontWeight: 930 }}>
            {nodeLabel(selected, lang)}
          </h3>
        </div>
        {selectedNodeInfo(selected, lang).map(([label, value]) => (
          <div key={label} style={{ display: "grid", gap: 4 }}>
            <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
            <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>{value}</div>
          </div>
        ))}
        <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
          {text(
            lang,
            "当前图论结果是 explanation layer，用于说明结构关系、active motif 与 evidence-adjusted score，不是经过验证的 GNN 吸附能预测。",
            "Current graph results are an explanation layer for structural relationships, active motifs, and evidence-adjusted score; they are not validated GNN adsorption-energy predictions."
          )}
        </div>
      </aside>
    </div>
  )
}
