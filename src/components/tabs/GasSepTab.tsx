// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  useT, useLang, useViewport,
  FONT_MONO,
  BasisBadge, Callout, CopyLinkButton, DisclaimerLink, PageHeader, SectionTitle,
  getGasSeparationRecords, getGasSystemsDemo, getGasSourcesDemo,
  getComparabilityStatus, getComparisonWarning,
  ChemicalFormula,
  ChemicalText,
} from "../../shared"
import {
  displayGasFormula,
  GasComparabilityBadge,
  GasConditionFilter,
  GasDataCurationPanel,
  GasSelectivityPressureChart,
  GasUptakeSelectivityScatter,
  GAS_CHART_COLORS,
} from "../gas/GasSepPanels"

const DEFAULT_SYSTEMS = ["CH4/N2", "C2H2/CO2", "CO2/N2", "C2H2/C2H4"]
const CHART_COLORS = GAS_CHART_COLORS

function pendingText(zh) {
  return zh ? "待补充" : "Pending"
}

function displayGas(value = "") {
  return displayGasFormula(value)
}

function GasFormulaText({ value, style }) {
  return <ChemicalFormula value={value} style={style} />
}

function normalizeText(value = "") {
  return String(value).replace(/[₂₄₆]/g, match => ({ "₂": "2", "₄": "4", "₆": "6" }[match])).trim().toLowerCase()
}

function conditionText(item, zh) {
  if (!item) return pendingText(zh)
  const pressure = item.pressureKPa != null
    ? `${item.pressureKPa} kPa`
    : item.pressureBar != null
      ? `${item.pressureBar} bar`
      : pendingText(zh)
  return `${item.feedRatio || pendingText(zh)} · ${item.temperatureK ?? "—"} K · ${pressure} · ${item.method || pendingText(zh)}`
}

function pressureText(item, zh) {
  if (item?.pressureKPa != null && item?.pressureBar != null) return `${item.pressureKPa} kPa / ${item.pressureBar} bar`
  if (item?.pressureKPa != null) return `${item.pressureKPa} kPa`
  if (item?.pressureBar != null) return `${item.pressureBar} bar`
  return pendingText(zh)
}

function statusTone(status = "") {
  const text = String(status).toLowerCase()
  if (text.includes("review")) return "calc"
  if (text.includes("seed")) return "info"
  if (text.includes("pending") || text.includes("validation")) return "warn"
  return "proxy"
}

function getFieldSource(record, path, fallback = {}) {
  return {
    ...(record?.fieldSources?.[path] || {}),
    ...fallback,
  }
}

function makeSelectivityRows(records, sourcesById) {
  return records.flatMap(record => (record.selectivityRecords || []).map((selectivityRecord, index) => ({
    ...selectivityRecord,
    record,
    recordId: record.id || record.recordId,
    mofName: record.mofName,
    gasSystem: record.gasSystem || record.separationSystem,
    gasSystemId: record.gasSystemId,
    targetGas: record.targetGas,
    application: record.application,
    overallEvidenceLevel: record.overallEvidenceLevel || record.evidenceLevel,
    fieldIndex: index,
    source: sourcesById.get(selectivityRecord.sourceId) || {},
  })))
}

function findMatchingUptake(record, point) {
  const targetGas = record.targetGas || record.gasA
  return (record.uptakeRecords || []).find(item =>
    item.gas === targetGas &&
    Number(item.temperatureK) === Number(point.temperatureK) &&
    (Number(item.pressureKPa) === Number(point.pressureKPa) || Number(item.pressureBar) === Number(point.pressureBar))
  )
}

function findMatchingBreakthrough(record, point) {
  return (record.breakthroughRecords || []).find(item =>
    item.feedRatio === point.feedRatio &&
    Number(item.temperatureK) === Number(point.temperatureK) &&
    (Number(item.pressureKPa) === Number(point.pressureKPa) || Number(item.pressureBar) === Number(point.pressureBar))
  )
}

