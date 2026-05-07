import { useEffect, useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  FONT_MONO,
  BasisBadge, Callout, CopyLinkButton, DisclaimerLink, PageHeader, SectionTitle,
  getGasSeparationRecords,
} from "../../shared"

const CONDITION_KEYS = ["gasPair", "gasRatio", "temperature", "pressure", "method", "source"]

function pendingText(zh) {
  return zh ? "待补充" : "Pending"
}

function sourceText(status, zh) {
  return status === "pending" ? (zh ? "来源待补充" : "Source pending") : (status || pendingText(zh))
}

function conditionLabels(zh) {
  return {
    gasPair: zh ? "气体体系" : "gas pair",
    gasRatio: zh ? "气体比例" : "gas ratio",
    temperature: zh ? "温度" : "temperature",
    pressure: zh ? "压力" : "pressure",
    method: zh ? "方法" : "method",
    source: zh ? "来源" : "source",
  }
}

function conditionSummary(record) {
  const completeness = record?.conditionCompleteness || {}
  const present = CONDITION_KEYS.filter(key => completeness[key] === true)
  const missing = CONDITION_KEYS.filter(key => completeness[key] !== true)
  return { count: present.length, total: CONDITION_KEYS.length, missing }
}

function statusLabel(status, zh) {
  const labels = {
    "uptake-only": zh ? "仅有吸附量数值" : "Only adsorption values are available.",
    "single-component": zh ? "单组分等温线可用" : "Single-component isotherm available.",
    "multi-gas-planned": zh ? "多气体叠加等温线规划中" : "Multi-gas overlay planned.",
    pending: zh ? "等温线数据待补充" : "Isotherm data pending.",
  }
  return labels[status] || labels.pending
}

const GAS_PAIR_OPTIONS = ["CO2/N2", "CO2/CH4", "C2H2/CO2", "C2H2/C2H4", "Xe/Kr", "H2/CO2"]
const TEMPERATURE_OPTIONS = [273, 298, 313]
const PRESSURE_OPTIONS = [
  { value: "1bar", label: "1 bar", kPa: 100 },
  { value: "5bar", label: "5 bar", kPa: 500 },
]
const METHOD_OPTIONS = ["IAST", "GCMC", "Breakthrough", "Experimental", "Pending"]
const DATA_STATUS_OPTIONS = ["curated", "pending", "source-pending", "schema-only"]

function normalizeGasPair(value = "") {
  return String(value)
    .replace(/CO₂/g, "CO2")
    .replace(/CH₄/g, "CH4")
    .replace(/C₂H₂/g, "C2H2")
    .replace(/C₂H₄/g, "C2H4")
    .replace(/C₂H₆/g, "C2H6")
    .replace(/H₂/g, "H2")
    .replace(/\s+/g, "")
    .toUpperCase()
}

function displayGasPair(value = "") {
  return String(value)
    .replace(/CO2/g, "CO₂")
    .replace(/CH4/g, "CH₄")
    .replace(/C2H2/g, "C₂H₂")
    .replace(/C2H4/g, "C₂H₄")
    .replace(/C2H6/g, "C₂H₆")
    .replace(/H2/g, "H₂")
}

function methodMatches(recordMethod, selectedMethod) {
  if (!selectedMethod || selectedMethod === "all") return true
  const method = String(recordMethod || "").toLowerCase()
  if (selectedMethod === "Pending") return method.includes("pending") || method === ""
  return method.includes(selectedMethod.toLowerCase())
}

function pressureMatches(record, selectedPressure) {
  if (!selectedPressure || selectedPressure === "all") return true
  const option = PRESSURE_OPTIONS.find(item => item.value === selectedPressure)
  if (!option || record.pressureKPa == null) return false
  return Math.abs(Number(record.pressureKPa) - option.kPa) <= 5
}

function isSchemaOnlyRecord(record) {
  return /template/i.test(String(record?.recordId || "")) || /template/i.test(String(record?.mofName || "")) || record?.sourceStatus === "schema-only" || record?.curationStatus === "schema-only"
}

