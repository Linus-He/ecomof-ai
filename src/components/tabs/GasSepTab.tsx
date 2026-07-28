// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  BasisBadge,
  Callout,
  ChemicalFormula,
  ChemicalText,
  CopyLinkButton,
  FONT_SANS,
  InlineFormula,
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
  getReadableMofLabel,
  useLang,
  useT,
  useViewport,
} from "../../shared"
import {
  getEvidenceScore,
  getScenarioWeights,
  getStabilityScore,
} from "../../utils/gasScoring"
import { toolbarBtn } from "../../utils/styles"
import {
  DEFAULT_GAS_RANKING_METHOD,
  GAS_RANKING_METHODS,
  GAS_SCREENING_GATES,
  buildGasSeparationScreening,
  gasMethodScore,
  gasMethodScoreLabel,
  getGasRankingMethod,
  matchesGasScreeningGate,
} from "../../utils/gasSeparationScreening"
import { parseMixtureRatio } from "../../utils/gasIastSelectivity"
import { buildThermodynamicInterpretation } from "../../utils/gasThermodynamics"
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
    ratioPresets: ["15/85", "10/90", "50/50"],
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
    ratioPresets: ["50/50", "10/90"],
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
    ratioPresets: ["75/25", "50/50"],
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
    ratioPresets: ["21/79"],
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
    ratioPresets: ["1/99", "0.5/99.5"],
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
    ratioPresets: ["50/50"],
    primaryGas: "CH4",
    secondaryGas: "N2",
    mechanismZh: ["CH₄/N₂ 数据作为其他气体体系覆盖", "候选优先级依赖选择性、工作容量与压力窗口", "字段级溯源用于区分推断与模拟来源", "进入工艺判断前需要穿透验证"],
    mechanismEn: ["CH₄/N₂ records cover other gas systems", "Priority depends on selectivity, working capacity, and pressure window", "Field provenance separates inferred and simulated sources", "Breakthrough validation is needed before process claims"],
  },
  {
    gasPair: "C2H2/CO2",
    applicationScenario: "acetylene purification",
    labelZh: "C₂H₂/CO₂：乙炔纯化",
    labelEn: "C₂H₂/CO₂: acetylene purification",
    defaultRatio: "50/50",
    ratioPresets: ["50/50"],
    primaryGas: "C2H2",
    secondaryGas: "CO2",
    mechanismZh: ["两者动力学直径相近，需要特异性位点", "等摩尔进料用于检查真实竞争吸附", "吸附热与解吸窗口共同决定再生负担", "IAST 需由同温纯组分等温线支持"],
    mechanismEn: ["Similar kinetic diameters require specific binding sites", "Equimolar feed probes competitive adsorption", "Adsorption heat and desorption window shape regeneration burden", "IAST needs temperature-matched pure-component isotherms"],
  },
  {
    gasPair: "C2H2/C2H4",
    applicationScenario: "trace acetylene removal",
    labelZh: "C₂H₂/C₂H₄：痕量乙炔脱除",
    labelEn: "C₂H₂/C₂H₄: trace acetylene removal",
    defaultRatio: "1/99",
    ratioPresets: ["0.5/99.5", "1/99", "1/999"],
    primaryGas: "C2H2",
    secondaryGas: "C2H4",
    mechanismZh: ["痕量进料使低压亲和更关键", "0.5/99.5 与 1/99 为文献常见验证比例", "1/999 仅作为反馈提出的极低浓度探索", "最终判断需穿透曲线与循环实验"],
    mechanismEn: ["Trace feeds make low-pressure affinity critical", "0.5/99.5 and 1/99 are literature-used validation feeds", "1/999 is retained only as a feedback-driven ultra-trace exploration", "Final claims require breakthrough and cycling tests"],
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
  methodScore: { zh: "当前方法指标", en: "Method metric", unit: "" },
  primaryUptake: { zh: "吸附量", en: "Uptake", unit: "mmol/g" },
  selectivity: { zh: "选择性", en: "Selectivity", unit: "" },
  workingCapacity: { zh: "工作容量", en: "Working capacity", unit: "mmol/g" },
  regenerability: { zh: "可再生性", en: "Regenerability", unit: "%" },
  stability: { zh: "稳定性", en: "Stability", unit: "" },
  evidence: { zh: "证据置信度", en: "Evidence confidence", unit: "" },
  confidence: { zh: "记录置信度", en: "Record confidence", unit: "" },
  aps: { zh: "APS", en: "APS", unit: "" },
  apsRegenerability: { zh: "APS×R%", en: "APS×R%", unit: "" },
  criticScore: { zh: "CRITIC 分数", en: "CRITIC score", unit: "" },
  legacyGasScore: { zh: "历史 GasScore", en: "Legacy GasScore", unit: "" },
}

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

function formatCompactNumber(value, digits = 4) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "pending"
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(number)
}

function formatScore(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "pending"
  return String(Math.round(number))
}

function valueForMetric(record, metric) {
  if (!record) return null
  if (metric === "methodScore") return gasMethodScore(record, record.gasScreening?.methodId)
  if (metric === "legacyGasScore") return Number.isFinite(Number(record.score)) ? Number(record.score) : null
  if (metric === "aps") return Number.isFinite(Number(record.gasScreening?.aps)) ? Number(record.gasScreening.aps) : null
  if (metric === "apsRegenerability") return Number.isFinite(Number(record.gasScreening?.apsRegenerability)) ? Number(record.gasScreening.apsRegenerability) : null
  if (metric === "criticScore") return Number.isFinite(Number(record.gasScreening?.criticScore)) ? Number(record.gasScreening.criticScore) : null
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
  if (metric === "methodScore") return gasMethodScoreLabel(record, record.gasScreening?.methodId, lang)
  if (metric === "legacyGasScore") return formatScore100(record.score, lang)
  if (metric === "criticScore") return `${formatNumber(value)}/100`
  if (metric === "aps" || metric === "apsRegenerability") return formatNumber(value)
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

function quantile(sortedNums, p) {
  if (!sortedNums.length) return null
  const index = (sortedNums.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sortedNums[lower]
  return sortedNums[lower] + (sortedNums[upper] - sortedNums[lower]) * (index - lower)
}

function niceCeil(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(number))
  const scaled = number / power
  if (scaled <= 1) return power
  if (scaled <= 2) return 2 * power
  if (scaled <= 5) return 5 * power
  return 10 * power
}

function shouldCompressAxis(values, metric) {
  const nums = values.map(Number).filter(value => Number.isFinite(value) && value >= 0).sort((a, b) => a - b)
  if (nums.length < 5) return false
  const max = nums[nums.length - 1]
  const p90 = quantile(nums, 0.9) ?? max
  const median = quantile(nums, 0.5) ?? p90
  if (metric === "selectivity") return max >= 100 && max / Math.max(1, p90) >= 8
  return max >= 20 && median > 0 && max / median >= 40
}

function linearTicks(domain, count = 5) {
  return Array.from({ length: count }, (_, index) => domain[0] + (domain[1] - domain[0]) * (index / Math.max(1, count - 1)))
}

function compressedTicks(rawDomain) {
  const top = rawDomain[1]
  const ticks = [0, 1, 10, 30, 100, 1000, 10000, 100000, 1000000].filter(value => value <= top)
  if (!ticks.length || ticks[ticks.length - 1] !== top) ticks.push(top)
  return ticks
}

function buildAxisModel(values, metric) {
  const nums = values.map(Number).filter(Number.isFinite)
  if (shouldCompressAxis(nums, metric)) {
    const top = niceCeil(Math.max(...nums, 1) * 1.05)
    const rawDomain = [0, top]
    return {
      compressed: true,
      rawDomain,
      domain: [0, Math.log10(top + 1)],
      ticks: compressedTicks(rawDomain),
      scaleValue: value => Math.log10(Math.max(0, Number(value) || 0) + 1),
    }
  }
  const domain = smartDomain(nums, metric)
  return {
    compressed: false,
    rawDomain: domain,
    domain,
    ticks: linearTicks(domain),
    scaleValue: value => Number(value),
  }
}

function formatAxisTick(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "pending"
  const abs = Math.abs(number)
  if (abs >= 1000) return `${Math.round(number / 1000)}k`
  if (abs > 0 && abs < 0.01) return number.toExponential(1)
  if (abs < 10) return formatNumber(number, 2)
  if (abs < 100) return formatNumber(number, 1)
  return formatNumber(number, 0)
}

function clampPlot(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function stableHash(value = "") {
  return String(value).split("").reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) % 360, 17)
}

