import { useState } from "react"
import { useViewport } from "../../shared"
import { ORGANIC_ACID_FONT } from "./FormulaInline"
import { MoleculeStructureImage, MoleculeSvgNode, moleculeCatalog } from "./MoleculeSvgNode"

const palette = {
  bg: "#FFFFFF",
  surface: "#F8FAFC",
  border: "#D9E2EC",
  borderStrong: "#B8C5D4",
  text: "#0F172A",
  muted: "#475569",
  faint: "#64748B",
  accent: "#1A6DB5",
  accentSoft: "#E8F2FC",
  positive: "#147C43",
  positiveSoft: "#F2FBF6",
  mixed: "#A15C13",
  mixedSoft: "#FFF7ED",
  risk: "#8F3B1B",
  riskSoft: "#FFF1E8",
}

export const pathwayTone = {
  formaldehyde: { color: palette.positive, soft: palette.positiveSoft, status: "positive" },
  glyceraldehyde: { color: palette.mixed, soft: palette.mixedSoft, status: "mixed" },
  pyruvaldehyde: { color: palette.risk, soft: palette.riskSoft, status: "risk" },
}

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const pathwayMeta = {
  formaldehyde: {
    id: "formaldehyde",
    labelZh: "路径 1",
    labelEn: "Path 1",
    titleZh: "甲醛 → 甲酸",
    titleEn: "Formaldehyde → Formic acid",
    subtitleZh: "主 C1 正向路径",
    subtitleEn: "Primary C1 positive route",
    focusNode: "formaldehyde",
    summaryZh: "A3 主导的正向路径，最直接支持甲酸 / 甲酸盐生成。",
    summaryEn: "A3-positive route that most directly supports formic acid / formate generation.",
    ...pathwayTone.formaldehyde,
  },
  glyceraldehyde: {
    id: "glyceraldehyde",
    labelZh: "路径 2",
    labelEn: "Path 2",
    titleZh: "甘油醛分支",
    titleEn: "Glyceraldehyde branches",
    subtitleZh: "混合路径",
    subtitleEn: "Mixed route",
    focusNode: "glyceraldehyde",
    summaryZh: "可支持 A2/A3，但乙醇酸和乙酸终点会提高 B1 副产物风险。",
    summaryEn: "Can support A2/A3, but glycolic and acetic acid endpoints increase B1.",
    ...pathwayTone.glyceraldehyde,
  },
  pyruvaldehyde: {
    id: "pyruvaldehyde",
    labelZh: "路径 3",
    labelEn: "Path 3",
    titleZh: "丙酮醛分支",
    titleEn: "Pyruvaldehyde branches",
    subtitleZh: "风险主导路径",
    subtitleEn: "Risk-dominant route",
    focusNode: "pyruvaldehyde",
    summaryZh: "更容易导向乳酸、丙酮酸和乙酸等副产物终点。",
    summaryEn: "Byproduct-heavy path toward lactic, pyruvic, and acetic acid endpoints.",
    ...pathwayTone.pyruvaldehyde,
  },
}

const MAP_WIDTH = 1480
const MAP_HEIGHT = 920
const NODE_LINE_GAP = 10

