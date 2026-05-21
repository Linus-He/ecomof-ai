import { useEffect, useMemo, useState } from "react"
import {
  useT, useLang, useViewport,
  FONT_MONO,
  getMofCandidates,
  toolbarBtn,
  PageHeader,
  ResultLayer,
  Callout,
  CopyLinkButton,
  FieldProvenanceButton,
  GraphDescriptorPanel,
  OrganicAcidRelevancePanel,
} from "../../shared"

const DATA_MODE = "open-mof-seed"
const PAGE_SIZE = 24

const COMPLETENESS_FIELDS = [
  "surfaceArea",
  "poreSizeA",
  "poreVolume",
  "co2Uptake",
  "bandGap",
  "waterStability",
  "thermalStability",
  "toxicityConcern",
]

const DESCRIPTOR_FILTERS = [
  { key: "surfaceArea", zh: "有比表面积", en: "Has surface area" },
  { key: "poreSizeA", zh: "有孔径", en: "Has pore size" },
  { key: "poreVolume", zh: "有孔体积", en: "Has pore volume" },
  { key: "bandGap", zh: "有带隙", en: "Has band gap" },
  { key: "provenance", zh: "有来源信息", en: "Has provenance" },
]

const DEFAULT_GRAPH_METADATA = {
  graphStatus: "pending",
  nodeTypes: [],
  edgeTypes: [],
  activeMotifs: [],
  graphCluster: "pending",
  diversityScore: null,
  graphMotifScore: 0,
  graphConfidence: "pending",
  notes: "Graph metadata pending curation.",
}

const DEFAULT_ORGANIC_ACID_RELEVANCE = {
  targetPathway: "pending",
  possibleRoles: [],
  pathwayPriorityScore: null,
  scoreStatus: "pending",
  validationNeeded: ["Organic acid pathway relevance pending curation."],
  notes: "No formic-acid-oriented role is assigned at this stage.",
}

function text(lang, zh, en) {
  return lang === "zh" ? zh : en
}

function firstValue(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue
    return value
  }
  return undefined
}

function hasValue(value) {
  if (value === undefined || value === null || value === "") return false
  if (typeof value === "number") return Number.isFinite(value)
  const normalized = String(value).trim().toLowerCase()
  return normalized !== "pending" && normalized !== "null" && normalized !== "undefined" && normalized !== "nan" && normalized !== "—"
}

function cleanValue(value, fallback = "pending") {
  return hasValue(value) ? value : fallback
}

function formatNumber(value, digits = 2) {
  if (!hasValue(value)) return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value)
  return numeric.toLocaleString(undefined, { maximumFractionDigits: digits })
}

function formatValue(value, suffix = "", lang = "zh", digits = 2) {
  if (!hasValue(value)) return text(lang, "待整理", "pending")
  const numeric = formatNumber(value, digits)
  return `${numeric ?? value}${suffix}`
}

function shortLicense(value) {
  const license = String(cleanValue(value, "pending"))
  if (license.toLowerCase().includes("cc-by")) return "CC-BY-4.0"
  if (license.toLowerCase().includes("creative commons attribution")) return "CC-BY-4.0"
  return license
}

function displayVersion(value) {
  const version = String(cleanValue(value, "pending"))
  if (version.toLowerCase() === "pending") return version
  if (/^v/i.test(version)) return version
  if (/^\d+/.test(version)) return `v${version}`
  return version
}

function normalizeStatus(status, lang) {
  const normalized = String(status || "pending").toLowerCase()
  if (normalized === "curated") return text(lang, "已整理", "curated")
  if (normalized === "missing") return text(lang, "缺失", "missing")
  if (normalized === "raw-import") return text(lang, "原始接入", "raw-import")
  return text(lang, "待整理", "pending")
}

function getDatabaseName(item) {
  return cleanValue(item.sourceDatabase || item.provenance?.sourceDatabase || item.provenance?.database, "Unknown source")
}