function separatePlotPoints(points, bounds) {
  const ordered = points.map((point, order) => ({ ...point, order, plotX: point.x, plotY: point.y }))
  for (let iteration = 0; iteration < 36; iteration += 1) {
    for (let i = 0; i < ordered.length; i += 1) {
      for (let j = i + 1; j < ordered.length; j += 1) {
        const a = ordered[i]
        const b = ordered[j]
        const minGap = Math.min(36, a.r + b.r + 4)
        let dx = b.plotX - a.plotX
        let dy = b.plotY - a.plotY
        let distance = Math.sqrt(dx * dx + dy * dy)
        if (distance >= minGap) continue
        if (!distance) {
          const angle = ((stableHash(`${a.id}:${b.id}`) + iteration * 29) * Math.PI) / 180
          dx = Math.cos(angle)
          dy = Math.sin(angle)
          distance = 1
        }
        const push = (minGap - distance) / 2
        const nx = dx / distance
        const ny = dy / distance
        a.plotX = clampPlot(a.plotX - nx * push, bounds.left + a.r + 2, bounds.right - a.r - 2)
        a.plotY = clampPlot(a.plotY - ny * push, bounds.top + a.r + 2, bounds.bottom - a.r - 2)
        b.plotX = clampPlot(b.plotX + nx * push, bounds.left + b.r + 2, bounds.right - b.r - 2)
        b.plotY = clampPlot(b.plotY + ny * push, bounds.top + b.r + 2, bounds.bottom - b.r - 2)
      }
    }
    ordered.forEach(point => {
      point.plotX = clampPlot(point.plotX + (point.x - point.plotX) * 0.015, bounds.left + point.r + 2, bounds.right - point.r - 2)
      point.plotY = clampPlot(point.plotY + (point.y - point.plotY) * 0.015, bounds.top + point.r + 2, bounds.bottom - point.r - 2)
    })
  }
  return ordered.sort((a, b) => a.order - b.order)
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

function Overview({ ranked, scenario, screening, t, lang, isMobile }) {
  const top = ranked[0]
  const method = getGasRankingMethod(scenario.rankingMethod)
  const weights = method.id === "legacy-gasscore" ? getScenarioWeights(scenario.gasPair, scenario.targetPriority) : null
  const evidenceMix = ranked.reduce((acc, row) => ({ ...acc, [row.evidenceLevel]: (acc[row.evidenceLevel] || 0) + 1 }), {})
  const methodLabel = text(lang, method.labelZh, method.label)
  const funnelAps = screening?.screeningFunnel?.find(gate => gate.id === "aps-eligible")
  return (
    <section data-testid="gassep-context-bar" style={{ display: "grid", gap: 8, minWidth: 0 }}>
      <div style={{ alignItems: "center", color: t.subtle, display: "flex", flexWrap: "wrap", fontSize: 12.2, gap: 8, lineHeight: 1.55 }}>
        <strong style={{ color: t.textStrong, fontSize: 13.5 }}><ChemicalFormula value={scenario.gasPair} /></strong>
        <span>{scenario.applicationScenario}</span>
        <span style={{ color: t.faint }}>·</span>
        <span>{text(lang, "候选", "candidates")} <span className="num">{ranked.length}</span></span>
        <span style={{ color: t.faint }}>·</span>
        <span>{methodLabel}</span>
        <span style={{ color: t.faint }}>·</span>
        <span>{text(lang, "第一名", "Top")} <strong style={{ color: t.textStrong }}><ChemicalText value={top?.displayName || formatPending(lang)} /></strong></span>
        <BasisBadge tone="warn" aria-label={formatDemoLabel(lang)} title={formatDemoLabel(lang)}>{formatDemoLabel(lang)}</BasisBadge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        <div style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.5 }}>
          <strong style={{ color: t.textStrong }}>{text(lang, "证据分布", "Evidence mix")}:</strong> {Object.entries(evidenceMix).map(([key, count]) => `${key}:${count}`).join(" · ") || formatPending(lang)}
        </div>
        <div style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.5 }}>
          <strong style={{ color: t.textStrong }}>{text(lang, "APS 可计算", "APS eligible")}:</strong> <span className="num">{funnelAps?.count ?? 0}</span> / <span className="num">{ranked.length}</span>
        </div>
        <div style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.5 }}>
          <strong style={{ color: t.textStrong }}>{text(lang, "边界", "Boundary")}:</strong> {method.id === "legacy-gasscore" ? "heuristic" : "literature/data"} · {text(lang, method.shortLabelZh, method.shortLabel)}
        </div>
      </div>
      {weights ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          <BasisBadge tone="warn">{text(lang, "仅历史 GasScore 使用以下权重", "Only Legacy GasScore uses these weights")}</BasisBadge>
          {Object.entries(weights).map(([key, value]) => (
            <BasisBadge key={key} tone="proxy">{metricLabel(key, lang)} {Math.round(value * 100)}%</BasisBadge>
          ))}
        </div>
      ) : null}
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
  const activeScenario = scenarioFor(scenario.gasPair)
  const parsedRatio = parseMixtureRatio(scenario.mixtureRatio)
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
            {text(
              lang,
              "气体对与排序方法会更新全部视图；压力窗口可重算工作容量。只有存在同温双组分纯气等温线时，进料比例与总压才会触发当前材料的 IAST 情景重算。",
              "Gas pair and ranking method update all views; the pressure window can recompute working capacity. Feed ratio and total pressure trigger selected-material IAST recalculation only when temperature-matched pure-component isotherms exist.",
            )}
          </div>
        </div>
        <BasisBadge tone="calc">{text(lang, `${SCENARIOS.length} 个可切换场景`, `${SCENARIOS.length} scenarios`)}</BasisBadge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))", gap: 11 }}>
        <FormField label={text(lang, "气体对", "Gas pair")} t={t}>
          <SelectControl value={scenario.gasPair} onChange={updateGasPair} t={t} ariaLabel="gas pair">
            {SCENARIOS.map(item => <option key={item.gasPair} value={item.gasPair}>{text(lang, item.labelZh, item.labelEn)}</option>)}
          </SelectControl>
        </FormField>
        <FormField label={text(lang, "排序方法", "Ranking method")} t={t}>
          <SelectControl value={scenario.rankingMethod || DEFAULT_GAS_RANKING_METHOD} onChange={value => setScenario(prev => ({ ...prev, rankingMethod: value }))} t={t} ariaLabel="ranking method">
            {GAS_RANKING_METHODS.map(method => <option key={method.id} value={method.id}>{text(lang, method.labelZh, method.label)}</option>)}
          </SelectControl>
        </FormField>
        <FormField label={text(lang, "应用场景", "Application scenario")} t={t}>
          <SelectControl value={scenario.applicationScenario} onChange={value => setScenario(prev => ({ ...prev, applicationScenario: value }))} t={t} ariaLabel="application scenario">
            {SCENARIOS.map(item => <option key={item.applicationScenario} value={item.applicationScenario}>{item.applicationScenario}</option>)}
          </SelectControl>
        </FormField>
        <FormField label={text(lang, "历史 GasScore 优先级", "Legacy GasScore priority")} t={t}>
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
          <div style={{ display: "grid", gap: 7 }}>
            <input
              aria-invalid={!parsedRatio}
              aria-label={text(lang, "混合比例", "mixture ratio")}
              value={scenario.mixtureRatio}
              onChange={event => setScenario(prev => ({ ...prev, mixtureRatio: event.target.value }))}
              style={{ minHeight: 38, width: "100%", boxSizing: "border-box", background: t.surface, border: `1px solid ${parsedRatio ? t.border : t.warn}`, borderRadius: 8, color: t.text, fontSize: 12, padding: "8px 10px", outline: "none" }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {(activeScenario.ratioPresets || [activeScenario.defaultRatio]).map(ratio => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setScenario(prev => ({ ...prev, mixtureRatio: ratio }))}
                  style={{
                    background: scenario.mixtureRatio === ratio ? t.badgeInfoBg : t.surface,
                    border: `1px solid ${scenario.mixtureRatio === ratio ? t.accent : t.border}`,
                    borderRadius: 999,
                    color: scenario.mixtureRatio === ratio ? t.accentText : t.muted,
                    cursor: "pointer",
                    fontFamily: SCIENTIFIC_TOKEN_FONT,
                    fontSize: 10.5,
                    fontWeight: 820,
                    padding: "4px 7px",
                  }}
                >
                  {ratio}
                </button>
              ))}
            </div>
            {!parsedRatio ? (
              <span style={{ color: t.warn, fontSize: 10.3, lineHeight: 1.4 }}>
                {text(lang, "请使用 A/B 格式并保证两者均大于 0。", "Use A/B format with both values above zero.")}
              </span>
            ) : null}
          </div>
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
      <SectionTitle>{text(lang, "工况摘要与关键指标", "Condition Summary + Key Metrics")}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
        <MetricTile label={text(lang, "工况", "Condition")} value={`${scenario.temperatureK} K`} note={`${scenario.adsorptionPressureBar ?? scenario.pressureBar}/${scenario.desorptionPressureBar ?? 0.15} bar · ${scenario.mixtureRatio}`} t={t} />
        <MetricTile label={text(lang, "平均吸附量", "Avg uptake")} value={avg("primaryUptake") == null ? formatPending(lang) : `${formatNumber(avg("primaryUptake"))} mmol/g`} note={formatGasPairLabel(scenario.gasPair)} t={t} />
        <MetricTile label={text(lang, "平均选择性", "Avg selectivity")} value={avg("selectivity") == null ? formatPending(lang) : formatNumber(avg("selectivity"))} note={text(lang, "当前场景", "scenario")} t={t} />
        <MetricTile label={text(lang, "平均工作容量", "Avg capacity")} value={avg("workingCapacity") == null ? formatPending(lang) : `${formatNumber(avg("workingCapacity"))} mmol/g`} note={text(lang, "工作容量", "working capacity")} t={t} />
        <MetricTile label={text(lang, "当前方法首位", "Top by current method")} value={top?.displayName || formatPending(lang)} note={top ? gasMethodScoreLabel(top, top.gasScreening?.methodId, lang) : formatPending(lang)} t={t} />
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

function RankingMethodEvidencePanel({ screening, scenario, setScenario, ranked, t, lang, isMobile }) {
  const activeMethod = getGasRankingMethod(scenario.rankingMethod)
  const references = screening?.references || []
  const referenceRows = references.filter(ref => activeMethod.referenceIds.includes(ref.id))
  const criticWeights = ranked?.[0]?.gasScreening?.criticWeights || {}
  return (
    <section style={cardStyle(t)}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <SectionTitle>{text(lang, "排序方法与文献依据", "Ranking Method and Literature Basis")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
            {text(lang, "默认不使用主观权重；Legacy GasScore 仅作为历史启发式参考。切换方法会即时重排下方所有联动视图。", "Default ranking avoids subjective weights. Legacy GasScore is retained only as a historical heuristic. Switching method reorders all linked views below.")}
          </div>
        </div>
        <BasisBadge tone={activeMethod.tone}>{text(lang, activeMethod.labelZh, activeMethod.label)}</BasisBadge>
      </div>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", marginTop: 12 }}>
        {GAS_RANKING_METHODS.map(method => {
          const active = method.id === activeMethod.id
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setScenario(prev => ({ ...prev, rankingMethod: method.id }))}
              data-testid={`gas-ranking-method-${method.id}`}
              style={{
                background: active ? t.badgeInfoBg : t.surface,
                border: `1px solid ${active ? t.accent : t.border}`,
                borderRadius: 8,
                color: t.textStrong,
                cursor: "pointer",
                display: "grid",
                gap: 6,
                minHeight: 108,
                padding: 11,
                textAlign: "left",
              }}
            >
              <span style={{ color: active ? t.accentText : t.textStrong, fontSize: 12.5, fontWeight: 920 }}>{text(lang, method.labelZh, method.label)}</span>
              <span style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.45 }}><ChemicalText value={text(lang, method.formulaZh, method.formula)} /></span>
              <span style={{ color: t.subtle, fontSize: 10.8, lineHeight: 1.4 }}><ChemicalText value={text(lang, method.boundaryZh, method.boundary)} /></span>
            </button>
          )
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.1fr) minmax(0, 0.9fr)", gap: 10, marginTop: 12 }}>
        <div style={surfaceStyle(t)}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "当前方法解释", "Current method interpretation")}</strong>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.58, marginTop: 8 }}>
            <ChemicalText value={text(lang, activeMethod.basisZh, activeMethod.basis)} />
          </div>
          <div style={{ color: t.subtle, fontSize: 11.4, lineHeight: 1.5, marginTop: 7 }}>
            <ChemicalText value={text(lang, activeMethod.boundaryZh, activeMethod.boundary)} />
          </div>
          {activeMethod.id === "critic-objective" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
              {Object.entries(criticWeights).map(([key, value]) => (
                <BasisBadge key={key} tone="warn">{metricLabel(key, lang)} {Math.round(Number(value || 0) * 100)}%</BasisBadge>
              ))}
            </div>
          ) : null}
        </div>
        <div style={surfaceStyle(t)}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "可引用依据", "Citable basis")}</strong>
          <div style={{ display: "grid", gap: 7, marginTop: 8 }}>
            {referenceRows.map(ref => (
              <a key={ref.id} href={ref.url} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 11.8, lineHeight: 1.45, textDecoration: "none" }}>
                <ChemicalText value={`${ref.label} · DOI ${ref.doi}`} />
                <span style={{ color: t.subtle, display: "block", marginTop: 2 }}><ChemicalText value={text(lang, ref.noteZh, ref.note)} /></span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ScreeningFunnelPanel({ funnel = [], activeGate, setActiveGate, t, lang, isMobile }) {
  const total = funnel.find(gate => gate.id === "all")?.count || Math.max(1, ...funnel.map(gate => gate.count || 0))
  return (
    <section style={cardStyle(t)}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <SectionTitle>{text(lang, "筛选漏斗", "Screening Funnel")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
            {text(lang, "点击任一级漏斗可过滤候选表；漏斗只统计当前气体对和当前压力窗口下的真实字段覆盖。", "Click any funnel stage to filter the candidate table. Counts use real field coverage under the selected gas pair and pressure window.")}
          </div>
        </div>
        <BasisBadge tone={activeGate === "all" ? "info" : "warn"}>{funnel.find(gate => gate.id === activeGate)?.[lang === "zh" ? "labelZh" : "label"] || activeGate}</BasisBadge>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(7, minmax(0, 1fr))", marginTop: 12 }}>
        {funnel.map((gate, index) => {
          const active = gate.id === activeGate
          const pct = total ? Math.round((gate.count / total) * 100) : 0
          return (
            <button
              key={gate.id}
              type="button"
              onClick={() => setActiveGate(gate.id)}
              data-testid={`gas-screening-gate-${gate.id}`}
              style={{
                background: active ? t.badgeInfoBg : t.surface,
                border: `1px solid ${active ? t.accent : t.border}`,
                borderRadius: 8,
                color: t.textStrong,
                cursor: "pointer",
                display: "grid",
                gap: 8,
                minHeight: 116,
                padding: 10,
                textAlign: "left",
              }}
            >
              <span style={{ color: t.faint, fontFamily: FONT_SANS, fontSize: 11, fontWeight: 900 }}>{String(index + 1).padStart(2, "0")}</span>
              <span style={{ color: t.textStrong, fontSize: 12, fontWeight: 900, lineHeight: 1.25 }}>{text(lang, gate.labelZh, gate.label)}</span>
              <span style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, height: 9, overflow: "hidden" }}>
                <span style={{ background: active ? t.accent : "#2F7D7B", display: "block", height: "100%", width: `${Math.max(3, pct)}%` }} />
              </span>
              <span style={{ color: t.textStrong, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 930 }}>{gate.count}</span>
              <span style={{ color: t.subtle, fontSize: 10.5, lineHeight: 1.35 }}>{pct}%</span>
            </button>
          )
        })}
      </div>
      {activeGate !== "all" ? (
        <button type="button" onClick={() => setActiveGate("all")} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontSize: 11.5, fontWeight: 850, marginTop: 10, padding: "7px 9px" }}>
          {text(lang, "清除漏斗过滤", "Clear funnel filter")}
        </button>
      ) : null}
    </section>
  )
}

