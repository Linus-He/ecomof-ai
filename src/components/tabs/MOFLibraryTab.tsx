// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { ArrowSquareOut, MagnifyingGlass, ShieldCheck, WarningCircle } from "@phosphor-icons/react"
import {
  useT, useLang, useViewport,
  FONT_SANS,
  buildCandidateSearchText,
  getGlobalMofCandidates,
  getGasAdsorptionRecordsV2,
  getGasAdsorptionV2CollectionReport,
  getMofIdentityResolutionReport,
  getGasStructureProxyValidationReport,
  getMofIdentityRegistry,
  getCsdStructurePilotManifest,
  getCsdMofPublicCatalog,
  getReadableMofLabel,
  toolbarBtn,
  PageHeader,
  ResultLayer,
  Callout,
  CopyLinkButton,
  FieldProvenanceButton,
  GraphDescriptorPanel,
  OrganicAcidRelevancePanel,
  getCoreDescriptorCompleteness,
  normalizeUnitLabel,
} from "../../shared"
import { buildUnifiedMofRows } from "../../utils/unifiedMofDatabase"
import { validateStructureProxy } from "../../utils/gasStructureProxyValidation"
import { MofRationaleCard } from "../catalysis/MofRationaleCard"
import { ReactionFingerprintPanel } from "../catalysis/ReactionFingerprintPanel"
import { ReactionReadinessTags } from "../catalysis/ReactionReadinessTags"
import { useMofReactionProfile } from "../catalysis/reactionRationaleData"
import { DataQualityAuditPanel } from "../data-quality/DataQualityAuditPanel"
import { MofStructureWorkbench } from "../mof-structure/MofStructureWorkbench"
import { fetchDataJson } from "../../services/dataService"
import csdCommonAliases from "../../data/csdCommonAliases.json"

const DATA_MODE = "core-mof-2024-cr"
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

function nameStatusLabel(item, lang) {
  const type = item?.displayNameType || item?.nameCuration?.status || "manual_curation_needed"
  if (type === "recognized_mof_name" || type === "recognized") return text(lang, "已识别通用名", "Recognized common name")
  if (type === "explicit_name" || type === "curated") return text(lang, "已整理名称", "Curated name")
  if (type === "generic_source_record" || type === "database_record") return text(lang, "原始数据库记录", "Generic source record")
  if (type === "source_record_id_only") return text(lang, "原始记录 ID", "Source record ID only")
  if (type === "ambiguous_name") return text(lang, "名称存在歧义", "Ambiguous name")
  return text(lang, "需要人工整理", "Manual curation needed")
}

function nameReasonText(item, lang) {
  if (lang !== "zh") return item?.nameCuration?.reason || "Name source pending curation."
  if (item?.nameCuration?.needsManualNameCuration) {
    return "该记录当前只识别到原始结构编号、CIF 文件名或数据库记录 ID，尚未匹配到通用 MOF 名称。"
  }
  return "该记录已匹配到可展示名称，原始记录 ID 仍保留在 provenance 中。"
}

function getDatabaseName(item) {
  return cleanValue(item.sourceDatabase || item.provenance?.sourceDatabase || item.provenance?.database, "Unknown source")
}

function looksLikeRawRecordId(value) {
  const raw = String(value || "")
  const normalized = raw.toLowerCase()
  return (
    raw.length > 22 ||
    normalized.includes("_si_") ||
    normalized.includes("_pacman") ||
    normalized.includes("jacs.") ||
    (normalized.includes("ja") && normalized.includes("_")) ||
    normalized.startsWith("qmof-")
  )
}

function getDisplayName(record) {
  const explicitName = firstValue(record.displayName, record.commonName, record.name, record.mofName, record.structure?.name)
  if (explicitName && !looksLikeRawRecordId(explicitName)) return explicitName
  const database = getDatabaseName(record)
  if (database.includes("CoRE")) return "CoRE MOF record"
  if (database.includes("QMOF")) return "QMOF record"
  return "MOF source record"
}

function descriptorValue(item, key) {
  if (key === "provenance") return getDatabaseName(item) !== "Unknown source" && hasValue(item.sourceRecordId)
  return firstValue(item[key], item.descriptors?.[key])
}

