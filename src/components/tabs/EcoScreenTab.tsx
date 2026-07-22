// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts"
import {
  useT, useLang, useViewport,
  FONT_SANS,
  BasisBadge, PageHeader, ResultLayer, Callout, CopyLinkButton, DisclaimerLink,
  toolbarBtn, InlineFormula,
  CRITIC_INDICATORS,
  buildCriticScoringModel,
  createScoringModel,
  PERFORMANCE_PRIORITY_MODES,
  GlobalScoringWorkbench,
  getDataGapRecommendations,
  DEFAULT_CANDIDATE_DATA_MODE,
  useMofCandidates,
  GraphDescriptorPanel,
  OrganicAcidRelevancePanel,
} from "../../shared"
import { ScreeningTraceSection } from "../screening-trace/ScreeningTraceSection"
import { MofRationaleCard } from "../catalysis/MofRationaleCard"
import { ReactionFingerprintPanel } from "../catalysis/ReactionFingerprintPanel"
import { useMofReactionProfile } from "../catalysis/reactionRationaleData"
import { DataQualityAuditPanel } from "../data-quality/DataQualityAuditPanel"
import { DataQualitySummary } from "../data-quality/DataQualitySummary"
import { fetchDataJson } from "../../services/dataService"

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0))
const pct = value => `${Math.round(clamp01(value) * 100)}%`
const fmt = (value, digits = 3) => Number(value || 0).toFixed(digits)
const fmtPct = value => `${Math.round(clamp01(value) * 100)}%`
const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const localize = (value, lang) => value && typeof value === "object" ? value[lang === "zh" ? "zh" : "en"] : value

function buildTraceModelFromScoringModel(scoringModel) {
  const descriptorsByKey = new Map((scoringModel.descriptors || []).map(descriptor => [descriptor.key, descriptor]))
  const weights = Object.entries(scoringModel.weights || {}).map(([key, weight]) => {
    const descriptor = descriptorsByKey.get(key)
    return {
      key,
      weight,
      label: descriptor?.label || key,
      zhLabel: descriptor?.labelZh || descriptor?.label || key,
    }
  })
  const candidates = (scoringModel.rankings || []).map(row => ({
    ...(row.candidate || {}),
    ...row,
    displayName: row.candidate?.displayName || row.name,
    D_expected: row.score,
    finalScore: row.score,
    G: 1,
    fieldSources: row.candidate?.fieldSources || row.fieldSources || {},
    scoreInputs: Object.fromEntries((row.contributions || []).map(item => [
      item.key,
      { normalized: item.normalizedValue, missing: item.missing },
    ])),
  }))
  return {
    ...scoringModel,
    candidates,
    weights,
  }
}

function labelStatus(status, lang) {
  if (!status) return "—"
  return lang === "zh" ? status.zh : status.label
}

function chartName(name, lang) {
  if (lang !== "zh") return name
  const labels = {
    "CRITIC weight": "CRITIC 权重",
    "active mode weight": "当前模式权重",
    "Performance Score": "性能分",
    "Sustainability Score": "可持续性分",
    "Evidence Score": "证据分",
  }
  return labels[name] || name
}

function Card({ children, style, t, as: Tag = "section", ...rest }) {
  return (
    <Tag {...rest} style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: 14,
      minWidth: 0,
      ...style,
    }}>
      {children}
    </Tag>
  )
}

function PanelTitle({ title, subtitle, t }) {
  return (
    <div>
      <h3 style={{ margin: 0, color: t.textStrong, fontSize: 14, lineHeight: 1.25, fontWeight: 900 }}>{title}</h3>
      {subtitle && <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 4 }}>{subtitle}</div>}
    </div>
  )
}

function ScoreBar({ value, color, t }) {
  return (
    <div style={{ height: 7, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, overflow: "hidden" }}>
      <div style={{ height: "100%", width: pct(value), background: color || t.accentText, borderRadius: 999 }} />
    </div>
  )
}

function MetricCard({ label, value, note, t, tone = "info" }) {
  const toneColor = tone === "warn" ? t.warn : tone === "calc" ? t.success : tone === "proxy" ? t.amber : t.accentText
  return (
    <Card t={t} style={{ display: "grid", gap: 6, padding: 13 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0 }}>{label}</div>
      <div style={{ color: toneColor, fontSize: 22, fontWeight: 920, lineHeight: 1.12, overflowWrap: "anywhere", wordBreak: "break-word" }}>{value}</div>
      {note && <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.35 }}>{note}</div>}
    </Card>
  )
}

function SegmentedControl({ items, value, onChange, lang, t }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {items.map(item => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            title={lang === "zh" ? item.zhDescription || item.description : item.description}
            style={{
              background: active ? t.badgeInfoBg : t.panel,
              border: `1px solid ${active ? t.accent : t.border}`,
              borderRadius: 7,
              color: active ? t.accentText : t.muted,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 850,
              lineHeight: 1.25,
              padding: "8px 10px",
              minHeight: 34,
            }}
          >
            {lang === "zh" ? item.zhLabel || item.label : item.label}
          </button>
        )
      })}
    </div>
  )
}

const ECOSCREEN_METHOD_BASIS = [
  {
    id: "adsorption",
    title: { zh: "吸附筛选不能只看容量", en: "Adsorption screening cannot use uptake alone" },
    basis: { zh: "高通量 MOF 分离研究通常同时考察吸附量、选择性、工作容量、再生/循环代价和条件可比性。", en: "High-throughput MOF separation studies usually consider uptake, selectivity, working capacity, regeneration burden, and condition comparability together." },
    source: "Wilmer et al. 2012; Bae & Snurr 2013",
  },
  {
    id: "stability",
    title: { zh: "水稳定性是应用门槛", en: "Water stability is an application gate" },
    basis: { zh: "湿气、水相或烟道气情景下，水稳定性不足会让容量/选择性排序失去实际意义。", en: "In humid, aqueous, or flue-gas settings, insufficient water stability can invalidate a capacity/selectivity shortlist." },
    source: "Burtch, Jasuja & Walton 2014",
  },
  {
    id: "lca",
    title: { zh: "LCA/LCC 需要明确边界", en: "LCA/LCC needs an explicit boundary" },
    basis: { zh: "生命周期评价要先声明目标、范围、功能单位、清单数据与影响类别；当前页面只能作为早筛覆盖审查。", en: "Life-cycle assessment requires goal/scope, functional unit, inventory data, and impact categories; this page is only an early coverage review." },
    source: "ISO 14040 / ISO 14044",
  },
  {
    id: "weights",
    title: { zh: "权重只能解释排序影响", en: "Weights explain ranking influence only" },
    basis: { zh: "CRITIC 属于基于方差与指标冲突度的客观赋权；手动/Hybrid 权重必须作为情景敏感性，而不是未经验证的权威权重。", en: "CRITIC is objective weighting from contrast and descriptor conflict; manual/hybrid weights are scenario sensitivity, not validated authority." },
    source: "Diakoulaki et al. 1995",
  },
  {
    id: "criticality",
    title: { zh: "金属供应风险需单独标记", en: "Metal supply risk should be marked separately" },
    basis: { zh: "关键矿物/关键原料清单适合提示供应链复核需求，但不能直接替代毒性、成本或 LCA 分数。", en: "Critical-mineral lists are useful for supply-chain review flags, but do not replace toxicity, cost, or LCA scores." },
    source: "USGS / European Commission critical-material lists",
  },
]

const ECOSCREEN_NEEDS = [
  { id: "separation", label: { zh: "气体分离早筛", en: "Gas-separation screening" }, fields: ["co2Uptake", "surfaceArea", "poreVolume"], gate: "adsorption" },
  { id: "wet", label: { zh: "湿气/水相适用性", en: "Humid/aqueous use" }, fields: ["waterStability", "thermalStability"], gate: "stability" },
  { id: "synthesis", label: { zh: "可持续合成线索", en: "Sustainable synthesis cues" }, fields: ["toxicityConcern", "metalCost"], gate: "lca" },
  { id: "validation", label: { zh: "验证闭环", en: "Validation closure" }, fields: ["doi", "benchmark"], gate: "weights" },
]

const CRITICAL_METAL_REVIEW_SET = new Set(["Co", "Ni", "W", "V", "Mo", "Cr", "Mn", "Ce"])

function hasValue(value) {
  if (value === null || value === undefined || value === "") return false
  if (typeof value === "number") return Number.isFinite(value)
  return !/^(pending|unknown|not reported|not_reported|na|n\/a)$/i.test(String(value).trim())
}

function percentLabel(numerator, denominator) {
  if (!denominator) return "0%"
  return `${Math.round((Number(numerator) || 0) / denominator * 100)}%`
}

function metalOf(row = {}) {
  const value = row.metalNode || row.metalCenter || row.metal || row.graphMetadata?.graphCluster || ""
  return String(value).split(/[,\s;/]+/).find(Boolean) || "pending"
}

