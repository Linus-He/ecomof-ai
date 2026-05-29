// @ts-nocheck
import { FormulaInline, SCIENTIFIC_TOKEN_FONT, organicAcidPalette as palette } from "./FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const pct = value => `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`

function MiniBar({ value, color = palette.accent }) {
  return (
    <span style={{ background: palette.surfaceStrong, borderRadius: 999, display: "block", height: 7, overflow: "hidden" }}>
      <span style={{ background: color, display: "block", height: "100%", width: pct(value) }} />
    </span>
  )
}

export function GraphMetricsPanel({ metrics, nodesById, edgesById, pathwaysById, selectedEdge, onSelectNode, onSelectEdge, onSelectPathway, lang }) {
  const centrality = metrics?.nodeCentrality || []
  const likelyPath = pathwaysById.get(metrics?.mostProbablePathway)
  const edge = selectedEdge || edgesById.get(likelyPath?.bottleneckEdge)
  return (
    <section style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 14 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <div style={{ color: palette.accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "图论指标面板", "Graph metrics panel")}
        </div>
        <h3 style={{ color: palette.text, fontSize: 18, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "中心性、边权重与竞争路径剪枝", "Centrality, edge weight, and competing branch pruning")}
        </h3>
      </header>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        <article style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, "节点中心性排行", "Node centrality ranking")}</strong>
          {centrality.map((row, index) => {
            const node = nodesById.get(row.nodeId)
            return (
              <button key={row.nodeId} type="button" onClick={() => node && onSelectNode(node)} style={{ background: index === 0 ? palette.accentSoft : "#fff", border: `1px solid ${index === 0 ? palette.accent : palette.border}`, borderRadius: 9, cursor: "pointer", display: "grid", gap: 5, padding: 9, textAlign: "left" }}>
                <span style={{ color: palette.text, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 12.5, fontWeight: 900 }}>{node ? text(lang, node.labelZh, node.label) : row.nodeId}</span>
                <MiniBar value={row.degreeCentrality} />
                <span style={{ color: palette.muted, fontSize: 11.5 }}>{text(lang, row.interpretationZh, row.interpretation)}</span>
              </button>
            )
          })}
        </article>

        <article style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", gap: 9, padding: 11 }}>
          <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, "边权重拆分", "Edge weight breakdown")}</strong>
          <FormulaInline size={12}>
            <span>w</span><sub>ij</sub><span>=</span><span>S</span><sub>evidence</sub><span>×</span><span>P</span><sub>chem</sub><span>×</span><span>F</span><sub>MOF</sub><span>×</span><span>V</span><sub>support</sub>
          </FormulaInline>
          {edge ? (
            <button type="button" onClick={() => onSelectEdge(edge)} style={{ background: "#fff", border: `1px solid ${palette.border}`, borderRadius: 9, cursor: "pointer", display: "grid", gap: 6, padding: 9, textAlign: "left" }}>
              <strong style={{ color: palette.text, fontSize: 12 }}>{text(lang, edge.labelZh, edge.label)}</strong>
              <MiniBar value={edge.evidenceScore} color={palette.accent} />
              <MiniBar value={edge.chemicalPlausibility} color={palette.positive} />
              <MiniBar value={edge.mofRegulationFactor} color={palette.mixed} />
              <MiniBar value={edge.validationSupport} color={palette.risk} />
              <span style={{ color: palette.muted, fontSize: 11.5 }}>{text(lang, "点击查看该边权重来源", "Click to inspect the edge-weight sources")}</span>
            </button>
          ) : null}
        </article>

        <article style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, "最可能甲酸路径", "Most probable pathway to formate")}</strong>
          {likelyPath ? (
            <button type="button" onClick={() => onSelectPathway(likelyPath)} style={{ background: "#fff", border: `1px solid ${palette.accent}`, borderRadius: 9, cursor: "pointer", display: "grid", gap: 5, padding: 9, textAlign: "left" }}>
              <span style={{ color: palette.accent, fontSize: 12.5, fontWeight: 900 }}>{text(lang, likelyPath.nameZh, likelyPath.name)}</span>
              <span style={{ color: palette.muted, fontSize: 11.5 }}>{text(lang, "分数", "Score")}: <span style={{ fontFamily: SCIENTIFIC_TOKEN_FONT }}>{pct(likelyPath.overallScore)}</span> · {text(lang, "瓶颈", "Bottleneck")}: {likelyPath.bottleneckEdge}</span>
              <span style={{ color: palette.risk, fontSize: 11.5 }}>{text(lang, "推荐验证", "Recommended validation")}: {likelyPath.recommendedValidation?.[0]}</span>
            </button>
          ) : null}
          {(metrics?.competingBranches || []).map(branch => (
            <button key={branch.id} type="button" onClick={() => onSelectEdge(edgesById.get(branch.edgeIds?.[0]))} style={{ background: "#fff", border: `1px dashed ${palette.risk}`, borderRadius: 9, color: palette.risk, cursor: "pointer", fontSize: 11.5, padding: 8, textAlign: "left" }}>
              {text(lang, branch.labelZh, branch.label)} · {text(lang, branch.reasonZh, branch.reason)}
            </button>
          ))}
        </article>
      </div>
    </section>
  )
}