function makeFieldSource(item, key, value, unit) {
  return {
    sourceType: "core-mof-2024-cr",
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
    name: item.name || sourceRecordId,
    displayName: item.displayName || getDisplayName({ ...item, sourceDatabase, provenance: { ...(item.provenance || {}), sourceDatabase } }),
    displayNameType: item.displayNameType || "generic_source_record",
    aliasNames: item.aliasNames || [],
    rawName: item.rawName || item.name || item.cifFile || sourceRecordId,
    nameCuration: item.nameCuration || {
      status: "pending",
      confidence: "low",
      needsManualNameCuration: true,
      reason: "Name curation status pending.",
    },
    dataMode: DATA_MODE,
    dataStatus: item.dataStatus || "core-mof-2024-cr",
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

  const fallbackFieldSources = {
    surfaceArea: makeFieldSource(normalized, "surfaceArea", surfaceArea, normalizeUnitLabel("m2/g")),
    poreSizeA: makeFieldSource(normalized, "poreSizeA", poreSizeA, normalizeUnitLabel("A")),
    pldA: makeFieldSource(normalized, "pldA", pldA, normalizeUnitLabel("A")),
    lcdA: makeFieldSource(normalized, "lcdA", lcdA, normalizeUnitLabel("A")),
    poreVolume: makeFieldSource(normalized, "poreVolume", poreVolume, normalizeUnitLabel("cm3/g")),
    density: makeFieldSource(normalized, "density", density, normalizeUnitLabel("g/cm3")),
    voidFraction: makeFieldSource(normalized, "voidFraction", voidFraction, ""),
    bandGap: makeFieldSource(normalized, "bandGap", bandGap, "eV"),
    co2Uptake: makeFieldSource(normalized, "co2Uptake", co2Uptake, ""),
  }
  normalized.fieldSources = { ...fallbackFieldSources, ...(item.fieldSources || {}) }

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

function StatusBadge({ children, tone = "neutral", t }) {
  const map = {
    good: { bg: t.successSoft || t.accentSoft, fg: t.successText || t.accentText, border: t.success || t.accent },
    warn: { bg: t.warnSoft || "rgba(148,163,184,0.12)", fg: t.warn || "#b45309", border: t.warn || "#d97706" },
    neutral: { bg: t.surface, fg: t.subtle, border: t.border },
    source: { bg: t.accentSoft, fg: t.accentText, border: t.accent },
  }
  const toneStyle = map[tone] || map.neutral
  return (
    <span style={{
      alignItems: "center",
      background: toneStyle.bg,
      border: `1px solid ${toneStyle.border}`,
      borderRadius: 6,
      color: toneStyle.fg,
      display: "inline-flex",
      fontSize: 10.5,
      fontWeight: 850,
      gap: 5,
      lineHeight: 1.2,
      padding: "4px 8px",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  )
}

function normalizeMofSearch(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[‐‑‒–—−]/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
}

function identitySearchText(identity) {
  return [
    identity.canonicalName,
    ...(identity.searchAliases || []),
    identity.ccdcNumber,
    identity.associatedPaper?.doi,
    identity.mofClass,
    identity.mofFamily,
    identity.linker?.name,
    identity.linker?.abbreviation,
    identity.metalCluster,
    identity.topology,
  ].filter(Boolean).join(" ")
}

function buildPropertySearchEntries(rows, anatomyRecords) {
  const localEntries = rows.map(item => ({
    id: `property:${item.id}`,
    kind: "property",
    label: [item.commonName, item.displayName]
      .find(name => name && !/^(CoRE MOF record|MOF source record)$/i.test(String(name)))
      || item.csdRefcode
      || item.sourceRecordId,
    searchText: [
      item.commonName,
      item.displayName,
      item.name,
      item.csdRefcode,
      item.sourceRecordId,
      ...(item.aliases || []),
      ...(item.aliasNames || []),
    ].filter(Boolean).join(" "),
    localRecord: item,
    identity: null,
  }))
  const localByRefcode = new Map()
  const localByName = new Map()
  rows.forEach(item => {
    const refcode = normalizeMofSearch(item.csdRefcode || item.sourceRecordId)
    if (refcode) localByRefcode.set(refcode, item)
    ;[
      item.commonName,
      item.displayName,
      item.name,
      ...(item.aliases || []),
      ...(item.aliasNames || []),
    ].forEach(name => {
      const normalized = normalizeMofSearch(name)
      if (normalized && !localByName.has(normalized)) localByName.set(normalized, item)
    })
  })
  const curatedByName = new Map(
    (csdCommonAliases.aliases || []).flatMap(entry => [entry.canonicalName, ...(entry.searchAliases || [])]
      .map(name => [normalizeMofSearch(name), entry])),
  )
  const identityRecords = [...(anatomyRecords || [])]
  ;(csdCommonAliases.aliases || []).forEach(curated => {
    if (!identityRecords.some(item => normalizeMofSearch(item.canonicalName) === normalizeMofSearch(curated.canonicalName))) {
      identityRecords.push(curated)
    }
  })
  const identityEntries = identityRecords.map(identity => {
    const curated = curatedByName.get(normalizeMofSearch(identity.canonicalName))
    const mergedIdentity = curated ? {
      ...identity,
      ...curated,
      identityPage: curated.identityPage || identity.identityPage,
      associatedPaper: curated.associatedPaper || identity.associatedPaper,
      ccdcNumber: curated.ccdcNumber || identity.ccdcNumber,
      searchAliases: [...new Set([...(identity.searchAliases || []), ...(curated.searchAliases || [])])],
    } : identity
    const refcodes = [
      mergedIdentity.preferredRefcode,
      ...(mergedIdentity.refcodes || []),
    ].map(normalizeMofSearch).filter(Boolean)
    const names = [
      mergedIdentity.canonicalName,
      ...(mergedIdentity.searchAliases || []),
    ].map(normalizeMofSearch).filter(Boolean)
    const localRecord = refcodes.map(code => localByRefcode.get(code)).find(Boolean)
      || names.map(name => localByName.get(name)).find(Boolean)
      || null
    return {
      id: `identity:${mergedIdentity.id || mergedIdentity.slug || mergedIdentity.canonicalName}`,
      kind: localRecord ? "identity-linked" : "identity-only",
      label: mergedIdentity.canonicalName,
      searchText: identitySearchText(mergedIdentity),
      localRecord,
      identity: mergedIdentity,
    }
  })
  return [...identityEntries, ...localEntries]
}

function PhysicochemicalSearchPanel({ rows, anatomyRecords, query, setQuery, submittedQuery, setSubmittedQuery, selected, onSelect, lang, t, isMobile }) {
  const searchEntries = useMemo(() => buildPropertySearchEntries(rows, anatomyRecords), [anatomyRecords, rows])
  const normalizedQuery = normalizeMofSearch(submittedQuery)
  const matches = useMemo(() => {
    if (!normalizedQuery) return []
    return searchEntries
      .filter(entry => normalizeMofSearch(entry.searchText).includes(normalizedQuery))
      .sort((a, b) => {
        const exactA = normalizeMofSearch(a.label) === normalizedQuery ? 1 : 0
        const exactB = normalizeMofSearch(b.label) === normalizedQuery ? 1 : 0
        if (exactA !== exactB) return exactB - exactA
        if (a.kind !== b.kind) return a.kind === "property" || a.kind === "identity-linked" ? -1 : 1
        return String(a.label).localeCompare(String(b.label), lang === "zh" ? "zh-CN" : "en")
      })
      .filter((entry, index, all) => all.findIndex(candidate => (
        normalizeMofSearch(candidate.label) === normalizeMofSearch(entry.label)
        && normalizeMofSearch(candidate.localRecord?.csdRefcode || candidate.localRecord?.sourceRecordId)
          === normalizeMofSearch(entry.localRecord?.csdRefcode || entry.localRecord?.sourceRecordId)
      )) === index)
      .slice(0, 12)
  }, [lang, normalizedQuery, searchEntries])
  const record = selected?.localRecord || null
  const identity = selected?.identity || null
  const propertyRows = record ? [
    [text(lang, "比表面积", "Surface area"), formatValue(record.surfaceArea, ` ${normalizeUnitLabel("m2/g")}`, lang), "surfaceArea"],
    [text(lang, "孔体积", "Pore volume"), formatValue(record.poreVolume, ` ${normalizeUnitLabel("cm3/g")}`, lang), "poreVolume"],
    ["PLD", formatValue(record.pldA || record.poreSizeA, ` ${normalizeUnitLabel("A")}`, lang), "pldA"],
    ["LCD", formatValue(record.lcdA, ` ${normalizeUnitLabel("A")}`, lang), "lcdA"],
    [text(lang, "密度", "Density"), formatValue(record.density, ` ${normalizeUnitLabel("g/cm3")}`, lang), "density"],
    [text(lang, "空隙率", "Void fraction"), formatValue(record.voidFraction, "", lang), "voidFraction"],
  ] : []
  const submit = event => {
    event?.preventDefault?.()
    const trimmed = query.trim()
    setSubmittedQuery(trimmed)
    if (!trimmed) onSelect(null)
  }

  return (
    <section data-testid="mof-physicochemical-search" style={{ border: 0, display: "grid", gap: 13, padding: isMobile ? "10px 0 15px" : "12px 0 17px" }}>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6, maxWidth: 980, minWidth: 0, width: "100%" }}>
          <span style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
            <span style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{text(lang, "物化性质查询", "Physicochemical property search")}</span>
            <StatusBadge t={t} tone="source">{rows.length.toLocaleString()} {text(lang, "条性质记录", "property records")} · {anatomyRecords.length.toLocaleString()} {text(lang, "条身份文献", "identity records")}</StatusBadge>
          </span>
          <div data-testid="mof-property-search-field" style={{ alignItems: "center", background: t.panel, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 7, boxShadow: "none", display: "flex", gap: 8, minWidth: 0, padding: "0 10px" }}>
            <MagnifyingGlass aria-hidden="true" color={t.faint} size={17} weight="bold" />
            <input
              type="search"
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setSubmittedQuery("")
                onSelect(null)
              }}
              placeholder={text(lang, "输入 MOF 名称、CSD Refcode、CCDC 号或 DOI", "MOF name, CSD Refcode, CCDC number, or DOI")}
              style={{ appearance: "none", background: "transparent", border: 0, boxShadow: "none", color: t.textStrong, fontFamily: FONT_SANS, fontSize: 12, height: 40, minWidth: 0, outline: "none", WebkitAppearance: "none", width: "100%" }}
            />
            <button type="submit" style={{ alignItems: "center", alignSelf: "stretch", background: t.accent, border: 0, borderRadius: 6, color: "#fff", cursor: "pointer", display: "inline-flex", flex: "0 0 auto", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 900, gap: 7, justifyContent: "center", margin: 4, padding: "0 16px" }}>
              <MagnifyingGlass aria-hidden="true" size={16} weight="bold" />
              {text(lang, "确认查询", "Search")}
            </button>
          </div>
        </label>
      </form>
      {submittedQuery ? (
        <div data-testid="mof-property-search-results" style={{ border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", overflow: "hidden" }}>
          {matches.length ? matches.map(entry => (
            <button
              key={entry.id}
              type="button"
              onClick={() => {
                onSelect(entry)
                setQuery(entry.label)
              }}
              style={{ alignItems: "center", background: entry.id === selected?.id ? t.badgeInfoBg : t.panel, border: 0, borderBottom: `1px solid ${t.border}`, color: t.textStrong, cursor: "pointer", display: "grid", fontFamily: FONT_SANS, gap: 3, gridTemplateColumns: "minmax(0, 1fr) auto", padding: "10px 12px", textAlign: "left" }}
            >
              <span style={{ display: "grid", gap: 3, minWidth: 0 }}>
                <strong style={{ fontSize: 12.2 }}>{entry.label}</strong>
                <span style={{ color: t.faint, fontSize: 10.4, overflowWrap: "anywhere" }}>
                  {entry.localRecord
                    ? `CSD ${entry.localRecord.csdRefcode || entry.localRecord.sourceRecordId} · ${entry.localRecord.metalNode || entry.identity?.mofClass || "—"} · ${entry.localRecord.topology || entry.identity?.topology || "—"}`
                    : `${entry.identity?.mofClass || "MOF"} · DOI ${entry.identity?.associatedPaper?.doi || text(lang, "待登记", "pending")}`}
                </span>
              </span>
              <StatusBadge t={t} tone={entry.localRecord ? "good" : "warn"}>
                {entry.localRecord ? text(lang, "有本地性质记录", "Local properties") : text(lang, "仅身份与文献", "Identity + paper only")}
              </StatusBadge>
            </button>
          )) : (
            <div style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.65, padding: "12px 14px" }}>
              {text(lang, "当前身份目录与本地性质库均未找到该名称。请尝试 DOI、CCDC 号或其他命名；系统不会用近似名称补写性质。", "No match was found in the identity catalog or local property index. Try a DOI, CCDC number, or alternate name; properties are never filled from a similar name.")}
            </div>
          )}
        </div>
      ) : null}
      {selected ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8 }}>
            <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{selected.label}</strong>
            <StatusBadge t={t} tone={record?.fairMofsCrossValidation ? "good" : record ? "neutral" : "warn"}>
              <ShieldCheck aria-hidden="true" size={13} weight="bold" />
              {record?.fairMofsCrossValidation ? text(lang, "FAIR‑MOFs 精确交叉记录", "Exact FAIR-MOFs cross-record") : record ? text(lang, "CoRE 主性质层", "CoRE primary layer") : text(lang, "无可授权本地性质记录", "No licensed local property record")}
            </StatusBadge>
          </div>
          {record ? (
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(6, minmax(0, 1fr))" }}>
              {propertyRows.map(([label, value, fieldKey]) => (
                <DescriptorLine key={label} label={label} value={value} fieldKey={fieldKey} fieldSources={record.fieldSources} lang={lang} t={t} compact />
              ))}
            </div>
          ) : (
            <div style={{ background: t.surface, border: `1px solid ${t.warn || t.border}`, borderRadius: 8, display: "grid", gap: 10, padding: "12px 14px" }}>
              <div style={{ alignItems: "flex-start", display: "flex", gap: 8 }}>
                <WarningCircle aria-hidden="true" color={t.warn} size={18} weight="duotone" />
                <span style={{ color: t.textStrong, fontSize: 11.4, lineHeight: 1.65 }}>
                  {text(
                    lang,
                    "名称与原始文献身份已登记，但本站没有能够通过精确标识符连接、且许可允许本地使用的结构／物化性质记录。不会从同系列材料、同一论文或近似名称推断数值。",
                    "The name and source-paper identity are registered, but this deployment has no structure or physicochemical record that can be linked by an exact identifier under an applicable licence. Values are not inferred from a related material, shared paper, or similar name.",
                  )}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {identity?.associatedPaper?.url ? (
                  <a href={identity.associatedPaper.url} target="_blank" rel="noreferrer" style={{ alignItems: "center", color: t.accentText, display: "inline-flex", fontSize: 11, fontWeight: 850, gap: 5 }}>
                    {text(lang, "查看原始论文", "Open source paper")} <ArrowSquareOut aria-hidden="true" size={14} weight="bold" />
                  </a>
                ) : null}
                {identity?.identityPage ? (
                  <a href={identity.identityPage} target="_blank" rel="noreferrer" style={{ alignItems: "center", color: t.accentText, display: "inline-flex", fontSize: 11, fontWeight: 850, gap: 5 }}>
                    MOF Anatomy <ArrowSquareOut aria-hidden="true" size={14} weight="bold" />
                  </a>
                ) : null}
                {identity?.ccdcUrl || identity?.ccdcNumber ? (
                  <a href={identity.ccdcUrl || `https://www.ccdc.cam.ac.uk/structures/Search?Ccdcid=${identity.ccdcNumber}`} target="_blank" rel="noreferrer" style={{ alignItems: "center", color: t.accentText, display: "inline-flex", fontSize: 11, fontWeight: 850, gap: 5 }}>
                    CCDC {identity.ccdcNumber} <ArrowSquareOut aria-hidden="true" size={14} weight="bold" />
                  </a>
                ) : null}
              </div>
            </div>
          )}
        </div>
      ) : (
        <span style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.55 }}>{text(lang, "检索并选择记录后显示对应物化性质；未选择时不预填示例材料。", "Select a search result to show its physicochemical properties; no example material is prefilled.")}</span>
      )}
    </section>
  )
}