function RankingStabilityPanel({ screening, scenario, setScenario, onSelect, t, lang, isMobile }) {
  const methods = screening?.methods || GAS_RANKING_METHODS
  const activeMethodId = scenario.rankingMethod || DEFAULT_GAS_RANKING_METHOD
  const rankings = screening?.methodRankings || {}
  const consensus = screening?.rankingStability || []
  return (
    <section style={cardStyle(t)}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <SectionTitle>{text(lang, "排序稳定性对照", "Ranking Stability Cross-check")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
            {text(lang, "同一候选若在多个方法的 Top 10 中反复出现，说明它更适合作为验证短名单；若只在单一方法中靠前，需要查看数据缺口和指标偏好。", "Candidates recurring across multiple Top 10 lists are better shortlist candidates; single-method leaders need data-gap and metric-bias checks.")}
          </div>
        </div>
        <BasisBadge tone="info">{text(lang, "4 种方法对照", "4 methods")}</BasisBadge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
        {methods.map(method => {
          const active = method.id === activeMethodId
          const rows = (rankings[method.id] || []).slice(0, 5)
          return (
            <article key={method.id} style={surfaceStyle(t, { borderColor: active ? t.accent : t.border })}>
              <button type="button" onClick={() => setScenario(prev => ({ ...prev, rankingMethod: method.id }))} style={{ background: "transparent", border: 0, color: active ? t.accentText : t.textStrong, cursor: "pointer", fontSize: 12.5, fontWeight: 920, padding: 0, textAlign: "left" }}>
                {text(lang, method.shortLabelZh, method.shortLabel)}
              </button>
              <div style={{ display: "grid", gap: 6, marginTop: 9 }}>
                {rows.map(row => (
                  <button key={row.id} type="button" onClick={() => onSelect(row.id)} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.muted, cursor: "pointer", display: "grid", gap: 3, padding: 7, textAlign: "left" }}>
                    <strong style={{ color: t.textStrong, fontSize: 11.5, lineHeight: 1.25, overflowWrap: "anywhere" }}><ChemicalText value={`${row.rank}. ${row.displayName}`} /></strong>
                    <span style={{ color: t.subtle, fontSize: 10.8 }}>{lang === "zh" ? row.scoreLabelZh : row.scoreLabel}</span>
                  </button>
                ))}
              </div>
            </article>
          )
        })}
      </div>
      {consensus.length ? (
        <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, marginTop: 12, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "跨方法短名单", "Cross-method shortlist")}</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {consensus.map(row => (
              <button key={row.id} type="button" onClick={() => onSelect(row.id)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, color: t.textStrong, cursor: "pointer", fontSize: 11.5, fontWeight: 850, padding: "6px 9px" }}>
                <ChemicalText value={`${row.displayName} · ${row.appearances}/${methods.length}`} />
              </button>
            ))}
          </div>
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
  const width = 860
  const height = 460
  const margin = { top: 26, right: 34, bottom: 64, left: 92 }
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom
  const plottableRows = ranked
    .map(row => ({
      row,
      xValue: valueForMetric(row, xMetric),
      yValue: valueForMetric(row, yMetric),
      bubbleValue: valueForMetric(row, bubbleMetric),
    }))
    .filter(point => point.xValue != null && point.yValue != null)
  const xAxis = buildAxisModel(plottableRows.map(point => point.xValue), xMetric)
  const yAxis = buildAxisModel(plottableRows.map(point => point.yValue), yMetric)
  const bubbleValues = plottableRows.map(point => point.bubbleValue).filter(value => value != null)
  const bubbleDomain = smartDomain(bubbleValues, bubbleMetric)
  const xScale = value => margin.left + ((xAxis.scaleValue(value) - xAxis.domain[0]) / Math.max(0.0001, xAxis.domain[1] - xAxis.domain[0])) * plotW
  const yScale = value => margin.top + plotH - ((yAxis.scaleValue(value) - yAxis.domain[0]) / Math.max(0.0001, yAxis.domain[1] - yAxis.domain[0])) * plotH
  const rScale = value => {
    if (value == null) return 6
    const normalized = (value - bubbleDomain[0]) / Math.max(0.0001, bubbleDomain[1] - bubbleDomain[0])
    return 6 + Math.sqrt(Math.max(0, Math.min(1, normalized))) * 10
  }
  const colorFor = row => colorMetric === "dataType"
    ? (COLOR_BY_TYPE[row.dataType] || "#64748B")
    : (COLOR_BY_EVIDENCE[row.evidenceLevel] || "#64748B")
  const legendItems = Array.from(new Set(ranked.map(row => colorMetric === "dataType" ? row.dataType : `Evidence ${row.evidenceLevel}`))).map(label => ({
    label,
    color: colorMetric === "dataType" ? (COLOR_BY_TYPE[label] || "#64748B") : (COLOR_BY_EVIDENCE[label.replace("Evidence ", "")] || "#64748B"),
  }))
  const rawPoints = plottableRows.map(point => {
    const radius = rScale(point.bubbleValue)
    return {
      ...point,
      id: point.row.id,
      x: xScale(point.xValue),
      y: yScale(point.yValue),
      r: radius,
    }
  })
  const plottedPoints = separatePlotPoints(rawPoints, {
    left: margin.left,
    top: margin.top,
    right: margin.left + plotW,
    bottom: margin.top + plotH,
  })
  const compressedAxes = [
    xAxis.compressed ? metricLabel(xMetric, lang) : null,
    yAxis.compressed ? metricLabel(yMetric, lang) : null,
  ].filter(Boolean)

  return (
    <section style={cardStyle(t)}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <SectionTitle>{text(lang, "性能图谱", "Interactive Performance Map")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
            {text(lang, "坐标域只按同时具备横纵轴数值的记录计算；长尾指标自动使用 log1p 压缩，避免单个离群点压扁主数据簇。", "Domains use only records with both axis values; long-tail metrics automatically use log1p compression so one outlier does not flatten the main cluster.")}
            {compressedAxes.length ? text(lang, ` 当前压缩轴：${compressedAxes.join("、")}。`, ` Compressed axis: ${compressedAxes.join(", ")}.`) : null}
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

      <div style={{ height: isMobile ? 390 : 500, marginTop: 12, position: "relative" }} onMouseLeave={() => setTooltip(null)}>
        {plottedPoints.length ? (
          <>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label="Gas separation performance map"
              data-testid="gas-performance-map"
              data-point-count={plottedPoints.length}
              data-x-scale={xAxis.compressed ? "log1p" : "linear"}
              data-y-scale={yAxis.compressed ? "log1p" : "linear"}
              style={{ display: "block", height: "100%", overflow: "visible", width: "100%" }}
            >
              <rect x={margin.left} y={margin.top} width={plotW} height={plotH} fill={t.surface} stroke={t.border} rx="6" />
              {xAxis.ticks.map(value => (
                <g key={`x-${value}`}>
                  <line x1={xScale(value)} x2={xScale(value)} y1={margin.top} y2={margin.top + plotH} stroke={t.divider} strokeDasharray="3 4" />
                  <text x={xScale(value)} y={margin.top + plotH + 24} textAnchor="middle" fill={t.subtle} fontSize="10.5" fontFamily={FONT_SANS}>{formatAxisTick(value)}</text>
                </g>
              ))}
              {yAxis.ticks.map(value => (
                <g key={`y-${value}`}>
                  <line x1={margin.left} x2={margin.left + plotW} y1={yScale(value)} y2={yScale(value)} stroke={t.divider} strokeDasharray="3 4" />
                  <text x={margin.left - 14} y={yScale(value) + 4} textAnchor="end" fill={t.subtle} fontSize="10.5" fontFamily={FONT_SANS}>{formatAxisTick(value)}</text>
                </g>
              ))}
              <text x={margin.left + plotW / 2} y={height - 18} textAnchor="middle" fill={t.subtle} fontSize="12" fontFamily={SCIENTIFIC_TOKEN_FONT}>{metricLabel(xMetric, lang)}{xAxis.compressed ? " (log)" : ""}</text>
              <text x="20" y={margin.top + plotH / 2} textAnchor="middle" transform={`rotate(-90 20 ${margin.top + plotH / 2})`} fill={t.subtle} fontSize="12" fontFamily={SCIENTIFIC_TOKEN_FONT}>{metricLabel(yMetric, lang)}{yAxis.compressed ? " (log)" : ""}</text>
              {plottedPoints.map(point => {
                const row = point.row
                const selected = row.id === selectedId
                return (
                  <circle
                    key={row.id}
                    data-testid="gas-performance-map-point"
                    cx={point.plotX}
                    cy={point.plotY}
                    r={point.r}
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
                <div aria-label={text(lang, "当前方法指标", "Current method metric")}>{text(lang, "当前方法", "Method")}: {gasMethodScoreLabel(tooltip.row, tooltip.row.gasScreening?.methodId, lang)}</div>
                <div>{text(lang, "历史 GasScore", "Legacy GasScore")}: {formatScore100(tooltip.row.score, lang)}</div>
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

function CandidateRankingTable({ ranked, selectedId, onSelect, compareIds, setCompareIds, activeGate, setActiveGate, t, lang, isMobile }) {
  const [sort, setSort] = useState({ key: "methodScore", dir: "desc" })
  const [filters, setFilters] = useState({ evidence: "all", dataType: "all", stability: "all", source: "all" })
  const [expandedRowId, setExpandedRowId] = useState(null)
  const uniqueOptions = key => ["all", ...Array.from(new Set(ranked.map(row => row[key]).filter(Boolean)))]
  const activeGateMeta = GAS_SCREENING_GATES.find(gate => gate.id === activeGate)
  const filtered = useMemo(() => {
    const rows = ranked.filter(row => {
      if (!matchesGasScreeningGate(row, activeGate)) return false
      if (filters.evidence !== "all" && row.evidenceLevel !== filters.evidence) return false
      if (filters.dataType !== "all" && row.dataType !== filters.dataType) return false
      if (filters.stability !== "all" && row.waterStability !== filters.stability) return false
      if (filters.source !== "all" && row.sourceDatabase !== filters.source) return false
      return true
    })
    const dir = sort.dir === "asc" ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = sort.key === "rank" ? a.gasScreening?.methodRank : sort.key === "legacyGasScore" ? a.score : sort.key === "methodScore" ? valueForMetric(a, "methodScore") : a[sort.key]
      const bv = sort.key === "rank" ? b.gasScreening?.methodRank : sort.key === "legacyGasScore" ? b.score : sort.key === "methodScore" ? valueForMetric(b, "methodScore") : b[sort.key]
      const an = valueForMetric(a, sort.key)
      const bn = valueForMetric(b, sort.key)
      if (an !== null && bn !== null) return (an - bn) * dir
      if (Number.isFinite(Number(av)) && av !== null && av !== "" && Number.isFinite(Number(bv)) && bv !== null && bv !== "") return (Number(av) - Number(bv)) * dir
      return String(av || "").localeCompare(String(bv || "")) * dir
    })
  }, [ranked, filters, sort, activeGate])
  const updateSort = key => setSort(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }))
  const selectSort = key => updateSort(key)
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
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
            {text(lang, "精简表格与性能图谱、雷达图和解释面板联动；展开单行查看字段来源、数据类型、水稳定性与历史 GasScore。", "The compact table links to the map, radar, and explanation panel; expand one row to inspect field sources, data type, water stability, and Legacy GasScore.")}
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          <BasisBadge tone={activeGate === "all" ? "info" : "warn"}>{activeGateMeta ? text(lang, activeGateMeta.labelZh, activeGateMeta.label) : activeGate}</BasisBadge>
          <BasisBadge tone="info">{text(lang, "对比", "Compare")} {compareIds.length}/3</BasisBadge>
        </div>
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
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {[
          ["methodScore", text(lang, "当前方法指标", "Method metric")],
          ["aps", "APS"],
          ["selectivity", text(lang, "选择性", "Selectivity")],
          ["workingCapacity", text(lang, "工作容量", "Working capacity")],
          ["primaryUptake", text(lang, "吸附量", "Uptake")],
        ].map(([key, label]) => (
          <button key={key} type="button" onClick={() => selectSort(key)} style={{ background: sort.key === key ? t.badgeInfoBg : t.surface, border: `1px solid ${sort.key === key ? t.accentText : t.border}`, borderRadius: 999, color: sort.key === key ? t.accentText : t.muted, cursor: "pointer", fontSize: 11, fontWeight: 850, minHeight: 29, padding: "5px 9px" }}>
            {label}{sort.key === key ? (sort.dir === "desc" ? " ↓" : " ↑") : ""}
          </button>
        ))}
      </div>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: isMobile ? 860 : 980, tableLayout: "fixed", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ ...tableHeadStyle(t), width: 64 }}>{text(lang, "对比", "Compare")}</th>
              {[
                ["rank", text(lang, "名次", "Rank"), 72, true],
                ["displayName", "MOF", 260, true],
                ["gasPair", text(lang, "气体对", "Gas pair"), 96, true],
                ["methodScore", text(lang, "核心指标", "Key metrics"), 240, true],
                ["evidenceLevel", text(lang, "证据", "Evidence"), 138, true],
                ["action", text(lang, "操作", "Action"), 150, false],
              ].map(([key, label, width, sortable]) => (
                <th key={key} style={{ ...tableHeadStyle(t), width }}>
                  {sortable ? (
                    <button type="button" onClick={() => updateSort(key)} aria-label={text(lang, `按 ${label} 排序`, `Sort by ${label}`)} title={text(lang, `按 ${label} 排序`, `Sort by ${label}`)} style={{ background: "transparent", border: 0, color: t.textStrong, cursor: "pointer", fontSize: 11, fontWeight: 900, padding: 0, textAlign: "left" }}>
                      {label} {sort.key === key ? (sort.dir === "desc" ? "↓" : "↑") : ""}
                    </button>
                  ) : (
                    <span style={{ color: t.textStrong, fontSize: 11, fontWeight: 900 }}>{label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => {
              const selected = row.id === selectedId
              const expanded = expandedRowId === row.id
              const detailRows = [
                [text(lang, "吸附量", "Uptake"), <MetricWithSource record={row} metric="primaryUptake" value={formatMetricValue(row, "primaryUptake", lang)} unit="mmol/g" t={t} lang={lang} />],
                [text(lang, "选择性", "Selectivity"), <MetricWithSource record={row} metric="selectivity" value={formatMetricValue(row, "selectivity", lang)} unit="dimensionless" t={t} lang={lang} />],
                [text(lang, "工作容量", "Working capacity"), <MetricWithSource record={row} metric="workingCapacity" value={formatMetricValue(row, "workingCapacity", lang)} unit="mmol/g" t={t} lang={lang} />],
                [text(lang, "可再生性", "Regenerability"), <MetricWithSource record={row} metric="regenerability" value={formatMetricValue(row, "regenerability", lang)} unit="%" t={t} lang={lang} />],
                [text(lang, "水稳定性", "Water stability"), <MetricWithSource record={row} field="waterStability" value={row.waterStability || formatPending(lang)} unit="status" t={t} lang={lang} label={text(lang, "水稳定性", "Water stability")} />],
                [text(lang, "历史 GasScore", "Legacy GasScore"), <MetricWithSource record={row} field="gasScore" value={formatScore100(row.score, lang)} unit="/100" t={t} lang={lang} label={text(lang, "历史 GasScore", "Legacy GasScore")} />],
              ]
              return [
                <tr key={row.id} onClick={() => onSelect(row.id)} style={{ background: selected ? t.badgeInfoBg : t.surface, cursor: "pointer" }}>
                  <td style={tableCellStyle(t)} onClick={event => event.stopPropagation()}>
                    <input type="checkbox" checked={compareIds.includes(row.id)} onChange={() => toggleCompare(row.id)} aria-label={text(lang, `对比 ${row.displayName}`, `Compare ${row.displayName}`)} />
                  </td>
                  <td style={{ ...tableCellStyle(t), color: t.textStrong, fontFamily: FONT_SANS, fontWeight: 900, whiteSpace: "nowrap" }}>{row.gasScreening?.methodRank ?? ranked.findIndex(item => item.id === row.id) + 1}</td>
                  <td style={{ ...tableCellStyle(t), color: t.textStrong, fontWeight: 900, overflowWrap: "anywhere" }}>
                    <ChemicalText value={row.displayName} />
                    <div style={{ color: t.faint, fontSize: 10.8, fontWeight: 760, lineHeight: 1.45, marginTop: 4 }}><ChemicalText value={row.sourceDatabase} /></div>
                  </td>
                  <td style={{ ...tableCellStyle(t), whiteSpace: "nowrap" }}><ChemicalFormula value={row.gasPair} /></td>
                  <td style={tableCellStyle(t)}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong style={{ color: t.accentText, fontSize: 12.2 }}><ChemicalText value={gasMethodScoreLabel(row, row.gasScreening?.methodId, lang)} /></strong>
                      <span style={{ color: t.muted, fontSize: 11 }}>
                        {text(lang, "吸附", "Uptake")} {formatMetricValue(row, "primaryUptake", lang)} · {text(lang, "选择", "Sel.")} {formatMetricValue(row, "selectivity", lang)}
                      </span>
                      <span style={{ color: t.subtle, fontSize: 11 }}>APS {formatMetricValue(row, "aps", lang)} · {text(lang, "工作", "Work")} {formatMetricValue(row, "workingCapacity", lang)}</span>
                    </div>
                  </td>
                  <td style={tableCellStyle(t)}>
                    <div style={{ alignItems: "flex-start", display: "flex", flexDirection: "column", gap: 5 }}>
                      <GasDataStatusBadge type="evidence" value={row.evidenceLevel} lang={lang} />
                      <GasDataStatusBadge type="dataType" value={row.dataType} lang={lang} />
                    </div>
                  </td>
                  <td style={tableCellStyle(t)}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <button type="button" onClick={event => { event.stopPropagation(); setExpandedRowId(expanded ? null : row.id) }} style={{ background: expanded ? t.badgeInfoBg : t.panel, border: `1px solid ${expanded ? t.accentText : t.border}`, borderRadius: 7, color: expanded ? t.accentText : t.textStrong, cursor: "pointer", fontSize: 11, fontWeight: 850, padding: "6px 8px" }}>
                        {expanded ? text(lang, "收起详情", "Collapse") : text(lang, "展开详情", "Details")}
                      </button>
                    <button type="button" onClick={event => { event.stopPropagation(); window.location.hash = "library" }} aria-label={text(lang, `在候选库查看 ${row.displayName}`, `View ${row.displayName} in MOF Library`)} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontSize: 11, fontWeight: 850, padding: "6px 8px" }}>
                      {text(lang, "打开候选库", "View in MOF Library")}
                    </button>
                    </div>
                  </td>
                </tr>,
                expanded ? (
                  <tr key={`${row.id}-details`} style={{ background: selected ? t.badgeInfoBg : t.surface }}>
                    <td colSpan={7} style={{ borderBottom: `1px solid ${t.divider}`, padding: "0 8px 11px 72px" }}>
                      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, padding: 11 }}>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                          {detailRows.map(([label, value]) => (
                            <div key={label} style={{ minWidth: 0 }}>
                              <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
                              <div style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.5, marginTop: 4, overflowWrap: "anywhere" }}>{value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ color: t.subtle, fontSize: 11.3, lineHeight: 1.5 }}>
                          {text(lang, "来源记录", "Source record")}: <ChemicalText value={row.sourceRecordId || formatPending(lang)} /> · {text(lang, "文献/来源", "Citation")}: <ChemicalText value={row.citation || formatPending(lang)} /> · {text(lang, "整理状态", "Curation")}: <ChemicalText value={row.curationStatus || formatPending(lang)} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null,
              ]
            })}
          </tbody>
        </table>
      </div>
      {!filtered.length ? <Callout tone="warn">{text(lang, "筛选后无候选。", "No candidates after filtering.")}</Callout> : null}
      {activeGate !== "all" ? (
        <button type="button" onClick={() => setActiveGate("all")} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontSize: 11.5, fontWeight: 850, marginTop: 10, padding: "7px 9px" }}>
          {text(lang, "清除漏斗过滤", "Clear funnel filter")}
        </button>
      ) : null}
    </section>
  )
}

