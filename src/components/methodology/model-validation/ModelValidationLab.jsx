// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { BasisBadge, FieldProvenanceButton } from "../../ui"
import { DataQualityAuditPanel } from "../../data-quality/DataQualityAuditPanel"
import { fetchDataJson } from "../../../services/dataService"
import { buildDataQualityAudit } from "../../../utils/dataQualityAudit"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export const MODEL_VALIDATION_DIRECTORY = {
  id: "methodology-model-validation",
  label: "Model Validation Lab",
  labelZh: "模型验证实验室",
  level: 1,
  display: "Model Validation Lab",
  children: [
    { id: "methodology-project-evolution-integration", label: "Project Evolution Integration", labelZh: "项目演化集成" },
    { id: "methodology-data-quality-model-readiness", label: "Data Quality -> Model Readiness", labelZh: "数据质量 -> 模型就绪度" },
    { id: "methodology-model-feature-pipeline", label: "Feature Engineering Pipeline", labelZh: "特征工程管线" },
    { id: "methodology-feature-selection-explorer", label: "Feature Selection Explorer", labelZh: "特征选择探索器" },
    { id: "methodology-model-comparison-dashboard", label: "Model Comparison Dashboard", labelZh: "模型比较面板" },
    { id: "methodology-explainability-trust-map", label: "Explainability & Trust Map", labelZh: "可解释性与信任地图" },
    { id: "methodology-validation-workflow", label: "Validation Workflow Workbench", labelZh: "验证流程工作台" },
    { id: "methodology-confidence-analysis", label: "Confidence & Uncertainty Analysis", labelZh: "置信度与不确定性" },
  ],
}

const FIELD_META = [
  { key: "surfaceArea", label: "Surface Area", labelZh: "比表面积", category: "Geometry" },
  { key: "poreVolume", label: "Pore Volume", labelZh: "孔体积", category: "Geometry" },
  { key: "density", label: "Density", labelZh: "密度", category: "Geometry" },
  { key: "voidFraction", label: "Void Fraction", labelZh: "空隙率", category: "Geometry" },
  { key: "bandGap", label: "Band Gap", labelZh: "带隙", category: "Electronic" },
  { key: "metalNode", label: "Metal Node", labelZh: "金属节点", category: "Metal" },
  { key: "linker", label: "Linker", labelZh: "连接体", category: "Ligand" },
  { key: "topology", label: "Topology", labelZh: "拓扑", category: "Framework" },
  { key: "evidenceLevel", label: "Evidence Level", labelZh: "证据等级", category: "Evidence" },
  { key: "sourceStatus", label: "Source Status", labelZh: "来源状态", category: "Metadata" },
  { key: "verifiedMetadataStatus", label: "Verified Metadata Status", labelZh: "已核验 metadata 状态", category: "Metadata" },
]

const METHODS = [
  ["CRITIC-MCDA", "Implemented", "Demo Only", "High", "Low", "High", "High", "High"],
  ["Evidence-adjusted CRITIC", "Implemented", "Demo Only", "High", "Medium", "High", "High", "High"],
  ["Logistic Regression", "Framework Ready", "Validation Pending", "Medium", "High", "Medium", "High", "Medium"],
  ["Decision Tree", "Framework Ready", "Validation Pending", "Medium", "High", "Medium", "Medium", "Medium"],
  ["Random Forest", "Framework Ready", "Validation Pending", "Medium", "High", "High", "High", "Medium"],
  ["Future External Validation", "Planned", "Validation Pending", "Medium", "High", "High", "Medium", "High"],
]

function fallbackSource(record, field) {
  return record?.fieldSources?.[field] || {
    value: record?.[field] ?? "unknown",
    sourceDatabase: record?.sourceDatabase || "pending",
    sourceRecordId: record?.sourceRecordId || "pending",
    sourceUrl: record?.sourceUrl || "pending",
    citation: record?.citation || "pending",
    license: record?.license || "pending",
    retrievedAt: record?.retrievedAt || "pending",
    curationStatus: "pending",
    confidence: 0,
    status: "missing",
    scoringEligible: false,
    blocksVerifiedMetadata: true,
    notes: "Fallback provenance placeholder.",
  }
}