const networkNodes = {
  glucose: {
    moleculeId: "glucose",
    x: 40,
    y: 148,
    w: 260,
    h: 220,
    column: "Feedstock",
    compact: false,
    status: "feedstock",
    paths: ["formaldehyde", "glyceraldehyde", "pyruvaldehyde"],
  },
  fructose: {
    moleculeId: "fructose",
    x: 40,
    y: 536,
    w: 260,
    h: 220,
    column: "Feedstock",
    compact: false,
    status: "feedstock",
    paths: ["formaldehyde", "glyceraldehyde", "pyruvaldehyde"],
  },
  glyceraldehyde: {
    moleculeId: "glyceraldehyde",
    x: 432,
    y: 52,
    w: 270,
    h: 220,
    column: "Intermediates",
    compact: false,
    status: "mixed",
    paths: ["glyceraldehyde"],
  },
  formaldehyde: {
    moleculeId: "formaldehyde",
    x: 432,
    y: 340,
    w: 270,
    h: 220,
    column: "Intermediates",
    compact: false,
    status: "positive",
    paths: ["formaldehyde"],
  },
  pyruvaldehyde: {
    moleculeId: "pyruvaldehyde",
    x: 432,
    y: 628,
    w: 270,
    h: 220,
    column: "Intermediates",
    compact: false,
    status: "risk",
    paths: ["pyruvaldehyde"],
  },
  glycolicAcid: {
    moleculeId: "glycolicAcid",
    x: 902,
    y: 42,
    w: 260,
    h: 220,
    column: "Products / Byproducts",
    compact: true,
    status: "mixed",
    paths: ["glyceraldehyde"],
  },
  formicAcid: {
    moleculeId: "formicAcid",
    x: 1038,
    y: 338,
    w: 270,
    h: 220,
    column: "Products / Byproducts",
    compact: true,
    status: "positive",
    paths: ["formaldehyde", "glyceraldehyde", "pyruvaldehyde"],
  },
  aceticAcid: {
    moleculeId: "aceticAcid",
    x: 1180,
    y: 112,
    w: 260,
    h: 220,
    column: "Products / Byproducts",
    compact: true,
    status: "risk",
    paths: ["glyceraldehyde", "pyruvaldehyde"],
  },
  lacticAcid: {
    moleculeId: "lacticAcid",
    x: 902,
    y: 650,
    w: 260,
    h: 220,
    column: "Products / Byproducts",
    compact: true,
    status: "risk",
    paths: ["pyruvaldehyde"],
  },
  pyruvicAcid: {
    moleculeId: "pyruvicAcid",
    x: 1180,
    y: 650,
    w: 260,
    h: 220,
    column: "Products / Byproducts",
    compact: true,
    status: "risk",
    paths: ["pyruvaldehyde"],
  },
}

const edgeDefinitions = [
  { id: "glucose-glyceraldehyde", path: "glyceraldehyde", from: "glucose", to: "glyceraldehyde", labelZh: "C3 裂解", labelEn: "C3 split" },
  { id: "fructose-glyceraldehyde", path: "glyceraldehyde", from: "fructose", to: "glyceraldehyde", labelZh: "逆醛醇", labelEn: "retro-aldol" },
  { id: "glyceraldehyde-formic", path: "glyceraldehyde", from: "glyceraldehyde", to: "formicAcid", labelZh: "A2/A3", labelEn: "A2/A3", tone: palette.positive },
  { id: "glyceraldehyde-glycolic", path: "glyceraldehyde", from: "glyceraldehyde", to: "glycolicAcid", labelZh: "B1", labelEn: "B1" },
  { id: "glyceraldehyde-acetic", path: "glyceraldehyde", from: "glyceraldehyde", to: "aceticAcid", labelZh: "B1", labelEn: "B1" },
  { id: "glucose-formaldehyde", path: "formaldehyde", from: "glucose", to: "formaldehyde", labelZh: "C1", labelEn: "C1" },
  { id: "fructose-formaldehyde", path: "formaldehyde", from: "fructose", to: "formaldehyde", labelZh: "C1", labelEn: "C1" },
  { id: "formaldehyde-formic", path: "formaldehyde", from: "formaldehyde", to: "formicAcid", labelZh: "A3", labelEn: "A3" },
  { id: "glucose-pyruvaldehyde", path: "pyruvaldehyde", from: "glucose", to: "pyruvaldehyde", labelZh: "C3 风险", labelEn: "C3 risk" },
  { id: "fructose-pyruvaldehyde", path: "pyruvaldehyde", from: "fructose", to: "pyruvaldehyde", labelZh: "脱水", labelEn: "dehydration" },
  { id: "pyruvaldehyde-formic", path: "pyruvaldehyde", from: "pyruvaldehyde", to: "formicAcid", labelZh: "次要正向", labelEn: "minor positive", tone: palette.positive },
  { id: "pyruvaldehyde-lactic", path: "pyruvaldehyde", from: "pyruvaldehyde", to: "lacticAcid", labelZh: "B1", labelEn: "B1" },
  { id: "pyruvaldehyde-pyruvic", path: "pyruvaldehyde", from: "pyruvaldehyde", to: "pyruvicAcid", labelZh: "B1", labelEn: "B1" },
  { id: "pyruvaldehyde-acetic", path: "pyruvaldehyde", from: "pyruvaldehyde", to: "aceticAcid", labelZh: "B1", labelEn: "B1" },
]