function descriptorValue(item, key) {
  if (key === "provenance") return getDatabaseName(item) !== "Unknown source" && hasValue(item.sourceRecordId)
  return firstValue(item[key], item.descriptors?.[key])
}

function makeFieldSource(item, key, value, unit) {
  return {
    sourceType: "open-mof-seed",
    sourceName: getDatabaseName(item),
    sourceDatabase: getDatabaseName(item),
    database: getDatabaseName(item),
    sourceRecordId: item.sourceRecordId,
    sourceVersion: item.sourceVersion,
    sourceUrl: item.sourceUrl,
    url: item.sourceUrl,
    citation: item.citation,
    license: item.license,
    curationStatus: item.descriptorCompleteness?.[key] || item.curationStatus || "pending",
    value,
    unit,
  }
}

function normalizeOpenMofRecord(item) {
  const sourceDatabase = getDatabaseName(item)
  const sourceRecordId = cleanValue(item.sourceRecordId || item.provenance?.sourceRecordId)
  const sourceVersion = cleanValue(item.sourceVersion || item.provenance?.sourceVersion)
  const sourceUrl = cleanValue(item.sourceUrl || item.provenance?.sourceUrl)
  const citation = cleanValue(item.citation || item.provenance?.citation)
  const license = cleanValue(item.license || item.provenance?.license)
  const retrievedAt = cleanValue(item.retrievedAt || item.provenance?.retrievedAt)
  const curationStatus = cleanValue(item.curationStatus || item.provenance?.curationStatus)
  const surfaceArea = firstValue(item.surfaceArea, item.descriptors?.surfaceArea)
  const poreSizeA = firstValue(item.poreSizeA, item.descriptors?.poreSizeA)
  const pldA = firstValue(item.pldA, item.descriptors?.pldA)
  const lcdA = firstValue(item.lcdA, item.descriptors?.lcdA)
  const poreVolume = firstValue(item.poreVolume, item.descriptors?.poreVolume)
  const density = firstValue(item.density, item.descriptors?.density)
  const voidFraction = firstValue(item.voidFraction, item.descriptors?.voidFraction)
  const bandGap = firstValue(item.bandGap, item.descriptors?.bandGap)
  const co2Uptake = firstValue(item.co2Uptake, item.descriptors?.co2Uptake)
  const cifFile = firstValue(item.cifFile, item.structure?.cifFile)
  const cifUrl = firstValue(item.cifUrl, item.structure?.cifUrl)
  const metalNode = cleanValue(item.metalNode || item.chemistry?.metalNode || item.metal)
  const topology = cleanValue(item.topology || item.structure?.topology)
  const linker = cleanValue(item.linker || item.chemistry?.linker)
  const descriptorCompleteness = item.descriptorCompleteness || {}

  const normalized = {
    ...item,
    id: item.id || sourceRecordId || item.name,
    name: cleanValue(item.name || sourceRecordId),
    dataMode: DATA_MODE,
    dataStatus: "open-mof-seed",
    sourceDatabase,
    sourceRecordId,
    sourceVersion,
    sourceUrl,
    citation,
    license,
    retrievedAt,
    curationStatus,
    surfaceArea,
    poreSizeA,
    pldA,
    lcdA,
    poreVolume,
    density,
    voidFraction,
    bandGap,
    co2Uptake,
    cifFile,
    cifUrl,
    metalNode,
    metal: metalNode,
    topology,
    linker,
    descriptorCompleteness,
    graphMetadata: item.graphMetadata || DEFAULT_GRAPH_METADATA,
    organicAcidRelevance: item.organicAcidRelevance || DEFAULT_ORGANIC_ACID_RELEVANCE,
    provenance: {
      ...(item.provenance || {}),
      sourceDatabase,
      sourceRecordId,
      sourceVersion,
      sourceUrl,
      citation,
      license,
      retrievedAt,
      curationStatus,
    },
  }

  normalized.fieldSources = {
    surfaceArea: makeFieldSource(normalized, "surfaceArea", surfaceArea, "m2/g"),
    poreSizeA: makeFieldSource(normalized, "poreSizeA", poreSizeA, "A"),
    pldA: makeFieldSource(normalized, "pldA", pldA, "A"),
    lcdA: makeFieldSource(normalized, "lcdA", lcdA, "A"),
    poreVolume: makeFieldSource(normalized, "poreVolume", poreVolume, "cm3/g"),
    density: makeFieldSource(normalized, "density", density, "g/cm3"),
    voidFraction: makeFieldSource(normalized, "voidFraction", voidFraction, ""),
    bandGap: makeFieldSource(normalized, "bandGap", bandGap, "eV"),
    co2Uptake: makeFieldSource(normalized, "co2Uptake", co2Uptake, ""),
  }

  return normalized
}

