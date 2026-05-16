import { useState } from "react"
import { FONT_MONO, useViewport } from "../../shared"
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

const pathwayMeta = {
  formaldehyde: {
    id: "formaldehyde",
    label: "Path 1",
    title: "Formaldehyde -> Formic acid",
    subtitle: "Primary C1 positive route",
    focusNode: "formaldehyde",
    summary: "A3-positive route that most directly supports formic acid / formate generation.",
    ...pathwayTone.formaldehyde,
  },
  glyceraldehyde: {
    id: "glyceraldehyde",
    label: "Path 2",
    title: "Glyceraldehyde branches",
    subtitle: "Mixed route",
    focusNode: "glyceraldehyde",
    summary: "Can support A2/A3, but glycolic and acetic acid endpoints increase B1.",
    ...pathwayTone.glyceraldehyde,
  },
  pyruvaldehyde: {
    id: "pyruvaldehyde",
    label: "Path 3",
    title: "Pyruvaldehyde branches",
    subtitle: "Risk-dominant route",
    focusNode: "pyruvaldehyde",
    summary: "Byproduct-heavy path toward lactic, pyruvic, and acetic acid endpoints.",
    ...pathwayTone.pyruvaldehyde,
  },
}

const networkNodes = {
  glucose: {
    moleculeId: "glucose",
    x: 34,
    y: 112,
    w: 214,
    h: 168,
    column: "Feedstock",
    compact: false,
    status: "feedstock",
    paths: ["formaldehyde", "glyceraldehyde", "pyruvaldehyde"],
  },
  fructose: {
    moleculeId: "fructose",
    x: 34,
    y: 356,
    w: 214,
    h: 168,
    column: "Feedstock",
    compact: false,
    status: "feedstock",
    paths: ["formaldehyde", "glyceraldehyde", "pyruvaldehyde"],
  },
  glyceraldehyde: {
    moleculeId: "glyceraldehyde",
    x: 356,
    y: 48,
    w: 232,
    h: 150,
    column: "Intermediates",
    compact: false,
    status: "mixed",
    paths: ["glyceraldehyde"],
  },
  formaldehyde: {
    moleculeId: "formaldehyde",
    x: 356,
    y: 268,
    w: 232,
    h: 136,
    column: "Intermediates",
    compact: false,
    status: "positive",
    paths: ["formaldehyde"],
  },
  pyruvaldehyde: {
    moleculeId: "pyruvaldehyde",
    x: 356,
    y: 488,
    w: 232,
    h: 150,
    column: "Intermediates",
    compact: false,
    status: "risk",
    paths: ["pyruvaldehyde"],
  },
  glycolicAcid: {
    moleculeId: "glycolicAcid",
    x: 750,
    y: 38,
    w: 194,
    h: 136,
    column: "Products / Byproducts",
    compact: true,
    status: "mixed",
    paths: ["glyceraldehyde"],
  },
  formicAcid: {
    moleculeId: "formicAcid",
    x: 794,
    y: 208,
    w: 218,
    h: 136,
    column: "Products / Byproducts",
    compact: true,
    status: "positive",
    paths: ["formaldehyde", "glyceraldehyde", "pyruvaldehyde"],
  },
  aceticAcid: {
    moleculeId: "aceticAcid",
    x: 984,
    y: 350,
    w: 194,
    h: 128,
    column: "Products / Byproducts",
    compact: true,
    status: "risk",
    paths: ["glyceraldehyde", "pyruvaldehyde"],
  },
  lacticAcid: {
    moleculeId: "lacticAcid",
    x: 742,
    y: 512,
    w: 202,
    h: 136,
    column: "Products / Byproducts",
    compact: true,
    status: "risk",
    paths: ["pyruvaldehyde"],
  },
  pyruvicAcid: {
    moleculeId: "pyruvicAcid",
    x: 980,
    y: 512,
    w: 202,
    h: 136,
    column: "Products / Byproducts",
    compact: true,
    status: "risk",
    paths: ["pyruvaldehyde"],
  },
}

