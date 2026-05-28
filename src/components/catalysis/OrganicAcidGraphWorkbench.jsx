import { useEffect, useMemo, useState } from "react"
import { ChemicalFormula, fetchDataJson, useViewport } from "../../shared"
import { ORGANIC_ACID_FONT, organicAcidPalette as palette } from "./FormulaInline"
import { GraphEdgeDetailPanel } from "./GraphEdgeDetailPanel"
import { GraphEvidencePanel } from "./GraphEvidencePanel"
import { GraphMetricsPanel } from "./GraphMetricsPanel"
import { GraphNodeDetailPanel } from "./GraphNodeDetailPanel"
import { MofRegulationLayer } from "./MofRegulationLayer"
import { PathwayDetailPanel } from "./PathwayDetailPanel"
import { PathwayFilterBar } from "./PathwayFilterBar"
import { ReactionNetworkGraph } from "./ReactionNetworkGraph"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function OverviewPanel({ lang, primaryPathway }) {
  return (
    <article style={{ display: "grid", gap: 10 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <div style={{ color: palette.accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "工作台说明", "Workbench summary")}
        </div>
        <h3 style={{ color: palette.text, fontSize: 20, lineHeight: 1.18, margin: 0 }}>
          {text(lang, "从反应路径到候选物规则的统一解释链路", "Unified explanation chain from pathway graph to candidate rules")}
        </h3>
      </header>
      <p style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
        {text(
          lang,
          "节点代表物种、中间体、产物或调控因子；边代表候选转化步骤、竞争分支或环境 / MOF 调控作用。点击节点、边、路径、图论指标或 MOF 调控因子会同步高亮反应网络与候选物工作台。",
          "Nodes represent species, intermediates, products, or regulation factors. Edges represent candidate transformations, competing branches, or environment / MOF regulation effects. Clicking nodes, edges, pathways, graph metrics, or MOF factors synchronizes the graph and candidate workspace."
        )}
      </p>
      {primaryPathway ? (
        <div style={{ background: palette.accentSoft, border: `1px solid ${palette.border}`, borderRadius: 9, color: palette.accent, fontSize: 12.5, fontWeight: 850, lineHeight: 1.5, padding: 10 }}>
          {text(lang, "默认核心路径", "Default core pathway")}: {text(lang, primaryPathway.nameZh, primaryPathway.name)}
        </div>
      ) : null}
    </article>
  )
}

export function OrganicAcidGraphWorkbench({
  lang,
  selectedNodeId: externalSelectedNodeId,
  focusEdgeIds = [],
  onSelectNode: onExternalSelectNode,
  onSelectPathway: onExternalSelectPathway,
  onHighlightEdges,
}) {
  const { isNarrow } = useViewport()
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [pathways, setPathways] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [regulations, setRegulations] = useState([])
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedNodeId, setSelectedNodeId] = useState(externalSelectedNodeId || "")
  const [selectedEdgeId, setSelectedEdgeId] = useState("")
  const [selectedPathwayId, setSelectedPathwayId] = useState("glucose-c3-c1-formate")
  const [activeRegulationId, setActiveRegulationId] = useState("")
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState([])

  useEffect(() => {
    let active = true
    Promise.all([
      fetchDataJson("organic_acid_reaction_nodes.json", []),
      fetchDataJson("organic_acid_reaction_edges.json", []),
      fetchDataJson("organic_acid_pathways.json", []),
      fetchDataJson("organic_acid_graph_metrics.json", null),
      fetchDataJson("organic_acid_mof_regulation.json", []),
    ]).then(([nextNodes, nextEdges, nextPathways, nextMetrics, nextRegulations]) => {
      if (!active) return
      setNodes(Array.isArray(nextNodes) ? nextNodes : [])
      setEdges(Array.isArray(nextEdges) ? nextEdges : [])
      setPathways(Array.isArray(nextPathways) ? nextPathways : [])
      setMetrics(nextMetrics || null)
      setRegulations(Array.isArray(nextRegulations) ? nextRegulations : [])
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (externalSelectedNodeId) setSelectedNodeId(externalSelectedNodeId)
  }, [externalSelectedNodeId])

  useEffect(() => {
    if (focusEdgeIds?.length) {
      setHighlightedEdgeIds(focusEdgeIds)
      setSelectedEdgeId(focusEdgeIds[0])
      setSelectedNodeId("")
    }
  }, [focusEdgeIds])

  const nodesById = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes])
  const edgesById = useMemo(() => new Map(edges.map(edge => [edge.id, edge])), [edges])
  const pathwaysById = useMemo(() => new Map(pathways.map(pathway => [pathway.id, pathway])), [pathways])
  const selectedNode = nodesById.get(selectedNodeId)
  const selectedEdge = edgesById.get(selectedEdgeId)
  const selectedPathway = pathwaysById.get(selectedPathwayId)
  const activeRegulation = regulations.find(item => item.id === activeRegulationId)

  const selectNode = node => {
    setSelectedNodeId(node.id)
    setSelectedEdgeId("")
    onExternalSelectNode?.(node.id)
  }

  const selectEdge = edge => {
    if (!edge) return
    setSelectedEdgeId(edge.id)
    setSelectedNodeId("")
    setHighlightedEdgeIds([edge.id])
    onHighlightEdges?.([edge.id])
  }

  const selectPathway = pathway => {
    if (!pathway) return
    setSelectedPathwayId(pathway.id)
    setSelectedEdgeId("")
    setSelectedNodeId("")
    setHighlightedEdgeIds(pathway.edgeSequence || [])
    onHighlightEdges?.(pathway.edgeSequence || [])
    onExternalSelectPathway?.(pathway)
  }

  const selectRegulation = regulation => {
    setActiveRegulationId(regulation.id)
    setSelectedEdgeId("")
    setHighlightedEdgeIds(regulation.affectedEdges || [])
    onHighlightEdges?.(regulation.affectedEdges || [])
  }

  const clearHighlight = filterId => {
    setActiveFilter(filterId)
    setHighlightedEdgeIds([])
    onHighlightEdges?.([])
  }

  return (
    <section id="organic-acid-carbon-flow-graph" style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 12, display: "grid", fontFamily: ORGANIC_ACID_FONT, gap: 14, padding: isNarrow ? 12 : 16, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <div style={{ color: palette.accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "Organic Acid Carbon-Flow Graph Workbench", "Organic Acid Carbon-Flow Graph Workbench")}
        </div>
        <h2 style={{ color: palette.text, fontSize: isNarrow ? 21 : 26, lineHeight: 1.12, margin: 0 }}>
          {text(lang, "有机酸碳流图论路径工作台", "Organic acid carbon-flow graph workbench")}
        </h2>
        <p style={{ color: palette.muted, fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 1000 }}>
          {lang === "zh" ? (
            <>基于葡萄糖 / <ChemicalFormula value="NaHCO3" /> 协同转甲酸和副产物路径的候选网络，将节点、边、路径权重、MOF 调控和验证状态组织为可点击工作台。</>
          ) : (
            <>A candidate network for synergistic glucose / <ChemicalFormula value="NaHCO3" /> conversion to formate and by-products, organized as clickable nodes, edges, pathway weights, MOF regulation, and validation status.</>
          )}
        </p>
      </header>

      <PathwayFilterBar activeFilter={activeFilter} onChange={clearHighlight} lang={lang} />

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.45fr) minmax(300px, 0.65fr)", alignItems: "start" }}>
        <ReactionNetworkGraph
          nodes={nodes}
          edges={edges}
          pathways={pathways}
          activeFilter={activeFilter}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          selectedPathwayId={selectedPathwayId}
          highlightedEdgeIds={highlightedEdgeIds}
          onSelectNode={selectNode}
          onSelectEdge={selectEdge}
          onSelectPathway={selectPathway}
          lang={lang}
        />
        <aside style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 12, maxHeight: isNarrow ? "none" : 620, overflow: "auto", padding: 13 }}>
          {selectedEdge ? (
            <GraphEdgeDetailPanel edge={selectedEdge} nodesById={nodesById} lang={lang} />
          ) : selectedNode ? (
            <GraphNodeDetailPanel node={selectedNode} lang={lang} />
          ) : selectedPathway ? (
            <PathwayDetailPanel pathway={selectedPathway} nodesById={nodesById} edgesById={edgesById} lang={lang} />
          ) : (
            <OverviewPanel lang={lang} primaryPathway={pathwaysById.get("glucose-c3-c1-formate")} />
          )}
        </aside>
      </div>

      <GraphMetricsPanel
        metrics={metrics}
        nodesById={nodesById}
        edgesById={edgesById}
        pathwaysById={pathwaysById}
        selectedEdge={selectedEdge}
        onSelectNode={selectNode}
        onSelectEdge={selectEdge}
        onSelectPathway={selectPathway}
        lang={lang}
      />
      <MofRegulationLayer regulations={regulations} activeRegulationId={activeRegulationId} onSelectRegulation={selectRegulation} lang={lang} />
      <GraphEvidencePanel selectedNode={selectedNode} selectedEdge={selectedEdge} selectedPathway={selectedPathway} activeRegulation={activeRegulation} lang={lang} />
    </section>
  )
}