function ProvenanceValue({ record, field, label, lang, t }) {
  const source = fallbackSource(record, field)
  return (
    <span style={{ alignItems: "center", display: "inline-flex", gap: 2, maxWidth: "100%", minWidth: 0 }}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{source.value ?? record?.[field] ?? "unknown"}</span>
      <FieldProvenanceButton fieldKey={field} fieldLabel={label} source={source} lang={lang} />
    </span>
  )
}

function Card({ id, title, subtitle, children, t, actions }) {
  return (
    <section id={id} data-testid={id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: 14, scrollMarginTop: 118 }}>
      <header style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          <h3 style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.18, margin: 0 }}>{title}</h3>
          {subtitle ? <p style={{ color: t.muted, fontSize: 12.4, lineHeight: 1.55, margin: 0 }}>{subtitle}</p> : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

function FeatureEngineeringPipeline({ records, lang, t, isMobile }) {
  const [active, setActive] = useState("descriptor")
  const record = records[0] || {}
  const steps = [
    { id: "raw", title: "Raw Database", titleZh: "原始数据库", input: records.length, output: records.length, missing: "0%" },
    { id: "descriptor", title: "Descriptor Extraction", titleZh: "描述符抽取", input: records.length, output: records.length, missing: "field-dependent" },
    { id: "reduction", title: "Feature Reduction", titleZh: "特征降维", input: FIELD_META.length, output: 6, missing: "pending labels" },
    { id: "factors", title: "Candidate Factors", titleZh: "候选因素", input: 6, output: 6, missing: "metadata gaps visible" },
    { id: "scoring", title: "Scoring", titleZh: "评分", input: 6, output: records.filter(row => Number(row.G) !== 0).length, missing: "not verified" },
    { id: "recommendation", title: "Recommendation", titleZh: "推荐", input: records.length, output: 0, missing: "blocked until validation" },
  ]
  const step = steps.find(item => item.id === active) || steps[0]
  return (
    <Card id="methodology-model-feature-pipeline" title={text(lang, "特征工程管线", "Feature Engineering Pipeline")} subtitle={text(lang, "原始数据库 -> 描述符抽取 -> 特征降维 -> 候选因素 -> 评分 -> 推荐边界。", "Raw Database -> Descriptor Extraction -> Feature Reduction -> Candidate Factors -> Scoring -> Recommendation.")} t={t}>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(6, minmax(0, 1fr))" }}>
        {steps.map((item, index) => (
          <button key={item.id} type="button" onClick={() => setActive(item.id)} style={{ background: active === item.id ? t.badgeInfoBg : t.surface, border: `1px solid ${active === item.id ? t.accent : t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", display: "grid", gap: 5, minHeight: 78, padding: 9, textAlign: "left" }}>
            <span style={{ color: t.accentText, fontSize: 11, fontWeight: 900 }}>{index + 1}</span>
            <strong style={{ fontSize: 12.2, lineHeight: 1.25 }}>{text(lang, item.titleZh, item.title)}</strong>
          </button>
        ))}
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 9, padding: 11 }}>
        <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, step.titleZh, step.title)}</strong>
        <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          {[
            [text(lang, "输入数量", "Input count"), step.input],
            [text(lang, "输出数量", "Output count"), step.output],
            [text(lang, "缺失比例", "Missing ratio"), step.missing],
          ].map(([label, value]) => (
            <span key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, fontSize: 12, fontWeight: 850, padding: 8 }}>{label}: {value}</span>
          ))}
        </div>
        <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {["surfaceArea", "poreVolume", "density", "bandGap"].map(field => {
            const meta = FIELD_META.find(item => item.key === field)
            return (
              <span key={field} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, display: "grid", fontSize: 11.5, gap: 4, minWidth: 0, padding: 8 }}>
                <strong style={{ color: t.textStrong }}>{text(lang, meta.labelZh, meta.label)}</strong>
                <ProvenanceValue record={record} field={field} label={text(lang, meta.labelZh, meta.label)} lang={lang} t={t} />
              </span>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function FeatureSelectionExplorer({ records, lang, t }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [sortKey, setSortKey] = useState("frequency")
  const record = records[0] || {}
  const rows = useMemo(() => FIELD_META.map((field, index) => {
    const sources = records.map(row => fallbackSource(row, field.key))
    const eligible = sources.filter(source => source.scoringEligible).length
    const confidence = sources.reduce((sum, source) => sum + (Number(source.confidence) || 0), 0) / Math.max(1, sources.length)
    return {
      ...field,
      frequency: Math.round((eligible / Math.max(1, records.length)) * 100),
      importance: Math.max(8, Math.round(82 - index * 5 + eligible / Math.max(1, records.length) * 12)),
      confidence: Math.round(confidence * 100),
      source: sources[0],
      inModel: ["surfaceArea", "poreVolume", "density", "bandGap", "metalNode", "sourceStatus"].includes(field.key),
    }
  }), [records])
  const visible = rows
    .filter(row => category === "All" || row.category === category)
    .filter(row => `${row.label} ${row.labelZh} ${row.key}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sortKey === "importance" ? b.importance - a.importance : b.frequency - a.frequency)
  const categories = ["All", "Geometry", "Electronic", "Framework", "Metal", "Ligand", "Evidence", "Metadata"]
  return (
    <Card id="methodology-feature-selection-explorer" title={text(lang, "特征选择探索器", "Feature Selection Explorer")} subtitle={text(lang, "展示选择频率、重要性、来源和置信度，并支持搜索、排序和类别过滤。", "Shows selection frequency, importance, source, and confidence with search, sorting, and category filters.")} t={t}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder={text(lang, "搜索 descriptor", "Search descriptor")} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, minHeight: 34, padding: "7px 9px" }} />
        <select value={category} onChange={event => setCategory(event.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, minHeight: 34, padding: "7px 9px" }}>{categories.map(item => <option key={item}>{item}</option>)}</select>
        <select value={sortKey} onChange={event => setSortKey(event.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, minHeight: 34, padding: "7px 9px" }}>
          <option value="frequency">Selection Frequency</option>
          <option value="importance">Importance</option>
        </select>
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        {visible.map(row => (
          <article key={row.key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 7, gridTemplateColumns: "minmax(120px, 1fr) minmax(160px, 1.2fr)", minWidth: 0, padding: 9 }}>
            <span style={{ display: "grid", gap: 4, minWidth: 0 }}>
              <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, row.labelZh, row.label)}</strong>
              <span style={{ color: t.faint, fontSize: 10.5 }}>{row.category} · {row.inModel ? "in model" : "not in model yet"}</span>
              <ProvenanceValue record={record} field={row.key} label={text(lang, row.labelZh, row.label)} lang={lang} t={t} />
            </span>
            <span style={{ display: "grid", gap: 5 }}>
              <span style={{ color: t.muted, fontSize: 11 }}>Selection Frequency {row.frequency}% · Importance {row.importance} · Confidence {row.confidence}%</span>
              <span style={{ background: t.panel, borderRadius: 999, height: 8, overflow: "hidden" }}><span style={{ background: t.accent, display: "block", height: "100%", width: `${row.frequency}%` }} /></span>
            </span>
          </article>
        ))}
      </div>
    </Card>
  )
}

function ModelComparisonDashboard({ lang, t }) {
  const columns = ["Interpretability", "Data Requirement", "Robustness", "Scalability", "Transparency", "Scientific Defensibility"]
  return (
    <Card id="methodology-model-comparison-dashboard" title={text(lang, "模型比较面板", "Model Comparison Dashboard")} subtitle={text(lang, "没有真实标签时，不显示正式模型精度指标；所有监督模型保持待验证 / 演示 / 框架就绪状态。", "Without real labels, formal predictive metrics are withheld; supervised models stay Validation Pending / Demo Only / Framework Ready.")} t={t}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <BasisBadge tone="warn">Validation Pending</BasisBadge>
        <BasisBadge tone="proxy">Demo Only</BasisBadge>
        <BasisBadge tone="info">Framework Ready</BasisBadge>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {[
          ["Accuracy", "pending"],
          ["ROC-AUC", "pending"],
          ["F1", "pending"],
          ["External Test", "pending"],
        ].map(([label, value]) => (
          <div key={label} style={{ background: t.badgeWarnBg || t.surface, border: `1px solid ${t.warn || t.border}`, borderRadius: 8, padding: 9 }}>
            <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <strong style={{ color: t.warn || t.textStrong, display: "block", fontSize: 14, marginTop: 5 }}>{label}: {value}</strong>
          </div>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: "0 7px", minWidth: 860, width: "100%" }}>
          <thead><tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}><th>Model</th><th>Status</th><th>Validation</th>{columns.map(col => <th key={col}>{col}</th>)}</tr></thead>
          <tbody>
            {METHODS.map(row => (
              <tr key={row[0]} style={{ color: t.muted, fontSize: 11.5 }}>
                {row.map((cell, index) => <td key={index} style={{ background: t.surface, borderTop: `1px solid ${t.border}`, color: index === 0 ? t.textStrong : t.muted, fontWeight: index === 0 ? 900 : 650, padding: 9 }}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function DataQualityModelReadiness({ records, audit, lang, t, isMobile }) {
  const summary = audit?.summary || {}
  const rows = [
    ["Data Quality -> Model Readiness", "Field quality scores and blocker counts decide whether a record can support model input claims.", "字段质量分和 blocker 决定记录是否能支撑模型输入声明。"],
    ["Field Coverage -> Feature Reliability", `Feature coverage ${Math.round((summary.descriptorCoverage || 0) * 100)}%.`, `特征覆盖率 ${Math.round((summary.descriptorCoverage || 0) * 100)}%。`],
    ["Provenance Completeness -> Confidence", `Provenance completeness ${Math.round((summary.provenanceCoverage || 0) * 100)}%.`, `来源完整度 ${Math.round((summary.provenanceCoverage || 0) * 100)}%。`],
    ["Verified Blockers -> Validation Limitations", `${summary.highRiskRecordCount || 0} high-risk records and ${summary.missingFieldCount || 0} missing field cells remain visible.`, `${summary.highRiskRecordCount || 0} 条高风险记录与 ${summary.missingFieldCount || 0} 个缺失字段单元仍可见。`],
  ]
  return (
    <Card
      id="methodology-data-quality-model-readiness"
      title={text(lang, "数据质量到模型就绪度", "Data Quality -> Model Readiness")}
      subtitle={text(lang, "把 field coverage、provenance completeness 和 verified blockers 映射成模型输入可靠性；没有真实标签时，模型性能指标保持 pending。", "Maps field coverage, provenance completeness, and verified blockers into model input reliability; without real labels, model performance metrics stay pending.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
        {[
          ["Feature coverage", `${Math.round((summary.descriptorCoverage || 0) * 100)}%`],
          ["Data readiness", `${Math.round((summary.provenanceCoverage || 0) * 100)}%`],
          ["Validation readiness", `${summary.verifiedMetadataCount || 0} verified metadata`],
          ["Model input reliability", `${Math.round((summary.recordQualityScore || 0) * 100)}%`],
        ].map(([label, value]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 9 }}>
            <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <strong style={{ color: label === "Validation readiness" ? t.warn : t.textStrong, display: "block", fontSize: 14, marginTop: 5 }}>{value}</strong>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        {rows.map(([label, bodyEn, bodyZh]) => (
          <article key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12 }}>{label}</strong>
            <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, bodyZh, bodyEn)}</span>
          </article>
        ))}
      </div>
    </Card>
  )
}

function ProjectEvolutionIntegrationCard({ evolution, summary, audit, lang, t, onNavigate, isMobile }) {
  const overview = evolution?.overview || {}
  const maturityRows = Array.isArray(evolution?.scientificEvolution) ? evolution.scientificEvolution : []
  const maturity = maturityRows
    .filter(row => row.version !== "Future")
    .reduce((max, row) => Math.max(max, Number(row.maturity) || 0), 0)
  const databaseSize = overview.databaseSize || summary?.totalCandidates || audit?.summary?.totalCandidates || 0
  const verifiedMetadataCount = overview.verifiedMetadataCount ?? summary?.verifiedMetadataCount ?? audit?.summary?.verifiedMetadataCount ?? 0

  return (
    <Card
      id="methodology-project-evolution-integration"
      title={text(lang, "项目演化集成", "Project Evolution Integration")}
      subtitle={text(lang, "版本历史、版本更新记录、关键里程碑与发展路线图已从方法论中解耦，统一进入项目演化。", "Version history, Release Notes, Milestones, and Roadmap are decoupled from methodology and centralized in Project Evolution Center.")}
      t={t}
      actions={
        <button type="button" onClick={() => onNavigate?.("projectEvolution")} style={{ background: t.surface, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 34, padding: "7px 10px" }}>
          {text(lang, "查看项目演化", "View Evolution Center")}
        </button>
      }
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        {[
          [text(lang, "最新版本", "Latest Version"), evolution?.currentVersion || "V2.4"],
          [text(lang, "科研成熟度", "Scientific Maturity"), `${maturity || "pending"}/100`],
          [text(lang, "数据库规模", "Database Size"), `${databaseSize} candidates`],
          [text(lang, "已核验元数据数量", "Verified Metadata Count"), verifiedMetadataCount],
        ].map(([label, value]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 9 }}>
            <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <strong style={{ color: label === "Verified Metadata Count" ? t.warn : t.textStrong, display: "block", fontSize: 14, marginTop: 5 }}>{value}</strong>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ExplainabilityTrustMap({ records, lang, t }) {
  const [active, setActive] = useState("Evidence-CRITIC")
  const record = records[0] || {}
  const points = [
    { id: "CRITIC", x: 82, y: 52, pros: "Transparent weights", cons: "No real-label validation", fields: ["surfaceArea", "poreVolume", "density"] },
    { id: "Evidence-CRITIC", x: 76, y: 62, pros: "Evidence-aware confidence", cons: "Still preview-only", fields: ["evidenceLevel", "sourceStatus", "verifiedMetadataStatus"] },
    { id: "LR", x: 65, y: 58, pros: "Simple supervised baseline", cons: "Needs labels", fields: ["surfaceArea", "bandGap"] },
    { id: "DT", x: 58, y: 55, pros: "Readable splits", cons: "Unstable on small data", fields: ["metalNode", "topology"] },
    { id: "RF", x: 38, y: 72, pros: "Robust nonlinear baseline", cons: "Less transparent", fields: ["surfaceArea", "density", "bandGap"] },
  ]
  const selected = points.find(point => point.id === active) || points[0]
  return (
    <Card id="methodology-explainability-trust-map" title={text(lang, "可解释性与信任地图", "Explainability & Trust Map")} subtitle={text(lang, "X 轴为可解释性，Y 轴为预测能力就绪度；当前仍是框架图，不是已验证性能图。", "X-axis is interpretability; Y-axis is predictive-power readiness. This is a framework map, not validated performance.")} t={t}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, height: 260, position: "relative" }}>
        <span style={{ bottom: 8, color: t.faint, fontSize: 10.5, left: "50%", position: "absolute", transform: "translateX(-50%)" }}>Interpretability</span>
        <span style={{ color: t.faint, fontSize: 10.5, left: 8, position: "absolute", top: "50%", transform: "rotate(-90deg) translateX(-50%)", transformOrigin: "left top" }}>Predictive Power</span>
        {points.map(point => (
          <button key={point.id} type="button" onClick={() => setActive(point.id)} style={{ background: active === point.id ? t.accent : t.badgeInfoBg, border: `1px solid ${active === point.id ? t.textStrong : t.border}`, borderRadius: 999, color: active === point.id ? "#fff" : t.accentText, cursor: "pointer", fontSize: 11, fontWeight: 900, left: `${point.x}%`, minHeight: 30, padding: "5px 8px", position: "absolute", top: `${100 - point.y}%`, transform: "translate(-50%, -50%)" }}>{point.id}</button>
        ))}
      </div>
      <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 7, padding: 10 }}>
        <strong style={{ color: t.textStrong }}>{selected.id}</strong>
        <span style={{ color: t.muted, fontSize: 12 }}>{selected.pros} · {selected.cons}</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {selected.fields.map(field => {
            const meta = FIELD_META.find(item => item.key === field) || { label: field, labelZh: field }
            return <ProvenanceValue key={field} record={record} field={field} label={text(lang, meta.labelZh, meta.label)} lang={lang} t={t} />
          })}
        </div>
      </article>
    </Card>
  )
}

function ValidationWorkflowWorkbench({ records = [], lang, t }) {
  const rows = [
    ["Raw Dataset", "Implemented", `${records.length || 1000}-record Database Preview loaded with field provenance.`],
    ["Feature Selection", "Implemented", "Frequency and confidence explorer is available."],
    ["Cross Validation", "Planned", "Requires stable target labels before execution."],
    ["Model Comparison", "Framework Ready", "Capability matrix is present without formal metrics."],
    ["External Validation", "Pending", "Requires external held-out labels."],
    ["Final Recommendation", "Blocked", "Blocked until verified metadata and external validation exist."],
  ]
  return (
    <Card id="methodology-validation-workflow" title={text(lang, "验证流程工作台", "Validation Workflow Workbench")} subtitle={text(lang, "原始数据集 -> 特征选择 -> 交叉验证 -> 模型比较 -> 外部验证 -> 最终推荐边界。", "Raw Dataset -> Feature Selection -> Cross Validation -> Model Comparison -> External Validation -> Final Recommendation.")} t={t}>
      <div style={{ display: "grid", gap: 8 }}>
        {rows.map(([step, status, detail], index) => (
          <details key={step} open={index < 2} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
            <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 12.5, fontWeight: 900 }}>{index + 1}. {step} <BasisBadge tone={status === "Blocked" ? "warn" : status === "Implemented" ? "calc" : "proxy"}>{status}</BasisBadge></summary>
            <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.5, margin: "8px 0 0" }}>{detail}</p>
          </details>
        ))}
      </div>
    </Card>
  )
}

function ConfidenceAnalysisPanel({ records, lang, t }) {
  const total = Math.max(1, records.length)
  const sourceConfirmed = records.filter(row => row.sourceConfirmed).length
  const verified = records.filter(row => row.verifiedMetadata).length
  const ambiguity = records.filter(row => row.quarantined || row.ambiguityWarnings?.length).length
  const missingFields = records.reduce((sum, row) => sum + Object.values(row.fieldSources || {}).filter(source => source.status === "missing").length, 0)
  const score = Math.max(0, Math.min(100, Math.round(42 + sourceConfirmed / total * 24 + verified / total * 20 - ambiguity / total * 12 - Math.min(18, missingFields / total))))
  const rows = [
    ["Data Completeness", `${Math.round((1 - Math.min(1, missingFields / (total * FIELD_META.length))) * 100)}%`],
    ["Evidence Confidence", "Preview C-level"],
    ["Source Confidence", `${Math.round(sourceConfirmed / total * 100)}%`],
    ["Verified Metadata", `${verified}/${total}`],
    ["Ambiguity Risk", `${ambiguity}/${total}`],
    ["Missing Field Impact", `${missingFields} field gaps`],
  ]
  return (
    <Card id="methodology-confidence-analysis" title={text(lang, "置信度与不确定性", "Confidence & Uncertainty Analysis")} subtitle={text(lang, "综合数据完整度、证据置信度、来源置信度、已核验元数据、歧义风险和缺失字段影响。", "Combines Data Completeness, Evidence Confidence, Source Confidence, Verified Metadata, Ambiguity Risk, and Missing Field Impact.")} t={t}>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 10, display: "grid", gap: 4, padding: 12 }}>
          <span style={{ color: t.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Overall Confidence Score</span>
          <strong style={{ color: t.accentText, fontSize: 28, lineHeight: 1 }}>{score} / 100</strong>
          <span style={{ color: t.muted, fontSize: 11.5 }}>{text(lang, "不是 100：缺少真实标签、外部验证、verified metadata 与若干字段。", "Not 100 because real labels, external validation, verified metadata, and several fields are missing.")}</span>
        </div>
        {rows.map(([label, value]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 10 }}>
            <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <strong style={{ color: label === "Verified Metadata" ? t.warn : t.textStrong, display: "block", fontSize: 15, marginTop: 5 }}>{value}</strong>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function ModelValidationLab({ records = [], summary = null, lang, t, isMobile, onNavigate }) {
  const rows = Array.isArray(records) && records.length ? records : []
  const audit = useMemo(() => buildDataQualityAudit(rows, { version: "V2.2-Scalable-Database-Preview" }), [rows])
  const [evolution, setEvolution] = useState(null)
  const nav = MODEL_VALIDATION_DIRECTORY.children

  useEffect(() => {
    let active = true
    fetchDataJson("version_evolution_records.json", null)
      .then(payload => { if (active) setEvolution(payload) })
      .catch(() => { if (active) setEvolution(null) })
    return () => { active = false }
  }, [])
  return (
    <section id="methodology-model-validation" data-testid="methodology-model-validation" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 14, minWidth: 0, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Model Validation Lab</span>
        <h2 style={{ color: t.textStrong, fontSize: 22, lineHeight: 1.15, margin: 0 }}>{text(lang, "模型验证实验室", "Model Validation Lab")}</h2>
        <p style={{ color: t.muted, fontSize: 12.8, lineHeight: 1.6, margin: 0, maxWidth: 980 }}>
          {text(lang, "从 Data -> Descriptor -> Feature Selection -> Validation -> Model Comparison -> Confidence -> Decision 建立可验证科研决策框架；当前没有真实标签，因此不报告正式模型精度或外部验证结果。", "Builds a verifiable research decision framework from Data -> Descriptor -> Feature Selection -> Validation -> Model Comparison -> Confidence -> Decision. Real labels are absent, so formal predictive metrics and external validation results are not reported.")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <BasisBadge tone="proxy">Database Preview</BasisBadge>
          <BasisBadge tone="warn">Not Final Recommendation</BasisBadge>
          <BasisBadge tone="warn">Validation Pending</BasisBadge>
          <BasisBadge tone="info">{rows.length || summary?.totalCandidates || 0} candidates</BasisBadge>
          <BasisBadge tone="calc">Verified Metadata Count {summary?.verifiedMetadataCount ?? audit.summary?.verifiedMetadataCount ?? 0}</BasisBadge>
        </div>
      </header>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: isMobile ? "1fr" : "190px minmax(0, 1fr)", alignItems: "start" }}>
        <nav style={{ display: isMobile ? "flex" : "grid", gap: 6, overflowX: isMobile ? "auto" : "visible", position: isMobile ? "static" : "sticky", top: 108 }}>
          {nav.map(item => <a key={item.id} href={`#${item.id}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, flex: "0 0 auto", fontSize: 11.5, fontWeight: 850, padding: "8px 9px", textDecoration: "none" }}>{text(lang, item.labelZh, item.label)}</a>)}
        </nav>
        <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
          <ProjectEvolutionIntegrationCard evolution={evolution} summary={summary} audit={audit} lang={lang} t={t} onNavigate={onNavigate} isMobile={isMobile} />
          <DataQualityModelReadiness records={rows} audit={audit} lang={lang} t={t} isMobile={isMobile} />
          <DataQualityAuditPanel records={rows} audit={audit} lang={lang} t={t} isMobile={isMobile} />
          <FeatureEngineeringPipeline records={rows} lang={lang} t={t} isMobile={isMobile} />
          <FeatureSelectionExplorer records={rows} lang={lang} t={t} />
          <ModelComparisonDashboard lang={lang} t={t} />
          <ExplainabilityTrustMap records={rows} lang={lang} t={t} />
          <ValidationWorkflowWorkbench records={rows} lang={lang} t={t} />
          <ConfidenceAnalysisPanel records={rows} lang={lang} t={t} />
        </div>
      </div>
    </section>
  )
}

export default ModelValidationLab
