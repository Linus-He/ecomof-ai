// @ts-nocheck
import { useMemo, useState } from "react"
import { BasisBadge, FieldProvenanceButton } from "../../ui"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export const MODEL_VALIDATION_DIRECTORY = {
  id: "methodology-model-validation",
  label: "Model Validation Lab",
  labelZh: "模型验证实验室",
  level: 1,
  display: "Model Validation Lab",
  children: [
    { id: "methodology-evolution-timeline", label: "Methodology Evolution Timeline", labelZh: "方法论版本演化" },
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

const VERSIONS = [
  {
    version: "V1.0",
    date: "2026-04",
    commit: "historical",
    summary: "Initial transparent MOF screening prototype.",
    summaryZh: "透明 MOF 筛选原型起点。",
    scientificImpact: "Established descriptor-first decision support.",
    uiImpact: "Module-level workflow pages.",
    dataImpact: "Demo and seed records only.",
    validationImpact: "Validation roadmap only.",
    knownLimitations: "No verified metadata gate.",
  },
  {
    version: "V1.5",
    date: "2026-05",
    commit: "historical",
    summary: "Organic Acid methodology and evidence workbench matured.",
    summaryZh: "有机酸方法论与证据工作台成型。",
    scientificImpact: "Separated hypothesis, evidence, and validation needs.",
    uiImpact: "Trace, evidence, and pathway panels.",
    dataImpact: "Curated small real examples.",
    validationImpact: "Manual validation roadmap.",
    knownLimitations: "No medium database preview.",
  },
  {
    version: "V2.0-K",
    date: "2026-06-03",
    commit: "v2_0_k",
    summary: "Evidence Backfill and first verified candidate report framework.",
    summaryZh: "证据回填与第一批 verified candidate report 框架。",
    scientificImpact: "Made evidence gaps auditable.",
    uiImpact: "Evidence backfill panel and report status.",
    dataImpact: "Manual evidence records enriched.",
    validationImpact: "verifiedMetadataCount stayed 0 under strict gate.",
    knownLimitations: "No verified candidates yet.",
  },
  {
    version: "V2.0-L",
    date: "2026-06-04",
    commit: "v2_0_l",
    summary: "Manual Source Curation, Source Confirmed Workflow, Citation Ready Tracking.",
    summaryZh: "人工来源核验、来源确认流程、Citation Ready 追踪。",
    scientificImpact: "Separated source_confirmed and citation_ready from verified_metadata.",
    uiImpact: "Manual curation progress and detail drawer evidence.",
    dataImpact: "First source_confirmed / citation_ready candidates.",
    validationImpact: "Ambiguity warnings still blocked verified metadata.",
    knownLimitations: "Offline DOI/license remained pending.",
  },
  {
    version: "V2.0-M",
    date: "2026-06-16",
    commit: "v2_0_m",
    summary: "Metadata Verification Gate, Screening Trace, Candidate Dashboard, Readiness Matrix.",
    summaryZh: "Metadata Verification Gate、筛选过程、候选决策面板、就绪度矩阵。",
    scientificImpact: "Strictly separated preview from verified screening.",
    uiImpact: "EcoScreen trace and dashboard added.",
    dataImpact: "V2.0-M verification records stayed bounded.",
    validationImpact: "source_confirmed / citation_ready / near_verified did not equal verified_metadata.",
    knownLimitations: "Mobile-dark visual shell needed stabilization.",
  },
  {
    version: "V2.1",
    date: "2026-06-16",
    commit: "pending-current",
    summary: "Model Validation Lab, Feature Selection Explorer, Model Comparison Dashboard, Confidence Analysis.",
    summaryZh: "模型验证实验室、特征选择探索器、模型比较面板、置信度分析。",
    scientificImpact: "Introduces a validation framework before any real-label metric claims.",
    uiImpact: "Independent Model Validation Lab workspace and methodology evolution timeline.",
    dataImpact: "250-record Database Preview with field-level provenance.",
    validationImpact: "Model comparison workflow is framework-ready; real-label metrics are withheld.",
    knownLimitations: "No real experimental labels or external validation yet.",
  },
  {
    version: "Future",
    date: "planned",
    commit: "planned",
    summary: "External labels, external test set, and paper-grade validation.",
    summaryZh: "真实标签、外部测试集与论文级验证。",
    scientificImpact: "Can support real external validation once labels exist.",
    uiImpact: "External validation report planned.",
    dataImpact: "Full database requires source/license/DOI confirmation.",
    validationImpact: "Real metrics only after verified labels.",
    knownLimitations: "Not implemented.",
  },
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

function MethodologyEvolutionTimeline({ lang, t }) {
  const [active, setActive] = useState("V2.1")
  const item = VERSIONS.find(row => row.version === active) || VERSIONS[0]
  return (
    <Card
      id="methodology-evolution-timeline"
      title={text(lang, "Methodology Evolution Timeline", "Methodology Evolution Timeline")}
      subtitle={text(lang, "每一轮更新同步写入方法论演化：科学影响、UI 影响、数据影响、验证影响与已知限制。", "Every update is synchronized into methodology evolution: scientific, UI, data, validation impact, and known limitations.")}
      t={t}
    >
      <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
        {VERSIONS.map(row => (
          <button key={row.version} type="button" onClick={() => setActive(row.version)} style={{ background: row.version === active ? t.badgeInfoBg : t.surface, border: `1px solid ${row.version === active ? t.accent : t.border}`, borderRadius: 8, color: row.version === active ? t.accentText : t.muted, cursor: "pointer", flex: "0 0 auto", fontSize: 11.5, fontWeight: 900, minHeight: 34, padding: "7px 10px" }}>
            {row.version}
          </button>
        ))}
      </div>
      <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 11 }}>
        <strong style={{ color: t.textStrong, fontSize: 15 }}>{item.version} · {item.date}</strong>
        <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}>{text(lang, item.summaryZh, item.summary)}</span>
        <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          {[
            ["Commit", item.commit],
            ["Scientific Impact", item.scientificImpact],
            ["UI Impact", item.uiImpact],
            ["Data Impact", item.dataImpact],
            ["Validation Impact", item.validationImpact],
            ["Known Limitations", item.knownLimitations],
          ].map(([label, value]) => (
            <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 8 }}>
              <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
              <span style={{ color: label === "Known Limitations" ? t.warn : t.textStrong, display: "block", fontSize: 11.4, lineHeight: 1.45, marginTop: 4 }}>{value}</span>
            </div>
          ))}
        </div>
      </article>
    </Card>
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
    <Card id="methodology-model-feature-pipeline" title={text(lang, "Feature Engineering Pipeline", "Feature Engineering Pipeline")} subtitle={text(lang, "Raw Database -> Descriptor Extraction -> Feature Reduction -> Candidate Factors -> Scoring -> Recommendation。", "Raw Database -> Descriptor Extraction -> Feature Reduction -> Candidate Factors -> Scoring -> Recommendation.")} t={t}>
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
    <Card id="methodology-feature-selection-explorer" title={text(lang, "Feature Selection Explorer", "Feature Selection Explorer")} subtitle={text(lang, "展示 selection frequency、importance、source、confidence，并支持搜索、排序和类别过滤。", "Shows selection frequency, importance, source, and confidence with search, sorting, and category filters.")} t={t}>
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
    <Card id="methodology-model-comparison-dashboard" title={text(lang, "Model Comparison Dashboard", "Model Comparison Dashboard")} subtitle={text(lang, "没有真实标签时，不显示正式模型精度指标；所有监督模型保持 Validation Pending / Demo Only / Framework Ready。", "Without real labels, formal predictive metrics are withheld; supervised models stay Validation Pending / Demo Only / Framework Ready.")} t={t}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <BasisBadge tone="warn">Validation Pending</BasisBadge>
        <BasisBadge tone="proxy">Demo Only</BasisBadge>
        <BasisBadge tone="info">Framework Ready</BasisBadge>
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
    <Card id="methodology-explainability-trust-map" title={text(lang, "Explainability & Trust Map", "Explainability & Trust Map")} subtitle={text(lang, "X 轴为 interpretability，Y 轴为 predictive power readiness；当前仍是框架图，不是已验证性能图。", "X-axis is interpretability; Y-axis is predictive-power readiness. This is a framework map, not validated performance.")} t={t}>
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