function FilterSelect({ label, value, options, onChange, t }) {
  return (
    <label style={{ display: "grid", gap: 5, minWidth: 0 }}>
      <span style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</span>
      <select
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
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function FieldInfoButton({ field, value, condition, method, source, fieldSource, onOpen, t, ariaLabel }) {
  const buttonRef = useRef(null)
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={ariaLabel}
      onClick={() => onOpen({
        trigger: buttonRef.current,
        field,
        value,
        condition,
        method,
        source,
        fieldSource,
      })}
      style={{
        width: 18,
        height: 18,
        borderRadius: 999,
        border: `1px solid ${t.borderStrong}`,
        background: t.panel,
        color: t.accentText,
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 900,
        lineHeight: "16px",
        padding: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
      }}
    >
      ⓘ
    </button>
  )
}

function FieldValue({ label, value, field, condition, method, source, fieldSource, onOpen, t, zh, strong = false }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <span style={{
          color: strong ? t.textStrong : t.muted,
          fontSize: strong ? 18 : 12,
          fontWeight: strong ? 900 : 760,
          fontFamily: strong ? FONT_MONO : undefined,
          lineHeight: 1.35,
          overflowWrap: "anywhere",
        }}>
          {value ?? pendingText(zh)}
        </span>
        <FieldInfoButton
          field={field}
          value={value ?? pendingText(zh)}
          condition={condition}
          method={method}
          source={source}
          fieldSource={fieldSource}
          onOpen={onOpen}
          t={t}
          ariaLabel={zh ? `查看 ${label} 字段来源` : `View provenance for ${label}`}
        />
      </div>
    </div>
  )
}

function ProvenancePopover({ active, onClose, t, zh, isMobile }) {
  const panelRef = useRef(null)
  const [, setPositionTick] = useState(0)

  useEffect(() => {
    if (!active) return undefined
    const handleKey = event => {
      if (event.key === "Escape") onClose()
    }
    const handlePointer = event => {
      if (panelRef.current?.contains(event.target)) return
      if (active.trigger?.contains?.(event.target)) return
      onClose()
    }
    const handleReposition = () => setPositionTick(value => value + 1)
    document.addEventListener("keydown", handleKey)
    document.addEventListener("pointerdown", handlePointer)
    window.addEventListener("scroll", handleReposition, true)
    window.addEventListener("resize", handleReposition)
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.removeEventListener("pointerdown", handlePointer)
      window.removeEventListener("scroll", handleReposition, true)
      window.removeEventListener("resize", handleReposition)
    }
  }, [active, onClose])

  if (!active) return null

  const rect = active.trigger?.getBoundingClientRect?.()
  const maxLeft = Math.max(12, window.innerWidth - 340)
  const maxTop = Math.max(12, window.innerHeight - 360)
  const left = rect ? Math.max(12, Math.min(maxLeft, rect.left - 290)) : 18
  const top = rect ? Math.max(12, Math.min(maxTop, rect.bottom + 8)) : 80
  const source = active.source || {}
  const fieldSource = active.fieldSource || {}
  const rows = [
    [zh ? "字段" : "Field", active.field],
    [zh ? "数值" : "Value", active.value],
    [zh ? "条件" : "Condition", active.condition],
    [zh ? "方法" : "Method", active.method || fieldSource.method],
    [zh ? "来源标题" : "Source title", source.title || pendingText(zh)],
    [zh ? "作者 / 期刊 / 年份" : "Authors / Journal / Year", `${source.authors || pendingText(zh)} / ${source.journal || pendingText(zh)} / ${source.year || pendingText(zh)}`],
    ["DOI", source.doi || pendingText(zh)],
    [zh ? "论文位置" : "Location in paper", fieldSource.location || active.sourceLocation || pendingText(zh)],
    [zh ? "证据类型" : "Evidence type", fieldSource.evidenceType || active.evidenceType || pendingText(zh)],
    [zh ? "整理状态" : "Curation status", fieldSource.curationStatus || source.curationStatus || pendingText(zh)],
  ]

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal={isMobile ? "true" : "false"}
      style={{
        position: "fixed",
        left: isMobile ? 12 : left,
        right: isMobile ? 12 : "auto",
        bottom: isMobile ? 12 : "auto",
        top: isMobile ? "auto" : top,
        width: isMobile ? "auto" : 328,
        maxHeight: isMobile ? "74vh" : 350,
        overflowY: "auto",
        background: t.panel,
        border: `1px solid ${t.borderStrong}`,
        borderRadius: isMobile ? 14 : 10,
        padding: 14,
        zIndex: 10000,
        boxShadow: t.shadowMd,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>{zh ? "字段级来源" : "Field-level provenance"}</div>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45, marginTop: 2 }}>{active.field}</div>
        </div>
        <button type="button" onClick={onClose} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.subtle, cursor: "pointer", fontSize: 12, fontWeight: 850, padding: "3px 7px" }}>
          Esc
        </button>
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "grid", gridTemplateColumns: "112px minmax(0, 1fr)", gap: 8, borderTop: `1px solid ${t.divider}`, paddingTop: 7 }}>
            <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45, overflowWrap: "anywhere" }}><ChemicalText value={value || pendingText(zh)} /></div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}