function CompareInsightPanel({ selected, compareRows, t, lang, isMobile }) {
  const rows = compareRows.length ? compareRows : selected ? [selected] : []
  const metrics = ["methodScore", "selectivity", "workingCapacity", "primaryUptake", "regenerability", "legacyGasScore"]
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
            {text(lang, "左侧为当前选中候选；勾选“对比”后会在同一指标行内直接显示强弱项与数据等级。", "The selected candidate stays in view; checked Compare rows show strengths and data grades on the same metric rows.")}
          </div>
        </div>
        <BasisBadge tone={compareRows.length ? "info" : "warn"}>{compareRows.length ? text(lang, `${compareRows.length} 个对比`, `${compareRows.length} compare`) : text(lang, "未勾选对比", "no compare selected")}</BasisBadge>
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
                    <span style={{ color: isBest ? t.accentText : t.textStrong, fontFamily: metric === "legacyGasScore" || metric === "methodScore" ? FONT_SANS : undefined, fontSize: 12, fontWeight: isBest ? 930 : 780 }}>
                      {formatMetricValue(row, metric, lang)} {isBest ? "↑" : ""}
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
  if (!record) return <Callout tone="warn">{text(lang, "选中的 MOF 不存在。", "Selected MOF does not exist.")}</Callout>
  const breakdown = record.scoreBreakdown || {}
  const contributions = breakdown.contributions || {}
  const contributionRows = ["uptake", "selectivity", "workingCapacity", "regenerability", "stability", "evidence"]
  const method = record.gasScreening?.activeMethod || getGasRankingMethod(record.gasScreening?.methodId)
  const methodRows = [
    `${text(lang, "当前方法", "Current method")}：${text(lang, method.labelZh, method.label)}`,
    `${text(lang, "当前方法指标", "Method metric")}：${gasMethodScoreLabel(record, method.id, lang)}`,
    `APS：${formatMetricValue(record, "aps", lang)}`,
    `APS×R%：${formatMetricValue(record, "apsRegenerability", lang)}`,
    `CRITIC：${formatMetricValue(record, "criticScore", lang)}`,
    `${text(lang, "Pareto 状态", "Pareto status")}：${record.gasScreening?.paretoFrontier ? text(lang, "非支配前沿", "non-dominated frontier") : text(lang, "被其它候选支配或缺少 APS 字段", "dominated or APS fields pending")}`,
  ]
  const sourceRows = ["primaryUptake", "selectivity", "workingCapacity", "evidenceLevel", "gasScore"].map(field => {
    const source = getFieldSource(record, field)
    return `${field === "gasScore" ? text(lang, "历史 GasScore", "Legacy GasScore") : metricLabel(field, lang)}：${source.sourceType || "pending"}`
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
        <InfoList title={text(lang, "当前排序方法依据", "Current ranking basis")} rows={methodRows} t={t} />
        <InfoList title={text(lang, "适合当前气体对的原因", "Why it fits this gas pair")} rows={record.whyRecommended || []} t={t} />
        <InfoList title={text(lang, "历史 GasScore 主要贡献", "Legacy GasScore contributors")} rows={breakdown.topDrivers || []} t={t} />
        <InfoList title={text(lang, "拖累项与风险", "Draggers and risks")} rows={[...(breakdown.draggers || []), ...(record.risks || [])]} t={t} />
        <InfoList title={text(lang, "解释使用的数据来源类型", "Source types used in explanation")} rows={sourceRows} t={t} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, marginTop: 12 }}>
        <div style={surfaceStyle(t)}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "历史 GasScore 贡献拆解", "Legacy GasScore Contribution")}</strong>
          <div style={{ color: t.subtle, fontSize: 11.2, lineHeight: 1.45, marginTop: 6 }}>
            {text(lang, "该拆解仅用于理解旧启发式分数，不是当前默认科研排序依据。", "This explains the legacy heuristic score only; it is not the default scientific ranking basis.")}
          </div>
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
          <button type="button" onClick={onOpenMethod} aria-label={text(lang, "查看 GasSep 方法依据", "View GasSep methodology")} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontSize: 11.5, fontWeight: 850, marginTop: 10, padding: "7px 9px" }}>
            {text(lang, "查看方法依据", "View methodology")}
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
      <SectionTitle>{text(lang, "机理与描述符解释", "Mechanism & Descriptor Interpretation")}</SectionTitle>
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

