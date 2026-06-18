// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { BasisBadge, FieldProvenanceButton } from "../../ui"
import {
  BENCHMARK_METRICS,
  BENCHMARK_MODES,
  BENCHMARK_ROADMAP_STEPS,
  CATEGORY_COLORS,
  DESCRIPTOR_CATEGORIES,
  FEATURE_SELECTION_WORKFLOW,
  FUTURE_METRIC_MODELS,
  MODEL_COMPARISON_ROWS,
  benchmarkSource,
  buildBenchmarkReadiness,
  buildCandidateStabilityRows,
  buildDescriptorRanking,
  metricValueForModel,
  topCandidateReviewRows,
} from "../../../utils/modelBenchmarkLab"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const pct = value => Number.isFinite(Number(value)) ? `${Math.round(Number(value) * 100)}%` : String(value ?? "pending")
const score = value => Number.isFinite(Number(value)) ? Number(value).toFixed(3) : String(value ?? "pending")

export const MODEL_BENCHMARK_DIRECTORY = {
  id: "methodology-model-benchmark",
  label: "Model Benchmark Lab",
  labelZh: "模型基准测试实验室",
  level: 1,
  display: "模型基准测试实验室",
  children: [
    { id: "methodology-model-benchmark-overview", label: "Benchmark Overview", labelZh: "基准测试总览" },
    { id: "methodology-model-benchmark-workflow", label: "Feature Selection Explorer", labelZh: "特征筛选分析" },
    { id: "methodology-model-benchmark-descriptors", label: "Descriptor Importance Ranking", labelZh: "描述符重要性排序" },
    { id: "methodology-model-benchmark-readiness", label: "Benchmark Readiness", labelZh: "基准测试就绪度" },
    { id: "methodology-model-benchmark-comparison", label: "Model Comparison", labelZh: "模型比较" },
    { id: "methodology-model-benchmark-future-accuracy", label: "Future Accuracy", labelZh: "未来精度验证" },
    { id: "methodology-model-benchmark-future-roc", label: "Future ROC-AUC", labelZh: "未来 ROC-AUC 验证" },
    { id: "methodology-model-benchmark-roadmap", label: "Benchmark Roadmap", labelZh: "基准测试路线图" },
    { id: "methodology-model-benchmark-candidates", label: "Top Candidate Review", labelZh: "候选深度分析" },
  ],
}

function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initialValue
    const stored = window.localStorage?.getItem(key)
    return stored || initialValue
  })
  useEffect(() => {
    if (typeof window === "undefined") return undefined
    window.localStorage?.setItem(key, value)
    return undefined
  }, [key, value])
  return [value, setValue]
}

function Card({ id, testId, title, subtitle, t, children, actions }) {
  return (
    <section id={id} data-testid={testId || id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: 14, scrollMarginTop: 118 }}>
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

function MiniMetric({ label, value, t, tone = "default" }) {
  const color = tone === "warn" ? t.warn : tone === "pass" ? (t.success || t.accentText) : t.textStrong
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 9 }}>
      <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color, display: "block", fontSize: 15, lineHeight: 1.18, marginTop: 5, overflowWrap: "anywhere" }}>{value}</strong>
    </div>
  )
}

function ProvenanceChip({ field, label, lang, t, source }) {
  const sourceRow = source || benchmarkSource(field, { value: label || field })
  return (
    <span style={{ alignItems: "center", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, color: t.muted, display: "inline-flex", fontSize: 11, fontWeight: 850, minHeight: 24, padding: "4px 7px" }}>
      {label || field}
      <FieldProvenanceButton fieldKey={field} fieldLabel={label || field} source={sourceRow} lang={lang} />
    </span>
  )
}