function FieldRow({ label, value, fieldKey, fieldSources, lang, t }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 4, marginBottom: 3 }}>
        <span style={{ color: t.faint, fontSize: 11, fontWeight: 780 }}>{label}</span>
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
  const groupCardStyle = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, minWidth: 0, padding: 12 }
  const groupTitle = { color: t.textStrong, fontSize: 12.5, fontWeight: 900 }
  const metricStyle = { display: "flex", justifyContent: "space-between", gap: 12, color: t.muted, fontSize: 12, lineHeight: 1.45 }
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
            {text(lang, "CoRE 2024 CR 数据质量摘要", "CoRE 2024 CR Data Quality Summary")}
          </div>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 3 }}>
            {text(lang, "统计结果来自当前加载的 9,835 条真实 CSD-modified CR 记录。", "Statistics are computed from the 9,835 active real CSD-modified CR records.")}
          </div>
        </div>
        <StatusBadge t={t} tone="source">core_mof_2024/cr_search_index.json</StatusBadge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10 }}>
        <div style={groupCardStyle}>
          <div style={groupTitle}>{text(lang, "数据质量摘要", "Data quality summary")}</div>
          <div style={metricStyle}><span>{text(lang, "总记录数", "Total records")}</span><strong style={{ color: t.textStrong }}>{stats.total}</strong></div>
          <div style={metricStyle}><span>{text(lang, "来源数量", "Source count")}</span><strong style={{ color: t.textStrong }}>{sourceEntries.length}</strong></div>
          <div style={metricStyle}><span>{text(lang, "Provenance", "Provenance")}</span><strong style={{ color: t.textStrong }}>{text(lang, "已记录", "recorded")}</strong></div>
        </div>
        <div style={groupCardStyle}>
          <div style={groupTitle}>{text(lang, "来源分布", "Source distribution")}</div>
          {sourceEntries.map(([source, count]) => (
            <div key={source} style={metricStyle}><span>{source}</span><strong style={{ color: t.textStrong }}>{count}</strong></div>
          ))}
        </div>
        <div style={groupCardStyle}>
          <div style={groupTitle}>{text(lang, "描述符状态", "Descriptor status")}</div>
          <div style={metricStyle}><span>{text(lang, "孔径", "Pore size")}</span><strong style={{ color: t.textStrong }}>{stats.poreSizeA} / {stats.total}</strong></div>
          <div style={metricStyle}><span>{text(lang, "比表面积", "Surface area")}</span><strong style={{ color: t.textStrong }}>{stats.surfaceArea} / {stats.total}</strong></div>
          <div style={metricStyle}><span>{text(lang, "孔体积", "Pore volume")}</span><strong style={{ color: t.textStrong }}>{stats.poreVolume} / {stats.total}</strong></div>
          <div style={metricStyle}><span>{text(lang, "带隙", "Band gap")}</span><strong style={{ color: t.textStrong }}>{stats.bandGap} / {stats.total}</strong></div>
          <div style={metricStyle}><span>{text(lang, "有机酸相关性待整理", "Organic acid relevance pending")}</span><strong style={{ color: t.textStrong }}>{stats.organicPending} / {stats.total}</strong></div>
          <div style={metricStyle}><span>{text(lang, "图结构元数据待整理", "Graph metadata pending")}</span><strong style={{ color: t.textStrong }}>{stats.graphPending} / {stats.total}</strong></div>
        </div>
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
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const labelStyle = { color: t.faint, display: "grid", fontSize: 11, fontWeight: 760, gap: 5, minWidth: 0 }
  const updateAvailability = (key) => {
    setFilters(prev => ({
      ...prev,
      availability: { ...prev.availability, [key]: !prev.availability[key] },
    }))
  }
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, padding: 11 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
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
          {text(lang, "来源数据库", "Source database")}
          <select value={filters.source} onChange={event => setFilters(prev => ({ ...prev, source: event.target.value }))} style={controlStyle}>
            <option value="all">All</option>
            {sources.map(source => <option key={source} value={source}>{source}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          {text(lang, "金属节点", "Metal node")}
          <select value={filters.metal} onChange={event => setFilters(prev => ({ ...prev, metal: event.target.value }))} style={controlStyle}>
            <option value="all">All</option>
            {metals.map(metal => <option key={metal} value={metal}>{metal}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          {text(lang, "有机酸相关性", "Organic acid relevance")}
          <select value={filters.organicStatus} onChange={event => setFilters(prev => ({ ...prev, organicStatus: event.target.value }))} style={controlStyle}>
            <option value="all">All</option>
            {organicStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            {!organicStatuses.includes("hypothesis") && <option value="hypothesis">Hypothesis</option>}
            {!organicStatuses.includes("literature-derived") && <option value="literature-derived">Literature-derived</option>}
            {!organicStatuses.includes("experiment-supported") && <option value="experiment-supported">Experiment-supported</option>}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setFilters({ query: "", source: "all", metal: "all", organicStatus: "all", availability: {} })}
          style={{ ...toolbarBtn(t), fontSize: 11, height: 36, justifyContent: "center", padding: "0 10px" }}
        >
          {text(lang, "重置筛选", "Reset filters")}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setAdvancedOpen(prev => !prev)}
        style={{ ...toolbarBtn(t), border: `1px dashed ${t.border}`, fontSize: 11, justifyContent: "center", padding: "6px 9px", width: isMobile ? "100%" : "fit-content" }}
      >
        {advancedOpen ? text(lang, "收起字段筛选", "Hide descriptor filters") : text(lang, "更多字段筛选", "More descriptor filters")}
      </button>
      {advancedOpen && <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
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
      </div>}
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
  const completeness = getCoreDescriptorCompleteness(item)
  const geometryCurated = ["surfaceArea", "poreSizeA", "pldA", "lcdA", "poreVolume", "density", "voidFraction"].some(key => hasValue(item[key]))
  const electronicAvailable = hasValue(item.bandGap)
  const versionLicense = `${displayVersion(item.sourceVersion)} · ${shortLicense(item.license)}`
  return (
    <article style={{
      background: t.panel,
      border: `1px solid ${expanded ? t.accent : t.border}`,
      borderRadius: 8,
      boxShadow: expanded ? t.shadowSm : "none",
      display: "grid",
      gap: 12,
      alignSelf: "start",
      minWidth: 0,
      padding: 13,
    }}>
      <div style={{ display: "grid", gap: 7 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 900, lineHeight: 1.25, overflowWrap: "anywhere" }}>{getReadableMofLabel(item, lang)}</div>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45, marginTop: 3, overflowWrap: "anywhere" }}>
              {text(lang, "原始记录", "Record ID")}: <span style={{ fontFamily: FONT_SANS }}>{item.sourceRecordId}</span>
            </div>
          </div>
          <StatusBadge t={t} tone="source">{db}</StatusBadge>
        </div>
        <div style={{ color: t.subtle, fontSize: 11.5, fontWeight: 760, lineHeight: 1.4, overflowWrap: "anywhere" }}>{versionLicense}</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <StatusBadge t={t} tone={item.displayNameType === "recognized_mof_name" ? "good" : "neutral"}>
            {text(lang, "名称状态：", "Name status: ")}{nameStatusLabel(item, lang)}
          </StatusBadge>
          <StatusBadge t={t} tone={String(item.curationStatus).toLowerCase() === "curated" ? "good" : "warn"}>
            Data Status: {normalizeStatus(item.curationStatus, lang)}
          </StatusBadge>
          <StatusBadge t={t} tone={completeness.curatedCount === completeness.descriptorCount ? "good" : "neutral"}>
            {completeness.curatedCount}/{completeness.descriptorCount} descriptors curated
          </StatusBadge>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
        <DescriptorLine label={text(lang, "金属节点", "Metal node")} value={item.metalNode} lang={lang} t={t} compact />
        <DescriptorLine label={text(lang, "拓扑", "Topology")} value={item.topology} lang={lang} t={t} compact />
      </div>
      <DescriptorLine label={text(lang, "配体状态", "Linker status")} value={item.linker} lang={lang} t={t} compact />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <DescriptorLine label={text(lang, "比表面积", "Surface area")} value={formatValue(item.surfaceArea, ` ${normalizeUnitLabel("m2/g")}`, lang)} fieldKey="surfaceArea" fieldSources={item.fieldSources} lang={lang} t={t} compact />
        <DescriptorLine label="PLD" value={formatValue(item.pldA, ` ${normalizeUnitLabel("A")}`, lang)} fieldKey="pldA" fieldSources={item.fieldSources} lang={lang} t={t} compact />
        <DescriptorLine label="LCD" value={formatValue(item.lcdA, ` ${normalizeUnitLabel("A")}`, lang)} fieldKey="lcdA" fieldSources={item.fieldSources} lang={lang} t={t} compact />
        <DescriptorLine label={text(lang, "孔体积", "Pore volume")} value={formatValue(item.poreVolume, ` ${normalizeUnitLabel("cm3/g")}`, lang)} fieldKey="poreVolume" fieldSources={item.fieldSources} lang={lang} t={t} compact />
        {electronicAvailable && <DescriptorLine label={text(lang, "带隙", "Band gap")} value={formatValue(item.bandGap, " eV", lang)} fieldKey="bandGap" fieldSources={item.fieldSources} lang={lang} t={t} compact />}
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        <StatusBadge t={t} tone={geometryCurated ? "good" : "neutral"}>
          {geometryCurated ? text(lang, "几何描述符已接入", "Geometry curated") : text(lang, "几何描述符待整理", "Geometry pending")}
        </StatusBadge>
        {electronicAvailable && <StatusBadge t={t} tone="good">{text(lang, "电子描述符可用", "Electronic descriptor available")}</StatusBadge>}
        <StatusBadge t={t} tone="warn">{text(lang, "有机酸 pending", "Organic acid pending")}</StatusBadge>
      </div>

      <button
        type="button"
        aria-pressed={expanded}
        onClick={onToggle}
        style={{
          ...toolbarBtn(t),
          background: expanded ? t.accentSoft : t.surface,
          borderColor: expanded ? t.accent : t.border,
          color: expanded ? t.accentText : t.textStrong,
          justifyContent: "center",
          width: "100%",
        }}
      >
        {expanded ? text(lang, "当前档案", "Selected profile") : text(lang, "查看完整档案", "View full profile")}
      </button>
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
        <span>{text(lang, "高级图结构元数据", "Advanced graph metadata")}</span>
        <span>{graphOpen ? "−" : "+"}</span>
      </button>
      {graphOpen && <GraphDescriptorPanel graphMetadata={item.graphMetadata} t={t} lang={lang} isMobile={isMobile} />}
      <button type="button" onClick={() => setOrganicOpen(prev => !prev)} style={buttonStyle}>
        <span>{text(lang, "有机酸相关性元数据", "Organic acid relevance metadata")}</span>
        <span>{organicOpen ? "−" : "+"}</span>
      </button>
      {organicOpen && <OrganicAcidRelevancePanel relevance={item.organicAcidRelevance} candidate={item} t={t} lang={lang} isMobile={isMobile} />}
    </div>
  )
}