function MetricComparisonContext({ selected, compareRows, ranked, t, lang, isMobile }) {
  const rows = compareRows.length ? compareRows : selected ? [selected] : []
  return (
    <section style={{ alignItems: "center", color: t.subtle, display: "flex", flexWrap: "wrap", fontSize: 12, gap: 8, lineHeight: 1.55 }}>
      <strong style={{ color: t.textStrong }}>{text(lang, "多指标联动", "Multi-metric linkage")}</strong>
      <span>{text(lang, "当前选中", "selected")}: <ChemicalText value={selected?.displayName || formatPending(lang)} /></span>
      <span style={{ color: t.faint }}>·</span>
      <span>{text(lang, "对比", "compare")}: <span className="num">{compareRows.length}</span> / 3</span>
      <span style={{ color: t.faint }}>·</span>
      <span>{text(lang, "热力图记录", "heatmap rows")}: <span className="num">{ranked.length}</span></span>
      <span style={{ color: t.faint }}>·</span>
      <span>{text(lang, "雷达图随表格勾选实时更新", "radar updates from table selections")}</span>
      {isMobile && rows.length ? (
        <div style={{ display: "flex", flexBasis: "100%", flexWrap: "wrap", gap: 6 }}>
          {rows.map(row => <BasisBadge key={row.id} tone="info">{row.displayName}</BasisBadge>)}
        </div>
      ) : null}
    </section>
  )
}

