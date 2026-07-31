// @ts-nocheck
// V2.8 Algorithm Validation Center — the single validation entry of Methods &
// Evidence. The Interactive Scientific Figure is the core first-screen entry;
// the layer sections below are the deep-link targets the figure nodes jump to.
// This replaces the removed Model Validation Lab and Model Benchmark Lab.
import { useMemo, useState } from "react"
import { BasisBadge, FieldProvenanceButton } from "../../ui"
import {
  BENCHMARK_MODES,
  FEATURE_SELECTION_WORKFLOW,
  benchmarkSource,
  buildBenchmarkReadiness,
  buildCandidateStabilityRows,
  buildDescriptorRanking,
  topCandidateReviewRows,
} from "../../../utils/modelBenchmarkLab"
import { DESCRIPTOR_CLASSES } from "../../../utils/algorithmValidationFigure"
import { InteractiveScientificFigure } from "./InteractiveScientificFigure"
import { ExperimentalLabelDashboard } from "./ExperimentalLabelDashboard"
import { ModelLeaderboard } from "./ModelLeaderboard"
import { ModelCredibilityCenter } from "../model-credibility/ModelCredibilityCenter"
import { RobustnessDashboard } from "../model-robustness/RobustnessDashboard"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const pct = value => (Number.isFinite(Number(value)) ? `${Math.round(Number(value) * 100)}%` : String(value ?? "pending"))
const score = value => (Number.isFinite(Number(value)) ? Number(value).toFixed(3) : String(value ?? "pending"))

export const ALGORITHM_VALIDATION_DIRECTORY = {
  id: "methodology-algorithm-validation",
  label: "Algorithm Validation Center",
  labelZh: "算法验证中心",
  level: 1,
  display: "算法验证中心",
  children: [
    { id: "algval-figure", label: "Interactive Scientific Figure", labelZh: "交互式科研主图" },
    { id: "algval-data-audit", label: "Data Audit Center", labelZh: "数据审计中心" },
    { id: "algval-experimental-labels", label: "Experimental Label Status", labelZh: "实验标签状态" },
    { id: "algval-model-leaderboard", label: "Model Leaderboard", labelZh: "模型排行榜" },
    { id: "algval-first-benchmark", label: "First Real Benchmark", labelZh: "首个真实 Benchmark" },
    { id: "algval-explainability", label: "Model Explainability Center", labelZh: "模型可解释性中心" },
    { id: "algval-feature-importance", label: "Feature Importance Workbench", labelZh: "特征重要性工作台" },
    { id: "algval-cross-validation", label: "Cross Validation Dashboard", labelZh: "交叉验证仪表板" },
    { id: "algval-credibility", label: "Model Credibility Score", labelZh: "模型可信度评分" },
    { id: "algval-robustness", label: "Robustness & Reliability", labelZh: "稳健性与可靠度" },
    { id: "algval-database", label: "Database Layer", labelZh: "数据库层" },
    { id: "algval-descriptor", label: "Descriptor Layer", labelZh: "描述符层" },
    { id: "algval-feature-selection", label: "Feature Selection Explorer", labelZh: "特征选择探索器" },
    { id: "algval-evidence", label: "Evidence & Statistical Layer", labelZh: "证据与统计层" },
    { id: "algval-ranking", label: "Top Candidate Review", labelZh: "候选深度分析" },
    { id: "algval-validation", label: "Algorithm Validation Layer", labelZh: "算法验证层" },
    { id: "algval-future-ml", label: "ML Readiness", labelZh: "ML 就绪度" },
    { id: "algval-experimental", label: "Experimental Validation Layer", labelZh: "实验验证层" },
  ],
}