function summarizeRecords(records) {
  const total = records.length
  const sourceCounts = records.reduce((acc, item) => {
    const db = getDatabaseName(item)
    acc[db] = (acc[db] || 0) + 1
    return acc
  }, {})
  const countAvailable = (key) => records.filter(item => hasValue(descriptorValue(item, key))).length
  const organicPending = records.filter(item => String(item.organicAcidRelevance?.scoreStatus || "pending").toLowerCase().includes("pending")).length
  const graphPending = records.filter(item => {
    const graph = item.graphMetadata || {}
    return String(graph.graphStatus || graph.graphConfidence || "pending").toLowerCase().includes("pending")
  }).length
  return {
    total,
    sourceCounts,
    surfaceArea: countAvailable("surfaceArea"),
    poreSizeA: countAvailable("poreSizeA"),
    poreVolume: countAvailable("poreVolume"),
    bandGap: countAvailable("bandGap"),
    organicPending,
    graphPending,
  }
}

function StatusPill({ children, tone = "neutral", t }) {
  const map = {
    good: { bg: t.successSoft || t.accentSoft, fg: t.successText || t.accentText, border: t.success || t.accent },
    warn: { bg: t.warnSoft || "rgba(245,158,11,0.12)", fg: t.warn || "#b45309", border: t.warn || "#d97706" },
    neutral: { bg: t.surface, fg: t.subtle, border: t.border },
    source: { bg: t.accentSoft, fg: t.accentText, border: t.accent },
  }
  const toneStyle = map[tone] || map.neutral
  return (
    <span style={{
      alignItems: "center",
      background: toneStyle.bg,
      border: `1px solid ${toneStyle.border}`,
      borderRadius: 999,
      color: toneStyle.fg,
      display: "inline-flex",
      fontSize: 10.5,
      fontWeight: 850,
      lineHeight: 1.2,
      padding: "4px 8px",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  )
}

function FieldRow({ label, value, fieldKey, fieldSources, lang, t }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 4, marginBottom: 3 }}>
        <span style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</span>
        {fieldKey && <FieldProvenanceButton fieldKey={fieldKey} fieldLabel={label} source={fieldSources?.[fieldKey]} lang={lang} />}
      </div>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 760, lineHeight: 1.45, overflowWrap: "anywhere" }}>
        {hasValue(value) ? value : text(lang, "待整理", "pending")}
      </div>
    </div>
  )
}

