import { useEffect, useMemo, useState } from "react"
import { BasisBadge, Callout, CopyLinkButton, ResultLayer, buildCriticScoringModel, toolbarBtn, useLang, useT, useViewport } from "../../shared"
import { CatalysisCurationLayer } from "../catalysis/CatalysisCurationLayer"
import { CatalysisFilterBar } from "../catalysis/CatalysisFilterBar"
import { CatalysisTaskCards } from "../catalysis/CatalysisTaskCards"
import { CatalysisTaskTable } from "../catalysis/CatalysisTaskTable"
import { ComparabilityScatterQuadrant } from "../catalysis/ComparabilityScatterQuadrant"
import { OrganicAcidCaseStudy } from "../catalysis/OrganicAcidCaseStudy"
import { OrganicAcidProject } from "../catalysis/OrganicAcidProject"
import { ProductMetricScatter } from "../catalysis/ProductMetricScatter"
import { ReactionPathwayScatter } from "../catalysis/ReactionPathwayScatter"
import { SelectionInspector } from "../catalysis/SelectionInspector"
import {
  ModulePageHeader,
  PrimaryWorkbenchCard,
  ScopeNoticeBar,
  SecondaryTabs,
} from "../module/ModuleTop"
import {
  CATALYSIS_TASKS,
  analyzeComparability,
  buildComparisonPoints,
  buildStats,
  enrichTaskForCharts,
  filterTasks,
} from "../catalysis/catalysisData"

const DEFAULT_FILTERS = {
  domain: "all",
  mode: "all",
  feedstock: "all",
  productFamily: "all",
  dataStatus: "all",
}

const numericStyle = {
  fontVariantNumeric: "tabular-nums",
}

const workflowSteps = [
  {
    id: "raw-record",
    index: "01",
    titleZh: "原始催化记录",
    titleEn: "Raw catalysis record",
    summary: "收集催化实验中的催化剂、反应条件、底物或 CO2 来源、产物指标和证据来源。",
    inputs: [
      "catalyst / 催化剂",
      "reaction condition / 反应条件",
      "substrate or CO2 source / 底物或 CO2 来源",
      "product metrics / 产物指标",
      "evidence source / 证据来源",
    ],
    process: "保留原始字段，不直接用于排序，先进入标准化步骤。",
    outputs: ["raw_record_id", "raw fields", "evidence note"],
    evidence: "demo / literature / experiment",
    usedFor: ["数据追溯", "后续标准化"],
    next: "记录标准化 Record normalization",
  },
  {
    id: "normalization",
    index: "02",
    titleZh: "记录标准化",
    titleEn: "Record normalization",
    summary: "统一单位、字段命名、产物选择性、收率和证据状态，减少不同实验记录之间的格式差异。",
    inputs: [
      "raw record",
      "unit information",
      "product labels",
      "reaction metadata",
    ],
    process: "统一温度、时间、产率、选择性和证据状态的表示方式，形成可比较输入。",
    outputs: [
      "normalized condition fields",
      "normalized product metrics",
      "evidence status",
    ],
    evidence: "demo / prototype",
    usedFor: ["产物标准化", "排序输入"],
    next: "结构化数据表 Structured tables",
  },
  {
    id: "tables",
    index: "03",
    titleZh: "结构化数据表",
    titleEn: "Structured tables",
    summary: "将复杂实验记录拆分为可查询、可追溯、可复核的结构化表格。",
    inputs: [
      "normalized records",
      "condition keys",
      "product keys",
      "evidence metadata",
    ],
    process: "按催化剂、反应条件、产物指标和证据来源拆表，保留候选级可追踪关系。",
    outputs: [
      "catalyst_records / 催化剂记录表",
      "reaction_conditions / 反应条件表",
      "product_metrics / 产物指标表",
      "evidence_records / 证据记录表",
    ],
    evidence: "demo structured tables",
    usedFor: ["检索", "候选聚合", "证据追溯"],
    next: "可比性检查 Comparability check",
  },
  {
    id: "comparability",
    index: "04",
    titleZh: "可比性检查",
    titleEn: "Comparability check",
    summary: "判断不同实验记录是否可以直接比较，避免把条件差异过大的结果放在同一排序中。",
    inputs: [
      "temperature comparable?",
      "reaction time comparable?",
      "same product basis?",
      "same carbon basis?",
      "evidence confidence sufficient?",
    ],
    process: "生成可比性标签、warning flags 和置信度修正建议，不让不可比记录直接进入同层解释。",
    outputs: [
      "comparable / partially comparable / not comparable",
      "warning flags",
      "confidence adjustment",
    ],
    evidence: "rule-based + demo review",
    usedFor: ["结果解释", "置信度修正", "排序边界"],
    next: "任务映射与 CRITIC case Task mapping & CRITIC case",
  },
  {
    id: "mapping",
    index: "05",
    titleZh: "任务映射与 CRITIC case",
    titleEn: "Task mapping & CRITIC case",
    summary: "把标准化数据映射到任务表、坐标图和 CRITIC 权重原型，用于候选排序和敏感性分析。",
    inputs: [
      "normalized task rows",
      "comparability labels",
      "candidate-level indicators",
      "confidence signals",
    ],
    process: "整理出坐标图字段、排名任务表和 CRITIC-ready indicators；该模块不限于有机酸案例。",
    outputs: [
      "coordinate map fields",
      "ranking task table",
      "CRITIC-ready indicators",
      "sensitivity case",
    ],
    evidence: "prototype ranking case",
    usedFor: ["任务映射", "候选排序", "敏感性分析"],
    next: "Coordinate map / task table / CRITIC preview",
  },
]