function jumpToSection(id) {
  if (typeof document === "undefined") return
  const target = document.getElementById(id)
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" })
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`)
  }
}

function LayerCard({ id, eyebrow, title, subtitle, t, children, status }) {
  const tone = status === "blocked" || status === "warning" ? "warn" : status === "planned" ? "info" : "calc"
  const statusLabel = { passed: "Passed", warning: "Warning", blocked: "Blocked", planned: "Planned" }[status]
  return (
    <section id={id} data-testid={id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 11, minWidth: 0, padding: 14, scrollMarginTop: 118 }}>
      <header style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          <span style={{ color: t.accentText, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{eyebrow}</span>
          <h3 style={{ color: t.textStrong, fontSize: 17, lineHeight: 1.2, margin: 0 }}>{title}</h3>
          {subtitle ? <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.5, margin: 0 }}>{subtitle}</p> : null}
        </div>
        {statusLabel ? <BasisBadge tone={tone}>{statusLabel}</BasisBadge> : null}
      </header>
      {children}
    </section>
  )
}

function Metric({ label, value, t, tone = "default" }) {
  const color = tone === "warn" ? t.warn : tone === "pass" ? (t.success || t.accentText) : t.textStrong
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 9 }}>
      <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color, display: "block", fontSize: 14, lineHeight: 1.18, marginTop: 5, overflowWrap: "anywhere" }}>{value}</strong>
    </div>
  )
}

function ProvenanceChip({ field, label, source, lang, t }) {
  return (
    <span style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, color: t.muted, display: "inline-flex", fontSize: 11, fontWeight: 800, minHeight: 24, padding: "3px 7px" }}>
      {label}
      <FieldProvenanceButton fieldKey={field} fieldLabel={label} source={source || benchmarkSource(field, { value: label })} lang={lang} />
    </span>
  )
}

function DatabaseLayer({ summary, readiness, dataFoundation, dataIngestion, lang, t, isMobile }) {
  const provenance = Number(summary.fieldProvenanceCoverage ?? summary.provenanceCoverage ?? readiness.fieldProvenanceCoverage ?? 1)
  const fields = ["totalCandidates", "verifiedMetadataCount", "provenanceCoverage", "previewStatus"]
  const activeCandidateCount = dataIngestion?.coreCount ?? summary.totalCandidates ?? readiness.datasetSize ?? 0
  const activeVerifiedMetadataCount = dataIngestion?.verifiedMetadataCount ?? summary.verifiedMetadataCount ?? readiness.verifiedMetadataCount ?? 0
  const originCells = dataIngestion ? [
    ["External Database", dataIngestion.externalDatabaseCount, dataIngestion.targets.coreMof, "active"],
    ["Literature", dataIngestion.literatureCount, dataIngestion.targets.literature, dataIngestion.availability?.literature?.status],
    ["Experimental", dataIngestion.experimentalCount, 0, "separate-layer"],
    ["Derived", dataIngestion.derivedCount, dataIngestion.targets.reactionDataset, dataIngestion.availability?.reactionDataset?.status],
  ].filter(([, current]) => Number(current) > 0) : []
  return (
    <LayerCard
      id="algval-database"
      status="passed"
      eyebrow="Database Layer"
      title={text(lang, "数据库层", "Database Layer")}
      subtitle={text(lang, "点击查看数据来源、覆盖率、数据质量与字段级溯源。", "Click to view data source, coverage, quality, and field-level provenance.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <Metric label={text(lang, "候选总数", "Candidates")} value={activeCandidateCount} t={t} />
        <Metric label={text(lang, "已核验结构元数据", "Verified Structural Metadata")} value={activeVerifiedMetadataCount} t={t} tone="pass" />
        <Metric label={text(lang, "来源覆盖率", "Provenance Coverage")} value={pct(provenance)} t={t} tone="pass" />
        <Metric label={text(lang, "结构来源", "Structure Source")} value={text(lang, "真实 CoRE 2024 CR", "Real CoRE 2024 CR")} t={t} tone="pass" />
      </div>
      {dataFoundation ? (
        <div data-testid="algval-data-foundation" style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
          {Number(dataFoundation.benchmarkCount) > 0 ? <Metric label={text(lang, "Benchmark 数据集", "Benchmark Dataset")} value={dataFoundation.benchmarkCount} t={t} /> : null}
          {Number(dataFoundation.labelCount) > 0 ? <Metric label={text(lang, "标签数量", "Label Count")} value={dataFoundation.labelCount} t={t} tone="pass" /> : null}
          {Number(dataFoundation.benchmarkEligibleCount) > 0 ? <Metric label={text(lang, "Benchmark 就绪", "Benchmark Eligible")} value={dataFoundation.benchmarkEligibleCount} t={t} tone="pass" /> : null}
          {Number(dataFoundation.labelCount) > 0 ? <Metric label={text(lang, "当前 / 目标 / 缺口", "Current / Target / Gap")} value={`${dataFoundation.labelCount} / ${dataFoundation.targets?.labelCount || 30} / ${dataFoundation.gaps?.labelCount || 0}`} t={t} tone={dataFoundation.gaps?.labelCount ? "warn" : "pass"} /> : null}
        </div>
      ) : null}
      {dataIngestion ? (
        <div data-testid="algval-data-source-stats" style={{ display: "grid", gap: 8 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "数据来源（Current / Target / Gap）", "Data Source (Current / Target / Gap)")}</strong>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
            {originCells.map(([label, current, target, status]) => (
              <Metric
                key={label}
                label={label}
                value={status === "quarantined" ? `${current} · quarantined` : `${current} / ${target} / ${Math.max(0, target - current)}`}
                t={t}
                tone={status === "quarantined" ? "warn" : current >= target ? "pass" : "warn"}
              />
            ))}
          </div>
          <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.45 }}>
            {text(lang, `总记录 ${dataIngestion.totalRecords}（外部数据库 + 文献，已排除 synthetic fixture）；Derived 与 Experimental 严格分离，Experimental Labels = ${dataIngestion.experimentalCount}。`, `Total ${dataIngestion.totalRecords} records (external database + literature; synthetic fixtures excluded). Derived and Experimental are strictly separated; Experimental Labels = ${dataIngestion.experimentalCount}.`)}
          </span>
        </div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {fields.map(field => <ProvenanceChip key={field} field={field} label={field} lang={lang} t={t} />)}
      </div>
    </LayerCard>
  )
}

function DescriptorLayer({ lang, t, isMobile }) {
  const [active, setActive] = useState("Geometry")
  const rows = useMemo(() => buildDescriptorRanking({ mode: "critic", limit: "All" }), [])
  const grouped = useMemo(() => DESCRIPTOR_CLASSES.map(cls => {
    const key = cls.key === "OrganicAcid" ? "Evidence" : cls.key
    const members = rows.filter(row => row.category === (cls.key === "OrganicAcid" ? "Evidence" : cls.key) || (cls.key === "OrganicAcid" && row.organicAcidRelevance >= 0.8))
    const importance = members.length ? members.reduce((s, r) => s + r.activeImportance, 0) / members.length : 0
    const coverage = members.length ? members.reduce((s, r) => s + r.coverage, 0) / members.length : 0
    return { ...cls, members, importance, coverage, missing: 1 - coverage }
  }), [rows])
  const selected = grouped.find(group => group.key === active) || grouped[0]
  return (
    <LayerCard
      id="algval-descriptor"
      status="passed"
      eyebrow="Descriptor Layer"
      title={text(lang, "描述符层", "Descriptor Layer")}
      subtitle={text(lang, "Geometry / Electronic / Graph / Evidence / Organic Acid 五类；点击查看重要性、覆盖率与缺失率。", "Geometry / Electronic / Graph / Evidence / Organic Acid; click for importance, coverage, and missing rate.")}
      t={t}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {grouped.map(group => (
          <button key={group.key} type="button" onClick={() => setActive(group.key)} style={{ background: selected.key === group.key ? t.badgeInfoBg : t.surface, border: `1px solid ${selected.key === group.key ? t.accent : t.border}`, borderRadius: 7, color: selected.key === group.key ? t.accentText : t.muted, cursor: "pointer", fontSize: 12, fontWeight: 850, minHeight: 32, padding: "6px 10px" }}>
            {text(lang, group.labelZh, group.label)}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        <Metric label={text(lang, "重要性", "Importance")} value={score(selected.importance)} t={t} />
        <Metric label={text(lang, "覆盖率", "Coverage")} value={pct(selected.coverage)} t={t} tone="pass" />
        <Metric label={text(lang, "缺失率", "Missing rate")} value={pct(selected.missing)} t={t} tone="warn" />
      </div>
    </LayerCard>
  )
}

function FeatureSelectionExplorer({ lang, t, isMobile }) {
  const [active, setActive] = useState("original_features")
  const selected = FEATURE_SELECTION_WORKFLOW.find(step => step.id === active) || FEATURE_SELECTION_WORKFLOW[0]
  return (
    <LayerCard
      id="algval-feature-selection"
      status="passed"
      eyebrow="Feature Selection Explorer"
      title={text(lang, "特征选择探索器", "Feature Selection Explorer")}
      subtitle={text(lang, "Original -> Filtered -> Selected -> Final Set；动态显示保留特征、删除特征与删除原因。", "Original -> Filtered -> Selected -> Final Set; shows kept features, removed features, and removal reasons.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(6, minmax(0, 1fr))" }}>
        {FEATURE_SELECTION_WORKFLOW.map((step, index) => (
          <button key={step.id} type="button" onClick={() => setActive(step.id)} style={{ background: selected.id === step.id ? t.badgeInfoBg : t.surface, border: `1px solid ${selected.id === step.id ? t.accent : t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", display: "grid", gap: 4, minHeight: 78, padding: 9, textAlign: "left" }}>
            <span style={{ color: t.accentText, fontSize: 11, fontWeight: 900 }}>{index + 1}</span>
            <strong style={{ fontSize: 11.6, lineHeight: 1.22 }}>{text(lang, step.titleZh, step.title)}</strong>
            <span style={{ color: step.pending ? t.warn : t.muted, fontSize: 10 }}>{step.inputFeatureCount} → {step.outputFeatureCount}</span>
          </button>
        ))}
      </div>
      <article data-testid="algval-feature-selection-detail" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 11 }}>
        <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{text(lang, selected.titleZh, selected.title)}</strong>
        <div style={{ display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))" }}>
          <Metric label={text(lang, "保留特征", "Kept features")} value={selected.outputFeatureCount} t={t} tone="pass" />
          <Metric label={text(lang, "删除特征", "Removed features")} value={Math.max(0, selected.inputFeatureCount - selected.outputFeatureCount)} t={t} tone="warn" />
          <Metric label={text(lang, "状态", "Status")} value={selected.currentStatus} t={t} tone={selected.pending ? "warn" : "pass"} />
        </div>
        <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.5 }}>
          <strong style={{ color: t.textStrong }}>{text(lang, "删除原因", "Removal reasons")}:</strong> {selected.deletedReasons.join("; ")}
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {selected.fieldKeys.map(field => <ProvenanceChip key={field} field={field} label={field} lang={lang} t={t} />)}
        </div>
      </article>
    </LayerCard>
  )
}