function OpenMofSeedQualitySummary({ records, lang, t, isMobile }) {
  const stats = useMemo(() => summarizeRecords(records), [records])
  const sourceEntries = Object.entries(stats.sourceCounts)
  const statCards = [
    [text(lang, "总记录数", "Total records"), stats.total],
    ...sourceEntries.map(([source, count]) => [source, count]),
    [text(lang, "比表面积可用", "Surface area available"), `${stats.surfaceArea} / ${stats.total}`],
    [text(lang, "孔径可用", "Pore size available"), `${stats.poreSizeA} / ${stats.total}`],
    [text(lang, "孔体积可用", "Pore volume available"), `${stats.poreVolume} / ${stats.total}`],
    [text(lang, "带隙可用", "Band gap available"), `${stats.bandGap} / ${stats.total}`],
    [text(lang, "有机酸相关性待整理", "Organic acid relevance pending"), `${stats.organicPending} / ${stats.total}`],
    [text(lang, "图结构元数据待整理", "Graph metadata pending"), `${stats.graphPending} / ${stats.total}`],
  ]
  return (
    <section style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      display: "grid",
      gap: 12,
      padding: isMobile ? 12 : 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>
            {text(lang, "Open MOF Seed 数据质量摘要", "Open MOF Seed Data Quality Summary")}
          </div>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 3 }}>
            {text(lang, "统计基于当前加载的 seed JSON 实时计算。", "Statistics are computed from the loaded seed JSON.")}
          </div>
        </div>
        <StatusPill t={t} tone="source">open_mof_seed_candidates.json</StatusPill>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))", gap: 8 }}>
        {statCards.map(([label, value]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, minWidth: 0, padding: "9px 10px" }}>
            <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, lineHeight: 1.2, marginBottom: 6, overflowWrap: "anywhere", textTransform: "uppercase" }}>{label}</div>
            <div style={{ color: t.textStrong, fontFamily: FONT_MONO, fontSize: 14, fontWeight: 900, lineHeight: 1.2 }}>{value}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function OpenMofSeedFilters({
  filters,
  setFilters,
  sources,
  metals,
  organicStatuses,
  lang,
  t,
  isMobile,
}) {
  const controlStyle = {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 7,
    color: t.text,
    fontSize: 12,
    height: 36,
    minWidth: 0,
    padding: "0 9px",
    width: "100%",
  }
  const labelStyle = { color: t.faint, display: "grid", fontSize: 10, fontWeight: 850, gap: 5, minWidth: 0, textTransform: "uppercase" }
  const updateAvailability = (key) => {
    setFilters(prev => ({
      ...prev,
      availability: { ...prev.availability, [key]: !prev.availability[key] },
    }))
  }
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 12, padding: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.3fr 1fr 1fr 1fr", gap: 9, alignItems: "end" }}>
        <label style={labelStyle}>
          {text(lang, "搜索", "Search")}
          <input
            value={filters.query}
            onChange={event => setFilters(prev => ({ ...prev, query: event.target.value }))}
            placeholder={text(lang, "搜索名称、记录 ID、数据库或金属", "Search name, record ID, database, or metal")}
            style={controlStyle}
          />
        </label>
        <label style={labelStyle}>
          {text(lang, "Source Database", "Source Database")}
          <select value={filters.source} onChange={event => setFilters(prev => ({ ...prev, source: event.target.value }))} style={controlStyle}>
            <option value="all">All</option>
            {sources.map(source => <option key={source} value={source}>{source}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          {text(lang, "Metal Node", "Metal Node")}
          <select value={filters.metal} onChange={event => setFilters(prev => ({ ...prev, metal: event.target.value }))} style={controlStyle}>
            <option value="all">All</option>
            {metals.map(metal => <option key={metal} value={metal}>{metal}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          {text(lang, "Organic Acid Relevance", "Organic Acid Relevance")}
          <select value={filters.organicStatus} onChange={event => setFilters(prev => ({ ...prev, organicStatus: event.target.value }))} style={controlStyle}>
            <option value="all">All</option>
            {organicStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            {!organicStatuses.includes("hypothesis") && <option value="hypothesis">Hypothesis</option>}
            {!organicStatuses.includes("literature-derived") && <option value="literature-derived">Literature-derived</option>}
            {!organicStatuses.includes("experiment-supported") && <option value="experiment-supported">Experiment-supported</option>}
          </select>
        </label>
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {DESCRIPTOR_FILTERS.map(filter => {
          const active = Boolean(filters.availability[filter.key])
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => updateAvailability(filter.key)}
              aria-pressed={active}
              style={{
                ...toolbarBtn(t),
                background: active ? t.accentSoft : t.panel,
                border: `1px solid ${active ? t.accent : t.border}`,
                color: active ? t.accentText : t.subtle,
                fontSize: 11,
                fontWeight: 850,
                padding: "6px 9px",
              }}
            >
              {text(lang, filter.zh, filter.en)}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setFilters({ query: "", source: "all", metal: "all", organicStatus: "all", availability: {} })}
          style={{ ...toolbarBtn(t), fontSize: 11, marginLeft: "auto", padding: "6px 9px" }}
        >
          {text(lang, "重置筛选", "Reset filters")}
        </button>
      </div>
    </section>
  )
}

function DescriptorLine({ label, value, fieldKey, fieldSources, lang, t, compact = false }) {
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 6,
      display: "grid",
      gap: compact ? 2 : 4,
      minWidth: 0,
      padding: compact ? "7px 8px" : "8px 9px",
    }}>
      <FieldRow label={label} value={value} fieldKey={fieldKey} fieldSources={fieldSources} lang={lang} t={t} />
    </div>
  )
}

function OpenMofSeedCard({ item, expanded, onToggle, lang, t, isMobile }) {
  const db = getDatabaseName(item)
  const geometryCurated = ["surfaceArea", "poreSizeA", "pldA", "lcdA", "poreVolume", "density", "voidFraction"].some(key => hasValue(item[key]))
  const electronicAvailable = hasValue(item.bandGap)
  const sourceLine = `${db} · ${displayVersion(item.sourceVersion)} · ${shortLicense(item.license)}`
  return (
    <article style={{
      background: t.panel,
      border: `1px solid ${expanded ? t.accent : t.border}`,
      borderRadius: 8,
      boxShadow: expanded ? t.shadowSm : "none",
      display: "grid",
      gap: 12,
      minWidth: 0,
      padding: 13,
    }}>
      <div style={{ display: "grid", gap: 7 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900, lineHeight: 1.25, overflowWrap: "anywhere" }}>{item.name}</div>
            <div style={{ color: t.faint, fontFamily: FONT_MONO, fontSize: 10.5, lineHeight: 1.4, marginTop: 3, overflowWrap: "anywhere" }}>{item.sourceRecordId}</div>
          </div>
          <StatusPill t={t} tone="source">{db}</StatusPill>
        </div>
        <div style={{ color: t.subtle, fontSize: 11.5, fontWeight: 760, lineHeight: 1.4, overflowWrap: "anywhere" }}>{sourceLine}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
        <DescriptorLine label={text(lang, "金属节点", "Metal node")} value={item.metalNode} lang={lang} t={t} compact />
        <DescriptorLine label={text(lang, "拓扑", "Topology")} value={item.topology} lang={lang} t={t} compact />
      </div>
      <DescriptorLine label={text(lang, "配体状态", "Linker status")} value={item.linker} lang={lang} t={t} compact />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <DescriptorLine label="Surface area" value={formatValue(item.surfaceArea, " m2/g", lang)} fieldKey="surfaceArea" fieldSources={item.fieldSources} lang={lang} t={t} compact />
        <DescriptorLine label="PLD" value={formatValue(item.pldA, " A", lang)} fieldKey="pldA" fieldSources={item.fieldSources} lang={lang} t={t} compact />
        <DescriptorLine label="LCD" value={formatValue(item.lcdA, " A", lang)} fieldKey="lcdA" fieldSources={item.fieldSources} lang={lang} t={t} compact />
        <DescriptorLine label="Pore volume" value={formatValue(item.poreVolume, " cm3/g", lang)} fieldKey="poreVolume" fieldSources={item.fieldSources} lang={lang} t={t} compact />
        {electronicAvailable && <DescriptorLine label="Band gap" value={formatValue(item.bandGap, " eV", lang)} fieldKey="bandGap" fieldSources={item.fieldSources} lang={lang} t={t} compact />}
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        <StatusPill t={t} tone={geometryCurated ? "good" : "neutral"}>
          {geometryCurated ? text(lang, "几何描述符已接入", "Geometry curated") : text(lang, "几何描述符待整理", "Geometry pending")}
        </StatusPill>
        {electronicAvailable && <StatusPill t={t} tone="good">{text(lang, "电子描述符可用", "Electronic descriptor available")}</StatusPill>}
        <StatusPill t={t} tone="warn">{text(lang, "有机酸 pending", "Organic acid pending")}</StatusPill>
      </div>

      <button type="button" onClick={onToggle} style={{ ...toolbarBtn(t), justifyContent: "center", width: "100%" }}>
        {expanded ? text(lang, "收起详情", "Hide details") : text(lang, "查看数据库详情", "View database details")}
      </button>
      {expanded && <OpenMofSeedDetailPanel item={item} lang={lang} t={t} isMobile={isMobile} />}
    </article>
  )
}

function DetailBlock({ title, children, t }) {
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, minWidth: 0, padding: 12 }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{title}</div>
      {children}
    </section>
  )
}