function BenchmarkOverviewPanel({ readiness, lang, t, isMobile }) {
  const rows = [
    [text(lang, "当前阶段", "Current Stage"), readiness.currentStage, "pass"],
    [text(lang, "机器学习就绪", "Machine Learning Ready"), readiness.machineLearningReady, "warn"],
    [text(lang, "实验标签", "Experimental Labels"), readiness.experimentalLabels, "warn"],
    [text(lang, "基准状态", "Benchmark Status"), readiness.benchmarkStatus, "pass"],
    [text(lang, "验证状态", "Validation Status"), readiness.validationStatus, "warn"],
    [text(lang, "数据集规模", "Dataset Size"), readiness.datasetSize, "default"],
    [text(lang, "已核验 metadata", "Verified Metadata Count"), readiness.verifiedMetadataCount, "pass"],
    [text(lang, "字段级溯源覆盖率", "Field Provenance Coverage"), pct(readiness.fieldProvenanceCoverage), "pass"],
    [text(lang, "数据质量分", "Data Quality Score"), pct(readiness.dataQualityScore), "default"],
  ]
  return (
    <Card
      id="methodology-model-benchmark-overview"
      testId="benchmark-overview-panel"
      title={text(lang, "基准测试总览 / Benchmark Overview", "Benchmark Overview")}
      subtitle={text(lang, "当前是基准框架就绪，不是机器学习结果就绪；Accuracy / ROC-AUC 保持 pending。", "The benchmark framework is ready, but machine-learning results are not; Accuracy and ROC-AUC stay pending.")}
      t={t}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <BasisBadge tone="info">Benchmark Framework Ready</BasisBadge>
        <BasisBadge tone="warn">Experimental Validation Pending</BasisBadge>
        <BasisBadge tone="warn">No fake Accuracy</BasisBadge>
        <BasisBadge tone="warn">No fake ROC-AUC</BasisBadge>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))" }}>
        {rows.map(([label, value, tone]) => <MiniMetric key={label} label={label} value={value} tone={tone} t={t} />)}
      </div>
    </Card>
  )
}