function dataStatusMatches(record, selectedStatus) {
  if (!selectedStatus || selectedStatus === "all") return true
  const source = String(record?.sourceStatus || "").toLowerCase()
  const curation = String(record?.curationStatus || "").toLowerCase()
  const evidence = String(record?.evidenceLevel || "").toLowerCase()
  if (selectedStatus === "curated") return curation === "curated" || source === "curated"
  if (selectedStatus === "pending") return curation.includes("planned") || curation.includes("pending") || evidence.includes("pending")
  if (selectedStatus === "source-pending") return source.includes("pending") || !source
  if (selectedStatus === "schema-only") return isSchemaOnlyRecord(record)
  return true
}

function metricStatuses(record, zh) {
  const rows = Array.isArray(record?.adsorption) ? record.adsorption : []
  const hasUptake = rows.some(item => item?.uptake != null)
  const statuses = []
  if (isSchemaOnlyRecord(record)) statuses.push(zh ? "仅字段结构" : "schema-only")
  if (hasUptake) statuses.push(zh ? "吸附量可用" : "uptake available")
  if (record?.selectivity == null) statuses.push(zh ? "选择性待补充" : "selectivity pending")
  if (record?.isothermStatus === "pending") statuses.push(zh ? "等温线待补充" : "isotherm pending")
  return statuses.length ? statuses : [zh ? "指标待补充" : "metrics pending"]
}

function sourceStatusInfo(record, zh) {
  if (record?.sourceStatus === "pending" || !record?.sourceStatus) return { label: zh ? "来源待补充" : "Source pending", tone: "warn" }
  if (isSchemaOnlyRecord(record)) return { label: zh ? "仅字段结构" : "Schema-only", tone: "proxy" }
  return { label: sourceText(record.sourceStatus, zh), tone: "calc" }
}

function conditionMatchInfo(record, filters, zh) {
  const completeness = record?.conditionCompleteness || {}
  const selectedKeys = [
    filters.gasPair !== "all" ? "gasPair" : null,
    filters.temperature !== "all" ? "temperature" : null,
    filters.pressure !== "all" ? "pressure" : null,
    filters.method !== "all" ? "method" : null,
  ].filter(Boolean)
  const missingSelected = selectedKeys.filter(key => completeness[key] !== true)
  const corePresent = ["gasPair", "temperature", "pressure", "method"].filter(key => completeness[key] === true).length
  if (corePresent === 0) return { id: "not-comparable", label: zh ? "暂不可比" : "Not comparable", tone: "proxy" }
  if (missingSelected.length) return { id: "context-missing", label: zh ? "条件缺失" : "Context missing", tone: "warn" }
  if (selectedKeys.length >= 2 && record?.sourceStatus !== "pending" && !isSchemaOnlyRecord(record)) {
    return { id: "exact", label: zh ? "条件匹配" : "Exact context match", tone: "calc" }
  }
  if (selectedKeys.length > 0 || corePresent >= 2) return { id: "partial", label: zh ? "条件部分匹配" : "Partial context", tone: "info" }
  return { id: "context-missing", label: zh ? "条件缺失" : "Context missing", tone: "warn" }
}

function CompactCell({ children, strong = false, t }) {
  return (
    <td style={{
      padding: "9px 8px",
      borderBottom: `1px solid ${t.divider}`,
      color: strong ? t.textStrong : t.muted,
      fontSize: 11,
      lineHeight: 1.45,
      verticalAlign: "top",
      fontWeight: strong ? 850 : 600,
    }}>
      {children}
    </td>
  )
}

function FilterSelect({ label, value, onChange, options, t }) {
  return (
    <label style={{ display: "grid", gap: 5, minWidth: 0 }}>
      <span style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%",
          minHeight: 36,
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 7,
          color: t.text,
          fontSize: 12,
          padding: "8px 10px",
          outline: "none",
        }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function ActionButton({ children, onClick, disabled, title, t }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 6,
        color: disabled ? t.faint : t.accentText,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 10,
        fontWeight: 800,
        padding: "5px 7px",
        opacity: disabled ? 0.58 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  )
}

