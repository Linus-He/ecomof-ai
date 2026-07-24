// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import lcaInventoryFallback from "../../../public/data/lca_inventory.json"
import metalCostFallback from "../../../public/data/metal_precursor_cost_table.json"
import lcaModelFallback from "../../../public/data/ecoscreen_lca_model_v1.json"
import regionalBaselinesFallback from "../../../public/data/ecoscreen_regional_baselines_v1.json"
import evidenceSourceRegistryFallback from "../../../public/data/ecoscreen_evidence_source_registry_v1.json"
import {
  BasisBadge,
  Callout,
  CopyLinkButton,
  PageHeader,
  toolbarBtn,
  useLang,
  useT,
  useViewport,
} from "../../shared"
import { fetchDataJson } from "../../services/dataService"
import { DEFAULT_CANDIDATE_DATA_MODE } from "../../config/dataModes"
import { useMofCandidates } from "../../hooks/useMofCandidates"
import {
  buildEcoLcaScenario,
  compareEcoLcaCandidateCosts,
  compareEcoLcaRoutes,
} from "../../utils/ecoLca"

const tr = (lang, zh, en) => lang === "zh" ? zh : en
const number = (value, digits = 2) => Number(value || 0).toLocaleString(undefined, {
  maximumFractionDigits: digits,
  minimumFractionDigits: digits,
})

const money = (valueUsd, baseline, digits = 2) => {
  const value = Number(valueUsd || 0) * Number(baseline?.currencyPerUsd || 1)
  return `${baseline?.currencySymbol || "$"}${number(value, digits)}`
}

function Card({ t, children, style, ...props }) {
  return (
    <section
      {...props}
      style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        minWidth: 0,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </section>
  )
}

function SectionHead({ t, title, subtitle, action }) {
  return (
    <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
      <div style={{ minWidth: 0 }}>
        <h2 style={{ color: t.textStrong, fontSize: 15, fontWeight: 920, lineHeight: 1.3, margin: 0 }}>{title}</h2>
        {subtitle ? <div style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.6, marginTop: 5, maxWidth: 920 }}>{subtitle}</div> : null}
      </div>
      {action}
    </div>
  )
}

function WorkbenchNav({ t, lang }) {
  const sections = [
    ["ecoscreen-goal-scope", "01", tr(lang, "边界与基准", "Scope & baseline")],
    ["ecoscreen-scenario-controls", "02", tr(lang, "候选与工艺", "Candidate & process")],
    ["ecoscreen-candidate-evidence", "02B", tr(lang, "证据层", "Evidence layer")],
    ["ecoscreen-lca-results", "03", tr(lang, "结果", "Results")],
    ["ecoscreen-hotspots", "04", tr(lang, "热点", "Hotspots")],
    ["ecoscreen-route-comparison", "05", tr(lang, "路线敏感性", "Route sensitivity")],
    ["ecoscreen-economic-analysis", "06", tr(lang, "经济分析", "Economics")],
    ["ecoscreen-method-readiness", "07", tr(lang, "门控", "Data gate")],
    ["ecoscreen-literature-basis", "08", tr(lang, "依据", "Sources")],
  ]
  return (
    <nav
      aria-label={tr(lang, "EcoScreen 工作流导航", "EcoScreen workflow navigation")}
      style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        display: "flex",
        gap: 6,
        overflowX: "auto",
        padding: 7,
        position: "sticky",
        scrollSnapType: "x proximity",
        top: 112,
        zIndex: 6,
      }}
    >
      {sections.map(([id, index, label]) => (
        <a
          key={id}
          href={`#${id}`}
          style={{
            alignItems: "center",
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 9,
            color: t.muted,
            display: "inline-flex",
            flex: "0 0 auto",
            fontSize: 10.8,
            fontWeight: 850,
            gap: 7,
            padding: "7px 9px",
            scrollSnapAlign: "start",
            textDecoration: "none",
          }}
        >
          <span style={{ color: t.accentText, fontSize: 9.5 }}>{index}</span>
          {label}
        </a>
      ))}
    </nav>
  )
}

function EvidenceMetric({ t, label, value, note, tone = "info" }) {
  const color = tone === "warn" ? t.warn : tone === "good" ? t.success : t.accentText
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 4, padding: 10 }}>
      <span style={{ color: t.faint, fontSize: 9.8, fontWeight: 850 }}>{label}</span>
      <strong style={{ color, fontSize: 18, fontWeight: 930 }}>{value}</strong>
      <span style={{ color: t.muted, fontSize: 10.2, lineHeight: 1.45 }}>{note}</span>
    </div>
  )
}