function buildEcoScreenEvidenceModel({ candidates = [], filteredCandidates = [], reactionRows = [], benchmarkRows = [], experimentalLabelRows = [], metalCostRows = [] }) {
  const rows = Array.isArray(filteredCandidates) ? filteredCandidates : []
  const allRows = Array.isArray(candidates) ? candidates : []
  const denominator = Math.max(rows.length, 1)
  const metalCostMap = new Map((metalCostRows || []).map(row => [String(row.metal || "").trim(), row]).filter(([metal]) => metal))
  const counts = {
    structure: rows.filter(row => hasValue(row.surfaceArea) && hasValue(row.poreSizeA) && hasValue(row.poreVolume)).length,
    adsorption: rows.filter(row => hasValue(row.co2Uptake) || hasValue(row.selectivity) || hasValue(row.workingCapacity)).length,
    stability: rows.filter(row => hasValue(row.waterStability) || hasValue(row.thermalStability)).length,
    toxicity: rows.filter(row => hasValue(row.toxicityConcern)).length,
    metalCost: rows.filter(row => metalCostMap.has(metalOf(row))).length,
    doi: rows.filter(row => hasValue(row.doi) || row.doiStatus === "confirmed" || row.citationReady).length,
    benchmark: rows.filter(row => row.benchmarkEligible === "Ready" || row.benchmarkEligible === true || row.evidenceLevel === "A").length,
  }
  const criticalMetals = rows.filter(row => CRITICAL_METAL_REVIEW_SET.has(metalOf(row))).length
  const needs = ECOSCREEN_NEEDS.map(need => {
    const available = need.fields.reduce((sum, field) => sum + (counts[field] || 0), 0)
    const possible = denominator * need.fields.length
    const coverage = possible ? available / possible : 0
    return {
      ...need,
      coverage,
      status: coverage >= 0.65 ? "usable" : coverage >= 0.25 ? "partial" : "gap",
    }
  })
  return {
    totalCount: allRows.length,
    filteredCount: rows.length,
    reactionCount: reactionRows.length,
    benchmarkCount: benchmarkRows.length,
    experimentalLabelCount: experimentalLabelRows.length,
    metalCostCount: metalCostRows.length,
    criticalMetals,
    coverageRows: [
      { key: "structure", label: { zh: "结构描述符", en: "Structure descriptors" }, count: counts.structure, denominator, note: { zh: "比表面积 / 孔径 / 孔体积", en: "surface area / pore size / pore volume" } },
      { key: "adsorption", label: { zh: "吸附性能字段", en: "Adsorption fields" }, count: counts.adsorption, denominator, note: { zh: "CO₂ 吸附量 / 选择性 / 工作容量", en: "CO₂ uptake / selectivity / working capacity" } },
      { key: "stability", label: { zh: "稳定性字段", en: "Stability fields" }, count: counts.stability, denominator, note: { zh: "水稳定性 / 热稳定性", en: "water / thermal stability" } },
      { key: "toxicity", label: { zh: "毒性关注字段", en: "Toxicity concern" }, count: counts.toxicity, denominator, note: { zh: "仅作早筛风险字段", en: "early risk descriptor only" } },
      { key: "metalCost", label: { zh: "金属成本表覆盖", en: "Metal-cost coverage" }, count: counts.metalCost, denominator, note: { zh: "metal_precursor_cost_table.json", en: "metal_precursor_cost_table.json" } },
      { key: "doi", label: { zh: "引文/DOI 覆盖", en: "Citation / DOI coverage" }, count: counts.doi, denominator, note: { zh: "来源可追踪性", en: "source traceability" } },
      { key: "benchmark", label: { zh: "Benchmark 就绪", en: "Benchmark ready" }, count: counts.benchmark, denominator, note: { zh: "A 级或 Benchmark 标记", en: "Grade A or benchmark marker" } },
    ],
    needs,
  }
}

function EcoScreenEvidenceWorkbench({ evidence, activeNeed, onNeedChange, lang, t, isMobile }) {
  const selectedNeed = evidence.needs.find(need => need.id === activeNeed) || evidence.needs[0]
  const selectedBasis = ECOSCREEN_METHOD_BASIS.find(item => item.id === selectedNeed?.gate) || ECOSCREEN_METHOD_BASIS[0]
  const statusText = status => {
    if (status === "usable") return text(lang, "可用于早筛", "usable for screening")
    if (status === "partial") return text(lang, "仅部分可用", "partial only")
    return text(lang, "缺口明显", "major gap")
  }
  const statusTone = status => status === "gap" ? t.warn : status === "partial" ? t.amber : t.accentText
  return (
    <Card t={t} style={{ display: "grid", gap: 12 }} data-testid="ecoscreen-literature-workbench">
      <PanelTitle
        t={t}
        title={text(lang, "研究任务与证据覆盖", "Research task and evidence coverage")}
        subtitle={text(
          lang,
          "按文献经验把 EcoScreen 拆成吸附性能、稳定性、LCA/LCC 边界、权重方法和金属供应风险；所有覆盖率来自当前候选与已接入数据表。",
          "EcoScreen is organized around adsorption performance, stability, LCA/LCC boundary, weighting method, and metal-supply risk; every coverage value comes from the current candidates and connected data tables."
        )}
      />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        <MetricCard label={text(lang, "当前候选", "Filtered candidates")} value={`${evidence.filteredCount}/${evidence.totalCount}`} note={text(lang, "随筛选联动", "linked to filters")} t={t} />
        <MetricCard label={text(lang, "反应证据", "Reaction evidence")} value={evidence.reactionCount} note={text(lang, "已接入反应数据表", "reaction table connected")} t={t} />
        <MetricCard label={text(lang, "金属成本表", "Metal-cost table")} value={evidence.metalCostCount} note={text(lang, "仅作覆盖审查", "coverage review only")} t={t} tone="proxy" />
        <MetricCard label={text(lang, "关键金属复核", "Critical-metal review")} value={evidence.criticalMetals} note={text(lang, "提示供应链复核，不直接扣分", "flag only; no direct penalty")} t={t} tone={evidence.criticalMetals ? "warn" : "calc"} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {evidence.needs.map(need => {
          const active = need.id === selectedNeed?.id
          return (
            <button
              key={need.id}
              type="button"
              onClick={() => onNeedChange(need.id)}
              style={{
                ...toolbarBtn(t),
                background: active ? t.badgeInfoBg : t.panel,
                borderColor: active ? t.accent : t.border,
                color: active ? t.accentText : t.muted,
              }}
            >
              {localize(need.label, lang)} · {Math.round(need.coverage * 100)}%
            </button>
          )
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(280px, 0.72fr)", gap: 12, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 7 }}>
          {evidence.coverageRows.map(row => (
            <div key={row.key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
              <div style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between" }}>
                <strong style={{ color: t.textStrong, fontSize: 12 }}>{localize(row.label, lang)}</strong>
                <span style={{ color: t.muted, fontSize: 11, fontWeight: 850 }}>{row.count}/{row.denominator} · {percentLabel(row.count, row.denominator)}</span>
              </div>
              <span style={{ background: t.panel, borderRadius: 999, height: 8, overflow: "hidden" }}>
                <span style={{ background: row.count / Math.max(row.denominator, 1) < 0.25 ? t.warn : t.accentText, display: "block", height: "100%", width: percentLabel(row.count, row.denominator) }} />
              </span>
              <span style={{ color: t.faint, fontSize: 11, lineHeight: 1.4 }}>{localize(row.note, lang)}</span>
            </div>
          ))}
        </div>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, padding: 11 }}>
          <div style={{ color: statusTone(selectedNeed?.status), fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{statusText(selectedNeed?.status)}</div>
          <strong style={{ color: t.textStrong, fontSize: 14, lineHeight: 1.25 }}>{localize(selectedBasis.title, lang)}</strong>
          <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.55 }}>{localize(selectedBasis.basis, lang)}</span>
          <span style={{ color: t.faint, fontSize: 11.2, lineHeight: 1.45 }}>{text(lang, "依据", "Basis")}: {selectedBasis.source}</span>
          <span style={{ color: t.warn, fontSize: 11.4, lineHeight: 1.5 }}>
            {text(lang, "当前不会把缺失 LCA、成本或关键金属信息直接写进最终分数；只把它们作为筛选覆盖和下一步复核任务。", "Missing LCA, cost, or critical-metal information is not written directly into the final score; it is shown as coverage and next-review work.")}
          </span>
        </article>
      </div>
    </Card>
  )
}

function ChartTooltip({ active, payload, label, t, lang }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, boxShadow: t.shadowSm, color: t.textStrong, fontSize: 11, lineHeight: 1.55 }}>
      <div style={{ color: t.textStrong, fontWeight: 900, marginBottom: 4 }}>{label || payload[0]?.payload?.name}</div>
      {payload.map(item => (
        <div key={`${item.dataKey}-${item.name}`} style={{ color: item.color || t.muted }}>
          {chartName(item.name || item.dataKey, lang)}: {Number.isFinite(Number(item.value)) ? fmt(item.value, 3) : item.value}
        </div>
      ))}
    </div>
  )
}

function ScoringMethodSummary({ model, weightingMode, onWeightingModeChange, lang, t, isMobile }) {
  const summary = model.methodSummary
  const activeMode = model.activeWeightingMode
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(320px, 0.8fr)", gap: 12 }}>
      <Card t={t} style={{ display: "grid", gap: 12 }}>
        <PanelTitle
          t={t}
          title={text(lang, "评分方法摘要", "Scoring Method Summary")}
          subtitle={lang === "zh" ? "切换权重模式后，候选排序和候选详情会同步更新；诊断区仍保留 CRITIC 客观权重解释。" : "Changing the weighting mode updates ranking and candidate details; diagnostics still preserve the CRITIC objective-weight explanation."}
        />
        <SegmentedControl items={model.weightingModes} value={weightingMode} onChange={onWeightingModeChange} lang={lang} t={t} />
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65 }}>
          {lang === "zh" ? activeMode.zhDescription : activeMode.description}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          {CRITIC_INDICATORS.map(indicator => (
            <div key={indicator.key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10, display: "grid", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: t.faint, fontSize: 10.5, fontWeight: 850 }}>
                <span>{lang === "zh" ? indicator.zhLabel : indicator.label}</span>
                <span style={{ fontFamily: FONT_SANS }}>{indicator.symbol}</span>
              </div>
              <ScoreBar value={model.activeWeights[indicator.key]} t={t} />
              <div style={{ color: t.textStrong, fontFamily: FONT_SANS, fontSize: 11, textAlign: "right" }}>{fmt(model.activeWeights[indicator.key])}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr", gap: 10 }}>
        <MetricCard label={text(lang, "权重模式", "Weighting mode")} value={lang === "zh" ? summary.weightingModeZh : summary.weightingMode} note="CRITIC / Equal / Expert / Custom" t={t} />
        <MetricCard label={text(lang, "排名稳定性", "Ranking stability")} value={lang === "zh" ? summary.rankingStability.zh : summary.rankingStability.label} note={lang === "zh" ? "由权重对比和 remove-one 测试给出" : "From weighting comparison and remove-one tests"} tone={summary.rankingStability.tone} t={t} />
        <MetricCard label={text(lang, "候选数", "Candidates")} value={summary.candidateCount} note={lang === "zh" ? "含 G = 0 硬筛记录" : "includes G = 0 rows"} t={t} />
        <MetricCard label={text(lang, "指标数", "Indicators")} value={summary.indicatorCount} note="d_stab · d_barrier · d_select" t={t} />
        <MetricCard label={text(lang, "缺失比例", "Missing data")} value={fmtPct(summary.missingDataRatio)} note={lang === "zh" ? `${summary.missingData.missingCells}/${summary.missingData.totalCells} 个指标单元格` : `${summary.missingData.missingCells}/${summary.missingData.totalCells} indicator cells`} tone={summary.missingDataRatio > 0.1 ? "warn" : "calc"} t={t} />
        <MetricCard label={text(lang, "归一化", "Normalization")} value="0.01-1" note={lang === "zh" ? summary.normalizationMethodZh : summary.normalizationMethod} t={t} />
      </div>

      <Card t={t} style={{ gridColumn: isMobile ? "auto" : "1 / -1", display: "grid", gap: 7, background: t.surface }}>
        <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{text(lang, "收益/成本方向调整", "Benefit / Cost direction adjustment")}</div>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65 }}>
          {lang === "zh" ? summary.directionAdjustmentZh : summary.directionAdjustment}
        </div>
      </Card>
    </div>
  )
}

