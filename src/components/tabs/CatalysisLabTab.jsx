import { useMemo, useState } from "react"
import { BasisBadge, Callout, ResultLayer, useLang, useT, useViewport } from "../../shared"
import { CatalysisCurationLayer } from "../catalysis/CatalysisCurationLayer"
import { CatalysisDetailPanel } from "../catalysis/CatalysisDetailPanel"
import { CatalysisFilterBar } from "../catalysis/CatalysisFilterBar"
import { CatalysisHero } from "../catalysis/CatalysisHero"
import { CatalysisTaskCards } from "../catalysis/CatalysisTaskCards"
import { CatalysisTaskTable } from "../catalysis/CatalysisTaskTable"
import { ComparabilityScatterQuadrant } from "../catalysis/ComparabilityScatterQuadrant"
import { ProductMetricScatter } from "../catalysis/ProductMetricScatter"
import { ReactionPathwayScatter } from "../catalysis/ReactionPathwayScatter"
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

export function CatalysisLabTab() {
  const t = useT()
  const { lang } = useLang()
  const { isMobile, isNarrow } = useViewport()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedTaskId, setSelectedTaskId] = useState("glucose-hco3-formic-case")
  const [selectedComparisonIds, setSelectedComparisonIds] = useState(["glucose-hco3-formic-case", "co2-formate-electro"])
  const [xMetric, setXMetric] = useState("yield")
  const [yMetric, setYMetric] = useState("selectivity")
  const [productMetricFamily, setProductMetricFamily] = useState("all")
  const [notice, setNotice] = useState("")

  const localizedTasks = useMemo(() => (
    CATALYSIS_TASKS.map(task => enrichTaskForCharts(task, lang))
  ), [lang])

  const filteredTasks = useMemo(() => filterTasks(localizedTasks, filters), [localizedTasks, filters])
  const stats = useMemo(() => buildStats(localizedTasks), [localizedTasks])

  const selectedTask = useMemo(() => (
    localizedTasks.find(task => task.id === selectedTaskId) || filteredTasks[0] || localizedTasks[0]
  ), [filteredTasks, localizedTasks, selectedTaskId])

  const selectedComparisonRows = useMemo(() => (
    selectedComparisonIds.map(id => localizedTasks.find(task => task.id === id)).filter(Boolean)
  ), [localizedTasks, selectedComparisonIds])

  const comparisonPoints = useMemo(() => buildComparisonPoints(filteredTasks.length > 1 ? filteredTasks : localizedTasks), [filteredTasks, localizedTasks])
  const selectedComparison = useMemo(() => {
    if (selectedComparisonRows.length === 2) return analyzeComparability(selectedComparisonRows[0], selectedComparisonRows[1], lang)
    return comparisonPoints[0] || analyzeComparability(null, null, lang)
  }, [comparisonPoints, lang, selectedComparisonRows])

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setNotice("")
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setProductMetricFamily("all")
    setNotice("")
  }

  const selectTask = (task) => {
    setSelectedTaskId(task.id)
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
    setSelectedComparisonIds([comparison.taskA.id, comparison.taskB.id])
    setSelectedTaskId(comparison.taskA.id)
    setNotice("")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <CatalysisHero lang={lang} stats={stats} t={t} />
      <CatalysisFilterBar filters={filters} onChange={updateFilter} onClear={clearFilters} lang={lang} t={t} />
      {notice && <Callout tone="warn">{notice}</Callout>}

      <ResultLayer
        number="01"
        title={lang === "zh" ? "总览坐标轴分析" : "Overview Axis Analysis"}
        subtitle={lang === "zh"
          ? "首屏以真实坐标轴图展示反应条件强度、数据准备度和证据状态。"
          : "The first analysis view uses a true axis chart for condition intensity, data readiness, and evidence status."}
      >
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.65fr) minmax(280px, 0.75fr)", gap: 14, alignItems: "stretch" }}>
          <ReactionPathwayScatter data={filteredTasks} selectedTaskId={selectedTask?.id} onSelectTask={selectTask} lang={lang} t={t} />
          <CatalysisDetailPanel selectedTask={selectedTask} selectedComparison={selectedComparison} lang={lang} t={t} />
        </div>
      </ResultLayer>

      <ResultLayer
        number="02"
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
            onSelectTask={selectTask}
            lang={lang}
            t={t}
          />
          <ComparabilityScatterQuadrant
            data={comparisonPoints}
            selectedComparisonId={selectedComparison?.id}
            onSelectComparison={selectComparison}
            lang={lang}
            t={t}
          />
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
          {(lang === "zh"
            ? ["坐标值为前端派生", "Demo / Pending curation", "不输出排序结论", "不做跨路径换算"]
            : ["front-end derived axes", "Demo / Pending curation", "no ranking conclusion", "no cross-pathway conversion formula"]
          ).map((item, index) => <BasisBadge key={item} tone={index < 2 ? "info" : "warn"}>{item}</BasisBadge>)}
        </div>
      </ResultLayer>

      <ResultLayer
        number="03"
        title={lang === "zh" ? "催化任务表" : "Catalysis Task Records"}
        subtitle={lang === "zh"
          ? "桌面端展示表格，手机端切换为任务卡片，避免 11 列表格溢出。"
          : "Desktop uses a table; mobile switches to cards to avoid wide-table overflow."}
      >
        {isMobile ? (
          <CatalysisTaskCards
            tasks={filteredTasks}
            selectedTaskId={selectedTask?.id}
            selectedComparisonIds={selectedComparisonIds}
            onSelectTask={selectTask}
            onToggleComparison={toggleComparison}
            lang={lang}
            t={t}
          />
        ) : (
          <CatalysisTaskTable
            tasks={filteredTasks}
            selectedTaskId={selectedTask?.id}
            selectedComparisonIds={selectedComparisonIds}
            onSelectTask={selectTask}
            onToggleComparison={toggleComparison}
            lang={lang}
            t={t}
          />
        )}
      </ResultLayer>

      <ResultLayer
        number="04"
        title={lang === "zh" ? "数据整理层与案例路径" : "Data Curation Layer and Case Pathway"}
        subtitle={lang === "zh"
          ? "Biomass-assisted CO₂ / HCO₃⁻ conversion 保留为案例研究，不作为整个催化页的唯一叙事。"
          : "Biomass-assisted CO₂ / HCO₃⁻ conversion remains a case study, not the sole Catalysis Lab narrative."}
      >
        <CatalysisCurationLayer lang={lang} t={t} />
      </ResultLayer>
    </div>
  )
}
