// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  BasisBadge,
  Callout,
  ChemicalFormula,
  ChemicalText,
  CopyLinkButton,
  FONT_SANS,
  PageHeader,
  SCIENTIFIC_TOKEN_FONT,
  SectionTitle,
  getGasAdsorptionRecordsDemo,
  getGasAdsorptionRecordsV1,
  getGasAdsorptionRecordsV2,
  getGasAdsorptionV2CollectionReport,
  getGasAdsorptionV21IastReport,
  getMofIdentityResolutionReport,
  getGasStructureProxyValidationReport,
  formatDemoLabel,
  formatGasPairLabel,
  formatPending,
  formatPercent,
  formatRiskPenalty,
  formatScore100,
  useLang,
  useT,
  useViewport,
} from "../../shared"
import {
  getEvidenceScore,
  getScenarioWeights,
  getStabilityScore,
} from "../../utils/gasScoring"
import { buildGasSeparationScreening } from "../../utils/gasSeparationScreening"
import { buildGasSepSummary, buildGasSepExportRows } from "../../utils/summary/buildGasSepSummary"
import { GasSepDatabaseSummaryCard } from "../data/GasSepDatabaseSummaryCard"
import { GasMetricHeatmap } from "../gas/GasMetricHeatmap"
import { GasMetricInspector } from "../gas/GasMetricInspector"
import { GasRadarComparison } from "../gas/GasRadarComparison"
import { GasInteractionDiagnostics } from "../gas/GasInteractionDiagnostics"
import { GasTopRankingChart } from "../gas/GasTopRankingChart"
import { GasTradeoffSummary } from "../gas/GasTradeoffSummary"
import { GasValidationRecommendation } from "../gas/GasValidationRecommendation"
import { GasDataQualityPanel } from "../gas/GasDataQualityPanel"
import { GasDataStatusBadge } from "../gas/GasDataStatusBadge"
import { GasFieldProvenanceButton } from "../gas/GasFieldProvenanceButton"
import { GasRecordSourcePanel } from "../gas/GasRecordSourcePanel"
import { GasUnitNormalizationNote } from "../gas/GasUnitNormalizationNote"
import { normalizeGasRecords } from "../gas/gasDataNormalize"
import { dataTypeLabel } from "../gas/gasEvidence"
import { getFieldSource } from "../gas/gasDataSchema"

const SCENARIOS = [
  {
    gasPair: "CO2/N2",
    applicationScenario: "flue gas carbon capture",
    labelZh: "CO₂/N₂：烟气碳捕集",
    labelEn: "CO₂/N₂: flue gas carbon capture",
    defaultRatio: "15/85",
    primaryGas: "CO2",
    secondaryGas: "N2",
    mechanismZh: ["四极矩驱动 CO₂ 亲和", "孔径匹配和极性位点", "湿烟气需要水稳定性", "再生能耗由 Qst 和工作容量共同约束"],
    mechanismEn: ["CO₂ quadrupole affinity", "Pore matching and polar sites", "Wet flue gas needs water stability", "Regeneration is constrained by Qst and working capacity"],
  },
  {
    gasPair: "CO2/CH4",
    applicationScenario: "natural gas upgrading",
    labelZh: "CO₂/CH₄：天然气净化",
    labelEn: "CO₂/CH₄: natural gas upgrading",
    defaultRatio: "50/50",
    primaryGas: "CO2",
    secondaryGas: "CH4",
    mechanismZh: ["CO₂ 优先吸附提升甲烷纯度", "需要控制 CH₄ 损失", "中高压下工作容量更关键", "稳定性决定循环使用窗口"],
    mechanismEn: ["Preferential CO₂ adsorption upgrades methane", "Methane loss must be controlled", "Working capacity matters at moderate pressure", "Stability defines cyclic operating window"],
  },
  {
    gasPair: "H2/CO2",
    applicationScenario: "hydrogen purification",
    labelZh: "H₂/CO₂：氢气纯化",
    labelEn: "H₂/CO₂: hydrogen purification",
    defaultRatio: "75/25",
    primaryGas: "H2",
    secondaryGas: "CO2",
    mechanismZh: ["优先滞留 CO₂ 杂质", "H₂ 回收率需要过程级评估", "压力摆动再生窗口重要", "高亲和位点可能提高再生负担"],
    mechanismEn: ["Preferentially retains CO₂ impurity", "H₂ recovery needs process assessment", "PSA regenerability window matters", "Strong affinity can increase regeneration burden"],
  },
  {
    gasPair: "O2/N2",
    applicationScenario: "air separation",
    labelZh: "O₂/N₂：空气分离",
    labelEn: "O₂/N₂: air separation",
    defaultRatio: "21/79",
    primaryGas: "O2",
    secondaryGas: "N2",
    mechanismZh: ["分子尺寸接近，选择性挑战大", "开放金属位点可能改变 O₂ 亲和", "安全与氧化稳定性需要验证", "低证据记录不得直接排名"],
    mechanismEn: ["Similar molecular sizes make selectivity difficult", "Open metal sites may shift O₂ affinity", "Safety and oxidative stability need checks", "Weak-evidence records should not be ranked strictly"],
  },
  {
    gasPair: "VOC/N2",
    applicationScenario: "VOC capture",
    labelZh: "VOC/N₂：挥发性有机物捕集",
    labelEn: "VOC/N₂: VOC capture",
    defaultRatio: "1/99",
    primaryGas: "VOC",
    secondaryGas: "N2",
    mechanismZh: ["高吸附量通常来自孔体积和疏水环境", "再生成本受吸附热控制", "湿度竞争可能改变有效容量", "材料热/水稳定性决定循环寿命"],
    mechanismEn: ["High uptake often follows pore volume and hydrophobicity", "Regeneration cost is tied to adsorption heat", "Humidity can reduce effective capacity", "Thermal and water stability shape cycle life"],
  },
  {
    gasPair: "CH4/N2",
    applicationScenario: "methane nitrogen rejection",
    labelZh: "CH₄/N₂：甲烷氮气分离",
    labelEn: "CH₄/N₂: methane nitrogen rejection",
    defaultRatio: "50/50",
    primaryGas: "CH4",
    secondaryGas: "N2",
    mechanismZh: ["CH₄/N₂ 数据作为其他气体体系覆盖", "候选优先级依赖选择性、工作容量与压力窗口", "字段级溯源用于区分推断与模拟来源", "进入工艺判断前需要穿透验证"],
    mechanismEn: ["CH₄/N₂ records cover other gas systems", "Priority depends on selectivity, working capacity, and pressure window", "Field provenance separates inferred and simulated sources", "Breakthrough validation is needed before process claims"],
  },
]

const PRIORITIES = [
  "Balanced",
  "High uptake",
  "High selectivity",
  "High working capacity",
  "High regenerability",
  "Stability first",
]

const METRICS = {
  primaryUptake: { zh: "吸附量", en: "Uptake", unit: "mmol/g" },
  selectivity: { zh: "选择性", en: "Selectivity", unit: "" },
  workingCapacity: { zh: "工作容量", en: "Working capacity", unit: "mmol/g" },
  regenerability: { zh: "可再生性", en: "Regenerability", unit: "%" },
  stability: { zh: "稳定性", en: "Stability", unit: "" },
  evidence: { zh: "证据置信度", en: "Evidence confidence", unit: "" },
  confidence: { zh: "记录置信度", en: "Record confidence", unit: "" },
}

const TABLE_COLUMNS = [
  ["rank", "Rank", "名次"],
  ["displayName", "MOF", "MOF"],
  ["sourceDatabase", "Source", "来源"],
  ["dataGrade", "Grade", "数据等级"],
  ["gasPair", "Gas pair", "气体对"],
  ["primaryUptake", "Uptake", "吸附量"],
  ["selectivity", "Selectivity", "选择性"],
  ["workingCapacity", "Working capacity", "工作容量"],
  ["regenerability", "Regenerability", "可再生性"],
  ["waterStability", "Water stability", "水稳定性"],
  ["evidenceLevel", "Evidence level", "证据等级"],
  ["dataType", "Data type", "数据类型"],
  ["score", "Score", "分数"],
]