function WeightBarChart({ model, t, isMobile, lang }) {
  const data = CRITIC_INDICATORS.map(indicator => {
    const row = model.decomposition.find(item => item.key === indicator.key) || {}
    return {
      name: lang === "zh" ? indicator.zhLabel : indicator.shortLabel,
      label: indicator.label,
      weight: model.weights[indicator.key],
      activeWeight: model.activeWeights[indicator.key],
      sigma: row.sigma,
      conflict: row.conflict,
      information: row.information,
    }
  })
  return (
    <ResponsiveContainer width="100%" height={isMobile ? 230 : 255}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
        <XAxis dataKey="name" tick={{ fill: t.subtle, fontSize: 11 }} />
        <YAxis domain={[0, 1]} tick={{ fill: t.subtle, fontSize: 10 }} width={42} />
        <Tooltip content={<ChartTooltip t={t} lang={lang} />} />
        <Legend wrapperStyle={{ color: t.subtle, fontSize: 11 }} />
        <Bar dataKey="weight" name={text(lang, "CRITIC 权重", "CRITIC weight")} fill={t.accentText} radius={[4, 4, 0, 0]} />
        <Bar dataKey="activeWeight" name={text(lang, "当前模式权重", "active mode weight")} fill={t.badgeCalcText} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ConflictHeatmap({ model, lang, t }) {
  const [mode, setMode] = useState("conflict")
  const maxConflict = CRITIC_INDICATORS.flatMap(row => CRITIC_INDICATORS.map(col => model.conflictMatrix[row.key]?.[col.key] || 0)).reduce((max, value) => Math.max(max, value), 1)
  const cellBg = (value, isDiag) => {
    if (isDiag) return t.surface
    const ratio = mode === "conflict" ? clamp01(value / Math.max(1, maxConflict)) : clamp01((value + 1) / 2)
    if (ratio > 0.72) return t.badgeInfoBg
    if (ratio > 0.48) return t.badgeCalcBg
    return t.panel
  }
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <SegmentedControl
        items={[
          { id: "conflict", label: "Descriptor conflict", zhLabel: "指标冲突度", description: "Non-redundant information between descriptors.", zhDescription: "指标之间的非冗余信息。" },
          { id: "correlation", label: "Correlation", zhLabel: "相关性", description: "Pearson correlation between indicators.", zhDescription: "指标之间的 Pearson 相关性。" },
        ]}
        value={mode}
        onChange={setMode}
        lang={lang}
        t={t}
      />
      <div style={{ display: "grid", gridTemplateColumns: "86px repeat(3, minmax(0, 1fr))", gap: 6 }}>
        <span />
        {CRITIC_INDICATORS.map(item => <span key={item.key} style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textAlign: "center" }}>{item.shortLabel}</span>)}
        {CRITIC_INDICATORS.flatMap(row => [
          <span key={`${row.key}-head`} style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, alignSelf: "center" }}>{row.shortLabel}</span>,
          ...CRITIC_INDICATORS.map(col => {
            const isDiag = row.key === col.key
            const value = mode === "conflict"
              ? model.conflictMatrix[row.key]?.[col.key] ?? 0
              : model.correlationMatrix[row.key]?.[col.key] ?? 0
            return (
              <span key={`${row.key}-${col.key}`} title={`${mode}: ${fmt(value, 3)}`} style={{ background: cellBg(value, isDiag), border: `1px solid ${t.border}`, borderRadius: 7, padding: "10px 6px", color: t.textStrong, fontFamily: FONT_SANS, fontSize: 11, textAlign: "center" }}>
                {fmt(value, 2)}
              </span>
            )
          }),
        ])}
      </div>
      <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55 }}>
        {lang === "zh"
          ? "指标冲突度越高，说明两个指标提供的排序信息越不重复；这会提高 CRITIC 权重中的非冗余贡献。"
          : "Higher descriptor conflict means less redundant ranking information between two descriptors, increasing the non-redundant contribution in CRITIC weighting."}
      </div>
    </div>
  )
}