function FormulaLabel({ lead, sub }) {
  return (
    <span>
      {lead}
      <sub style={{ fontSize: "0.72em", lineHeight: 0 }}>{sub}</sub>
    </span>
  )
}

function SmallActionButton({ t, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...toolbarBtn(t),
        minHeight: 34,
        padding: "7px 11px",
      }}
    >
      {children}
    </button>
  )
}

function WorkflowStepButton({ step, state, active, hovered, isNarrow, onClick, onEnter, onLeave, t }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        alignItems: "flex-start",
        background: active ? t.panel : t.bg,
        border: `1px solid ${active ? t.accent : hovered ? t.borderStrong || t.border : t.border}`,
        borderRadius: 10,
        boxShadow: hovered || active ? t.shadowSm : "none",
        color: t.textStrong,
        cursor: "pointer",
        display: "grid",
        gap: 7,
        minHeight: isNarrow ? "auto" : 98,
        padding: "10px 11px",
        position: "relative",
        textAlign: "left",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", width: "100%" }}>
        <span
          style={{
            alignItems: "center",
            background: active ? t.accent : t.surface,
            border: `1px solid ${active ? t.accent : t.border}`,
            borderRadius: 999,
            color: active ? "#fff" : t.faint,
            display: "inline-flex",
            fontSize: 10.5,
            fontWeight: 800,
            height: 22,
            justifyContent: "center",
            minWidth: 22,
            padding: "0 7px",
          }}
        >
          {step.index}
        </span>
        <span
          style={{
            background: state === "completed" ? t.surface : t.panel,
            border: `1px solid ${t.border}`,
            borderRadius: 999,
            color: t.muted,
            fontSize: 10.5,
            fontWeight: 700,
            padding: "2px 7px",
            whiteSpace: "nowrap",
          }}
        >
          {state === "completed" ? "已进入下一步" : state === "active" ? "当前步骤" : "预览"}
        </span>
      </div>
      <div style={{ display: "grid", gap: 3 }}>
        <div style={{ color: active ? t.accent : t.textStrong, fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}>
          {step.titleZh}
        </div>
        <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.35 }}>{step.titleEn}</div>
      </div>
      <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
        {step.summary}
      </div>
    </button>
  )
}