const CHART_COLORS = ["#2F7D7B", "#D2862F", "#4E72B8", "#7B61A9", "#B95F6B", "#64748B"]
const COLOR_BY_EVIDENCE = { A: "#2F7D7B", B: "#4E72B8", C: "#D2862F", D: "#64748B" }
const COLOR_BY_TYPE = {
  experimental_literature: "#2F7D7B",
  experimental_literature_seed: "#2F7D7B",
  literature_seed: "#7B61A9",
  simulated_gcmc: "#4E72B8",
  simulated_iast: "#4E72B8",
  predicted_ml: "#D2862F",
  derived_metric: "#B87333",
  demo_placeholder: "#64748B",
}

const ROADMAP = [
  ["Descriptor screening", "描述符初筛", "Check pore size, surface area, polarity, stability, and data completeness."],
  ["Adsorption simulation", "吸附模拟", "Run single-component and mixture adsorption models under matched conditions."],
  ["Stability check", "稳定性检查", "Validate water, thermal, oxidative, and cycling stability for the target stream."],
  ["Experimental validation", "实验验证", "Measure isotherms, IAST inputs, and breakthrough curves for selected MOFs."],
  ["Process-level assessment", "过程级评估", "Translate material data into PSA/VSA/TSA productivity, purity, recovery, and energy."],
]

function text(lang, zh, en) {
  return lang === "zh" ? zh : en
}

function scenarioFor(gasPair) {
  return SCENARIOS.find(item => item.gasPair === gasPair) || SCENARIOS[0]
}

function metricLabel(key, lang) {
  const meta = METRICS[key]
  return meta ? text(lang, meta.zh, meta.en) : key
}

function formatNumber(value, digits = 1) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "pending"
  return Number.isInteger(number) ? String(number) : number.toFixed(digits)
}

function formatScore(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "pending"
  return String(Math.round(number))
}

function valueForMetric(record, metric) {
  if (!record) return null
  if (metric === "stability") return getStabilityScore(record)
  if (metric === "evidence") return getEvidenceScore(record)
  const value = metric === "selectivity"
    ? (record.selectivity ?? record.metrics?.selectivity ?? record.iaSTSelectivity ?? record.metrics?.iaSTSelectivity)
    : (record[metric] ?? record.metrics?.[metric])
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null
  return Number.isFinite(Number(value)) ? Number(value) : null
}

function formatMetricValue(record, metric, lang) {
  const value = valueForMetric(record, metric)
  if (value == null) return formatPending(lang)
  if (metric === "stability" || metric === "evidence" || metric === "confidence") return formatPercent(value, { lang, normalized: true })
  if (metric === "regenerability") return formatPercent(value, { lang })
  const unit = METRICS[metric]?.unit
  return `${formatNumber(value)}${unit ? ` ${unit}` : ""}`
}

function statusTone(value = "") {
  const label = String(value).toLowerCase()
  if (label.includes("high") || label === "a" || label.includes("experimental")) return "calc"
  if (label.includes("moderate") || label === "b" || label.includes("simulated")) return "info"
  if (label.includes("low") || label.includes("predicted") || label === "c") return "warn"
  return "proxy"
}

function smartDomain(values, metric) {
  const nums = values.map(Number).filter(Number.isFinite)
  const defaultSpan = metric === "selectivity" ? 8 : metric === "primaryUptake" ? 1.2 : metric === "workingCapacity" ? 0.9 : 0.2
  if (!nums.length) return [0, defaultSpan]
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  if (min === max) {
    const span = Math.max(defaultSpan, Math.abs(min) * 0.18)
    return [Math.max(0, min - span / 2), max + span / 2]
  }
  const pad = Math.max((max - min) * 0.16, defaultSpan * 0.12)
  return [Math.max(0, min - pad), max + pad]
}

function cardStyle(t, extra = {}) {
  return {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    padding: 16,
    minWidth: 0,
    ...extra,
  }
}

function surfaceStyle(t, extra = {}) {
  return {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: 12,
    minWidth: 0,
    ...extra,
  }
}

function FormField({ label, children, t }) {
  return (
    <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{label}</span>
      {children}
    </label>
  )
}
function SelectControl({ value, onChange, children, t, ariaLabel }) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={event => onChange(event.target.value)}
      style={{
        minHeight: 38,
        width: "100%",
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        color: t.text,
        fontSize: 12,
        padding: "8px 10px",
        outline: "none",
      }}
    >
      {children}
    </select>
  )
}

function NumberControl({ value, min, max, step, onChange, t, suffix }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 78px", gap: 8, alignItems: "center" }}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        style={{ width: "100%" }}
      />
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 850, padding: "8px 9px", textAlign: "center" }}>
        {value} {suffix}
      </div>
    </div>
  )
}

function LegendRow({ items, t }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", minWidth: 0 }}>
      {items.map((item, index) => (
        <span key={item.label} style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, color: t.muted, display: "inline-flex", fontSize: 11, fontWeight: 760, gap: 6, lineHeight: 1.2, maxWidth: "100%", padding: "5px 8px" }}>
          <span style={{ background: item.color || CHART_COLORS[index % CHART_COLORS.length], borderRadius: 999, flex: "0 0 auto", height: 9, width: 9 }} />
          <span style={{ overflowWrap: "anywhere" }}><ChemicalText value={item.label} /></span>
        </span>
      ))}
    </div>
  )
}

function Overview({ ranked, scenario, t, lang, isMobile }) {
  const top = ranked[0]
  const weights = getScenarioWeights(scenario.gasPair, scenario.targetPriority)
  const evidenceMix = ranked.reduce((acc, row) => ({ ...acc, [row.evidenceLevel]: (acc[row.evidenceLevel] || 0) + 1 }), {})
  return (
    <section style={cardStyle(t)}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <SectionTitle>{text(lang, "Gas Separation Overview", "Gas Separation Overview")}</SectionTitle>
          <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, margin: "7px 0 0" }}>
            {text(
              lang,
              "GasSep 现在按具体气体对和工况筛选候选材料；所有推荐都保留数据类型、证据等级与字段级溯源，不替代真实 IAST、GCMC、穿透实验或过程模拟。",
              "GasSep screens candidates by gas pair and operating condition. Every recommendation keeps data type, evidence level, and field-level provenance boundaries; it does not replace IAST, GCMC, breakthrough experiments, or process simulation."
            )}
          </p>
        </div>
        <BasisBadge tone="warn" aria-label={formatDemoLabel(lang)} title={formatDemoLabel(lang)}>{formatDemoLabel(lang)}</BasisBadge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 14 }}>
        <MetricTile label={text(lang, "当前气体对", "Gas pair")} value={formatGasPairLabel(scenario.gasPair)} note={scenario.applicationScenario} t={t} />
        <MetricTile label={text(lang, "候选数量", "Candidates")} value={ranked.length} note={text(lang, "当前场景数据", "scenario records")} t={t} />
        <MetricTile label={text(lang, "Top MOF", "Top MOF")} value={top?.displayName || formatPending(lang)} note={top ? formatScore100(top.score, lang) : formatPending(lang)} t={t} />
        <MetricTile label={text(lang, "证据等级分布", "Evidence mix")} value={Object.entries(evidenceMix).map(([key, count]) => `${key}:${count}`).join(" · ") || formatPending(lang)} note={text(lang, "A/B/C/D 证据等级", "A/B/C/D evidence levels")} t={t} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
        {Object.entries(weights).map(([key, value]) => (
          <BasisBadge key={key} tone="info">{metricLabel(key, lang)} {Math.round(value * 100)}%</BasisBadge>
        ))}
      </div>
    </section>
  )
}

function MetricTile({ label, value, note, t }) {
  return (
    <div style={surfaceStyle(t)}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: t.textStrong, fontFamily: typeof value === "number" ? FONT_SANS : undefined, fontSize: 18, fontWeight: 920, lineHeight: 1.2, marginTop: 5, overflowWrap: "anywhere" }}><ChemicalText value={value ?? "pending"} /></div>
      {note ? <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.45, marginTop: 5, overflowWrap: "anywhere" }}><ChemicalText value={note} /></div> : null}
    </div>
  )
}