function IndicatorDiagnostics({ model, lang, t, isMobile }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: isMobile ? 720 : 760, borderCollapse: "separate", borderSpacing: "0 7px" }}>
          <thead>
            <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
              <th style={{ padding: "0 10px" }}>{text(lang, "指标", "Indicator")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "权重", "Weight")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "标准差", "Standard deviation")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "差异度", "Contrast intensity")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "冲突度", "Conflict intensity")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "解释", "Interpretation")}</th>
            </tr>
          </thead>
          <tbody>
            {model.indicatorDiagnostics.map(row => (
              <tr key={row.key} style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
                <td style={{ padding: "10px", background: t.surface, borderRadius: "7px 0 0 7px", color: t.textStrong, fontWeight: 850 }}>{lang === "zh" ? row.zhLabel : row.label}</td>
                <td style={{ padding: "10px", background: t.surface, color: t.textStrong, fontFamily: FONT_SANS }}>{fmt(row.criticWeight)}</td>
                <td style={{ padding: "10px", background: t.surface, fontFamily: FONT_SANS }}>{fmt(row.standardDeviation)}</td>
                <td style={{ padding: "10px", background: t.surface, fontFamily: FONT_SANS }}>{fmt(row.contrastIntensity)}</td>
                <td style={{ padding: "10px", background: t.surface, fontFamily: FONT_SANS }}>{fmt(row.conflictIntensity)}</td>
                <td style={{ padding: "10px", background: t.surface, borderRadius: "0 7px 7px 0" }}>{lang === "zh" ? row.zhInterpretation : row.interpretation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        {model.indicatorDiagnostics.map(row => (
          <div key={`${row.key}-note`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? row.zhLabel : row.label}</div>
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 6 }}>
              {lang === "zh" ? row.zhDescription : row.description}
            </div>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 7 }}>
              {lang === "zh" ? row.zhInterpretation : row.interpretation}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeightDiagnostics({ model, lang, t, isMobile }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(300px, 0.8fr)", gap: 12 }}>
        <Card t={t}>
          <PanelTitle
            t={t}
            title={text(lang, "CRITIC 权重概览", "CRITIC Weight Overview")}
            subtitle={lang === "zh" ? "蓝色为 CRITIC 客观权重；绿色为当前评分模式权重，用于判断 active ranking 是否偏离 CRITIC。" : "Blue shows objective CRITIC weights; gray shows the active scoring-mode weights."}
          />
          <WeightBarChart model={model} t={t} isMobile={isMobile} lang={lang} />
        </Card>
        <Card t={t}>
          <PanelTitle
            t={t}
            title={lang === "zh" ? "指标冲突热图" : "Indicator Conflict Heatmap"}
            subtitle={lang === "zh" ? "基于相关性矩阵展示指标间的信息重复和非冗余贡献。" : "Uses the descriptor correlation matrix to show redundancy and non-redundant information."}
          />
          <div style={{ marginTop: 12 }}>
            <ConflictHeatmap model={model} lang={lang} t={t} />
          </div>
        </Card>
      </div>
      <Card t={t}>
        <PanelTitle
          t={t}
          title={text(lang, "权重诊断", "Weight Diagnostics")}
          subtitle={lang === "zh" ? "标准差表示候选物之间的区分度；冲突度表示指标之间的非冗余信息贡献。" : "Standard deviation represents contrast intensity across candidates; descriptor conflict represents non-redundant information across indicators."}
        />
        <div style={{ marginTop: 12 }}>
          <IndicatorDiagnostics model={model} lang={lang} t={t} isMobile={isMobile} />
        </div>
      </Card>
    </div>
  )
}

function CandidateRanking({ candidates, selectedId, onSelect, lang, t, isMobile }) {
  const [showAll, setShowAll] = useState(false)
  const visibleCandidates = showAll ? candidates : candidates.slice(0, 10)
  if (isMobile) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {visibleCandidates.map(candidate => {
          const active = candidate.id === selectedId
          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => onSelect(candidate.id)}
              style={{
                all: "unset",
                cursor: "pointer",
                background: active ? t.badgeInfoBg : t.panel,
                border: `1px solid ${active ? t.accent : t.border}`,
                borderRadius: 8,
                padding: 11,
                display: "grid",
                gap: 9,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: active ? t.accentText : t.textStrong, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 900 }}>{candidate.rank ? `#${candidate.rank}` : "—"}</div>
                  <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900, lineHeight: 1.25, marginTop: 3 }}>{candidate.name}</div>
                  <div style={{ color: t.faint, fontSize: 10.5, marginTop: 2 }}>{candidate.metalCenter} · {lang === "zh" ? candidate.evidenceSource.zh : candidate.evidenceSource.label}</div>
                </div>
                <span style={{ color: candidate.status.tone === "warn" ? t.warn : t.accentText, fontSize: 11, fontWeight: 850, textAlign: "right" }}>{labelStatus(candidate.status, lang)}</span>
              </div>
              <ScoreBar value={candidate.overallScore} t={t} color={candidate.status.tone === "warn" ? t.warn : t.accentText} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 7 }}>
                {[
                  [text(lang, "性能", "Performance"), candidate.performanceScore],
                  [text(lang, "可持续性", "Sustainability"), candidate.sustainabilityScore],
                  [text(lang, "证据", "Evidence"), candidate.evidenceScore],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: "7px 8px" }}>
                    <div style={{ color: t.faint, fontSize: 9.5, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
                    <div style={{ color: t.textStrong, fontFamily: FONT_SANS, fontSize: 11, fontWeight: 850, marginTop: 4 }}>{fmt(value, 2)}</div>
                  </div>
                ))}
              </div>
            </button>
          )
        })}
        {candidates.length > visibleCandidates.length ? (
          <button type="button" onClick={() => setShowAll(true)} style={{ ...toolbarBtn(t), justifyContent: "center" }}>
            {text(lang, `显示其余 ${candidates.length - visibleCandidates.length} 个候选`, `Show remaining ${candidates.length - visibleCandidates.length} candidates`)}
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 940, display: "grid", gap: 7 }}>
        <div style={{ display: "grid", gridTemplateColumns: "46px minmax(150px,1.2fr) 92px 92px 104px 86px 130px 110px 120px", gap: 10, color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", padding: "0 10px" }}>
          <span>{text(lang, "名次", "Rank")}</span><span>{text(lang, "候选材料", "Candidate")}</span><span>{text(lang, "综合分", "Overall")}</span><span>{text(lang, "性能", "Performance")}</span><span>{text(lang, "可持续性", "Sustainability")}</span><span>{text(lang, "证据", "Evidence")}</span><span>{text(lang, "完整度", "Completeness")}</span><span>{text(lang, "置信度", "Confidence")}</span><span>{text(lang, "状态", "Status")}</span>
        </div>
        {visibleCandidates.map(candidate => {
          const active = candidate.id === selectedId
          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => onSelect(candidate.id)}
              style={{
                all: "unset",
                cursor: "pointer",
                display: "grid",
                gridTemplateColumns: "46px minmax(150px,1.2fr) 92px 92px 104px 86px 130px 110px 120px",
                gap: 10,
                alignItems: "center",
                background: active ? t.badgeInfoBg : t.panel,
                border: `1px solid ${active ? t.accent : t.border}`,
                borderRadius: 8,
                padding: "10px",
              }}
            >
              <span style={{ color: active ? t.accentText : t.textStrong, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 900 }}>{candidate.rank ? `#${candidate.rank}` : "—"}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", color: t.textStrong, fontSize: 13, fontWeight: 900, overflowWrap: "anywhere" }}>{candidate.name}</span>
                <span style={{ display: "block", color: t.faint, fontSize: 10.5, marginTop: 2 }}>{candidate.metalCenter} · {lang === "zh" ? candidate.evidenceSource.zh : candidate.evidenceSource.label}</span>
              </span>
              {[candidate.overallScore, candidate.performanceScore, candidate.sustainabilityScore, candidate.evidenceScore].map((value, index) => (
                <span key={index} style={{ display: "grid", gap: 5 }}>
                  <span style={{ color: t.textStrong, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 850 }}>{fmt(value, 3)}</span>
                  <ScoreBar value={value} t={t} color={index === 0 ? t.accentText : t.badgeCalcText} />
                </span>
              ))}
              <span style={{ color: t.muted, fontSize: 11, fontWeight: 800 }}>{lang === "zh" ? candidate.descriptorCompleteness.zhLabel : candidate.descriptorCompleteness.label}</span>
              <span style={{ color: candidate.rankingConfidence.tone === "warn" ? t.warn : candidate.rankingConfidence.tone === "proxy" ? t.amber : t.accentText, fontSize: 11, fontWeight: 850 }}>
                {lang === "zh" ? candidate.rankingConfidence.zh : candidate.rankingConfidence.label}
              </span>
              <span style={{ color: candidate.status.tone === "warn" ? t.warn : t.accentText, fontSize: 11, fontWeight: 850 }}>{labelStatus(candidate.status, lang)}</span>
            </button>
          )
        })}
        {candidates.length > visibleCandidates.length ? (
          <button type="button" onClick={() => setShowAll(true)} style={{ ...toolbarBtn(t), justifyContent: "center", marginTop: 4 }}>
            {text(lang, `显示其余 ${candidates.length - visibleCandidates.length} 个候选`, `Show remaining ${candidates.length - visibleCandidates.length} candidates`)}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function CandidateDetail({ candidate, lang, t, isMobile }) {
  const { profile } = useMofReactionProfile(candidate)
  if (!candidate) return null
  const gaps = getDataGapRecommendations(candidate)
  const scoreRows = [
    ["Overall Score", "综合分", candidate.overallScore],
    ["Performance Score", "性能分", candidate.performanceScore],
    ["Sustainability Score", "可持续性分", candidate.sustainabilityScore],
    ["Evidence Score", "证据分", candidate.evidenceScore],
  ]
  return (
    <Card t={t} style={{ display: "grid", gap: 13, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>
            {lang === "zh" ? "联动候选详情" : "Linked candidate detail"}
          </div>
          <h3 style={{ margin: "5px 0 0", color: t.textStrong, fontSize: 18, lineHeight: 1.15 }}>{candidate.name}</h3>
          <div style={{ color: t.faint, fontSize: 11.5, marginTop: 5 }}>{candidate.metalCenter} · {candidate.frameworkType} · {lang === "zh" ? candidate.evidenceSource.zh : candidate.evidenceSource.label}</div>
        </div>
        <BasisBadge tone={candidate.rankingConfidence.tone}>{lang === "zh" ? candidate.rankingConfidence.zh : candidate.rankingConfidence.label}</BasisBadge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        {scoreRows.map(([en, zh, value]) => (
          <div key={en} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10, display: "grid", gap: 6 }}>
            <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", fontWeight: 850 }}>{lang === "zh" ? zh : en}</div>
            <div style={{ color: t.textStrong, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 900 }}>{fmt(value)}</div>
            <ScoreBar value={value} t={t} />
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
        {[
          [text(lang, "描述符完整度", "Descriptor completeness"), lang === "zh" ? candidate.descriptorCompleteness.zhLabel : candidate.descriptorCompleteness.label],
          [text(lang, "证据等级", "Evidence level"), candidate.evidenceLevel],
          [text(lang, "证据修正前综合评分", "Raw candidate score"), fmt(candidate.D_raw)],
          [text(lang, "证据修正后期望评分", "Evidence-corrected expected score"), fmt(candidate.D_expected)],
        ].map(([label, value]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10 }}>
            <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", fontWeight: 850 }}>{label}</div>
            <div style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.45, marginTop: 5, fontWeight: 820, overflowWrap: "anywhere" }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 7, padding: 11 }}>
        <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>
          {text(lang, "专家先验评分，仍待实验校准", "Expert-prior score, pending experimental calibration")}
        </div>
        <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55 }}>
          {text(
            lang,
            "这里解释候选优先级和路径假设，不输出预测产率或已验证 AI 分数。",
            "This explains candidate priority and pathway hypothesis; it does not output predicted yield or a validated AI score."
          )}
        </div>
      </div>

      <ReactionFingerprintPanel profile={profile} t={t} compact />
      <MofRationaleCard profile={profile} t={t} defaultOpen />

      <details open style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
        <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 12, fontWeight: 900 }}>
          {text(lang, "排序解释与决策追踪", "Ranking Explanation / Decision Trace")}
        </summary>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, marginTop: 9 }}>
          {lang === "zh" ? candidate.whyHigh.zh : candidate.whyHigh.en}
        </div>
        <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 8 }}>
          {lang === "zh"
            ? "解释对象是 ranking influence，不是化学因果机制；真实结论仍需实验、DFT 或文献证据闭环。"
            : "This explains ranking influence, not chemical causality; real conclusions still require experimental, DFT, or literature evidence closure."}
        </div>
      </details>

      <div style={{ display: "grid", gap: 7 }}>
        <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 880 }}>{lang === "zh" ? "下一步证据" : "Next evidence"}</div>
        {gaps.slice(0, 3).map(gap => (
          <div key={`${gap.limitation}-${gap.nextEvidence}`} style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, borderLeft: `3px solid ${gap.priority === "High" ? t.warn : t.accentText}`, paddingLeft: 9 }}>
            {gap.nextEvidence}
          </div>
        ))}
      </div>

      <GraphDescriptorPanel graphMetadata={candidate.candidate?.graphMetadata || candidate.graphMetadata} t={t} lang={lang} isMobile={isMobile} />
      <OrganicAcidRelevancePanel
        relevance={candidate.candidate?.organicAcidRelevance || candidate.organicAcidRelevance}
        candidate={candidate.candidate || candidate}
        t={t}
        lang={lang}
        isMobile={isMobile}
      />
    </Card>
  )
}

function sourceColor(source, t) {
  if (source?.label === "Experimental") return t.success
  if (source?.label === "Literature") return t.accentText
  if (source?.label === "Simulated") return t.amber
  return t.veryFaint
}

function QuadrantPoint(props) {
  const { cx, cy, payload, selectedId, onSelect, t } = props
  const active = payload.id === selectedId
  const radius = 5 + clamp01(payload.evidenceScore) * 7
  const fill = active ? t.accentText : sourceColor(payload.evidenceSource, t)
  const stroke = active ? t.textStrong : t.panel
  const common = { fill, stroke, strokeWidth: active ? 2.2 : 1.2, cursor: "pointer", onClick: () => onSelect(payload.id) }
  if (payload.evidenceSource?.label === "Literature") {
    return <rect x={cx - radius * 0.75} y={cy - radius * 0.75} width={radius * 1.5} height={radius * 1.5} transform={`rotate(45 ${cx} ${cy})`} rx={2} {...common} />
  }
  if (payload.evidenceSource?.label === "Simulated") {
    return <rect x={cx - radius} y={cy - radius} width={radius * 2} height={radius * 2} rx={3} {...common} />
  }
  if (payload.evidenceSource?.label === "Demo") {
    const points = `${cx},${cy - radius} ${cx + radius},${cy + radius} ${cx - radius},${cy + radius}`
    return <polygon points={points} {...common} />
  }
  return <circle cx={cx} cy={cy} r={radius} {...common} />
}

function QuadrantTooltip({ active, payload, t, lang }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, boxShadow: t.shadowSm, color: t.textStrong, fontSize: 11, lineHeight: 1.55 }}>
      <div style={{ fontWeight: 900, marginBottom: 4 }}>{row.name}</div>
      <div>{text(lang, "性能", "Performance")}: {fmt(row.performanceScore)}</div>
      <div>{text(lang, "可持续性", "Sustainability")}: {fmt(row.sustainabilityScore)}</div>
      <div>{text(lang, "证据", "Evidence")}: {fmt(row.evidenceScore)}</div>
      <div>{lang === "zh" ? row.evidenceSource.zh : row.evidenceSource.label}</div>
    </div>
  )
}