function WorkflowWorkbench({ activeStepId, setActiveStepId, lang, isNarrow, t }) {
  const [hoverStepId, setHoverStepId] = useState(null)
  const activeStep = workflowSteps.find(step => step.id === activeStepId) || workflowSteps[0]
  const activeIndex = workflowSteps.findIndex(step => step.id === activeStep.id)

  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 14 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.16, textTransform: "uppercase" }}>
          Catalysis Data Workflow
        </div>
        <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>
          催化数据工作流 Catalysis Data Workflow
        </div>
        <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55 }}>
          把原始催化实验记录转化为可比较、可评分、可追溯的数据结构。
        </div>
      </div>

      <div
        style={{
          alignItems: isNarrow ? "stretch" : "center",
          display: "grid",
          gap: isNarrow ? 8 : 10,
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))",
        }}
      >
        {workflowSteps.map((step, index) => {
          const state = index < activeIndex ? "completed" : index === activeIndex ? "active" : "preview"
          return (
            <div
              key={step.id}
              style={{
                alignItems: "center",
                display: "grid",
                gap: isNarrow || index === workflowSteps.length - 1 ? 0 : 8,
                gridTemplateColumns: isNarrow || index === workflowSteps.length - 1 ? "1fr" : "minmax(0, 1fr) 16px",
              }}
            >
              <WorkflowStepButton
                step={step}
                state={state}
                active={state === "active"}
                hovered={hoverStepId === step.id}
                isNarrow={isNarrow}
                onClick={() => setActiveStepId(step.id)}
                onEnter={() => setHoverStepId(step.id)}
                onLeave={() => setHoverStepId(null)}
                t={t}
              />
              {!isNarrow && index < workflowSteps.length - 1 && (
                <div style={{ alignItems: "center", color: t.borderStrong || t.border, display: "flex", fontSize: 16, justifyContent: "center" }}>→</div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 14 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span style={{ color: t.accent, fontSize: 12.5, fontWeight: 900 }}>{activeStep.index}</span>
            <span style={{ color: t.textStrong, fontSize: 16, fontWeight: 900 }}>{activeStep.titleZh}</span>
            <span style={{ color: t.muted, fontSize: 12.5 }}>{activeStep.titleEn}</span>
          </div>
          <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55 }}>{activeStep.summary}</div>
        </div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 800 }}>输入 Inputs</div>
            <div style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.5, marginTop: 7 }}>
              {activeStep.inputs.map(item => (
                <div key={item}>• {item}</div>
              ))}
            </div>
          </div>
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 800 }}>处理 Process</div>
            <div style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.55, marginTop: 7 }}>{activeStep.process}</div>
          </div>
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 800 }}>输出 Outputs</div>
            <div style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.5, marginTop: 7 }}>
              {activeStep.outputs.map(item => (
                <div key={item}>• {item}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 800 }}>证据状态 Evidence</div>
            <div style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.5, marginTop: 7 }}>{activeStep.evidence}</div>
          </div>
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 800 }}>用于后续 Used for</div>
            <div style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.5, marginTop: 7 }}>
              {activeStep.usedFor.join(" / ")}
            </div>
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45, marginTop: 6 }}>
              下一步 Next: {activeStep.next}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CriticPreviewWorkbench({ model, topCandidate, lang, isNarrow, onNavigate, t }) {
  const indicatorRows = model.indicatorDiagnostics.map(row => {
    const mapping = {
      d_stab: {
        labelZh: "稳定性贡献",
        labelEn: "Stability contribution",
        description: "表示水热稳定性、结构保持和数据可信度对候选排序的贡献。",
      },
      d_barrier: {
        labelZh: "关键能垒贡献",
        labelEn: "Barrier contribution",
        description: "表示反应关键步骤能垒或路径障碍对预期性能的影响。",
      },
      d_select: {
        labelZh: "选择性风险贡献",
        labelEn: "Selectivity-risk contribution",
        description: "表示副产物风险和选择性偏移对排序的影响。",
      },
    }
    return {
      ...row,
      ...mapping[row.key],
    }
  })

  const topName = topCandidate?.name || "—"
  const dExpected = topCandidate ? Number(topCandidate.D_expected).toFixed(3) : "—"
  const confidenceQ = topCandidate ? Number(topCandidate.confidence_Q_clipped).toFixed(2) : "—"
  const maxShift = model.robustness?.maxRemoveOneShift ?? "—"
  const robustnessLabel = lang === "zh" ? model.robustness?.stability?.zh : model.robustness?.stability?.label

  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, padding: 14 }}>
      <div style={{ alignItems: "start", display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.15fr) minmax(260px, 0.85fr)" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.16, textTransform: "uppercase" }}>
              CRITIC-assisted Catalysis Ranking Preview
            </div>
            <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 900, lineHeight: 1.2 }}>
              CRITIC 辅助催化排序预览
            </div>
            <div style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55 }}>
              展示稳定性、关键能垒和选择性风险三个原型指标如何通过 CRITIC 权重影响候选排序。
            </div>
          </div>

          <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>权重解释 Weighting breakdown</div>
            {indicatorRows.map(row => (
              <div key={row.key} style={{ display: "grid", gap: 6 }}>
                <div style={{ alignItems: "baseline", display: "grid", gap: 8, gridTemplateColumns: isNarrow ? "1fr auto" : "minmax(0, 1fr) auto" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 800, lineHeight: 1.35 }}>
                      {row.labelZh}
                    </div>
                    <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.35 }}>{row.labelEn}</div>
                    <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.35, marginTop: 2 }}>
                      原型字段 field: {row.key}
                    </div>
                  </div>
                  <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 800, ...numericStyle }}>
                    {row.criticWeight.toFixed(3)}
                  </div>
                </div>
                <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, height: 7, overflow: "hidden" }}>
                  <div style={{ background: t.accent, height: "100%", width: `${Math.round(row.criticWeight * 100)}%` }} />
                </div>
                <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
                  {row.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
            <div style={{ alignItems: "start", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <div>
                <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 800 }}>推荐候选 Top candidate</div>
                <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 900, lineHeight: 1.2, marginTop: 5 }}>{topName}</div>
              </div>
              <SmallActionButton t={t} onClick={() => onNavigate ? onNavigate("ecoscreen") : window.location.assign("#ecoscreen")}>
                {lang === "zh" ? "查看完整 case" : "View full case"}
              </SmallActionButton>
            </div>
            <div style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.6, marginTop: 10 }}>
              <div>
                预期综合表现 <FormulaLabel lead="D" sub="expected" />: <span style={numericStyle}>{dExpected}</span>
              </div>
              <div>
                置信度 confidence<sub style={{ fontSize: "0.72em", lineHeight: 0 }}>Q</sub>: <span style={numericStyle}>{confidenceQ}</span>
              </div>
            </div>
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5, marginTop: 8 }}>
              该候选在稳定性、关键能垒和选择性风险的综合权重下排名最高。
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
            <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 800 }}>置信度修正 Confidence correction</div>
              <div style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.55, marginTop: 8 }}>
                <FormulaLabel lead="D" sub="expected" /> = <FormulaLabel lead="D" sub="raw" /> × confidence<sub style={{ fontSize: "0.72em", lineHeight: 0 }}>Q</sub>
              </div>
              <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5, marginTop: 6 }}>
                用于降低低证据质量记录对排序的影响。
              </div>
            </div>

            <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 800 }}>稳健性检查 Robustness check</div>
              <div style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.55, marginTop: 8 }}>
                {robustnessLabel || "Stable"} · max shift <span style={numericStyle}>{maxShift}</span>
              </div>
              <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5, marginTop: 6 }}>
                当前 case 在敏感性扰动下最大排名变化为 {maxShift}，说明排序相对稳定。
              </div>
            </div>
          </div>

          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10 }}>
            <SmallActionButton t={t} onClick={() => onNavigate ? onNavigate("methodology") : window.location.assign("#methodology")}>
              {lang === "zh" ? "查看字段解释" : "View field notes"}
            </SmallActionButton>
            <button
              type="button"
              onClick={() => onNavigate ? onNavigate("ecoscreen") : window.location.assign("#ecoscreen")}
              style={{
                background: "transparent",
                border: "none",
                color: t.accent,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                padding: 0,
              }}
            >
              {lang === "zh" ? "查看敏感性分析" : "View sensitivity analysis"}
            </button>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45 }}>
              原型字段保留为 d_stab / d_barrier / d_select；数据缺口建议和 sensitivity ranks 仍由现有 criticScoring.js 原型生成。
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrganicAcidProjectEntry({ lang, t, isNarrow, onOpen }) {
  return (
    <section style={{
      background: t.panel,
      border: `1px solid ${t.borderStrong || t.border}`,
      borderLeft: `3px solid ${t.accent}`,
      borderRadius: 10,
      boxShadow: t.shadowSm,
      display: "grid",
      gap: isNarrow ? 12 : 16,
      gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) auto",
      padding: 15,
      alignItems: "center",
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          Prototype access gate
        </div>
        <h2 style={{ color: t.textStrong, fontSize: 19, fontWeight: 930, lineHeight: 1.2, margin: "5px 0 0" }}>
          Organic Acid Project / 有机酸项目
        </h2>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55, margin: "7px 0 0", maxWidth: 860 }}>
          机理导向 MOF 筛选：glucose–NaHCO<sub>3</sub> 协同转化为 formic acid，并追踪 RGFA 算法过程。
        </p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        style={{
          ...toolbarBtn(t),
          background: t.accent,
          borderColor: t.accent,
          color: "#fff",
          justifyContent: "center",
          minHeight: 38,
          padding: "9px 13px",
          width: isNarrow ? "100%" : "auto",
        }}
      >
        {lang === "zh" ? "进入项目" : "Open project"}
      </button>
    </section>
  )
}