function InteractiveBenchmarkWorkflow({ selectedFeature, setSelectedFeature, lang, t, isMobile }) {
  const selected = FEATURE_SELECTION_WORKFLOW.find(row => row.id === selectedFeature) || FEATURE_SELECTION_WORKFLOW[0]
  return (
    <Card
      id="methodology-model-benchmark-workflow"
      testId="interactive-benchmark-workflow"
      title={text(lang, "交互式模型基准工作台：特征筛选流程", "Interactive Model Benchmark Workbench: Feature Selection Workflow")}
      subtitle={text(lang, "参考 Su et al. Figure 3a 的流程思想，但每个节点可点击并显示状态、删除原因、字段级溯源和下一步数据需求。", "Inspired by the Figure 3a workflow idea, but every node is clickable and shows status, deletion reasons, field provenance, and next data needs.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(6, minmax(0, 1fr))" }}>
        {FEATURE_SELECTION_WORKFLOW.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setSelectedFeature(step.id)}
            style={{ background: selected.id === step.id ? t.badgeInfoBg : t.surface, border: `1px solid ${selected.id === step.id ? t.accent : t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", display: "grid", gap: 5, minHeight: 86, minWidth: 0, padding: 9, textAlign: "left" }}
          >
            <span style={{ color: t.accentText, fontSize: 11, fontWeight: 900 }}>{index + 1}</span>
            <strong style={{ fontSize: 12.1, lineHeight: 1.25 }}>{text(lang, step.titleZh, step.title)}</strong>
            <span style={{ color: step.pending ? t.warn : t.muted, fontSize: 10.8 }}>{step.currentStatus}</span>
          </button>
        ))}
      </div>
      <article data-testid="benchmark-workflow-detail" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 10, padding: 11 }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, selected.titleZh, selected.title)}</strong>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
          <MiniMetric label={text(lang, "输入特征数", "Input features")} value={selected.inputFeatureCount} t={t} />
          <MiniMetric label={text(lang, "输出特征数", "Output features")} value={selected.outputFeatureCount} t={t} />
          <MiniMetric label={text(lang, "当前状态", "Current status")} value={selected.currentStatus} t={t} tone={selected.pending ? "warn" : "pass"} />
          <MiniMetric label={text(lang, "是否已实现 / pending", "Implemented / pending")} value={`${selected.implemented ? "implemented" : "not implemented"} / ${selected.pending ? "pending" : "ready"}`} t={t} tone={selected.pending ? "warn" : "pass"} />
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, display: "grid", fontSize: 12, gap: 7, lineHeight: 1.5, padding: 9 }}>
          <span><strong style={{ color: t.textStrong }}>{text(lang, "删除原因", "Deletion reasons")}:</strong> {selected.deletedReasons.join("；")}</span>
          <span><strong style={{ color: t.textStrong }}>{text(lang, "下一步需要什么数据", "Next required data")}:</strong> {text(lang, selected.nextData, selected.nextDataEn)}</span>
          <span><strong style={{ color: t.textStrong }}>{text(lang, "字段级溯源", "Field provenance")}:</strong></span>
          <span style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {selected.fieldKeys.map(field => <ProvenanceChip key={field} field={field} label={field} lang={lang} t={t} />)}
          </span>
        </div>
      </article>
    </Card>
  )
}

function DescriptorImportanceRanking({ selectedDescriptor, setSelectedDescriptor, lang, t, isMobile }) {
  const [category, setCategory] = useState("All")
  const [sort, setSort] = useState("importance")
  const [limit, setLimit] = useState("Top 10")
  const [mode, setMode] = useState("critic")
  const [hovered, setHovered] = useState("")
  const rows = useMemo(() => buildDescriptorRanking({ mode, category, sort, limit }), [category, limit, mode, sort])
  const selected = rows.find(row => row.key === selectedDescriptor) || rows.find(row => row.key === hovered) || rows[0]
  const max = Math.max(0.01, ...rows.map(row => row.activeImportance || 0.01))
  const modeLabels = [
    ["critic", "CRITIC importance"],
    ["evidence", "Evidence adjusted importance"],
    ["organic", "Organic Acid relevance"],
    ["quality", "Data quality impact"],
  ]
  return (
    <Card
      id="methodology-model-benchmark-descriptors"
      testId="descriptor-importance-ranking"
      title={text(lang, "描述符重要性排序 / Descriptor Importance Ranking", "Descriptor Importance Ranking")}
      subtitle={text(lang, "支持 hover 解释、点击字段级溯源、按类别过滤、排序和模式切换。", "Supports hover explanation, click provenance, category filter, sorting, and mode switching.")}
      t={t}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <select aria-label="filter by category" value={category} onChange={event => setCategory(event.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, minHeight: 34, padding: "7px 9px" }}>
          {["All", ...DESCRIPTOR_CATEGORIES].map(item => <option key={item}>{item}</option>)}
        </select>
        <select aria-label="sort by importance" value={sort} onChange={event => setSort(event.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, minHeight: 34, padding: "7px 9px" }}>
          <option value="importance">sort by importance</option>
          <option value="coverage">sort by coverage</option>
          <option value="category">sort by category</option>
        </select>
        <select aria-label="show descriptor count" value={limit} onChange={event => setLimit(event.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, minHeight: 34, padding: "7px 9px" }}>
          <option>Top 10</option>
          <option>Top 20</option>
          <option>All</option>
        </select>
        {modeLabels.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setMode(id)} style={{ background: mode === id ? t.badgeInfoBg : t.surface, border: `1px solid ${mode === id ? t.accent : t.border}`, borderRadius: 7, color: mode === id ? t.accentText : t.muted, cursor: "pointer", fontSize: 12, fontWeight: 850, minHeight: 34, padding: "7px 9px" }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(260px, 0.8fr)" }}>
        <div style={{ display: "grid", gap: 7, minWidth: 0, overflowX: "auto" }}>
          {rows.map(row => (
            <button
              key={row.key}
              type="button"
              title={text(lang, row.explanationZh, row.explanation)}
              onMouseEnter={() => setHovered(row.key)}
              onFocus={() => setHovered(row.key)}
              onClick={() => setSelectedDescriptor(row.key)}
              style={{ background: selected?.key === row.key ? t.badgeInfoBg : t.surface, border: `1px solid ${selected?.key === row.key ? t.accent : t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", display: "grid", gap: 5, minWidth: 0, padding: 9, textAlign: "left" }}
            >
              <span style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", minWidth: 0 }}>
                <strong style={{ fontSize: 12.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text(lang, row.labelZh, row.label)}</strong>
                <span style={{ color: CATEGORY_COLORS[row.category] || t.accentText, fontSize: 10.5, fontWeight: 900 }}>{row.category}</span>
              </span>
              <span style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, height: 10, overflow: "hidden" }}>
                <span style={{ background: CATEGORY_COLORS[row.category] || t.accent, display: "block", height: "100%", width: `${Math.round(row.activeImportance / max * 100)}%` }} />
              </span>
              <span style={{ color: t.muted, fontSize: 11 }}>{score(row.activeImportance)} · coverage {pct(row.coverage)} · frequency {pct(row.frequency)}</span>
            </button>
          ))}
        </div>
        {selected ? (
          <article data-testid="descriptor-provenance-panel" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, minWidth: 0, padding: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 13.2 }}>{text(lang, selected.labelZh, selected.label)}</strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}>{text(lang, selected.explanationZh, selected.explanation)}</span>
            <MiniMetric label={text(lang, "字段级溯源", "Field provenance")} value={`${selected.source.sourceDatabase} / ${selected.source.status}`} t={t} />
            <MiniMetric label={text(lang, "数据覆盖率", "Source coverage")} value={pct(selected.coverage)} t={t} />
            <MiniMetric label={text(lang, "影响原因", "Impact reason")} value={modeLabels.find(row => row[0] === mode)?.[1] || "importance"} t={t} />
            <MiniMetric label={text(lang, "质量状态", "Quality status")} value={selected.coverage >= 0.75 ? "ready" : "needs review"} t={t} tone={selected.coverage >= 0.75 ? "pass" : "warn"} />
            <ProvenanceChip field={selected.key} label={selected.label} lang={lang} t={t} source={selected.source} />
          </article>
        ) : null}
      </div>
    </Card>
  )
}