function DataLinkedValidationPlanner({ ranked, selected, screening, scenario, t, lang, isMobile }) {
  const coverage = screening?.coverage || {}
  const total = coverage.total || ranked.length || 0
  const pct = value => total ? Math.round((Number(value || 0) / total) * 100) : 0
  const paretoCount = screening?.paretoFrontier?.length || ranked.filter(row => row.gasScreening?.paretoFrontier).length
  const topGate = (screening?.screeningFunnel || []).find(gate => gate.id === "pareto-frontier") || (screening?.screeningFunnel || [])[0]
  const rows = [
    {
      id: "selectivity",
      label: text(lang, "选择性覆盖", "Selectivity coverage"),
      value: `${coverage.withSelectivity || 0}/${total}`,
      note: text(lang, `IAST ${coverage.withIastSelectivity || 0} · 实验/来源 ${coverage.withExperimentalSelectivity || 0}`, `IAST ${coverage.withIastSelectivity || 0} · source/experimental ${coverage.withExperimentalSelectivity || 0}`),
      tone: pct(coverage.withSelectivity) >= 60 ? "calc" : "warn",
    },
    {
      id: "isotherm",
      label: text(lang, "等温线与工作容量", "Isotherm and capacity"),
      value: `${coverage.withIsotherm || 0}/${total}`,
      note: text(lang, `工作容量字段 ${coverage.withWorkingCapacity || 0} 条`, `${coverage.withWorkingCapacity || 0} rows with working capacity`),
      tone: pct(coverage.withWorkingCapacity) >= 40 ? "info" : "warn",
    },
    {
      id: "frontier",
      label: text(lang, "前沿候选队列", "Frontier queue"),
      value: paretoCount,
      note: topGate ? text(lang, `${topGate.labelZh || "漏斗"} ${topGate.count || 0} 条`, `${topGate.label || "funnel"} ${topGate.count || 0} rows`) : text(lang, "随漏斗与排序变化", "changes with funnel and ranking"),
      tone: paretoCount ? "calc" : "warn",
    },
    {
      id: "selected",
      label: text(lang, "当前候选验证", "Selected validation"),
      value: selected?.displayName || formatPending(lang),
      note: selected ? `${gasMethodScoreLabel(selected, selected.gasScreening?.methodId, lang)} · ${selected.evidenceLevel || "pending"}` : formatPending(lang),
      tone: selected?.evidenceLevel === "A" ? "calc" : selected?.evidenceLevel === "B" ? "info" : "warn",
    },
  ]
  return (
    <section style={cardStyle(t)}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <SectionTitle>{text(lang, "数据联动验证队列", "Data-linked Validation Queue")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
            {text(lang, "队列由当前气体对、字段覆盖、漏斗和选中候选实时生成；不会固定显示与数据无关的路线。", "The queue is generated from the current gas pair, field coverage, funnel, and selected candidate; it does not show data-independent steps.")}
          </div>
        </div>
        <BasisBadge tone={coverage.thin ? "warn" : "calc"}>{formatGasPairLabel(scenario.gasPair)}</BasisBadge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
        {rows.map(row => (
          <div key={row.id} style={surfaceStyle(t)}>
            <BasisBadge tone={row.tone}>{row.label}</BasisBadge>
            <div style={{ color: t.textStrong, fontSize: row.id === "selected" ? 13.5 : 18, fontWeight: 920, lineHeight: 1.25, marginTop: 8, overflowWrap: "anywhere" }}>
              <ChemicalText value={row.value} />
            </div>
            <div style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.5, marginTop: 6 }}><ChemicalText value={row.note} /></div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function gasMetricFormulaBasis(record, lang) {
  const grade = String(record?.dataGrade || record?.evidence?.dataGrade || "").toLowerCase()
  const dataType = String(record?.dataType || record?.sourceType || record?.evidence?.dataType || "").toLowerCase()
  const selectivitySource = String(record?.fieldSources?.selectivity?.sourceType || "").toLowerCase()
  const iastSource = String(record?.fieldSources?.iaSTSelectivity?.sourceType || "").toLowerCase()
  const hasIastValue = Number.isFinite(Number(record?.iaSTSelectivity ?? record?.metrics?.iaSTSelectivity))
  const isComputedIast = record?.iastStatus === "computed-IAST"
    || selectivitySource.includes("iast_from_pure_component")
    || iastSource.includes("iast_from_pure_component")
  const isSourceIast = !isComputedIast && (hasIastValue || grade.includes("iast") || dataType.includes("iast") || selectivitySource.includes("iast") || iastSource.includes("iast"))
  const isPredicted = dataType.includes("predicted") || grade.includes("predicted")
  const isUptakeRatio = selectivitySource.includes("uptake_ratio") || selectivitySource.includes("single_component_ratio")
  const capacityDerived = record?.capacityStatus === "isotherm-derived"
  const regenerabilityDerived = capacityDerived && Number.isFinite(Number(record?.primaryUptake ?? record?.metrics?.primaryUptake))

  let selectivity
  if (isComputedIast) {
    selectivity = {
      kind: text(lang, "本项目重算 IAST", "recalculated IAST"),
      formula: "Sᵢ/ⱼᴵᴬˢᵀ = (xᵢ/yᵢ) / (xⱼ/yⱼ)",
      note: text(lang, "由同温纯组分等温线与气相组成求得，不等同于穿透实验选择性。", "Derived from temperature-matched pure-component isotherms and gas composition; it is not breakthrough selectivity."),
    }
  } else if (isSourceIast) {
    selectivity = {
      kind: text(lang, "来源 IAST 值", "source-reported IAST"),
      formula: "Sᵢ/ⱼᴵᴬˢᵀ,(ʳ) = Ssourceᴵᴬˢᵀ(κᵣ)",
      note: text(lang, "沿用来源标记的 IAST 值与工况；没有成对原始等温线时，前端不重复推导。", "Retains the source-labelled IAST value and conditions; the frontend does not re-derive it without paired raw isotherms."),
    }
  } else if (isUptakeRatio) {
    selectivity = {
      kind: text(lang, "单点吸附比代理", "single-point uptake-ratio proxy"),
      formula: "Sᵢ/ⱼᵖʳᵒˣʸ = qᵢ / qⱼ",
      note: text(lang, "仅在来源明确标注单点吸附量比时使用，不能写成 IAST。", "Used only when the source explicitly defines a single-point uptake ratio; it is not IAST."),
    }
  } else if (isPredicted) {
    selectivity = {
      kind: text(lang, "模型预测", "model prediction"),
      formula: "Ŝᵢ/ⱼ = fθ(dₘ, κᵣ)",
      note: text(lang, "数值来自模型与记录工况 κr，不伪装成热力学方程或实验测量。", "The value comes from a model under record context κr, not from a thermodynamic equation or direct measurement."),
    }
  } else {
    selectivity = {
      kind: text(lang, "来源记录值", "source-reported value"),
      formula: "Sᵢ/ⱼ⁽ʳ⁾ = Ssource(κᵣ)",
      note: text(lang, "沿用来源记录的定义与工况 κr；没有原始组成或等温线时不在前端重新推导。", "The source definition and operating context κr are retained; the frontend does not re-derive the value without raw composition or isotherms."),
    }
  }

  return {
    selectivity,
    capacity: capacityDerived
      ? {
          formula: "Cw = q(Pads,T) − q(Pdes,T)",
          note: text(lang, "由同一等温线在当前压力窗口内插得到。", "Interpolated from the same isotherm over the current pressure window."),
        }
      : {
          formula: "Cw⁽ʳ⁾ = Cw,source(κᵣ)",
          note: text(lang, "当前工作容量为来源记录值，不展示成等温线差分结果。", "Working capacity is source-reported and is not shown as an isotherm-difference result."),
        },
    regenerability: regenerabilityDerived
      ? {
          formula: "R = 100 · Cw / q(Pads,T)",
          note: text(lang, "由当前工作容量与吸附压力下容量计算。", "Calculated from current working capacity and uptake at adsorption pressure."),
        }
      : {
          formula: "R⁽ʳ⁾ = Rsource(κᵣ)",
          note: text(lang, "当前可再生性沿用来源记录；没有同一等温线时不重新计算。", "Regenerability remains source-reported when a common isotherm is unavailable."),
        },
  }
}

function GasMaterialDecisionPanel({ ranked, selected, scenario, onSelect, t, lang, isMobile, isNarrow, onOpenMethod }) {
  if (!selected) return null
  const selectivity = valueForMetric(selected, "selectivity")
  const workingCapacity = valueForMetric(selected, "workingCapacity")
  const uptake = valueForMetric(selected, "primaryUptake")
  const regenerability = valueForMetric(selected, "regenerability")
  const source = selected.recordProvenance || {}
  const formulaBasis = gasMetricFormulaBasis(selected, lang)
  const evidenceLabel = selected.evidenceLevel || selected.dataGrade || selected.evidence?.dataGrade || "pending"
  const missing = [
    selectivity == null ? text(lang, "条件一致的选择性定义与数值", "condition-matched selectivity definition and value") : null,
    workingCapacity == null ? text(lang, "工作容量", "working capacity") : null,
    regenerability == null ? text(lang, "可再生性", "regenerability") : null,
    valueForMetric(selected, "stability") == null ? text(lang, "稳定性", "stability") : null,
  ].filter(Boolean)
  const isPareto = Boolean(selected.gasScreening?.paretoFrontier || selected.isPareto)
  return (
    <section
      data-testid="gassep-material-decision-panel"
      style={cardStyle(t, {
        display: "grid",
        gap: 14,
        gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 0.9fr) minmax(0, 1.1fr)",
        overflow: "hidden",
      })}
    >
      <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
        <div>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {text(lang, "材料与分离条件", "Material and separation conditions")}
          </span>
          <h2 style={{ color: t.textStrong, fontSize: isMobile ? 23 : 29, fontWeight: 940, letterSpacing: "-0.035em", lineHeight: 1.08, margin: "8px 0 0", overflowWrap: "anywhere" }}>
            <ChemicalText value={getReadableMofLabel(selected, lang)} />
          </h2>
          <div style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.55, marginTop: 7 }}>
            <ChemicalText value={`${formatGasPairLabel(scenario.gasPair)} · ${scenario.temperatureK} K · ${scenario.adsorptionPressureBar}/${scenario.desorptionPressureBar} bar · ${scenario.mixtureRatio}`} />
          </div>
        </div>
        <FormField t={t} label={text(lang, "选择当前 MOF 记录", "Select current MOF record")}>
          <SelectControl value={selected.id} onChange={onSelect} t={t} ariaLabel={text(lang, "选择 MOF 气体分离记录", "Select MOF gas-separation record")}>
            {ranked.slice(0, 120).map(record => (
              <option key={record.id} value={record.id}>
                {getReadableMofLabel(record, lang)} · {record.evidenceLevel || record.dataGrade || "pending"}
              </option>
            ))}
          </SelectControl>
        </FormField>
        <div aria-label={text(lang, "气体分离评价方程", "Gas-separation evaluation equations")} style={{ background: t.surface, borderLeft: `3px solid ${t.accent}`, borderRadius: 8, display: "grid", gap: 7, padding: "12px 13px" }}>
          <div style={{ color: t.textStrong, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: isMobile ? 17 : 20, lineHeight: 1.35 }}>
            {formulaBasis.selectivity.formula}
          </div>
          <div style={{ color: t.textStrong, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: isMobile ? 17 : 20, lineHeight: 1.35 }}>
            {formulaBasis.capacity.formula}
          </div>
          <div style={{ color: t.textStrong, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: isMobile ? 17 : 20, lineHeight: 1.35 }}>
            {formulaBasis.regenerability.formula}
          </div>
          <span style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.5 }}>
            <strong style={{ color: t.textStrong }}>{formulaBasis.selectivity.kind}: </strong>
            {formulaBasis.selectivity.note} {formulaBasis.capacity.note} {formulaBasis.regenerability.note}
          </span>
        </div>
        <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {[
            [text(lang, "数据类型", "Data type"), dataTypeLabel(selected.dataType || selected.sourceType, lang)],
            [text(lang, "证据等级", "Evidence grade"), evidenceLabel],
            [text(lang, "温度", "Temperature"), selected.temperatureK ? `${selected.temperatureK} K` : text(lang, "记录未报告", "not reported")],
            [text(lang, "来源", "Source"), source.sourceDatabase || selected.sourceDatabase || "pending"],
          ].map(([label, value]) => (
            <div key={label} style={surfaceStyle(t, { padding: 9 })}>
              <span style={{ color: t.faint, display: "block", fontSize: 9.8, fontWeight: 850 }}>{label}</span>
              <strong style={{ color: t.textStrong, display: "block", fontSize: 11.5, lineHeight: 1.4, marginTop: 4, overflowWrap: "anywhere" }}><ChemicalText value={value} /></strong>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, minWidth: 0, padding: isMobile ? 12 : 15 }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <div>
            <span style={{ color: t.faint, display: "block", fontSize: 10.5, fontWeight: 850 }}>{text(lang, "当前材料结论", "Current material conclusion")}</span>
            <strong style={{ color: t.textStrong, display: "block", fontSize: 15, marginTop: 4 }}>
              {isPareto
                ? text(lang, "位于当前多目标前沿", "On the current multi-objective frontier")
                : missing.length
                  ? text(lang, "数据不足，暂不进入严格排序", "Insufficient data for strict ranking")
                  : text(lang, "可进入当前工况的条件比较", "Eligible for condition-matched comparison")}
            </strong>
          </div>
          <BasisBadge tone={isPareto ? "calc" : missing.length ? "warn" : "info"}>{evidenceLabel}</BasisBadge>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
          {[
            [text(lang, "吸附量", "Uptake"), uptake == null ? formatPending(lang) : `${formatNumber(uptake)} mmol/g`],
            [text(lang, "选择性", "Selectivity"), selectivity == null ? formatPending(lang) : formatNumber(selectivity)],
            [text(lang, "工作容量", "Working capacity"), workingCapacity == null ? formatPending(lang) : `${formatNumber(workingCapacity)} mmol/g`],
            [text(lang, "可再生性", "Regenerability"), regenerability == null ? formatPending(lang) : `${formatNumber(regenerability)}%`],
          ].map(([label, value]) => (
            <div key={label} style={surfaceStyle(t, { padding: 9 })}>
              <span style={{ color: t.faint, display: "block", fontSize: 9.8, fontWeight: 850 }}>{label}</span>
              <strong style={{ color: t.textStrong, display: "block", fontSize: 13, lineHeight: 1.4, marginTop: 4 }}><ChemicalText value={value} /></strong>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 9, paddingTop: 10 }}>
          <div>
            <strong style={{ color: t.textStrong, fontSize: 11.7 }}>{text(lang, "性能判断", "Performance assessment")}</strong>
            <div style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.55, marginTop: 4 }}>
              {selectivity == null
                ? text(lang, "当前记录只有单组分或不完整吸附信息，不能把吸附量直接解释为混合物分离选择性。", "This record contains single-component or incomplete adsorption information; uptake cannot be interpreted as mixture-separation selectivity.")
                : text(lang, `在 ${formatGasPairLabel(scenario.gasPair)} 情景下，当前选择性为 ${formatNumber(selectivity)}，工作容量为 ${workingCapacity == null ? "待补" : `${formatNumber(workingCapacity)} mmol/g`}；需要与压力窗口和循环稳定性共同判断。`, `For ${formatGasPairLabel(scenario.gasPair)}, selectivity is ${formatNumber(selectivity)} and working capacity is ${workingCapacity == null ? "pending" : `${formatNumber(workingCapacity)} mmol/g`}; the pressure window and cyclic stability remain part of the decision.`)}
            </div>
          </div>
          <div>
            <strong style={{ color: t.textStrong, fontSize: 11.7 }}>{text(lang, "研究与验证状态", "Research and validation status")}</strong>
            <div style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.55, marginTop: 4 }}>
              {missing.length
                ? text(lang, `当前仍缺 ${missing.join("、")}。优先补充同温度纯组分等温线、IAST/混合物验证与循环数据，再进入工艺级判断。`, `Still missing ${missing.join(", ")}. Add temperature-matched pure-component isotherms, IAST/mixture validation, and cycling data before process-level decisions.`)
                : text(lang, "关键性能字段已接入；下一步仍应以突破曲线、湿度影响和循环实验核查工艺可行性。", "Key performance fields are present; breakthrough, humidity, and cycling experiments are still needed for process feasibility.")}
            </div>
          </div>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
            <span style={{ color: t.faint, fontSize: 10.3, lineHeight: 1.45, overflowWrap: "anywhere" }}>
              {source.doi ? `DOI ${source.doi}` : source.sourceRecordId || text(lang, "来源标识待补", "source identifier pending")}
            </span>
            <button type="button" onClick={onOpenMethod} style={{ ...toolbarBtn(t), color: t.accentText, justifyContent: "center" }}>
              {text(lang, "查看方法与文献", "Open methods and sources")}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ThermodynamicTooltip({ active, payload, label, t, lang, primaryGas, secondaryGas }) {
  if (!active || !payload?.length) return null
  const names = {
    primaryUptake: primaryGas,
    secondaryUptake: secondaryGas,
  }
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: "9px 11px" }}>
      <strong style={{ color: t.textStrong, fontSize: 11.5 }}>{text(lang, "压力", "Pressure")} {formatNumber(label, 3)} bar</strong>
      {payload.filter(item => item.value != null).map(item => (
        <span key={item.dataKey} style={{ color: item.color, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11.2 }}>
          <ChemicalText value={`${names[item.dataKey] || item.name}: ${formatNumber(item.value, 4)} mmol/g`} />
        </span>
      ))}
    </div>
  )
}

function thermodynamicChartRows(interpretation) {
  const byPressure = new Map()
  const add = (points, key) => {
    for (const point of points || []) {
      const pressureBar = Number(point.pressureBar)
      if (!Number.isFinite(pressureBar)) continue
      const id = pressureBar.toPrecision(10)
      const row = byPressure.get(id) || { pressureBar }
      row[key] = Number(point.uptake)
      byPressure.set(id, row)
    }
  }
  add(interpretation?.pair?.primary, "primaryUptake")
  add(interpretation?.pair?.secondary, "secondaryUptake")
  return [...byPressure.values()].sort((a, b) => a.pressureBar - b.pressureBar)
}