const edgeDefinitions = [
  { id: "glucose-glyceraldehyde", path: "glyceraldehyde", from: "glucose", to: "glyceraldehyde", label: "C3 split" },
  { id: "fructose-glyceraldehyde", path: "glyceraldehyde", from: "fructose", to: "glyceraldehyde", label: "retro-aldol" },
  { id: "glyceraldehyde-formic", path: "glyceraldehyde", from: "glyceraldehyde", to: "formicAcid", label: "A2/A3", tone: palette.positive },
  { id: "glyceraldehyde-glycolic", path: "glyceraldehyde", from: "glyceraldehyde", to: "glycolicAcid", label: "B1" },
  { id: "glyceraldehyde-acetic", path: "glyceraldehyde", from: "glyceraldehyde", to: "aceticAcid", label: "B1" },
  { id: "glucose-formaldehyde", path: "formaldehyde", from: "glucose", to: "formaldehyde", label: "C1" },
  { id: "fructose-formaldehyde", path: "formaldehyde", from: "fructose", to: "formaldehyde", label: "C1" },
  { id: "formaldehyde-formic", path: "formaldehyde", from: "formaldehyde", to: "formicAcid", label: "A3" },
  { id: "glucose-pyruvaldehyde", path: "pyruvaldehyde", from: "glucose", to: "pyruvaldehyde", label: "C3 risk" },
  { id: "fructose-pyruvaldehyde", path: "pyruvaldehyde", from: "fructose", to: "pyruvaldehyde", label: "dehydration" },
  { id: "pyruvaldehyde-formic", path: "pyruvaldehyde", from: "pyruvaldehyde", to: "formicAcid", label: "minor", tone: palette.positive },
  { id: "pyruvaldehyde-lactic", path: "pyruvaldehyde", from: "pyruvaldehyde", to: "lacticAcid", label: "B1" },
  { id: "pyruvaldehyde-pyruvic", path: "pyruvaldehyde", from: "pyruvaldehyde", to: "pyruvicAcid", label: "B1" },
  { id: "pyruvaldehyde-acetic", path: "pyruvaldehyde", from: "pyruvaldehyde", to: "aceticAcid", label: "B1" },
]

const mappingRows = [
  {
    title: "Formaldehyde -> Formic acid",
    route: "Primary C1 positive route",
    body: "Contributes to A3 and SelectivityFactor.",
    path: "formaldehyde",
  },
  {
    title: "Glyceraldehyde -> Formic acid",
    route: "Mixed route, positive branch",
    body: "Contributes to A2/A3.",
    path: "glyceraldehyde",
  },
  {
    title: "Glyceraldehyde -> Glycolic acid / Acetic acid",
    route: "Mixed route, C2 byproduct branch",
    body: "Increases B1.",
    path: "glyceraldehyde",
  },
  {
    title: "Pyruvaldehyde -> Formic acid",
    route: "Possible positive branch",
    body: "Possible positive branch but lower priority.",
    path: "pyruvaldehyde",
  },
  {
    title: "Pyruvaldehyde -> Lactic acid / Pyruvic acid / Acetic acid",
    route: "Risk-dominant branch",
    body: "Increases B1 and lowers SelectivityFactor.",
    path: "pyruvaldehyde",
  },
]

function nodePoint(id, side = "right") {
  const node = networkNodes[id]
  if (!node) return { x: 0, y: 0 }
  const y = node.y + node.h / 2
  if (side === "left") return { x: node.x, y }
  return { x: node.x + node.w, y }
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

function PathButton({ path, active, onSelect, onHover, onLeave }) {
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
      <span style={{ color: path.color, fontSize: 10, fontWeight: 950, textTransform: "uppercase" }}>{path.label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 950, lineHeight: 1.25 }}>{path.title}</span>
      <span style={{ color: palette.muted, fontSize: 10.8, fontWeight: 750, lineHeight: 1.25 }}>{path.subtitle}</span>
    </button>
  )
}