function BenchmarkReadinessPanel({ readiness, lang, t, isMobile }) {
  const dimensions = [
    ["Dataset Size", readiness.datasetSize >= 24 ? "Partially Ready" : "Not Ready"],
    ["Label Availability", readiness.experimentalLabels > 0 ? "Partially Ready" : "Not Ready"],
    ["Descriptor Coverage", pct(readiness.descriptorCoverage)],
    ["Verified Metadata", readiness.verifiedMetadataCount],
    ["Data Quality", pct(readiness.dataQualityScore)],
    ["Experimental Validation", "Not Ready"],
  ]
  return (
    <Card id="methodology-model-benchmark-readiness" testId="benchmark-readiness-panel" title={text(lang, "基准测试就绪度 / Benchmark Readiness", "Benchmark Readiness")} subtitle={text(lang, "核心问题：当前是否具备训练机器学习模型条件？答案是 Not Ready，因为 Label Count = 0。", "Core question: are we ready to train ML models? Not Ready because Label Count = 0.")} t={t}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))" }}>
        {dimensions.map(([label, value]) => (
          <MiniMetric key={label} label={label} value={value} t={t} tone={String(value).includes("Not Ready") ? "warn" : "default"} />
        ))}
      </div>
      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.warn, fontSize: 12.4, fontWeight: 900, lineHeight: 1.5, padding: 10 }}>
        {"Label Count = 0 -> Not Ready · Experimental Labels Missing"}
      </div>
    </Card>
  )
}

