import { SCIENTIFIC_TOKEN_FONT, organicAcidPalette as palette } from "./FormulaInline"
import { ChemicalText } from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function Field({ label, children }) {
  if (!children || (Array.isArray(children) && !children.length)) return null
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <div style={{ color: palette.text, fontSize: 12.5, lineHeight: 1.5 }}>{children}</div>
    </div>
  )
}

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

export function GraphNodeDetailPanel({ node, lang }) {
  if (!node) return null
  return (
    <article style={{ display: "grid", gap: 12 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <div style={{ color: palette.accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "节点详情", "Node detail")}
        </div>
        <h3 style={{ color: palette.text, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 22, lineHeight: 1.1, margin: 0 }}>
          <ChemicalText value={text(lang, node.labelZh, node.label)} />
        </h3>
      </header>
      <Field label={text(lang, "节点类型", "Node type")}>{node.category}</Field>
      <Field label={text(lang, "碳数", "Carbon number")}>{node.carbonNumber ?? "n/a"}</Field>
      <Field label={text(lang, "网络角色", "Network role")}>{text(lang, node.roleZh, node.role)}</Field>
      <Field label={text(lang, "说明", "Description")}>{text(lang, node.descriptionZh, node.description)}</Field>
      <Field label={text(lang, "可能来源", "Possible sources")}><Tags values={node.possibleSources} /></Field>
      <Field label={text(lang, "可能流向", "Possible targets")}><Tags values={node.possibleTargets} /></Field>
      <Field label={text(lang, "相关路径", "Related pathways")}><Tags values={node.relatedPathways} /></Field>
      <Field label={text(lang, "当前证据等级", "Evidence level")}>{node.evidenceLevel}</Field>
      <Field label={text(lang, "主要不确定性", "Uncertainty")}>
        {(lang === "zh" ? node.risksZh || node.risks : node.risks || node.risksZh)?.map(item => <div key={item}>- {item}</div>)}
      </Field>
      <Field label={text(lang, "推荐验证实验", "Recommended validation")}><Tags values={node.validationMethods} /></Field>
      <Field label={text(lang, "相关 MOF 调控因子", "MOF regulation factors")}><Tags values={node.mofRelatedDescriptors} /></Field>
    </article>
  )
}