function PerformanceSustainabilityQuadrant({ candidates, selectedId, onSelect, lang, t, isMobile }) {
  const data = candidates.map(candidate => ({
    ...candidate,
    x: Number(candidate.sustainabilityScore.toFixed(3)),
    y: Number(candidate.performanceScore.toFixed(3)),
    z: Math.max(60, 320 * clamp01(candidate.evidenceScore)),
  }))
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <ResponsiveContainer width="100%" height={isMobile ? 310 : 380}>
        <ScatterChart margin={{ top: 18, right: 22, bottom: 28, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
          <XAxis type="number" dataKey="x" name={text(lang, "可持续性分", "Sustainability Score")} domain={[0, 1]} tick={{ fill: t.subtle, fontSize: 10 }} label={{ value: text(lang, "可持续性分", "Sustainability Score"), position: "insideBottom", offset: -16, fill: t.subtle, fontSize: 11 }} />
          <YAxis type="number" dataKey="y" name={text(lang, "性能分", "Performance Score")} domain={[0, 1]} tick={{ fill: t.subtle, fontSize: 10 }} width={42} label={{ value: text(lang, "性能分", "Performance Score"), angle: -90, position: "insideLeft", fill: t.subtle, fontSize: 11 }} />
          <ZAxis type="number" dataKey="z" range={[70, 520]} />
          <ReferenceLine x={0.65} stroke={t.borderStrong} strokeDasharray="4 4" />
          <ReferenceLine y={0.65} stroke={t.borderStrong} strokeDasharray="4 4" />
          <Tooltip content={<QuadrantTooltip t={t} lang={lang} />} />
          <Scatter data={data} shape={props => <QuadrantPoint {...props} selectedId={selectedId} onSelect={onSelect} t={t} />}>
            {data.map(candidate => <Cell key={candidate.id} fill={sourceColor(candidate.evidenceSource, t)} />)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        {[
          [text(lang, "高性能 / 高可持续性", "High performance / high sustainability"), lang === "zh" ? "优先复核证据闭环" : "priority for evidence closure"],
          [text(lang, "高性能 / 低可持续性", "High performance / low sustainability"), lang === "zh" ? "需审查稳定性或风险代价" : "review stability or risk burden"],
          [text(lang, "低性能 / 高可持续性", "Low performance / high sustainability"), lang === "zh" ? "可能适合低风险探索" : "possible low-risk exploration"],
          [text(lang, "低性能 / 低可持续性", "Low performance / low sustainability"), lang === "zh" ? "暂不优先" : "lower priority"],
        ].map(([title, body]) => (
          <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 10 }}>
            <div style={{ color: t.textStrong, fontSize: 11.5, fontWeight: 900 }}>{title}</div>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45, marginTop: 4 }}>{body}</div>
          </div>
        ))}
      </div>
      <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55 }}>
        {lang === "zh"
          ? "点大小表示证据分数；点形状和颜色表示实验、文献、模拟或演示来源状态。点击候选点会联动候选详情。"
          : "Point size reflects Evidence Score; marker shape/color marks Experimental / Literature / Simulated / Demo source state. Click a point to update the candidate detail."}
      </div>
    </div>
  )
}