function SelectivityTooltip({ active, payload, label, t, zh }) {
  if (!active || !payload?.length) return null
  const visible = payload.filter(item => item.value != null)
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 11px", maxWidth: 310 }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{zh ? "总压力" : "Total pressure"}: {label} kPa</div>
      {visible.map(item => {
        const meta = item.payload?.[`${item.dataKey}Meta`] || {}
        return (
          <div key={item.dataKey} style={{ color: item.color, fontSize: 11, lineHeight: 1.5, marginTop: 6 }}>
            <strong>{item.dataKey}</strong>: {item.value}
            <div style={{ color: t.subtle }}><GasFormulaText value={meta.gasSystem} /> · {conditionText(meta, zh)} · {meta.sourceLocation}</div>
          </div>
        )
      })}
    </div>
  )
}

function ScatterTooltip({ active, payload, t, zh }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 11px", maxWidth: 310 }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{point.mofName}</div>
      <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55, marginTop: 5 }}>
        <GasFormulaText value={point.gasSystem} /> · {point.feedRatio} · {point.temperatureK} K · {point.pressureKPa} kPa · {point.method}
      </div>
      <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginTop: 5 }}>
        {zh ? "吸附量" : "Uptake"}: {point.uptake ?? "—"} {point.uptakeUnit || ""}<br />
        {zh ? "选择性" : "Selectivity"}: {point.selectivity ?? "—"}<br />
        {zh ? "动态容量" : "Dynamic capacity"}: {point.dynamicCapacity ?? "—"} {point.dynamicCapacityUnit || ""}<br />
        {zh ? "位置" : "Location"}: {point.sourceLocation || pendingText(zh)}
      </div>
    </div>
  )
}