function ScenarioBuilder({ scenario, setScenario, t, lang, isMobile, isNarrow }) {
  const updateGasPair = gasPair => {
    const next = scenarioFor(gasPair)
    setScenario(prev => ({
      ...prev,
      gasPair,
      applicationScenario: next.applicationScenario,
      mixtureRatio: next.defaultRatio,
    }))
  }

  return (
    <section style={cardStyle(t)}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <SectionTitle>{text(lang, "气体分离场景构建器", "Gas Separation Scenario Builder")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
            {text(lang, "切换气体体系后，排序、图表、机制解释和评分权重会同步更新。", "Changing the gas system updates ranking, charts, mechanism notes, and scoring weights together.")}
          </div>
        </div>
        <BasisBadge tone="calc">{text(lang, "6 个可切换场景", "6 scenarios")}</BasisBadge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))", gap: 11 }}>
        <FormField label={text(lang, "气体对", "Gas pair")} t={t}>
          <SelectControl value={scenario.gasPair} onChange={updateGasPair} t={t} ariaLabel="gas pair">
            {SCENARIOS.map(item => <option key={item.gasPair} value={item.gasPair}>{text(lang, item.labelZh, item.labelEn)}</option>)}
          </SelectControl>
        </FormField>
        <FormField label={text(lang, "应用场景", "Application scenario")} t={t}>
          <SelectControl value={scenario.applicationScenario} onChange={value => setScenario(prev => ({ ...prev, applicationScenario: value }))} t={t} ariaLabel="application scenario">
            {SCENARIOS.map(item => <option key={item.applicationScenario} value={item.applicationScenario}>{item.applicationScenario}</option>)}
          </SelectControl>
        </FormField>
        <FormField label={text(lang, "目标优先级", "Target priority")} t={t}>
          <SelectControl value={scenario.targetPriority} onChange={value => setScenario(prev => ({ ...prev, targetPriority: value }))} t={t} ariaLabel="target priority">
            {PRIORITIES.map(item => <option key={item} value={item}>{item}</option>)}
          </SelectControl>
        </FormField>
        <FormField label={text(lang, "温度 K", "Temperature K")} t={t}>
          <NumberControl value={scenario.temperatureK} min={273} max={373} step={1} onChange={value => setScenario(prev => ({ ...prev, temperatureK: value }))} t={t} suffix="K" />
        </FormField>
        <FormField label={text(lang, "吸附压 bar", "Adsorption pressure bar")} t={t}>
          <NumberControl value={scenario.adsorptionPressureBar ?? scenario.pressureBar} min={0.1} max={20} step={0.1} onChange={value => setScenario(prev => ({ ...prev, pressureBar: value, adsorptionPressureBar: value }))} t={t} suffix="bar" />
        </FormField>
        <FormField label={text(lang, "脱附压 bar", "Desorption pressure bar")} t={t}>
          <NumberControl value={scenario.desorptionPressureBar ?? 0.15} min={0.01} max={5} step={0.01} onChange={value => setScenario(prev => ({ ...prev, desorptionPressureBar: value }))} t={t} suffix="bar" />
        </FormField>
        <FormField label={text(lang, "混合比例", "Mixture ratio")} t={t}>
          <input
            value={scenario.mixtureRatio}
            onChange={event => setScenario(prev => ({ ...prev, mixtureRatio: event.target.value }))}
            style={{ minHeight: 38, width: "100%", boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 12, padding: "8px 10px", outline: "none" }}
          />
        </FormField>
      </div>
    </section>
  )
}

function ConditionSummary({ ranked, scenario, t, lang, isMobile }) {
  const top = ranked[0]
  const avg = key => {
    const values = ranked.map(row => valueForMetric(row, key)).filter(value => value != null)
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
  }
  return (
    <section style={cardStyle(t)}>
      <SectionTitle>{text(lang, "Condition Summary + Key Metrics", "Condition Summary + Key Metrics")}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
        <MetricTile label={text(lang, "工况", "Condition")} value={`${scenario.temperatureK} K`} note={`${scenario.adsorptionPressureBar ?? scenario.pressureBar}/${scenario.desorptionPressureBar ?? 0.15} bar · ${scenario.mixtureRatio}`} t={t} />
        <MetricTile label={text(lang, "平均吸附量", "Avg uptake")} value={avg("primaryUptake") == null ? formatPending(lang) : `${formatNumber(avg("primaryUptake"))} mmol/g`} note={formatGasPairLabel(scenario.gasPair)} t={t} />
        <MetricTile label={text(lang, "平均选择性", "Avg selectivity")} value={avg("selectivity") == null ? formatPending(lang) : formatNumber(avg("selectivity"))} note={text(lang, "当前场景", "scenario")} t={t} />
        <MetricTile label={text(lang, "平均工作容量", "Avg capacity")} value={avg("workingCapacity") == null ? formatPending(lang) : `${formatNumber(avg("workingCapacity"))} mmol/g`} note={text(lang, "工作容量", "working capacity")} t={t} />
        <MetricTile label={text(lang, "推荐候选", "Recommended")} value={top?.displayName || formatPending(lang)} note={top ? formatScore100(top.score, lang) : formatPending(lang)} t={t} />
      </div>
    </section>
  )
}

function GasCoverageNotice({ coverage, collectionReport, iastReport, identityReport, proxyReport, t, lang }) {
  if (!coverage) return null
  const gradeLine = [
    `experimental ${coverage.experimental || 0}`,
    `computed ${coverage.computed || 0}`,
    `IAST ${coverage.computedIast || 0}`,
    `seed ${coverage.seed || 0}`,
  ].join(" · ")
  return (
    <section style={cardStyle(t, { borderLeft: `4px solid ${coverage.thin ? t.warn : t.accent}` })}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <SectionTitle>{text(lang, "数据覆盖与薄数据状态", "Data Coverage and Thin-State")}</SectionTitle>
          <div style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.6, marginTop: 7 }}>
            {text(
              lang,
              `该气对当前有 ${coverage.total} 个 MOF 记录；可用于选择性排序 ${coverage.withSelectivity} 条，其中 IAST 计算 ${coverage.withIastSelectivity} 条、实验/来源选择性 ${coverage.withExperimentalSelectivity} 条。等温线 ${coverage.withIsotherm} 条，工作容量 ${coverage.withWorkingCapacity} 条，已链到结构库 ${coverage.linkedToStructure} 条。`,
              `This gas pair has ${coverage.total} MOF records; ${coverage.withSelectivity} can be ranked by selectivity, including ${coverage.withIastSelectivity} IAST-computed values and ${coverage.withExperimentalSelectivity} source/experimental selectivity values. Isotherm records: ${coverage.withIsotherm}; working-capacity fields: ${coverage.withWorkingCapacity}; structure-linked records: ${coverage.linkedToStructure}.`
            )}
          </div>
          {coverage.thin ? (
            <div style={{ color: t.warn, fontSize: 11.8, lineHeight: 1.55, marginTop: 7 }}>
              {text(lang, "薄数据提示：选择性或目标气对覆盖不足，排序只能作为可追溯筛选线索。", "Thin-data note: selectivity or gas-pair coverage is limited; ranking is only a traceable screening signal.")}
            </div>
          ) : null}
        </div>
        <BasisBadge tone={coverage.thin ? "warn" : "calc"}>{gradeLine}</BasisBadge>
      </div>
      {collectionReport?.summary ? (
        <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 8 }}>
          {text(
            lang,
            `v2.1 批次：${collectionReport.summary.nistRecordCount || 0} 条 NIST 等温线记录；IAST ${iastReport?.summary?.computedIastCount ?? collectionReport.summary.computedIastSelectivityCount ?? 0} 条；实体解析率 ${Math.round((identityReport?.summary?.gasStructureResolutionRate ?? collectionReport.summary.gasStructureResolutionRate ?? 0) * 100)}%；结构代理状态 ${proxyReport?.summary?.status || collectionReport.summary.proxyValidationStatus || "pending"}。`,
            `v2.1 batch: ${collectionReport.summary.nistRecordCount || 0} NIST isotherm records; IAST ${iastReport?.summary?.computedIastCount ?? collectionReport.summary.computedIastSelectivityCount ?? 0}; identity resolution ${Math.round((identityReport?.summary?.gasStructureResolutionRate ?? collectionReport.summary.gasStructureResolutionRate ?? 0) * 100)}%; structure-proxy status ${proxyReport?.summary?.status || collectionReport.summary.proxyValidationStatus || "pending"}.`
          )}
        </div>
      ) : null}
    </section>
  )
}

