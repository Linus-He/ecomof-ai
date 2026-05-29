// @ts-nocheck
import { SCIENTIFIC_TOKEN_FONT, organicAcidPalette as palette } from "./FormulaInline"
import { ChemicalText } from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const pct = value => `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`

function Tags({ values }) {
  if (!values?.length) return null
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {values.map(value => (
        <span key={value} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 999, color: palette.muted, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11.5, padding: "4px 7px" }}>
          <ChemicalText value={value} />
        </span>
      ))}
    </div>
  )
}

function LegacySelectedPanel({ selected, t, lang }) {
  if (!selected) {
    return (
      <aside style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, display: "grid", gap: 6, padding: 12 }}>
        <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "路径详情", "Pathway detail")}</strong>
        <span style={{ fontSize: 12, lineHeight: 1.5 }}>
          {text(lang, "选择节点或路径卡片查看证据等级、规则作用和验证缺口。", "Select a node or pathway card to inspect evidence level, rule role, and validation gaps.")}
        </span>
      </aside>
    )
  }
  const row = selected.kind === "node" ? selected.node : selected.pathway
  return (
    <aside style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, padding: 12 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
        {selected.kind === "node" ? text(lang, "节点详情", "Node detail") : text(lang, "路径详情", "Pathway detail")}
      </div>
      <strong style={{ color: t.textStrong, fontSize: 14, lineHeight: 1.3 }}>
        {selected.kind === "node" ? row.label : `${row.from} → ${row.to}`}
      </strong>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>
        {row.description || row.rationale || row.status || text(lang, "该条目用于解释路径证据与验证状态。", "This item explains pathway evidence and validation status.")}
      </div>
      {row.evidenceLevel ? <div style={{ color: t.accentText, fontSize: 12, fontWeight: 850 }}>{row.evidenceLevel}</div> : null}
      {row.validationGap ? <div style={{ color: t.warn, fontSize: 12, lineHeight: 1.45 }}>{row.validationGap}</div> : null}
    </aside>
  )
}

export function PathwayDetailPanel({ pathway, nodesById, edgesById, lang, selected, t }) {
  if (!pathway && selected !== undefined) return <LegacySelectedPanel selected={selected} t={t} lang={lang} />
  if (!pathway) return null
  const nodes = pathway.nodeSequence?.map(id => nodesById.get(id)).filter(Boolean) || []
  const bottleneck = edgesById.get(pathway.bottleneckEdge)
  return (
    <article style={{ display: "grid", gap: 12 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <div style={{ color: palette.accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "路径详情", "Pathway detail")}
        </div>
        <h3 style={{ color: palette.text, fontSize: 20, lineHeight: 1.15, margin: 0 }}>
          {text(lang, pathway.nameZh, pathway.name)}
        </h3>
      </header>
      <div style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55 }}>{text(lang, pathway.summaryZh, pathway.summary)}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {nodes.map((node, index) => (
          <span key={node.id} style={{ color: palette.text, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 12.5, fontWeight: 800 }}>
            {index > 0 ? " → " : ""}{text(lang, node.labelZh, node.label)}
          </span>
        ))}
      </div>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 9, padding: 9 }}>
          <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "路径分数", "Path score")}</span>
          <div style={{ color: palette.text, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 18, fontWeight: 900 }}>{pct(pathway.overallScore)}</div>
        </div>
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 9, padding: 9 }}>
          <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "置信度", "Confidence")}</span>
          <div style={{ color: palette.text, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 18, fontWeight: 900 }}>{pct(pathway.confidence)}</div>
        </div>
      </div>
      <div style={{ color: palette.muted, fontSize: 12.5 }}>
        <strong style={{ color: palette.text }}>{text(lang, "瓶颈边", "Bottleneck edge")}:</strong> {bottleneck ? text(lang, bottleneck.labelZh, bottleneck.label) : pathway.bottleneckEdge}
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "竞争分支", "Competing branches")}</strong>
        <Tags values={pathway.competingBranches} />
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "MOF 调控点", "MOF control points")}</strong>
        <Tags values={pathway.mofControlPoints} />
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "推荐验证", "Recommended validation")}</strong>
        <Tags values={pathway.recommendedValidation} />
      </div>
    </article>
  )
}
