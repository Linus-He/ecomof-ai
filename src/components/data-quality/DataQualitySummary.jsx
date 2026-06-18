// @ts-nocheck
// V3.0 Data Quality Summary — surfaces the Data Foundation tiering inside
// EcoScreen with an interactive tier filter. Self-fetches the datasets unless
// `summary` / `records` props are injected (used by tests).
import { useEffect, useMemo, useState } from "react"
import { BasisBadge } from "../ui"
import { fetchDataJson } from "../../services/dataService"
import { summarizeDataFoundation } from "../../utils/dataFoundation"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const pct = value => (Number.isFinite(Number(value)) ? `${Math.round(Number(value) * 100)}%` : String(value ?? "pending"))

const TIER_FILTERS = [
  { id: "gold_only", label: "Gold Only", labelZh: "仅 Gold", tiers: ["Gold"] },
  { id: "gold_silver", label: "Gold + Silver", labelZh: "Gold + Silver", tiers: ["Gold", "Silver"] },
  { id: "include_bronze", label: "Include Bronze", labelZh: "含 Bronze", tiers: ["Gold", "Silver", "Bronze"] },
  { id: "exclude_rejected", label: "Exclude Rejected", labelZh: "排除 Rejected", tiers: ["Gold", "Silver", "Bronze"] },
]

function Metric({ label, value, t, tone = "default" }) {
  const color = tone === "warn" ? t.warn : tone === "pass" ? (t.success || t.accentText) : t.textStrong
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 9 }}>
      <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color, display: "block", fontSize: 15, lineHeight: 1.18, marginTop: 5 }}>{value}</strong>
    </div>
  )
}

export function DataQualitySummary({ summary: injectedSummary, records: injectedRecords, lang = "en", t, isMobile }) {
  const [summary, setSummary] = useState(injectedSummary || null)
  const [records, setRecords] = useState(injectedRecords || null)
  const [filter, setFilter] = useState("exclude_rejected")

  useEffect(() => {
    if (injectedSummary && injectedRecords) return undefined
    let active = true
    Promise.all([
      fetchDataJson("organic_acid_gold_dataset_v2.json", null),
      fetchDataJson("organic_acid_literature_dataset_v2.json", null),
      fetchDataJson("benchmark_dataset_v2.json", null),
      fetchDataJson("organic_acid_labels_v2.json", null),
      fetchDataJson("data_ingestion/organic_acid_reaction_dataset_v1.json", null),
      fetchDataJson("data_ingestion/verified_metadata_expansion_report.json", null),
      fetchDataJson("data_ingestion/reaction_data_expansion_summary_v3_1.json", null),
    ]).then(([gold, literature, benchmark, labels, reaction, verifiedMetadataReport, growthSummary]) => {
      if (!active) return
      setSummary(summarizeDataFoundation({ gold, literature, benchmark, labels, reaction, verifiedMetadataReport, growthSummary }))
      setRecords(Array.isArray(literature?.records) ? literature.records : [])
    }).catch(() => { if (active) { setSummary(null); setRecords([]) } })
    return () => { active = false }
  }, [injectedSummary, injectedRecords])

  const distribution = summary?.qualityDistribution || { Gold: 0, Silver: 0, Bronze: 0, Rejected: 0 }
  const total = (distribution.Gold || 0) + (distribution.Silver || 0) + (distribution.Bronze || 0) + (distribution.Rejected || 0)
  const activeFilter = TIER_FILTERS.find(f => f.id === filter) || TIER_FILTERS[2]
  const visibleCount = useMemo(() => activeFilter.tiers.reduce((sum, tier) => sum + (distribution[tier] || 0), 0), [activeFilter, distribution])

  if (!summary) return null

  return (
    <section id="ecoscreen-data-quality-summary" data-testid="data-quality-summary" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 11, minWidth: 0, padding: 14 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Data Quality Summary</span>
        <h3 style={{ color: t.textStrong, fontSize: 16, lineHeight: 1.2, margin: 0 }}>{text(lang, "数据质量摘要", "Data Quality Summary")}</h3>
        <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.5, margin: 0 }}>
          {text(lang, "V3.1 数据增长：Gold、Verified Metadata、Reaction、Label 与 Benchmark Eligible 同步显示，并保留 Accuracy / ROC-AUC Pending 边界。", "V3.1 data growth: Gold, verified metadata, reaction, label, and benchmark-eligible counts are shown while Accuracy / ROC-AUC remain Pending.")}
        </p>
      </header>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <Metric label="Total Records" value={total} t={t} />
        <Metric label="Gold" value={distribution.Gold || 0} t={t} tone="pass" />
        <Metric label="Silver" value={distribution.Silver || 0} t={t} />
        <Metric label="Bronze" value={distribution.Bronze || 0} t={t} />
        <Metric label="Rejected" value={distribution.Rejected || 0} t={t} tone="warn" />
        <Metric label="Verified Metadata" value={summary.verifiedMetadataCount} t={t} tone="pass" />
        <Metric label="Reaction Dataset" value={summary.reactionDatasetCount || 0} t={t} tone="pass" />
        <Metric label="Label Count" value={summary.labelCount || 0} t={t} tone={summary.labelCount >= summary.targets?.labelCount ? "pass" : "warn"} />
        <Metric label="Benchmark Eligible" value={summary.benchmarkEligibleCount || 0} t={t} tone={summary.benchmarkEligibleCount >= summary.targets?.benchmarkEligible ? "pass" : "warn"} />
        <Metric label="Provenance Coverage" value={pct(summary.provenanceCoverage)} t={t} tone="pass" />
        <Metric label="Gold Status" value={summary.goldSufficient ? "Sufficient" : "Insufficient"} t={t} tone={summary.goldSufficient ? "pass" : "warn"} />
      </div>
      {summary.growth ? (
        <div data-testid="data-growth-overview" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "Data Growth Overview", "Data Growth Overview")}</strong>
          <div style={{ display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))" }}>
            {[
              ["Gold", "goldDataset"],
              ["Verified", "verifiedMetadata"],
              ["Reaction", "reactionDataset"],
              ["Label", "labelCount"],
              ["Benchmark", "benchmarkEligible"],
            ].map(([label, key]) => {
              const previous = summary.growth.previous?.[key] ?? 0
              const current = summary.growth.current?.[key] ?? summary.current?.[key] ?? 0
              return <Metric key={key} label={label} value={`${previous} -> ${current}`} t={t} tone={Number(current) >= Number(previous) ? "pass" : "warn"} />
            })}
          </div>
          <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55 }}>
            {text(lang, "Growth Trend / Quality Trend / Coverage Trend 均来自 V3.1 数据生成摘要；Accuracy 与 ROC-AUC 仍为 Pending。", "Growth Trend / Quality Trend / Coverage Trend come from the V3.1 generation summary; Accuracy and ROC-AUC remain Pending.")}
          </div>
        </div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {TIER_FILTERS.map(item => (
          <button
            key={item.id}
            type="button"
            data-testid={`data-quality-filter-${item.id}`}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            style={{ background: filter === item.id ? t.badgeInfoBg : t.surface, border: `1px solid ${filter === item.id ? t.accent : t.border}`, borderRadius: 7, color: filter === item.id ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.5, fontWeight: 850, minHeight: 30, padding: "5px 10px" }}
          >
            {text(lang, item.labelZh, item.label)}
          </button>
        ))}
        <BasisBadge tone="info">{text(lang, `当前可用记录 ${visibleCount}`, `${visibleCount} records in view`)}</BasisBadge>
      </div>
    </section>
  )
}

export default DataQualitySummary