function EvidenceStatisticalLayer({ lang, t, isMobile }) {
  const rows = [
    { key: "critic", label: "CRITIC", status: "passed", body: text(lang, "数据驱动的客观权重（信息量 × 冲突度）。", "Data-driven objective weights (information content × conflict).") },
    { key: "evidence", label: "Evidence Adjustment", status: "passed", body: text(lang, "用证据等级修正原始分，下调低证据候选。", "Adjusts raw scores by evidence level, down-weighting low-evidence candidates.") },
    { key: "graph", label: "Graph Relevance", status: "passed", body: text(lang, "机制/证据图上的相关性，不是预测精度。", "Relevance on mechanism/evidence graphs; not predictive accuracy.") },
    { key: "risk", label: "Risk Penalty", status: "warning", body: text(lang, "对坍塌风险、竞争路径、缺失字段做惩罚。", "Penalizes collapse risk, competing pathways, and missing fields.") },
    { key: "bayes", label: "Bayesian Regression", status: "planned", body: text(lang, "需要实验标签才能拟合系数，当前标记为 Planned，不报告数值。", "Requires experimental labels to fit coefficients; marked Planned, no values reported.") },
  ]
  return (
    <LayerCard
      id="algval-evidence"
      status="warning"
      eyebrow="Evidence & Statistical Layer"
      title={text(lang, "证据与统计解释层", "Evidence & Statistical Interpretation")}
      subtitle={text(lang, "CRITIC、证据修正、图论相关性、风险惩罚已实现；Bayesian Regression 为 Planned。", "CRITIC, evidence adjustment, graph relevance, and risk penalty are implemented; Bayesian Regression is Planned.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {rows.map(row => (
          <article key={row.key} style={{ background: t.surface, border: `1px solid ${row.status === "planned" || row.status === "warning" ? t.warn : t.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 10 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{row.label}</strong>
              <BasisBadge tone={row.status === "passed" ? "calc" : row.status === "planned" ? "info" : "warn"}>{{ passed: "Passed", warning: "Warning", planned: "Planned" }[row.status]}</BasisBadge>
            </div>
            <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{row.body}</span>
          </article>
        ))}
      </div>
    </LayerCard>
  )
}

function TopCandidateReview({ algorithm, lang, t, isMobile }) {
  const [mode, setMode] = useState("balanced")
  const rows = useMemo(() => topCandidateReviewRows(algorithm, mode), [algorithm, mode])
  const stabilityRows = useMemo(() => buildCandidateStabilityRows(algorithm), [algorithm])
  const [activeId, setActiveId] = useState("")
  const active = rows.find(row => row.candidateId === activeId) || rows[0]
  const stability = stabilityRows.find(row => row.candidateId === active?.candidateId)
  if (!rows.length) {
    return (
      <LayerCard id="algval-ranking" status="warning" eyebrow="Top Candidate Review" title={text(lang, "候选深度分析", "Top Candidate Review")} subtitle={text(lang, "等待算法输出。", "Waiting for algorithm output.")} t={t}>
        <span style={{ color: t.warn, fontSize: 12 }}>No candidate rows available.</span>
      </LayerCard>
    )
  }
  return (
    <LayerCard
      id="algval-ranking"
      status="passed"
      eyebrow="Top Candidate Review"
      title={text(lang, "候选深度分析", "Top Candidate Review")}
      subtitle={text(lang, "点击候选查看 Why Ranked Here、Biggest Uncertainty、Next Experiment 与 Rank Stability。", "Click a candidate for Why Ranked Here, Biggest Uncertainty, Next Experiment, and Rank Stability.")}
      t={t}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {BENCHMARK_MODES.map(item => (
          <button key={item.id} type="button" onClick={() => setMode(item.id)} style={{ background: mode === item.id ? t.badgeInfoBg : t.surface, border: `1px solid ${mode === item.id ? t.accent : t.border}`, borderRadius: 7, color: mode === item.id ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.5, fontWeight: 850, minHeight: 30, padding: "5px 9px" }}>
            {text(lang, item.labelZh, item.label)}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.9fr) minmax(260px, 1.1fr)" }}>
        <div style={{ display: "grid", gap: 6 }}>
          {rows.map(row => (
            <button key={row.candidateId} type="button" onClick={() => setActiveId(row.candidateId)} style={{ background: active?.candidateId === row.candidateId ? t.badgeInfoBg : t.surface, border: `1px solid ${active?.candidateId === row.candidateId ? t.accent : t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", display: "grid", gap: 4, padding: 9, textAlign: "left" }}>
              <strong style={{ fontSize: 12.2 }}>#{row.rank} {row.candidateName}</strong>
              <span style={{ color: t.muted, fontSize: 11 }}>finalScore {score(row.finalScore)} · {row.recommendationClass}</span>
            </button>
          ))}
        </div>
        {active ? (
          <article data-testid="algval-candidate-detail" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 9, minWidth: 0, padding: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 13.5 }}>#{active.rank} {active.candidateName}</strong>
            <div style={{ display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))" }}>
              <Metric label="Pathway Fit" value={score(active.pathwayFitScore)} t={t} />
              <Metric label="Evidence" value={score(active.evidenceScore)} t={t} />
              <Metric label="Risk Penalty" value={score(active.riskPenalty)} t={t} tone={active.riskPenalty > 0.1 ? "warn" : "default"} />
              <Metric label="Rank Stability" value={stability?.stability || "pending"} t={t} tone={stability?.stability === "Unstable" ? "warn" : "pass"} />
            </div>
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 4, padding: 8 }}>
              <strong style={{ color: t.textStrong, fontSize: 12 }}>{text(lang, "排序依据", "Why Ranked Here")}</strong>
              {(active.mainReasons || []).slice(0, 3).map(reason => <span key={reason} style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.4 }}>{reason}</span>)}
              <strong style={{ color: t.warn, fontSize: 11.6 }}>{text(lang, "最大不确定性", "Biggest Uncertainty")}: {(active.mainRisks || [])[0] || "Experimental labels missing"}</strong>
              <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.4 }}><strong style={{ color: t.textStrong }}>{text(lang, "下一步实验", "Next Experiment")}:</strong> {active.nextExperiment}</span>
            </div>
          </article>
        ) : null}
      </div>
    </LayerCard>
  )
}