export function GasSepTab({ onNavigate, onOpenComparisonBuilder }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const zh = lang === "zh"
  const [records, setRecords] = useState([])
  const [systems, setSystems] = useState([])
  const [sources, setSources] = useState([])
  const [status, setStatus] = useState("loading")
  const [filters, setFilters] = useState({
    gasSystem: "all",
    feedRatio: "all",
    temperature: "all",
    pressure: "all",
    method: "all",
  })
  const [activeProvenance, setActiveProvenance] = useState(null)

  useEffect(() => {
    let active = true
    setStatus("loading")
    Promise.all([
      getGasSeparationRecords({ throwOnError: true }),
      getGasSystemsDemo({ throwOnError: false }),
      getGasSourcesDemo({ throwOnError: false }),
    ])
      .then(([recordRows, systemRows, sourceRows]) => {
        if (!active) return
        setRecords(Array.isArray(recordRows) ? recordRows : [])
        setSystems(Array.isArray(systemRows) ? systemRows : [])
        setSources(Array.isArray(sourceRows) ? sourceRows : [])
        setStatus(Array.isArray(recordRows) && recordRows.length ? "loaded" : "empty")
      })
      .catch(error => {
        console.warn("GasSep data load failed.", error)
        if (active) setStatus("error")
      })
    return () => { active = false }
  }, [])

  const sourcesById = useMemo(() => new Map(sources.map(source => [source.id, source])), [sources])
  const selectivityRows = useMemo(() => makeSelectivityRows(records, sourcesById), [records, sourcesById])

  const options = useMemo(() => {
    const all = { value: "all", label: zh ? "全部" : "All" }
    const unique = (items, getValue, formatter = value => value) => [all, ...Array.from(new Set(items.map(getValue).filter(Boolean))).map(value => ({ value: String(value), label: formatter(value) }))]
    return {
      gasSystem: unique(selectivityRows, row => row.gasSystem, displayGas),
      feedRatio: unique(selectivityRows, row => row.feedRatio),
      temperature: unique(selectivityRows, row => row.temperatureK, value => `${value} K`),
      pressure: unique(selectivityRows, row => row.pressureKPa, value => `${value} kPa`),
      method: unique(selectivityRows, row => row.method),
    }
  }, [selectivityRows, zh])

  const filteredRows = useMemo(() => selectivityRows.filter(row => {
    if (filters.gasSystem !== "all" && normalizeText(row.gasSystem) !== normalizeText(filters.gasSystem)) return false
    if (filters.feedRatio !== "all" && row.feedRatio !== filters.feedRatio) return false
    if (filters.temperature !== "all" && Number(row.temperatureK) !== Number(filters.temperature)) return false
    if (filters.pressure !== "all" && Number(row.pressureKPa) !== Number(filters.pressure)) return false
    if (filters.method !== "all" && row.method !== filters.method) return false
    return true
  }), [selectivityRows, filters])

  const numericRows = useMemo(() => filteredRows.filter(row => row.selectivity != null), [filteredRows])
  const comparabilityStatus = getComparabilityStatus(numericRows)
  const comparisonWarning = getComparisonWarning(numericRows, lang)

  const chartData = useMemo(() => {
    const pressureRows = new Map()
    numericRows.forEach(row => {
      const pressure = Number(row.pressureKPa ?? row.pressureBar * 100)
      const existing = pressureRows.get(pressure) || { pressureKPa: pressure }
      existing[row.mofName] = Number(row.selectivity)
      existing[`${row.mofName}Meta`] = row
      pressureRows.set(pressure, existing)
    })
    return Array.from(pressureRows.values()).sort((a, b) => a.pressureKPa - b.pressureKPa)
  }, [numericRows])

  const mofSeries = useMemo(() => Array.from(new Set(numericRows.map(row => row.mofName))), [numericRows])

  const scatterPoints = useMemo(() => numericRows.map(row => {
    const uptake = findMatchingUptake(row.record, row)
    const breakthrough = findMatchingBreakthrough(row.record, row)
    return {
      id: row.id,
      mofName: row.mofName,
      gasSystem: row.gasSystem,
      feedRatio: row.feedRatio,
      temperatureK: row.temperatureK,
      pressureKPa: row.pressureKPa,
      method: row.method,
      sourceLocation: row.sourceLocation,
      selectivity: Number(row.selectivity),
      uptake: uptake?.uptake == null ? null : Number(uptake.uptake),
      uptakeUnit: uptake?.unit,
      dynamicCapacity: breakthrough?.dynamicCapacity == null ? null : Number(breakthrough.dynamicCapacity),
      dynamicCapacityUnit: breakthrough?.dynamicCapacityUnit,
      evidenceLevel: row.overallEvidenceLevel || "pending",
      z: Math.max(120, Number(breakthrough?.dynamicCapacity || 2) * 80),
    }
  }).filter(point => point.uptake != null && point.selectivity != null), [numericRows])

  const evidenceGroups = useMemo(() => {
    const groups = new Map()
    scatterPoints.forEach(point => {
      const key = point.evidenceLevel || "pending"
      groups.set(key, [...(groups.get(key) || []), point])
    })
    return Array.from(groups.entries())
  }, [scatterPoints])

  const selectedTitleContext = useMemo(() => {
    const values = key => Array.from(new Set(numericRows.map(row => row[key]).filter(Boolean)))
    const pick = key => values(key).length === 1 ? values(key)[0] : (zh ? "混合条件" : "mixed conditions")
    return `${displayGas(pick("gasSystem"))} · ${pick("feedRatio")} · ${pick("temperatureK")} K · ${pick("method")}`
  }, [numericRows, zh])

  const openProvenance = useCallback(payload => {
    setActiveProvenance(payload)
  }, [])

  const clearFilters = () => setFilters({ gasSystem: "all", feedRatio: "all", temperature: "all", pressure: "all", method: "all" })

  const systemCards = useMemo(() => {
    const fromData = systems.length ? systems : DEFAULT_SYSTEMS.map(label => ({ id: label, label, commonFeedRatios: [], application: "" }))
    return fromData.map(system => ({
      ...system,
      count: selectivityRows.filter(row => normalizeText(row.gasSystem) === normalizeText(system.label)).length,
    }))
  }, [systems, selectivityRows])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={zh ? "GasSep 气体分离工作台" : "GasSep Workspace"}
        subtitle={zh
          ? "条件感知的气体分离文献数据整理：选择性必须与气体体系、比例、温度、压力、方法和来源一起阅读。"
          : "Condition-aware gas separation curation: selectivity is read with gas system, feed ratio, temperature, pressure, method, and source provenance."}
        meta={zh ? "curated literature data · 字段级来源 · 不做在线 IAST/GCMC" : "curated literature data · field provenance · no online IAST/GCMC"}
        action={
          <>
            <BasisBadge tone="proxy">{zh ? "保留现有 GasSep 入口" : "existing GasSep route"}</BasisBadge>
            <CopyLinkButton hash="gassep" ariaLabel={zh ? "复制 GasSep 链接" : "Copy GasSep link"} />
          </>
        }
      />

      <Callout tone="info">
        {zh
          ? "Current version: curated literature data, not an online IAST/GCMC calculator. 当前版本展示已整理或待整理的文献记录，不执行真实在线 IAST、GCMC、PDF 抽取或穿透曲线预测。"
          : "Current version: curated literature data, not an online IAST/GCMC calculator. This version does not run live IAST, GCMC, PDF extraction, or breakthrough prediction."}
      </Callout>

      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.hash = "methodology-gassep"
            }
          }}
          style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 850, padding: "8px 11px" }}
        >
          {zh ? "查看方法说明：条件化气体分离数据记录" : "View methodology: condition-aware gas separation records"}
        </button>
      </div>

      <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <SectionTitle>{zh ? "Gas system selector" : "Gas system selector"}</SectionTitle>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 5 }}>
              {zh ? "常见 feed ratio 是比较语境，不是跨体系通用排名标准。" : "Common feed ratios are comparison context, not a universal ranking standard."}
            </div>
          </div>
          <GasComparabilityBadge status={comparabilityStatus} lang={lang} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
          {systemCards.map((system, index) => (
            <button
              key={system.id || system.label}
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, gasSystem: system.label }))}
              style={{
                textAlign: "left",
                background: normalizeText(filters.gasSystem) === normalizeText(system.label) ? t.badgeInfoBg : t.surface,
                border: `1px solid ${normalizeText(filters.gasSystem) === normalizeText(system.label) ? t.accent : t.border}`,
                borderRadius: 8,
                padding: 12,
                cursor: "pointer",
                minHeight: 126,
                boxShadow: `inset 3px 0 0 ${CHART_COLORS[index % CHART_COLORS.length]}`,
              }}
            >
              <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 900 }}>
                <GasFormulaText value={system.label} />
              </div>
              <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginTop: 7 }}>{system.application || pendingText(zh)}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 9 }}>
                {(system.commonFeedRatios || []).map(ratio => <BasisBadge key={ratio} tone="info">{ratio}</BasisBadge>)}
                <BasisBadge tone="proxy">{zh ? `${system.count} 条记录` : `${system.count} records`}</BasisBadge>
              </div>
            </button>
          ))}
        </div>
      </section>

      <GasConditionFilter
        filters={filters}
        options={options}
        setFilters={setFilters}
        clearFilters={clearFilters}
        t={t}
        lang={lang}
        isMobile={isMobile}
        isNarrow={isNarrow}
      />

      {comparisonWarning && (
        <Callout tone="warn">
          <strong>Condition-mixed comparison warning:</strong> {comparisonWarning}
        </Callout>
      )}

      <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <SectionTitle>{zh ? "Condition-aware selectivity comparison" : "Condition-aware selectivity comparison"}</SectionTitle>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 5 }}>
              {zh ? "选择性不再作为孤立数字显示；每个值都绑定条件和来源。" : "Selectivity is no longer displayed as a standalone number; every value carries condition and source context."}
            </div>
          </div>
          <BasisBadge tone="proxy">{zh ? `显示 ${filteredRows.length} 条条件记录` : `${filteredRows.length} condition records`}</BasisBadge>
        </div>
        {status === "loading" && <Callout tone="info">{zh ? "正在加载 GasSep 数据…" : "Loading GasSep data..."}</Callout>}
        {status === "error" && <Callout tone="warn">{zh ? "GasSep 数据加载失败。" : "GasSep data could not be loaded."}</Callout>}
        {status === "loaded" && filteredRows.length === 0 && <Callout tone="warn">{zh ? "当前条件下暂无记录。" : "No records match the current conditions."}</Callout>}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {filteredRows.map(row => {
            const record = row.record
            const condition = conditionText(row, zh)
            const source = row.source
            const selectivityPath = `selectivityRecords[${row.fieldIndex}].selectivity`
            const feedPath = `selectivityRecords[${row.fieldIndex}].feedRatio`
            const tempPath = `selectivityRecords[${row.fieldIndex}].temperatureK`
            const pressurePath = `selectivityRecords[${row.fieldIndex}].pressureKPa`
            const methodPath = `selectivityRecords[${row.fieldIndex}].method`
            const locationPath = `selectivityRecords[${row.fieldIndex}].sourceLocation`
            return (
              <article key={row.id} className="content-card" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 14, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 900 }}>{row.mofName}</div>
                    <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.5, marginTop: 3 }}>
                      <GasFormulaText value={row.gasSystem} /> · {row.application}
                    </div>
                  </div>
                  <BasisBadge tone={statusTone(row.curationStatus)}>{row.curationStatus}</BasisBadge>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1.1fr 1fr 1fr", gap: 12, marginTop: 13 }}>
                  <FieldValue label={zh ? "选择性" : "Selectivity"} field="selectivity" value={row.selectivity ?? pendingText(zh)} condition={condition} method={row.method} source={source} fieldSource={getFieldSource(record, selectivityPath, row)} onOpen={openProvenance} t={t} zh={zh} strong />
                  <FieldValue label="feed ratio" field="feedRatio" value={row.feedRatio} condition={condition} method={row.method} source={source} fieldSource={getFieldSource(record, feedPath, row)} onOpen={openProvenance} t={t} zh={zh} />
                  <FieldValue label={zh ? "温度" : "temperature"} field="temperature" value={`${row.temperatureK} K`} condition={condition} method={row.method} source={source} fieldSource={getFieldSource(record, tempPath, row)} onOpen={openProvenance} t={t} zh={zh} />
                  <FieldValue label={zh ? "压力" : "pressure"} field="pressure" value={pressureText(row, zh)} condition={condition} method={row.method} source={source} fieldSource={getFieldSource(record, pressurePath, row)} onOpen={openProvenance} t={t} zh={zh} />
                  <FieldValue label={zh ? "方法" : "method"} field="method" value={row.method} condition={condition} method={row.method} source={source} fieldSource={getFieldSource(record, methodPath, row)} onOpen={openProvenance} t={t} zh={zh} />
                  <FieldValue label={zh ? "文献位置" : "source location"} field="sourceLocation" value={row.sourceLocation} condition={condition} method={row.method} source={source} fieldSource={getFieldSource(record, locationPath, row)} onOpen={openProvenance} t={t} zh={zh} />
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <GasSelectivityPressureChart
        chartData={chartData}
        mofSeries={mofSeries}
        selectedTitleContext={selectedTitleContext}
        t={t}
        lang={lang}
        isMobile={isMobile}
      />

      <GasUptakeSelectivityScatter
        scatterPoints={scatterPoints}
        evidenceGroups={evidenceGroups}
        t={t}
        lang={lang}
        isMobile={isMobile}
      />

      <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{zh ? "Gas candidate cards" : "Gas candidate cards"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
          {records.map(record => {
            const firstSel = record.selectivityRecords?.[0]
            const uptakeIndex = (record.uptakeRecords || []).findIndex(item => item === findMatchingUptake(record, firstSel || {}))
            const breakthroughIndex = (record.breakthroughRecords || []).findIndex(item => item === findMatchingBreakthrough(record, firstSel || {}))
            const uptake = uptakeIndex >= 0 ? record.uptakeRecords[uptakeIndex] : null
            const breakthrough = breakthroughIndex >= 0 ? record.breakthroughRecords[breakthroughIndex] : null
            const condition = conditionText(firstSel, zh)
            const source = sourcesById.get(firstSel?.sourceId) || {}
            return (
              <article key={record.id || record.recordId} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900 }}>{record.mofName}</div>
                    <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.5, marginTop: 3 }}>
                      <GasFormulaText value={record.gasSystem} /> · {record.application}
                    </div>
                  </div>
                  <BasisBadge tone={statusTone(record.overallEvidenceLevel)}>{record.overallEvidenceLevel}</BasisBadge>
                </div>
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}>{condition}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <BasisBadge tone={firstSel?.selectivity == null ? "warn" : "calc"}>{zh ? `选择性 ${firstSel?.selectivity ?? "pending"}` : `Selectivity ${firstSel?.selectivity ?? "pending"}`}</BasisBadge>
                    <BasisBadge tone={uptake ? "info" : "warn"}>{zh ? `吸附量 ${uptake?.uptake ?? "pending"}` : `Uptake ${uptake?.uptake ?? "pending"}`}</BasisBadge>
                    <BasisBadge tone={breakthrough ? "proxy" : "warn"}>{zh ? `动态容量 ${breakthrough?.dynamicCapacity ?? "pending"}` : `Dynamic ${breakthrough?.dynamicCapacity ?? "pending"}`}</BasisBadge>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 3 }}>
                    <FieldValue
                      label={zh ? "吸附量" : "uptake"}
                      field="uptake"
                      value={uptake ? `${uptake.uptake} ${uptake.unit}` : pendingText(zh)}
                      condition={condition}
                      method={firstSel?.method}
                      source={sourcesById.get(uptake?.sourceId) || source}
                      fieldSource={uptakeIndex >= 0 ? getFieldSource(record, `uptakeRecords[${uptakeIndex}].uptake`, uptake) : {}}
                      onOpen={openProvenance}
                      t={t}
                      zh={zh}
                    />
                    <FieldValue
                      label={zh ? "动态容量" : "dynamic capacity"}
                      field="dynamicCapacity"
                      value={breakthrough ? `${breakthrough.dynamicCapacity} ${breakthrough.dynamicCapacityUnit}` : pendingText(zh)}
                      condition={condition}
                      method={firstSel?.method}
                      source={sourcesById.get(breakthrough?.sourceId) || source}
                      fieldSource={breakthroughIndex >= 0 ? getFieldSource(record, `breakthroughRecords[${breakthroughIndex}].dynamicCapacity`, breakthrough) : {}}
                      onOpen={openProvenance}
                      t={t}
                      zh={zh}
                    />
                  </div>
                  {onOpenComparisonBuilder && (
                    <button
                      type="button"
                      onClick={() => onOpenComparisonBuilder({
                        compareFunction: "gas-separation",
                        source: "gassep-record",
                        sourceRecordId: record.id || record.recordId,
                        candidateName: record.mofName,
                        conditionContext: firstSel ? {
                          gasPair: record.gasSystem,
                          feedRatio: firstSel.feedRatio,
                          temperature: `${firstSel.temperatureK} K`,
                          pressure: pressureText(firstSel, zh),
                          method: firstSel.method,
                        } : {},
                      })}
                      style={{ width: "fit-content", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontSize: 11, fontWeight: 850, padding: "6px 9px" }}
                    >
                      {zh ? "加入对比器" : "Add to Builder"}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <GasDataCurationPanel t={t} lang={lang} isMobile={isMobile} />

      <Callout tone="note">
        {zh
          ? "GasSep 仍使用现有导航、路由/hash、首页入口和模块身份；本轮没有新增 Gas Adsorption Lab 一级模块。"
          : "GasSep still uses the existing navigation, route/hash, homepage entry, and module identity; no new top-level Gas Adsorption Lab was added."}{" "}
        <DisclaimerLink />
      </Callout>

      <ProvenancePopover active={activeProvenance} onClose={() => setActiveProvenance(null)} t={t} zh={zh} isMobile={isMobile} />
    </div>
  )
}