function ValidationWorkflowWorkbench({ lang, t }) {
  const rows = [
    ["Raw Dataset", "Implemented", "250-record Database Preview loaded with field provenance."],
    ["Feature Selection", "Implemented", "Frequency and confidence explorer is available."],
    ["Cross Validation", "Planned", "Requires stable target labels before execution."],
    ["Model Comparison", "Framework Ready", "Capability matrix is present without formal metrics."],
    ["External Validation", "Pending", "Requires external held-out labels."],
    ["Final Recommendation", "Blocked", "Blocked until verified metadata and external validation exist."],
  ]
  return (
    <Card id="methodology-validation-workflow" title={text(lang, "Validation Workflow Workbench", "Validation Workflow Workbench")} subtitle="Raw Dataset -> Feature Selection -> Cross Validation -> Model Comparison -> External Validation -> Final Recommendation." t={t}>
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
    <Card id="methodology-confidence-analysis" title={text(lang, "Confidence & Uncertainty Analysis", "Confidence & Uncertainty Analysis")} subtitle={text(lang, "综合 Data Completeness、Evidence Confidence、Source Confidence、Verified Metadata、Ambiguity Risk 和 Missing Field Impact。", "Combines Data Completeness, Evidence Confidence, Source Confidence, Verified Metadata, Ambiguity Risk, and Missing Field Impact.")} t={t}>
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

export function ModelValidationLab({ records = [], summary = null, lang, t, isMobile }) {
  const rows = Array.isArray(records) && records.length ? records : []
  const nav = MODEL_VALIDATION_DIRECTORY.children
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
        </div>
      </header>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: isMobile ? "1fr" : "190px minmax(0, 1fr)", alignItems: "start" }}>
        <nav style={{ display: isMobile ? "flex" : "grid", gap: 6, overflowX: isMobile ? "auto" : "visible", position: isMobile ? "static" : "sticky", top: 108 }}>
          {nav.map(item => <a key={item.id} href={`#${item.id}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, flex: "0 0 auto", fontSize: 11.5, fontWeight: 850, padding: "8px 9px", textDecoration: "none" }}>{text(lang, item.labelZh, item.label)}</a>)}
        </nav>
        <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
          <MethodologyEvolutionTimeline lang={lang} t={t} />
          <FeatureEngineeringPipeline records={rows} lang={lang} t={t} isMobile={isMobile} />
          <FeatureSelectionExplorer records={rows} lang={lang} t={t} />
          <ModelComparisonDashboard lang={lang} t={t} />
          <ExplainabilityTrustMap records={rows} lang={lang} t={t} />
          <ValidationWorkflowWorkbench lang={lang} t={t} />
          <ConfidenceAnalysisPanel records={rows} lang={lang} t={t} />
        </div>
      </div>
    </section>
  )
}

export default ModelValidationLab