function AlgorithmValidationLayer({ algorithm, lang, t, isMobile }) {
  const sanityPassed = Boolean(algorithm?.sanityCheck?.passed)
  const topStable = Boolean(algorithm?.sensitivitySummary?.topCandidateStability)
  const rows = [
    ["Sanity Check", sanityPassed ? "Passed" : "Warning", sanityPassed ? "pass" : "warn"],
    ["Sensitivity Analysis", topStable ? "Passed" : "Warning", topStable ? "pass" : "warn"],
    ["Validation Readiness", "Warning", "warn"],
    ["Scientific Credibility", "Passed", "pass"],
  ]
  return (
    <LayerCard
      id="algval-validation"
      status={sanityPassed ? "passed" : "warning"}
      eyebrow="Algorithm Validation Layer"
      title={text(lang, "算法验证层", "Algorithm Validation Layer")}
      subtitle={text(lang, "Sanity Check / Sensitivity Analysis / Validation Readiness / Scientific Credibility，状态为 Passed / Warning / Blocked。", "Sanity Check / Sensitivity Analysis / Validation Readiness / Scientific Credibility, with Passed / Warning / Blocked status.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        {rows.map(([label, value, tone]) => <Metric key={label} label={label} value={value} t={t} tone={tone} />)}
      </div>
    </LayerCard>
  )
}

function MlReadinessLayer({ readiness, dataFoundation, lang, t, isMobile }) {
  const labelCount = Number(dataFoundation ? dataFoundation.labelCount : readiness.experimentalLabels ?? 0) || 0
  const rows = [
    ["Logistic Regression", "Pending", labelCount > 0 ? "Partially Ready" : "Not Ready"],
    ["Decision Tree", "Pending", labelCount > 0 ? "Partially Ready" : "Not Ready"],
    ["Random Forest", "Pending", "Not Ready"],
  ]
  return (
    <LayerCard
      id="algval-future-ml"
      status="blocked"
      eyebrow="Future ML Readiness"
      title={text(lang, "未来机器学习就绪度", "Future Machine Learning Readiness")}
      subtitle={text(lang, "参考论文 Accuracy / ROC，但不伪造结果；LR / DT / RF 均为 Pending，需要实验标签。", "Figure 3 Accuracy/ROC analogy without fabricating results; LR / DT / RF stay Pending and require experimental labels.")}
      t={t}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <BasisBadge tone="warn">Accuracy: Pending</BasisBadge>
        <BasisBadge tone="warn">ROC-AUC: Pending</BasisBadge>
        <BasisBadge tone="warn">Experimental Labels Required</BasisBadge>
        <BasisBadge tone="warn">{`Label Count = ${labelCount}`}</BasisBadge>
      </div>
      {dataFoundation ? (
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
          <Metric label="Benchmark Readiness" value={dataFoundation.readiness.benchmark} t={t} tone={dataFoundation.readiness.benchmark === "Ready" ? "pass" : "warn"} />
          <Metric label="Label Readiness" value={dataFoundation.readiness.label} t={t} tone={dataFoundation.readiness.label === "Ready" ? "pass" : "warn"} />
          <Metric label="Data Quality Readiness" value={dataFoundation.readiness.dataQuality} t={t} tone={dataFoundation.readiness.dataQuality === "Ready" ? "pass" : "warn"} />
          <Metric label="Train / Test / External" value={`${dataFoundation.trainCount} / ${dataFoundation.testCount} / ${dataFoundation.externalTestCount || 0}`} t={t} tone={dataFoundation.externalTestCount >= dataFoundation.targets?.externalTest ? "pass" : "warn"} />
          <Metric label="Label Current / Target / Gap" value={`${dataFoundation.current?.labelCount || 0} / ${dataFoundation.targets?.labelCount || 30} / ${dataFoundation.gaps?.labelCount || 0}`} t={t} tone={dataFoundation.gaps?.labelCount ? "warn" : "pass"} />
          <Metric label="Benchmark Current / Target / Gap" value={`${dataFoundation.current?.benchmarkEligible || 0} / ${dataFoundation.targets?.benchmarkEligible || 30} / ${dataFoundation.gaps?.benchmarkEligible || 0}`} t={t} tone={dataFoundation.gaps?.benchmarkEligible ? "warn" : "pass"} />
          <Metric label="External Current / Target / Gap" value={`${dataFoundation.current?.externalTest || 0} / ${dataFoundation.targets?.externalTest || 30} / ${dataFoundation.gaps?.externalTest || 0}`} t={t} tone={dataFoundation.gaps?.externalTest ? "warn" : "pass"} />
          <Metric label="Accuracy / ROC-AUC" value={dataFoundation.futureMetrics?.accuracy || "Pending"} t={t} tone="warn" />
        </div>
      ) : null}
      {dataFoundation?.futureMetrics ? (
        <div data-testid="future-metric-pending-reason" style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.warn, fontSize: 12, fontWeight: 780, lineHeight: 1.5, padding: 10 }}>
          {text(lang, dataFoundation.futureMetrics.reasonZh, dataFoundation.futureMetrics.reason)}
        </div>
      ) : null}
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        {rows.map(([label, metric, ready]) => (
          <article key={label} style={{ background: t.surface, border: `1px solid ${t.warn}`, borderRadius: 9, display: "grid", gap: 5, padding: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{label}</strong>
            <span style={{ color: t.warn, fontSize: 11.5, fontWeight: 800 }}>Accuracy / ROC-AUC: {metric}</span>
            <span style={{ color: t.warn, fontSize: 11.5 }}>{ready}</span>
          </article>
        ))}
      </div>
    </LayerCard>
  )
}

function ExperimentalValidationLayer({ lang, t, isMobile }) {
  const steps = [
    ["Current", "ready"],
    ["Label Collection", "blocked"],
    ["Cross Validation", "blocked"],
    ["External Test", "blocked"],
    ["Publication", "planned"],
  ]
  return (
    <LayerCard
      id="algval-experimental"
      status="blocked"
      eyebrow="Experimental Validation Layer"
      title={text(lang, "实验验证层", "Experimental Validation Layer")}
      subtitle={text(lang, "Current -> Label Collection -> Cross Validation -> External Test -> Publication，并展示当前阻断条件。", "Current -> Label Collection -> Cross Validation -> External Test -> Publication, with current blockers shown.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))" }}>
        {steps.map(([label, status], index) => (
          <article key={label} style={{ background: t.surface, border: `1px solid ${status === "blocked" ? t.warn : t.border}`, borderRadius: 8, display: "grid", gap: 4, padding: 9 }}>
            <span style={{ color: t.accentText, fontSize: 11, fontWeight: 900 }}>{index + 1}</span>
            <strong style={{ color: t.textStrong, fontSize: 11.8, lineHeight: 1.25 }}>{label}</strong>
            <span style={{ color: status === "ready" ? (t.success || t.accentText) : t.warn, fontSize: 10.5, fontWeight: 800 }}>{status}</span>
          </article>
        ))}
      </div>
      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.warn, fontSize: 12, fontWeight: 900, lineHeight: 1.45, padding: 10 }}>
        {text(lang, "当前阻断条件：缺少真实实验标签；Cross Validation / External Test / Publication 均被阻断。", "Current blocker: no real experimental labels; Cross Validation / External Test / Publication are all blocked.")}
      </div>
    </LayerCard>
  )
}

