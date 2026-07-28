// @ts-nocheck
import { EvidenceValidationLoop } from "./EvidenceValidationLoop"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const descriptorStates = [
  ["surfaceArea", "curated", "比表面积"],
  ["poreSizeA", "curated", "孔径"],
  ["poreVolume", "pending", "孔容"],
  ["co2Uptake", "curated", "CO₂ 吸附量"],
  ["bandGap", "review", "带隙"],
  ["waterStability", "curated", "水稳定性"],
  ["thermalStability", "review", "热稳定性"],
  ["toxicityConcern", "demo", "毒性关注"],
]

function SourceFlow({ lang, compact }) {
  const items = [
    ["CoRE", "CoRE"],
    ["FAIR-MOFs", "FAIR-MOFs"],
    ["CIF", "CIF"],
    [text(lang, "气体吸附", "Gas adsorption"), "Gas adsorption"],
  ]
  return (
    <div className="workflow-source-flow" data-compact={compact ? "true" : "false"}>
      {items.map(([label]) => <span key={label}>{label}</span>)}
      <b>{text(lang, "统一 MOF 记录", "Unified MOF Record")}</b>
    </div>
  )
}

function DescriptorChecklist({ lang, compact }) {
  return (
    <div className="workflow-descriptor-checklist" data-compact={compact ? "true" : "false"}>
      {descriptorStates.map(([key, state, zhLabel]) => (
        <span key={key} data-state={state}>
          <i />
          {compact ? "" : text(lang, zhLabel, key)}
        </span>
      ))}
      <strong>{text(lang, "完整度 6/8 · 2 项需复核", "Completeness 6/8 · 2 need review")}</strong>
    </div>
  )
}

function ScenarioChips({ lang }) {
  return (
    <div className="workflow-scenario-chips">
      {[
        ["GasSep", "CO₂/N₂"],
        ["Catalysis", "CO₂ route"],
        [text(lang, "有机酸", "Organic Acid"), "C1/C2"],
        ["LCA-LCC", text(lang, "边界", "boundary")],
      ].map(([label, meta]) => (
        <span key={label}>
          <strong>{label}</strong>
          <small>{meta}</small>
        </span>
      ))}
    </div>
  )
}

function WeightBars({ lang, compact }) {
  const rows = [
    [text(lang, "吸附量", "uptake"), 78],
    [text(lang, "选择性", "selectivity"), 66],
    [text(lang, "稳定性", "stability"), 54],
    [text(lang, "证据", "evidence"), 42],
  ]
  return (
    <div className="workflow-weight-bars">
      {rows.slice(0, compact ? 4 : rows.length).map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <i><b style={{ width: `${value}%` }} /></i>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}

function ExplanationPreview({ lang }) {
  return (
    <div className="workflow-explanation-preview">
      <header>
        <span>{text(lang, "解释卡片", "Explanation preview")}</span>
        <b>UiO-66</b>
      </header>
      <div>
        <strong>{text(lang, "优势", "Strengths")}</strong>
        <p>{text(lang, "水稳定性与 CO₂ 描述符较完整。", "Water stability and CO₂ descriptors are relatively complete.")}</p>
      </div>
      <div>
        <strong>{text(lang, "风险", "Risks")}</strong>
        <p>{text(lang, "孔体积和适用边界仍需复核。", "Pore volume and applicability boundary still need review.")}</p>
      </div>
    </div>
  )
}

export function WorkflowMiniVisual({ type, lang = "en", compact = false }) {
  if (type === "source-flow") return <SourceFlow lang={lang} compact={compact} />
  if (type === "descriptor-checklist") return <DescriptorChecklist lang={lang} compact={compact} />
  if (type === "scenario-chips") return <ScenarioChips lang={lang} />
  if (type === "weight-bars") return <WeightBars lang={lang} compact={compact} />
  if (type === "explanation-card") return <ExplanationPreview lang={lang} />
  if (type === "evidence-loop") return <EvidenceValidationLoop lang={lang} compact={compact} />
  return null
}