function OpenMofSeedDetailPanel({ item, lang, t, isMobile }) {
  const { profile } = useMofReactionProfile(item)
  const completeness = getCoreDescriptorCompleteness(item)
  const nameRows = [
    [text(lang, "显示名称", "Display name"), getReadableMofLabel(item, lang)],
    [text(lang, "名称状态", "Name status"), nameStatusLabel(item, lang)],
    [text(lang, "原始名称 / 文件名", "Raw name / file name"), item.rawName],
    [text(lang, "原始记录 ID", "Source record ID"), item.sourceRecordId],
    [text(lang, "来源数据库", "Source database"), item.sourceDatabase],
    [text(lang, "别名", "Aliases"), item.aliasNames?.length ? item.aliasNames.join(", ") : text(lang, "待整理", "pending")],
    [text(lang, "需要人工整理", "Needs manual curation"), item.nameCuration?.needsManualNameCuration ? text(lang, "是", "Yes") : text(lang, "否", "No")],
    [text(lang, "原因", "Reason"), nameReasonText(item, lang)],
  ]
  const provenanceRows = [
    [text(lang, "来源数据库", "Source database"), item.sourceDatabase],
    [text(lang, "原始记录", "Record ID"), item.sourceRecordId],
    [text(lang, "数据库版本", "Source version"), item.sourceVersion],
    [text(lang, "来源链接", "Source URL"), item.sourceUrl],
    [text(lang, "引用", "Citation"), item.citation],
    [text(lang, "许可证", "License"), item.license],
    [text(lang, "获取时间", "Retrieved at"), item.retrievedAt],
    [text(lang, "整理状态", "Curation status"), normalizeStatus(item.curationStatus, lang)],
  ]
  const descriptorRows = [
    [text(lang, "比表面积", "Surface area"), formatValue(item.surfaceArea, ` ${normalizeUnitLabel("m2/g")}`, lang), "surfaceArea"],
    [text(lang, "孔径", "Pore size"), formatValue(item.poreSizeA, ` ${normalizeUnitLabel("A")}`, lang), "poreSizeA"],
    ["PLD", formatValue(item.pldA, ` ${normalizeUnitLabel("A")}`, lang), "pldA"],
    ["LCD", formatValue(item.lcdA, ` ${normalizeUnitLabel("A")}`, lang), "lcdA"],
    [text(lang, "孔体积", "Pore volume"), formatValue(item.poreVolume, ` ${normalizeUnitLabel("cm3/g")}`, lang), "poreVolume"],
    [text(lang, "密度", "Density"), formatValue(item.density, ` ${normalizeUnitLabel("g/cm3")}`, lang), "density"],
    [text(lang, "空隙率", "Void fraction"), formatValue(item.voidFraction, "", lang), "voidFraction"],
    [text(lang, "带隙", "Band gap"), formatValue(item.bandGap, " eV", lang), "bandGap"],
    [text(lang, "CO₂ 吸附", "CO₂ uptake"), formatValue(item.co2Uptake, "", lang), "co2Uptake"],
    [text(lang, "CIF 文件", "CIF file"), `${formatValue(item.cifFile, "", lang)} / ${formatValue(item.cifUrl, "", lang)}`],
  ]
  return (
    <div style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 12, minWidth: 0, paddingTop: 12 }}>
      <DetailBlock title={text(lang, "名称解析", "Name Resolution")} t={t}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {nameRows.map(([label, value]) => (
            <DescriptorLine key={label} label={label} value={formatValue(value, "", lang)} lang={lang} t={t} compact />
          ))}
        </div>
      </DetailBlock>

      <DetailBlock title={text(lang, "来源与溯源", "Source & Provenance")} t={t}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {provenanceRows.map(([label, value]) => (
            <DescriptorLine key={label} label={label} value={formatValue(value, "", lang)} lang={lang} t={t} compact />
          ))}
        </div>
      </DetailBlock>

      <DetailBlock title={text(lang, "几何 / 电子描述符", "Geometry / Electronic Descriptors")} t={t}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {descriptorRows.map(([label, value, fieldKey]) => (
            <DescriptorLine key={label} label={label} value={value} fieldKey={fieldKey} fieldSources={item.fieldSources} lang={lang} t={t} compact />
          ))}
        </div>
      </DetailBlock>

      <DetailBlock title={text(lang, "描述符完整度", "Descriptor Completeness")} t={t}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
          {completeness.rows.map(row => {
            const normalized = String(row.status).toLowerCase()
            const tone = normalized === "curated" ? "good" : normalized === "missing" ? "warn" : "neutral"
            return (
              <div key={row.key} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, display: "flex", justifyContent: "space-between", gap: 8, minWidth: 0, padding: "8px 9px" }}>
                <span style={{ color: t.subtle, fontSize: 10.5, fontWeight: 850, overflowWrap: "anywhere" }}>{lang === "zh" ? row.labelZh : row.label}</span>
                <StatusBadge t={t} tone={tone}>{normalizeStatus(row.status, lang)}</StatusBadge>
              </div>
            )
          })}
        </div>
      </DetailBlock>

      <DetailBlock title={text(lang, "催化路径解释层", "Reaction Pathway Explanation Layer")} t={t}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.95fr) minmax(0, 1.05fr)", gap: 10 }}>
          <div style={{ display: "grid", gap: 10 }}>
            <ReactionReadinessTags profile={profile} t={t} defaultVisible={3} />
            <ReactionFingerprintPanel profile={profile} t={t} compact />
          </div>
          <MofRationaleCard profile={profile} t={t} />
        </div>
      </DetailBlock>

      <DetailBlock title={text(lang, "有机酸边界说明", "Organic Acid Boundary")} t={t}>
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
    const haystack = buildCandidateSearchText(item)
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