function thermodynamicFitFormula(result, lang) {
  const fit = result?.fit
  if (!fit || fit.status !== "fit-ok") {
    return {
      model: text(lang, "拟合不可用", "fit unavailable"),
      formula: text(lang, "需要至少 3 个有效等温线点", "requires at least 3 valid isotherm points"),
      r2: null,
    }
  }
  if (fit.model === "langmuir") {
    return {
      model: "Langmuir",
      math: "q(P)=\\frac{q_m bP}{1+bP}",
      formula: "q(P) = q_m bP / (1 + bP)",
      r2: fit.r2,
    }
  }
  if (fit.model === "dual-langmuir") {
    return {
      model: text(lang, "双位点 Langmuir", "Dual-site Langmuir"),
      math: "q(P)=\\sum_s\\frac{q_{m,s}b_sP}{1+b_sP}",
      formula: "q(P) = Σ_s q_m,s b_sP / (1 + b_sP)",
      r2: fit.r2,
    }
  }
  return {
    model: "Freundlich",
    math: "q(P)=K_F P^a",
    formula: "q(P) = K_F P^a",
    r2: fit.r2,
  }
}

function GasThermodynamicInterpretationPanel({ selected, records, scenario, t, lang, isMobile, isNarrow, onOpenMethod }) {
  const interpretation = useMemo(
    () => buildThermodynamicInterpretation(selected || {}, records, scenario),
    [selected, records, scenario],
  )
  if (!selected) return null
  const chartRows = thermodynamicChartRows(interpretation)
  const pair = interpretation.pair
  const currentScenario = scenarioFor(scenario.gasPair)
  const primaryGas = selected.primaryGas || currentScenario.primaryGas
  const secondaryGas = selected.secondaryGas || currentScenario.secondaryGas
  const iastComputed = interpretation.iast?.status === "computed-IAST"
  const qstAvailable = ["source-reported-qst", "clausius-clapeyron-qst"].includes(interpretation.qst?.status)
  const henryAvailable = interpretation.henryRatio !== null
  const sourceSelectivity = valueForMetric(selected, "selectivity")
  const primaryFit = thermodynamicFitFormula(interpretation.primaryHenry, lang)
  const secondaryFit = thermodynamicFitFormula(interpretation.secondaryHenry, lang)
  const iastUnavailableReason = interpretation.iast?.reason === "fitted-pure-pressure-outside-source-range"
    ? text(lang, "IAST 反算的纯组分压力超出来源曲线最高压力", "the IAST fictive pure-component pressure exceeds the source-curve maximum")
    : pair.secondary.length < 3
      ? text(lang, "缺少可绘制的副气等温线", "the secondary isotherm is unavailable")
      : !interpretation.recordTempMatches
        ? text(lang, "所选温度与等温线不一致", "the selected temperature does not match the isotherm")
        : !interpretation.pressureSupported
          ? text(lang, "所选总压超出两条等温线的共同范围", "the selected total pressure is outside the shared isotherm range")
          : text(lang, "IAST 数值求解未收敛", "the IAST numerical solution did not converge")
  const qstEvidence = interpretation.qst?.status === "source-reported-qst"
    ? text(lang, "来源记录值", "source-reported")
    : interpretation.qst?.status === "clausius-clapeyron-qst"
      ? text(
          lang,
          `${interpretation.qst.temperatureCount} 温度 · q=${formatCompactNumber(interpretation.qst.targetLoading, 3)} mmol/g${interpretation.qst.r2 == null ? "" : ` · R²=${formatCompactNumber(interpretation.qst.r2, 4)}`}`,
          `${interpretation.qst.temperatureCount} temperatures · q=${formatCompactNumber(interpretation.qst.targetLoading, 3)} mmol/g${interpretation.qst.r2 == null ? "" : ` · R²=${formatCompactNumber(interpretation.qst.r2, 4)}`}`,
        )
      : text(lang, "不可由当前记录推导", "not derivable from current record")

  const conclusion = iastComputed
    ? text(
        lang,
        `当前同温双等温线支持按 ${scenario.mixtureRatio}、${formatNumber(scenario.adsorptionPressureBar ?? scenario.pressureBar, 3)} bar 重算；IAST 选择性为 ${formatNumber(interpretation.iast.value, 4)}。该数值只解释平衡竞争吸附，不替代混合气穿透结果。`,
        `The temperature-matched pair supports recalculation at ${scenario.mixtureRatio} and ${formatNumber(scenario.adsorptionPressureBar ?? scenario.pressureBar, 3)} bar; IAST selectivity is ${formatNumber(interpretation.iast.value, 4)}. This explains equilibrium competition only and does not replace mixture breakthrough data.`,
      )
    : sourceSelectivity != null
      ? text(
          lang,
          `当前显示来源记录选择性 ${formatCompactNumber(sourceSelectivity, 4)}；由于${iastUnavailableReason}，本情景不重新计算 IAST。`,
          `The displayed selectivity is the source-record value ${formatCompactNumber(sourceSelectivity, 4)}. Scenario IAST is not recalculated because ${iastUnavailableReason}.`,
        )
      : text(
          lang,
          "当前记录不足以建立混合吸附选择性。吸附量不能直接替代 IAST 或突破选择性；应先补齐同一材料、同一温度下的两条纯组分等温线。",
          "The current record cannot establish mixture selectivity. Uptake cannot substitute for IAST or breakthrough selectivity; first add both pure-component isotherms for the same material and temperature.",
        )

  return (
    <section
      data-testid="gassep-thermodynamic-panel"
      style={cardStyle(t, {
        display: "grid",
        gap: 15,
        gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 0.82fr) minmax(0, 1.18fr)",
        overflow: "hidden",
        scrollMarginTop: isMobile ? 150 : 80,
      })}
    >
      <div data-testid="gassep-thermodynamic-formulas" style={{ display: "grid", gap: 12, minWidth: 0 }}>
        <div>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {text(lang, "吸附结果解释层", "Adsorption-result interpretation")}
          </span>
          <h2 style={{ color: t.textStrong, fontSize: isMobile ? 22 : 27, fontWeight: 940, letterSpacing: "-0.03em", lineHeight: 1.12, margin: "7px 0 0" }}>
            {text(lang, "吸附热力学与竞争平衡", "Adsorption Thermodynamics and Competitive Equilibrium")}
          </h2>
          <p style={{ color: t.muted, fontSize: 11.7, lineHeight: 1.6, margin: "7px 0 0" }}>
            {text(
              lang,
              "先用低压亲和解释“谁更容易进入孔道”，再用 IAST 解释有限压力下的竞争吸附，并用等量吸附热检查结合强度与潜在再生负担。",
              "Low-pressure affinity explains which gas enters the pores more readily, IAST addresses finite-pressure competition, and isosteric heat checks binding strength and potential regeneration burden.",
            )}
          </p>
        </div>

        <div aria-label={text(lang, "吸附热力学方程", "adsorption thermodynamic equations")} style={{ background: t.surface, borderLeft: `3px solid ${t.accent}`, borderRadius: 8, display: "grid", gap: 8, padding: "12px 13px" }}>
          {[
            {
              id: "henry-affinity",
              math: "K_{H,i}=\\lim_{P_i\\to0}\\frac{q_i}{P_i}=\\left(\\frac{\\partial q_i}{\\partial P_i}\\right)_{T,P_i\\to0}",
              fallback: "K_H,i = lim(P_i→0) q_i/P_i = (∂q_i/∂P_i)_(T,P_i→0)",
              label: text(lang, "定温零压极限亲和", "isothermal zero-pressure affinity"),
            },
            {
              id: "henry-ratio",
              math: "S_{H,A/B}=\\frac{K_{H,A}}{K_{H,B}}",
              fallback: "S_H,A/B = K_H,A / K_H,B",
              label: text(lang, "低压亲和比", "low-pressure affinity ratio"),
            },
            {
              id: "iast-selectivity",
              math: "S_{A/B}^{IAST}=\\frac{x_A/x_B}{y_A/y_B}=\\frac{x_A/y_A}{x_B/y_B}",
              fallback: "S_A/B^IAST = (x_A/x_B)/(y_A/y_B) = (x_A/y_A)/(x_B/y_B)",
              label: text(lang, "混合吸附平衡选择性", "mixture-equilibrium selectivity"),
            },
            {
              id: "iast-constraints",
              math: "y_iP=x_iP_i^0,\\quad \\pi_A(P_A^0)=\\pi_B(P_B^0),\\quad \\sum_i x_i=1",
              fallback: "y_i P = x_i P_i^0; π_A(P_A^0) = π_B(P_B^0); Σx_i = 1",
              label: text(lang, "二元 IAST 平衡与归一化约束", "binary IAST equilibrium and normalization constraints"),
            },
            {
              id: "isosteric-heat",
              math: "Q_{st}\\approx-R\\left(\\frac{\\partial\\ln P}{\\partial(1/T)}\\right)_q",
              fallback: "Q_st ≈ −R(∂lnP/∂(1/T))_q",
              label: text(lang, "理想气体近似下的等量吸附热", "isosteric heat under the ideal-gas approximation"),
            },
          ].map(({ id, math, fallback, label }) => (
            <div key={id} data-formula-id={id} aria-label={fallback} style={{ display: "grid", gap: 2 }}>
              <strong style={{ color: t.textStrong, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: isMobile ? 15.5 : 17.5, lineHeight: 1.3 }}>
                <InlineFormula math={math} fallback={fallback} />
              </strong>
              <span style={{ color: t.faint, fontSize: 10.2 }}>{label}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 6, marginTop: 2, paddingTop: 8 }}>
            {[
              [primaryGas, primaryFit],
              [secondaryGas, secondaryFit],
            ].map(([gas, fit]) => (
              <div key={gas} style={{ display: "grid", gap: 2 }}>
                <span style={{ color: t.textStrong, fontSize: 10.4, fontWeight: 850 }}>
                  <ChemicalText value={`${gas} · ${fit.model}${fit.r2 == null ? "" : ` · R² ${formatNumber(fit.r2, 4)}`}`} />
                </span>
                <span aria-label={fit.formula} style={{ color: t.subtle, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 12.8, lineHeight: 1.35 }}>
                  {fit.math ? <InlineFormula math={fit.math} fallback={fit.formula} /> : fit.formula}
                </span>
              </div>
            ))}
            <span style={{ color: t.faint, fontSize: 9.8, lineHeight: 1.4 }}>
              {text(lang, "图中为来源数据点；以上拟合仅用于 Henry 与 IAST 计算。", "The chart shows source points; these fits are used only for Henry and IAST calculations.")}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {[
            [
              text(lang, "Henry 亲和比", "Henry affinity ratio"),
              henryAvailable ? formatNumber(interpretation.henryRatio, 3) : formatPending(lang),
              henryAvailable
                ? text(lang, `${primaryGas}/${secondaryGas}；来自等温线拟合零压斜率`, `${primaryGas}/${secondaryGas}; fitted zero-pressure slopes`)
                : text(lang, "需要两条可拟合等温线", "requires two fittable isotherms"),
            ],
            [
              text(lang, "情景 IAST", "Scenario IAST"),
              iastComputed ? formatCompactNumber(interpretation.iast.value, 4) : formatPending(lang),
              iastComputed
                ? `${scenario.mixtureRatio} · ${formatNumber(scenario.adsorptionPressureBar ?? scenario.pressureBar, 3)} bar`
                : interpretation.iast?.reason === "fitted-pure-pressure-outside-source-range"
                  ? text(lang, "纯组分反算压力越过来源上限", "fictive pure pressure exceeds source range")
                  : text(lang, "保留来源值，不强行重算", "source value retained; no forced recalculation"),
            ],
            [
              text(lang, "等量吸附热 Qst", "Isosteric heat Qst"),
              qstAvailable ? `${formatNumber(interpretation.qst.value, 2)} ${interpretation.qst.unit}` : formatPending(lang),
              qstEvidence,
            ],
            [
              text(lang, "双等温线状态", "Paired-isotherm status"),
              pair.status === "paired-isotherms" ? text(lang, "同温已配对", "temperature-matched") : text(lang, "未满足", "not satisfied"),
              `${pair.primary.length} + ${pair.secondary.length} ${text(lang, "个数据点", "points")}`,
            ],
          ].map(([label, value, note]) => (
            <div key={label} style={surfaceStyle(t, { padding: 9 })}>
              <span style={{ color: t.faint, display: "block", fontSize: 9.8, fontWeight: 850 }}>{label}</span>
              <strong style={{ color: t.textStrong, display: "block", fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 13, lineHeight: 1.35, marginTop: 4 }}><ChemicalText value={value} /></strong>
              <span style={{ color: t.subtle, display: "block", fontSize: 9.8, lineHeight: 1.4, marginTop: 3 }}><ChemicalText value={note} /></span>
            </div>
          ))}
        </div>

        <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 9, color: t.muted, display: "grid", fontSize: 11.2, gap: 6, lineHeight: 1.55, padding: 10 }}>
          <strong style={{ color: t.textStrong }}>{text(lang, "解释结论", "Interpretation")}</strong>
          <ChemicalText value={conclusion} />
          <span style={{ color: t.faint, fontSize: 10.2 }}>
            {text(
              lang,
              "Qst 较高不自动等于材料更优；它可能同时意味着更强亲和和更高再生负担，必须与工作容量、解吸压力和循环数据共同解释。",
              "A higher Qst is not automatically better; it can indicate both stronger affinity and a larger regeneration burden, so it must be interpreted with working capacity, desorption pressure, and cycling data.",
            )}
          </span>
        </div>
      </div>

      <div data-testid="gassep-thermodynamic-chart" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, minWidth: 0, padding: isMobile ? 11 : 14 }}>
        <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <div>
            <strong style={{ color: t.textStrong, display: "block", fontSize: 14.5 }}>
              <ChemicalText value={text(lang, `${primaryGas} / ${secondaryGas} 纯组分等温线`, `${primaryGas} / ${secondaryGas} pure-component isotherms`)} />
            </strong>
            <span style={{ color: t.faint, display: "block", fontSize: 10.5, lineHeight: 1.45, marginTop: 4 }}>
              {pair.primaryTemperatureK ? `${pair.primaryTemperatureK} K` : text(lang, "温度待补", "temperature pending")} · {text(lang, "同一纵轴保留数量级差异；原始点连接，不补造缺失点", "one shared y-axis preserves scale differences; source points are connected without fabricating missing points")}
            </span>
          </div>
          <BasisBadge tone={pair.status === "paired-isotherms" ? "calc" : "warn"}>
            {pair.status === "paired-isotherms" ? text(lang, "双曲线已接入", "two curves available") : text(lang, "副气曲线待补", "secondary curve pending")}
          </BasisBadge>
        </div>

        <div style={{ height: isMobile ? 285 : 360, minWidth: 0 }}>
          {chartRows.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows} margin={{ top: 12, right: 18, bottom: 30, left: 6 }}>
                <CartesianGrid stroke={t.border} strokeDasharray="3 4" />
                <XAxis
                  dataKey="pressureBar"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tick={{ fill: t.subtle, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 10.5 }}
                  tickFormatter={value => formatCompactNumber(value, 3)}
                  label={{ value: text(lang, "压力 / bar", "Pressure / bar"), fill: t.subtle, fontSize: 10.5, dy: 20 }}
                />
                <YAxis
                  tick={{ fill: t.subtle, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 10.5 }}
                  label={{ value: text(lang, "吸附量 / mmol·g⁻¹", "Uptake / mmol·g⁻¹"), fill: t.subtle, fontSize: 10.5, angle: -90, dx: -10 }}
                />
                <Tooltip content={<ThermodynamicTooltip t={t} lang={lang} primaryGas={primaryGas} secondaryGas={secondaryGas} />} />
                <Legend
                  align="right"
                  height={24}
                  verticalAlign="top"
                  wrapperStyle={{ color: t.subtle, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 10.5 }}
                />
                <ReferenceLine
                  x={Number(scenario.adsorptionPressureBar ?? scenario.pressureBar)}
                  stroke={t.warn}
                  strokeDasharray="5 4"
                  label={{ value: text(lang, "情景压力", "scenario P"), fill: t.warn, fontSize: 10 }}
                />
                <Line dataKey="primaryUptake" name={primaryGas} type="linear" stroke={CHART_COLORS[0]} strokeWidth={2.3} dot={{ r: 3 }} connectNulls />
                {pair.secondary.length ? (
                  <Line dataKey="secondaryUptake" name={secondaryGas} type="linear" stroke={CHART_COLORS[1]} strokeWidth={2.3} dot={{ r: 3 }} connectNulls />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Callout tone="warn">{text(lang, "当前记录没有可绘制的纯组分等温线。", "The current record has no plottable pure-component isotherm.")}</Callout>
          )}
        </div>

        {pair.secondary.length < 3 ? (
          <Callout tone="warn">
            {text(
              lang,
              "PPT 反馈要求两种气体的等温线同时出现；当前来源只保存了主气曲线或副气链接，未保存可绘制副气点，因此这里明确标记缺口，不复制或推测第二条曲线。",
              "The PPT asks for both gas isotherms. This source stores only the primary curve or a secondary link without plottable points, so the gap is shown explicitly rather than copying or inferring a second curve.",
            )}
          </Callout>
        ) : null}

        <div style={{ borderTop: `1px solid ${t.border}`, color: t.faint, display: "grid", fontSize: 10.1, gap: 4, lineHeight: 1.45, paddingTop: 9 }}>
          <span><strong style={{ color: t.textStrong }}>{text(lang, "主气来源", "Primary source")}:</strong> {pair.primarySourceId || formatPending(lang)}</span>
          <span><strong style={{ color: t.textStrong }}>{text(lang, "副气来源", "Secondary source")}:</strong> {pair.secondarySourceId || formatPending(lang)}</span>
          <button type="button" onClick={onOpenMethod} style={{ ...toolbarBtn(t), color: t.accentText, justifyContent: "center", marginTop: 4 }}>
            {text(lang, "查看热力学方法与文献", "Open thermodynamic methods and sources")}
          </button>
        </div>
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
  const [rankingSortMetric, setRankingSortMetric] = useState("methodScore")
  const [heatmapView, setHeatmapView] = useState("normalized")
  const [heatmapSortMetric, setHeatmapSortMetric] = useState("methodScore")
  const [compareMofIds, setCompareMofIds] = useState([])
  const [activeInspectorCell, setActiveInspectorCell] = useState(null)
  const [activeGate, setActiveGate] = useState("all")
  const [scenario, setScenario] = useState({
    gasPair: "CO2/N2",
    applicationScenario: "flue gas carbon capture",
    temperatureK: 298,
    pressureBar: 1,
    adsorptionPressureBar: 1,
    desorptionPressureBar: 0.15,
    mixtureRatio: "15/85",
    targetPriority: "Balanced",
    rankingMethod: DEFAULT_GAS_RANKING_METHOD,
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
    setHeatmapSortMetric("methodScore")
    setRankingSortMetric("methodScore")
    setActiveGate("all")
  }, [scenario.gasPair, scenario.rankingMethod])

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
        title={text(lang, "气体分离", "GasSep")}
        subtitle={text(
          lang,
          "以气体组成、温度和压力为条件，联动候选筛选、热力学解释、排序与验证路线；所有数值保持证据等级、字段溯源与不确定性边界。",
          "A condition-driven workspace linking candidate screening, thermodynamic interpretation, ranking, and validation planning while preserving evidence level, field provenance, and uncertainty boundaries."
        )}
        meta={text(lang, "场景构建 · 双等温线 · 热力学解释 · 证据链", "scenario builder · paired isotherms · thermodynamic interpretation · evidence chain")}
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
      {status === "fallback" ? <Callout tone="warn">{text(lang, "Gas Adsorption v1 数据不可用，已回退到演示数据，仅用于界面验证。", "Gas Adsorption v1 data is unavailable; falling back to Demo | interface validation only.")}</Callout> : null}

      <ScenarioBuilder scenario={scenario} setScenario={setScenario} t={t} lang={lang} isMobile={isMobile} isNarrow={isNarrow} />
      <GasMaterialDecisionPanel
        ranked={ranked}
        selected={selected}
        scenario={scenario}
        onSelect={setSelectedMofId}
        t={t}
        lang={lang}
        isMobile={isMobile}
        isNarrow={isNarrow}
        onOpenMethod={openMethod}
      />
      <GasThermodynamicInterpretationPanel
        selected={selected}
        records={records}
        scenario={scenario}
        t={t}
        lang={lang}
        isMobile={isMobile}
        isNarrow={isNarrow}
        onOpenMethod={openMethod}
      />
      <Overview ranked={ranked} scenario={scenario} screening={screening} t={t} lang={lang} isMobile={isMobile} />
      <GasSepDatabaseSummaryCard summary={gasSepSummary} exportRows={gasSepExportRows} lang={lang} t={t} isMobile={isMobile} />
      <ConditionSummary ranked={ranked} scenario={scenario} t={t} lang={lang} isMobile={isMobile} />
      <GasCoverageNotice coverage={screening.coverage} collectionReport={collectionReport} iastReport={iastReport} identityReport={identityReport} proxyReport={proxyReport} t={t} lang={lang} />
      <RankingMethodEvidencePanel screening={screening} scenario={scenario} setScenario={setScenario} ranked={ranked} t={t} lang={lang} isMobile={isMobile} />
      <ScreeningFunnelPanel funnel={screening.screeningFunnel} activeGate={activeGate} setActiveGate={setActiveGate} t={t} lang={lang} isMobile={isMobile} />
      <PerformanceMap ranked={ranked} selectedId={selected?.id} onSelect={setSelectedMofId} chartConfig={chartConfig} setChartConfig={setChartConfig} t={t} lang={lang} isMobile={isMobile} isNarrow={isNarrow} />
      <CandidateRankingTable ranked={ranked} selectedId={selected?.id} onSelect={setSelectedMofId} compareIds={compareMofIds} setCompareIds={setCompareMofIds} activeGate={activeGate} setActiveGate={setActiveGate} t={t} lang={lang} isMobile={isMobile} />
      <CompareInsightPanel selected={selected} compareRows={compareRows} t={t} lang={lang} isMobile={isMobile} />
      <RankingStabilityPanel screening={screening} scenario={scenario} setScenario={setScenario} onSelect={setSelectedMofId} t={t} lang={lang} isMobile={isMobile} />
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
      <MetricComparisonContext selected={selected} compareRows={compareRows} ranked={ranked} t={t} lang={lang} isMobile={isMobile} />

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
      <DataLinkedValidationPlanner ranked={ranked} selected={selected} screening={screening} scenario={scenario} t={t} lang={lang} isMobile={isMobile} />
    </div>
  )
}