const mappingRows = [
  {
    titleZh: "甲醛 → 甲酸",
    titleEn: "Formaldehyde → Formic acid",
    routeZh: "主 C1 正向路径",
    routeEn: "Primary C1 positive route",
    bodyZh: "主要贡献 A3 和 SelectivityFactor。",
    bodyEn: "Contributes to A3 and SelectivityFactor.",
    path: "formaldehyde",
  },
  {
    titleZh: "甘油醛 → 甲酸",
    titleEn: "Glyceraldehyde → Formic acid",
    routeZh: "混合路径中的正向分支",
    routeEn: "Mixed route, positive branch",
    bodyZh: "贡献 A2/A3。",
    bodyEn: "Contributes to A2/A3.",
    path: "glyceraldehyde",
  },
  {
    titleZh: "甘油醛 → 乙醇酸 / 乙酸",
    titleEn: "Glyceraldehyde → Glycolic acid / Acetic acid",
    routeZh: "混合路径中的 C2 副产物分支",
    routeEn: "Mixed route, C2 byproduct branch",
    bodyZh: "提高 B1 副产物风险。",
    bodyEn: "Increases B1.",
    path: "glyceraldehyde",
  },
  {
    titleZh: "丙酮醛 → 甲酸",
    titleEn: "Pyruvaldehyde → Formic acid",
    routeZh: "可能的正向分支",
    routeEn: "Possible positive branch",
    bodyZh: "可能导向甲酸，但优先级低于甲醛路径。",
    bodyEn: "Possible positive branch but lower priority.",
    path: "pyruvaldehyde",
  },
  {
    titleZh: "丙酮醛 → 乳酸 / 丙酮酸 / 乙酸",
    titleEn: "Pyruvaldehyde → Lactic acid / Pyruvic acid / Acetic acid",
    routeZh: "风险主导分支",
    routeEn: "Risk-dominant branch",
    bodyZh: "提高 B1，并降低 SelectivityFactor。",
    bodyEn: "Increases B1 and lowers SelectivityFactor.",
    path: "pyruvaldehyde",
  },
]

function nodePoint(id, side = "right") {
  const node = networkNodes[id]
  if (!node) return { x: 0, y: 0 }
  const y = node.y + node.h / 2
  if (side === "left") return { x: node.x - NODE_LINE_GAP, y }
  return { x: node.x + node.w + NODE_LINE_GAP, y }
}

function edgeCurve(edge) {
  const from = nodePoint(edge.from, "right")
  const to = nodePoint(edge.to, "left")
  const span = Math.max(60, Math.abs(to.x - from.x) * 0.48)
  const c1 = { x: from.x + span, y: from.y }
  const c2 = { x: to.x - span, y: to.y }
  return {
    d: `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`,
    labelX: (from.x + to.x) / 2,
    labelY: (from.y + to.y) / 2,
  }
}

function PathButton({ path, active, lang, onSelect, onHover, onLeave }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        alignItems: "start",
        background: active ? path.soft : palette.bg,
        border: `1px solid ${active ? path.color : palette.border}`,
        borderRadius: 8,
        boxShadow: `inset 4px 0 0 ${path.color}`,
        color: palette.text,
        cursor: "pointer",
        display: "grid",
        gap: 3,
        minHeight: 58,
        padding: "8px 10px",
        textAlign: "left",
      }}
    >
      <span style={{ color: path.color, fontSize: 10, fontWeight: 950, textTransform: "uppercase" }}>{text(lang, path.labelZh, path.labelEn)}</span>
      <span style={{ fontSize: 12.5, fontWeight: 950, lineHeight: 1.25 }}>{text(lang, path.titleZh, path.titleEn)}</span>
      <span style={{ color: palette.muted, fontSize: 10.8, fontWeight: 750, lineHeight: 1.25 }}>{text(lang, path.subtitleZh, path.subtitleEn)}</span>
    </button>
  )
}