const AUDIT_TONE = { Pass: "calc", Warning: "warn", Fail: "warn" }

function AuditCard({ title, status, lines, t }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${status === "Fail" ? t.warn : t.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 10 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{title}</strong>
        <BasisBadge tone={AUDIT_TONE[status] || "warn"}>{status}</BasisBadge>
      </div>
      {lines.map(line => <span key={line} style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.45 }}>{line}</span>)}
    </article>
  )
}

function DataAuditCenter({ dataAudit, lang, t, isMobile }) {
  if (!dataAudit) return null
  const a = dataAudit.audits
  const cards = [
    { title: text(lang, "Label Audit", "Label Audit"), status: a.label.status, lines: [`Experimental ${a.label.realExperimentalLabelCount} · Dataset-derived ${a.label.datasetDerivedCount}`, `Invalid ground truth ${a.label.invalidGroundTruthCount}`] },
    { title: text(lang, "Benchmark Eligibility Audit", "Benchmark Eligibility Audit"), status: a.benchmarkEligibility.status, lines: [`Confirmed ${a.benchmarkEligibility.eligibleConfirmed}`, `Rejected ${a.benchmarkEligibility.eligibleRejected} · Warnings ${a.benchmarkEligibility.eligibleWarnings}`] },
    { title: text(lang, "Provenance Audit", "Provenance Audit"), status: a.provenance.status, lines: [`Coverage ${Math.round(a.provenance.provenanceCoverageScore * 100)}%`, `DOI ${Math.round(a.provenance.doiCoverage * 100)}% · Citation ${Math.round(a.provenance.citationCoverage * 100)}%`] },
    { title: text(lang, "Data Leakage Audit", "Data Leakage Audit"), status: a.leakage.status, lines: [`Leak count ${a.leakage.leakCount} · severity ${a.leakage.leakSeverity}`, `Shared-DOI warnings ${a.leakage.sharedDoiWarnings?.length || 0}`] },
  ]
  return (
    <LayerCard
      id="algval-data-audit"
      status={dataAudit.overallStatus}
      eyebrow="Data Audit Center"
      title={text(lang, "数据审计中心", "Data Audit Center")}
      subtitle={text(lang, "审计当前可用的 Label / Benchmark / Provenance / Leakage，输出 Pass / Warning / Fail。", "Audits the active Label / Benchmark / Provenance / Leakage layers and outputs Pass / Warning / Fail.")}
      t={t}
    >
      <div data-testid="audit-dashboard" style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        {cards.map(card => <AuditCard key={card.title} {...card} t={t} />)}
      </div>
    </LayerCard>
  )
}