function PerformanceMap({ ranked, selectedId, onSelect, chartConfig, setChartConfig, t, lang, isMobile, isNarrow }) {
  const [tooltip, setTooltip] = useState(null)
  const xMetric = chartConfig.x
  const yMetric = chartConfig.y
  const bubbleMetric = chartConfig.bubble
  const colorMetric = chartConfig.color
  const width = 760
  const height = 420
  const margin = { top: 22, right: 28, bottom: 54, left: 62 }
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom
  const xDomain = smartDomain(ranked.map(row => valueForMetric(row, xMetric)), xMetric)
  const yDomain = smartDomain(ranked.map(row => valueForMetric(row, yMetric)), yMetric)
  const bubbleValues = ranked.map(row => valueForMetric(row, bubbleMetric)).filter(value => value != null)
  const bubbleDomain = smartDomain(bubbleValues, bubbleMetric)
  const xScale = value => margin.left + ((value - xDomain[0]) / Math.max(0.0001, xDomain[1] - xDomain[0])) * plotW
  const yScale = value => margin.top + plotH - ((value - yDomain[0]) / Math.max(0.0001, yDomain[1] - yDomain[0])) * plotH
  const rScale = value => {
    if (value == null) return 7
    const normalized = (value - bubbleDomain[0]) / Math.max(0.0001, bubbleDomain[1] - bubbleDomain[0])
    return 7 + Math.max(0, Math.min(1, normalized)) * 15
  }
  const colorFor = row => colorMetric === "dataType"
    ? (COLOR_BY_TYPE[row.dataType] || "#64748B")
    : (COLOR_BY_EVIDENCE[row.evidenceLevel] || "#64748B")
  const legendItems = Array.from(new Set(ranked.map(row => colorMetric === "dataType" ? row.dataType : `Evidence ${row.evidenceLevel}`))).map(label => ({
    label,
    color: colorMetric === "dataType" ? (COLOR_BY_TYPE[label] || "#64748B") : (COLOR_BY_EVIDENCE[label.replace("Evidence ", "")] || "#64748B"),
  }))
  const ticks = domain => [0, 0.25, 0.5, 0.75, 1].map(part => domain[0] + (domain[1] - domain[0]) * part)

  return (
    <section style={cardStyle(t)}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <SectionTitle>{text(lang, "性能图谱", "Interactive Performance Map")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
            {text(lang, "图例在绘图区外；SVG 内只保留点、轴、网格和必要坐标标签。", "Legend sits outside the plot; SVG only carries points, axes, grid, and compact axis labels.")}
          </div>
        </div>
        <LegendRow items={legendItems} t={t} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 9, marginTop: 12 }}>
        {[
          ["x", text(lang, "横轴", "x-axis"), ["primaryUptake", "selectivity", "workingCapacity"]],
          ["y", text(lang, "纵轴", "y-axis"), ["selectivity", "primaryUptake", "regenerability"]],
          ["bubble", text(lang, "气泡大小", "bubble size"), ["workingCapacity", "confidence", "regenerability"]],
          ["color", text(lang, "颜色", "color"), ["evidenceLevel", "dataType"]],
        ].map(([key, label, options]) => (
          <FormField key={key} label={label} t={t}>
            <SelectControl value={chartConfig[key]} onChange={value => setChartConfig(prev => ({ ...prev, [key]: value }))} t={t} ariaLabel={label}>
              {options.map(option => <option key={option} value={option}>{option === "evidenceLevel" ? text(lang, "证据等级", "Evidence level") : option === "dataType" ? text(lang, "数据类型", "Data type") : metricLabel(option, lang)}</option>)}
            </SelectControl>
          </FormField>
        ))}
      </div>

      <div style={{ height: isMobile ? 380 : 480, marginTop: 12, position: "relative" }} onMouseLeave={() => setTooltip(null)}>
        {ranked.length ? (
          <>
            <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gas separation performance map" style={{ display: "block", height: "100%", overflow: "visible", width: "100%" }}>
              <rect x={margin.left} y={margin.top} width={plotW} height={plotH} fill={t.surface} stroke={t.border} rx="6" />
              {ticks(xDomain).map(value => (
                <g key={`x-${value}`}>
                  <line x1={xScale(value)} x2={xScale(value)} y1={margin.top} y2={margin.top + plotH} stroke={t.divider} strokeDasharray="3 4" />
                  <text x={xScale(value)} y={margin.top + plotH + 22} textAnchor="middle" fill={t.subtle} fontSize="11" fontFamily={FONT_SANS}>{formatNumber(value)}</text>
                </g>
              ))}
              {ticks(yDomain).map(value => (
                <g key={`y-${value}`}>
                  <line x1={margin.left} x2={margin.left + plotW} y1={yScale(value)} y2={yScale(value)} stroke={t.divider} strokeDasharray="3 4" />
                  <text x={margin.left - 10} y={yScale(value) + 4} textAnchor="end" fill={t.subtle} fontSize="11" fontFamily={FONT_SANS}>{formatNumber(value)}</text>
                </g>
              ))}
              <text x={margin.left + plotW / 2} y={height - 13} textAnchor="middle" fill={t.subtle} fontSize="12" fontFamily={SCIENTIFIC_TOKEN_FONT}>{metricLabel(xMetric, lang)}</text>
              <text x="16" y={margin.top + plotH / 2} textAnchor="middle" transform={`rotate(-90 16 ${margin.top + plotH / 2})`} fill={t.subtle} fontSize="12" fontFamily={SCIENTIFIC_TOKEN_FONT}>{metricLabel(yMetric, lang)}</text>
              {ranked.map(row => {
                const xValue = valueForMetric(row, xMetric)
                const yValue = valueForMetric(row, yMetric)
                if (xValue == null || yValue == null) return null
                const selected = row.id === selectedId
                return (
                  <circle
                    key={row.id}
                    cx={xScale(xValue)}
                    cy={yScale(yValue)}
                    r={rScale(valueForMetric(row, bubbleMetric))}
                    fill={colorFor(row)}
                    fillOpacity={selected ? 0.95 : 0.74}
                    stroke={selected ? t.textStrong : t.panel}
                    strokeWidth={selected ? 3 : 1.5}
                    style={{ cursor: "pointer" }}
                    onClick={() => onSelect(row.id)}
                    onMouseMove={event => setTooltip({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY, row })}
                  />
                )
              })}
            </svg>
            {tooltip ? (
              <div style={{ position: "absolute", left: Math.min(tooltip.x + 14, 520), top: Math.min(tooltip.y + 14, isMobile ? 245 : 335), background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 8, boxShadow: t.shadowMd, color: t.muted, fontSize: 11.5, lineHeight: 1.45, maxWidth: 270, padding: 10, pointerEvents: "none", zIndex: 5 }}>
                <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{tooltip.row.displayName}</strong>
                <div><ChemicalFormula value={tooltip.row.gasPair} /> · {tooltip.row.applicationScenario}</div>
                <div>{metricLabel("primaryUptake", lang)}: {formatMetricValue(tooltip.row, "primaryUptake", lang)}</div>
                <div>{metricLabel("selectivity", lang)}: {formatMetricValue(tooltip.row, "selectivity", lang)}</div>
                <div>{metricLabel("workingCapacity", lang)}: {formatMetricValue(tooltip.row, "workingCapacity", lang)}</div>
                <div>{text(lang, "证据等级", "Evidence level")}: {tooltip.row.evidenceLevel}</div>
                <div>{text(lang, "数据类型", "Data type")}: {dataTypeLabel(tooltip.row.dataType, lang)}</div>
                <div aria-label={text(lang, "GasScore 评分", "GasScore score")}>{text(lang, "分数", "Score")}: {formatScore100(tooltip.row.score, lang)}</div>
              </div>
            ) : null}
          </>
        ) : (
          <Callout tone="warn">{text(lang, "当前场景无可绘制数据。", "No plottable records for the current scenario.")}</Callout>
        )}
      </div>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{text(lang, "气泡大小图例", "Bubble size legend")}</span>
        {[0.28, 0.62, 1].map((value, index) => (
          <span key={value} style={{ alignItems: "center", color: t.muted, display: "inline-flex", fontSize: 11, gap: 6 }}>
            <span style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 999, display: "inline-block", height: 8 + value * 14, width: 8 + value * 14 }} />
            {["low", "medium", "high"][index]}
          </span>
        ))}
        <span style={{ color: t.subtle, fontSize: 11 }}>{metricLabel(bubbleMetric, lang)}</span>
      </div>
    </section>
  )
}