function NameCurationQueue({ records, lang, t, isMobile }) {
  const pending = useMemo(() => records.filter(item => item.nameCuration?.needsManualNameCuration).slice(0, 8), [records])
  if (!pending.length) return null
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, padding: isMobile ? 12 : 14 }}>
      <div>
        <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>
          {text(lang, "MOF 名称解析状态", "MOF Name Resolution Status")}
        </div>
        <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 3 }}>
          {text(
            lang,
            "部分数据库记录只提供结构编号、CIF 文件名或 CSD refcode，而不提供通用 MOF 名称。系统会保留原始记录 ID，并在可确认时匹配通用名称。",
            "Some database records provide structure IDs, CIF filenames, or CSD refcodes rather than common MOF names. EcoMOF-AI preserves source IDs and matches common names only when they can be confirmed."
          )}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        {pending.map(item => (
          <article key={item.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, display: "grid", gap: 6, minWidth: 0, padding: 10 }}>
            <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{getReadableMofLabel(item, lang)}</div>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45, overflowWrap: "anywhere" }}>
              {text(lang, "原始记录", "Record ID")}: <span style={{ fontFamily: FONT_SANS }}>{item.sourceRecordId}</span>
            </div>
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>{nameReasonText(item, lang)}</div>
            <div style={{ color: t.faint, fontSize: 11.2, lineHeight: 1.45 }}>
              {text(lang, "名称状态", "Name status")}: {nameStatusLabel(item, lang)}
            </div>
            <div style={{ color: t.accentText, fontSize: 11.5, lineHeight: 1.5, fontWeight: 800 }}>
              {text(
                lang,
                "下一步：检查 CIF metadata、source DOI、supplementary information 或 CSD refcode，确认是否存在通用 MOF 名称。",
                "Next: inspect CIF metadata, source DOI, supplementary information, or CSD refcode to confirm whether a common MOF name exists."
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function UnifiedMofDatabasePanel({ rows, collectionReport, identityReport, proxyReport, lang, t, isMobile }) {
  const [filters, setFilters] = useState({ query: "", metal: "all", topology: "all", saRange: "all", gasMode: "all", gasPair: "all", dataGrade: "all", catalysis: "all" })
  const [sort, setSort] = useState({ key: "gasRecords", dir: "desc" })
  const [selectedId, setSelectedId] = useState(null)
  const metals = useMemo(() => mergeOptions(rows.map(row => row.metalNode)), [rows])
  const topologies = useMemo(() => mergeOptions(rows.map(row => row.topology)), [rows])
  const gasPairs = useMemo(() => mergeOptions(rows.flatMap(row => row.gasSummary?.gasPairs || [])), [rows])
  const dataGrades = useMemo(() => mergeOptions(rows.flatMap(row => row.gasSummary?.dataGrades || [])), [rows])
  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase()
    const candidates = rows.filter(row => {
      if (query && ![row.displayName, row.primaryName, row.sourceRecordId, row.sourceDatabase, row.metalNode, row.topology].join(" ").toLowerCase().includes(query)) return false
      if (filters.metal !== "all" && String(row.metalNode || "").toLowerCase() !== filters.metal.toLowerCase()) return false
      if (filters.topology !== "all" && String(row.topology || "").toLowerCase() !== filters.topology.toLowerCase()) return false
      if (!matchesSaRange(row.surfaceArea, filters.saRange)) return false
      if (filters.gasMode === "with" && !row.completeness?.gas) return false
      if (filters.gasMode === "without" && row.completeness?.gas) return false
      if (filters.gasPair !== "all" && !(row.gasSummary?.gasPairs || []).includes(filters.gasPair)) return false
      if (filters.dataGrade !== "all" && !(row.gasSummary?.dataGrades || []).includes(filters.dataGrade)) return false
      if (filters.catalysis === "with" && !row.completeness?.catalysis) return false
      if (filters.catalysis === "without" && row.completeness?.catalysis) return false
      return true
    })
    const dir = sort.dir === "asc" ? 1 : -1
    return candidates.sort((a, b) => {
      const av = sortValue(a, sort.key)
      const bv = sortValue(b, sort.key)
      if (Number.isFinite(av) && Number.isFinite(bv)) return (av - bv) * dir
      return String(av || "").localeCompare(String(bv || "")) * dir
    })
  }, [rows, filters, sort])
  const selected = filtered.find(row => row.id === selectedId) || filtered[0] || null
  const proxyValidation = useMemo(() => validateStructureProxy(filtered), [filtered])
  const reportedProxy = proxyReport?.summary || {}
  const reportedSpearmanMetric = proxyReport?.metrics?.find(metric => Number.isFinite(Number(metric?.rho))) || null
  const reportedIdentity = identityReport?.summary || {}
  const summary = useMemo(() => ({
    total: rows.length,
    withStructure: rows.filter(row => row.completeness?.structure).length,
    withGas: rows.filter(row => row.completeness?.gas).length,
    withCatalysis: rows.filter(row => row.completeness?.catalysis).length,
    filtered: filtered.length,
  }), [rows, filtered])
  const controlStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.text, fontSize: 12, height: 36, minWidth: 0, padding: "0 9px", width: "100%" }
  const labelStyle = { color: t.faint, display: "grid", fontSize: 11, fontWeight: 760, gap: 5, minWidth: 0 }
  const updateSort = key => setSort(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }))

  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 12, padding: isMobile ? 12 : 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 920 }}>{text(lang, "统一 MOF 浏览器", "Unified MOF Browser")}</div>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 4 }}>
            {text(lang, "身份层关联结构、气体吸附和催化记录。无法确认的名称保留为仅气体记录或仅结构记录，不建立推测性连接。", "Browse and search any MOF's connected profile — structure + gas + catalysis — through the identity layer. Unconfirmed names stay gas-only or structure-only instead of being forced together.")}
          </div>
        </div>
        <StatusBadge t={t} tone="source">{summary.filtered} / {summary.total}</StatusBadge>
      </div>
      <div data-testid="unified-mof-coverage" style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, fontSize: 12, fontWeight: 760, lineHeight: 1.6, padding: "9px 11px" }}>
        {text(
          lang,
          `可浏览 ${summary.total} 个 MOF，其中 ${summary.withStructure} 有结构数据、${summary.withGas} 有气体数据、${summary.withCatalysis} 有催化关联；每行用三色点（结构/气体/催化）表示数据完整度。`,
          `Browsing ${summary.total} MOFs — ${summary.withStructure} with structure, ${summary.withGas} with gas data, ${summary.withCatalysis} with catalysis links. Each row uses tri-color dots (structure/gas/catalysis) for data completeness.`
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))", gap: 8 }}>
        <MetricMini label={text(lang, "结构", "Structure")} value={summary.withStructure} note="CoRE 2024 CR" t={t} />
        <MetricMini label={text(lang, "气体数据", "Gas data")} value={summary.withGas} note={`${collectionReport?.summary?.computedIastSelectivityCount || 0} IAST`} t={t} />
        <MetricMini label={text(lang, "催化关联", "Catalysis links")} value={summary.withCatalysis} note="Organic Acid" t={t} />
        <MetricMini label={text(lang, "实体解析", "Identity links")} value={reportedIdentity.linkedGasRecordCount ?? collectionReport?.summary?.gasRecordsWithStructuralLinks ?? "n/a"} note={`${Math.round((reportedIdentity.gasStructureResolutionRate ?? collectionReport?.summary?.gasStructureResolutionRate ?? 0) * 100)}%`} t={t} />
        <MetricMini
          label="Spearman ρs"
          value={reportedSpearmanMetric ? Number(reportedSpearmanMetric.rho).toFixed(2) : proxyValidation.rho === null ? "n/a" : proxyValidation.rho.toFixed(2)}
          note={`n=${reportedSpearmanMetric?.n ?? reportedProxy.candidatePairCount ?? proxyValidation.n} · ${reportedSpearmanMetric?.status || reportedProxy.status || "computed"}`}
          t={t}
        />
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 11.8, lineHeight: 1.6, padding: "8px 10px" }}>
        {text(
          lang,
          `v2.1 解析报告：${reportedIdentity.linkedGasRecordCount ?? 0} 条气体记录已链到结构候选；composition 匹配 ${reportedIdentity.compositionMatchedCanonicalCount ?? 0} 个 canonical。Spearman 使用 ρs = corr(rank x, rank y)，按并列秩计算；结构代理验证仅为指示性，不作为吸附预测。`,
          `v2.1 identity report: ${reportedIdentity.linkedGasRecordCount ?? 0} gas records are linked to structural candidates; composition matched ${reportedIdentity.compositionMatchedCanonicalCount ?? 0} canonical records. Spearman uses ρs = corr(rank x, rank y) with tied ranks; structure-proxy validation is indicative only, not adsorption prediction.`
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr repeat(4, minmax(0, 1fr))", gap: 8, alignItems: "end" }}>
        <label style={labelStyle}>{text(lang, "搜索", "Search")}<input value={filters.query} onChange={event => setFilters(prev => ({ ...prev, query: event.target.value }))} style={controlStyle} /></label>
        <label style={labelStyle}>{text(lang, "金属节点", "Metal")}<select value={filters.metal} onChange={event => setFilters(prev => ({ ...prev, metal: event.target.value }))} style={controlStyle}><option value="all">All</option>{metals.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
        <label style={labelStyle}>{text(lang, "拓扑", "Topology")}<select value={filters.topology} onChange={event => setFilters(prev => ({ ...prev, topology: event.target.value }))} style={controlStyle}><option value="all">All</option>{topologies.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
        <label style={labelStyle}>{text(lang, "比表面积", "Surface area")}<select value={filters.saRange} onChange={event => setFilters(prev => ({ ...prev, saRange: event.target.value }))} style={controlStyle}><option value="all">All</option>{SA_RANGES.map(item => <option key={item.key} value={item.key}>{text(lang, item.zh, item.en)}</option>)}</select></label>
        <label style={labelStyle}>{text(lang, "气体数据", "Gas data")}<select value={filters.gasMode} onChange={event => setFilters(prev => ({ ...prev, gasMode: event.target.value }))} style={controlStyle}><option value="all">All</option><option value="with">{text(lang, "有", "With")}</option><option value="without">{text(lang, "无", "Without")}</option></select></label>
        <label style={labelStyle}>{text(lang, "气体对", "Gas pair")}<select value={filters.gasPair} onChange={event => setFilters(prev => ({ ...prev, gasPair: event.target.value }))} style={controlStyle}><option value="all">All</option>{gasPairs.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
        <label style={labelStyle}>{text(lang, "数据等级", "Grade")}<select value={filters.dataGrade} onChange={event => setFilters(prev => ({ ...prev, dataGrade: event.target.value }))} style={controlStyle}><option value="all">All</option>{dataGrades.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
        <label style={labelStyle}>{text(lang, "催化关联", "Catalysis")}<select value={filters.catalysis} onChange={event => setFilters(prev => ({ ...prev, catalysis: event.target.value }))} style={controlStyle}><option value="all">All</option><option value="with">{text(lang, "有", "With")}</option><option value="without">{text(lang, "无", "Without")}</option></select></label>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 1060, borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: t.surface }}>
              <th style={{ borderBottom: `1px solid ${t.border}`, color: t.subtle, fontSize: 11, fontWeight: 900, padding: "8px 9px", textAlign: "left" }}>{text(lang, "完整度", "Data")}</th>
              {[
                ["displayName", "MOF"],
                ["metalNode", text(lang, "金属", "Metal")],
                ["surfaceArea", text(lang, "比表面积", "Surface area")],
                ["gasRecords", text(lang, "气体", "Gas")],
                ["gasPairs", text(lang, "气体对", "Gas pairs")],
                ["dataGrades", text(lang, "等级", "Grades")],
                ["catalysis", text(lang, "催化", "Catalysis")],
              ].map(([key, label]) => (
                <th key={key} style={{ borderBottom: `1px solid ${t.border}`, color: t.subtle, padding: "8px 9px", textAlign: "left" }}>
                  <button type="button" onClick={() => updateSort(key)} style={{ background: "transparent", border: 0, color: t.textStrong, cursor: "pointer", fontSize: 11, fontWeight: 900, padding: 0 }}>
                    {label} {sort.key === key ? (sort.dir === "desc" ? "↓" : "↑") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 80).map(row => (
              <tr key={row.id} onClick={() => setSelectedId(row.id)} style={{ background: selected?.id === row.id ? t.badgeInfoBg : t.panel, borderBottom: `1px solid ${t.divider}`, cursor: "pointer" }}>
                <td style={unifiedCell(t)}><CompletenessDots completeness={row.completeness} lang={lang} t={t} /></td>
                <td style={unifiedCell(t)}>{getReadableMofLabel(row, lang)}</td>
                <td style={unifiedCell(t)}>{row.metalNode || "pending"}</td>
                <td style={unifiedCell(t)}>{formatValue(row.surfaceArea, ` ${normalizeUnitLabel("m2/g")}`, lang)}</td>
                <td style={unifiedCell(t)}>{row.completeness?.gas ? `${row.gasRecords.length}` : text(lang, "无", "none")}</td>
                <td style={unifiedCell(t)}>{row.gasSummary?.gasPairs?.join(", ") || text(lang, "无", "none")}</td>
                <td style={unifiedCell(t)}>{row.gasSummary?.dataGrades?.join(", ") || text(lang, "无", "none")}</td>
                <td style={unifiedCell(t)}>{row.completeness?.catalysis ? text(lang, "有", "linked") : text(lang, "无", "none")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <UnifiedDetail row={selected} lang={lang} t={t} isMobile={isMobile} />
    </section>
  )
}

function mergeOptions(values = []) {
  return [...new Set(values.filter(hasValue).map(String))].sort()
}

function sortValue(row, key) {
  if (key === "gasRecords") return row.gasRecords?.length || 0
  if (key === "gasPairs") return row.gasSummary?.gasPairs?.length || 0
  if (key === "dataGrades") return row.gasSummary?.dataGrades?.join(",") || ""
  if (key === "catalysis") return row.catalysisLinks?.length || 0
  return row[key]
}

function unifiedCell(t) {
  return { color: t.muted, lineHeight: 1.45, padding: "8px 9px", verticalAlign: "top", overflowWrap: "anywhere" }
}

const SA_RANGES = [
  { key: "lt1000", zh: "< 1000", en: "< 1000", min: 0, max: 1000 },
  { key: "1000to3000", zh: "1000–3000", en: "1000–3000", min: 1000, max: 3000 },
  { key: "3000to5000", zh: "3000–5000", en: "3000–5000", min: 3000, max: 5000 },
  { key: "gt5000", zh: "> 5000", en: "> 5000", min: 5000, max: Infinity },
]

function matchesSaRange(value, rangeKey) {
  if (rangeKey === "all") return true
  const range = SA_RANGES.find(item => item.key === rangeKey)
  if (!range) return true
  if (!hasValue(value)) return false
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return false
  return numeric >= range.min && numeric < range.max
}

function CompletenessDots({ completeness, lang, t }) {
  const dots = [
    { key: "structure", on: Boolean(completeness?.structure), zh: "结构", en: "structure" },
    { key: "gas", on: Boolean(completeness?.gas), zh: "气体", en: "gas" },
    { key: "catalysis", on: Boolean(completeness?.catalysis), zh: "催化", en: "catalysis" },
  ]
  return (
    <span style={{ display: "inline-flex", gap: 5 }} aria-label={dots.map(d => `${text(lang, d.zh, d.en)}:${d.on ? "✓" : "—"}`).join(" ")}>
      {dots.map(dot => (
        <span
          key={dot.key}
          title={`${text(lang, dot.zh, dot.en)} ${dot.on ? "✓" : "—"}`}
          style={{ background: dot.on ? (t.success || t.accent) : t.border, borderRadius: 6, display: "inline-block", height: 9, width: 9 }}
        />
      ))}
    </span>
  )
}

function MetricMini({ label, value, note, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 920, marginTop: 4 }}>{value}</div>
      <div style={{ color: t.subtle, fontSize: 11, marginTop: 3 }}>{note}</div>
    </div>
  )
}

function UnifiedDetail({ row, lang, t, isMobile }) {
  if (!row) return <Callout tone="warn">{text(lang, "当前筛选无记录。", "No rows match the current filters.")}</Callout>
  const gasRows = row.gasRecords || []
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900 }}>{getReadableMofLabel(row, lang)}</div>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.5, marginTop: 3 }}>{row.canonicalId}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <StatusBadge t={t} tone={row.completeness?.structure ? "good" : "neutral"}>{text(lang, "结构", "structure")} {row.completeness?.structure ? "✓" : text(lang, "无", "none")}</StatusBadge>
          <StatusBadge t={t} tone={row.completeness?.gas ? "good" : "neutral"}>{text(lang, "气体", "gas")} {row.completeness?.gas ? "✓" : text(lang, "无", "none")}</StatusBadge>
          <StatusBadge t={t} tone={row.completeness?.catalysis ? "good" : "neutral"}>{text(lang, "催化", "catalysis")} {row.completeness?.catalysis ? "✓" : text(lang, "无", "none")}</StatusBadge>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        <DescriptorLine label={text(lang, "来源", "Source")} value={row.sourceDatabase} lang={lang} t={t} compact />
        <DescriptorLine label={text(lang, "金属节点", "Metal node")} value={row.metalNode} lang={lang} t={t} compact />
        <DescriptorLine label={text(lang, "拓扑", "Topology")} value={row.topology} lang={lang} t={t} compact />
        <DescriptorLine label={text(lang, "孔径", "Pore size")} value={formatValue(row.poreSizeA, ` ${normalizeUnitLabel("A")}`, lang)} lang={lang} t={t} compact />
      </div>
      <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{text(lang, "气体吸附记录", "Gas Adsorption Records")}</div>
      {gasRows.length ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead><tr>{["MOF", "Gas pair", "Grade", "Uptake", "Selectivity", "Capacity", "Source"].map(head => <th key={head} style={{ borderBottom: `1px solid ${t.border}`, color: t.subtle, padding: 7, textAlign: "left" }}>{head}</th>)}</tr></thead>
            <tbody>
              {gasRows.slice(0, 8).map(record => (
                <tr key={record.id} style={{ borderBottom: `1px solid ${t.divider}` }}>
                  <td style={unifiedCell(t)}>{getReadableMofLabel(record, lang)}</td>
                  <td style={unifiedCell(t)}>{record.gasPair}</td>
                  <td style={unifiedCell(t)}>{record.dataGrade || record.evidence?.dataGrade}</td>
                  <td style={unifiedCell(t)}>{formatValue(record.metrics?.primaryUptake, " mmol/g", lang)}</td>
                  <td style={unifiedCell(t)}>{formatValue(record.metrics?.iaSTSelectivity ?? record.metrics?.selectivity, "", lang)}<br /><span style={{ color: t.faint, fontSize: 10.5 }}>{record.fieldSources?.iaSTSelectivity?.sourceType || record.fieldSources?.selectivity?.sourceType || "pending"}</span></td>
                  <td style={unifiedCell(t)}>{formatValue(record.metrics?.workingCapacity, " mmol/g", lang)}</td>
                  <td style={unifiedCell(t)}>{record.recordProvenance?.doi || record.recordProvenance?.sourceUrl || "pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ color: t.faint, fontSize: 12, lineHeight: 1.6 }}>{text(lang, "无气体数据。", "No gas adsorption data.")}</div>
      )}
      <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{text(lang, "有机酸催化关联", "Organic Acid Catalysis Links")}</div>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
        {row.catalysisLinks?.length ? row.catalysisLinks.map(link => `${link.id} · ${link.role || "linked"}`).join("; ") : text(lang, "无催化关联。", "No catalysis links.")}
      </div>
    </div>
  )
}

export function MOFLibraryTab() {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const [rows, setRows] = useState([])
  const [structuralRows, setStructuralRows] = useState([])
  const [gasRows, setGasRows] = useState([])
  const [identityRegistry, setIdentityRegistry] = useState({ records: [], summary: {} })
  const [collectionReport, setCollectionReport] = useState(null)
  const [identityReport, setIdentityReport] = useState(null)
  const [proxyReport, setProxyReport] = useState(null)
  const [csdPilotManifest, setCsdPilotManifest] = useState({ records: [], license: {} })
  const [csdPublicCatalog, setCsdPublicCatalog] = useState({ structures: [], summary: {}, dataset: {} })
  const [physicochemicalSummary, setPhysicochemicalSummary] = useState({})
  const [mofAnatomyRecords, setMofAnatomyRecords] = useState([])
  const [csdCatalogStatus, setCsdCatalogStatus] = useState("loading")
  const [status, setStatus] = useState("loading")
  const [filters, setFilters] = useState({ query: "", source: "all", metal: "all", organicStatus: "all", availability: {} })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [expandedId, setExpandedId] = useState(null)
  const [propertyQuery, setPropertyQuery] = useState("")
  const [propertySubmittedQuery, setPropertySubmittedQuery] = useState("")
  const [propertySelectedResult, setPropertySelectedResult] = useState(null)
  const [unifiedBrowserOpen, setUnifiedBrowserOpen] = useState(false)

  useEffect(() => {
    let active = true
    setStatus("loading")
    Promise.all([
      getGlobalMofCandidates({ mode: DATA_MODE, throwOnError: true }),
      getGasAdsorptionRecordsV2({ throwOnError: false }),
      getMofIdentityRegistry({ throwOnError: false }),
      getGasAdsorptionV2CollectionReport({ throwOnError: false }),
      getMofIdentityResolutionReport({ throwOnError: false }),
      getGasStructureProxyValidationReport({ throwOnError: false }),
      getCsdStructurePilotManifest({ throwOnError: false }),
      getCsdMofPublicCatalog({ throwOnError: false }),
      fetchDataJson("mof_physicochemical_index_v1.json", { records: [], summary: {} }),
      fetchDataJson("mof_anatomy_identity_index_v1.json", { records: [], summary: {} }),
    ])
      .then(([data, gasData, registry, report, identityResolution, proxyValidation, csdManifest, csdCatalog, physicochemicalIndex, mofAnatomyIndex]) => {
        if (!active) return
        const fairCrossValidationByCoreId = new Map(
          (physicochemicalIndex?.records || []).map(record => [record.coreRecordId, record.fairMofsCrossValidation]),
        )
        const normalized = Array.isArray(data)
          ? data.map(normalizeOpenMofRecord).map(record => ({
            ...record,
            fairMofsCrossValidation: fairCrossValidationByCoreId.get(record.id) || null,
          }))
          : []
        setRows(normalized)
        setStructuralRows(normalized)
        setGasRows(Array.isArray(gasData) ? gasData : [])
        setIdentityRegistry(registry || { records: [], summary: {} })
        setCollectionReport(report || null)
        setIdentityReport(identityResolution || null)
        setProxyReport(proxyValidation || null)
        setCsdPilotManifest(csdManifest || { records: [], license: {} })
        setCsdPublicCatalog(csdCatalog || { structures: [], summary: {}, dataset: {} })
        setPhysicochemicalSummary(physicochemicalIndex?.summary || {})
        setMofAnatomyRecords(mofAnatomyIndex?.records || [])
        setCsdCatalogStatus(csdCatalog?.structures?.length ? "ready" : "unavailable")
        setStatus(normalized.length ? "loaded" : "empty")
      })
      .catch(error => {
        console.warn("CoRE MOF 2024 CR data could not be loaded.", error)
        if (!active) return
        setRows([])
        setCsdCatalogStatus("unavailable")
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
  const activeRecord = useMemo(
    () => rows.find(item => item.id === expandedId)
      || propertySelectedResult?.localRecord
      || null,
    [expandedId, propertySelectedResult, rows],
  )
  const unifiedRows = useMemo(() => (
    unifiedBrowserOpen
      ? buildUnifiedMofRows({ structures: structuralRows.length ? structuralRows : rows, gasRecords: gasRows, registry: identityRegistry })
      : []
  ), [unifiedBrowserOpen, structuralRows, rows, gasRows, identityRegistry])

  const statusLine = text(
    lang,
    `${stats.total} 条真实 CoRE MOF 2024 CSD-modified CR 记录；不符合当前结构条件的记录不会进入候选和评分入口。有机酸路线仍需文献、DFT 或实验支持。`,
    `${stats.total} real CoRE MOF 2024 CSD-modified CR records; rows outside the active structural criteria do not enter candidate or scoring surfaces. Organic-acid routes still require literature, DFT, or experimental support.`
  )

  return (
    <div id="library" style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
      <PageHeader
        title={text(lang, "MOF库", "MOF Library")}
        subtitle={text(
          lang,
          "通过身份层检索 MOF 的结构属性、气体吸附（含等温线）和有机酸催化关联，并保留统一来源溯源。",
          "Browse and search any MOF's connected profile through the identity layer: structure properties + gas adsorption (incl. isotherms) + organic-acid catalysis links, with unified provenance."
        )}
        action={<CopyLinkButton hash="library" ariaLabel={text(lang, "复制 MOF库链接", "Copy MOF Library link")} />}
      />

      <PhysicochemicalSearchPanel
        rows={rows}
        anatomyRecords={mofAnatomyRecords}
        query={propertyQuery}
        setQuery={setPropertyQuery}
        submittedQuery={propertySubmittedQuery}
        setSubmittedQuery={setPropertySubmittedQuery}
        selected={propertySelectedResult}
        onSelect={result => {
          setPropertySelectedResult(result)
          setExpandedId(result?.localRecord?.id || null)
        }}
        lang={lang}
        t={t}
        isMobile={isMobile}
      />

      <div data-testid="mof-library-status-strip" style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, color: t.subtle, fontSize: 12.2, lineHeight: 1.55 }}>
        <strong style={{ color: t.textStrong }}>{text(lang, "CoRE MOF 2024 · CSD-modified · CR", "CoRE MOF 2024 · CSD-modified · CR")}</strong>
        <StatusBadge t={t} tone={status === "loaded" ? "good" : status === "loading" ? "neutral" : "warn"}>
          {status === "loading" ? text(lang, "加载中", "loading") : text(lang, `${stats.total} 条`, `${stats.total} records`)}
        </StatusBadge>
        <span>{statusLine}</span>
      </div>

      <MofStructureWorkbench
        item={activeRecord}
        pilotManifest={csdPilotManifest}
        publicCatalog={csdPublicCatalog}
        catalogStatus={csdCatalogStatus}
        physicochemicalRecords={rows}
        physicochemicalSummary={physicochemicalSummary}
        lang={lang}
        t={t}
        isMobile={isMobile}
      />

      {status === "loading" && <div style={{ color: t.accentText, fontSize: 12.2, fontWeight: 800 }}>{text(lang, "正在加载 CoRE MOF 2024 CR 索引…", "Loading the CoRE MOF 2024 CR index...")}</div>}
      {status === "fallback" && <Callout tone="warn">{text(lang, "CoRE MOF 2024 CR 索引暂时无法读取。请刷新页面或稍后重试。", "The CoRE MOF 2024 CR index is temporarily unavailable. Please refresh or try again later.")}</Callout>}
      {status === "empty" && <Callout tone="warn">{text(lang, "当前 CoRE MOF 2024 CR 索引暂无记录。", "The current CoRE MOF 2024 CR index contains no records.")}</Callout>}

      <section style={{ display: "grid", gap: 10, padding: "4px 0" }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}>{text(lang, "统一 MOF 浏览器", "Unified MOF Browser")}</div>
            <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.5, marginTop: 3 }}>
              {text(
                lang,
                `结构记录 ${structuralRows.length || rows.length} 条 · 气体吸附记录 ${gasRows.length} 条 · 身份映射 ${identityRegistry?.records?.length || 0} 条。展开后可进行跨数据检索。`,
                `${structuralRows.length || rows.length} structure records · ${gasRows.length} gas adsorption records · ${identityRegistry?.records?.length || 0} identity links. Open to search across linked datasets.`
              )}
            </div>
          </div>
          <button type="button" onClick={() => setUnifiedBrowserOpen(open => !open)} style={{ ...toolbarBtn(t), color: t.textStrong, border: `1px solid ${t.borderStrong || t.border}`, justifyContent: "center", minWidth: 142 }}>
            {unifiedBrowserOpen ? text(lang, "收起统一浏览器", "Collapse browser") : text(lang, "展开统一浏览器", "Open browser")}
          </button>
        </div>
        {unifiedBrowserOpen ? (
          <UnifiedMofDatabasePanel rows={unifiedRows} collectionReport={collectionReport} identityReport={identityReport} proxyReport={proxyReport} lang={lang} t={t} isMobile={isMobile} />
        ) : null}
      </section>

      <details style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: "11px 13px" }}>
        <summary style={{ color: t.accentText, cursor: "pointer", fontSize: 12.5, fontWeight: 850 }}>
          {text(lang, "进阶：数据质量、名称整理与逐卡浏览", "Advanced: data quality, name curation, and per-card browsing")}
        </summary>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 14 }}>
          <OpenMofSeedQualitySummary records={rows} lang={lang} t={t} isMobile={isMobile} />
          <DataQualityAuditPanel records={rows} lang={lang} t={t} isMobile={isMobile} />
          <NameCurationQueue records={rows} lang={lang} t={t} isMobile={isMobile} />

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
            title={text(lang, "CoRE 2024 CR 真实结构记录", "CoRE 2024 CR Real Structure Records")}
            subtitle={text(
              lang,
              `${filteredRecords.length} / ${rows.length} 条记录匹配当前筛选。默认显示 ${PAGE_SIZE} 条，点击加载更多继续浏览。`,
              `${filteredRecords.length} / ${rows.length} records match the current filters. The page renders ${PAGE_SIZE} records first; use Load more to continue.`
            )}
          >
            <div style={{ alignItems: "start", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12, minWidth: 0 }}>
              {visibleRecords.map(item => (
                <OpenMofSeedCard
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onToggle={() => {
                    setExpandedId(item.id)
                    window.setTimeout(() => {
                      document.querySelector("[data-testid='mof-library-selected-detail']")?.scrollIntoView({ block: "start", behavior: "smooth" })
                    }, 80)
                  }}
                  lang={lang}
                  t={t}
                  isMobile={isMobile}
                />
              ))}
            </div>
            {activeRecord ? (
              <div data-testid="mof-library-selected-detail" style={{ marginTop: 14 }}>
                <OpenMofSeedDetailPanel item={activeRecord} lang={lang} t={t} isMobile={isMobile} />
              </div>
            ) : null}
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
      </details>
    </div>
  )
}