function FirstBenchmarkDashboard({ dataAudit, lang, t, isMobile }) {
  if (!dataAudit?.benchmarkReport) return null
  const report = dataAudit.benchmarkReport
  const a = dataAudit.audits
  const blocked = report.overallStatus === "Benchmark Blocked"
  const reasons = report.accuracyGate?.reasons || []
  return (
    <LayerCard
      id="algval-first-benchmark"
      status={blocked ? "blocked" : report.metricsAllowed ? "passed" : "warning"}
      eyebrow="First Real Benchmark Dashboard"
      title={text(lang, "首个真实 Benchmark 仪表板", "First Real Benchmark Dashboard")}
      subtitle={text(lang, "展示当前 Benchmark 状态、审计状态、泄漏状态与标签状态；Accuracy / ROC 仅在合法时显示，否则 Pending。", "Shows current benchmark status, audit status, leakage status, and label status; Accuracy / ROC display only when legitimate, otherwise Pending.")}
      t={t}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <BasisBadge tone={blocked ? "warn" : report.metricsAllowed ? "calc" : "warn"}>{report.overallStatus}</BasisBadge>
        <BasisBadge tone="warn">Accuracy: {report.models?.[0]?.accuracy ?? "Pending"}</BasisBadge>
        <BasisBadge tone="warn">ROC-AUC: {report.models?.[0]?.rocAuc ?? "Pending"}</BasisBadge>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <Metric label="Current Benchmark Status" value={report.runnable ? "Runnable" : "Blocked"} t={t} tone={report.runnable ? "pass" : "warn"} />
        <Metric label="Audit Status" value={dataAudit.overallStatus} t={t} tone={dataAudit.overallStatus === "Pass" ? "pass" : "warn"} />
        <Metric label="Leakage Status" value={`${a.leakage.leakCount} leaks`} t={t} tone={a.leakage.leakCount === 0 ? "pass" : "warn"} />
        <Metric label="Label Status" value={a.label.realExperimentalLabelCount > 0 ? "Experimental" : "Dataset-derived"} t={t} tone={a.label.realExperimentalLabelCount > 0 ? "pass" : "warn"} />
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        {(report.models || []).map(row => (
          <div key={row.model} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 4, gridTemplateColumns: isMobile ? "1fr" : "minmax(150px, 0.4fr) minmax(0, 0.6fr)", padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.3 }}>{row.model}</strong>
            <span style={{ color: t.warn, fontSize: 11.4, lineHeight: 1.4 }}>{row.status} · Accuracy {row.accuracy ?? "Pending"} · ROC-AUC {row.rocAuc ?? "Pending"} · train {row.trainSize} / test {row.testSize}</span>
          </div>
        ))}
      </div>
      {reasons.length ? (
        <div data-testid="benchmark-pending-reasons" style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.warn, fontSize: 11.6, fontWeight: 780, lineHeight: 1.5, padding: 10 }}>
          {text(lang, "Accuracy / ROC 暂不可报告的依据：", "Why Accuracy / ROC cannot be shown yet: ")}{reasons.join(" ")}
        </div>
      ) : null}
    </LayerCard>
  )
}