function ModelComparisonDashboard({ selectedModel, setSelectedModel, selectedMetric, setSelectedMetric, readiness, lang, t }) {
  const selected = MODEL_COMPARISON_ROWS.find(row => row.id === selectedModel) || MODEL_COMPARISON_ROWS[0]
  return (
    <Card id="methodology-model-benchmark-comparison" testId="model-comparison-dashboard-v27" title={text(lang, "模型比较 / Model Comparison", "Model Comparison")} subtitle={text(lang, "切换指标时，Future Accuracy / ROC-AUC 只显示 Pending，不显示虚假数值。", "When metric switches to Future Accuracy / ROC-AUC, values stay Pending; no fake numbers are shown.")} t={t}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {BENCHMARK_METRICS.map(metric => (
          <button key={metric} type="button" onClick={() => setSelectedMetric(metric)} style={{ background: selectedMetric === metric ? t.badgeInfoBg : t.surface, border: `1px solid ${selectedMetric === metric ? t.accent : t.border}`, borderRadius: 7, color: selectedMetric === metric ? t.accentText : t.muted, cursor: "pointer", fontSize: 12, fontWeight: 850, minHeight: 34, padding: "7px 9px" }}>
            {metric}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {MODEL_COMPARISON_ROWS.map(model => {
          const metric = metricValueForModel(model, selectedMetric, { labelCount: readiness.experimentalLabels })
          const active = model.id === selected.id
          return (
            <button key={model.id} type="button" onClick={() => setSelectedModel(model.id)} style={{ background: active ? t.badgeInfoBg : t.surface, border: `1px solid ${active ? t.accent : t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", display: "grid", gap: 5, gridTemplateColumns: "minmax(150px, 0.35fr) minmax(0, 0.65fr)", padding: 9, textAlign: "left" }}>
              <strong style={{ fontSize: 12.5 }}>{model.label}</strong>
              <span style={{ color: metric.pending ? t.warn : t.muted, fontSize: 12, lineHeight: 1.4 }}>{selectedMetric}: {metric.value}{metric.explanation ? ` · ${text(lang, metric.explanationZh, metric.explanation)}` : ""}</span>
            </button>
          )
        })}
      </div>
      <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, display: "grid", fontSize: 12, gap: 6, lineHeight: 1.5, padding: 10 }}>
        <strong style={{ color: t.textStrong }}>{selected.label}</strong>
        <span>{selected.type} · {selected.scientificUsefulness}</span>
        <span style={{ color: t.warn }}>Accuracy / ROC-AUC: Pending · Experimental labels required</span>
      </article>
    </Card>
  )
}

function FutureMetricPanel({ id, testId, title, subtitle, metricLabel, selectedModel, setSelectedModel, lang, t, isMobile }) {
  const selected = FUTURE_METRIC_MODELS.find(row => row.id === selectedModel) || FUTURE_METRIC_MODELS[0]
  return (
    <Card id={id} testId={testId} title={title} subtitle={subtitle} t={t}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))" }}>
        {FUTURE_METRIC_MODELS.map(model => (
          <button key={model.id} type="button" onClick={() => setSelectedModel(model.id)} style={{ background: selected.id === model.id ? t.badgeWarnBg : t.surface, border: `1px solid ${selected.id === model.id ? t.warn : t.border}`, borderRadius: 8, color: selected.id === model.id ? t.warn : t.textStrong, cursor: "pointer", display: "grid", gap: 5, minHeight: 74, padding: 9, textAlign: "left" }}>
            <strong style={{ fontSize: 14 }}>{model.label}</strong>
            <span style={{ color: t.warn, fontSize: 11.5 }}>{metricLabel}: Pending</span>
          </button>
        ))}
      </div>
      <article data-testid={`${testId}-detail`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 7, padding: 10 }}>
        <strong style={{ color: t.textStrong }}>{selected.labelLong}</strong>
        <div style={{ display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
          <MiniMetric label={text(lang, "需要多少标签", "Labels required")} value={selected.labelsRequired} t={t} />
          <MiniMetric label={text(lang, "当前阻断原因", "Current blocker")} value={selected.blocker} t={t} tone="warn" />
          <MiniMetric label={text(lang, "是否可 LOO-CV / external test", "LOO-CV / external test")} value={`${selected.looCv ? "yes" : "no"} / ${selected.externalTest ? "yes" : "no"}`} t={t} tone="warn" />
        </div>
        <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}><strong style={{ color: t.textStrong }}>{text(lang, "需要哪些实验数据", "Experimental data required")}:</strong> {selected.experimentalData}</span>
        <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}><strong style={{ color: t.textStrong }}>{text(lang, "未来验证方式", "Future validation")}:</strong> {selected.validationPlan}</span>
      </article>
    </Card>
  )
}

function BenchmarkRoadmap({ lang, t }) {
  return (
    <Card id="methodology-model-benchmark-roadmap" testId="benchmark-roadmap" title={text(lang, "基准测试路线图 / Benchmark Roadmap", "Benchmark Roadmap")} subtitle={text(lang, "Current Framework -> Experimental Dataset -> Label Collection -> Cross Validation -> Model Benchmark -> External Test -> Publication。", "Current Framework -> Experimental Dataset -> Label Collection -> Cross Validation -> Model Benchmark -> External Test -> Publication.")} t={t}>
      <div style={{ display: "grid", gap: 8 }}>
        {BENCHMARK_ROADMAP_STEPS.map((step, index) => (
          <article key={step.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{index + 1}. {step.title}</strong>
            <span style={{ color: step.status === "ready" ? t.success || t.accentText : t.warn, fontSize: 11.5, fontWeight: 900 }}>{step.status}</span>
            <span style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.45 }}>{step.detail}</span>
          </article>
        ))}
      </div>
    </Card>
  )
}

function TopCandidateReview({ algorithm, selectedCandidate, setSelectedCandidate, selectedBenchmarkMode, setSelectedBenchmarkMode, lang, t, isMobile }) {
  const rows = useMemo(() => topCandidateReviewRows(algorithm, selectedBenchmarkMode), [algorithm, selectedBenchmarkMode])
  const stabilityRows = useMemo(() => buildCandidateStabilityRows(algorithm), [algorithm])
  const active = rows.find(row => row.candidateId === selectedCandidate) || rows[0]
  useEffect(() => {
    if (!selectedCandidate && rows[0]?.candidateId) setSelectedCandidate(rows[0].candidateId)
  }, [rows, selectedCandidate, setSelectedCandidate])
  if (!rows.length) {
    return (
      <Card id="methodology-model-benchmark-candidates" testId="top-candidate-review" title={text(lang, "候选深度分析 / Top Candidate Review", "Top Candidate Review")} subtitle={text(lang, "等待 Organic Acid 算法输出。", "Waiting for Organic Acid algorithm output.")} t={t}>
        <span style={{ color: t.warn, fontSize: 12 }}>No candidate rows available.</span>
      </Card>
    )
  }
  const stability = stabilityRows.find(row => row.candidateId === active?.candidateId)
  return (
    <Card id="methodology-model-benchmark-candidates" testId="top-candidate-review" title={text(lang, "候选深度分析 / Top Candidate Review", "Top Candidate Review")} subtitle={text(lang, "点击 Top 10 候选，查看 score breakdown、sensitivity、field provenance、next experiment 和 rank stability。", "Click a Top 10 candidate to inspect score breakdown, sensitivity, field provenance, next experiment, and rank stability.")} t={t}>
      <div data-testid="rank-change-simulator" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 10 }}>
        <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "Rank Change Simulator / 排名变化模拟器", "Rank Change Simulator")}</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {BENCHMARK_MODES.map(mode => (
            <button key={mode.id} type="button" onClick={() => setSelectedBenchmarkMode(mode.id)} style={{ background: selectedBenchmarkMode === mode.id ? t.badgeInfoBg : t.panel, border: `1px solid ${selectedBenchmarkMode === mode.id ? t.accent : t.border}`, borderRadius: 7, color: selectedBenchmarkMode === mode.id ? t.accentText : t.muted, cursor: "pointer", fontSize: 12, fontWeight: 850, minHeight: 32, padding: "6px 9px" }}>
              {text(lang, mode.labelZh, mode.label)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.9fr) minmax(280px, 1.1fr)" }}>
        <div style={{ display: "grid", gap: 7 }}>
          {rows.map(row => (
            <button key={row.candidateId} type="button" onClick={() => setSelectedCandidate(row.candidateId)} style={{ background: active?.candidateId === row.candidateId ? t.badgeInfoBg : t.surface, border: `1px solid ${active?.candidateId === row.candidateId ? t.accent : t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", display: "grid", gap: 5, padding: 9, textAlign: "left" }}>
              <strong style={{ fontSize: 12.4 }}>#{row.rank} {row.candidateName}</strong>
              <span style={{ color: t.muted, fontSize: 11.5 }}>finalScore {score(row.finalScore)} · {row.recommendationClass}</span>
            </button>
          ))}
        </div>
        {active ? (
          <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 9, minWidth: 0, padding: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 14 }}>#{active.rank} {active.candidateName}</strong>
            <div style={{ display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))" }}>
              <MiniMetric label="Pathway Fit" value={score(active.pathwayFitScore)} t={t} />
              <MiniMetric label="Evidence Support" value={score(active.evidenceScore)} t={t} />
              <MiniMetric label="Graph Relevance" value={score(active.graphRelevanceScore)} t={t} />
              <MiniMetric label="Validation Readiness" value={score(active.validationReadinessScore)} t={t} />
              <MiniMetric label="Risk Penalty" value={score(active.riskPenalty)} t={t} tone={active.riskPenalty > 0.1 ? "warn" : "default"} />
              <MiniMetric label="Rank Stability" value={stability?.stability || "pending"} t={t} tone={stability?.stability === "Unstable" ? "warn" : "pass"} />
            </div>
            <div style={{ display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 8 }}>
                <strong style={{ color: t.textStrong, fontSize: 12 }}>{text(lang, "为什么排在这里", "Why Ranked Here")}</strong>
                {(active.mainReasons || []).slice(0, 4).map(reason => <span key={reason} style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{reason}</span>)}
              </div>
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 8 }}>
                <strong style={{ color: t.textStrong, fontSize: 12 }}>{text(lang, "什么因素会改变排名", "What Could Change The Rank")}</strong>
                <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, "证据权重、验证就绪度、风险惩罚和字段级溯源缺口会改变排序。", "Evidence weight, validation readiness, risk penalty, and field-provenance gaps can change the ranking.")}</span>
                <strong style={{ color: t.warn, fontSize: 12 }}>{text(lang, "最大不确定性", "Biggest Uncertainty")}: {(active.mainRisks || [])[0] || "Experimental labels missing"}</strong>
              </div>
            </div>
            {active.scoreBreakdown ? (
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, padding: 8 }}>
                <strong style={{ color: t.textStrong, fontSize: 12 }}>score breakdown</strong>
                <span style={{ color: t.faint, fontSize: 10.8, lineHeight: 1.4 }}>{active.scoreBreakdown.equation}</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {Object.entries(active.scoreBreakdown.dimensions || {}).map(([field, value]) => <ProvenanceChip key={field} field={field} label={`${field}: ${score(value)}`} lang={lang} t={t} source={active.fieldSources?.[field] || benchmarkSource(field, { value })} />)}
                </div>
              </div>
            ) : null}
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 8 }}>
              <strong style={{ color: t.textStrong, fontSize: 12 }}>sensitivity result</strong>
              <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{stability ? Object.entries(stability.ranks).map(([mode, rank]) => `${mode}: #${rank}`).join(" · ") : "pending"}</span>
              <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}><strong style={{ color: t.textStrong }}>next experiment:</strong> {active.nextExperiment}</span>
            </div>
          </article>
        ) : null}
      </div>
    </Card>
  )
}