export function GasSepTab({ onNavigate, onOpenComparisonBuilder }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const zh = lang === "zh"
  const [records, setRecords] = useState([])
  const [status, setStatus] = useState("loading")
  const [filters, setFilters] = useState({
    gasPair: "all",
    customGasPair: "",
    temperature: "all",
    customTemperature: "",
    pressure: "all",
    customPressure: "",
    method: "all",
    dataStatus: "all",
  })

  useEffect(() => {
    let active = true
    setStatus("loading")
    getGasSeparationRecords({ throwOnError: true })
      .then(data => {
        if (!active) return
        const next = Array.isArray(data) ? data : []
        setRecords(next)
        setStatus(next.length ? "loaded" : "empty")
      })
      .catch(error => {
        console.warn("GasSep data load failed.", error)
        if (active) {
          setRecords([])
          setStatus("error")
        }
      })
    return () => { active = false }
  }, [])

  const labels = useMemo(() => conditionLabels(zh), [zh])
  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
  const clearFilters = () => setFilters({ gasPair: "all", customGasPair: "", temperature: "all", customTemperature: "", pressure: "all", customPressure: "", method: "all", dataStatus: "all" })
  const hasActiveFilters = ["gasPair", "temperature", "pressure", "method", "dataStatus"].some(key => filters[key] !== "all")

  const filterOptions = useMemo(() => ({
    gasPair: [
      { value: "all", label: zh ? "全部" : "All" },
      ...GAS_PAIR_OPTIONS.map(value => ({ value, label: displayGasPair(value) })),
      { value: "custom", label: zh ? "自定义" : "Custom" },
    ],
    temperature: [
      { value: "all", label: zh ? "全部" : "All" },
      ...TEMPERATURE_OPTIONS.map(value => ({ value: String(value), label: `${value} K` })),
      { value: "custom", label: zh ? "自定义" : "Custom" },
    ],
    pressure: [
      { value: "all", label: zh ? "全部" : "All" },
      ...PRESSURE_OPTIONS.map(option => ({ value: option.value, label: option.label })),
      { value: "custom", label: zh ? "自定义" : "Custom" },
    ],
    method: [
      { value: "all", label: zh ? "全部" : "All" },
      ...METHOD_OPTIONS.map(value => ({ value, label: value === "Pending" ? (zh ? "待补充" : "Pending") : value })),
    ],
    dataStatus: [
      { value: "all", label: zh ? "全部" : "All" },
      ...DATA_STATUS_OPTIONS.map(value => ({
        value,
        label: {
          curated: zh ? "已整理" : "Curated",
          pending: zh ? "待补充" : "Pending",
          "source-pending": zh ? "来源待补充" : "Source pending",
          "schema-only": zh ? "仅字段结构" : "Schema-only",
        }[value],
      })),
    ],
  }), [zh])

  const filteredRecords = useMemo(() => records.filter(record => {
    const selectedGasPair = filters.gasPair === "custom" ? filters.customGasPair : filters.gasPair
    if (selectedGasPair !== "all" && selectedGasPair.trim() && normalizeGasPair(record.separationSystem) !== normalizeGasPair(selectedGasPair)) return false
    if (filters.temperature === "custom") {
      if (filters.customTemperature.trim() && Number(record.temperatureK) !== Number(filters.customTemperature)) return false
    } else if (filters.temperature !== "all" && Number(record.temperatureK) !== Number(filters.temperature)) return false
    if (filters.pressure === "custom") {
      const customKpa = Number(filters.customPressure) * 100
      if (filters.customPressure.trim() && Math.abs(Number(record.pressureKPa) - customKpa) > 5) return false
    } else if (!pressureMatches(record, filters.pressure)) return false
    if (!methodMatches(record.method, filters.method)) return false
    if (!dataStatusMatches(record, filters.dataStatus)) return false
    return true
  }), [records, filters])

  const recordsWithMatch = useMemo(() => filteredRecords.map(record => ({
    record,
    match: conditionMatchInfo(record, filters, zh),
    source: sourceStatusInfo(record, zh),
    metrics: metricStatuses(record, zh),
  })), [filteredRecords, filters, zh])

  const summary = useMemo(() => {
    const partial = recordsWithMatch.filter(item => item.match.id === "partial").length
    const sourcePending = recordsWithMatch.filter(item => item.source.label === (zh ? "来源待补充" : "Source pending")).length
    return zh
      ? `显示 ${recordsWithMatch.length} 条记录 · ${partial} 条条件部分匹配 · ${sourcePending} 条来源待补充`
      : `Showing ${recordsWithMatch.length} records · ${partial} partial context · ${sourcePending} source pending`
  }, [recordsWithMatch, zh])

  const systems = useMemo(() => [
    ["C2H2/CO2", "50/50 or 1/1", zh ? "乙炔纯化" : "acetylene purification"],
    ["C2H2/C2H4", "1/99 or 1/999", zh ? "痕量乙炔脱除" : "trace acetylene removal"],
    ["CO2/N2", "15/85", zh ? "烟道气 CO2 捕集" : "flue gas capture"],
    ["CO2/CH4", "50/50", zh ? "天然气提纯" : "natural gas upgrading"],
    ["C2H6/C2H4", zh ? "取决于条件" : "condition-dependent", zh ? "乙烷/乙烯分离" : "ethane/ethylene separation"],
    ["Xe/Kr", zh ? "取决于条件" : "condition-dependent", zh ? "稀有气体分离" : "noble gas separation"],
  ], [zh])
  const systemAccents = [t.accentText, t.warn, t.success, t.violet, t.badgeCalcText, t.faint]
  const systemTints = [t.badgeInfoBg, t.badgeProxyBg, t.badgeCalcBg, t.badgeDangerBg, t.surface, t.panel]

  const isothermStatuses = useMemo(() => [
    ["uptake-only", statusLabel("uptake-only", zh)],
    ["single-component", statusLabel("single-component", zh)],
    ["multi-gas-planned", statusLabel("multi-gas-planned", zh)],
    ["pending", statusLabel("pending", zh)],
  ], [zh])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={zh ? "气体分离" : "GasSep"}
        subtitle={zh
          ? "带条件语境的气体吸附与分离记录。"
          : "Gas adsorption and separation records with condition context."}
        meta={zh ? "气体比例 · 温度 · 压力 · 方法 · 来源 · 等温线" : "gas ratio · temperature · pressure · method · source · isotherm status"}
        action={
          <>
            <BasisBadge tone="proxy">{zh ? "条件化记录" : "condition-aware records"}</BasisBadge>
            <CopyLinkButton hash="gassep" ariaLabel={zh ? "复制气体分离链接" : "Copy GasSep link"} />
          </>
        }
      />

      <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <SectionTitle>{zh ? "条件筛选器" : "Condition Filter"}</SectionTitle>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              color: hasActiveFilters ? t.accentText : t.faint,
              cursor: hasActiveFilters ? "pointer" : "not-allowed",
              fontSize: 11,
              fontWeight: 800,
              padding: "6px 9px",
              opacity: hasActiveFilters ? 1 : 0.55,
            }}
          >
            {zh ? "清空筛选" : "Clear filters"}
          </button>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "repeat(2, minmax(0, 1fr))" : "repeat(5, minmax(0, 1fr))",
          gap: 10,
        }}>
          <FilterSelect label={zh ? "气体对" : "Gas pair"} value={filters.gasPair} onChange={value => updateFilter("gasPair", value)} options={filterOptions.gasPair} t={t} />
          <FilterSelect label={zh ? "温度" : "Temperature"} value={filters.temperature} onChange={value => updateFilter("temperature", value)} options={filterOptions.temperature} t={t} />
          <FilterSelect label={zh ? "压力" : "Pressure"} value={filters.pressure} onChange={value => updateFilter("pressure", value)} options={filterOptions.pressure} t={t} />
          <FilterSelect label={zh ? "方法" : "Method"} value={filters.method} onChange={value => updateFilter("method", value)} options={filterOptions.method} t={t} />
          <FilterSelect label={zh ? "数据状态" : "Data status"} value={filters.dataStatus} onChange={value => updateFilter("dataStatus", value)} options={filterOptions.dataStatus} t={t} />
        </div>
        {(filters.gasPair === "custom" || filters.temperature === "custom" || filters.pressure === "custom") && (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
            gap: 10,
            marginTop: 10,
          }}>
            {filters.gasPair === "custom" && (
              <label style={{ display: "grid", gap: 5 }}>
                <span style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{zh ? "自定义气体对" : "Custom gas pair"}</span>
                <input
                  value={filters.customGasPair}
                  onChange={e => updateFilter("customGasPair", e.target.value)}
                  placeholder={zh ? "例如 H2/CO2" : "e.g. H2/CO2"}
                  style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.text, fontSize: 12, padding: "8px 10px", minHeight: 36 }}
                />
              </label>
            )}
            {filters.temperature === "custom" && (
              <label style={{ display: "grid", gap: 5 }}>
                <span style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{zh ? "自定义温度 K" : "Custom temperature K"}</span>
                <input
                  type="number"
                  value={filters.customTemperature}
                  onChange={e => updateFilter("customTemperature", e.target.value)}
                  placeholder="298"
                  style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.text, fontSize: 12, padding: "8px 10px", minHeight: 36 }}
                />
              </label>
            )}
            {filters.pressure === "custom" && (
              <label style={{ display: "grid", gap: 5 }}>
                <span style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{zh ? "自定义压力 bar" : "Custom pressure bar"}</span>
                <input
                  type="number"
                  value={filters.customPressure}
                  onChange={e => updateFilter("customPressure", e.target.value)}
                  placeholder="1"
                  style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.text, fontSize: 12, padding: "8px 10px", minHeight: 36 }}
                />
              </label>
            )}
          </div>
        )}
      </section>

      <div style={{
        color: t.subtle,
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        padding: "8px 11px",
        fontSize: 12,
        fontWeight: 750,
        lineHeight: 1.5,
      }}>
        {summary}
      </div>

      <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{zh ? "条件化记录" : "Condition-aware records"}</SectionTitle>
        {status === "loading" && <Callout tone="info">{zh ? "正在加载气体分离记录…" : "Loading GasSep records..."}</Callout>}
        {status === "error" && (
          <Callout tone="warn">
            {zh
              ? "数据加载失败。请刷新页面，或检查当前网络是否可以访问 GitHub Pages。"
              : "Data could not be loaded. Please refresh the page or check network access to GitHub Pages."}
          </Callout>
        )}
        {status === "empty" && <Callout tone="warn">{zh ? "当前筛选条件下暂无记录。" : "No records are available for the current filters."}</Callout>}
        {status === "loaded" && recordsWithMatch.length === 0 ? (
          <div style={{ background: t.surface, border: `1px dashed ${t.borderStrong || t.border}`, borderRadius: 8, padding: 18, marginTop: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 850 }}>
              {zh ? "未找到匹配的气体分离记录。" : "No matching gas separation records."}
            </div>
            <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 6 }}>
              {zh ? "可尝试放宽气体对、温度、压力或方法筛选条件。" : "Try relaxing gas pair, temperature, pressure, or method filters."}
            </div>
            <button type="button" onClick={clearFilters} style={{ marginTop: 12, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, color: t.accentText, cursor: "pointer", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
              {zh ? "清空筛选" : "Clear filters"}
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={{ width: "100%", minWidth: 1120, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {(zh
                    ? ["材料", "气体对", "温度", "压力", "方法", "指标状态", "来源状态", "条件匹配度", "操作"]
                    : ["MOF", "Gas pair", "Temperature", "Pressure", "Method", "Metric status", "Source status", "Condition match", "Actions"]).map(head => (
                    <th key={head} style={{ textAlign: "left", color: t.faint, fontSize: 10, padding: "7px 8px", borderBottom: `1px solid ${t.border}`, textTransform: "uppercase" }}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recordsWithMatch.map(({ record, match, source, metrics }) => {
                  const canViewPerformance = Boolean(onNavigate && record.mofName && !isSchemaOnlyRecord(record))
                  const performanceTitle = canViewPerformance ? undefined : (zh ? "性能记录待补充。" : "Performance record pending.")
                  const builderTitle = onOpenComparisonBuilder
                    ? (zh ? "条件语境可在对比器中选择。" : "Condition context should be selected in the builder.")
                    : (zh ? "对比器入口待补充。" : "Comparison builder entry pending.")
                  return (
                    <tr key={record.recordId} className="motion-table-row">
                      <CompactCell t={t} strong>{record.mofName || pendingText(zh)}</CompactCell>
                      <CompactCell t={t}>{displayGasPair(record.separationSystem || pendingText(zh))}</CompactCell>
                      <CompactCell t={t}>{record.temperatureK == null ? pendingText(zh) : `${record.temperatureK} K`}</CompactCell>
                      <CompactCell t={t}>{record.pressureKPa == null ? pendingText(zh) : `${(Number(record.pressureKPa) / 100).toFixed(0)} bar`}</CompactCell>
                      <CompactCell t={t}>{record.method || pendingText(zh)}</CompactCell>
                      <CompactCell t={t}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {metrics.map(item => <BasisBadge key={item} tone={/pending|待补充/.test(item) ? "warn" : "proxy"}>{item}</BasisBadge>)}
                        </div>
                      </CompactCell>
                      <CompactCell t={t}><BasisBadge tone={source.tone}>{source.label}</BasisBadge></CompactCell>
                      <CompactCell t={t}><BasisBadge tone={match.tone}>{match.label}</BasisBadge></CompactCell>
                      <CompactCell t={t}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <ActionButton
                            t={t}
                            disabled={!canViewPerformance}
                            title={performanceTitle}
                            onClick={() => onNavigate?.("performance")}
                          >
                            {zh ? "查看性能优先级" : "View in Performance"}
                          </ActionButton>
                          <ActionButton
                            t={t}
                            disabled={!onOpenComparisonBuilder}
                            title={builderTitle}
                            onClick={onOpenComparisonBuilder}
                          >
                            {zh ? "加入对比器" : "Add to Builder"}
                          </ActionButton>
                        </div>
                      </CompactCell>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{zh ? "分离体系卡片" : "Separation System Cards"}</SectionTitle>
        <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>
          {zh ? "以下比例是常见报道语境，不代表适用于所有论文或所有测试条件。" : "These ratios are commonly reported context, not universal conditions for every paper or test."}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
          {systems.map(([system, ratio, context], index) => (
            <article key={system} className="content-card" style={{
              background: systemTints[index] || (index % 2 === 0 ? t.surface : t.panel),
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: 12,
              minHeight: 116,
              boxShadow: `inset 3px 0 0 0 ${systemAccents[index] || t.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                  <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 999, background: systemAccents[index] || t.border, boxShadow: `0 0 0 3px ${t.panel}` }} />
                  <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 900, fontFamily: FONT_MONO }}>{system}</div>
                </div>
                <span style={{
                  color: t.subtle,
                  background: t.badgeCalcBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 999,
                  padding: "3px 7px",
                  fontSize: 10,
                  fontWeight: 800,
                  lineHeight: 1.2,
                }}>
                  {zh ? "常见报道语境" : "commonly reported context"}
                </span>
              </div>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", marginTop: 10 }}>
                {zh ? "常见比例" : "Common ratio"}
              </div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.5, marginTop: 3 }}>{ratio}</div>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", marginTop: 8 }}>
                {zh ? "语境" : "Context"}
              </div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.5, marginTop: 3 }}>{context}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{zh ? "条件完整度" : "Condition Completeness"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
          {records.map(record => {
            const summary = conditionSummary(record)
            const missing = summary.missing.map(key => labels[key]).join(", ") || (zh ? "无" : "none")
            return (
              <article key={record.recordId} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{record.separationSystem}</div>
                <div style={{ color: t.accentText, fontSize: 12, fontWeight: 850, marginTop: 8 }}>
                  {zh ? "条件完整度" : "Condition completeness"}: {summary.count}/{summary.total}
                </div>
                <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>
                  {zh ? "缺失" : "Missing"}: {missing}
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
                  {CONDITION_KEYS.map(key => (
                    <span key={key} style={{
                      border: `1px solid ${record.conditionCompleteness?.[key] ? t.border : t.warn}`,
                      background: record.conditionCompleteness?.[key] ? t.panel : t.badgeWarnBg,
                      color: record.conditionCompleteness?.[key] ? t.muted : t.warn,
                      borderRadius: 999,
                      padding: "4px 7px",
                      fontSize: 10,
                      fontWeight: 780,
                    }}>
                      {labels[key]}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{zh ? "等温线可用性" : "Isotherm Availability"}</SectionTitle>
        <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, margin: "8px 0 0" }}>
          {zh
            ? "当前原型优先整理选择性、吸附量和条件元数据。多气体等温线叠加需要整理后的原始等温线点数据，属于后续工作。"
            : "Current prototype prioritizes selectivity, uptake, and condition metadata. Multi-gas isotherm overlays require curated raw isotherm points and are treated as future work."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
          {isothermStatuses.map(([key, label]) => (
            <div key={key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <BasisBadge tone={key === "pending" ? "warn" : "info"}>{key}</BasisBadge>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>
          {records.map(record => (
            <div key={record.recordId} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 11px" }}>
              <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 850 }}>{record.separationSystem}</div>
              <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>
                {statusLabel(record.isothermStatus, zh)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Callout tone="note">
        {zh
          ? "本模块不执行 IAST、GCMC 或穿透曲线模拟，仅用于整理带条件说明的气体分离记录。"
          : "This module does not perform IAST, GCMC, or breakthrough simulation. It organizes condition-aware records for transparent comparison."}{" "}
        <DisclaimerLink />
      </Callout>
    </div>
  )
}