function MoleculeDetailPanel({ nodeId }) {
  const node = networkNodes[nodeId] || networkNodes.formaldehyde
  const molecule = moleculeCatalog[node.moleculeId]
  const terms = ["A2", "A3", "A4", "B1", "SelectivityFactor"]
  const tone = node.paths.length === 1 ? pathwayTone[node.paths[0]] : pathwayTone.formaldehyde

  return (
    <article style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, boxShadow: `inset 3px 0 0 ${tone.color}`, padding: 12 }}>
      <div style={{ color: palette.faint, fontSize: 10, fontWeight: 950, textTransform: "uppercase" }}>Molecule detail</div>
      <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
        <div>
          <div style={{ color: palette.text, fontSize: 14, fontWeight: 950, lineHeight: 1.25 }}>{molecule.englishName}</div>
          <div style={{ color: tone.color, fontSize: 12, fontWeight: 850, marginTop: 3 }}>{molecule.zhName}</div>
        </div>
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 7, display: "flex", justifyContent: "center", padding: 8 }}>
          <MoleculeStructureImage moleculeId={molecule.id} />
        </div>
        <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.55 }}>
          <strong style={{ color: palette.text }}>Role in pathway:</strong> {molecule.pathwayRole}
        </div>
        <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.55 }}>
          <strong style={{ color: palette.text }}>Related score term:</strong> {molecule.scoreTerm}
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
                <span style={{ color: palette.text, fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 900 }}>{term}</span>
                <span style={{ color: active ? tone.color : palette.faint, fontSize: 11.2, fontWeight: active ? 850 : 650 }}>
                  {active ? "contributes" : "no direct contribution"}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}

function PathwayMappingPanel({ activePath }) {
  return (
    <article style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 12 }}>
      <div style={{ color: palette.faint, fontSize: 10, fontWeight: 950, textTransform: "uppercase" }}>Pathway-to-score mapping</div>
      <div style={{ color: palette.muted, fontSize: 11.2, lineHeight: 1.45, marginTop: 6 }}>{pathwayMeta[activePath].summary}</div>
      <div style={{ display: "grid", gap: 8, marginTop: 9 }}>
        {mappingRows.map((row) => {
          const path = pathwayMeta[row.path]
          const active = row.path === activePath
          return (
            <div key={row.title} style={{ background: active ? path.soft : palette.bg, border: `1px solid ${active ? path.color : palette.border}`, borderRadius: 7, boxShadow: `inset 3px 0 0 ${path.color}`, padding: 9 }}>
              <div style={{ color: path.color, fontSize: 10.2, fontWeight: 920, lineHeight: 1.3 }}>{row.title}</div>
              <div style={{ color: palette.text, fontSize: 11.5, fontWeight: 880, lineHeight: 1.35, marginTop: 4 }}>{row.route}</div>
              <div style={{ color: palette.muted, fontSize: 10.8, lineHeight: 1.45, marginTop: 4 }}>{row.body}</div>
            </div>
          )
        })}
      </div>
    </article>
  )
}

export function OrganicAcidPathwayMap() {
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
          Reaction mechanism map
        </div>
        <h2 style={{ color: palette.text, fontSize: 17, lineHeight: 1.25, margin: 0 }}>Three-pathway Reaction Network / 三路径反应网络</h2>
        <p style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
          SVG molecule assets are used as the source of structure display. Hover a route to inspect its branch, click a molecule to view its score role, and use the path labels to lock the active route.
        </p>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 9, gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
          {Object.values(pathwayMeta).map((path) => (
            <PathButton
              key={path.id}
              path={path}
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
                height: 690,
                minWidth: 1200,
                position: "relative",
                width: 1200,
              }}
            >
              <svg aria-hidden="true" viewBox="0 0 1200 690" preserveAspectRatio="none" style={{ height: "100%", inset: 0, position: "absolute", width: "100%", zIndex: 1 }}>
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
                <rect x="330" y="250" width="728" height="176" rx="12" fill={palette.positiveSoft} stroke={palette.positive} strokeOpacity="0.28" />
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
                        {edge.label}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {[
                ["Feedstock", 34],
                ["Intermediates", 356],
                ["Products / Byproducts", 748],
              ].map(([label, x]) => (
                <div key={label} style={{ color: palette.faint, fontSize: 10.5, fontWeight: 950, left: x, letterSpacing: 0.2, position: "absolute", textTransform: "uppercase", top: 12, zIndex: 2 }}>
                  {label}
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
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <MoleculeDetailPanel nodeId={selectedNode} />
            <PathwayMappingPanel activePath={highlightedPath} />
          </div>
        </div>
      </div>
    </section>
  )
}
