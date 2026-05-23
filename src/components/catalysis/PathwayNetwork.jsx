import { useMemo, useState } from "react"
import { PathwayDetailPanel } from "./PathwayDetailPanel"
import { PathwayEvidenceBadge } from "./PathwayEvidenceBadge"
import { PathwayRouteTabs } from "./PathwayRouteTabs"
import { ROUTE_GROUP_DESCRIPTIONS, ROUTE_GROUPS, useReactionRationaleData } from "./reactionRationaleData"

const LAYER_LABELS = {
  "carbon-source": "Carbon source layer",
  intermediate: "Intermediate layer",
  product: "Product / target layer",
  byproduct: "Product / risk layer",
  "carbon-loss": "Carbon-loss layer",
}

function NetworkNode({ node, active, dimmed, onClick, t }) {
  const risk = ["byproduct", "unknown"].includes(node.type)
  return (
    <button
      type="button"
      onClick={onClick}
      title={node.description}
      style={{
        background: active ? t.badgeInfoBg : t.panel,
        border: `1px solid ${active ? t.accent : risk ? t.warn : t.border}`,
        borderRadius: 8,
        color: risk ? t.warn : active ? t.accentText : t.textStrong,
        cursor: "pointer",
        display: "grid",
        gap: 4,
        minHeight: 58,
        opacity: dimmed ? 0.45 : 1,
        padding: "9px 10px",
        textAlign: "left",
        transition: "opacity 120ms ease, border-color 120ms ease",
      }}
    >
      <span style={{ fontSize: 12.5, fontWeight: 900, lineHeight: 1.25 }}>{node.label}</span>
      <span style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.3 }}>{node.type}</span>
    </button>
  )
}