function CandidateEvidencePanel({ t, lang, dataset, registry, candidate, isNarrow }) {
  const summary = dataset?.summary || {}
  const hardBlockerCoverage = summary.hardBlockerCoverage || {}
  const hardBlockerCount = Object.keys(hardBlockerCoverage).length
  const availableHardBlockerCount = Object.values(hardBlockerCoverage).filter(value => Number(value) > 0).length
  const process = candidate?.processEvidence
  const quantities = candidate?.reactionQuantities && typeof candidate.reactionQuantities === "object"
    ? Object.entries(candidate.reactionQuantities).slice(0, 5)
    : []
  const isFairMof = candidate?.sourceDatabase === "FAIR-MOFs synthesis conditions"
  const sourceRows = registry?.sources || []

  return (
    <Card t={t} id="ecoscreen-candidate-evidence" style={{ display: "grid", gap: 13, scrollMarginTop: 168 }} data-testid="ecoscreen-candidate-evidence">
      <SectionHead
        t={t}
        title={tr(lang, "02B · 候选证据层", "02B · Candidate evidence layer")}
        subtitle={tr(
          lang,
          "结构库、合成文献、吸附数据库和背景 LCI 分层连接；来源真实并不等于字段已足够进入比较性 LCA。",
          "Structure, synthesis literature, adsorption databases, and background LCI are connected as separate evidence layers; a real source does not by itself make a record ready for comparative LCA.",
        )}
        action={<BasisBadge tone="info">{tr(lang, "FAIR-MOFs 已接入", "FAIR-MOFs connected")}</BasisBadge>}
      />
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))" }}>
        <EvidenceMetric t={t} label={tr(lang, "实验合成记录", "Experimental recipes")} value={number(summary.emittedRecordCount, 0)} note={tr(lang, "CC BY 4.0 · 全部带原始 DOI", "CC BY 4.0 · all linked to source DOIs")} tone="good" />
        <EvidenceMetric t={t} label={tr(lang, "路线覆盖", "Route coverage")} value={`${Math.round(Number(summary.fieldCoverage?.synthesisRoute?.rate || 0) * 100)}%`} note={tr(lang, `${number(summary.fieldCoverage?.synthesisRoute?.count, 0)} 条`, `${number(summary.fieldCoverage?.synthesisRoute?.count, 0)} records`)} />
        <EvidenceMetric t={t} label={tr(lang, "溶剂覆盖", "Solvent coverage")} value={`${Math.round(Number(summary.fieldCoverage?.synthesisSolvent?.rate || 0) * 100)}%`} note={tr(lang, `${number(summary.fieldCoverage?.synthesisSolvent?.count, 0)} 条`, `${number(summary.fieldCoverage?.synthesisSolvent?.count, 0)} records`)} />
        <EvidenceMetric t={t} label={tr(lang, "温度 / 时间", "Temperature / time")} value={`${Math.round(Number(summary.fieldCoverage?.synthesisTemperature?.rate || 0) * 100)}% / ${Math.round(Number(summary.fieldCoverage?.synthesisTime?.rate || 0) * 100)}%`} note={tr(lang, "文本挖掘实验条件", "text-mined experimental conditions")} />
        <EvidenceMetric t={t} label={tr(lang, "LCA 硬门控", "LCA hard gates")} value={`${availableHardBlockerCount} / ${hardBlockerCount}`} note={tr(lang, "产率、质量平衡、实测能耗、回收率、工作容量、循环与再生仍待补", "yield, mass balance, measured energy, recovery, working capacity, cycling, and regeneration remain missing")} tone="warn" />
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.15fr) minmax(300px, 0.85fr)" }}>
        <div style={{ background: t.surface, border: `1px solid ${isFairMof ? t.accent : t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{candidateUiName(candidate)}</strong>
            <BasisBadge tone={isFairMof ? "calc" : "proxy"}>
              {isFairMof ? tr(lang, "真实合成条件", "Real synthesis conditions") : tr(lang, "仅结构记录", "Structure record only")}
            </BasisBadge>
          </div>
          {isFairMof ? (
            <>
              <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                {[
                  [tr(lang, "路线", "Route"), candidate.synthesisRoute || "missing"],
                  [tr(lang, "溶剂", "Solvent"), candidate.synthesisSolvent || "missing"],
                  [tr(lang, "温度", "Temperature"), candidate.synthesisTemperatureC == null ? "missing" : `${candidate.synthesisTemperatureC} °C`],
                  [tr(lang, "时间", "Time"), candidate.synthesisTimeHours == null ? "missing" : `${candidate.synthesisTimeHours} h`],
                  [tr(lang, "金属前驱体", "Metal precursor"), (candidate.metalPrecursor || []).join(" + ") || "missing"],
                  [tr(lang, "连接体", "Linker"), candidate.linker || "missing"],
                ].map(([label, value]) => (
                  <div key={label} style={{ minWidth: 0 }}>
                    <span style={{ color: t.faint, display: "block", fontSize: 9.6, fontWeight: 850 }}>{label}</span>
                    <span style={{ color: value === "missing" ? t.warn : t.muted, display: "block", fontSize: 10.8, lineHeight: 1.45, marginTop: 3, overflowWrap: "anywhere" }}>{value}</span>
                  </div>
                ))}
              </div>
              {quantities.length ? (
                <details>
                  <summary style={{ color: t.accentText, cursor: "pointer", fontSize: 10.8, fontWeight: 850 }}>
                    {tr(lang, `查看前 ${quantities.length} 项原始投料`, `View first ${quantities.length} reported quantities`)}
                  </summary>
                  <div style={{ display: "grid", gap: 5, marginTop: 8 }}>
                    {quantities.map(([name, rows]) => (
                      <div key={name} style={{ color: t.muted, display: "flex", flexWrap: "wrap", fontSize: 10.3, gap: 6, justifyContent: "space-between" }}>
                        <span>{name}</span>
                        <span>{(rows || []).map(row => `${row.quantity} ${row.unit}`).join(" · ")}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
              <a href={`https://doi.org/${candidate.doi}`} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 10.5, overflowWrap: "anywhere", textDecoration: "none" }}>
                DOI {candidate.doi}
              </a>
            </>
          ) : (
            <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>
              {tr(lang, "该结构记录尚未与 FAIR-MOFs 的 CSD refcode 建立精确映射。可切换到“合成证据库”检索带配方记录的候选。", "This structure record does not yet have an exact FAIR-MOFs CSD-refcode match. Switch to the synthesis-evidence library to search candidates with recipe records.")}
            </div>
          )}
          <div style={{ color: t.warn, fontSize: 10.4, lineHeight: 1.5 }}>
            {tr(lang, dataset?.evidenceBoundaryZh, dataset?.evidenceBoundaryEn)}
          </div>
        </div>

        <div style={{ display: "grid", gap: 7 }}>
          {sourceRows.map(source => (
            <a key={source.id} href={source.url} target="_blank" rel="noreferrer" style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, color: t.muted, display: "grid", gap: 7, gridTemplateColumns: "minmax(0, 1fr) auto", padding: 9, textDecoration: "none" }}>
              <span style={{ minWidth: 0 }}>
                <strong style={{ color: t.textStrong, display: "block", fontSize: 10.8 }}>{source.name}</strong>
                <span style={{ display: "block", fontSize: 9.8, lineHeight: 1.35, marginTop: 3 }}>{tr(lang, source.roleZh, source.roleEn)}</span>
              </span>
              <BasisBadge tone={source.status === "ingested" || source.status === "connected" ? "calc" : "user"}>
                {source.status}
              </BasisBadge>
            </a>
          ))}
        </div>
      </div>
    </Card>
  )
}

function Metric({ t, label, value, note, tone = "info" }) {
  const color = tone === "warn" ? t.warn : tone === "good" ? t.success : tone === "cost" ? t.lccAccent || t.accentText : t.accentText
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, minHeight: 112, padding: 13 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, lineHeight: 1.3 }}>{label}</span>
      <strong style={{ color, fontSize: 21, fontWeight: 940, lineHeight: 1.12, overflowWrap: "anywhere" }}>{value}</strong>
      <span style={{ color: t.muted, fontSize: 10.8, lineHeight: 1.45 }}>{note}</span>
    </div>
  )
}

function ChoiceButtons({ t, lang, items, value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {items.map(item => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item)}
            title={tr(lang, item.boundaryZh || item.assumptionZh, item.boundaryEn || item.assumptionEn)}
            style={{
              ...toolbarBtn(t),
              background: active ? t.accentText : t.surface,
              borderColor: active ? t.accent : t.border,
              color: active ? "#fff" : t.muted,
              minHeight: 34,
            }}
          >
            {tr(lang, item.labelZh, item.labelEn)}
          </button>
        )
      })}
    </div>
  )
}

