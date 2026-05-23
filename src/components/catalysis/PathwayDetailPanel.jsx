import { PathwayEvidenceBadge, getEvidenceInfo } from "./PathwayEvidenceBadge"

function SectionList({ title, rows, t }) {
  if (!rows?.length) return null
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={{ color: t.textStrong, fontSize: 11.5, fontWeight: 900 }}>{title}</div>
      <ul style={{ color: t.muted, display: "grid", fontSize: 11.5, gap: 4, lineHeight: 1.45, margin: 0, paddingLeft: 17 }}>
        {rows.map(row => <li key={row}>{row}</li>)}
      </ul>
    </div>
  )
}

export function PathwayDetailPanel({ selected, t, lang }) {
  if (!selected) {
    return (
      <aside style={{ background: t.surface, border: `1px dashed ${t.border}`, borderRadius: 8, color: t.faint, fontSize: 12, lineHeight: 1.6, padding: 13 }}>
        {lang === "zh" ? "点击节点或路径边查看证据等级、验证需求和不确定性。" : "Click a node or pathway edge to inspect evidence level, validation needs, and uncertainty."}
      </aside>
    )
  }

  if (selected.kind === "node") {
    return (
      <aside style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, padding: 13 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>Node detail</div>
        <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 900 }}>{selected.node.label}</div>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>{selected.node.description}</div>
        <div style={{ color: t.faint, fontSize: 11.5 }}>{selected.node.type} · {selected.node.layer}</div>
      </aside>
    )
  }

  const pathway = selected.pathway
  const evidence = getEvidenceInfo(pathway.evidenceLevel)
  return (
    <aside style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, minWidth: 0, padding: 13 }}>
      <div>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>
          {lang === "zh" ? "Pathway detail / 路径详情" : "Pathway detail"}
        </div>
        <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 920, lineHeight: 1.2, marginTop: 4 }}>
          {pathway.from} → {pathway.to}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 7 }}>
        {[
          ["Module", `${pathway.module} · ${pathway.edgeType}`],
          ["Route group", pathway.routeGroup],
          ["Status", pathway.status],
          ["Evidence", `Level ${pathway.evidenceLevel} — ${evidence.label}`],
        ].map(([label, value]) => (
          <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: 8, minWidth: 0 }}>
            <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
            <div style={{ color: t.textStrong, fontSize: 11.5, fontWeight: 820, lineHeight: 1.35, marginTop: 4, overflowWrap: "anywhere" }}>{value}</div>
          </div>
        ))}
      </div>
      <PathwayEvidenceBadge level={pathway.evidenceLevel} t={t} />
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
        <strong style={{ color: t.textStrong }}>{lang === "zh" ? "What this pathway means: " : "What this pathway means: "}</strong>
        {pathway.uncertainty}
      </div>
      <SectionList title="MOF factors" rows={pathway.mofFactors} t={t} />
      <SectionList title="Validation needed" rows={pathway.validationNeeded} t={t} />
      <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55 }}>
        {lang === "zh" ? "不确定性：" : "Uncertainty: "} {pathway.uncertainty}
      </div>
    </aside>
  )
}