function CandidateRankingTable({ ranked, selectedId, onSelect, compareIds, setCompareIds, t, lang, isMobile }) {
  const [sort, setSort] = useState({ key: "score", dir: "desc" })
  const [filters, setFilters] = useState({ evidence: "all", dataType: "all", stability: "all", source: "all" })
  const uniqueOptions = key => ["all", ...Array.from(new Set(ranked.map(row => row[key]).filter(Boolean)))]
  const filtered = useMemo(() => {
    const rows = ranked.filter(row => {
      if (filters.evidence !== "all" && row.evidenceLevel !== filters.evidence) return false
      if (filters.dataType !== "all" && row.dataType !== filters.dataType) return false
      if (filters.stability !== "all" && row.waterStability !== filters.stability) return false
      if (filters.source !== "all" && row.sourceDatabase !== filters.source) return false
      return true
    })
    const dir = sort.dir === "asc" ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = sort.key === "rank" ? ranked.findIndex(row => row.id === a.id) + 1 : a[sort.key]
      const bv = sort.key === "rank" ? ranked.findIndex(row => row.id === b.id) + 1 : b[sort.key]
      const an = valueForMetric(a, sort.key)
      const bn = valueForMetric(b, sort.key)
      if (an !== null && bn !== null) return (an - bn) * dir
      if (Number.isFinite(Number(av)) && av !== null && av !== "" && Number.isFinite(Number(bv)) && bv !== null && bv !== "") return (Number(av) - Number(bv)) * dir
      return String(av || "").localeCompare(String(bv || "")) * dir
    })
  }, [ranked, filters, sort])
  const updateSort = key => setSort(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }))
  const toggleCompare = id => {
    setCompareIds(prev => prev.includes(id)
      ? prev.filter(item => item !== id)
      : prev.length >= 3
        ? prev
        : [...prev, id])
  }

  return (
    <section style={cardStyle(t)}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <SectionTitle>{text(lang, "候选材料排序", "Candidate Ranking")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>{text(lang, "表格与性能图谱、雷达图和解释面板联动；可勾选 2-3 个材料进行对比。", "The table links to the map, radar, and explanation panel; compare 2-3 MOFs with checkboxes.")}</div>
        </div>
        <BasisBadge tone="info">{compareIds.length}/3 Compare</BasisBadge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 9, marginTop: 12 }}>
        {[
          ["evidence", text(lang, "证据等级", "Evidence level"), uniqueOptions("evidenceLevel")],
          ["dataType", text(lang, "数据类型", "Data type"), uniqueOptions("dataType")],
          ["stability", text(lang, "水稳定性", "Water stability"), uniqueOptions("waterStability")],
          ["source", text(lang, "来源数据库", "Source database"), uniqueOptions("sourceDatabase")],
        ].map(([key, label, options]) => (
          <FormField key={key} label={label} t={t}>
            <SelectControl value={filters[key]} onChange={value => setFilters(prev => ({ ...prev, [key]: value }))} t={t} ariaLabel={label}>
              {options.map(option => <option key={option} value={option}>{option === "all" ? text(lang, "全部", "All") : option}</option>)}
            </SelectControl>
          </FormField>
        ))}
      </div>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 1120, width: "100%" }}>
          <thead>
            <tr>
              <th style={{ ...tableHeadStyle(t), width: 56 }}>Compare</th>
              {TABLE_COLUMNS.map(([key, en, zh]) => (
                <th key={key} style={tableHeadStyle(t)}>
                  <button type="button" onClick={() => updateSort(key)} aria-label={text(lang, `按 ${zh} 排序`, `Sort by ${en}`)} title={text(lang, `按 ${zh} 排序`, `Sort by ${en}`)} style={{ background: "transparent", border: 0, color: t.textStrong, cursor: "pointer", fontSize: 11, fontWeight: 900, padding: 0, textAlign: "left" }}>
                    {text(lang, zh, en)} {sort.key === key ? (sort.dir === "desc" ? "↓" : "↑") : ""}
                  </button>
                </th>
              ))}
              <th style={tableHeadStyle(t)}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => {
              const selected = row.id === selectedId
              return (
                <tr key={row.id} onClick={() => onSelect(row.id)} style={{ background: selected ? t.badgeInfoBg : t.surface, cursor: "pointer" }}>
                  <td style={tableCellStyle(t)} onClick={event => event.stopPropagation()}>
                    <input type="checkbox" checked={compareIds.includes(row.id)} onChange={() => toggleCompare(row.id)} aria-label={`Compare ${row.displayName}`} />
                  </td>
                  <td style={tableCellStyle(t)}>{ranked.findIndex(item => item.id === row.id) + 1}</td>
                  <td style={{ ...tableCellStyle(t), color: t.textStrong, fontWeight: 900 }}><ChemicalText value={row.displayName} /></td>
                  <td style={tableCellStyle(t)}><ChemicalText value={row.sourceDatabase} /></td>
                  <td style={tableCellStyle(t)}><BasisBadge tone={row.dataGrade === "experimental" ? "calc" : row.dataGrade === "computed" || row.dataGrade === "computed-IAST" ? "info" : "proxy"}>{row.dataGrade || "pending"}</BasisBadge></td>
                  <td style={tableCellStyle(t)}><ChemicalFormula value={row.gasPair} /></td>
                  <td style={tableCellStyle(t)}><MetricWithSource record={row} metric="primaryUptake" value={formatMetricValue(row, "primaryUptake", lang)} unit="mmol/g" t={t} lang={lang} /></td>
                  <td style={tableCellStyle(t)}><MetricWithSource record={row} metric="selectivity" value={formatMetricValue(row, "selectivity", lang)} unit="dimensionless" t={t} lang={lang} /></td>
                  <td style={tableCellStyle(t)}><MetricWithSource record={row} metric="workingCapacity" value={formatMetricValue(row, "workingCapacity", lang)} unit="mmol/g" t={t} lang={lang} /></td>
                  <td style={tableCellStyle(t)}><MetricWithSource record={row} metric="regenerability" value={formatMetricValue(row, "regenerability", lang)} unit="%" t={t} lang={lang} /></td>
                  <td style={tableCellStyle(t)}><MetricWithSource record={row} field="waterStability" value={row.waterStability || formatPending(lang)} unit="status" t={t} lang={lang} label={text(lang, "水稳定性", "Water stability")} /></td>
                  <td style={tableCellStyle(t)}><GasDataStatusBadge type="evidence" value={row.evidenceLevel} lang={lang} /> <GasFieldProvenanceButton record={row} field="evidenceLevel" currentValue={row.evidenceLevel} unit="level" lang={lang} t={t} label={text(lang, "证据等级", "Evidence level")} /></td>
                  <td style={tableCellStyle(t)}><GasDataStatusBadge type="dataType" value={row.dataType} lang={lang} /></td>
                  <td style={{ ...tableCellStyle(t), fontFamily: FONT_SANS, fontWeight: 900 }}><MetricWithSource record={row} field="gasScore" value={formatScore100(row.score, lang)} unit="/100" t={t} lang={lang} label="GasScore" /></td>
                  <td style={tableCellStyle(t)}>
                    <button type="button" onClick={event => { event.stopPropagation(); window.location.hash = "library" }} aria-label={text(lang, `查看 ${row.displayName} 的 MOF Library 记录`, `View ${row.displayName} in MOF Library`)} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontSize: 11, fontWeight: 850, padding: "6px 8px" }}>
                      {text(lang, "查看 MOF Library", "View in MOF Library")}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!filtered.length ? <Callout tone="warn">{text(lang, "筛选后无候选。", "No candidates after filtering.")}</Callout> : null}
    </section>
  )
}