function EdgeButton({ pathway, active, dimmed, onClick, t }) {
  const risk = pathway.routeGroup === "Byproduct / carbon-loss route"
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${pathway.from} to ${pathway.to}: ${pathway.status}`}
      style={{
        alignItems: "stretch",
        background: active ? t.badgeInfoBg : t.panel,
        border: `1px solid ${active ? t.accent : risk ? t.warn : t.border}`,
        borderRadius: 8,
        color: t.textStrong,
        cursor: "pointer",
        display: "grid",
        gap: 7,
        opacity: dimmed ? 0.34 : 1,
        padding: 10,
        textAlign: "left",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
        <span style={{ color: risk ? t.warn : t.textStrong, fontSize: 12, fontWeight: 900, lineHeight: 1.3 }}>
          {pathway.from} → {pathway.to}
        </span>
        <PathwayEvidenceBadge level={pathway.evidenceLevel} t={t} compact interactive={false} />
      </div>
      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.35 }}>
        {pathway.module} · {pathway.routeGroup} · {pathway.edgeType}
      </div>
    </button>
  )
}

function EvidenceMatrix({ pathways, t, isMobile }) {
  const [expanded, setExpanded] = useState(false)
  const visiblePathways = expanded ? pathways : pathways.slice(0, 5)
  return (
    <div style={{ display: "grid", gap: 9 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: "0 7px", minWidth: isMobile ? 720 : "100%", width: "100%" }}>
          <thead>
            <tr style={{ color: t.faint, fontSize: 10.5, textAlign: "left", textTransform: "uppercase" }}>
              <th style={{ padding: "0 10px" }}>Pathway</th>
              <th style={{ padding: "0 10px" }}>Route group</th>
              <th style={{ padding: "0 10px" }}>Evidence</th>
              <th style={{ padding: "0 10px" }}>Status</th>
              <th style={{ padding: "0 10px" }}>Validation needed</th>
            </tr>
          </thead>
          <tbody>
            {visiblePathways.map(pathway => (
              <tr key={pathway.edgeId} style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
                <td style={{ background: t.surface, borderRadius: "7px 0 0 7px", color: t.textStrong, fontWeight: 850, padding: 10 }}>{pathway.from} → {pathway.to}</td>
                <td style={{ background: t.surface, padding: 10 }}>{pathway.routeGroup}</td>
                <td style={{ background: t.surface, padding: 10 }}><PathwayEvidenceBadge level={pathway.evidenceLevel} t={t} compact /></td>
                <td style={{ background: t.surface, padding: 10 }}>{pathway.status}</td>
                <td style={{ background: t.surface, borderRadius: "0 7px 7px 0", padding: 10 }}>{pathway.validationNeeded?.[0] || "pending validation"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pathways.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontSize: 11.5, fontWeight: 850, justifySelf: "start", padding: "7px 10px" }}
        >
          {expanded ? "Show fewer pathways" : "View all pathways"}
        </button>
      )}
    </div>
  )
}

export function PathwayNetwork({ t, lang, isMobile }) {
  const { status, nodes, pathways } = useReactionRationaleData()
  const [activeGroup, setActiveGroup] = useState("All")
  const [selected, setSelected] = useState(null)

  const activeLabels = useMemo(() => {
    const labels = new Set()
    pathways.forEach(pathway => {
      if (activeGroup === "All" || pathway.routeGroup === activeGroup) {
        labels.add(pathway.from)
        labels.add(pathway.to)
      }
    })
    return labels
  }, [activeGroup, pathways])
  const layers = useMemo(() => {
    const grouped = {
      "carbon-source": [],
      intermediate: [],
      product: [],
      byproduct: [],
      "carbon-loss": [],
    }
    nodes.forEach(node => {
      if (grouped[node.layer]) grouped[node.layer].push(node)
    })
    return grouped
  }, [nodes])

  if (status === "loading") {
    return <div style={{ color: t.faint, fontSize: 12, padding: 12 }}>Loading catalytic pathway network...</div>
  }
  if (status === "error") {
    return <div style={{ color: t.warn, fontSize: 12, padding: 12 }}>Catalytic pathway network data could not be loaded.</div>
  }

  const edgeList = (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 9, padding: 10 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Pathway cards</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        {pathways.map(pathway => {
          const active = selected?.kind === "pathway" && selected.pathway.edgeId === pathway.edgeId
          const dimmed = activeGroup !== "All" && pathway.routeGroup !== activeGroup
          return (
            <EdgeButton
              key={pathway.edgeId}
              pathway={pathway}
              active={active}
              dimmed={dimmed}
              onClick={() => setSelected({ kind: "pathway", pathway })}
              t={t}
            />
          )
        })}
      </div>
    </section>
  )

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <PathwayRouteTabs activeGroup={activeGroup} onChange={setActiveGroup} t={t} isMobile={isMobile} />

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
        <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>
          {activeGroup === "All" ? "Overview Network" : activeGroup}
        </div>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>
          {activeGroup === "All"
            ? "Candidate carbon-flow network for glucose / bicarbonate conversion to formate and competing risk routes."
            : ROUTE_GROUP_DESCRIPTIONS[activeGroup]}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.3fr) minmax(320px, 0.7fr)", gap: 12, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
          {!isMobile && (
          <div style={{ overflowX: "visible" }}>
            <div style={{ display: "grid", gridTemplateColumns: "0.78fr 1fr 1.05fr", gap: 10, minWidth: 0 }}>
              <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
                <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{LAYER_LABELS["carbon-source"]}</div>
                {layers["carbon-source"].map(node => (
                  <NetworkNode
                    key={node.id}
                    node={node}
                    active={selected?.kind === "node" && selected.node.id === node.id}
                    dimmed={activeGroup !== "All" && !activeLabels.has(node.label)}
                    onClick={() => setSelected({ kind: "node", node })}
                    t={t}
                  />
                ))}
              </section>

              <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
                <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{LAYER_LABELS.intermediate}</div>
                {layers.intermediate.map(node => (
                  <NetworkNode
                    key={node.id}
                    node={node}
                    active={selected?.kind === "node" && selected.node.id === node.id}
                    dimmed={activeGroup !== "All" && !activeLabels.has(node.label)}
                    onClick={() => setSelected({ kind: "node", node })}
                    t={t}
                  />
                ))}
              </section>

              <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
                <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Product / risk layer</div>
                {[...layers.product, ...layers.byproduct, ...layers["carbon-loss"]].map(node => (
                  <NetworkNode
                    key={node.id}
                    node={node}
                    active={selected?.kind === "node" && selected.node.id === node.id}
                    dimmed={activeGroup !== "All" && !activeLabels.has(node.label)}
                    onClick={() => setSelected({ kind: "node", node })}
                    t={t}
                  />
                ))}
              </section>
            </div>
          </div>
          )}

          {edgeList}
        </div>

        <PathwayDetailPanel selected={selected} t={t} lang={lang} />
      </div>

      <section style={{ display: "grid", gap: 9 }}>
        <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>Pathway Evidence Matrix</div>
        <EvidenceMatrix pathways={pathways} t={t} isMobile={isMobile} />
      </section>
    </div>
  )
}