function NumberField({ t, label, value, min, max, step, suffix, onChange }) {
  return (
    <label style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 10 }}>
      <span style={{ color: t.muted, fontSize: 10.8, fontWeight: 800, lineHeight: 1.35 }}>{label}</span>
      <span style={{ alignItems: "center", display: "flex", gap: 7 }}>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={event => onChange(Number(event.target.value))}
          style={{
            background: t.panel,
            border: `1px solid ${t.border}`,
            borderRadius: 7,
            color: t.textStrong,
            fontSize: 12,
            minWidth: 0,
            padding: "7px 8px",
            width: "100%",
          }}
        />
        {suffix ? <span style={{ color: t.faint, fontSize: 10.5, whiteSpace: "nowrap" }}>{suffix}</span> : null}
      </span>
    </label>
  )
}

function flowLabel(flow, lang) {
  const labels = {
    "metal precursor": ["金属前驱体", "Metal precursor"],
    "organic linker": ["有机连接体", "Organic linker"],
    "DMF/solvent loss": ["溶剂损失", "Solvent loss"],
    electricity: ["合成电力", "Synthesis electricity"],
    "thermal activation": ["热活化", "Thermal activation"],
    "washing water": ["洗涤水", "Washing water"],
    "solid waste": ["固体废弃物", "Solid waste"],
    "regeneration electricity": ["再生电力", "Regeneration electricity"],
  }
  const value = labels[flow]
  return value ? tr(lang, value[0], value[1]) : flow
}

function readinessFieldLabel(field, lang) {
  const labels = {
    metalNode: ["金属节点", "Metal node"],
    linker: ["连接体身份", "Linker identity"],
    synthesisRoute: ["合成路线", "Synthesis route"],
    synthesisSolvent: ["合成/活化溶剂", "Synthesis / activation solvent"],
    synthesisTemperature: ["合成温度", "Synthesis temperature"],
    synthesisTime: ["合成时间", "Synthesis time"],
    reactionQuantities: ["前驱体投料", "Reported input quantities"],
    massBalance: ["质量平衡", "Mass balance"],
    yield: ["产率", "Yield"],
    synthesisEnergy: ["合成能耗", "Synthesis energy"],
    solventRecovery: ["溶剂回收率", "Solvent recovery"],
    workingCapacity: ["工作容量", "Working capacity"],
    cycleStability: ["循环稳定性", "Cycle stability"],
    regenerationEnergy: ["再生能耗", "Regeneration energy"],
  }
  const value = labels[field]
  return value ? tr(lang, value[0], value[1]) : field
}

function candidateUiName(candidate = {}) {
  const displayName = candidate.displayName || candidate.name
  if (displayName && !/^(core|qmof)\s+mof\s+record$/i.test(String(displayName).trim())) return displayName
  return candidate.rawName || candidate.sourceRecordId || displayName || candidate.id || candidate.candidateId || "pending"
}