export function ModelBenchmarkLab({ records = [], summary = {}, organicAcidResult = null, lang, t, isMobile }) {
  const algorithm = organicAcidResult?.organicAcidAlgorithm || organicAcidResult || {}
  const readiness = useMemo(() => buildBenchmarkReadiness({ summary, algorithm }), [algorithm, summary])
  const [selectedFeature, setSelectedFeature] = usePersistentState("ecomof.v27.selectedFeature", "original_features")
  const [selectedDescriptor, setSelectedDescriptor] = usePersistentState("ecomof.v27.selectedDescriptor", "surfaceArea")
  const [selectedModel, setSelectedModel] = usePersistentState("ecomof.v27.selectedModel", "critic")
  const [selectedMetric, setSelectedMetric] = usePersistentState("ecomof.v27.selectedMetric", "Current Readiness")
  const [selectedFutureModel, setSelectedFutureModel] = usePersistentState("ecomof.v27.selectedFutureModel", "lr")
  const [selectedCandidate, setSelectedCandidate] = usePersistentState("ecomof.v27.selectedCandidate", "")
  const [selectedBenchmarkMode, setSelectedBenchmarkMode] = usePersistentState("ecomof.v27.selectedBenchmarkMode", "balanced")
  const mobile = Boolean(isMobile)
  const darkReadable = t.bg && t.textStrong && t.panel

  return (
    <section
      id="methodology-model-benchmark"
      data-testid="model-benchmark-lab"
      data-mobile-layout={mobile ? "segmented" : "dashboard"}
      data-dark-readable={darkReadable ? "true" : "false"}
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 14, minWidth: 0, overflow: "hidden", padding: 15, scrollMarginTop: 118 }}
    >
      <header style={{ display: "grid", gap: 6 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Model Benchmark Lab</span>
        <h2 style={{ color: t.textStrong, fontSize: 22, lineHeight: 1.15, margin: 0 }}>{text(lang, "模型基准测试实验室", "Model Benchmark Lab")}</h2>
        <p style={{ color: t.muted, fontSize: 12.8, lineHeight: 1.6, margin: 0, maxWidth: 980 }}>
          {text(
            lang,
            "V2.7 参考 Su et al. 2025 的特征筛选与模型基准思路，但不复现论文模型，也不训练黑箱 ML。当前建立 Algorithm Credibility Framework：解释为什么相信白盒筛选结果、为什么 ML 暂不可运行，以及未来如何进入真实标签验证。",
            "V2.7 borrows the feature-selection and benchmark-readiness pattern from Su et al. 2025, but it does not reproduce that paper or train black-box ML. It builds an Algorithm Credibility Framework: why the white-box ranking is credible, why ML cannot run yet, and how future label validation can proceed."
          )}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <BasisBadge tone="info">White-box MCDA</BasisBadge>
          <BasisBadge tone="info">Evidence Adjustment</BasisBadge>
          <BasisBadge tone="info">Graph Relevance</BasisBadge>
          <BasisBadge tone="warn">Risk Penalty</BasisBadge>
          <BasisBadge tone="warn">Machine Learning Benchmark Pending</BasisBadge>
        </div>
      </header>

      <BenchmarkOverviewPanel readiness={readiness} lang={lang} t={t} isMobile={mobile} />
      <InteractiveBenchmarkWorkflow selectedFeature={selectedFeature} setSelectedFeature={setSelectedFeature} lang={lang} t={t} isMobile={mobile} />
      <DescriptorImportanceRanking selectedDescriptor={selectedDescriptor} setSelectedDescriptor={setSelectedDescriptor} lang={lang} t={t} isMobile={mobile} />
      <BenchmarkReadinessPanel readiness={readiness} lang={lang} t={t} isMobile={mobile} />
      <ModelComparisonDashboard selectedModel={selectedModel} setSelectedModel={setSelectedModel} selectedMetric={selectedMetric} setSelectedMetric={setSelectedMetric} readiness={readiness} lang={lang} t={t} />
      <FutureMetricPanel
        id="methodology-model-benchmark-future-accuracy"
        testId="future-accuracy-panel"
        title={text(lang, "未来精度验证 / Future Accuracy", "Future Accuracy")}
        subtitle={text(lang, "参考 Figure 3f 的柱状图形式，但当前 Accuracy 为 Pending。", "Figure 3f-style panel, but current Accuracy is Pending.")}
        metricLabel="Accuracy"
        selectedModel={selectedFutureModel}
        setSelectedModel={setSelectedFutureModel}
        lang={lang}
        t={t}
        isMobile={mobile}
      />
      <FutureMetricPanel
        id="methodology-model-benchmark-future-roc"
        testId="future-rocauc-panel"
        title={text(lang, "未来 ROC-AUC 验证 / Future ROC-AUC", "Future ROC-AUC")}
        subtitle={text(lang, "参考 Figure 3g 的 ROC-AUC 比较，但当前 ROC-AUC 为 Pending；External validation required。", "Figure 3g-style ROC-AUC comparison, but current ROC-AUC is Pending; External validation required.")}
        metricLabel="ROC-AUC"
        selectedModel={selectedFutureModel}
        setSelectedModel={setSelectedFutureModel}
        lang={lang}
        t={t}
        isMobile={mobile}
      />
      <BenchmarkRoadmap lang={lang} t={t} />
      <TopCandidateReview
        algorithm={algorithm}
        selectedCandidate={selectedCandidate}
        setSelectedCandidate={setSelectedCandidate}
        selectedBenchmarkMode={selectedBenchmarkMode}
        setSelectedBenchmarkMode={setSelectedBenchmarkMode}
        lang={lang}
        t={t}
        isMobile={mobile}
      />
    </section>
  )
}

export default ModelBenchmarkLab