function AdvancedMetadata({ item, lang, t, isMobile }) {
  const [graphOpen, setGraphOpen] = useState(false)
  const [organicOpen, setOrganicOpen] = useState(false)
  const buttonStyle = { ...toolbarBtn(t), justifyContent: "space-between", padding: "8px 10px", width: "100%" }
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button type="button" onClick={() => setGraphOpen(prev => !prev)} style={buttonStyle}>
        <span>{text(lang, "Advanced graph metadata", "Advanced graph metadata")}</span>
        <span>{graphOpen ? "−" : "+"}</span>
      </button>
      {graphOpen && <GraphDescriptorPanel graphMetadata={item.graphMetadata} t={t} lang={lang} isMobile={isMobile} />}
      <button type="button" onClick={() => setOrganicOpen(prev => !prev)} style={buttonStyle}>
        <span>{text(lang, "Organic acid relevance metadata", "Organic acid relevance metadata")}</span>
        <span>{organicOpen ? "−" : "+"}</span>
      </button>
      {organicOpen && <OrganicAcidRelevancePanel relevance={item.organicAcidRelevance} candidate={item} t={t} lang={lang} isMobile={isMobile} />}
    </div>
  )
}

function OpenMofSeedDetailPanel({ item, lang, t, isMobile }) {
  const provenanceRows = [
    ["Database", item.sourceDatabase],
    ["Record ID", item.sourceRecordId],
    ["Version", item.sourceVersion],
    ["Source URL", item.sourceUrl],
    ["Citation", item.citation],
    ["License", item.license],
    ["Retrieved at", item.retrievedAt],
    ["Curation status", normalizeStatus(item.curationStatus, lang)],
  ]
  const descriptorRows = [
    ["Surface area", formatValue(item.surfaceArea, " m2/g", lang), "surfaceArea"],
    ["Pore size", formatValue(item.poreSizeA, " A", lang), "poreSizeA"],
    ["PLD", formatValue(item.pldA, " A", lang), "pldA"],
    ["LCD", formatValue(item.lcdA, " A", lang), "lcdA"],
    ["Pore volume", formatValue(item.poreVolume, " cm3/g", lang), "poreVolume"],
    ["Density", formatValue(item.density, " g/cm3", lang), "density"],
    ["Void fraction", formatValue(item.voidFraction, "", lang), "voidFraction"],
    ["Band gap", formatValue(item.bandGap, " eV", lang), "bandGap"],
    ["CO2 uptake", formatValue(item.co2Uptake, "", lang), "co2Uptake"],
    ["CIF file / CIF URL", `${formatValue(item.cifFile, "", lang)} / ${formatValue(item.cifUrl, "", lang)}`],
  ]
  return (
    <div style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 12, minWidth: 0, paddingTop: 12 }}>
      <DetailBlock title="Source & Provenance" t={t}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {provenanceRows.map(([label, value]) => (
            <DescriptorLine key={label} label={label} value={formatValue(value, "", lang)} lang={lang} t={t} compact />
          ))}
        </div>
      </DetailBlock>

      <DetailBlock title="Geometry / Electronic Descriptors" t={t}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {descriptorRows.map(([label, value, fieldKey]) => (
            <DescriptorLine key={label} label={label} value={value} fieldKey={fieldKey} fieldSources={item.fieldSources} lang={lang} t={t} compact />
          ))}
        </div>
      </DetailBlock>

      <DetailBlock title="Descriptor Completeness" t={t}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
          {COMPLETENESS_FIELDS.map(key => {
            const status = item.descriptorCompleteness?.[key] || "pending"
            const normalized = String(status).toLowerCase()
            const tone = normalized === "curated" ? "good" : normalized === "missing" ? "warn" : "neutral"
            return (
              <div key={key} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, display: "flex", justifyContent: "space-between", gap: 8, minWidth: 0, padding: "8px 9px" }}>
                <span style={{ color: t.subtle, fontSize: 10.5, fontWeight: 850, overflowWrap: "anywhere" }}>{key}</span>
                <StatusPill t={t} tone={tone}>{normalizeStatus(status, lang)}</StatusPill>
              </div>
            )
          })}
        </div>
      </DetailBlock>

      <DetailBlock title="Organic Acid Boundary" t={t}>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.7 }}>
          {text(
            lang,
            "有机酸路径相关性：待整理。该记录不代表具有甲酸路径导向活性。有机酸相关性需要文献、DFT 或实验数据支持。当前不对该记录赋予甲酸路径结论。",
            "Organic-acid relevance: pending. This record does not imply formic-acid-oriented activity. Organic-acid relevance requires literature, DFT, or experimental support. No formic-acid-oriented role is assigned at this stage."
          )}
        </div>
      </DetailBlock>

      <AdvancedMetadata item={item} lang={lang} t={t} isMobile={isMobile} />
    </div>
  )
}

