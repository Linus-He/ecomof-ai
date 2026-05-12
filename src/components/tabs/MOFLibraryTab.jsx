import { useEffect, useMemo, useRef, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from "recharts"
import {
  useT, useLang, useViewport,
  FONT_MONO,
  LITERATURE_DB, getAdsorptionLabels, getMofCandidates, getMofStructures, buildDatabaseRecords, downloadTextFile, toolbarBtn,
  BasisBadge, PageHeader, ResultLayer, Callout, safeVal, CopyLinkButton,
  FieldProvenanceButton, EvidenceLevelLegend,
  buildCriticScoringModel,
} from "../../shared"
import { CandidateComparisonModal, CompareTray } from "../mof/CandidateComparisonModal"

const KEY_FIELDS = [
  { key: "surfaceArea",     label: { en: "Surface area", zh: "比表面积" } },
  { key: "poreSizeA",       label: { en: "Pore size",    zh: "孔径"    } },
  { key: "poreVolume",      label: { en: "Pore volume",  zh: "孔体积"  } },
  { key: "co2Uptake",       label: { en: "CO₂ uptake",   zh: "CO₂ 吸附量" } },
  { key: "bandGap",         label: { en: "Band gap",     zh: "带隙"    } },
  { key: "waterStability",  label: { en: "Water stab.",  zh: "水稳定性" } },
  { key: "thermalStability",label: { en: "Thermal stab.",zh: "热稳定性" } },
  { key: "toxicityConcern", label: { en: "Toxicity",     zh: "毒性关注" } },
]

function isFieldCurated(src) {
  if (!src) return false
  if (src.sourceType === "pending") return false
  if (src.evidenceLevel === "needs-validation") return false
  return true
}

function isMissingValue(value) {
  return value === undefined || value === null || value === "" || value === "—" || value === "pending"
}

function recordFieldStatus(record, fieldKey) {
  const src = record.fieldSources?.[fieldKey]
  const hasValue = !isMissingValue(record[fieldKey]) || !isMissingValue(src?.value)
  if (isFieldCurated(src) || (hasValue && !record.fieldSources)) return "curated"
  if (src?.curationStatus === "needs-review" || src?.reviewStatus === "conflict" || src?.hasConflict) return "needs-review"
  return "pending"
}

function getOverviewSummary(record, lang) {
  const statuses = KEY_FIELDS.map(field => recordFieldStatus(record, field.key))
  const curatedCount = statuses.filter(status => status === "curated").length
  const needsReviewCount = statuses.filter(status => status === "needs-review").length
  const pendingCount = KEY_FIELDS.length - curatedCount - needsReviewCount
  const fieldsWithSource = KEY_FIELDS.filter(field => {
    const src = record.fieldSources?.[field.key]
    return src && src.sourceType !== "pending" && Boolean(src.sourceName || src.database || src.url || src.doi)
  }).length
  const fieldsWithCondition = KEY_FIELDS.filter(field => Boolean(record.fieldSources?.[field.key]?.condition)).length
  const statusId = curatedCount >= 5 && fieldsWithSource >= 3 ? "ready" : curatedCount >= 3 ? "partial" : curatedCount >= 1 ? "limited" : "pending"
  const labels = {
    ready: lang === "zh" ? "可初步查看" : "Ready",
    partial: lang === "zh" ? "部分完整" : "Partial",
    limited: lang === "zh" ? "信息有限" : "Limited",
    pending: lang === "zh" ? "待补充" : "Pending",
  }
  return {
    curatedCount,
    pendingCount,
    needsReviewCount,
    fieldsWithSource,
    fieldsWithCondition,
    statusId,
    label: labels[statusId],
  }
}

function DataQualitySection({ realSeedRows, lang, t, isMobile }) {
  const zh = lang === "zh"

  // 1. Provenance coverage by field
  const coverageData = useMemo(() => {
    if (!realSeedRows.length) return KEY_FIELDS.map(f => ({ name: f.label[zh ? "zh" : "en"], pct: 0 }))
    return KEY_FIELDS.map(f => {
      const count = realSeedRows.filter(row => isFieldCurated(row.fieldSources?.[f.key])).length
      return { name: f.label[zh ? "zh" : "en"], pct: Math.round((count / realSeedRows.length) * 100) }
    })
  }, [realSeedRows, zh])

  // 2. Evidence level distribution
  const evidenceData = useMemo(() => {
    const counts = {}
    realSeedRows.forEach(row => {
      const ev = row.evidenceLevel || "pending"
      counts[ev] = (counts[ev] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [realSeedRows])

  // 3. Curation status per MOF
  const curationData = useMemo(() => {
    return realSeedRows.map(row => {
      const curated = KEY_FIELDS.filter(f => isFieldCurated(row.fieldSources?.[f.key])).length
      const pending = KEY_FIELDS.length - curated
      return { name: row.name || row.id || "—", curated, pending }
    })
  }, [realSeedRows])

  const COLORS = {
    curated: t.accent || "#4f86f7",
    pending: t.border || "#dde2ea",
    evidence: [t.accent, t.accentSoft, t.warn, t.faint, "#a78bfa", "#34d399", "#f87171"],
  }

  const chartWrap = {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: isMobile ? 12 : 14,
    minWidth: 0,
    overflow: "visible",
  }

  if (!realSeedRows.length) {
    return (
      <div style={{ color: t.faint, fontSize: 12, padding: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8 }}>
        {zh ? "暂无真实种子数据可用于图表计算。" : "No real-seed records available for chart computation."}
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Chart 1 — Provenance coverage */}
      <div style={chartWrap}>
        <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 10 }}>
          {zh ? "字段来源覆盖率（%）" : "Provenance Coverage by Field (%)"}
        </div>
        <div style={{ color: t.faint, fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>
          {zh
            ? `有已核实来源的字段占比（n = ${realSeedRows.length} 条记录）`
            : `Fraction of records with a verified source for each field (n = ${realSeedRows.length})`}
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 210 : 160}>
          <BarChart data={coverageData} margin={isMobile ? { top: 8, right: 10, left: 0, bottom: 18 } : { top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
            <XAxis dataKey="name" tick={isMobile ? false : { fontSize: 9, fill: t.subtle }} interval={0} height={isMobile ? 8 : 30} />
            <YAxis domain={[0, 100]} width={isMobile ? 34 : 40} tick={{ fontSize: 9, fill: t.subtle }} />
            <RechartsTooltip
              contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 11 }}
              formatter={(v) => [`${v}%`, zh ? "覆盖率" : "Coverage"]}
            />
            <Bar dataKey="pct" fill={COLORS.curated} radius={[3, 3, 0, 0]}>
              {coverageData.map((entry, i) => (
                <Cell key={i} fill={entry.pct === 0 ? COLORS.pending : COLORS.curated} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        {/* Chart 2 — Evidence level distribution */}
        <div style={chartWrap}>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 10 }}>
            {zh ? "证据等级分布" : "Evidence Level Distribution"}
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 190 : 150}>
            <BarChart data={evidenceData} layout="vertical" margin={isMobile ? { top: 4, right: 12, left: 4, bottom: 10 } : { top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: t.subtle }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: isMobile ? 8 : 9, fill: t.subtle }} width={isMobile ? 96 : 70} />
              <RechartsTooltip
                contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 11 }}
                formatter={(v) => [v, zh ? "记录数" : "Records"]}
              />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {evidenceData.map((entry, i) => (
                  <Cell key={i} fill={COLORS.evidence[i % COLORS.evidence.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3 — Curation status per MOF */}
        <div style={chartWrap}>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 4 }}>
            {zh ? "每个 MOF 的整理进度（8 个关键字段）" : "Curation Status per MOF (8 key fields)"}
          </div>
          <div style={{ color: t.faint, fontSize: 10, marginBottom: 8 }}>
            {zh ? "■ 已整理  □ 待整理" : "■ Curated  □ Pending"}
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 210 : 150}>
            <BarChart data={curationData} margin={isMobile ? { top: 4, right: 10, left: 0, bottom: 16 } : { top: 0, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="name" tick={isMobile ? false : { fontSize: 8, fill: t.subtle }} interval={0} height={isMobile ? 8 : 30} />
              <YAxis domain={[0, 8]} width={isMobile ? 34 : 40} tick={{ fontSize: 9, fill: t.subtle }} />
              <RechartsTooltip
                contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 11 }}
                formatter={(v, n) => [v, n === "curated" ? (zh ? "已整理" : "Curated") : (zh ? "待整理" : "Pending")]}
              />
              <Bar dataKey="curated" stackId="a" fill={COLORS.curated} name="curated" />
              <Bar dataKey="pending" stackId="a" fill={COLORS.pending} radius={[3, 3, 0, 0]} name="pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.6 }}>
        {zh
          ? "图表数据从真实种子数据集的字段来源记录实时计算。大部分字段当前显示为待整理，反映数据库的实际整理状态。"
          : "Chart data are computed from Real Seed Dataset fieldSources. Most fields appear as pending, reflecting the actual curation state of the dataset."}
      </div>
    </div>
  )
}

function normalizeDemoRecord(item) {
  const metalNodes = Array.isArray(item.metalNodes) ? item.metalNodes : item.metal ? [item.metal] : []
  const source = Array.isArray(item.source) ? item.source.join(" / ") : item.source
  const limitations = Array.isArray(item.limitations) ? item.limitations.join("; ") : item.limitations
  const activeSiteHypothesis = Array.isArray(item.activeSiteHypothesis) ? item.activeSiteHypothesis.join("; ") : item.activeSiteHypothesis
  return {
    id: item.id || item.name,
    name: item.name,
    formula: item.formula || "—",
    metalNodes,
    metal: metalNodes.join(", ") || item.metal || "—",
    linker: item.linker || "—",
    topology: item.topology || "—",
    poreSizeA: Number(item.poreSizeA ?? item.pd ?? item.lcd ?? 0),
    surfaceArea: Number(item.surfaceArea ?? item.bet ?? 0),
    poreVolume: item.poreVolume ?? item.pv ?? "—",
    co2Uptake: item.co2Uptake ?? "—",
    bandGap: item.bandGap ?? "—",
    waterStability: item.waterStability || "—",
    thermalStability: item.thermalStability || "—",
    costLevel: item.costLevel || "—",
    toxicityConcern: item.toxicityConcern || "—",
    reactionClasses: Array.isArray(item.reactionClasses) ? item.reactionClasses : [],
    activeSiteHypothesis: activeSiteHypothesis || "—",
    source: source || item.sourceDatabase || item.sourceType || "Demo seed",
    evidenceLevel: item.evidenceLevel || "Low",
    limitations: limitations || "Demo / placeholder record; needs validation.",
    dataStatus: item.dataStatus || "demo / placeholder / needs validation",
    dataMode: item.dataMode || "demo",
    fieldSources: item.fieldSources || undefined,
  }
}

function normalizeLegacyRecord(item) {
  return normalizeDemoRecord({
    id: item.id || item.name,
    name: item.name,
    formula: item.formula || "—",
    metalNodes: item.metal ? [item.metal] : [],
    linker: item.linker,
    topology: item.topology,
    poreSizeA: item.pd || item.lcd || 0,
    surfaceArea: item.bet || 0,
    poreVolume: item.pv,
    co2Uptake: item.co2Uptake || item.co2_uptake_mmol_g,
    bandGap: item.bandGap || "—",
    waterStability: item.waterStability || "unmarked",
    thermalStability: item.thermalStability || "unmarked",
    costLevel: "unmarked",
    toxicityConcern: "unmarked",
    reactionClasses: [],
    activeSiteHypothesis: item.oms ? "Open metal site marked in structure record" : "Not specified",
    source: item.sourceDatabase || item.sourceType || "local seed",
    evidenceLevel: item.qualityFlag ? "Low-medium" : "Low",
    limitations: item.qualityFlag || "Legacy structure/label record; use as a data attribute, not a conclusion.",
    dataStatus: "local seed / needs validation",
  })
}

const zhValue = (value, lang) => {
  if (lang !== "zh") return value
  return {
    High: "高",
    Medium: "中",
    Low: "低",
    "Low-medium": "低-中",
    "unmarked": "未标注",
    "Demo seed": "演示种子数据",
    "local seed": "本地种子数据",
  }[value] || value
}

const zhDataStatus = (value, lang) => {
  if (lang !== "zh") return value
  return {
    "demo / placeholder / needs validation": "演示 / 占位 / 待验证",
    "local seed / needs validation": "本地种子 / 待验证",
    "real-seed / pending curation": "真实种子 / 待整理",
  }[value] || value
}

function dataModePanelPosition(anchorRect, isMobile) {
  if (isMobile) {
    return {
      top: 96,
      left: 16,
      right: 16,
      width: "auto",
      maxHeight: "calc(100vh - 128px)",
    }
  }
  const width = 380
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280
  const left = Math.max(16, Math.min((anchorRect?.right ?? vw - 24) - width, vw - width - 16))
  return {
    top: (anchorRect?.bottom ?? 120) + 8,
    left,
    width,
    maxHeight: "min(420px, calc(100vh - 140px))",
  }
}

function DataModeInfoPopover({ open, onClose, anchorRect, lang, t, isMobile }) {
  useEffect(() => {
    if (!open) return undefined
    const handleKey = event => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  if (!open) return null

  const panelPos = dataModePanelPosition(anchorRect, isMobile)

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 1198, background: "transparent" }}
      />
      <div
        role="dialog"
        aria-modal="false"
        aria-label={lang === "zh" ? "数据模式说明" : "Data mode notes"}
        onClick={event => event.stopPropagation()}
        style={{
          position: "fixed",
          ...panelPos,
          zIndex: 1199,
          overflowY: "auto",
          background: t.panel,
          border: `1px solid ${t.borderStrong}`,
          borderRadius: 10,
          boxShadow: t.shadowMd,
          padding: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900 }}>
            {lang === "zh" ? "数据模式说明" : "Data mode notes"}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === "zh" ? "关闭数据模式说明" : "Close data mode notes"}
            style={{ background: "transparent", border: "none", color: t.subtle, cursor: "pointer", fontSize: 17, lineHeight: 1, padding: 0 }}
          >
            x
          </button>
        </div>
        <div style={{ display: "grid", gap: 10, color: t.muted, fontSize: 12, lineHeight: 1.65 }}>
          <p style={{ margin: 0 }}>
            {lang === "zh"
              ? "演示数据用于展示筛选流程和交互逻辑，不用于科研结论。"
              : "Demo data are used to demonstrate the screening workflow and interaction logic, not for scientific conclusions."}
          </p>
          <p style={{ margin: 0 }}>
            {lang === "zh"
              ? "真实种子数据用于承载真实文献或数据库整理记录，但当前仍是种子库，不代表完整数据库。部分字段仍处于待复核状态，后续可能更新。"
              : "Real seed data carry curated records from literature or databases, but the current set remains a seed library rather than a complete database. Some fields are still under review and may be updated later."}
          </p>
        </div>
      </div>
    </>
  )
}