export function CatalysisLabTab({ onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile, isNarrow } = useViewport()
  const chartHeight = isMobile ? 360 : isNarrow ? 380 : 420
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [selectedComparisonIds, setSelectedComparisonIds] = useState([])
  const [xMetric, setXMetric] = useState("yield")
  const [yMetric, setYMetric] = useState("selectivity")
  const [productMetricFamily, setProductMetricFamily] = useState("all")
  const [selectionSource, setSelectionSource] = useState("none")
  const [notice, setNotice] = useState("")
  const [catalysisView, setCatalysisView] = useState("overview")
  const [activeWorkflowStepId, setActiveWorkflowStepId] = useState(workflowSteps[0].id)
  const formateCriticModel = useMemo(() => buildCriticScoringModel(), [])
  const topFormateCandidate = useMemo(() => (
    formateCriticModel.candidates
      .filter(candidate => Number(candidate.G) !== 0)
      .sort((a, b) => Number(b.D_expected || 0) - Number(a.D_expected || 0))[0] || null
  ), [formateCriticModel])

  const localizedTasks = useMemo(() => (
    CATALYSIS_TASKS.map(task => enrichTaskForCharts(task, lang))
  ), [lang])

  const filteredTasks = useMemo(() => filterTasks(localizedTasks, filters), [localizedTasks, filters])
  const stats = useMemo(() => buildStats(localizedTasks), [localizedTasks])
  const catalysisTabs = useMemo(() => [
    { id: "overview", label: lang === "zh" ? "总览" : "Overview" },
    { id: "organic-acid", label: lang === "zh" ? "有机酸项目" : "Organic Acid Project" },
    { id: "map", label: lang === "zh" ? "坐标轴图" : "Coordinate map" },
    { id: "comparability", label: lang === "zh" ? "可比性评估" : "Comparability" },
    { id: "curation", label: lang === "zh" ? "数据整理" : "Data curation" },
  ], [lang])
  const workbenchMetrics = useMemo(() => (
    stats.map(item => ({
      key: item.key,
      value: item.value,
      label: lang === "zh" ? item.zh : item.en,
    }))
  ), [lang, stats])

  useEffect(() => {
    if (!filteredTasks.length) {
      if (selectedTaskId !== null) setSelectedTaskId(null)
      setSelectionSource("filter")
      return
    }
    if (!filteredTasks.some(task => task.id === selectedTaskId)) {
      setSelectedTaskId(null)
      setSelectionSource("filter")
    }
  }, [filteredTasks, selectedTaskId])

  useEffect(() => {
    const filteredIds = new Set(filteredTasks.map(task => task.id))
    const inFilter = selectedComparisonIds.filter(id => filteredIds.has(id))
    if (inFilter.length === selectedComparisonIds.length) return
    setSelectedComparisonIds(inFilter)
  }, [filteredTasks, selectedComparisonIds])

  const selectedTask = useMemo(() => (
    selectedTaskId ? filteredTasks.find(task => task.id === selectedTaskId) || null : null
  ), [filteredTasks, selectedTaskId])
  const selectedIndex = useMemo(() => (
    selectedTask ? filteredTasks.findIndex(task => task.id === selectedTask.id) : -1
  ), [filteredTasks, selectedTask])

  const selectedComparisonRows = useMemo(() => (
    selectedComparisonIds.map(id => filteredTasks.find(task => task.id === id)).filter(Boolean)
  ), [filteredTasks, selectedComparisonIds])

  const comparisonPoints = useMemo(() => buildComparisonPoints(filteredTasks), [filteredTasks])
  const selectedComparison = useMemo(() => {
    if (selectedComparisonRows.length === 2) return analyzeComparability(selectedComparisonRows[0], selectedComparisonRows[1], lang)
    return null
  }, [lang, selectedComparisonRows])

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setNotice("")
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setProductMetricFamily("all")
    setSelectedTaskId(null)
    setSelectionSource("none")
    setNotice("")
  }

  const clearSelection = () => {
    setSelectedTaskId(null)
    setSelectionSource(Object.values(filters).some(value => value !== "all") ? "filter" : "none")
    setNotice("")
  }

  const selectTask = (task, source = "table") => {
    if (!task?.id) return
    setSelectedTaskId(task.id)
    setSelectionSource(source)
    setNotice("")
  }

  const toggleComparison = (taskId) => {
    setSelectedComparisonIds(prev => {
      if (prev.includes(taskId)) {
        setNotice("")
        return prev.filter(id => id !== taskId)
      }
      if (prev.length >= 2) {
        setNotice(lang === "zh" ? "最多选择两项任务进行可比性评估；请先移除一项。" : "Select up to two tasks for comparability assessment; remove one first.")
        return prev
      }
      setNotice("")
      return [...prev, taskId]
    })
  }

  const selectComparison = (comparison) => {
    if (!comparison?.taskA?.id || !comparison?.taskB?.id) return
    setSelectedComparisonIds([comparison.taskA.id, comparison.taskB.id])
    setSelectedTaskId(comparison.taskA.id)
    setSelectionSource("chart")
    setNotice("")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ModulePageHeader
        title={lang === "zh" ? "催化实验室" : "Catalysis Lab"}
        subtitle={lang === "zh"
          ? "组织 MOF 相关催化任务、反应条件、指标体系与可比性边界。"
          : "Organize MOF-related catalysis tasks, reaction conditions, metric systems, and comparability boundaries."}
        action={<CopyLinkButton hash="catalysis" ariaLabel={lang === "zh" ? "复制催化实验室链接" : "Copy Catalysis Lab link"} />}
      />

      <PrimaryWorkbenchCard
        title={lang === "zh" ? "催化筛选与数据工作台" : "Catalysis Screening and Data Workbench"}
        description={lang === "zh"
          ? "查看坐标轴图、筛选任务、比较反应条件，并整理结构化催化记录。"
          : "Inspect coordinate maps, filter tasks, compare reaction conditions, and curate structured catalysis records."}
        capabilities={lang === "zh"
          ? "多反应范围 · 坐标轴图 · 可比性评估 · 结构化记录"
          : "multi-reaction scope · coordinate map · comparability check · structured records"}
        metrics={workbenchMetrics}
        note={lang === "zh"
          ? "产甲酸候选筛选（formate candidate screening）仍保留为候选评分实验入口，用于在实验优化前参考水热稳定性、甲酸生成能垒与副产物风险证据。"
          : "Formate candidate screening remains available as a candidate-scoring entry for hydrothermal stability, formate-formation barrier, and byproduct-risk evidence before experimental optimization."}
        primaryLabel={lang === "zh" ? "进入工作台 →" : "Open workbench →"}
        onPrimary={() => setCatalysisView("map")}
        secondaryLabel={lang === "zh" ? "打开候选评分实验室" : "Open Candidate Scoring Lab"}
        onSecondary={() => onNavigate ? onNavigate("ecoscreen") : window.location.assign("#ecoscreen")}
      />

      {catalysisView !== "organic-acid" && (
        <OrganicAcidProjectEntry
          lang={lang}
          t={t}
          isNarrow={isNarrow}
          onOpen={() => setCatalysisView("organic-acid")}
        />
      )}

      <SecondaryTabs
        items={catalysisTabs}
        active={catalysisView}
        onChange={setCatalysisView}
        ariaLabel={lang === "zh" ? "催化实验室内容导航" : "Catalysis Lab content navigation"}
      />

      {catalysisView !== "organic-acid" && (
        <>
      <ScopeNoticeBar label={lang === "zh" ? "范围" : "Scope"} tone="scope">
        {lang === "zh"
          ? "覆盖多反应催化任务；有机酸路径目前作为案例，不代表唯一研究方向。"
          : "Covers multiple catalytic reaction tasks; the organic-acid pathway is currently a case example, not the only research direction."}
      </ScopeNoticeBar>

      <ScopeNoticeBar label={lang === "zh" ? "提示" : "Notice"} tone="warn">
        {lang === "zh"
          ? "该模块用于数据组织和可比性判断，不替代实验验证。"
          : "This module supports data organization and comparability judgment; it does not replace experimental validation."}
      </ScopeNoticeBar>
        </>
      )}

      {["overview", "map", "comparability"].includes(catalysisView) && (
        <CatalysisFilterBar filters={filters} onChange={updateFilter} onClear={clearFilters} lang={lang} t={t} />
      )}
      {notice && <Callout tone="warn">{notice}</Callout>}

      {catalysisView === "organic-acid" && (
        <OrganicAcidProject lang={lang} t={t} />
      )}

      {catalysisView === "overview" && (
        <>
      <ResultLayer
        number="00"
        title={lang === "zh" ? "催化数据工作流" : "Catalysis Data Workflow"}
        subtitle={lang === "zh"
          ? "点击每个步骤查看输入、处理、输出、证据状态与后续用途。"
          : "Click each step to inspect inputs, processing logic, outputs, evidence status, and downstream use."}
      >
        <WorkflowWorkbench
          activeStepId={activeWorkflowStepId}
          setActiveStepId={setActiveWorkflowStepId}
          lang={lang}
          isNarrow={isNarrow}
          t={t}
        />
      </ResultLayer>

      <ResultLayer
        number="01"
        title={lang === "zh" ? "CRITIC 辅助催化排序预览" : "CRITIC-assisted Catalysis Ranking Preview"}
        subtitle={lang === "zh"
          ? "展示稳定性、关键能垒和副产物风险如何通过 CRITIC 权重影响候选排序。"
          : "Shows how stability, barrier, and selectivity-risk signals shape candidate ranking through CRITIC weighting."}
      >
        <CriticPreviewWorkbench
          model={formateCriticModel}
          topCandidate={topFormateCandidate}
          lang={lang}
          isNarrow={isNarrow}
          onNavigate={onNavigate}
          t={t}
        />
      </ResultLayer>

      <ResultLayer
        number="02"
        title={lang === "zh" ? "总览坐标轴分析" : "Overview Axis Analysis"}
        subtitle={lang === "zh"
          ? "首屏以真实坐标轴图展示反应条件强度、数据准备度和证据状态。"
          : "The first analysis view uses a true axis chart for condition intensity, data readiness, and evidence status."}
      >
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.65fr) minmax(280px, 0.75fr)", gap: 14, alignItems: "stretch" }}>
          <ReactionPathwayScatter data={filteredTasks} selectedTaskId={selectedTask?.id} onSelectTask={(task) => selectTask(task, "chart")} lang={lang} t={t} height={chartHeight} />
          <SelectionInspector
            filters={filters}
            filteredTasks={filteredTasks}
            onClearSelection={clearSelection}
            onSelectTask={(task) => selectTask(task, "list")}
            selectedComparison={selectedComparison}
            selectedIndex={selectedIndex}
            selectedTask={selectedTask}
            selectionSource={selectionSource}
            lang={lang}
            t={t}
          />
        </div>
      </ResultLayer>
        </>
      )}

      {catalysisView === "map" && (
        <>
      <ResultLayer
        number="01"
        title={lang === "zh" ? "产物指标与可比性坐标" : "Product Metrics and Comparability Axes"}
        subtitle={lang === "zh"
          ? "用可切换坐标轴展示产物指标结构，并用四象限判断任务对是否可比。"
          : "Switch product metric axes and inspect task-pair comparability in a quadrant scatter."}
      >
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", gap: 14 }}>
          <ProductMetricScatter
            data={filteredTasks}
            selectedTaskId={selectedTask?.id}
            selectedProduct={productMetricFamily}
            xMetric={xMetric}
            yMetric={yMetric}
            onXMetricChange={setXMetric}
            onYMetricChange={setYMetric}
            onProductChange={setProductMetricFamily}
            onSelectTask={(task) => selectTask(task, "chart")}
            lang={lang}
            t={t}
            height={chartHeight}
          />
          <ComparabilityScatterQuadrant
            data={comparisonPoints}
            selectedComparisonId={selectedComparison?.id}
            onSelectComparison={selectComparison}
            lang={lang}
            t={t}
            height={chartHeight}
          />
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
          {(lang === "zh"
            ? ["坐标值为前端派生", "Demo / Pending curation", "不输出排序结论", "不做跨路径换算"]
            : ["front-end derived axes", "Demo / Pending curation", "no ranking conclusion", "no cross-pathway conversion formula"]
          ).map((item, index) => <BasisBadge key={item} tone={index < 2 ? "info" : "warn"}>{item}</BasisBadge>)}
        </div>
      </ResultLayer>
        </>
      )}

      {catalysisView === "comparability" && (
        <>
      <ResultLayer
        number="01"
        title={lang === "zh" ? "可比性评估与任务记录" : "Comparability Assessment and Task Records"}
        subtitle={lang === "zh"
          ? "选择两项任务进行可比性评估，并保留桌面表格 / 手机卡片的任务记录视图。"
          : "Select two tasks for comparability assessment while keeping the desktop table / mobile card record view."}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <SelectionInspector
            filters={filters}
            filteredTasks={filteredTasks}
            onClearSelection={clearSelection}
            onSelectTask={(task) => selectTask(task, "list")}
            selectedComparison={selectedComparison}
            selectedIndex={selectedIndex}
            selectedTask={selectedTask}
            selectionSource={selectionSource}
            lang={lang}
            t={t}
          />
        {isMobile ? (
          <CatalysisTaskCards
            tasks={filteredTasks}
            selectedTaskId={selectedTask?.id}
            selectedComparisonIds={selectedComparisonIds}
            onSelectTask={(task) => selectTask(task, "list")}
            onToggleComparison={toggleComparison}
            lang={lang}
            t={t}
          />
        ) : (
          <CatalysisTaskTable
            tasks={filteredTasks}
            selectedTaskId={selectedTask?.id}
            selectedComparisonIds={selectedComparisonIds}
            onSelectTask={(task) => selectTask(task, "list")}
            onToggleComparison={toggleComparison}
            lang={lang}
            t={t}
          />
        )}
        </div>
      </ResultLayer>
        </>
      )}

      {catalysisView === "curation" && (
        <>
      <ResultLayer
        number="01"
        title={lang === "zh" ? "有机酸案例研究 v0" : "Organic Acid Case Study v0"}
        subtitle={lang === "zh"
          ? "有机酸方向作为 framework-first 案例，用于说明字段框架、路径图、可比性逻辑和缺失证据。"
          : "The organic-acid direction is a framework-first case for schema, pathway, comparability, and missing-evidence logic."}
      >
        <OrganicAcidCaseStudy lang={lang} t={t} />
      </ResultLayer>

      <ResultLayer
        number="02"
        title={lang === "zh" ? "数据整理层与案例路径" : "Data Curation Layer and Case Pathway"}
        subtitle={lang === "zh"
          ? "生物质辅助 CO₂ / HCO₃⁻ 转化（Biomass-assisted conversion）保留为案例研究，不作为整个催化页的唯一叙事。"
          : "Biomass-assisted CO₂ / HCO₃⁻ conversion remains a case study, not the sole Catalysis Lab narrative."}
      >
        <CatalysisCurationLayer lang={lang} t={t} />
      </ResultLayer>
        </>
      )}
    </div>
  )
}