function MoleculeDetailPanel({ nodeId, lang }) {
  const node = networkNodes[nodeId] || networkNodes.formaldehyde
  const molecule = moleculeCatalog[node.moleculeId]
  const terms = ["A2", "A3", "A4", "B1", "SelectivityFactor"]
  const tone = node.paths.length === 1 ? pathwayTone[node.paths[0]] : pathwayTone.formaldehyde
  const primaryName = lang === "zh" ? molecule.zhName : molecule.englishName
  const secondaryName = lang === "zh" ? molecule.englishName : molecule.zhName

  return (
    <article style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, boxShadow: `inset 3px 0 0 ${tone.color}`, padding: 12 }}>
      <div style={{ color: palette.faint, fontSize: 10, fontWeight: 950, textTransform: "uppercase" }}>{text(lang, "分子详情", "Molecule detail")}</div>
      <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
        <div>
          <div style={{ color: palette.text, fontSize: 14, fontWeight: 950, lineHeight: 1.25 }}>{primaryName}</div>
          <div style={{ color: tone.color, fontSize: 12, fontWeight: 850, marginTop: 3 }}>{secondaryName}</div>
        </div>
        <div style={{ alignItems: "center", background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, display: "flex", justifyContent: "center", minHeight: 170, overflow: "visible", padding: 14 }}>
          <MoleculeStructureImage moleculeId={molecule.id} lang={lang} />
        </div>
        <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.55 }}>
          <strong style={{ color: palette.text }}>{text(lang, "路径角色：", "Role in pathway:")}</strong> {text(lang, molecule.pathwayRoleZh, molecule.pathwayRole)}
        </div>
        <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.55 }}>
          <strong style={{ color: palette.text }}>{text(lang, "关联评分项：", "Related score term:")}</strong> {text(lang, molecule.scoreTermZh, molecule.scoreTerm)}
        </div>
        <div style={{ border: `1px solid ${palette.border}`, borderRadius: 7, overflow: "hidden" }}>
          {terms.map((term, index) => {
            const active = molecule.contributesTo?.[term]
            return (
              <div
                key={term}
                style={{
                  alignItems: "center",
                  background: index % 2 === 0 ? palette.bg : palette.surface,
                  borderTop: index === 0 ? "none" : `1px solid ${palette.border}`,
                  display: "grid",
                  gap: 8,
                  gridTemplateColumns: "112px minmax(0, 1fr)",
                  padding: "7px 9px",
                }}
              >
                <span style={{ color: palette.text, fontFamily: ORGANIC_ACID_FONT, fontSize: 11.5, fontWeight: 700 }}>{term}</span>
                <span style={{ color: active ? tone.color : palette.faint, fontSize: 11.2, fontWeight: active ? 850 : 650 }}>
                  {active ? text(lang, "参与", "contributes") : text(lang, "无直接贡献", "no direct contribution")}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}

function PathwayMappingPanel({ activePath, lang }) {
  return (
    <article style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 12 }}>
      <div style={{ color: palette.faint, fontSize: 10, fontWeight: 950, textTransform: "uppercase" }}>{text(lang, "路径与评分映射", "Pathway-to-score mapping")}</div>
      <div style={{ color: palette.muted, fontSize: 11.2, lineHeight: 1.45, marginTop: 6 }}>{text(lang, pathwayMeta[activePath].summaryZh, pathwayMeta[activePath].summaryEn)}</div>
      <div style={{ display: "grid", gap: 8, marginTop: 9 }}>
        {mappingRows.map((row) => {
          const path = pathwayMeta[row.path]
          const active = row.path === activePath
          return (
            <div key={row.titleEn} style={{ background: active ? path.soft : palette.bg, border: `1px solid ${active ? path.color : palette.border}`, borderRadius: 7, boxShadow: `inset 3px 0 0 ${path.color}`, padding: 9 }}>
              <div style={{ color: path.color, fontSize: 10.2, fontWeight: 920, lineHeight: 1.3 }}>{text(lang, row.titleZh, row.titleEn)}</div>
              <div style={{ color: palette.text, fontSize: 11.5, fontWeight: 880, lineHeight: 1.35, marginTop: 4 }}>{text(lang, row.routeZh, row.routeEn)}</div>
              <div style={{ color: palette.muted, fontSize: 10.8, lineHeight: 1.45, marginTop: 4 }}>{text(lang, row.bodyZh, row.bodyEn)}</div>
            </div>
          )
        })}
      </div>
    </article>
  )
}

export function OrganicAcidPathwayMap({ lang = "zh" }) {
  const { isNarrow } = useViewport()
  const [activePath, setActivePath] = useState("formaldehyde")
  const [hoveredPath, setHoveredPath] = useState("")
  const [hoveredNode, setHoveredNode] = useState("")
  const [selectedNode, setSelectedNode] = useState("formaldehyde")
  const highlightedPath = hoveredPath || activePath

  const selectPath = (pathId) => {
    setActivePath(pathId)
    setSelectedNode(pathwayMeta[pathId].focusNode)
  }

  return (
    <section style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: "grid", gap: 4, marginBottom: 13 }}>
        <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.2, textTransform: "uppercase" }}>
          {text(lang, "反应机理图", "Reaction mechanism map")}
        </div>
        <h2 style={{ color: palette.text, fontSize: 17, lineHeight: 1.25, margin: 0 }}>{text(lang, "三路径动态反应网络", "Three-pathway Reaction Network")}</h2>
        <p style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
          {text(
            lang,
            "结构式来自 SVG 分子资产。悬停路径可查看分支，点击分子可查看评分角色，点击路径标签可锁定当前高亮路径。",
            "SVG molecule assets are used as the source of structure display. Hover a route to inspect its branch, click a molecule to view its score role, and use the path labels to lock the active route."
          )}
        </p>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 9, gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
          {Object.values(pathwayMeta).map((path) => (
            <PathButton
              key={path.id}
              path={path}
              lang={lang}
              active={highlightedPath === path.id}
              onSelect={() => selectPath(path.id)}
              onHover={() => setHoveredPath(path.id)}
              onLeave={() => setHoveredPath("")}
            />
          ))}
        </div>

        <div style={{ display: "grid", gap: 13, gridTemplateColumns: isNarrow ? "minmax(0, 1fr)" : "minmax(0, 1fr) minmax(280px, 0.32fr)", alignItems: "start", minWidth: 0 }}>
          <div style={{ maxWidth: "100%", minWidth: 0, overflowX: "auto", paddingBottom: 4, width: "100%" }}>
            <div
              style={{
                background: palette.bg,
                border: `1px solid ${palette.border}`,
                borderRadius: 10,
                height: MAP_HEIGHT,
                minWidth: MAP_WIDTH,
                position: "relative",
                width: MAP_WIDTH,
              }}
            >
              <svg aria-hidden="true" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="none" style={{ height: "100%", inset: 0, position: "absolute", width: "100%", zIndex: 1 }}>
                <defs>
                  {edgeDefinitions.map((edge) => {
                    const color = edge.tone || pathwayMeta[edge.path].color
                    return (
                      <marker key={edge.id} id={`arrow-${edge.id}`} markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4" viewBox="0 0 8 8">
                        <path d="M 0 0 L 8 4 L 0 8 z" fill={color} />
                      </marker>
                    )
                  })}
                </defs>
                <rect x="390" y="304" width="980" height="292" rx="18" fill={palette.positiveSoft} stroke={palette.positive} strokeOpacity="0.22" />
                {edgeDefinitions.map((edge) => {
                  const path = pathwayMeta[edge.path]
                  const active = highlightedPath === edge.path
                  const curve = edgeCurve(edge)
                  const stroke = edge.tone || path.color
                  return (
                    <g
                      key={edge.id}
                      opacity={active ? 1 : 0.18}
                      onMouseEnter={() => setHoveredPath(edge.path)}
                      onMouseLeave={() => setHoveredPath("")}
                      style={{ cursor: "pointer", pointerEvents: "stroke" }}
                    >
                      <path d={curve.d} fill="none" markerEnd={`url(#arrow-${edge.id})`} stroke={stroke} strokeLinecap="round" strokeWidth={active ? 3.3 : 2} />
                      <text x={curve.labelX} y={curve.labelY - 6} fill={stroke} fontFamily="Arial, Helvetica, sans-serif" fontSize="10.5" fontWeight="800" textAnchor="middle">
                        {text(lang, edge.labelZh, edge.labelEn)}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {[
                { zh: "原料", en: "Feedstock", x: 40 },
                { zh: "中间体", en: "Intermediates", x: 432 },
                { zh: "产物 / 副产物", en: "Products / Byproducts", x: 902 },
              ].map(({ zh, en, x }) => (
                <div key={en} style={{ color: palette.faint, fontSize: 10.5, fontWeight: 950, left: x, letterSpacing: 0.2, position: "absolute", textTransform: "uppercase", top: 12, zIndex: 2 }}>
                  {text(lang, zh, en)}
                </div>
              ))}

              {Object.entries(networkNodes).map(([id, position]) => {
                const nodeActive = position.paths.includes(highlightedPath)
                const selected = selectedNode === id
                const dimmed = !nodeActive && !selected && !hoveredNode
                return (
                  <div
                    key={id}
                    style={{
                      height: position.h,
                      left: position.x,
                      position: "absolute",
                      top: position.y,
                      width: position.w,
                      zIndex: 3,
                    }}
                  >
                    <MoleculeSvgNode
                      moleculeId={position.moleculeId}
                      status={position.status}
                      compact={position.compact}
                      active={nodeActive}
                      selected={selected}
                      dimmed={dimmed}
                      onClick={() => setSelectedNode(id)}
                      onMouseEnter={() => setHoveredNode(id)}
                      onMouseLeave={() => setHoveredNode("")}
                      style={{ height: "100%", width: "100%" }}
                      lang={lang}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <MoleculeDetailPanel nodeId={selectedNode} lang={lang} />
            <PathwayMappingPanel activePath={highlightedPath} lang={lang} />
          </div>
        </div>
      </div>
    </section>
  )
}
