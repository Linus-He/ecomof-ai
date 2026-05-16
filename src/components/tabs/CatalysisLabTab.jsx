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
import { CatalysisWorkflowDiagram } from "../methods"
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
        title={lang === "zh" ? "催化记录结构化流程" : "Catalysis Record Structuring Pipeline"}
        subtitle={lang === "zh"
          ? "先把原始催化记录拆成可复核表结构，再进入坐标图、任务表和 CRITIC case。"
          : "Raw catalysis records are structured into reviewable tables before coordinate maps, task tables, and CRITIC cases."}
      >
        <CatalysisWorkflowDiagram t={t} lang={lang} />
      </ResultLayer>

      <ResultLayer
        number="01"
        title={lang === "zh" ? "CRITIC-assisted catalysis ranking preview" : "CRITIC-assisted catalysis ranking preview"}
        subtitle={lang === "zh"
          ? "保留现有产甲酸路径 CRITIC 原型：d_stab / d_barrier / d_select、G 硬筛、D_raw、D_expected、confidence_Q 与数据缺口建议。"
          : "Retains the existing formate-pathway CRITIC prototype: d_stab / d_barrier / d_select, G hard screening, D_raw, D_expected, confidence_Q, and data-gap recommendations."}
      >
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13, display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) minmax(220px, 0.55fr)", gap: 12, alignItems: "start" }}>
            <div style={{ display: "grid", gap: 9 }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>
                {lang === "zh" ? "d_stab / d_barrier / d_select 权重" : "d_stab / d_barrier / d_select weights"}
              </div>
              {formateCriticModel.indicatorDiagnostics.map(row => (
                <div key={row.key} style={{ display: "grid", gridTemplateColumns: "110px minmax(0, 1fr) 54px", gap: 8, alignItems: "center", color: t.muted, fontSize: 11.5 }}>
                  <span style={{ color: t.textStrong, fontWeight: 850 }}>{lang === "zh" ? row.zhLabel : row.label}</span>
                  <span style={{ height: 7, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${Math.round(row.criticWeight * 100)}%`, background: t.accent }} />
                  </span>
                  <span>{row.criticWeight.toFixed(3)}</span>
                </div>
              ))}
            </div>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
                {lang === "zh" ? "Top candidate by D_expected" : "Top candidate by D_expected"}
              </div>
              <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 920, marginTop: 6 }}>{topFormateCandidate?.name || "—"}</div>
              <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 6 }}>
                D_expected {topFormateCandidate ? Number(topFormateCandidate.D_expected).toFixed(3) : "—"} · confidence_Q {topFormateCandidate ? Number(topFormateCandidate.confidence_Q_clipped).toFixed(2) : "—"}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 9 }}>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
              <strong style={{ color: t.textStrong }}>{lang === "zh" ? "confidence_Q note" : "confidence_Q note"}: </strong>
              {lang === "zh" ? "D_expected 会用 confidence_Q 对 D_raw 进行置信度修正。" : "D_expected adjusts D_raw with confidence_Q."}
            </div>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
              <strong style={{ color: t.textStrong }}>{lang === "zh" ? "Robustness" : "Robustness"}: </strong>
              {lang === "zh" ? formateCriticModel.robustness?.stability?.zh : formateCriticModel.robustness?.stability?.label}
              {` · max shift ${formateCriticModel.robustness?.maxRemoveOneShift ?? "—"}`}
            </div>
            <button
              type="button"
              onClick={() => onNavigate ? onNavigate("ecoscreen") : window.location.assign("#ecoscreen")}
              style={{ ...toolbarBtn(t), justifyContent: "center", color: t.accentText, borderColor: t.accent, minHeight: 42 }}
            >
              {lang === "zh" ? "打开完整 case" : "Open full case"}
            </button>
          </div>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
            {lang === "zh" ? "数据缺口建议和 sensitivity ranks 仍由现有 criticScoring.js 原型生成。" : "Data-gap recommendations and sensitivity ranks still come from the existing criticScoring.js prototype."}
          </div>
        </div>
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