export function EcoLcaWorkbench({ onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const { candidates: structureCandidates, status } = useMofCandidates(DEFAULT_CANDIDATE_DATA_MODE)
  const [inventoryRows, setInventoryRows] = useState(lcaInventoryFallback)
  const [metalCostRows, setMetalCostRows] = useState(metalCostFallback.records || [])
  const [model, setModel] = useState(lcaModelFallback)
  const [processEvidence, setProcessEvidence] = useState({
    records: [],
    summary: {
      emittedRecordCount: 0,
      fieldCoverage: {},
    },
  })
  const [regionalBaselines, setRegionalBaselines] = useState(regionalBaselinesFallback)
  const [evidenceRegistry, setEvidenceRegistry] = useState(evidenceSourceRegistryFallback)
  const [baselineId, setBaselineId] = useState(regionalBaselinesFallback.defaultBaselineId || "china")
  const [candidateId, setCandidateId] = useState("")
  const [candidateQuery, setCandidateQuery] = useState("")
  const [candidateSourceMode, setCandidateSourceMode] = useState("all")
  const [functionalUnitId, setFunctionalUnitId] = useState("kg_mof")
  const [routeId, setRouteId] = useState("solvothermal")
  const [parameters, setParameters] = useState(() => ({
    yieldPct: 69,
    solventRecoveryPct: 80,
    conversionCostUsdPerKg: 10,
    ...lcaModelFallback.serviceDefaults,
    gridGwpKgCo2ePerKwh: 0.5306,
    heatGwpKgCo2ePerKwh: 0.22,
    electricityPriceUsdPerKwh: 0.1,
  }))

  useEffect(() => {
    let active = true
    Promise.all([
      fetchDataJson("lca_inventory.json", lcaInventoryFallback),
      fetchDataJson("metal_precursor_cost_table.json", metalCostFallback),
      fetchDataJson("ecoscreen_lca_model_v1.json", lcaModelFallback),
      fetchDataJson("ecoscreen_candidate_process_evidence_v1.json", null),
      fetchDataJson("ecoscreen_regional_baselines_v1.json", regionalBaselinesFallback),
      fetchDataJson("ecoscreen_evidence_source_registry_v1.json", evidenceSourceRegistryFallback),
    ]).then(([inventory, costs, nextModel, evidence, baselines, registry]) => {
      if (!active) return
      setInventoryRows(Array.isArray(inventory) && inventory.length ? inventory : lcaInventoryFallback)
      setMetalCostRows(Array.isArray(costs?.records) && costs.records.length ? costs.records : metalCostFallback.records || [])
      setModel(nextModel?.routeScenarios?.length ? nextModel : lcaModelFallback)
      setProcessEvidence(evidence?.records?.length ? evidence : { records: [], summary: { emittedRecordCount: 0, fieldCoverage: {} } })
      setRegionalBaselines(baselines?.profiles?.length ? baselines : regionalBaselinesFallback)
      setEvidenceRegistry(registry?.sources?.length ? registry : evidenceSourceRegistryFallback)
    }).catch(() => {
      if (!active) return
      setInventoryRows(lcaInventoryFallback)
      setMetalCostRows(metalCostFallback.records || [])
      setModel(lcaModelFallback)
      setProcessEvidence({ records: [], summary: { emittedRecordCount: 0, fieldCoverage: {} } })
      setRegionalBaselines(regionalBaselinesFallback)
      setEvidenceRegistry(evidenceSourceRegistryFallback)
    })
    return () => { active = false }
  }, [])

  const candidates = useMemo(
    () => [...structureCandidates, ...(processEvidence.records || [])],
    [structureCandidates, processEvidence],
  )

  useEffect(() => {
    if (!candidateId && candidates.length) setCandidateId(candidates[0].id || candidates[0].candidateId)
  }, [candidateId, candidates])

  const selectedCandidate = useMemo(
    () => candidates.find(row => (row.id || row.candidateId) === candidateId) || candidates[0] || {},
    [candidateId, candidates],
  )
  const candidateOptions = useMemo(() => {
    const query = candidateQuery.trim().toLowerCase()
    const sourceFiltered = candidateSourceMode === "structure"
      ? structureCandidates
      : candidateSourceMode === "process"
        ? processEvidence.records || []
        : candidates
    const filtered = query
      ? sourceFiltered.filter(candidate => [
          candidateUiName(candidate),
          candidate.id,
          candidate.candidateId,
          candidate.rawName,
          candidate.sourceRecordId,
          candidate.metalNode,
          candidate.sourceDatabase,
        ].filter(Boolean).join(" ").toLowerCase().includes(query))
      : sourceFiltered
    const limited = filtered.slice(0, 100)
    const selectedKey = selectedCandidate.id || selectedCandidate.candidateId
    if (selectedKey && !limited.some(candidate => (candidate.id || candidate.candidateId) === selectedKey)) {
      return [selectedCandidate, ...limited.slice(0, 99)]
    }
    return limited
  }, [candidateQuery, candidateSourceMode, candidates, processEvidence, selectedCandidate, structureCandidates])
  const result = useMemo(() => buildEcoLcaScenario({
    candidate: selectedCandidate,
    inventoryRows,
    metalCostRows,
    model,
    routeId,
    functionalUnitId,
    parameters,
  }), [selectedCandidate, inventoryRows, metalCostRows, model, routeId, functionalUnitId, parameters])
  const routeResults = useMemo(() => compareEcoLcaRoutes({
    candidate: selectedCandidate,
    inventoryRows,
    metalCostRows,
    model,
    functionalUnitId,
    parameters,
  }), [selectedCandidate, inventoryRows, metalCostRows, model, functionalUnitId, parameters])
  const candidateCosts = useMemo(() => compareEcoLcaCandidateCosts({
    candidates,
    inventoryRows,
    metalCostRows,
    model,
    routeId,
    functionalUnitId: "kg_mof",
    parameters,
    limit: 8,
  }), [candidates, inventoryRows, metalCostRows, model, routeId, parameters])

  const currentFunctionalUnit = model.functionalUnits?.find(item => item.id === functionalUnitId) || model.functionalUnits?.[0]
  const currentRoute = model.routeScenarios?.find(item => item.id === routeId) || model.routeScenarios?.[0]
  const currentBaseline = regionalBaselines.profiles?.find(item => item.id === baselineId)
    || regionalBaselines.profiles?.[0]
    || { id: "global", currency: "USD", currencySymbol: "$", currencyPerUsd: 1 }
  const currentBaselineSource = regionalBaselines.sources?.find(source => currentBaseline.sourceIds?.includes(source.id))
  const currencyScale = Number(currentBaseline.currencyPerUsd || 1)
  const unitSuffix = functionalUnitId === "tonne_co2" ? tr(lang, "/t CO₂", "/t CO2") : tr(lang, "/kg MOF", "/kg MOF")
  const updateParameter = key => value => setParameters(current => ({ ...current, [key]: value }))
  const selectBaseline = baseline => {
    setBaselineId(baseline.id)
    const scale = Number(baseline.currencyPerUsd || 1)
    setParameters(current => ({
      ...current,
      gridGwpKgCo2ePerKwh: Number(baseline.gridGwpKgCo2ePerKwh),
      heatGwpKgCo2ePerKwh: Number(baseline.heatGwpKgCo2ePerKwh),
      electricityPriceUsdPerKwh: Number(baseline.electricityPricePerKwh) / scale,
      conversionCostUsdPerKg: Number(baseline.conversionCostPerKg) / scale,
    }))
  }
  const selectCandidateSource = mode => {
    setCandidateSourceMode(mode)
    const rows = mode === "structure"
      ? structureCandidates
      : mode === "process"
        ? processEvidence.records || []
        : candidates
    const first = rows[0]
    if (first) setCandidateId(first.id || first.candidateId)
  }
  const selectRoute = route => {
    setRouteId(route.id)
    setParameters(current => ({
      ...current,
      yieldPct: route.defaultYieldPct,
      solventRecoveryPct: route.defaultSolventRecoveryPct,
      conversionCostUsdPerKg: route.defaultConversionCostUsdPerKg,
    }))
  }
  const routeChartRows = routeResults.map(row => ({
    route: tr(lang, row.route.labelZh, row.route.labelEn),
    gwp: Number(row.gwp.toFixed(2)),
    cost: Number((row.totalCost * currencyScale).toFixed(2)),
    solvent: Number(row.solventKg.toFixed(2)),
  }))
  const contributionRows = result.contributions.map(row => ({
    name: flowLabel(row.flow, lang),
    gwp: Number(row.gwp.toFixed(3)),
    cost: Number((row.cost * currencyScale).toFixed(3)),
  }))
  const canRenderResponsiveChart = typeof ResizeObserver !== "undefined"

  return (
    <div id="candidate-scoring-lab" data-testid="ecoscreen-lca-workbench" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={tr(lang, "EcoScreen 生命周期与经济评价", "EcoScreen Life-cycle & Economic Evaluation")}
        subtitle={tr(
          lang,
          "以功能单位和系统边界为起点，用清单、影响、成本和不确定性评价 MOF；不再把通用描述符综合分当作生态结论。",
          "Evaluate MOFs from functional unit and system boundary through inventory, impacts, cost, and uncertainty; generic descriptor scores are no longer treated as environmental conclusions.",
        )}
        meta={tr(lang, "LCA 目标与范围 · LCI 情景 · GWP/能耗 · 生产成本 · 数据门控", "LCA goal & scope · scenario LCI · GWP/energy · production cost · data gate")}
        action={
          <>
            <BasisBadge tone="proxy">{tr(lang, "筛选级情景模型", "Screening scenario model")}</BasisBadge>
            <CopyLinkButton hash="ecoscreen" ariaLabel={tr(lang, "复制 EcoScreen 链接", "Copy EcoScreen link")} />
          </>
        }
      />

      <WorkbenchNav t={t} lang={lang} />

      <div data-testid="ecoscreen-lca-status" style={{ alignItems: "center", color: t.subtle, display: "flex", flexWrap: "wrap", fontSize: 12, gap: 8, lineHeight: 1.55 }}>
        <strong style={{ color: t.textStrong }}>{tr(lang, "当前结论等级", "Current conclusion level")}</strong>
        <BasisBadge tone={result.readiness.comparable ? "calc" : "proxy"}>
          {result.readiness.comparable ? tr(lang, "候选可比较", "Candidate-comparable") : tr(lang, "情景估算", "Scenario estimate")}
        </BasisBadge>
        <span>·</span>
        <span>{tr(lang, `结构 ${structureCandidates.length} · 合成证据 ${number(processEvidence.summary?.emittedRecordCount, 0)}`, `${structureCandidates.length} structures · ${number(processEvidence.summary?.emittedRecordCount, 0)} synthesis records`)}</span>
        <span>·</span>
        <span>{tr(lang, `候选级 LCI 准备度 ${Math.round(result.readiness.score * 100)}%`, `Candidate-level LCI readiness ${Math.round(result.readiness.score * 100)}%`)}</span>
        <span>·</span>
        <BasisBadge tone="info">{tr(lang, currentBaseline.labelZh, currentBaseline.labelEn)}</BasisBadge>
      </div>

      <Callout tone="warn">
        {tr(lang, model.boundaryZh, model.boundaryEn)}
      </Callout>

      <Card id="ecoscreen-goal-scope" t={t} style={{ display: "grid", gap: 13, scrollMarginTop: 168 }} data-testid="ecoscreen-goal-scope">
        <SectionHead
          t={t}
          title={tr(lang, "01 · 目标与范围", "01 · Goal and scope")}
          subtitle={tr(lang, model.goalZh, model.goalEn)}
          action={<BasisBadge tone="info">ISO 14040 / 14044</BasisBadge>}
        />
        <div style={{ background: t.sectionTint || t.surface, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 11, display: "grid", gap: 10, padding: 11 }}>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "space-between" }}>
            <div>
              <strong style={{ color: t.textStrong, display: "block", fontSize: 12.5 }}>{tr(lang, "区域与经济基准", "Regional and economic baseline")}</strong>
              <span style={{ color: t.muted, display: "block", fontSize: 10.6, lineHeight: 1.45, marginTop: 3 }}>
                {tr(lang, "一键切换电网因子、币种和公用工程情景；所有参数仍可继续编辑。", "Switch grid factor, currency, and utility scenarios together; every parameter remains editable.")}
              </span>
            </div>
            <ChoiceButtons
              t={t}
              lang={lang}
              items={regionalBaselines.profiles || []}
              value={baselineId}
              onChange={selectBaseline}
            />
          </div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
            {[
              [tr(lang, "电网因子", "Grid factor"), `${number(currentBaseline.gridGwpKgCo2ePerKwh, 4)} kg CO₂/kWh`],
              [tr(lang, "参考年份", "Reference year"), currentBaseline.referenceYear],
              [tr(lang, "成本币种", "Cost currency"), currentBaseline.currency],
              [tr(lang, "工业电价情景", "Industrial electricity scenario"), `${currentBaseline.currencySymbol}${number(currentBaseline.electricityPricePerKwh)} /kWh`],
            ].map(([label, value]) => (
              <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 9 }}>
                <span style={{ color: t.faint, display: "block", fontSize: 9.6, fontWeight: 850 }}>{label}</span>
                <strong style={{ color: t.textStrong, display: "block", fontSize: 12.3, marginTop: 4 }}>{value}</strong>
              </div>
            ))}
          </div>
          <div style={{ color: t.muted, fontSize: 10.5, lineHeight: 1.5 }}>
            {tr(lang, currentBaseline.noteZh, currentBaseline.noteEn)}
            {currentBaselineSource ? (
              <> · <a href={currentBaselineSource.url} target="_blank" rel="noreferrer" style={{ color: t.accentText, textDecoration: "none" }}>{tr(lang, "查看因子来源", "Open factor source")}</a></>
            ) : null}
          </div>
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.1fr) minmax(0, 0.9fr)" }}>
          <div style={{ display: "grid", gap: 8 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{tr(lang, "功能单位", "Functional unit")}</span>
            <ChoiceButtons
              t={t}
              lang={lang}
              items={model.functionalUnits || []}
              value={functionalUnitId}
              onChange={item => setFunctionalUnitId(item.id)}
            />
          </div>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 11 }}>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{tr(lang, currentFunctionalUnit?.labelZh, currentFunctionalUnit?.labelEn)}</div>
            <div style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.6, marginTop: 5 }}>{tr(lang, currentFunctionalUnit?.boundaryZh, currentFunctionalUnit?.boundaryEn)}</div>
          </div>
        </div>
      </Card>

      <Card id="ecoscreen-scenario-controls" t={t} style={{ display: "grid", gap: 14, scrollMarginTop: 168 }} data-testid="ecoscreen-scenario-controls">
        <SectionHead
          t={t}
          title={tr(lang, "02 · 候选与工艺情景", "02 · Candidate and process scenario")}
          subtitle={tr(
            lang,
            "选择候选、合成路线并编辑关键假设。路线倍数用于敏感性比较，不会被标记成候选的真实合成记录。",
            "Select a candidate and route, then edit key assumptions. Route multipliers support sensitivity comparison and are never labeled as the candidate's measured process.",
          )}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {[
            ["all", tr(lang, `全部 ${candidates.length}`, `All ${candidates.length}`)],
            ["structure", tr(lang, `结构库 ${structureCandidates.length}`, `Structures ${structureCandidates.length}`)],
            ["process", tr(lang, `合成证据库 ${processEvidence.records?.length || 0}`, `Synthesis evidence ${processEvidence.records?.length || 0}`)],
          ].map(([id, label]) => {
            const active = candidateSourceMode === id
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => selectCandidateSource(id)}
                style={{
                  ...toolbarBtn(t),
                  background: active ? t.accentText : t.surface,
                  borderColor: active ? t.accent : t.border,
                  color: active ? "#fff" : t.muted,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: t.faint, fontSize: 10.8, fontWeight: 850 }}>{tr(lang, "检索 MOF 候选", "Search MOF candidates")}</span>
          <input
            type="search"
            value={candidateQuery}
            onChange={event => setCandidateQuery(event.target.value)}
            placeholder={tr(lang, "输入名称、记录 ID、金属或来源…", "Name, record ID, metal, or source…")}
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, fontSize: 12, maxWidth: "100%", padding: "8px 10px" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: t.faint, fontSize: 10.8, fontWeight: 850 }}>
            {tr(lang, `MOF 候选 · 显示 ${candidateOptions.length}/${candidateSourceMode === "structure" ? structureCandidates.length : candidateSourceMode === "process" ? processEvidence.records?.length || 0 : candidates.length}`, `MOF candidate · showing ${candidateOptions.length}/${candidateSourceMode === "structure" ? structureCandidates.length : candidateSourceMode === "process" ? processEvidence.records?.length || 0 : candidates.length}`)}
          </span>
          <select
            data-testid="ecoscreen-candidate-select"
            value={selectedCandidate.id || selectedCandidate.candidateId || ""}
            onChange={event => setCandidateId(event.target.value)}
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, fontSize: 12, maxWidth: "100%", padding: "8px 10px" }}
          >
            {candidateOptions.map(candidate => (
              <option key={candidate.id || candidate.candidateId} value={candidate.id || candidate.candidateId}>
                {candidateUiName(candidate)} · {candidate.metalNode || "metal pending"} · {candidate.sourceDatabase || "source pending"}
              </option>
            ))}
          </select>
          {status !== "loaded" ? <span style={{ color: t.faint, fontSize: 10.5 }}>{tr(lang, "候选数据正在加载或为空。", "Candidate data is loading or empty.")}</span> : null}
        </label>
        <div style={{ display: "grid", gap: 7 }}>
          <span style={{ color: t.faint, fontSize: 10.8, fontWeight: 850 }}>{tr(lang, "合成路线情景", "Synthesis-route scenario")}</span>
          <ChoiceButtons t={t} lang={lang} items={model.routeScenarios || []} value={routeId} onChange={selectRoute} />
          <span style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.55 }}>{tr(lang, currentRoute?.assumptionZh, currentRoute?.assumptionEn)}</span>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))" }}>
          <NumberField t={t} label={tr(lang, "产率", "Yield")} value={parameters.yieldPct} min={1} max={100} step={1} suffix="%" onChange={updateParameter("yieldPct")} />
          <NumberField t={t} label={tr(lang, "溶剂回收率", "Solvent recovery")} value={parameters.solventRecoveryPct} min={0} max={99.9} step={1} suffix="%" onChange={updateParameter("solventRecoveryPct")} />
          <NumberField t={t} label={tr(lang, "电网排放因子", "Grid GHG factor")} value={parameters.gridGwpKgCo2ePerKwh} min={0} max={2} step={0.01} suffix="kg CO₂e/kWh" onChange={updateParameter("gridGwpKgCo2ePerKwh")} />
          <NumberField t={t} label={tr(lang, "电价", "Electricity price")} value={Number((parameters.electricityPriceUsdPerKwh * currencyScale).toFixed(4))} min={0} max={20} step={0.01} suffix={`${currentBaseline.currency}/kWh`} onChange={value => updateParameter("electricityPriceUsdPerKwh")(value / currencyScale)} />
          <NumberField t={t} label={tr(lang, "转化费用代理", "Conversion-cost proxy")} value={Number((parameters.conversionCostUsdPerKg * currencyScale).toFixed(2))} min={0} max={2000} step={1} suffix={`${currentBaseline.currency}/kg`} onChange={value => updateParameter("conversionCostUsdPerKg")(value / currencyScale)} />
        </div>
        {functionalUnitId === "tonne_co2" ? (
          <div data-testid="ecoscreen-service-parameters" style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 10, display: "grid", gap: 9, padding: 11 }}>
            <strong style={{ color: t.accentText, fontSize: 12 }}>{tr(lang, "捕集服务参数", "Capture-service parameters")}</strong>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
              <NumberField t={t} label={tr(lang, "工作容量", "Working capacity")} value={parameters.workingCapacityKgCo2PerKgMofCycle} min={0.001} max={1} step={0.01} suffix="kg CO₂/kg/cycle" onChange={updateParameter("workingCapacityKgCo2PerKgMofCycle")} />
              <NumberField t={t} label={tr(lang, "循环次数", "Cycle count")} value={parameters.cycleCount} min={1} max={100000} step={100} suffix="cycles" onChange={updateParameter("cycleCount")} />
              <NumberField t={t} label={tr(lang, "容量利用率", "Capacity utilization")} value={parameters.capacityUtilizationPct} min={1} max={100} step={1} suffix="%" onChange={updateParameter("capacityUtilizationPct")} />
              <NumberField t={t} label={tr(lang, "再生电耗", "Regeneration electricity")} value={parameters.regenerationKwhPerKgCo2} min={0} max={5} step={0.01} suffix="kWh/kg CO₂" onChange={updateParameter("regenerationKwhPerKgCo2")} />
            </div>
            <span style={{ color: t.muted, fontSize: 10.8, lineHeight: 1.5 }}>{tr(lang, model.serviceDefaults?.noteZh, model.serviceDefaults?.noteEn)}</span>
          </div>
        ) : null}
      </Card>

      <CandidateEvidencePanel
        t={t}
        lang={lang}
        dataset={processEvidence}
        registry={evidenceRegistry}
        candidate={selectedCandidate}
        isNarrow={isNarrow}
      />

      <Card id="ecoscreen-lca-results" t={t} style={{ display: "grid", gap: 13, scrollMarginTop: 168 }} data-testid="ecoscreen-lca-results">
        <SectionHead
          t={t}
          title={tr(lang, "03 · 环境与经济结果", "03 · Environmental and economic results")}
          subtitle={tr(
            lang,
            "区间同时传播清单、表征因子和价格不确定性；环境结果与成本结果分开，不用价格替代环境影响。",
            "Intervals propagate inventory, characterization-factor, and price uncertainty; environmental and cost results stay separate, and price is never used as an environmental factor.",
          )}
          action={<BasisBadge tone={result.readiness.comparable ? "calc" : "proxy"}>{tr(lang, `准备度 ${result.readiness.grade}`, `Readiness ${result.readiness.grade}`)}</BasisBadge>}
        />
        <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(6, minmax(0, 1fr))" }}>
          <Metric t={t} label={tr(lang, "GWP 情景值", "Scenario GWP")} value={`${number(result.gwp)} kg CO₂e`} note={`${number(result.gwpLow)}–${number(result.gwpHigh)} ${unitSuffix}`} tone={result.readiness.comparable ? "good" : "warn"} />
          <Metric t={t} label={tr(lang, "累计能耗", "Cumulative energy")} value={`${number(result.energyMj, 1)} MJ`} note={unitSuffix} />
          <Metric t={t} label={tr(lang, "溶剂损失", "Solvent loss")} value={`${number(result.solventKg)} kg`} note={unitSuffix} />
          <Metric t={t} label={tr(lang, "洗涤水", "Washing water")} value={`${number(result.waterL, 1)} L`} note={unitSuffix} />
          <Metric t={t} label={tr(lang, "生产/服务成本", "Production / service cost")} value={money(result.totalCost, currentBaseline)} note={`${money(result.costLow, currentBaseline)}–${money(result.costHigh, currentBaseline)} ${unitSuffix} · ${currentBaseline.currency}`} tone="cost" />
          <Metric t={t} label={tr(lang, "候选级 LCI", "Candidate-level LCI")} value={`${Math.round(result.readiness.score * 100)}%`} note={result.readiness.comparable ? tr(lang, "达到比较门槛", "comparison gate passed") : tr(lang, "只允许情景解释", "scenario interpretation only")} tone={result.readiness.comparable ? "good" : "warn"} />
        </div>
        {functionalUnitId === "tonne_co2" ? (
          <div style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.55 }}>
            {tr(
              lang,
              `每吨 CO₂ 情景需要 ${number(result.materialRequiredKg, 3)} kg MOF，并计入 ${number(result.regenerationElectricityKwh, 1)} kWh 再生电力。`,
              `The scenario uses ${number(result.materialRequiredKg, 3)} kg MOF and ${number(result.regenerationElectricityKwh, 1)} kWh regeneration electricity per tonne CO2.`,
            )}
          </div>
        ) : null}
      </Card>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <Card id="ecoscreen-hotspots" t={t} style={{ display: "grid", gap: 10, scrollMarginTop: 168 }} data-testid="ecoscreen-hotspots">
          <SectionHead
            t={t}
            title={tr(lang, "04 · 生命周期热点", "04 · Life-cycle hotspots")}
            subtitle={tr(lang, "同一清单内的 GWP 与成本贡献，不是跨研究归一化总分。", "GWP and cost contributions within the same inventory, not a normalized score across studies.")}
          />
          {canRenderResponsiveChart ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={contributionRows} layout="vertical" margin={{ top: 8, right: 16, left: isMobile ? 54 : 92, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.border} horizontal={false} />
                <XAxis type="number" tick={{ fill: t.faint, fontSize: 9 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: t.muted, fontSize: 10 }} width={isMobile ? 72 : 108} />
                <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
                <Legend wrapperStyle={{ color: t.muted, fontSize: 10 }} />
                <Bar dataKey="gwp" name={tr(lang, "kg CO₂e", "kg CO2e")} fill={t.lcaAccent || t.accent} radius={[0, 4, 4, 0]} />
                <Bar dataKey="cost" name={currentBaseline.currency} fill={t.lccAccent || t.amber} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div data-testid="ecoscreen-hotspot-chart-fallback" style={{ display: "grid", gap: 6 }}>
              {contributionRows.map(row => (
                <div key={row.name} style={{ color: t.muted, display: "flex", fontSize: 10.8, gap: 8, justifyContent: "space-between" }}>
                  <span>{row.name}</span>
                  <span>{row.gwp} kg CO₂e · {currentBaseline.currencySymbol}{row.cost}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 11.2, lineHeight: 1.55, padding: 9 }}>
            <strong style={{ color: t.textStrong }}>{tr(lang, "当前环境热点", "Current environmental hotspot")}: </strong>
            {flowLabel(result.hotspots[0]?.flow, lang)} · {number(result.hotspots[0]?.gwp)} kg CO₂e
            <br />
            <strong style={{ color: t.textStrong }}>{tr(lang, "当前成本热点", "Current cost hotspot")}: </strong>
            {flowLabel(result.costHotspots[0]?.flow, lang)} · {money(result.costHotspots[0]?.cost, currentBaseline)}
          </div>
        </Card>

        <Card id="ecoscreen-route-comparison" t={t} style={{ display: "grid", gap: 10, scrollMarginTop: 168 }} data-testid="ecoscreen-route-comparison">
          <SectionHead
            t={t}
            title={tr(lang, "05 · 合成路线敏感性", "05 · Synthesis-route sensitivity")}
            subtitle={tr(lang, "按各路线默认产率、回收率和情景倍数重算；用于识别改进杠杆，不宣称所有路线都适用于当前 MOF。", "Recalculated with route-specific default yields, recoveries, and scenario multipliers to identify levers, not to claim every route is feasible for this MOF.")}
          />
          {canRenderResponsiveChart ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={routeChartRows} margin={{ top: 8, right: 16, left: 0, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                <XAxis dataKey="route" tick={{ fill: t.muted, fontSize: 9 }} angle={-12} textAnchor="end" interval={0} />
                <YAxis yAxisId="gwp" tick={{ fill: t.faint, fontSize: 9 }} />
                <YAxis yAxisId="cost" orientation="right" tick={{ fill: t.faint, fontSize: 9 }} />
                <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
                <Legend wrapperStyle={{ color: t.muted, fontSize: 10 }} />
                <Bar yAxisId="gwp" dataKey="gwp" name={tr(lang, "GWP 情景值", "Scenario GWP")} fill={t.lcaAccent || t.accent} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="cost" dataKey="cost" name={tr(lang, "成本", "Cost")} fill={t.lccAccent || t.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div data-testid="ecoscreen-route-chart-fallback" style={{ color: t.muted, fontSize: 10.8, lineHeight: 1.6 }}>
              {routeChartRows.map(row => <div key={row.route}>{row.route}: {row.gwp} kg CO₂e · {currentBaseline.currencySymbol}{row.cost}</div>)}
            </div>
          )}
          <div style={{ display: "grid", gap: 6 }}>
            {routeResults.map(row => (
              <div key={row.route.id} style={{ alignItems: "baseline", background: row.route.id === routeId ? t.badgeInfoBg : t.surface, border: `1px solid ${row.route.id === routeId ? t.accent : t.border}`, borderRadius: 8, display: "grid", gap: 8, gridTemplateColumns: "minmax(0, 1fr) auto auto", padding: 8 }}>
                <strong style={{ color: row.route.id === routeId ? t.accentText : t.textStrong, fontSize: 11.5 }}>{tr(lang, row.route.labelZh, row.route.labelEn)}</strong>
                <span style={{ color: t.muted, fontSize: 10.8 }}>{number(row.gwp)} kg CO₂e</span>
                <span style={{ color: t.muted, fontSize: 10.8 }}>{money(row.totalCost, currentBaseline)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card id="ecoscreen-economic-analysis" t={t} style={{ display: "grid", gap: 11, scrollMarginTop: 168 }} data-testid="ecoscreen-economic-analysis">
        <SectionHead
          t={t}
          title={tr(lang, "06 · 经济分析", "06 · Economic analysis")}
          subtitle={tr(
            lang,
            "生产成本 = 材料与公用工程变动成本 + 路线转化费用代理 + 10% 或有项。每种金属仅显示一个代表候选，避免把同一价格代理重复伪装成多条证据；金属价格只进入经济模型。",
            "Production cost = material and utility variable cost + route conversion-cost proxy + 10% contingency. One representative candidate is shown per metal to avoid presenting the same price proxy as repeated evidence; metal price enters the economic model only.",
          )}
          action={<BasisBadge tone="proxy">{tr(lang, "不是完整 TEA", "Not a full TEA")}</BasisBadge>}
        />
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 760, width: "100%" }}>
            <thead>
              <tr style={{ background: t.surface }}>
                {[
                  tr(lang, "候选", "Candidate"),
                  tr(lang, "金属", "Metal"),
                  tr(lang, "金属价格依据", "Metal-price basis"),
                  tr(lang, "情景成本", "Scenario cost"),
                  tr(lang, "价格置信度", "Price confidence"),
                  tr(lang, "解释边界", "Interpretation boundary"),
                ].map(label => (
                  <th key={label} style={{ borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 10.5, padding: "8px 9px", textAlign: "left" }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidateCosts.map(row => (
                <tr key={row.candidateId} style={{ borderBottom: `1px solid ${t.divider}` }}>
                  <td style={{ color: t.textStrong, fontSize: 11.5, fontWeight: 800, maxWidth: 260, overflowWrap: "anywhere", padding: "9px" }}>{row.candidateName}</td>
                  <td style={{ color: t.muted, fontSize: 11.5, padding: "9px" }}>{row.metal}</td>
                  <td style={{ color: t.muted, fontSize: 10.6, lineHeight: 1.45, maxWidth: 300, padding: "9px" }}>
                    <div>{row.metalPrice?.precursor || tr(lang, "通用代理价", "generic proxy price")}</div>
                    <div style={{ color: t.faint, fontSize: 9.8, marginTop: 3 }}>
                      {row.metalPrice
                        ? `${row.metalPrice.source || tr(lang, "来源待补", "source pending")} · ${row.metalPrice.priceDate || tr(lang, "日期待补", "date pending")}`
                        : tr(lang, "未匹配专属价格源", "No dedicated price source matched")}
                    </div>
                  </td>
                  <td style={{ color: t.lccAccent || t.accentText, fontSize: 12, fontWeight: 900, padding: "9px" }}>{money(row.totalCost, currentBaseline)} /kg</td>
                  <td style={{ color: row.metalPrice?.confidence === "high" ? t.success : t.warn, fontSize: 10.8, fontWeight: 850, padding: "9px" }}>{row.metalPrice?.confidence || "proxy"}</td>
                  <td style={{ color: t.faint, fontSize: 10.5, padding: "9px" }}>{tr(lang, "共同路线情景，仅比较成本", "Common route scenario; cost comparison only")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ color: t.warn, fontSize: 11.2, lineHeight: 1.55 }}>
          {tr(lang, model.economicModel?.scopeZh, model.economicModel?.scopeEn)}
        </div>
      </Card>

      <Card id="ecoscreen-method-readiness" t={t} style={{ display: "grid", gap: 12, scrollMarginTop: 168 }} data-testid="ecoscreen-method-readiness">
        <SectionHead
          t={t}
          title={tr(lang, "07 · 算法、准备度与补数任务", "07 · Algorithm, readiness, and data tasks")}
          subtitle={tr(lang, "算法先门控数据，再计算单位化清单与区间；不对低准备度候选生成环境优胜者。", "The algorithm gates data first, then computes unit-normalized inventories and intervals; it does not name an environmental winner for low-readiness candidates.")}
        />
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.1fr) minmax(300px, 0.9fr)" }}>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              [tr(lang, "① 目标与范围", "① Goal and scope"), tr(lang, "选择功能单位、边界和应用情景。", "Select functional unit, boundary, and application scenario.")],
              [tr(lang, "② 清单单位化", "② Inventory normalization"), tr(lang, "qᵢ = 基准清单 × 路线倍数 × (100/产率)；溶剂再乘回收损失比。", "qᵢ = baseline inventory × route multiplier × (100/yield); solvent also scales by unrecovered fraction.")],
              [tr(lang, "③ 环境表征", "③ Environmental characterization"), tr(lang, "GWP = Σ(qᵢ × CFᵢ)，并传播清单与因子不确定性。", "GWP = Σ(qᵢ × CFᵢ), propagating inventory and factor uncertainty.")],
              [tr(lang, "④ 经济核算", "④ Economic calculation"), tr(lang, "Cost = (Σqᵢpᵢ + 转化费用) × (1 + 或有项)。", "Cost = (Σqᵢpᵢ + conversion allowance) × (1 + contingency).")],
              [tr(lang, "⑤ 服务分摊", "⑤ Service allocation"), tr(lang, "每吨 CO₂ 材料量 = 1000 / (工作容量 × 循环 × 利用率)，再加再生电力。", "Material per tonne CO2 = 1000 / (working capacity × cycles × utilization), plus regeneration electricity.")],
              [tr(lang, "⑥ 数据门控", "⑥ Data gate"), tr(lang, "准备度需达到 75%，且产率、质量平衡、实测能耗、溶剂回收及服务期性能等硬门控齐全；否则只允许情景估算。", "Readiness must reach 75% with yield, mass balance, measured energy, solvent recovery, and service-performance hard gates present; otherwise only scenario estimates are allowed.")],
            ].map(([title, body]) => (
              <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 9 }}>
                <strong style={{ color: t.textStrong, fontSize: 11.6 }}>{title}</strong>
                <div style={{ color: t.muted, fontSize: 11.1, lineHeight: 1.55, marginTop: 4 }}>{body}</div>
              </div>
            ))}
          </div>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
            <div style={{ alignItems: "baseline", display: "flex", gap: 10, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{tr(lang, "候选级数据门控", "Candidate data gate")}</strong>
              <span style={{ color: result.readiness.comparable ? t.success : t.warn, fontSize: 12, fontWeight: 900 }}>{result.readiness.availableCount}/{result.readiness.requiredCount}</span>
            </div>
            {result.readiness.fields.map(row => (
              <div key={row.field} style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
                <span style={{ color: t.muted, fontSize: 11.2 }}>{readinessFieldLabel(row.field, lang)}</span>
                <span style={{ color: row.available ? t.success : t.warn, fontSize: 10.8, fontWeight: 900 }}>
                  {row.available ? tr(lang, "已接入", "available") : tr(lang, "缺失", "missing")}
                </span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${t.border}`, color: t.muted, fontSize: 11, lineHeight: 1.55, marginTop: 3, paddingTop: 8 }}>
              <strong style={{ color: t.textStrong }}>{tr(lang, "下一步优先补充", "Priority data tasks")}: </strong>
              {result.readiness.missingFields.map(field => readinessFieldLabel(field, lang)).join("、") || tr(lang, "当前门控字段齐全", "all gate fields available")}
            </div>
            {result.readiness.missingHardBlockers?.length ? (
              <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.warn, fontSize: 10.6, lineHeight: 1.5, padding: 8 }}>
                <strong>{tr(lang, "比较性 LCA 硬阻断", "Comparative-LCA hard blockers")}: </strong>
                {result.readiness.missingHardBlockers.map(field => readinessFieldLabel(field, lang)).join("、")}
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <Card id="ecoscreen-literature-basis" t={t} style={{ display: "grid", gap: 11, scrollMarginTop: 168 }} data-testid="ecoscreen-literature-basis">
        <SectionHead
          t={t}
          title={tr(lang, "08 · 文献与标准依据", "08 · Literature and standards")}
          subtitle={tr(lang, "每条来源只支持其对应的方法选择；不把不同 MOF、不同路线的数值直接移植为候选实测值。", "Each source supports only its stated method choice; values from different MOFs and routes are not transplanted as candidate measurements.")}
          action={
            <button type="button" onClick={() => onNavigate?.("methodology-literature-inspiration-ecoscreen-sustainability")} style={{ ...toolbarBtn(t), color: t.accentText }}>
              {tr(lang, "打开方法与证据", "Open methods & evidence")}
            </button>
          }
        />
        <div style={{ display: "grid", gap: 9, gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          {(model.sources || []).map(source => (
            <article key={source.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 10 }}>
              <a href={source.url} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 11.8, fontWeight: 850, lineHeight: 1.45, textDecoration: "none" }}>{source.title}</a>
              <span style={{ color: t.faint, fontSize: 10.5 }}>{source.year}{source.doi ? ` · DOI ${source.doi}` : ""}</span>
              <span style={{ color: t.muted, fontSize: 11.1, lineHeight: 1.5 }}>{tr(lang, source.roleZh, source.roleEn)}</span>
            </article>
          ))}
        </div>
      </Card>
    </div>
  )
}