function RankComparisonChart({ model, selectedId, onSelect, lang, t, isMobile }) {
  const schemes = model.robustness.schemeRanks
  const visibleCandidates = model.candidates.filter(candidate => Number(candidate.G) !== 0).slice(0, 5)
  const lineData = schemes.map(scheme => {
    const point = { scheme: lang === "zh" ? scheme.zhLabel : scheme.label }
    visibleCandidates.forEach(candidate => {
      point[candidate.name] = Number.isFinite(scheme.ranks[candidate.id]) ? scheme.ranks[candidate.id] : null
    })
    return point
  })
  const maxRank = Math.max(3, model.candidates.filter(candidate => Number(candidate.G) !== 0).length)
  return (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : 285}>
      <LineChart data={lineData} margin={{ top: 10, right: 14, left: 0, bottom: isMobile ? 36 : 42 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
        <XAxis dataKey="scheme" tick={{ fill: t.subtle, fontSize: isMobile ? 9 : 10 }} interval={0} angle={isMobile ? -28 : -18} textAnchor="end" height={isMobile ? 54 : 58} />
        <YAxis reversed domain={[1, maxRank]} tick={{ fill: t.subtle, fontSize: 10 }} width={42} />
        <Tooltip content={<ChartTooltip t={t} lang={lang} />} />
        {visibleCandidates.map((candidate, index) => (
          <Line
            key={candidate.id}
            type="monotone"
            dataKey={candidate.name}
            stroke={candidate.id === selectedId ? t.accentText : index % 2 ? t.badgeCalcText : t.subtle}
            strokeWidth={candidate.id === selectedId ? 3 : 1.7}
            dot={{ r: candidate.id === selectedId ? 4 : 3, cursor: "pointer" }}
            connectNulls
            onClick={() => onSelect(candidate.id)}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

function RemoveOneSensitivity({ model, selectedRemovalId, onSelectRemoval, lang, t, isMobile }) {
  const rows = model.robustness.removeOneRows
  const active = rows.find(row => row.removedId === selectedRemovalId) || rows[0]
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.15fr) minmax(260px, 0.85fr)", gap: 12 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 620, borderCollapse: "separate", borderSpacing: "0 7px" }}>
          <thead>
            <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
              <th style={{ padding: "0 10px" }}>{text(lang, "移除候选", "Removed candidate")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "Top-3 保留", "Top-3 retained")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "最大位移", "Max shift")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "平均位移", "Mean shift")}</th>
              <th style={{ padding: "0 10px" }}>{text(lang, "稳定性", "Stability")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const activeRow = row.removedId === active.removedId
              return (
                <tr key={row.removedId} onClick={() => onSelectRemoval(row.removedId)} style={{ cursor: "pointer", color: t.muted, fontSize: 12 }}>
                  <td style={{ padding: "10px", background: activeRow ? t.badgeInfoBg : t.surface, borderRadius: "7px 0 0 7px", color: t.textStrong, fontWeight: 850 }}>{row.removedName}</td>
                  <td style={{ padding: "10px", background: activeRow ? t.badgeInfoBg : t.surface, fontFamily: FONT_SANS }}>{fmtPct(row.retainedTop3)}</td>
                  <td style={{ padding: "10px", background: activeRow ? t.badgeInfoBg : t.surface, fontFamily: FONT_SANS }}>{fmt(row.maxShift, 0)}</td>
                  <td style={{ padding: "10px", background: activeRow ? t.badgeInfoBg : t.surface, fontFamily: FONT_SANS }}>{fmt(row.meanShift, 2)}</td>
                  <td style={{ padding: "10px", background: activeRow ? t.badgeInfoBg : t.surface, borderRadius: "0 7px 7px 0", color: row.stability === "Sensitive" ? t.warn : row.stability === "Moderate" ? t.amber : t.accentText, fontWeight: 850 }}>
                    {lang === "zh" ? row.zhStability : row.stability}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Card t={t} style={{ background: t.surface, display: "grid", gap: 9 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{lang === "zh" ? "移除情景" : "Remove-one scenario"}</div>
        <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 920 }}>{active?.removedName}</div>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>
          {lang === "zh" ? "重新计算 CRITIC 权重后，当前 Top-3：" : "After recalculating CRITIC weights, current Top-3:"}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {(active?.top3 || []).map((id, index) => {
            const candidate = model.candidates.find(item => item.id === id)
            return (
              <div key={id} style={{ display: "flex", justifyContent: "space-between", gap: 8, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, padding: "7px 9px", color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
                <span>#{index + 1}</span>
                <span>{candidate?.name || id}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function RankingRobustness({ model, selectedId, onSelect, lang, t, isMobile }) {
  const [selectedRemovalId, setSelectedRemovalId] = useState(model.robustness.removeOneRows[0]?.removedId)
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <MetricCard label={text(lang, "Top-3 一致性", "Top-3 consistency")} value={fmtPct(model.robustness.top3Consistency)} note={lang === "zh" ? "CRITIC vs Equal vs Expert 的 Top-3 重合度" : "Top-3 overlap across CRITIC, Equal, and Expert"} t={t} tone={model.robustness.top3Consistency >= 0.84 ? "calc" : "proxy"} />
        <MetricCard label={text(lang, "Remove-one 最大位移", "Remove-one max shift")} value={fmt(model.robustness.maxRemoveOneShift, 0)} note={lang === "zh" ? "移除任一候选后最大名次变化" : "Largest rank shift after removing one candidate"} t={t} tone={model.robustness.maxRemoveOneShift >= 3 ? "warn" : "calc"} />
        <MetricCard label={text(lang, "稳定性徽标", "Stability badge")} value={lang === "zh" ? model.robustness.stability.zh : model.robustness.stability.label} note={lang === "zh" ? "稳定 / 中等 / 敏感" : "Stable / Moderate / Sensitive"} t={t} tone={model.robustness.stability.tone} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(300px, 0.72fr)", gap: 12 }}>
        <Card t={t}>
          <PanelTitle
            t={t}
            title={lang === "zh" ? "CRITIC vs Equal vs Expert 排名对比" : "CRITIC vs Equal vs Expert Ranking"}
            subtitle={lang === "zh" ? "线越平，说明候选对权重模式越不敏感。" : "Flatter lines indicate lower sensitivity to weighting mode."}
          />
          <RankComparisonChart model={model} selectedId={selectedId} onSelect={onSelect} lang={lang} t={t} isMobile={isMobile} />
        </Card>
        <Card t={t}>
          <PanelTitle t={t} title={text(lang, "Top-3 一致性", "Top-3 consistency")} />
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {model.robustness.top3Rows.map(row => (
              <div key={row.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 9 }}>
                <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? row.zhLabel : row.label}</div>
                <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 4 }}>
                  {row.top3.map((id, index) => {
                    const candidate = model.candidates.find(item => item.id === id)
                    return `${index + 1}. ${candidate?.name || id}`
                  }).join("  /  ")}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card t={t}>
        <PanelTitle
          t={t}
          title={text(lang, "Remove-one-candidate 敏感性测试", "Remove-one-candidate sensitivity test")}
          subtitle={lang === "zh" ? "逐个移除候选并重新计算 CRITIC 权重，观察排序是否由单个样本主导。" : "Remove each candidate, recompute CRITIC weights, and check whether rank order is dominated by one sample."}
        />
        <div style={{ marginTop: 12 }}>
          <RemoveOneSensitivity model={model} selectedRemovalId={selectedRemovalId} onSelectRemoval={setSelectedRemovalId} lang={lang} t={t} isMobile={isMobile} />
        </div>
      </Card>
    </div>
  )
}

function EvidenceNotes({ lang, t, isMobile }) {
  const notes = lang === "zh"
    ? [
      ["证据边界", "本页 ranking 表示候选优先级，不代表真实催化性能结论。"],
      ["权重限制", "CRITIC 权重来自当前候选集的差异度与冲突度，解释 ranking influence，不解释 causal mechanism。"],
      ["缺失数据", "缺失描述符采用中性不确定性得分处理；缺失不等于材料失败。"],
      ["小样本敏感性", "候选数较少时，新增或删除样本可能改变标准差、相关性和客观权重。"],
      ["证据异质性", "文献、DFT、实验和 inferred evidence 的可比性不同，必须在后续验证中分层处理。"],
    ]
    : [
      ["Evidence boundary", "Ranking means candidate priority, not validated catalytic performance."],
      ["Weight limitation", "CRITIC weights come from contrast and conflict in this candidate set; they explain ranking influence, not causal mechanism."],
      ["Missing data", "Missing descriptors are handled with a neutral uncertainty score; missing data is not treated as material failure."],
      ["Small sample sensitivity", "With small samples, adding or removing candidates may change standard deviation, correlation, and objective weights."],
      ["Evidence heterogeneity", "Literature, DFT, experiment, and inferred evidence are not equally comparable and need layered validation."],
    ]
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 8 }}>
      {notes.map(([title, body]) => (
        <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{title}</div>
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 6 }}>{body}</div>
        </div>
      ))}
    </div>
  )
}

const REACTION_FILTERS = [
  { key: "hasYield", label: "Has Yield", labelZh: "有收率字段" },
  { key: "hasSelectivity", label: "Has Selectivity", labelZh: "有选择性字段" },
  { key: "hasConversion", label: "Has Conversion", labelZh: "有转化率字段" },
  { key: "hasDoi", label: "Has DOI", labelZh: "有 DOI" },
  { key: "goldOnly", label: "Gold Only", labelZh: "仅 Gold 数据" },
  { key: "benchmarkEligibleOnly", label: "Benchmark Eligible Only", labelZh: "仅 Benchmark 就绪" },
  { key: "experimentalLabelsOnly", label: "Experimental Labels Only", labelZh: "仅实验标签" },
  { key: "externalTestOnly", label: "External Test Only", labelZh: "仅外部测试" },
  { key: "groundTruthVerifiedOnly", label: "Ground Truth Verified Only", labelZh: "仅已核验真值" },
]

function ReactionFilterPanel({ filters, onChange, count, total, lang, t, isMobile }) {
  return (
    <Card t={t} style={{ display: "grid", gap: 10 }} data-testid="ecoscreen-reaction-filter">
      <PanelTitle
        t={t}
        title={text(lang, "反应数据筛选", "Reaction Filter")}
        subtitle={text(lang, "按 V3.1 反应数据、Gold v2 与 Benchmark v2 筛选 EcoScreen 候选；筛选只影响当前工作台视图。", "Filter EcoScreen candidates by V3.1 reaction data, Gold v2, and Benchmark v2. The filter only affects the current workbench view.")}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {REACTION_FILTERS.map(item => (
          <label key={item.key} style={{ alignItems: "center", background: filters[item.key] ? t.badgeInfoBg : t.surface, border: `1px solid ${filters[item.key] ? t.accent : t.border}`, borderRadius: 7, color: filters[item.key] ? t.accentText : t.muted, cursor: "pointer", display: "inline-flex", fontSize: 11.5, fontWeight: 850, gap: 7, minHeight: 32, padding: "6px 9px" }}>
            <input
              type="checkbox"
              data-testid={`reaction-filter-${item.key}`}
              checked={Boolean(filters[item.key])}
              onChange={event => onChange(item.key, event.target.checked)}
              style={{ accentColor: t.accentText }}
            />
            {text(lang, item.labelZh, item.label)}
          </label>
        ))}
      </div>
      <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
        {text(lang, `当前筛选候选 ${count} / ${total}`, `Candidates in view ${count} / ${total}`)}
      </div>
    </Card>
  )
}

function matchCandidate(candidate = {}, record = {}) {
  const tokens = [candidate.id, candidate.candidateId, candidate.name, candidate.displayName, candidate.rawName]
    .filter(Boolean)
    .map(value => String(value).toLowerCase())
  const haystack = [record.sourceRecordId, record.mofName, record.candidateId, record.catalystId, record.mof?.mofId, record.mof?.displayName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return tokens.some(token => token && haystack.includes(token))
}

function matchAny(candidate = {}, records = []) {
  return records.some(record => matchCandidate(candidate, record))
}

function applyReactionFilters(candidates = [], reactionRecords = [], benchmarkRecords = [], filters = {}, labelSets = {}) {
  const active = Object.values(filters).some(Boolean)
  if (!active) return candidates
  const experimental = labelSets.experimental || []
  const externalTest = labelSets.externalTest || []
  const verified = labelSets.verified || []
  return candidates.filter(candidate => {
    const reactions = reactionRecords.filter(record => matchCandidate(candidate, record))
    const benchmarks = benchmarkRecords.filter(record => matchCandidate(candidate, record))
    if (filters.benchmarkEligibleOnly && !benchmarks.some(row => row.benchmarkEligible === "Ready")) return false
    if (filters.hasYield && !reactions.some(row => row.yield != null)) return false
    if (filters.hasSelectivity && !reactions.some(row => row.selectivity != null)) return false
    if (filters.hasConversion && !reactions.some(row => row.conversion != null)) return false
    if (filters.hasDoi && !reactions.some(row => row.doi && !/pending|missing|unknown/i.test(String(row.doi)))) return false
    if (filters.goldOnly && !reactions.some(row => row.validationStatus === "Gold")) return false
    // V3.4 experimental-label / external-test / verified-ground-truth filters.
    if (filters.experimentalLabelsOnly && !matchAny(candidate, experimental)) return false
    if (filters.externalTestOnly && !matchAny(candidate, externalTest)) return false
    if (filters.groundTruthVerifiedOnly && !matchAny(candidate, verified)) return false
    return true
  })
}

// V3.5 EcoScreen explainability — surfaces "why recommended" using the model
// feature contribution (from the credibility report) + evidence confidence (from
// the reaction evidence graph). Read-only; no benchmark value is changed.
function EcoScreenExplainabilityPanel({ credibility, reactionGraph, selectedCandidate, lang, t, isMobile }) {
  const [showImportance, setShowImportance] = useState(false)
  const [showEvidence, setShowEvidence] = useState(false)
  const best = credibility?.bestModel
  const rows = (credibility?.featureImportance?.find(f => f.model === best)?.rows || []).slice(0, 5)
  const evidenceLevel = reactionGraph?.edges?.length ? (reactionGraph.summary?.highConfidenceEdges > 0 ? "High" : "Medium") : null
  if (!credibility && !reactionGraph) return null
  const txt = (zh, en) => (lang === "zh" ? zh : en)
  return (
    <Card t={t} style={{ display: "grid", gap: 10 }} data-testid="ecoscreen-explainability">
      <div style={{ display: "grid", gap: 3 }}>
        <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{txt("可解释性与证据", "Explainability & Evidence")}</strong>
        <span style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.5 }}>{txt("基于 V3.4 模型的特征贡献与 CO₂→甲酸路径证据置信度，解释“为什么推荐”。", "Explains “why recommended” from the V3.4 model feature contribution and CO₂→formic-acid evidence confidence.")}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <button type="button" data-testid="ecoscreen-show-feature-importance" aria-pressed={showImportance} onClick={() => setShowImportance(v => !v)}
          style={{ background: showImportance ? t.badgeInfoBg : t.surface, border: `1px solid ${showImportance ? t.accent : t.border}`, borderRadius: 7, color: showImportance ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.4, fontWeight: 850, minHeight: 30, padding: "5px 10px" }}>
          {txt("显示特征重要性", "Show Feature Importance")}
        </button>
        <button type="button" data-testid="ecoscreen-show-evidence-confidence" aria-pressed={showEvidence} onClick={() => setShowEvidence(v => !v)}
          style={{ background: showEvidence ? t.badgeInfoBg : t.surface, border: `1px solid ${showEvidence ? t.accent : t.border}`, borderRadius: 7, color: showEvidence ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.4, fontWeight: 850, minHeight: 30, padding: "5px 10px" }}>
          {txt("显示证据置信度", "Show Evidence Confidence")}
        </button>
      </div>
      {showImportance && rows.length ? (
        <div data-testid="ecoscreen-feature-importance" style={{ display: "grid", gap: 5 }}>
          {rows.map(r => (
            <div key={r.feature} style={{ alignItems: "center", display: "grid", gap: 8, gridTemplateColumns: isMobile ? "130px 1fr 44px" : "190px 1fr 52px" }}>
              <span style={{ color: t.text, fontSize: 11.2 }}>#{r.rank} {r.label}</span>
              <span style={{ background: t.surface, borderRadius: 4, display: "block", height: 12 }}><span style={{ background: t.accent, borderRadius: 4, display: "block", height: "100%", width: `${Math.round(r.contribution * 100)}%` }} /></span>
              <span style={{ color: t.muted, fontSize: 10.6, textAlign: "right" }}>{Math.round(r.contribution * 100)}%</span>
            </div>
          ))}
        </div>
      ) : null}
      {showEvidence && reactionGraph ? (
        <div data-testid="ecoscreen-evidence-confidence" style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.5 }}>
          {txt(
            `CO₂→甲酸路径证据：实验 ${reactionGraph.summary.experimentalEvidence} · 文献 ${reactionGraph.summary.literatureEvidence} · 派生 ${reactionGraph.summary.derivedEvidence}；高置信度边 ${reactionGraph.summary.highConfidenceEdges} 条。`,
            `CO₂→formic-acid evidence: experimental ${reactionGraph.summary.experimentalEvidence} · literature ${reactionGraph.summary.literatureEvidence} · derived ${reactionGraph.summary.derivedEvidence}; ${reactionGraph.summary.highConfidenceEdges} high-confidence edges.`,
          )}
        </div>
      ) : null}
      <div data-testid="ecoscreen-why-recommended" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 11.4, lineHeight: 1.55, padding: 10 }}>
        <strong style={{ color: t.textStrong }}>{txt("为什么推荐", "Why Recommended")}{selectedCandidate?.name ? ` · ${selectedCandidate.name}` : ""}：</strong>{" "}
        {rows.length
          ? txt(
              `主要由 ${rows.slice(0, 2).map(r => r.label).join(" 与 ")} 驱动（${best} 特征贡献）；路径证据置信度 ${evidenceLevel || "—"}。指标来自 V3.4 Benchmark，未伪造。`,
              `Driven mainly by ${rows.slice(0, 2).map(r => r.label).join(" and ")} (${best} feature contribution); pathway evidence confidence ${evidenceLevel || "—"}. Metrics come from the V3.4 benchmark, not fabricated.`,
            )
          : txt("可解释性数据加载中。", "Explainability data loading.")}
      </div>
    </Card>
  )
}