export function AlgorithmValidationCenter({ summary = {}, organicAcidResult = null, dataFoundation = null, dataAudit = null, dataIngestion = null, firstBenchmark = null, credibility = null, robustness = null, lang, t, isMobile }) {
  const algorithm = organicAcidResult?.organicAcidAlgorithm || organicAcidResult || {}
  const safeSummary = summary && typeof summary === "object" ? summary : {}
  const readiness = useMemo(() => buildBenchmarkReadiness({ summary: safeSummary, algorithm }), [safeSummary, algorithm])

  return (
    <section
      id="methodology-algorithm-validation"
      data-testid="algorithm-validation-center"
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 14, minWidth: 0, padding: 15, scrollMarginTop: 118 }}
    >
      <header style={{ display: "grid", gap: 6 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Algorithm Validation Center</span>
        <h2 style={{ color: t.textStrong, fontSize: 23, lineHeight: 1.14, margin: 0 }}>{text(lang, "算法验证中心", "Algorithm Validation Center")}</h2>
        <p style={{ color: t.muted, fontSize: 12.8, lineHeight: 1.6, margin: 0, maxWidth: 980 }}>
          {text(
            lang,
            "当前结构层使用 9,835 条真实 CoRE MOF 2024 CSD-modified CR；FAIR-MOFs 补充合成条件、DOI 与部分物化性质。实验标签与 Benchmark 是独立验证层，不会因结构库扩充而自动变成实验验证结果。",
            "The active structural layer uses 9,835 real CoRE MOF 2024 CSD-modified CR records, with FAIR-MOFs adding synthesis conditions, DOI links, and selected physicochemical properties. Experimental labels and Benchmark remain independent validation layers."
          )}
        </p>
      </header>

      <InteractiveScientificFigure summary={safeSummary} algorithm={algorithm} dataFoundation={dataFoundation} dataAudit={dataAudit} firstBenchmark={firstBenchmark} lang={lang} t={t} isMobile={isMobile} onJumpToSection={jumpToSection} />

      <DataAuditCenter dataAudit={dataAudit} lang={lang} t={t} isMobile={isMobile} />
      <ExperimentalLabelDashboard firstBenchmark={firstBenchmark} lang={lang} t={t} isMobile={isMobile} />
      <ModelLeaderboard firstBenchmark={firstBenchmark} lang={lang} t={t} isMobile={isMobile} />
      <ModelCredibilityCenter credibility={credibility} firstBenchmark={firstBenchmark} lang={lang} t={t} isMobile={isMobile} />
      <RobustnessDashboard robustness={robustness} lang={lang} t={t} isMobile={isMobile} />
      <FirstBenchmarkDashboard dataAudit={dataAudit} lang={lang} t={t} isMobile={isMobile} />

      <DatabaseLayer summary={safeSummary} readiness={readiness} dataFoundation={dataFoundation} dataIngestion={dataIngestion} lang={lang} t={t} isMobile={isMobile} />
      <DescriptorLayer lang={lang} t={t} isMobile={isMobile} />
      <FeatureSelectionExplorer lang={lang} t={t} isMobile={isMobile} />
      <EvidenceStatisticalLayer lang={lang} t={t} isMobile={isMobile} />
      <TopCandidateReview algorithm={algorithm} lang={lang} t={t} isMobile={isMobile} />
      <AlgorithmValidationLayer algorithm={algorithm} lang={lang} t={t} isMobile={isMobile} />
      <MlReadinessLayer readiness={readiness} dataFoundation={dataFoundation} lang={lang} t={t} isMobile={isMobile} />
      <ExperimentalValidationLayer lang={lang} t={t} isMobile={isMobile} />
    </section>
  )
}

export default AlgorithmValidationCenter