function CompareInsightPanel({ selected, compareRows, t, lang, isMobile }) {
  const rows = compareRows.length ? compareRows : selected ? [selected] : []
  const metrics = ["selectivity", "workingCapacity", "primaryUptake", "regenerability", "score"]
  const bestFor = key => rows
    .map(row => ({ row, value: valueForMetric(row, key) }))
    .filter(item => item.value != null)
    .sort((a, b) => b.value - a.value)[0]?.row?.id
  const best = Object.fromEntries(metrics.map(key => [key, bestFor(key)]))
  if (!selected) return null
  return (
    <section style={cardStyle(t)}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <SectionTitle>{text(lang, "候选对比摘要", "Candidate Compare Snapshot")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
            {text(lang, "左侧为当前选中候选；勾选 Compare 后会在同一指标行内直接显示强弱项与数据等级。", "The selected candidate stays in view; checked Compare rows show strengths and data grades on the same metric rows.")}
          </div>
        </div>
        <BasisBadge tone={compareRows.length ? "info" : "warn"}>{compareRows.length ? `${compareRows.length} compare` : text(lang, "未勾选对比", "no compare selected")}</BasisBadge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${Math.min(4, rows.length)}, minmax(0, 1fr))`, gap: 10, marginTop: 12 }}>
        {rows.map(row => (
          <article key={row.id} style={{ ...surfaceStyle(t), borderColor: row.id === selected.id ? t.accent : t.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
              <strong style={{ color: t.textStrong, fontSize: 13, lineHeight: 1.25, overflowWrap: "anywhere" }}><ChemicalText value={row.displayName} /></strong>
              <BasisBadge tone={row.dataGrade === "computed-IAST" ? "info" : row.dataGrade === "experimental" ? "calc" : "proxy"}>{row.dataGrade || "pending"}</BasisBadge>
            </div>
            <div style={{ display: "grid", gap: 6, marginTop: 9 }}>
              {metrics.map(metric => {
                const isBest = best[metric] === row.id
                return (
                  <div key={metric} style={{ alignItems: "center", display: "grid", gap: 6, gridTemplateColumns: "minmax(88px, 0.7fr) minmax(0, 1fr)" }}>
                    <span style={{ color: t.faint, fontSize: 11 }}>{metricLabel(metric, lang)}</span>
                    <span style={{ color: isBest ? t.accentText : t.textStrong, fontFamily: metric === "score" ? FONT_SANS : undefined, fontSize: 12, fontWeight: isBest ? 930 : 780 }}>
                      {metric === "score" ? formatScore100(row.score, lang) : formatMetricValue(row, metric, lang)} {isBest ? "↑" : ""}
                    </span>
                  </div>
                )
              })}
            </div>
            <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.45, marginTop: 8 }}>
              {text(lang, "来源", "Source")}: <ChemicalText value={row.sourceDatabase || "pending"} /> · {row.fieldSources?.selectivity?.sourceType || "selectivity pending"}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function tableHeadStyle(t) {
  return { background: t.panel, borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 10.5, fontWeight: 900, padding: "9px 8px", position: "sticky", top: 0, textAlign: "left", textTransform: "uppercase" }
}

function tableCellStyle(t) {
  return { borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.5, lineHeight: 1.45, padding: "9px 8px", verticalAlign: "top" }
}

function fieldForMetric(metric) {
  if (metric === "score") return "gasScore"
  if (metric === "stability") return "waterStability"
  if (metric === "evidence") return "evidenceLevel"
  return metric
}

function MetricWithSource({ record, field, metric, value, unit, t, lang, label }) {
  const sourceField = field || fieldForMetric(metric)
  return (
    <span style={{ alignItems: "center", display: "inline-flex", gap: 2, maxWidth: "100%" }}>
      <span style={{ overflowWrap: "anywhere" }}><ChemicalText value={value} /></span>
      <GasFieldProvenanceButton record={record} field={sourceField} currentValue={value} unit={unit} lang={lang} t={t} label={label || metricLabel(metric || sourceField, lang)} />
    </span>
  )
}

function ExplanationPanel({ record, t, lang, onOpenMethod }) {
  if (!record) return <Callout tone="warn">{text(lang, "selected MOF 不存在。", "Selected MOF does not exist.")}</Callout>
  const breakdown = record.scoreBreakdown || {}
  const contributions = breakdown.contributions || {}
  const contributionRows = ["uptake", "selectivity", "workingCapacity", "regenerability", "stability", "evidence"]
  const sourceRows = ["primaryUptake", "selectivity", "workingCapacity", "evidenceLevel", "gasScore"].map(field => {
    const source = getFieldSource(record, field)
    return `${metricLabel(field === "gasScore" ? "score" : field, lang)}：${source.sourceType || "pending"}`
  })
  return (
    <section style={cardStyle(t)}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <SectionTitle>{text(lang, "排序解释", "Ranking Explanation")}</SectionTitle>
          <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 930, lineHeight: 1.2, marginTop: 7 }}><ChemicalText value={record.displayName} /></div>
          <div style={{ alignItems: "center", color: t.subtle, display: "flex", flexWrap: "wrap", fontSize: 12, gap: 6, lineHeight: 1.5, marginTop: 5 }}>
            <span>{record.sourceRecordId}</span>
            <BasisBadge tone={record.dataGrade === "experimental" ? "calc" : record.dataGrade === "computed" || record.dataGrade === "computed-IAST" ? "info" : "proxy"}>{record.dataGrade || "pending"}</BasisBadge>
            <GasDataStatusBadge type="dataType" value={record.dataType} lang={lang} />
            <GasDataStatusBadge type="evidence" value={record.evidenceLevel} lang={lang} />
          </div>
        </div>
        <BasisBadge tone={statusTone(record.dataType)} aria-label={dataTypeLabel(record.dataType, lang)} title={dataTypeLabel(record.dataType, lang)}>{dataTypeLabel(record.dataType, lang)}</BasisBadge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, marginTop: 14 }}>
        <InfoList title={text(lang, "适合当前气体对的原因", "Why it fits this gas pair")} rows={record.whyRecommended || []} t={t} />
        <InfoList title={text(lang, "主要贡献指标", "Largest contributors")} rows={breakdown.topDrivers || []} t={t} />
        <InfoList title={text(lang, "拖累项与风险", "Draggers and risks")} rows={[...(breakdown.draggers || []), ...(record.risks || [])]} t={t} />
        <InfoList title={text(lang, "解释使用的数据来源类型", "Source types used in explanation")} rows={sourceRows} t={t} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, marginTop: 12 }}>
        <div style={surfaceStyle(t)}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "Descriptor Contribution", "Descriptor Contribution")}</strong>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {contributionRows.map(key => {
              const value = contributions[key] || 0
              return (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "142px minmax(0, 1fr) 48px", gap: 8, alignItems: "center" }}>
                  <span style={{ color: t.muted, fontSize: 11.5 }}>{metricLabel(key, lang)}</span>
                  <span style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, height: 8, overflow: "hidden" }}>
                    <span style={{ background: "#2F7D7B", display: "block", height: "100%", width: `${Math.min(100, value * 5)}%` }} />
                  </span>
                  <span style={{ color: t.subtle, fontFamily: FONT_SANS, fontSize: 11, textAlign: "right" }}>{formatNumber(value)}</span>
                </div>
              )
            })}
            <div style={{ color: t.warn, fontSize: 11.5, lineHeight: 1.45 }}>
              {formatRiskPenalty(breakdown.riskPenalty || 0, lang)}
            </div>
          </div>
        </div>
        <div style={surfaceStyle(t)}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "适用边界与下一步", "Applicability and next validation")}</strong>
          <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.58, margin: "9px 0 0" }}>{record.applicabilityNote}</p>
          <p style={{ color: t.subtle, fontSize: 11.5, lineHeight: 1.55, margin: "8px 0 0" }}>{record.limitationNote}</p>
          <button type="button" onClick={onOpenMethod} aria-label={text(lang, "查看 GasSep 评分方法", "View GasSep scoring method")} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontSize: 11.5, fontWeight: 850, marginTop: 10, padding: "7px 9px" }}>
            {text(lang, "查看评分方法", "View scoring method")}
          </button>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <GasUnitNormalizationNote record={record} field="primaryUptake" lang={lang} t={t} />
      </div>
    </section>
  )
}

function InfoList({ title, rows, t }) {
  return (
    <div style={surfaceStyle(t)}>
      <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{title}</strong>
      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        {(rows.length ? rows : ["pending"]).map((row, index) => (
          <div key={`${row}-${index}`} style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45, paddingLeft: 9, borderLeft: `3px solid ${t.accent}` }}><ChemicalText value={row} /></div>
        ))}
      </div>
    </div>
  )
}

function MechanismAndEvidence({ scenario, record, t, lang, isMobile }) {
  const config = scenarioFor(scenario.gasPair)
  const mechanismRows = text(lang, config.mechanismZh, config.mechanismEn)
  return (
    <section style={cardStyle(t)}>
      <SectionTitle>{text(lang, "Mechanism & Descriptor Interpretation", "Mechanism & Descriptor Interpretation")}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
        {mechanismRows.map((row, index) => (
          <div key={row} style={surfaceStyle(t, { boxShadow: `inset 3px 0 0 ${CHART_COLORS[index % CHART_COLORS.length]}` })}>
            <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900, lineHeight: 1.35 }}><ChemicalText value={row} /></div>
          </div>
        ))}
      </div>
      {record ? (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
          <MetricTile label={text(lang, "金属节点", "Metal node")} value={record.metalNode} note={record.topology} t={t} />
          <MetricTile label={text(lang, "连接体", "Linker")} value={record.linker} note={text(lang, "结构描述符", "descriptor")} t={t} />
          <MetricTile label={text(lang, "孔径", "Pore size")} value={`${record.poreSizeA} A`} note={`${record.poreVolume} cm3/g`} t={t} />
          <MetricTile label={text(lang, "热稳定性", "Thermal stability")} value={`${record.thermalStability} K`} note={record.waterStability} t={t} />
        </div>
      ) : null}
    </section>
  )
}

function EvidenceLimitations({ record, t, lang }) {
  const rows = record ? [
    [text(lang, "来源数据库", "Source database"), record.sourceDatabase],
    [text(lang, "来源记录 ID", "Source record id"), record.sourceRecordId],
    ["Citation", record.citation],
    [text(lang, "数据类型", "Data type"), record.dataType],
    [text(lang, "证据等级", "Evidence level"), record.evidenceLevel],
    [text(lang, "检索时间", "Retrieved at"), record.retrievedAt],
    [text(lang, "整理状态", "Curation status"), record.curationStatus],
    [text(lang, "已知限制", "Known limitations"), record.limitationNote],
  ] : []
  return (
    <section style={cardStyle(t)}>
      <SectionTitle>{text(lang, "证据与限制", "Evidence & Limitations")}</SectionTitle>
      <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
        {text(lang, "A：实验或高质量文献；B：模拟或部分整理数据；C：预测、推断或不完整数据；D：演示或占位数据。", "A: experimental or high-quality literature; B: simulation or partially curated data; C: predicted, inferred, or incomplete data; D: demo or placeholder data.")}
      </div>
      <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "grid", gridTemplateColumns: "150px minmax(0, 1fr)", gap: 10, borderTop: `1px solid ${t.divider}`, paddingTop: 8 }}>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
            <div style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.48, overflowWrap: "anywhere" }}><ChemicalText value={value || "pending"} /></div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ValidationRoadmap({ t, lang }) {
  return (
    <section style={cardStyle(t)}>
      <SectionTitle>{text(lang, "验证路线", "Validation Roadmap")}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginTop: 12 }}>
        {ROADMAP.map(([en, zh, detail], index) => (
          <div key={en} style={surfaceStyle(t)}>
            <BasisBadge tone={index < 2 ? "info" : index < 4 ? "warn" : "calc"}>{String(index + 1).padStart(2, "0")}</BasisBadge>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900, marginTop: 8 }}>{text(lang, zh, en)}</div>
            <div style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.5, marginTop: 6 }}>{detail}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function GasSepTab({ onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [records, setRecords] = useState([])
  const [status, setStatus] = useState("loading")
  const [collectionReport, setCollectionReport] = useState(null)
  const [iastReport, setIastReport] = useState(null)
  const [identityReport, setIdentityReport] = useState(null)
  const [proxyReport, setProxyReport] = useState(null)
  const [selectedMofId, setSelectedMofId] = useState(null)
  const [selectedMetric, setSelectedMetric] = useState("primaryUptake")
  const [rankingMode, setRankingMode] = useState("overall")
  const [rankingSortMetric, setRankingSortMetric] = useState("GasScore")
  const [heatmapView, setHeatmapView] = useState("normalized")
  const [heatmapSortMetric, setHeatmapSortMetric] = useState("GasScore")
  const [compareMofIds, setCompareMofIds] = useState([])
  const [activeInspectorCell, setActiveInspectorCell] = useState(null)
  const [scenario, setScenario] = useState({
    gasPair: "CO2/N2",
    applicationScenario: "flue gas carbon capture",
    temperatureK: 298,
    pressureBar: 1,
    adsorptionPressureBar: 1,
    desorptionPressureBar: 0.15,
    mixtureRatio: "15/85",
    targetPriority: "Balanced",
  })
  const [chartConfig, setChartConfig] = useState({
    x: "primaryUptake",
    y: "selectivity",
    bubble: "workingCapacity",
    color: "evidenceLevel",
  })

  useEffect(() => {
    let active = true
    setStatus("loading")
    Promise.all([
      getGasAdsorptionRecordsV2({ throwOnError: false }),
      getGasAdsorptionRecordsV1({ throwOnError: false }),
      getGasAdsorptionRecordsDemo({ throwOnError: false }),
      getGasAdsorptionV2CollectionReport({ throwOnError: false }),
      getGasAdsorptionV21IastReport({ throwOnError: false }),
      getMofIdentityResolutionReport({ throwOnError: false }),
      getGasStructureProxyValidationReport({ throwOnError: false }),
    ])
      .then(([v2Rows, v1Rows, demoRows, report, iast, identity, proxy]) => {
        if (!active) return
        const sourceRows = Array.isArray(v2Rows) && v2Rows.length ? v2Rows : Array.isArray(v1Rows) && v1Rows.length ? v1Rows : demoRows
        const safeRows = normalizeGasRecords(sourceRows)
        setRecords(safeRows)
        setCollectionReport(report || null)
        setIastReport(iast || null)
        setIdentityReport(identity || null)
        setProxyReport(proxy || null)
        setStatus(safeRows.length ? (Array.isArray(v2Rows) && v2Rows.length ? "loaded-v2" : Array.isArray(v1Rows) && v1Rows.length ? "loaded" : "fallback") : "empty")
      })
      .catch(error => {
        console.warn("GasSep data load failed.", error)
        if (active) setStatus("error")
      })
    return () => { active = false }
  }, [])

  const screening = useMemo(() => buildGasSeparationScreening(records, scenario), [records, scenario])
  const ranked = screening.rankedRecords
  const gasSepSummary = useMemo(() => buildGasSepSummary({ records }), [records])
  const gasSepExportRows = useMemo(() => buildGasSepExportRows(records), [records])
  const selected = useMemo(() => ranked.find(row => row.id === selectedMofId) || ranked[0] || null, [ranked, selectedMofId])
  const compareRows = useMemo(() => compareMofIds.map(id => ranked.find(row => row.id === id)).filter(Boolean), [compareMofIds, ranked])

  useEffect(() => {
    if (!ranked.length) {
      setSelectedMofId(null)
      setCompareMofIds([])
      return
    }
    if (!selectedMofId || !ranked.some(row => row.id === selectedMofId)) setSelectedMofId(ranked[0].id)
    setCompareMofIds(prev => prev.filter(id => ranked.some(row => row.id === id)).slice(0, 3))
  }, [ranked, selectedMofId])

  useEffect(() => {
    setActiveInspectorCell(null)
    setSelectedMetric("primaryUptake")
    setHeatmapSortMetric("GasScore")
  }, [scenario.gasPair])

  const selectMetricCell = useCallback((row, metric) => {
    if (!row) return
    setSelectedMofId(row.id)
    setSelectedMetric(metric)
    setActiveInspectorCell({ record: row, metric })
  }, [])

  const openMethod = useCallback(() => {
    if (onNavigate) onNavigate("methodology")
    window.setTimeout(() => {
      if (typeof document !== "undefined") {
        document.getElementById("methodology-gassep")?.scrollIntoView({ block: "start", behavior: "smooth" })
      }
      if (typeof window !== "undefined") window.location.hash = "methodology-gassep"
    }, 60)
  }, [onNavigate])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
      <PageHeader
        title={text(lang, "GasSep 气体分离场景工作台", "GasSep Gas Separation Scenario Workbench")}
        subtitle={text(
          lang,
          "从静态图表升级为工况驱动的候选筛选、排序、解释和验证路线工作台；所有数值保持证据等级、字段溯源与不确定性边界。",
          "A condition-driven workspace for candidate screening, ranking, explanation, and validation planning; all values keep evidence level, field provenance, and uncertainty boundaries."
        )}
        meta={text(lang, "scenario builder · performance map · evidence chain", "scenario builder · performance map · evidence chain")}
        action={
          <>
            <BasisBadge tone="proxy">{text(lang, "保留 GasSep 路由", "existing GasSep route")}</BasisBadge>
            <CopyLinkButton hash="gassep" ariaLabel={text(lang, "复制 GasSep 链接", "Copy GasSep link")} />
          </>
        }
      />

      {status === "loading" ? <Callout tone="info">{text(lang, "正在加载 GasSep 数据…", "Loading GasSep data...")}</Callout> : null}
      {status === "error" ? <Callout tone="warn">{text(lang, "GasSep 数据加载失败。", "GasSep data could not be loaded.")}</Callout> : null}
      {status === "empty" ? <Callout tone="warn">{text(lang, "当前场景无数据。", "No GasSep records are available.")}</Callout> : null}
      {status === "fallback" ? <Callout tone="warn">{text(lang, "Gas Adsorption v1 数据不可用，已回退到 Demo｜仅用于界面验证。", "Gas Adsorption v1 data is unavailable; falling back to Demo | interface validation only.")}</Callout> : null}

      <Overview ranked={ranked} scenario={scenario} t={t} lang={lang} isMobile={isMobile} />
      <GasSepDatabaseSummaryCard summary={gasSepSummary} exportRows={gasSepExportRows} lang={lang} t={t} isMobile={isMobile} />
      <ScenarioBuilder scenario={scenario} setScenario={setScenario} t={t} lang={lang} isMobile={isMobile} isNarrow={isNarrow} />
      <ConditionSummary ranked={ranked} scenario={scenario} t={t} lang={lang} isMobile={isMobile} />
      <GasCoverageNotice coverage={screening.coverage} collectionReport={collectionReport} iastReport={iastReport} identityReport={identityReport} proxyReport={proxyReport} t={t} lang={lang} />
      <PerformanceMap ranked={ranked} selectedId={selected?.id} onSelect={setSelectedMofId} chartConfig={chartConfig} setChartConfig={setChartConfig} t={t} lang={lang} isMobile={isMobile} isNarrow={isNarrow} />
      <CandidateRankingTable ranked={ranked} selectedId={selected?.id} onSelect={setSelectedMofId} compareIds={compareMofIds} setCompareIds={setCompareMofIds} t={t} lang={lang} isMobile={isMobile} />
      <CompareInsightPanel selected={selected} compareRows={compareRows} t={t} lang={lang} isMobile={isMobile} />
      <GasTopRankingChart
        ranked={ranked}
        selectedId={selected?.id}
        onSelect={setSelectedMofId}
        rankingMode={rankingMode}
        setRankingMode={setRankingMode}
        sortMetric={rankingSortMetric}
        setSortMetric={setRankingSortMetric}
        t={t}
        lang={lang}
        isMobile={isMobile}
      />
      <ExplanationPanel record={selected} t={t} lang={lang} onOpenMethod={openMethod} />
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", gap: 16 }}>
        <GasDataQualityPanel record={selected} t={t} lang={lang} />
        <GasRecordSourcePanel record={selected} t={t} lang={lang} />
      </div>
      <GasInteractionDiagnostics scenario={scenario} record={selected} t={t} lang={lang} isMobile={isMobile} />

      <section style={cardStyle(t)}>
        <SectionTitle>{text(lang, "Multi-Metric Comparison", "Multi-Metric Comparison")}</SectionTitle>
        <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
          {text(lang, "条形图、雷达图和热力图共用当前气体对和选中 MOF；Compare 勾选用于保留 2-3 个候选的对比上下文。", "Bar chart, radar, and heatmap share the current gas pair and selected MOF. Compare checkboxes preserve 2-3 candidate context.")}
        </div>
        {compareRows.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 9 }}>
            {compareRows.map(row => <BasisBadge key={row.id} tone="info">{row.displayName}</BasisBadge>)}
          </div>
        ) : null}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: 16 }}>
        <GasTradeoffSummary ranked={ranked} scenario={scenario} t={t} lang={lang} />
        <GasValidationRecommendation record={selected} scenario={scenario} t={t} lang={lang} />
      </div>
      <GasRadarComparison selectedRecord={selected} compareRecords={compareRows} ranked={ranked} t={t} lang={lang} isMobile={isMobile} />
      <GasMetricHeatmap
        ranked={ranked}
        selectedId={selected?.id}
        selectedMetric={selectedMetric}
        setSelectedMetric={setSelectedMetric}
        heatmapView={heatmapView}
        setHeatmapView={setHeatmapView}
        heatmapSortMetric={heatmapSortMetric}
        setHeatmapSortMetric={setHeatmapSortMetric}
        onSelectCell={selectMetricCell}
        t={t}
        lang={lang}
      />
      {activeInspectorCell ? (
        <GasMetricInspector cell={activeInspectorCell} ranked={ranked} scenario={scenario} onClose={() => setActiveInspectorCell(null)} t={t} lang={lang} />
      ) : null}
      <MechanismAndEvidence scenario={scenario} record={selected} t={t} lang={lang} isMobile={isMobile} />
      <EvidenceLimitations record={selected} t={t} lang={lang} />
      <ValidationRoadmap t={t} lang={lang} />

      <Callout tone="note">
        {text(
          lang,
          "GasScore 是候选优先级分数，不是真实分离性能结论；GasSep 保留 View in MOF Library 的 ID 衔接，不改动 MOF Library 的 descriptor checklist 与 provenance 逻辑。",
          "GasScore is a candidate-priority score, not a validated separation-performance conclusion. GasSep keeps View in MOF Library ID handoff without changing the MOF Library descriptor checklist or provenance logic."
        )}
      </Callout>
    </div>
  )
}