export function EcoScreenTab({ onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [scoringMode, setScoringMode] = useState("general")
  const [weightingMode, setWeightingMode] = useState("critic")
  const [performancePriorityMode, setPerformancePriorityMode] = useState("balanced")
  const [selectedId, setSelectedId] = useState("MOF-B")
  const [reactionFilters, setReactionFilters] = useState({})
  const [activeEcoNeed, setActiveEcoNeed] = useState("separation")
  const [credibilityReport, setCredibilityReport] = useState(null)
  const [reactionGraphData, setReactionGraphData] = useState(null)
  const [reactionRows, setReactionRows] = useState([])
  const [benchmarkRows, setBenchmarkRows] = useState([])
  const [experimentalLabelRows, setExperimentalLabelRows] = useState([])
  const [externalTestRows, setExternalTestRows] = useState([])
  const [metalCostRows, setMetalCostRows] = useState([])
  const {
    candidates: generalRows,
    status: generalStatus,
    mode: globalCandidateMode,
  } = useMofCandidates(DEFAULT_CANDIDATE_DATA_MODE)
  useEffect(() => {
    let active = true
    Promise.all([
      fetchDataJson("data_ingestion/organic_acid_reaction_dataset_v1.json", null),
      fetchDataJson("benchmark_dataset_v2.json", null),
      fetchDataJson("experimental_labels/experimental_labels_v1.json", null),
      fetchDataJson("external_test_dataset_v1.json", null),
      fetchDataJson("model_credibility_report_v1.json", null),
      fetchDataJson("reaction_evidence_graph_v1.json", null),
      fetchDataJson("metal_precursor_cost_table.json", null),
    ]).then(([reaction, benchmark, experimentalLabels, externalTest, credibility, reactionGraph, metalCost]) => {
      if (!active) return
      setReactionRows(Array.isArray(reaction?.records) ? reaction.records : [])
      setBenchmarkRows(Array.isArray(benchmark?.records) ? benchmark.records : [])
      setExperimentalLabelRows(Array.isArray(experimentalLabels?.labels) ? experimentalLabels.labels : [])
      setExternalTestRows(Array.isArray(externalTest?.records) ? externalTest.records : [])
      setCredibilityReport(credibility && typeof credibility === "object" ? credibility : null)
      setReactionGraphData(reactionGraph && typeof reactionGraph === "object" ? reactionGraph : null)
      setMetalCostRows(Array.isArray(metalCost?.records) ? metalCost.records : [])
    }).catch(() => {
      if (active) {
        setReactionRows([])
        setBenchmarkRows([])
        setExperimentalLabelRows([])
        setExternalTestRows([])
        setCredibilityReport(null)
        setReactionGraphData(null)
        setMetalCostRows([])
      }
    })
    return () => { active = false }
  }, [])
  const filteredGeneralRows = useMemo(
    () => applyReactionFilters(generalRows, reactionRows, benchmarkRows, reactionFilters, { experimental: experimentalLabelRows, externalTest: externalTestRows, verified: experimentalLabelRows }),
    [generalRows, reactionRows, benchmarkRows, reactionFilters, experimentalLabelRows, externalTestRows],
  )
  const model = useMemo(
    () => buildCriticScoringModel(filteredGeneralRows, weightingMode),
    [filteredGeneralRows, weightingMode],
  )
  const generalScoringModel = useMemo(() => createScoringModel({
    candidates: filteredGeneralRows,
    preset: "generalMofScreening",
    descriptorPreset: "coreMof8",
    algorithm: "hybrid",
    hybridAlpha: 0.65,
    missingValueStrategy: "penalize",
    evidenceMode: "descriptor-evidence",
    performancePriorityMode,
  }), [filteredGeneralRows, performancePriorityMode])
  const generalTraceModel = useMemo(() => buildTraceModelFromScoringModel(generalScoringModel), [generalScoringModel])
  const ecoScreenEvidence = useMemo(() => buildEcoScreenEvidenceModel({
    candidates: generalRows,
    filteredCandidates: filteredGeneralRows,
    reactionRows,
    benchmarkRows,
    experimentalLabelRows,
    metalCostRows,
  }), [generalRows, filteredGeneralRows, reactionRows, benchmarkRows, experimentalLabelRows, metalCostRows])
  const activePriority = PERFORMANCE_PRIORITY_MODES.find(item => item.id === performancePriorityMode) || PERFORMANCE_PRIORITY_MODES[0]
  const selectedCandidate = useMemo(() => (
    model.candidates.find(candidate => candidate.id === selectedId) || model.candidates[0]
  ), [model, selectedId])
  const scored = model.candidates.filter(candidate => Number(candidate.G) !== 0)
  const excluded = model.candidates.filter(candidate => Number(candidate.G) === 0)
  const topCandidate = scored[0]

  const openMethodology = () => {
    if (onNavigate) onNavigate("methodology")
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        document.getElementById("critic-methodology-decision-support")?.scrollIntoView({ block: "start", behavior: "smooth" })
      }, 180)
    }
  }
  const openGraphMethodology = () => {
    if (onNavigate) onNavigate("graph-informed-descriptor-integration")
    else if (typeof window !== "undefined") window.location.assign("#graph-informed-descriptor-integration")
  }
  const openOrganicGraph = () => {
    if (onNavigate) onNavigate("organic-acid-graph-explorer")
    else if (typeof window !== "undefined") window.location.assign("#organic-acid-graph-explorer")
  }

  return (
    <div id="candidate-scoring-lab" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={text(lang, "EcoScreen 候选评分", "EcoScreen / Candidate Scoring")}
        subtitle={lang === "zh"
          ? "默认展示通用 MOF 全局评分工作台，产甲酸 CRITIC 案例作为方法样例保留。"
          : "Defaults to the general MOF global scoring workbench, with the formate CRITIC case retained as a case study."}
        meta={lang === "zh"
          ? "全局描述符评分、CRITIC 与 Hybrid 权重、解释诊断和证据边界"
          : "Global descriptor scoring, CRITIC / Hybrid weighting, explanation diagnostics, and evidence boundaries"}
        action={
          <>
            <BasisBadge tone="proxy">{text(lang, "Open MOF Seed · 全局候选源", "Open MOF Seed / global source")}</BasisBadge>
            <CopyLinkButton hash="ecoscreen" ariaLabel={lang === "zh" ? "复制 EcoScreen 链接" : "Copy EcoScreen link"} />
          </>
        }
      />

      <div data-testid="ecoscreen-status-strip" style={{ alignItems: "center", color: t.subtle, display: "flex", flexWrap: "wrap", fontSize: 12.2, gap: 8, lineHeight: 1.55 }}>
        <span style={{ color: t.textStrong, fontWeight: 900 }}>
          {lang === "zh" ? "早期候选优先级判断" : "Early-stage prioritization"}
        </span>
        <span style={{ color: t.faint }}>·</span>
        <span>
          {lang === "zh"
            ? "不输出甲酸产物结果，结果仅作为研究假设与复核线索"
            : "not a direct formate-yield output; results are hypotheses and review leads"}
        </span>
        <DisclaimerLink />
        <span style={{ color: t.faint }}>·</span>
        <span>
          {lang === "zh"
            ? `Open MOF Seed · 已加载 ${generalRows.length} 条 · 当前筛选 ${filteredGeneralRows.length} 条`
            : `Open MOF Seed · ${generalRows.length} loaded · ${filteredGeneralRows.length} filtered`}
        </span>
        <span style={{ color: t.faint }}>·</span>
        <span>
          {lang === "zh"
            ? "缺失字段仅作为临时优先级参考"
            : "missing fields remain provisional priority context"}
        </span>
      </div>

      <DataQualityAuditPanel records={generalRows} lang={lang} t={t} isMobile={isMobile} />

      <DataQualitySummary lang={lang} t={t} isMobile={isMobile} />

      <EcoScreenEvidenceWorkbench
        evidence={ecoScreenEvidence}
        activeNeed={activeEcoNeed}
        onNeedChange={setActiveEcoNeed}
        lang={lang}
        t={t}
        isMobile={isMobile}
      />

      <ReactionFilterPanel
        filters={reactionFilters}
        onChange={(key, checked) => setReactionFilters(current => ({ ...current, [key]: checked }))}
        count={filteredGeneralRows.length}
        total={generalRows.length}
        lang={lang}
        t={t}
        isMobile={isMobile}
      />

      <EcoScreenExplainabilityPanel credibility={credibilityReport} reactionGraph={reactionGraphData} selectedCandidate={selectedCandidate} lang={lang} t={t} isMobile={isMobile} />

      <Card t={t} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900 }}>
            {text(lang, "查看描述符关联", "How descriptors are connected")}
          </div>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 5, maxWidth: 760 }}>
            {text(
              lang,
              "查看图论辅助关系图：传统描述符、metal node / linker / functional group、active motif、evidence modifier 和 final score 如何连接。",
              "Open the graph-informed relationship network for traditional descriptors, metal node / linker / functional group, active motif, evidence modifier, and final score."
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={openGraphMethodology} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent, justifyContent: "center" }}>
            {text(lang, "查看图论方法图", "View graph method")}
          </button>
          <button type="button" onClick={openOrganicGraph} style={{ ...toolbarBtn(t), justifyContent: "center" }}>
            {text(lang, "查看有机酸相关性", "View organic acid relevance")}
          </button>
        </div>
      </Card>

      <Card t={t} style={{ display: "grid", gap: 10 }}>
        <PanelTitle
          t={t}
          title={text(lang, "评分模式", "Scoring mode")}
          subtitle={text(
            lang,
            "默认使用全局 MOF 描述符评分；formate CRITIC case 作为催化 case study 保留。",
            "Default mode uses the global MOF descriptor scoring engine; the formate CRITIC case remains as a catalysis case study."
          )}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { id: "general", zh: "通用 MOF 评分", en: "General MOF Scoring" },
            { id: "formate", zh: "产甲酸 CRITIC 案例", en: "Formate CRITIC Case" },
          ].map(item => {
            const active = scoringMode === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setScoringMode(item.id)}
                style={{
                  ...toolbarBtn(t),
                  background: active ? t.badgeInfoBg : t.panel,
                  borderColor: active ? t.accent : t.border,
                  color: active ? t.accentText : t.muted,
                }}
              >
                {lang === "zh" ? item.zh : item.en}
              </button>
            )
          })}
        </div>
      </Card>

      <Card t={t} style={{ display: "grid", gap: 10 }}>
        <PanelTitle
          t={t}
          title={text(lang, "筛选优先级", "Performance Priority")}
          subtitle={text(
            lang,
            "选择本轮排序优先级；该设置会进入评分追踪、排名解释与报告快照。",
            "Choose the ranking priority for this run; it is written into the scoring trace, ranking explanations, and report snapshot."
          )}
        />
        <SegmentedControl
          items={PERFORMANCE_PRIORITY_MODES.map(mode => ({
            id: mode.id,
            label: mode.label,
            zhLabel: mode.labelZh,
            description: mode.description,
            zhDescription: mode.descriptionZh,
          }))}
          value={performancePriorityMode}
          onChange={setPerformancePriorityMode}
          lang={lang}
          t={t}
        />
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, display: "grid", fontSize: 12, gap: 5, lineHeight: 1.55, padding: 10 }}>
          <strong style={{ color: t.textStrong }}>{text(lang, "优先级影响摘要", "Priority Impact Summary")}: {text(lang, activePriority.labelZh, activePriority.label)}</strong>
          <span>{text(lang, activePriority.rankingImpactZh, activePriority.rankingImpact)}</span>
          <span>{text(lang, "受影响字段", "Affected descriptors")}: {(activePriority.affectedDescriptors || []).join(", ") || text(lang, "综合指标", "balanced descriptors")}</span>
        </div>
      </Card>

      {scoringMode === "general" && (
        <>
          <GlobalScoringWorkbench
            candidates={generalRows}
            dataMode={globalCandidateMode}
            lang={lang}
            t={t}
            isMobile={isMobile}
            status={generalStatus}
            number="01"
            title={text(lang, "通用 MOF 评分工作台", "General MOF Scoring Workbench")}
            subtitle={text(
              lang,
              "EcoScreen 使用统一评分框架；描述符、权重方法、候选解释和诊断口径保持一致。",
              "EcoScreen uses the unified scoring framework; descriptors, weighting methods, candidate explanations, and diagnostics remain consistent."
            )}
            performancePriorityMode={performancePriorityMode}
          />
          <ResultLayer id="ecoscreen-result-layer-05" testId="ecoscreen-result-layer-05" number="05" title={text(lang, "筛选过程追踪", "Screening Trace")} subtitle={lang === "zh" ? "数据库预览会先显示流程框架；候选数据返回后补充图表与明细。" : "Database Preview shows the screening flow first; charts and candidate details appear after data loads."}>
            <ScreeningTraceSection model={generalTraceModel} scenarioLabel={scoringMode} performancePriorityMode={performancePriorityMode} lang={lang} t={t} isMobile={isMobile} />
          </ResultLayer>
        </>
      )}

      {scoringMode === "formate" && (
      <>
      <ResultLayer number="01" title={text(lang, "甲酸 CRITIC 案例权重概览", "Formate CRITIC Case / Weight Overview")} subtitle={lang === "zh" ? "展示稳定性、反应能垒、选择性代理、证据修正和可行性门控如何共同形成候选优先级。" : "Shows how stability, reaction-barrier proxy, selectivity proxy, evidence correction, and feasibility gating form candidate priority."}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.25fr) minmax(360px, 0.75fr)", gap: 12, alignItems: "stretch" }}>
            <Card t={t} style={{ display: "grid", gap: 10 }}>
              <div style={{ color: t.textStrong, fontSize: isMobile ? 20 : 24, lineHeight: 1.08, fontWeight: 940 }}>
                {text(lang, "候选评分实验台", "Candidate Scoring Lab")}
              </div>
              <div style={{ color: t.textStrong, fontSize: isMobile ? 16 : 18, lineHeight: 1.2, fontWeight: 860 }}>
                候选材料多指标决策支持面板
              </div>
              <div style={{ color: t.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 860 }}>
                {lang === "zh"
                  ? "面板将 CRITIC 权重、指标诊断、候选排名、稳健性测试和证据限制放在同一解释链路中。"
                  : "The panel connects CRITIC weights, indicator diagnostics, candidate ranking, robustness testing, and evidence limitations in one explanation chain."}
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: t.faint, fontSize: 11 }}>
                <InlineFormula math={"D_{\\mathrm{expected}}=D_{\\mathrm{raw}}\\times Q"} fallback="D_expected = D_raw × Q" />
                <InlineFormula math={"C_j=\\sigma_j\\sum_{k=1}^{m}(1-r_{jk})"} fallback="C_j = σ_j Σ(1-r_jk)" />
                <InlineFormula math={"w_j=\\frac{C_j}{\\sum_{j=1}^{m}C_j}"} fallback="w_j = C_j / ΣC_j" />
              </div>
            </Card>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              <MetricCard label={text(lang, "候选总数", "Total candidates")} value={model.candidates.length} note={text(lang, "种子记录集", "seed record set")} t={t} />
              <MetricCard label={text(lang, "已评分候选", "Scored candidates")} value={scored.length} note={text(lang, "通过可行性门控", "passed feasibility gate")} t={t} />
              <MetricCard label={text(lang, "已门控排除", "Excluded")} value={excluded.length} note={text(lang, "未通过可行性门控", "failed feasibility gate")} t={t} tone={excluded.length ? "warn" : "calc"} />
              <MetricCard label={text(lang, "当前最高优先级候选", "Top candidate")} value={topCandidate?.name || "—"} note={topCandidate ? `${text(lang, "证据修正后期望评分", "evidence-corrected score")} ${fmt(topCandidate.D_expected)}` : ""} t={t} />
            </div>
          </div>
          <ScoringMethodSummary model={model} weightingMode={weightingMode} onWeightingModeChange={setWeightingMode} lang={lang} t={t} isMobile={isMobile} />
        </div>
      </ResultLayer>

      <ResultLayer number="02" title={text(lang, "指标权重诊断", "Weight Diagnostics")} subtitle={lang === "zh" ? "展示 CRITIC 权重、指标冲突热图、标准差、区分强度和每个指标的解释文本。" : "CRITIC weights, conflict heatmap, standard deviation / contrast intensity, and per-indicator interpretation."}>
        <WeightDiagnostics model={model} lang={lang} t={t} isMobile={isMobile} />
      </ResultLayer>

      <ResultLayer number="03" title={text(lang, "候选排序", "Candidate Ranking")} subtitle={lang === "zh" ? "候选卡片展示综合得分、性能、可持续性、证据、描述符完整度、排名置信度和可展开解释。" : "Candidate rows include Overall, Performance, Sustainability, Evidence, descriptor completeness, ranking confidence, and expandable rationale."}>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.38fr) minmax(340px, 0.82fr)", gap: 12, alignItems: "stretch" }}>
          <Card t={t}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", marginBottom: 12, flexWrap: "wrap" }}>
              <PanelTitle t={t} title={text(lang, "MOF 候选排序", "MOF Candidate Ranking")} subtitle={lang === "zh" ? "点击候选行会联动详情和四象限图。" : "Click a row to update the detail panel and quadrant chart."} />
              <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>
                {text(lang, "当前模式：", "active mode: ")}{lang === "zh" ? model.activeWeightingMode.zhLabel : model.activeWeightingMode.label}
              </span>
            </div>
            <div style={{ color: t.subtle, fontSize: 11.5, lineHeight: 1.55, marginBottom: 10 }}>
              {lang === "zh"
                ? "该分数用于方法展示和候选优先级解释，不代表该 MOF 的真实性能结论。"
                : "This score supports method demonstration and candidate-priority explanation; it is not a validated performance conclusion for the MOF."}
            </div>
            <CandidateRanking candidates={model.candidates} selectedId={selectedCandidate?.id} onSelect={setSelectedId} lang={lang} t={t} isMobile={isMobile} />
          </Card>
          <CandidateDetail candidate={selectedCandidate} lang={lang} t={t} isMobile={isMobile} />
        </div>
      </ResultLayer>

      <ResultLayer number="04" title={text(lang, "性能-可持续性四象限图", "Performance vs Sustainability Quadrant")} subtitle={lang === "zh" ? "横轴为可持续性分，纵轴为性能分；点大小表示证据分，点形状/颜色表示来源状态。" : "x-axis: Sustainability Score; y-axis: Performance Score; point size: Evidence Score; marker: source state."}>
        <Card t={t}>
          <PerformanceSustainabilityQuadrant candidates={model.candidates} selectedId={selectedCandidate?.id} onSelect={setSelectedId} lang={lang} t={t} isMobile={isMobile} />
        </Card>
      </ResultLayer>

      <ResultLayer id="ecoscreen-result-layer-05" testId="ecoscreen-result-layer-05" number="05" title={text(lang, "筛选过程追踪", "Screening Trace")} subtitle={lang === "zh" ? "每一步发生了什么、为什么剩下这些候选、为什么排名如此、哪些数据缺口阻断了 verified。" : "What happened at each step, why these candidates remain, why they rank this way, and which data gaps block verified."}>
        <ScreeningTraceSection model={model} scenarioLabel={scoringMode} lang={lang} t={t} isMobile={isMobile} />
      </ResultLayer>

      <ResultLayer number="06" title={text(lang, "排名稳健性", "Ranking Robustness")} subtitle={lang === "zh" ? "比较 CRITIC、等权重、专家预设、Top-3 一致性和移除单个候选后的敏感性。" : "CRITIC vs Equal Weight vs Expert Preset, Top-3 consistency, and remove-one-candidate sensitivity."}>
        <RankingRobustness model={model} selectedId={selectedCandidate?.id} onSelect={setSelectedId} lang={lang} t={t} isMobile={isMobile} />
      </ResultLayer>

      <ResultLayer number="07" title={text(lang, "证据与限制说明", "Evidence and Limitation Notes")}>
        <EvidenceNotes lang={lang} t={t} isMobile={isMobile} />
      </ResultLayer>

      <ResultLayer number="08" title={text(lang, "方法论入口", "Methodology Link")}>
        <Card t={t} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900 }}>{text(lang, "CRITIC-MCDA 决策支持方法论", "CRITIC-MCDA Decision Support Methodology")}</div>
            <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 5 }}>
              {lang === "zh"
                ? "查看 CRITIC 公式、差异强度、冲突强度、客观权重、因果边界和方法限制。"
                : "Open CRITIC formulas, contrast intensity, conflict intensity, objective weight, causal boundary, and limitations."}
            </div>
          </div>
          <button type="button" onClick={openMethodology} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent, justifyContent: "center" }}>
            {lang === "zh" ? "阅读方法论说明" : "Read methodology"}
          </button>
        </Card>
      </ResultLayer>
      </>
      )}
    </div>
  )
}