function DataModeBar({ dataMode, onChange, recordCount, infoOpen, setInfoOpen, lang, t, isMobile }) {
  const infoButtonRef = useRef(null)
  const [anchorRect, setAnchorRect] = useState(null)
  const options = [
    { id: "demo", label: lang === "zh" ? "演示数据" : "Demo" },
    { id: "real-seed", label: lang === "zh" ? "真实种子数据" : "Real seed" },
  ]
  const modeNote = dataMode === "real-seed"
    ? (lang === "zh" ? "当前模式：真实种子记录，用于查看字段来源、整理状态与证据等级。" : "Current mode: real seed records for reviewing field sources, curation status, and evidence level.")
    : (lang === "zh" ? "当前模式：演示记录，用于查看筛选流程和交互逻辑。" : "Current mode: demo records for reviewing workflow and interaction logic.")

  const toggleInfo = () => {
    if (infoButtonRef.current) setAnchorRect(infoButtonRef.current.getBoundingClientRect())
    setInfoOpen(prev => !prev)
  }

  return (
    <section style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "auto minmax(240px, 1fr) auto",
      gap: isMobile ? 9 : 12,
      alignItems: "center",
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: isMobile ? 10 : "9px 12px",
      position: "relative",
    }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>
        {lang === "zh" ? "数据模式" : "Data mode"}
      </div>
      <div style={{ display: "inline-flex", gap: 4, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: 3, width: "fit-content", maxWidth: "100%" }}>
        {options.map(option => {
          const active = option.id === dataMode
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={active}
              style={{
                border: `1px solid ${active ? t.accent : "transparent"}`,
                background: active ? t.panel : "transparent",
                color: active ? t.accentText : t.subtle,
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: active ? 900 : 750,
                lineHeight: 1.2,
                padding: "7px 10px",
                whiteSpace: "nowrap",
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: isMobile ? "flex-start" : "flex-end", flexWrap: "wrap" }}>
        <span style={{ color: t.textStrong, fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 850 }}>
          {lang === "zh" ? `${recordCount} 条记录` : `${recordCount} records`}
        </span>
        <button
          ref={infoButtonRef}
          type="button"
          onClick={toggleInfo}
          aria-label={lang === "zh" ? "打开数据模式说明" : "Open data mode notes"}
          aria-expanded={infoOpen}
          style={{
            ...toolbarBtn(t),
            color: t.accentText,
            borderColor: infoOpen ? t.accent : t.borderStrong,
            padding: "6px 9px",
            fontSize: 11,
            fontWeight: 850,
          }}
        >
          {lang === "zh" ? "数据说明" : "Data notes"} ⓘ
        </button>
      </div>
      <div style={{ gridColumn: "1 / -1", color: t.faint, fontSize: 11.5, lineHeight: 1.45 }}>
        {modeNote}
      </div>
      <DataModeInfoPopover
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        anchorRect={anchorRect}
        lang={lang}
        t={t}
        isMobile={isMobile}
      />
    </section>
  )
}

export function MOFLibraryTab({ results, inputs }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [dataMode, setDataMode] = useState("real-seed")
  const [query, setQuery] = useState("")
  const [metal, setMetal] = useState("all")
  const [source, setSource] = useState("all")
  const [evidence, setEvidence] = useState("all")
  const [poreMin, setPoreMin] = useState(0)
  const [poreMax, setPoreMax] = useState(40)
  const [areaMin, setAreaMin] = useState(0)
  const [areaMax, setAreaMax] = useState(5000)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [dataModeInfoOpen, setDataModeInfoOpen] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [structureRows, setStructureRows] = useState([])
  const [labelRows, setLabelRows] = useState([])
  const [demoRows, setDemoRows] = useState([])
  const [realSeedRows, setRealSeedRows] = useState([])
  const [status, setStatus] = useState("loading")
  const [selectedCompareIds, setSelectedCompareIds] = useState([])
  const [compareNotice, setCompareNotice] = useState("")
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [qualityChartsReady, setQualityChartsReady] = useState(false)
  const criticModel = useMemo(() => buildCriticScoringModel(), [])

  useEffect(() => {
    let active = true
    setStatus("loading")
    Promise.all([
      getMofStructures({ throwOnError: true }),
      getAdsorptionLabels({ throwOnError: true }),
      getMofCandidates({ mode: "demo", throwOnError: true }),
      getMofCandidates({ mode: "real-seed", throwOnError: true }),
    ])
      .then(([structures, labels, demo, realSeed]) => {
        if (!active) return
        const nextStructures = Array.isArray(structures) ? structures : []
        const nextLabels = Array.isArray(labels) ? labels : []
        const nextDemo = Array.isArray(demo) ? demo : []
        const nextRealSeed = Array.isArray(realSeed) ? realSeed : []
        setStructureRows(nextStructures)
        setLabelRows(nextLabels)
        setDemoRows(nextDemo)
        setRealSeedRows(nextRealSeed)
        setStatus(nextStructures.length || nextLabels.length || nextDemo.length || nextRealSeed.length ? "loaded" : "empty")
      })
      .catch((error) => {
        console.warn("MOF Library data load failed.", error)
        if (!active) return
        setStatus("fallback")
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    setQualityChartsReady(false)
    let timer = null
    const frame = window.requestAnimationFrame(() => {
      timer = window.setTimeout(() => setQualityChartsReady(true), 90)
    })
    return () => {
      window.cancelAnimationFrame(frame)
      if (timer) window.clearTimeout(timer)
    }
  }, [dataMode])

  useEffect(() => {
    setSelectedCompareIds([])
    setCompareNotice("")
    setComparisonOpen(false)
    setDataModeInfoOpen(false)
  }, [dataMode])

  const records = useMemo(() => {
    if (dataMode === "real-seed" && realSeedRows.length) {
      return realSeedRows.map(item => normalizeDemoRecord({
        ...item,
        // Graceful fallback for null numeric fields
        poreSizeA: item.poreSizeA ?? "pending",
        surfaceArea: item.surfaceArea ?? "pending",
        poreVolume: item.poreVolume ?? "pending",
        co2Uptake: item.co2Uptake ?? "pending",
        bandGap: item.bandGap ?? "pending",
        dataStatus: item.curationNote || "real-seed / pending curation",
      }))
    }
    if (demoRows.length) return demoRows.map(normalizeDemoRecord)
    const loaded = buildDatabaseRecords(structureRows, labelRows)
    return (loaded.length ? loaded : LITERATURE_DB).map(normalizeLegacyRecord)
  }, [dataMode, demoRows, realSeedRows, structureRows, labelRows])

  const metals = useMemo(() => Array.from(new Set(records.flatMap(item => item.metalNodes).filter(Boolean))).sort(), [records])
  const sources = useMemo(() => Array.from(new Set(records.map(item => item.source || "local seed"))).sort(), [records])
  const evidenceLevels = useMemo(() => Array.from(new Set(records.map(item => item.evidenceLevel || "Low"))).sort(), [records])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records
      .filter(item => !q || [item.name, item.formula, item.metal, item.linker, item.topology, item.source, item.evidenceLevel].some(value => String(value || "").toLowerCase().includes(q)))
      .filter(item => metal === "all" || item.metalNodes.includes(metal))
      .filter(item => source === "all" || item.source === source)
      .filter(item => evidence === "all" || item.evidenceLevel === evidence)
      .filter(item => Number(item.poreSizeA || 0) >= Number(poreMin) && Number(item.poreSizeA || 0) <= Number(poreMax))
      .filter(item => Number(item.surfaceArea || 0) >= Number(areaMin) && Number(item.surfaceArea || 0) <= Number(areaMax))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [records, query, metal, source, evidence, poreMin, poreMax, areaMin, areaMax])

  const selectedCompareCandidates = useMemo(() => {
    const byId = new Map(records.map(item => [item.id, item]))
    return selectedCompareIds.map(id => byId.get(id)).filter(Boolean)
  }, [records, selectedCompareIds])

  const overviewRows = useMemo(() => filtered.map(item => ({
    item,
    summary: getOverviewSummary(item, lang),
  })), [filtered, lang])

  const criticByName = useMemo(() => {
    const map = new Map()
    criticModel.candidates.forEach(candidate => {
      map.set(String(candidate.name || "").toLowerCase(), candidate)
      if (candidate.libraryName) map.set(String(candidate.libraryName).toLowerCase(), candidate)
    })
    return map
  }, [criticModel])

  const getCriticSummary = (item) => criticByName.get(String(item?.name || "").toLowerCase()) || null

  const openRecordFromOverview = (id) => {
    setExpandedId(id)
    window.setTimeout(() => {
      document.getElementById(`mof-record-${id}`)?.scrollIntoView({ block: "start", behavior: "smooth" })
    }, 80)
  }

  const toggleCompare = (item) => {
    setCompareNotice("")
    setSelectedCompareIds(prev => {
      if (prev.includes(item.id)) return prev.filter(id => id !== item.id)
      if (prev.length >= 3) {
        setCompareNotice(lang === "zh" ? "为保证可读性，每次最多对比 3 个候选材料。" : "For readability, compare up to 3 candidates.")
        return prev
      }
      return [...prev, item.id]
    })
  }

  const openScoringDetails = () => {
    if (typeof window === "undefined") return
    window.location.hash = "ecoscreen"
  }

  const exportCsv = () => {
    const header = ["MOF name", "Metal nodes", "Linker", "Pore size A", "Surface area m2/g", "CO2 uptake", "Band gap", "Stability", "Source", "Evidence level", "Limitations"]
    const rows = filtered.map(item => [
      item.name, item.metal, item.linker, item.poreSizeA, item.surfaceArea, item.co2Uptake, item.bandGap,
      `${item.waterStability}/${item.thermalStability}`, item.source, item.evidenceLevel, item.limitations,
    ])
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
    downloadTextFile("ecomof_mof_library.csv", csv, "text/csv")
  }

  const controlStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 10px", color: t.text, fontSize: 12, width: "100%", minWidth: 0 }
  const compactInputStyle = { ...controlStyle, padding: "8px 8px", fontFamily: FONT_MONO }
  const labelStyle = { display: "grid", gap: 5, color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", minWidth: 0 }
  const detailBlock = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }
  const field = (label, value, fieldKey, fieldSources) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 4 }}>
        <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</div>
        {fieldKey && <FieldProvenanceButton fieldKey={fieldKey} fieldLabel={label} source={fieldSources?.[fieldKey]} lang={lang} />}
      </div>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 750, overflowWrap: "anywhere" }}>
        {value || (lang === "zh" ? "暂无数据" : "Not available")}
      </div>
    </div>
  )

  const filterFields = (
    <>
      <label style={labelStyle}>
        {lang === "zh" ? "搜索" : "Search"}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={lang === "zh" ? "搜索材料名称、金属节点或数据来源" : "Search material name, metal node, or data source"}
          style={controlStyle}
        />
      </label>
      <label style={labelStyle}>
        {lang === "zh" ? "金属类型" : "Metal type"}
        <select value={metal} onChange={e => setMetal(e.target.value)} style={controlStyle}>
          <option value="all">{lang === "zh" ? "全部" : "all"}</option>
          {metals.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label style={labelStyle}>
        {lang === "zh" ? "孔结构" : "Pore structure"}
        <span style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 6 }}>
          <input type="number" aria-label={lang === "zh" ? "最小孔径 Å" : "Pore min Å"} value={poreMin} onChange={e => setPoreMin(e.target.value)} style={compactInputStyle} />
          <input type="number" aria-label={lang === "zh" ? "最大孔径 Å" : "Pore max Å"} value={poreMax} onChange={e => setPoreMax(e.target.value)} style={compactInputStyle} />
        </span>
      </label>
      <label style={labelStyle}>
        {lang === "zh" ? "数据来源" : "Data source"}
        <select value={source} onChange={e => setSource(e.target.value)} style={controlStyle}>
          <option value="all">{lang === "zh" ? "全部来源" : "all sources"}</option>
          {sources.map(item => <option key={item} value={item}>{zhValue(item, lang)}</option>)}
        </select>
      </label>
      <label style={labelStyle}>
        {lang === "zh" ? "证据等级" : "Evidence Level"}
        <select value={evidence} onChange={e => setEvidence(e.target.value)} style={controlStyle}>
          <option value="all">{lang === "zh" ? "全部" : "all"}</option>
          {evidenceLevels.map(item => <option key={item} value={item}>{zhValue(item, lang)}</option>)}
        </select>
      </label>
      <button
        type="button"
        onClick={() => setFiltersOpen(prev => !prev)}
        aria-expanded={filtersOpen}
        style={{ ...toolbarBtn(t), height: 36, alignSelf: "end", justifyContent: "center", whiteSpace: "nowrap" }}
      >
        {filtersOpen ? (lang === "zh" ? "收起" : "Less") : (lang === "zh" ? "更多" : "More")}
      </button>
    </>
  )
  const modeRecordCount = records.length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={lang === "zh" ? "MOF 候选库" : "MOF Library"}
        subtitle={lang === "zh"
          ? "浏览候选材料，查看描述符完整度、字段来源与证据等级。"
          : "Browse candidate materials, descriptor completeness, field sources, and evidence levels."}
        action={
          <>
            <BasisBadge tone={status === "loaded" ? "calc" : "proxy"}>{status === "loaded" ? "public/data" : (lang === "zh" ? "种子数据" : "fallback seed")}</BasisBadge>
            <CopyLinkButton hash="library" ariaLabel={lang === "zh" ? "复制 MOF 候选库链接" : "Copy MOF Library link"} />
          </>
        }
      />

      <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>
            {lang === "zh" ? "筛选条件" : "Filters"}
          </div>
          <div style={{ color: t.faint, fontSize: 11, fontFamily: FONT_MONO }}>
            {filtered.length}/{records.length}
          </div>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : isNarrow
              ? "repeat(2, minmax(0, 1fr))"
              : "minmax(260px, 1.45fr) minmax(120px, 0.7fr) minmax(170px, 0.78fr) minmax(150px, 0.82fr) minmax(135px, 0.72fr) auto",
          gap: 8,
          alignItems: "end",
        }}>
          {filterFields}
        </div>
        {filtersOpen && (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr)) auto auto",
            gap: 8,
            alignItems: "end",
            marginTop: 9,
            paddingTop: 9,
            borderTop: `1px solid ${t.divider}`,
          }}>
            {[
              [lang === "zh" ? "最小比表面积" : "Surface area min", areaMin, setAreaMin],
              [lang === "zh" ? "最大比表面积" : "Surface area max", areaMax, setAreaMax],
            ].map(([label, value, setter]) => (
              <label key={label} style={labelStyle}>
                {label}
                <input type="number" value={value} onChange={e => setter(e.target.value)} style={compactInputStyle} />
              </label>
            ))}
            <button
              type="button"
              onClick={() => setComparisonOpen(true)}
              style={{ ...toolbarBtn(t), height: 36, color: t.accentText, border: `1px solid ${t.accent}`, justifyContent: "center" }}
            >
              {selectedCompareIds.length
                ? (lang === "zh" ? `对比 · ${selectedCompareIds.length}` : `Compare · ${selectedCompareIds.length}`)
                : (lang === "zh" ? "候选对比" : "Compare")}
            </button>
            <button type="button" onClick={exportCsv} style={{ ...toolbarBtn(t), height: 36, justifyContent: "center" }}>↓ CSV</button>
          </div>
        )}
      </section>

      <DataModeBar
        dataMode={dataMode}
        onChange={mode => { setDataMode(mode); setExpandedId(null) }}
        recordCount={modeRecordCount}
        infoOpen={dataModeInfoOpen}
        setInfoOpen={setDataModeInfoOpen}
        lang={lang}
        t={t}
        isMobile={isMobile}
      />

      <div style={{
        color: t.subtle,
        fontSize: 11.5,
        lineHeight: 1.45,
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderLeft: `3px solid ${t.accent}`,
        borderRadius: 7,
        padding: "7px 10px",
      }}>
        {lang === "zh"
          ? "提示：点击字段旁的 ⓘ 查看来源、实验条件与整理状态；部分字段仍待复核。"
          : "Tip: click the ⓘ icon next to a field to inspect source, experimental condition, and curation status; some fields remain under review."}
      </div>

      {status === "loading" && (
        <Callout tone="info">{lang === "zh" ? "正在加载 MOF 候选库数据…" : "Loading MOF Library data..."}</Callout>
      )}
      {status === "fallback" && (
        <Callout tone="warn">
          {lang === "zh"
            ? "数据加载失败。请刷新页面，或检查当前网络是否可以访问 GitHub Pages。当前页面会使用本地种子上下文继续展示。"
            : "Data could not be loaded. Please refresh the page or check network access to GitHub Pages. This view continues with local seed context."}
        </Callout>
      )}
      {status === "empty" && (
        <Callout tone="warn">{lang === "zh" ? "当前筛选条件下暂无记录。" : "No records are available for the current filters."}</Callout>
      )}

      <ResultLayer
        number="01"
        title={lang === "zh" ? "候选材料列表" : "Candidate Material List"}
        subtitle={lang === "zh"
          ? "查看描述符完整度、来源字段和证据状态，再进入记录详情。"
          : "Review descriptor completeness, source fields, and evidence status before opening record details."}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {overviewRows.map(({ item, summary }) => (
            (() => {
              const scoring = getCriticSummary(item)
              return (
            <article
              key={item.id}
              style={{
                background: t.panel,
                border: `1px solid ${expandedId === item.id ? t.accent : t.border}`,
                borderRadius: 8,
                padding: 12,
                display: "grid",
                gap: 10,
                boxShadow: expandedId === item.id ? t.shadowSm : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 880, overflowWrap: "anywhere" }}>{item.name}</div>
                  <div style={{ color: t.faint, fontSize: 10, marginTop: 3 }}>{item.metal}</div>
                </div>
                <BasisBadge tone={summary.statusId === "ready" ? "calc" : summary.statusId === "partial" ? "info" : summary.statusId === "limited" ? "warn" : "proxy"}>
                  {summary.label}
                </BasisBadge>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {[
                  [lang === "zh" ? "已整理描述符" : "Curated descriptors", `${summary.curatedCount}/8`, summary.curatedCount / 8],
                  [lang === "zh" ? "带条件字段" : "Condition fields", summary.fieldsWithCondition, Math.min(1, summary.fieldsWithCondition / 4)],
                  [lang === "zh" ? "有来源字段" : "Source fields", summary.fieldsWithSource, Math.min(1, summary.fieldsWithSource / 8)],
                ].map(([label, value, pct]) => (
                  <div key={label} style={{ display: "grid", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: t.faint, fontSize: 10 }}>
                      <span>{label}</span>
                      <strong style={{ color: t.textStrong, fontWeight: 850 }}>{value}</strong>
                    </div>
                    <div style={{ height: 5, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.round(pct * 100)}%`, background: t.accent }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
                gap: 7,
                borderTop: `1px solid ${t.divider}`,
                paddingTop: 9,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: t.faint, fontSize: 9.5, textTransform: "uppercase", fontWeight: 850 }}>D_expected</div>
                  <div style={{ color: t.textStrong, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 850 }}>
                    {scoring ? Number(scoring.D_expected).toFixed(3) : "not mapped"}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: t.faint, fontSize: 9.5, textTransform: "uppercase", fontWeight: 850 }}>Evidence level</div>
                  <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 850 }}>
                    {scoring ? scoring.evidenceLevel : zhValue(item.evidenceLevel, lang)}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: t.faint, fontSize: 9.5, textTransform: "uppercase", fontWeight: 850 }}>Q / confidence_Q</div>
                  <div style={{ color: t.textStrong, fontSize: 11, fontFamily: FONT_MONO, fontWeight: 850 }}>
                    {scoring ? Number(scoring.confidence_Q_clipped).toFixed(2) : "not mapped"}
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1", color: scoring?.status?.tone === "warn" ? t.warn : t.accentText, fontSize: 10.5, fontWeight: 850, lineHeight: 1.3 }}>
                  {scoring ? scoring.status.label : "No CRITIC-MCDA demo summary for this record"}
                </div>
                <div style={{ gridColumn: "1 / -1", color: t.faint, fontSize: 10.5, lineHeight: 1.45 }}>
                  {scoring
                    ? (lang === "zh" ? "该分数为演示占位，不代表该 MOF 的真实性能判断。" : "This score is an illustrative placeholder, not a validated statement about this MOF.")
                    : "CRITIC demo: not mapped"}
                </div>
                <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 7 }}>
                  <button
                    type="button"
                    onClick={() => openRecordFromOverview(item.id)}
                    style={{ ...toolbarBtn(t), justifyContent: "center", fontSize: 10.5, padding: "7px 9px" }}
                  >
                    {lang === "zh" ? "查看库记录" : "View record"}
                  </button>
                  <button
                    type="button"
                    onClick={openScoringDetails}
                    style={{ ...toolbarBtn(t), justifyContent: "center", color: t.accentText, border: `1px solid ${t.accent}`, fontSize: 10.5, padding: "7px 9px" }}
                  >
                    View scoring details
                  </button>
                </div>
              </div>
            </article>
              )
            })()
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="02" title={lang === "zh" ? "基础数据统计" : "Baseline Data Summary"} subtitle={lang === "zh" ? "仅统计当前筛选结果中的字段与来源覆盖。" : "Counts field and source coverage in the current filtered set."}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {[
            [lang === "zh" ? "当前显示" : "Showing", `${filtered.length} / ${records.length}`],
            [lang === "zh" ? "数据来源" : "Data sources", sources.length],
            [lang === "zh" ? "金属中心" : "Metal centers", metals.length],
            [lang === "zh" ? "证据等级" : "Evidence Level", evidenceLevels.length],
          ].map(([label, value]) => (
            <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13 }}>
              <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</div>
              <div style={{ color: t.textStrong, fontSize: 20, fontWeight: 850, marginTop: 6 }}>{value}</div>
            </div>
          ))}
        </div>
      </ResultLayer>

      <ResultLayer number="03" title={lang === "zh" ? "MOF 记录详情" : "MOF Record Details"} subtitle={lang === "zh" ? "展开记录后继续通过字段旁 ⓘ 查看来源、条件和整理状态。" : "Expand records and use ⓘ to inspect source, condition, and curation status."}>
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.length === 0 && (
            <Callout tone="warn">{lang === "zh" ? "当前筛选条件下暂无记录。" : "No records are available for the current filters."}</Callout>
          )}
          {filtered.map(item => (
            <div id={`mof-record-${item.id}`} key={item.id} style={{ background: t.panel, border: `1px solid ${expandedId === item.id ? t.accent : t.border}`, borderRadius: 8, padding: 13 }}>
              {(() => {
                const isSelected = selectedCompareIds.includes(item.id)
                const limitReached = selectedCompareIds.length >= 3 && !isSelected
                const scoring = getCriticSummary(item)
                return (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 900 }}>{item.name}</div>
                  <div style={{ color: t.subtle, fontSize: 11, marginTop: 4 }}>{item.formula}</div>
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
                  <BasisBadge tone="info">{zhValue(item.evidenceLevel, lang)}</BasisBadge>
                  <BasisBadge tone="proxy">{zhDataStatus(item.dataStatus, lang)}</BasisBadge>
                  <BasisBadge tone={scoring ? scoring.status.tone : "proxy"}>
                    {scoring ? `D_expected ${Number(scoring.D_expected).toFixed(3)}` : "CRITIC demo: not mapped"}
                  </BasisBadge>
                  {scoring && (
                    <BasisBadge tone="proxy">
                      {`Q ${Number(scoring.confidence_Q_clipped).toFixed(2)}`}
                    </BasisBadge>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleCompare(item)}
                    disabled={limitReached}
                    title={limitReached
                      ? (lang === "zh" ? "为保证可读性，每次最多对比 3 个候选材料。" : "For readability, compare up to 3 candidates.")
                      : undefined}
                    aria-label={isSelected
                      ? (lang === "zh" ? `取消选择 ${item.name}` : `Remove ${item.name} from comparison`)
                      : (lang === "zh" ? `加入对比 ${item.name}` : `Add ${item.name} to compare`)}
                    style={{
                      ...toolbarBtn(t),
                      padding: "4px 9px",
                      fontSize: 10,
                      color: isSelected ? t.accentText : limitReached ? t.faint : t.subtle,
                      border: `1px solid ${isSelected ? t.accent : t.borderStrong}`,
                      opacity: limitReached ? 0.6 : 1,
                      cursor: limitReached ? "not-allowed" : "pointer",
                      width: isMobile ? "100%" : "auto",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected
                      ? (lang === "zh" ? "已加入" : "Added")
                      : limitReached
                        ? (lang === "zh" ? "已达到对比上限" : "Compare limit reached")
                        : (lang === "zh" ? "加入对比" : "Add to compare")}
                  </button>
                  <button
                    type="button"
                    onClick={openScoringDetails}
                    style={{
                      ...toolbarBtn(t),
                      padding: "4px 9px",
                      fontSize: 10,
                      color: t.accentText,
                      border: `1px solid ${t.accent}`,
                      width: isMobile ? "100%" : "auto",
                      justifyContent: "center",
                    }}
                  >
                    View scoring details
                  </button>
                </div>
              </div>
                )
              })()}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(9, minmax(0, 1fr))", gap: 12, marginTop: 12 }}>
                {field(lang === "zh" ? "金属节点" : "metal nodes", item.metal)}
                {field(lang === "zh" ? "连接体" : "linker", item.linker)}
                {field(lang === "zh" ? "孔径" : "pore size",      item.poreSizeA  === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${item.poreSizeA || "—"} Å`,      "poreSizeA",  item.fieldSources)}
                {field(lang === "zh" ? "比表面积" : "surface area", item.surfaceArea === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${Number(item.surfaceArea || 0).toLocaleString()} m²/g`, "surfaceArea", item.fieldSources)}
                {field(lang === "zh" ? "CO₂ 吸附量" : "CO₂ uptake",  item.co2Uptake === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : item.co2Uptake === "—" ? "—" : `${item.co2Uptake} mmol/g`,     "co2Uptake",  item.fieldSources)}
                {field(lang === "zh" ? "带隙" : "band gap",    item.bandGap   === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : item.bandGap   === "—" ? "—" : `${item.bandGap} eV`,            "bandGap",    item.fieldSources)}
                {field(lang === "zh" ? "稳定性" : "stability", `${zhValue(item.waterStability, lang)} / ${zhValue(item.thermalStability, lang)}`)}
                {field(lang === "zh" ? "来源" : "source", zhValue(item.source, lang))}
                {field(lang === "zh" ? "证据等级" : "Evidence Level", zhValue(item.evidenceLevel, lang))}
              </div>
              <button type="button" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} style={{ ...toolbarBtn(t), marginTop: 12 }}>
                {expandedId === item.id ? (lang === "zh" ? "收起详情" : "Hide details") : (lang === "zh" ? "查看详情" : "View details")}
              </button>
              {expandedId === item.id && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
                  <div style={detailBlock}>{field(lang === "zh" ? "基础结构" : "Basic structure", `${item.topology}; ${item.formula}`)}</div>
                  <div style={detailBlock}>
                    <div style={{ display: "grid", gap: 8 }}>
                      {field(lang === "zh" ? "孔径" : "Pore size (Å)", item.poreSizeA === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${item.poreSizeA || "—"} Å`, "poreSizeA", item.fieldSources)}
                      {field(lang === "zh" ? "比表面积" : "Surface area", item.surfaceArea === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${Number(item.surfaceArea || 0).toLocaleString()} m²/g`, "surfaceArea", item.fieldSources)}
                      {field(lang === "zh" ? "孔体积" : "Pore volume", item.poreVolume === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : `${item.poreVolume || "—"} cm³/g`, "poreVolume", item.fieldSources)}
                    </div>
                  </div>
                  <div style={detailBlock}>
                    <div style={{ display: "grid", gap: 8 }}>
                      {field(lang === "zh" ? "CO₂ 吸附量" : "CO₂ uptake", item.co2Uptake === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : item.co2Uptake === "—" ? "—" : `${item.co2Uptake} mmol/g`, "co2Uptake", item.fieldSources)}
                      {field(lang === "zh" ? "带隙" : "Band gap", item.bandGap === "pending" ? safeVal(null, lang, lang === "zh" ? "待整理" : "Pending curation") : item.bandGap === "—" ? "—" : `${item.bandGap} eV`, "bandGap", item.fieldSources)}
                    </div>
                  </div>
                  <div style={detailBlock}>
                    <div style={{ display: "grid", gap: 8 }}>
                      {field(lang === "zh" ? "水稳定性" : "Water stability", zhValue(item.waterStability, lang), "waterStability", item.fieldSources)}
                      {field(lang === "zh" ? "热稳定性" : "Thermal stability", zhValue(item.thermalStability, lang), "thermalStability", item.fieldSources)}
                      {field(lang === "zh" ? "毒性关注" : "Toxicity concern", zhValue(item.toxicityConcern, lang), "toxicityConcern", item.fieldSources)}
                    </div>
                  </div>
                  <div style={detailBlock}>{field(lang === "zh" ? "催化潜力线索" : "Catalysis potential", `${item.reactionClasses.join(", ") || "—"}; ${item.activeSiteHypothesis}`)}</div>
                  <div style={detailBlock}>{field(lang === "zh" ? "数据来源 / 限制" : "Data source / Limitations", `${item.source}; ${item.limitations}`)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        <CompareTray
          count={selectedCompareIds.length}
          names={selectedCompareCandidates.map(item => item.name)}
          notice={compareNotice}
          onCompare={() => setComparisonOpen(true)}
          onClear={() => { setSelectedCompareIds([]); setCompareNotice(""); setComparisonOpen(false) }}
          t={t}
          lang={lang}
          isMobile={isMobile}
        />
      </ResultLayer>

      <ResultLayer
        number="04"
        title={lang === "zh" ? "数据质量与溯源" : "Data Quality & Provenance"}
        subtitle={lang === "zh"
          ? "从真实种子数据集实时计算的字段覆盖率、证据等级分布和整理进度。"
          : "Field coverage, evidence distribution, and curation progress computed live from Real Seed Dataset."}
      >
        <div id="data-quality-provenance">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <CopyLinkButton hash="data-quality-provenance" ariaLabel={lang === "zh" ? "复制数据质量与溯源链接" : "Copy Data Quality & Provenance link"} />
          </div>
          <div style={{ display: "grid", gap: 12, marginBottom: 14 }}>
            {/* Curation criteria checklist */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 8 }}>
                {lang === "zh" ? "描述符整理标准" : "Descriptor curation criteria"}
              </div>
              <div style={{ color: t.faint, fontSize: 11, marginBottom: 8 }}>
                {lang === "zh"
                  ? "一个描述符只有同时包含以下信息时，才应被视为已整理："
                  : "A descriptor is treated as curated only when it includes:"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 5 }}>
                {(lang === "zh"
                  ? ["数值", "必要单位或条件", "证据等级", "字段级来源记录"]
                  : ["value", "unit or condition when applicable", "evidence level", "field-level source record"]
                ).map(item => (
                  <div key={item} style={{ display: "flex", gap: 7, alignItems: "center", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, padding: "6px 9px" }}>
                    <span style={{ color: t.accentText, fontSize: 11, lineHeight: 1, flexShrink: 0 }}>✓</span>
                    <span style={{ color: t.muted, fontSize: 11 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Evidence Level Legend */}
            <EvidenceLevelLegend lang={lang} />
          </div>
          {qualityChartsReady ? (
            <DataQualitySection
              realSeedRows={realSeedRows}
              lang={lang}
              t={t}
              isMobile={isMobile}
            />
          ) : (
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, color: t.faint, fontSize: 12 }}>
              {lang === "zh" ? "数据质量图表将在基础记录就绪后加载。" : "Data-quality charts load after baseline records are ready."}
            </div>
          )}
        </div>
      </ResultLayer>

      {results && !results.unavailable && (
        <ResultLayer number="05" title={lang === "zh" ? "当前输入记录提示" : "Current Input Note"}>
          <Callout tone="success">
            {lang === "zh"
              ? `当前输入 ${inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`} 可在生态筛选、性能优先级或催化实验室中作为候选解释对象；MOF 候选库提供来源字段供复核。`
              : `Current input ${inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`} can be interpreted as a candidate in EcoScreen, Performance, or CatalysisLab; Library presents source fields for review.`}
          </Callout>
        </ResultLayer>
      )}
      <CandidateComparisonModal
        open={comparisonOpen}
        candidates={selectedCompareCandidates}
        allCandidates={records}
        onSelectionChange={setSelectedCompareIds}
        onClose={() => setComparisonOpen(false)}
        t={t}
        lang={lang}
        isMobile={isMobile}
      />
    </div>
  )
}