function passesFilters(item, filters) {
  const query = filters.query.trim().toLowerCase()
  if (query) {
    const haystack = [item.name, item.sourceRecordId, item.sourceDatabase, item.metalNode, item.topology, item.linker].join(" ").toLowerCase()
    if (!haystack.includes(query)) return false
  }
  if (filters.source !== "all" && getDatabaseName(item) !== filters.source) return false
  if (filters.metal !== "all" && String(item.metalNode || "").toLowerCase() !== filters.metal.toLowerCase()) return false
  const selectedAvailability = Object.entries(filters.availability).filter(([, active]) => active).map(([key]) => key)
  if (selectedAvailability.some(key => !hasValue(descriptorValue(item, key)))) return false
  if (filters.organicStatus !== "all") {
    const status = String(item.organicAcidRelevance?.scoreStatus || "pending").toLowerCase()
    if (!status.includes(filters.organicStatus.toLowerCase())) return false
  }
  return true
}

export function MOFLibraryTab() {
  const t = useT()
  const lang = useLang()
  const { isMobile } = useViewport()
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState("loading")
  const [filters, setFilters] = useState({ query: "", source: "all", metal: "all", organicStatus: "all", availability: {} })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    let active = true
    setStatus("loading")
    getMofCandidates({ mode: DATA_MODE, throwOnError: true })
      .then(data => {
        if (!active) return
        const normalized = Array.isArray(data) ? data.map(normalizeOpenMofRecord) : []
        setRows(normalized)
        setStatus(normalized.length ? "loaded" : "empty")
      })
      .catch(error => {
        console.warn("Open MOF Seed data could not be loaded.", error)
        if (!active) return
        setRows([])
        setStatus("fallback")
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
    setExpandedId(null)
  }, [filters])

  const sourceCounts = useMemo(() => summarizeRecords(rows).sourceCounts, [rows])
  const sources = useMemo(() => Object.keys(sourceCounts).sort(), [sourceCounts])
  const metals = useMemo(() => [...new Set(rows.map(item => item.metalNode).filter(hasValue))].sort(), [rows])
  const organicStatuses = useMemo(() => {
    const values = [...new Set(rows.map(item => String(item.organicAcidRelevance?.scoreStatus || "pending").toLowerCase()))]
    return values.length ? values.sort() : ["pending"]
  }, [rows])
  const filteredRecords = useMemo(() => rows.filter(item => passesFilters(item, filters)), [rows, filters])
  const visibleRecords = useMemo(() => filteredRecords.slice(0, visibleCount), [filteredRecords, visibleCount])
  const stats = useMemo(() => summarizeRecords(rows), [rows])

  const statusLine = text(
    lang,
    `当前状态：${stats.total} 条 Open MOF Seed 记录 · ${sourceCounts["CoRE MOF DB"] || 0} 条来自 CoRE MOF DB · ${sourceCounts["QMOF Database"] || 0} 条来自 QMOF Database。在没有文献、DFT 或实验支持前，有机酸路径相关性保持 pending。`,
    `Current status: ${stats.total} Open MOF Seed records · ${sourceCounts["CoRE MOF DB"] || 0} from CoRE MOF DB · ${sourceCounts["QMOF Database"] || 0} from QMOF Database. Organic-acid pathway relevance remains pending unless supported by literature, DFT, or experiment.`
  )

  return (
    <div id="library" style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
      <PageHeader
        title="Open MOF Seed Library / 多源开源 MOF 种子库"
        subtitle={text(
          lang,
          "一个带有来源追踪的轻量级多源 MOF 种子数据层，整合来自公开数据库的结构、几何与电子描述符。",
          "A lightweight, provenance-aware seed layer integrating open MOF records from multiple public sources."
        )}
        action={<CopyLinkButton hash="library" ariaLabel={text(lang, "复制 MOF Library 链接", "Copy MOF Library link")} />}
      />

      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderLeft: `4px solid ${t.accent}`, borderRadius: 8, color: t.subtle, fontSize: 12.5, lineHeight: 1.65, padding: "11px 13px" }}>
        <strong style={{ color: t.textStrong }}>{text(lang, "当前数据层：Open MOF Seed。", "Current data layer: Open MOF Seed. ")}</strong>
        {statusLine}
      </div>

      {status === "loading" && <Callout tone="info">{text(lang, "正在加载 Open MOF Seed 数据…", "Loading Open MOF Seed data...")}</Callout>}
      {status === "fallback" && <Callout tone="warn">{text(lang, "Open MOF Seed 数据加载失败。请刷新页面或检查 GitHub Pages 数据路径。", "Open MOF Seed data could not be loaded. Please refresh or check the GitHub Pages data path.")}</Callout>}
      {status === "empty" && <Callout tone="warn">{text(lang, "当前 Open MOF Seed 文件暂无记录。", "The current Open MOF Seed file has no records.")}</Callout>}

      <OpenMofSeedQualitySummary records={rows} lang={lang} t={t} isMobile={isMobile} />

      <OpenMofSeedFilters
        filters={filters}
        setFilters={setFilters}
        sources={sources}
        metals={metals}
        organicStatuses={organicStatuses}
        lang={lang}
        t={t}
        isMobile={isMobile}
      />

      <ResultLayer
        number="01"
        title={text(lang, "Open MOF Seed 记录", "Open MOF Seed Records")}
        subtitle={text(
          lang,
          `${filteredRecords.length} / ${rows.length} 条记录匹配当前筛选。默认显示 ${PAGE_SIZE} 条，点击加载更多继续浏览。`,
          `${filteredRecords.length} / ${rows.length} records match the current filters. The page renders ${PAGE_SIZE} records first; use Load more to continue.`
        )}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12, minWidth: 0 }}>
          {visibleRecords.map(item => (
            <OpenMofSeedCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(prev => prev === item.id ? null : item.id)}
              lang={lang}
              t={t}
              isMobile={isMobile}
            />
          ))}
        </div>
        {!visibleRecords.length && (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.faint, fontSize: 12, marginTop: 12, padding: 14 }}>
            {text(lang, "当前筛选条件下没有记录。", "No records match the current filters.")}
          </div>
        )}
        {visibleRecords.length < filteredRecords.length && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
            <button type="button" onClick={() => setVisibleCount(count => count + PAGE_SIZE)} style={{ ...toolbarBtn(t), color: t.accentText, border: `1px solid ${t.accent}`, justifyContent: "center", minWidth: 160 }}>
              {text(lang, "加载更多", "Load more")}
            </button>
          </div>
        )}
      </ResultLayer>
    </div>
  )
}
