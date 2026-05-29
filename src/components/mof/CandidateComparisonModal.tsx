// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { BasisBadge, DisclaimerLink, FieldProvenanceButton } from "../ui"
import { getGlobalMofCandidates, getMofCandidates } from "../../services/dataService"
import { buildCandidateSearchText } from "../../utils/mofDisplayName"
import { downloadTextFile } from "../../utils/report"
import { toolbarBtn } from "../../utils/styles"

const CORE_FIELDS = [
  { key: "surfaceArea", label: { en: "Surface area", zh: "比表面积" }, unit: "m²/g" },
  { key: "poreSizeA", label: { en: "Pore size", zh: "孔径" }, unit: "Å" },
  { key: "poreVolume", label: { en: "Pore volume", zh: "孔体积" }, unit: "cm³/g" },
  { key: "co2Uptake", label: { en: "CO₂ uptake", zh: "CO₂ 吸附量" }, unit: "mmol/g" },
  { key: "bandGap", label: { en: "Band gap", zh: "带隙" }, unit: "eV" },
  { key: "waterStability", label: { en: "Water stability", zh: "水稳定性" }, unit: "" },
  { key: "thermalStability", label: { en: "Thermal stability", zh: "热稳定性" }, unit: "" },
  { key: "toxicityConcern", label: { en: "Toxicity concern", zh: "毒性关注" }, unit: "" },
]

const COMPARE_FUNCTIONS = [
  {
    id: "dataCompleteness",
    label: { en: "Data completeness", zh: "数据完整性" },
    description: {
      en: "Descriptor completeness, curation status, evidence level, and missing fields.",
      zh: "描述符完整度、整理状态、证据等级和缺失字段。",
    },
    keyFields: ["descriptorCount", "missingDescriptors", "needsReviewFields", "sourceStatus", "evidenceLevel"],
    actualFields: CORE_FIELDS.map(field => field.key),
  },
  {
    id: "co2Capture",
    label: { en: "CO₂ capture", zh: "CO₂ 捕集" },
    description: {
      en: "CO₂ uptake, surface area, pore structure, and water stability.",
      zh: "CO₂ 吸附量、比表面积、孔结构和水稳定性。",
    },
    keyFields: ["co2Uptake", "surfaceArea", "poreSizeA", "poreVolume", "waterStability", "sourceStatus"],
    actualFields: ["co2Uptake", "surfaceArea", "poreSizeA", "poreVolume", "waterStability"],
  },
  {
    id: "sustainability",
    label: { en: "Sustainability", zh: "可持续性" },
    description: {
      en: "Toxicity concern, water stability, thermal stability, and LCA-ready signals.",
      zh: "毒性关注、水稳定性、热稳定性和面向 LCA 的信号。",
    },
    keyFields: ["toxicityConcern", "waterStability", "thermalStability", "recyclability", "sourceStatus"],
    actualFields: ["toxicityConcern", "waterStability", "thermalStability"],
  },
  {
    id: "catalysis",
    label: { en: "Catalysis", zh: "催化" },
    description: {
      en: "Reaction pathway, active-site hypothesis, condition context, product metrics, and evidence status.",
      zh: "反应路径、活性位点假设、条件语境、产物指标和证据状态。",
    },
    keyFields: ["reactionPathway", "activeSiteHypothesis", "conditionContext", "productMetricStatus", "mechanismEvidence", "stabilityEvidence"],
    actualFields: ["reactionClasses", "activeSiteHypothesis", "waterStability", "thermalStability"],
  },
  {
    id: "gasSeparation",
    label: { en: "Gas separation", zh: "气体分离" },
    description: {
      en: "Gas pair, ratio, temperature, pressure, method, and source status.",
      zh: "气体对、比例、温度、压力、方法和来源状态。",
    },
    keyFields: ["gasPair", "uptakeSelectivityStatus", "temperature", "pressure", "method", "sourceStatus"],
    actualFields: ["co2Uptake", "source", "evidenceLevel"],
  },
]

const DEFAULT_CONTEXT = {
  dataCompleteness: {},
  co2Capture: {
    gas: "CO₂",
    temperature: "298 K",
    pressure: "1 bar",
    unit: "mmol/g",
    sourceRequirement: "curated",
  },
  gasSeparation: {
    gasPair: "CO₂/N₂",
    ratio: "15/85",
    temperature: "298 K",
    pressure: "1 bar",
    method: "pending",
  },
  catalysis: {
    reactionFamily: "CO₂ conversion",
    substrate: "pending",
    co2Source: "pending",
    temperature: "pending",
    productFocus: "pending",
  },
  sustainability: {
    priority: "low toxicity",
    applicationContext: "general screening",
  },
}

function createDefaultContext() {
  return Object.fromEntries(Object.entries(DEFAULT_CONTEXT).map(([key, value]) => [key, { ...value }]))
}

function normalizeCompareFunctionId(value) {
  if (value === "gas-separation" || value === "gasSeparation") return "gasSeparation"
  if (value === "data-completeness" || value === "dataCompleteness") return "dataCompleteness"
  if (value === "co2-capture" || value === "co2Capture") return "co2Capture"
  if (value === "sustainability") return "sustainability"
  if (value === "catalysis") return "catalysis"
  return "dataCompleteness"
}

function contextKey(initialContext) {
  if (!initialContext) return "default"
  return [
    initialContext.source || "",
    initialContext.sourceRecordId || "",
    initialContext.candidateId || "",
    initialContext.candidateName || "",
    normalizeCompareFunctionId(initialContext.compareFunction),
    JSON.stringify(initialContext.conditionContext || {}),
  ].join("|")
}

function findCandidateFromContext(initialContext, rows) {
  if (!initialContext || !Array.isArray(rows)) return null
  const candidateId = String(initialContext.candidateId || "").trim().toLowerCase()
  const candidateName = String(initialContext.candidateName || "").trim().toLowerCase()
  if (!candidateId && !candidateName) return null
  return rows.find(item => {
    const id = String(item.id || "").toLowerCase()
    const name = String(item.name || item.mofName || "").toLowerCase()
    return (candidateId && id === candidateId) || (candidateName && name === candidateName)
  }) || null
}

function isMissing(value) {
  return value === undefined || value === null || value === "" || value === "—" || value === "pending" || value === "unknown"
}

function pendingLabel(lang) {
  return lang === "zh" ? "暂不可比" : "Not comparable"
}

function curationPendingLabel(lang) {
  return lang === "zh" ? "待补充" : "Pending"
}

function normalizeCandidate(item) {
  if (!item) return null
  const metalNodes = Array.isArray(item.metalNodes) ? item.metalNodes : (item.metal ? [item.metal] : [])
  const reactionClasses = Array.isArray(item.reactionClasses) ? item.reactionClasses : []
  const activeSiteHypothesis = Array.isArray(item.activeSiteHypothesis) ? item.activeSiteHypothesis.join("; ") : item.activeSiteHypothesis
  return {
    ...item,
    id: item.id || item.name || `${item.metal || "mof"}-${item.linker || "record"}`,
    name: item.name || item.mofName || "MOF candidate",
    formula: item.formula || "—",
    metal: item.metal || metalNodes.join(", ") || "—",
    metalNodes,
    linker: item.linker || "—",
    topology: item.topology || "—",
    source: item.source || item.database || "public/data",
    dataMode: item.dataMode || item.mode || "public/data",
    dataStatus: item.dataStatus || item.curationNote || "pending curation",
    evidenceLevel: item.evidenceLevel || "pending",
    reactionClasses,
    activeSiteHypothesis: activeSiteHypothesis || "—",
    limitations: item.limitations || "—",
    fieldSources: item.fieldSources || {},
  }
}

function uniqueCandidates(rows) {
  const map = new Map()
  rows.map(normalizeCandidate).filter(Boolean).forEach(item => {
    const key = item.id || item.name
    if (!map.has(key)) map.set(key, item)
  })
  return Array.from(map.values())
}

function fieldSource(candidate, key) {
  return candidate?.fieldSources?.[key]
}

function fieldRawValue(candidate, key) {
  const source = fieldSource(candidate, key)
  if (!isMissing(candidate?.[key])) return candidate[key]
  if (!isMissing(source?.value)) return source.value
  return undefined
}

function fieldHasValue(candidate, key) {
  return !isMissing(fieldRawValue(candidate, key))
}

function isCuratedSource(source) {
  if (!source) return false
  if (source.sourceType === "pending") return false
  if (source.evidenceLevel === "needs-validation") return false
  if (source.curationStatus === "needs-review" || source.reviewStatus === "conflict" || source.hasConflict) return false
  return Boolean(source.sourceName || source.database || source.url || source.doi || source.condition || !isMissing(source.value))
}

function fieldStatus(candidate, key) {
  const source = fieldSource(candidate, key)
  if (isCuratedSource(source)) return "curated"
  if (source?.curationStatus === "needs-review" || source?.reviewStatus === "conflict" || source?.hasConflict) return "needs-review"
  if (fieldHasValue(candidate, key)) return "pending"
  return "missing"
}

function statusLabel(status, lang) {
  if (status === "curated") return lang === "zh" ? "已整理" : "Curated"
  if (status === "needs-review") return lang === "zh" ? "需复核" : "Needs review"
  if (status === "pending") return curationPendingLabel(lang)
  return pendingLabel(lang)
}

function statusTone(status) {
  if (status === "curated") return "calc"
  if (status === "needs-review") return "danger"
  if (status === "pending") return "warn"
  return "proxy"
}

function displayField(candidate, key, lang) {
  if (key === "descriptorCount") {
    const summary = dataConfidence(candidate)
    return `${summary.curated + summary.pending + summary.needsReview}/8`
  }
  if (key === "missingDescriptors") return missingCoreFields(candidate, lang).join(", ") || (lang === "zh" ? "无明显缺失" : "No obvious gaps")
  if (key === "needsReviewFields") {
    const fields = CORE_FIELDS.filter(field => fieldStatus(candidate, field.key) === "needs-review").map(field => field.label[lang === "zh" ? "zh" : "en"])
    return fields.join(", ") || curationPendingLabel(lang)
  }
  if (key === "sourceStatus") return sourceStatus(candidate, lang)
  if (key === "evidenceLevel") return candidate.evidenceLevel || curationPendingLabel(lang)
  if (key === "reactionPathway") return candidate.reactionClasses?.length ? candidate.reactionClasses.join(", ") : pendingLabel(lang)
  if (key === "activeSiteHypothesis") return isMissing(candidate.activeSiteHypothesis) ? pendingLabel(lang) : candidate.activeSiteHypothesis
  if (key === "conditionContext") return pendingLabel(lang)
  if (key === "productMetricStatus") return curationPendingLabel(lang)
  if (key === "mechanismEvidence") return candidate.evidenceLevel || curationPendingLabel(lang)
  if (key === "stabilityEvidence") return `${displayField(candidate, "waterStability", lang)} / ${displayField(candidate, "thermalStability", lang)}`
  if (key === "gasPair" || key === "temperature" || key === "pressure" || key === "method") return pendingLabel(lang)
  if (key === "uptakeSelectivityStatus") return fieldHasValue(candidate, "co2Uptake") ? displayField(candidate, "co2Uptake", lang) : pendingLabel(lang)
  if (key === "recyclability") return curationPendingLabel(lang)

  const field = CORE_FIELDS.find(item => item.key === key)
  const raw = fieldRawValue(candidate, key)
  if (isMissing(raw)) return pendingLabel(lang)
  const unit = fieldSource(candidate, key)?.unit ?? field?.unit
  return unit ? `${raw} ${unit}` : String(raw)
}

function displayComparisonField(candidate, key, lang, compareFunctionId, currentContext = {}) {
  if (compareFunctionId === "gasSeparation" && ["gasPair", "temperature", "pressure", "method"].includes(key)) {
    return isMissing(currentContext[key]) ? pendingLabel(lang) : currentContext[key]
  }
  return displayField(candidate, key, lang)
}

function dataConfidence(candidate) {
  const statuses = CORE_FIELDS.map(field => fieldStatus(candidate, field.key))
  const withSource = CORE_FIELDS.filter(field => {
    const source = fieldSource(candidate, field.key)
    return source && source.sourceType !== "pending" && Boolean(source.sourceName || source.database || source.url || source.doi || source.condition)
  }).length
  return {
    curated: statuses.filter(status => status === "curated").length,
    pending: statuses.filter(status => status === "pending" || status === "missing").length,
    needsReview: statuses.filter(status => status === "needs-review").length,
    completeness: Math.round((statuses.filter(status => status === "curated").length / CORE_FIELDS.length) * 100),
    withSource,
    evidenceLevel: candidate.evidenceLevel || "pending",
  }
}

function sourceStatus(candidate, lang) {
  const summary = dataConfidence(candidate)
  if (summary.withSource >= 5) return lang === "zh" ? "来源覆盖较高" : "Source coverage high"
  if (summary.withSource > 0) return lang === "zh" ? "部分字段有来源" : "Partial source coverage"
  return lang === "zh" ? "来源待补充" : "Source pending"
}

function evidenceStatus(candidate, key, lang) {
  const source = fieldSource(candidate, key)
  return source?.evidenceLevel || candidate.evidenceLevel || curationPendingLabel(lang)
}

function curatedDescriptorCount(candidate) {
  return CORE_FIELDS.filter(field => fieldStatus(candidate, field.key) === "curated").length
}

function candidateSearchText(candidate) {
  return [
    buildCandidateSearchText(candidate),
    candidate.formula,
    candidate.source,
    candidate.dataStatus,
    candidate.evidenceLevel,
    ...(candidate.tags || []),
    ...(candidate.reactionClasses || []),
  ].filter(Boolean).join(" ").toLowerCase()
}

function missingCoreFields(candidate, lang) {
  return CORE_FIELDS
    .filter(field => fieldStatus(candidate, field.key) !== "curated")
    .map(field => field.label[lang === "zh" ? "zh" : "en"])
}

function conditionMatch(candidate, compareFunction, lang) {
  const actualFields = compareFunction.actualFields || []
  const relevantCoreFields = actualFields.filter(key => CORE_FIELDS.some(field => field.key === key))
  const curated = relevantCoreFields.filter(key => fieldStatus(candidate, key) === "curated").length
  const present = actualFields.filter(key => {
    if (key === "reactionClasses") return candidate.reactionClasses?.length
    if (key === "activeSiteHypothesis") return !isMissing(candidate.activeSiteHypothesis)
    if (key === "source" || key === "evidenceLevel") return !isMissing(candidate[key])
    return fieldHasValue(candidate, key)
  }).length

  if (!actualFields.length || present === 0) return { id: "not-comparable", label: lang === "zh" ? "暂不可比" : "Not comparable", tone: "proxy" }
  if (curated >= Math.max(1, Math.ceil(relevantCoreFields.length * 0.7))) return { id: "match", label: lang === "zh" ? "有匹配数据" : "Match available", tone: "calc" }
  if (present >= Math.max(1, Math.ceil(actualFields.length * 0.4))) return { id: "partial", label: lang === "zh" ? "部分匹配" : "Partial match", tone: "info" }
  return { id: "missing", label: lang === "zh" ? "条件缺失" : "Context missing", tone: "warn" }
}

function fieldLabel(key, lang) {
  const core = CORE_FIELDS.find(field => field.key === key)
  if (core) return core.label[lang === "zh" ? "zh" : "en"]
  const labels = {
    descriptorCount: { en: "descriptor count", zh: "描述符数量" },
    missingDescriptors: { en: "missing descriptors", zh: "缺失描述符" },
    needsReviewFields: { en: "needs review fields", zh: "需复核字段" },
    sourceStatus: { en: "source status", zh: "来源状态" },
    evidenceLevel: { en: "evidence level", zh: "证据等级" },
    recyclability: { en: "recyclability", zh: "可回收性" },
    reactionPathway: { en: "reaction pathway", zh: "反应路径" },
    activeSiteHypothesis: { en: "active-site hypothesis", zh: "活性位点假设" },
    conditionContext: { en: "condition context", zh: "条件语境" },
    productMetricStatus: { en: "product metric status", zh: "产物指标状态" },
    mechanismEvidence: { en: "mechanism evidence", zh: "机理证据" },
    stabilityEvidence: { en: "stability evidence", zh: "稳定性证据" },
    gasPair: { en: "gas pair", zh: "气体对" },
    uptakeSelectivityStatus: { en: "uptake/selectivity status", zh: "吸附/选择性状态" },
    temperature: { en: "temperature", zh: "温度" },
    pressure: { en: "pressure", zh: "压力" },
    method: { en: "method", zh: "方法" },
  }
  return labels[key]?.[lang === "zh" ? "zh" : "en"] || key
}

function addUnique(list, value) {
  if (value && !list.includes(value)) list.push(value)
}

function missingFieldsForFunction(candidate, compareFunction, lang, currentContext = {}) {
  const missing = []
  const zh = lang === "zh"
  const candidateKeys = new Set([...(compareFunction.actualFields || []), ...(compareFunction.keyFields || [])])

  candidateKeys.forEach(key => {
    const core = CORE_FIELDS.find(field => field.key === key)
    if (core) {
      const label = core.label[zh ? "zh" : "en"]
      const status = fieldStatus(candidate, key)
      const source = fieldSource(candidate, key)
      if (status === "missing" || !fieldHasValue(candidate, key)) {
        addUnique(missing, label)
      } else if (!isCuratedSource(source)) {
        addUnique(missing, zh ? `${label}来源` : `${label} source`)
      }
      if (status === "needs-review") addUnique(missing, zh ? `${label}复核` : `${label} review`)
      return
    }

    if (key === "sourceStatus") {
      if (sourceStatus(candidate, lang) === (zh ? "来源待补充" : "Source pending")) {
        addUnique(missing, zh ? "来源状态" : "source status")
      }
      return
    }
    if (key === "evidenceLevel" || key === "mechanismEvidence" || key === "stabilityEvidence") {
      if (isMissing(candidate.evidenceLevel)) addUnique(missing, fieldLabel(key, lang))
      return
    }
    if (key === "reactionClasses" || key === "reactionPathway") {
      if (!candidate.reactionClasses?.length) addUnique(missing, fieldLabel("reactionPathway", lang))
      return
    }
    if (key === "activeSiteHypothesis") {
      if (isMissing(candidate.activeSiteHypothesis)) addUnique(missing, fieldLabel(key, lang))
      return
    }
    if (["gasPair", "temperature", "pressure", "method"].includes(key) && !isMissing(currentContext[key])) return
    if (["conditionContext", "productMetricStatus", "gasPair", "uptakeSelectivityStatus", "temperature", "pressure", "method", "recyclability"].includes(key)) {
      addUnique(missing, fieldLabel(key, lang))
    }
  })

  return missing
}

function Section({ title, children, t, subtitle }) {
  return (
    <section style={{ display: "grid", gap: 10, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
      <div>
        <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 880 }}>{title}</div>
        {subtitle && <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>{subtitle}</div>}
      </div>
      {children}
    </section>
  )
}

function Table({ children, t, minWidth = 720 }) {
  return (
    <div style={{ overflowX: "auto", border: `1px solid ${t.border}`, borderRadius: 8 }}>
      <table style={{ width: "100%", minWidth, borderCollapse: "collapse", fontSize: 11 }}>
        {children}
      </table>
    </div>
  )
}

function FormControl({ label, value, onChange, options, t }) {
  return (
    <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase", minWidth: 0 }}>
      {label}
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 9px", color: t.text, fontSize: 12, width: "100%" }}
      >
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function optionsWithCurrent(options, value) {
  if (isMissing(value) || options.includes(value)) return options
  return [value, ...options]
}

function TextControl({ label, value, onChange, placeholder, t }) {
  return (
    <label style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, textTransform: "uppercase", minWidth: 0 }}>
      {label}
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 9px", color: t.text, fontSize: 12, width: "100%", boxSizing: "border-box" }}
      />
    </label>
  )
}

function EmptyCandidateState({ t, children }) {
  return (
    <div style={{
      minHeight: 84,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      color: t.faint,
      fontSize: 11,
      lineHeight: 1.6,
      background: t.surface,
      border: `1px dashed ${t.border}`,
      borderRadius: 8,
      padding: 12,
    }}>
      {children}
    </div>
  )
}

export function CompareTray({ count, names = [], notice, onCompare, onClear, t, lang, isMobile }) {
  const status = count === 0
    ? (lang === "zh" ? "尚未选择候选材料" : "No candidates selected")
    : count === 1
      ? (lang === "zh" ? "已选择 1 个 · 请再添加 1 个" : "1 candidate selected · add one more")
      : (lang === "zh" ? `已选择 ${count} 个 · 可以对比` : `${count} candidates selected · ready to compare`)

  return (
    <div style={{
      position: "sticky",
      bottom: isMobile ? 8 : 12,
      zIndex: 10,
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: "10px 12px",
      boxShadow: t.shadowSm,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "wrap",
    }}>
      <div style={{ minWidth: 0, display: "grid", gap: 5 }}>
        <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{status}</div>
        {names.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {names.slice(0, 3).map(name => (
              <span key={name} style={{ color: t.subtle, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, padding: "3px 7px", fontSize: 10 }}>
                {name}
              </span>
            ))}
          </div>
        )}
        {notice && <div style={{ color: t.warn, fontSize: 10, lineHeight: 1.4 }}>{notice}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        <button type="button" onClick={onCompare} style={{ ...toolbarBtn(t), color: t.accentText, border: `1px solid ${t.accent}` }}>
          {lang === "zh" ? "打开对比器" : "Open builder"}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={count === 0}
          style={{ ...toolbarBtn(t), opacity: count === 0 ? 0.55 : 1, cursor: count === 0 ? "not-allowed" : "pointer" }}
        >
          {lang === "zh" ? "清空" : "Clear"}
        </button>
      </div>
    </div>
  )
}

export function CandidateComparisonModal({
  open,
  candidates = [],
  allCandidates = [],
  initialContext = null,
  onSelectionChange,
  onClose,
  t,
  lang,
  isMobile,
}) {
  const zh = lang === "zh"
  const controlled = typeof onSelectionChange === "function"
  const [loadedCandidates, setLoadedCandidates] = useState([])
  const [loadStatus, setLoadStatus] = useState("idle")
  const [internalIds, setInternalIds] = useState([])
  const [query, setQuery] = useState("")
  const [compareFunctionId, setCompareFunctionId] = useState("dataCompleteness")
  const [context, setContext] = useState(() => createDefaultContext())
  const [externalContext, setExternalContext] = useState(null)
  const [appliedContextKey, setAppliedContextKey] = useState("")
  const [built, setBuilt] = useState(false)
  const [showFullTable, setShowFullTable] = useState(false)
  const [notice, setNotice] = useState("")
  const [closeActive, setCloseActive] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open || allCandidates.length) return undefined
    let active = true
    setLoadStatus("loading")
    Promise.all([
      getGlobalMofCandidates({ mode: "open-mof-seed", throwOnError: false }),
      getMofCandidates({ mode: "demo", throwOnError: false }),
    ]).then(([openSeed, demo]) => {
      if (!active) return
      const rows = uniqueCandidates([
        ...(Array.isArray(openSeed) ? openSeed : []),
        ...(Array.isArray(demo) ? demo : []),
      ])
      setLoadedCandidates(rows)
      setLoadStatus(rows.length ? "loaded" : "empty")
    }).catch(() => {
      if (!active) return
      setLoadedCandidates([])
      setLoadStatus("empty")
    })
    return () => { active = false }
  }, [open, allCandidates.length])

  useEffect(() => {
    if (!open || controlled) return
    setInternalIds(candidates.map(item => item.id).filter(Boolean).slice(0, 3))
  }, [open, candidates, controlled])

  const normalizedAll = useMemo(() => {
    const rows = allCandidates.length ? allCandidates : loadedCandidates
    return uniqueCandidates(rows)
  }, [allCandidates, loadedCandidates])

  const candidateMap = useMemo(() => new Map(normalizedAll.map(item => [item.id, item])), [normalizedAll])
  const selectedIds = controlled ? candidates.map(item => item.id).filter(Boolean).slice(0, 3) : internalIds.slice(0, 3)
  const selected = selectedIds.map(id => candidateMap.get(id) || candidates.find(item => item.id === id)).filter(Boolean).map(normalizeCandidate)
  const compareFunction = COMPARE_FUNCTIONS.find(item => item.id === compareFunctionId) || COMPARE_FUNCTIONS[0]
  const canBuild = selected.length >= 2 && selected.length <= 3

  const filteredCandidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return normalizedAll
      .filter(item => !q || candidateSearchText(item).includes(q))
      .slice(0, q ? 12 : 8)
  }, [normalizedAll, query])

  useEffect(() => {
    if (!open) {
      setAppliedContextKey("")
      return
    }

    const key = contextKey(initialContext)
    if (appliedContextKey === key) return

    if (!initialContext) {
      setCompareFunctionId("dataCompleteness")
      setContext(createDefaultContext())
      setExternalContext(null)
      setNotice("")
      setBuilt(false)
      setShowFullTable(false)
      setAppliedContextKey(key)
      return
    }

    const nextFunctionId = normalizeCompareFunctionId(initialContext.compareFunction)
    const nextDefaults = createDefaultContext()
    nextDefaults[nextFunctionId] = {
      ...nextDefaults[nextFunctionId],
      ...(initialContext.conditionContext || {}),
    }
    setCompareFunctionId(nextFunctionId)
    setContext(nextDefaults)
    setExternalContext(initialContext)
    setBuilt(false)
    setShowFullTable(false)

    const matched = findCandidateFromContext(initialContext, normalizedAll)
    const currentIds = controlled ? candidates.map(item => item.id).filter(Boolean).slice(0, 3) : internalIds.slice(0, 3)
    if (matched?.id) {
      if (currentIds.includes(matched.id)) {
        setNotice(zh ? "已从 GasSep 带入气体分离条件语境。" : "Gas separation context loaded from GasSep.")
      } else if (currentIds.length >= 3) {
        setNotice(zh ? "已达到对比上限，如需添加请先移除一个候选材料。" : "Comparison limit reached. Remove a candidate to add another.")
      } else {
        const nextIds = [...currentIds, matched.id].slice(0, 3)
        if (controlled) onSelectionChange?.(nextIds)
        else setInternalIds(nextIds)
        setNotice(zh ? "已从 GasSep 带入气体分离条件语境。" : "Gas separation context loaded from GasSep.")
      }
    } else {
      setNotice(zh ? "已带入条件语境，候选材料匹配待补充。" : "Condition context loaded. Candidate match is pending.")
    }

    setAppliedContextKey(key)
  }, [open, initialContext, appliedContextKey, normalizedAll, controlled, candidates, internalIds, onSelectionChange, zh])

  if (!open) return null

  const updateSelectedIds = (nextIds) => {
    setNotice("")
    const unique = Array.from(new Set(nextIds)).slice(0, 3)
    if (controlled) onSelectionChange(unique)
    else setInternalIds(unique)
    setBuilt(false)
  }

  const addCandidate = (candidate) => {
    if (selectedIds.includes(candidate.id)) return
    if (selectedIds.length >= 3) {
      setNotice(zh ? "为保证可读性，每次最多对比 3 个候选材料。" : "For readability, compare up to 3 candidates.")
      return
    }
    updateSelectedIds([...selectedIds, candidate.id])
  }

  const removeCandidate = (id) => updateSelectedIds(selectedIds.filter(item => item !== id))
  const clearSelected = () => {
    updateSelectedIds([])
    setCompareFunctionId("dataCompleteness")
    setContext(createDefaultContext())
    setExternalContext(null)
    setAppliedContextKey("")
    setNotice("")
  }
  const updateContext = (key, value) => {
    setContext(prev => ({ ...prev, [compareFunctionId]: { ...prev[compareFunctionId], [key]: value } }))
    setBuilt(false)
  }

  const exportComparison = () => {
    const payload = {
      schema: "ecomof-comparison-builder-v1",
      exportedAt: new Date().toISOString(),
      compareFunction: compareFunction.label.en,
      conditionContext: context[compareFunctionId],
      candidates: selected.map(candidate => ({
        id: candidate.id,
        name: candidate.name,
        dataStatus: candidate.dataStatus,
        evidenceLevel: candidate.evidenceLevel,
        conditionMatch: conditionMatch(candidate, compareFunction, lang).label,
        keyFields: Object.fromEntries(compareFunction.keyFields.map(key => [key, displayComparisonField(candidate, key, lang, compareFunctionId, context[compareFunctionId])])),
        dataConfidence: dataConfidence(candidate),
      })),
    }
    downloadTextFile("ecomof_comparison_builder.json", JSON.stringify(payload, null, 2), "application/json")
  }

  const renderConditionControls = () => {
    const current = context[compareFunctionId] || {}
    if (compareFunctionId === "dataCompleteness") {
      return (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CORE_FIELDS.map(field => (
            <span key={field.key} style={{ color: t.subtle, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, padding: "5px 8px", fontSize: 11 }}>
              {field.key}
            </span>
          ))}
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, flexBasis: "100%" }}>
            {zh ? "核心 8 项描述符完整度检查。" : "Core 8 descriptor completeness check."}
          </div>
        </div>
      )
    }
    if (compareFunctionId === "co2Capture") {
      return (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          <FormControl label={zh ? "气体" : "Gas"} value={current.gas} onChange={value => updateContext("gas", value)} options={["CO₂"]} t={t} />
          <FormControl label={zh ? "温度" : "Temperature"} value={current.temperature} onChange={value => updateContext("temperature", value)} options={["298 K", "custom"]} t={t} />
          <FormControl label={zh ? "压力" : "Pressure"} value={current.pressure} onChange={value => updateContext("pressure", value)} options={["1 bar", "custom"]} t={t} />
          <FormControl label={zh ? "单位" : "Unit"} value={current.unit} onChange={value => updateContext("unit", value)} options={["mmol/g", "cm³/g"]} t={t} />
          <FormControl label={zh ? "来源要求" : "Data source requirement"} value={current.sourceRequirement} onChange={value => updateContext("sourceRequirement", value)} options={["curated", "pending allowed"]} t={t} />
          <TextControl label={zh ? "自定义条件" : "Custom context"} value={current.custom || ""} onChange={value => updateContext("custom", value)} placeholder={zh ? "可选" : "optional"} t={t} />
        </div>
      )
    }
    if (compareFunctionId === "gasSeparation") {
      return (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          <FormControl label={zh ? "气体对" : "Gas pair"} value={current.gasPair} onChange={value => updateContext("gasPair", value)} options={optionsWithCurrent(["CO₂/N₂", "CO₂/CH₄", "C₂H₂/CO₂", "C₂H₂/C₂H₄", "Xe/Kr", "H₂/CO₂", "custom"], current.gasPair)} t={t} />
          <FormControl label={zh ? "比例" : "Ratio"} value={current.ratio} onChange={value => updateContext("ratio", value)} options={optionsWithCurrent(["15/85", "50/50", "custom"], current.ratio)} t={t} />
          <FormControl label={zh ? "温度" : "Temperature"} value={current.temperature} onChange={value => updateContext("temperature", value)} options={optionsWithCurrent(["273 K", "298 K", "313 K", "custom"], current.temperature)} t={t} />
          <FormControl label={zh ? "压力" : "Pressure"} value={current.pressure} onChange={value => updateContext("pressure", value)} options={optionsWithCurrent(["1 bar", "5 bar", "custom"], current.pressure)} t={t} />
          <FormControl label={zh ? "方法" : "Method"} value={current.method} onChange={value => updateContext("method", value)} options={optionsWithCurrent(["IAST", "GCMC", "breakthrough", "experimental", "pending"], current.method)} t={t} />
        </div>
      )
    }
    if (compareFunctionId === "catalysis") {
      return (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          <FormControl label={zh ? "反应家族" : "Reaction family"} value={current.reactionFamily} onChange={value => updateContext("reactionFamily", value)} options={["CO₂ conversion", "biomass-assisted HCO₃⁻ conversion", "cycloaddition"]} t={t} />
          <FormControl label={zh ? "底物" : "Substrate"} value={current.substrate} onChange={value => updateContext("substrate", value)} options={["glucose", "epoxide", "CO₂", "pending"]} t={t} />
          <FormControl label={zh ? "CO₂/HCO₃⁻ 来源" : "CO₂/HCO₃⁻ source"} value={current.co2Source} onChange={value => updateContext("co2Source", value)} options={["CO₂", "NaHCO₃", "HCO₃⁻", "pending"]} t={t} />
          <FormControl label={zh ? "温度" : "Temperature"} value={current.temperature} onChange={value => updateContext("temperature", value)} options={["170 ℃", "custom", "pending"]} t={t} />
          <FormControl label={zh ? "产物关注" : "Product focus"} value={current.productFocus} onChange={value => updateContext("productFocus", value)} options={["formic acid", "formate", "lactic acid", "cyclic carbonate", "pending"]} t={t} />
        </div>
      )
    }
    return (
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <FormControl label={zh ? "优先项" : "Priority"} value={current.priority} onChange={value => updateContext("priority", value)} options={["low toxicity", "water stability", "thermal stability", "recyclability", "LCA-ready data"]} t={t} />
        <FormControl label={zh ? "应用语境" : "Application context"} value={current.applicationContext} onChange={value => updateContext("applicationContext", value)} options={["CO₂ capture", "catalysis", "gas separation", "general screening"]} t={t} />
      </div>
    )
  }

  const modalHeight = isMobile ? "100dvh" : "min(86vh, 900px)"
  const searchListHeight = isMobile ? 250 : 278
  const closeButtonStyle = {
    width: 42,
    height: 42,
    minWidth: 42,
    minHeight: 42,
    borderRadius: 8,
    border: `1px solid ${closeActive ? t.accent : t.border}`,
    background: closeActive ? t.badgeInfoBg : t.surface,
    color: closeActive ? t.accentText : t.textStrong,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 22,
    fontWeight: 850,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: closeActive ? t.shadowSm : "none",
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-comparison-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(15, 23, 42, 0.46)",
        display: "flex",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 24,
      }}
    >
      <div style={{
        width: isMobile ? "100%" : "min(1180px, 100%)",
        height: modalHeight,
        maxHeight: modalHeight,
        overflow: "hidden",
        background: t.bg,
        border: isMobile ? "none" : `1px solid ${t.borderStrong}`,
        borderRadius: isMobile ? 0 : 8,
        boxShadow: t.shadowLg || t.shadowSm,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          padding: isMobile ? "14px 14px 12px" : "18px 18px 14px",
          borderBottom: `1px solid ${t.border}`,
          flex: "0 0 auto",
        }}>
          <div style={{ minWidth: 0, paddingRight: 4 }}>
            <h2 id="candidate-comparison-title" style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 18 : 20, lineHeight: 1.25 }}>
              {zh ? "MOF 对比配置器" : "MOF Comparison Builder"}
            </h2>
            <p style={{ margin: "7px 0 0", color: t.muted, fontSize: 12, lineHeight: 1.65, maxWidth: 900 }}>
              {zh
                ? "选择候选材料、比较功能和条件语境，只查看可比较字段、缺失数据和来源状态。"
                : "Choose candidates, select a comparison function, set condition context, and review comparable fields."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            onMouseEnter={() => setCloseActive(true)}
            onMouseLeave={() => setCloseActive(false)}
            onFocus={() => setCloseActive(true)}
            onBlur={() => setCloseActive(false)}
            aria-label={zh ? "关闭对比配置器" : "Close comparison builder"}
            style={closeButtonStyle}
          >
            ×
          </button>
        </div>

        <div style={{
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          padding: isMobile ? 14 : 18,
          display: "grid",
          gap: 14,
        }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(320px, 0.9fr) minmax(0, 1.35fr)", gap: 12, alignItems: "start" }}>
          <Section
            title={zh ? "1. 选择 MOF 候选材料" : "1. Select MOF candidates"}
            subtitle={zh ? "建议选择 2–3 个候选材料进行清晰对比。" : "Select 2–3 candidates for a readable comparison."}
            t={t}
          >
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={zh ? "搜索 MOF 名称、金属、配体或标签" : "Search MOF name, metal, linker, or tag"}
              style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "9px 11px", color: t.text, fontSize: 12, width: "100%", boxSizing: "border-box" }}
            />

            <div style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              minHeight: 34,
              maxHeight: 78,
              overflowY: "auto",
              alignContent: "flex-start",
              paddingRight: 2,
            }}>
              {selected.map(candidate => (
                <span key={candidate.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 999, padding: "5px 8px", color: t.accentText, fontSize: 11, fontWeight: 800 }}>
                  {candidate.name}
                  <button type="button" onClick={() => removeCandidate(candidate.id)} aria-label={zh ? `移除 ${candidate.name}` : `Remove ${candidate.name}`} style={{ border: "none", background: "transparent", color: t.subtle, cursor: "pointer", padding: 0, fontSize: 12 }}>×</button>
                </span>
              ))}
              {selected.length > 0 && (
                <button type="button" onClick={clearSelected} style={{ ...toolbarBtn(t), padding: "4px 8px", fontSize: 10 }}>
                  {zh ? "清空" : "Clear"}
                </button>
              )}
            </div>

            {!canBuild && (
              <div style={{ color: t.warn, fontSize: 11, lineHeight: 1.5 }}>
                {zh ? "请至少添加 2 个候选材料进行对比。" : "Add at least 2 candidates to compare."}
              </div>
            )}
            {notice && <div style={{ color: t.warn, fontSize: 11, lineHeight: 1.5 }}>{notice}</div>}
            <div style={{ display: "grid", gap: 7, height: searchListHeight, overflowY: "auto", paddingRight: 2 }}>
              {loadStatus === "loading" && (
                <EmptyCandidateState t={t}>{zh ? "候选材料数据加载中。" : "Candidate data is loading."}</EmptyCandidateState>
              )}
              {loadStatus !== "loading" && normalizedAll.length === 0 && (
                <EmptyCandidateState t={t}>
                  {zh ? "暂无候选材料记录。可尝试打开 MOF 候选库或刷新页面。" : "No candidate records are available. Try opening MOF Library or refreshing the page."}
                </EmptyCandidateState>
              )}
              {loadStatus !== "loading" && normalizedAll.length > 0 && filteredCandidates.length === 0 && (
                <EmptyCandidateState t={t}>{zh ? "未找到匹配候选材料" : "No matching candidates"}</EmptyCandidateState>
              )}
              {loadStatus !== "loading" && normalizedAll.length > 0 && filteredCandidates.map(candidate => {
                const selectedAlready = selectedIds.includes(candidate.id)
                const limitReached = selectedIds.length >= 3 && !selectedAlready
                const curatedCount = curatedDescriptorCount(candidate)
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => selectedAlready ? removeCandidate(candidate.id) : addCandidate(candidate)}
                    disabled={limitReached}
                    title={limitReached ? (zh ? "为保证可读性，每次最多对比 3 个候选材料。" : "For readability, compare up to 3 candidates.") : undefined}
                    style={{
                      all: "unset",
                      cursor: limitReached ? "not-allowed" : "pointer",
                      background: selectedAlready ? t.badgeInfoBg : t.surface,
                      border: `1px solid ${selectedAlready ? t.accent : t.border}`,
                      borderRadius: 8,
                      padding: "9px 10px",
                      display: "grid",
                      gap: 5,
                      opacity: limitReached ? 0.62 : 1,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{candidate.name}</span>
                      <span style={{ color: selectedAlready ? t.accentText : t.faint, fontSize: 10, fontWeight: 800 }}>
                        {selectedAlready ? (zh ? "已加入" : "Added") : limitReached ? (zh ? "已达到对比上限" : "Compare limit reached") : (zh ? "加入对比" : "Add")}
                      </span>
                    </div>
                    <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.45 }}>
                      {candidate.id} · {candidate.metal} · {candidate.linker}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <BasisBadge tone={curatedCount >= 5 ? "calc" : curatedCount > 0 ? "info" : "proxy"}>
                        {zh ? `已整理 ${curatedCount}/8 个描述符` : `${curatedCount}/8 descriptors curated`}
                      </BasisBadge>
                      <BasisBadge tone="proxy">{candidate.dataStatus}</BasisBadge>
                    </div>
                  </button>
                )
              })}
            </div>
          </Section>

          <div style={{ display: "grid", gap: 12 }}>
            <Section title={zh ? "2. 比较功能" : "2. Compare function"} t={t}>
              <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
                {COMPARE_FUNCTIONS.map(item => {
                  const active = item.id === compareFunctionId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { setCompareFunctionId(item.id); setBuilt(false); setShowFullTable(false) }}
                      style={{
                        ...toolbarBtn(t),
                        flex: "0 0 auto",
                        border: `1px solid ${active ? t.accent : t.border}`,
                        color: active ? t.accentText : t.subtle,
                        background: active ? t.badgeInfoBg : t.surface,
                      }}
                    >
                      {item.label[zh ? "zh" : "en"]}
                    </button>
                  )
                })}
              </div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
                {compareFunction.description[zh ? "zh" : "en"]}
              </div>
            </Section>

            <Section
              title={zh ? "3. 条件语境" : "3. Condition context"}
              subtitle={zh ? "这些条件用于对比语境，不代表已验证实验条件。" : "These settings define comparison context; they are not validated experimental conditions."}
              t={t}
            >
              {externalContext?.source === "gassep-record" && compareFunctionId === "gasSeparation" && (
                <div style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  color: t.subtle,
                  fontSize: 11,
                  lineHeight: 1.55,
                  padding: "8px 10px",
                }}>
                  {zh
                    ? "已从 GasSep 带入气体分离条件语境。生成对比前仍可修改条件字段。"
                    : "Gas separation context loaded from GasSep. You can edit the condition fields before building the comparison."}
                </div>
              )}
              {renderConditionControls()}
            </Section>

            <Section title={zh ? "4. 生成对比" : "4. Build comparison"} t={t}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={!canBuild}
                  onClick={() => setBuilt(true)}
                  style={{
                    ...toolbarBtn(t),
                    border: `1px solid ${canBuild ? t.accent : t.border}`,
                    color: canBuild ? t.accentText : t.faint,
                    opacity: canBuild ? 1 : 0.56,
                    cursor: canBuild ? "pointer" : "not-allowed",
                    fontWeight: 850,
                  }}
                >
                  {zh ? "生成对比" : "Build comparison"}
                </button>
                <button type="button" disabled={!selected.length} onClick={exportComparison} style={{ ...toolbarBtn(t), opacity: selected.length ? 1 : 0.55 }}>
                  {zh ? "导出对比" : "Export comparison"}
                </button>
                <span style={{ color: t.faint, fontSize: 11 }}>
                  {canBuild ? (zh ? "不生成最终排序结论，仅显示条件化可比性。" : "No final ranking is generated; this shows contextual comparability only.") : (zh ? "请至少选择 2 个候选材料。" : "Select at least 2 candidates.")}
                </span>
              </div>
            </Section>
          </div>
        </div>

        {built && (
          <div style={{ display: "grid", gap: 12 }}>
            <Section title={zh ? "条件匹配度" : "Condition match"} t={t}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                {selected.map(candidate => {
                  const match = conditionMatch(candidate, compareFunction, lang)
                  return (
                    <div key={candidate.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, display: "grid", gap: 7 }}>
                      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{candidate.name}</div>
                      <BasisBadge tone={match.tone}>{match.label}</BasisBadge>
                      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>{sourceStatus(candidate, lang)}</div>
                    </div>
                  )
                })}
              </div>
            </Section>

            <Section title={zh ? "关键字段" : "Key fields"} t={t}>
              <Table t={t}>
                <thead>
                  <tr style={{ background: t.surface }}>
                    <th style={{ textAlign: "left", color: t.faint, padding: "8px 10px", borderBottom: `1px solid ${t.border}`, width: 190 }}>{zh ? "字段" : "Field"}</th>
                    {selected.map(candidate => (
                      <th key={candidate.id} style={{ textAlign: "left", color: t.textStrong, padding: "8px 10px", borderBottom: `1px solid ${t.border}` }}>{candidate.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareFunction.keyFields.map(key => (
                    <tr key={key}>
                      <td style={{ padding: "8px 10px", color: t.faint, borderTop: `1px solid ${t.border}` }}>{fieldLabel(key, lang)}</td>
                      {selected.map(candidate => (
                        <td key={candidate.id} style={{ padding: "8px 10px", color: t.textStrong, borderTop: `1px solid ${t.border}`, verticalAlign: "top" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, maxWidth: "100%" }}>
                            <span style={{ overflowWrap: "anywhere" }}>{displayComparisonField(candidate, key, lang, compareFunctionId, context[compareFunctionId])}</span>
                            {CORE_FIELDS.some(field => field.key === key) && (
                              <FieldProvenanceButton
                                fieldKey={key}
                                fieldLabel={fieldLabel(key, lang)}
                                source={fieldSource(candidate, key)}
                                lang={lang}
                              />
                            )}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Section>

            <Section title={zh ? "数据可信度" : "Data confidence"} t={t}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                {selected.map(candidate => {
                  const summary = dataConfidence(candidate)
                  return (
                    <div key={candidate.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11, display: "grid", gap: 8 }}>
                      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{candidate.name}</div>
                      <div style={{ height: 7, background: t.panel, borderRadius: 999, overflow: "hidden", border: `1px solid ${t.border}` }}>
                        <div style={{ width: `${summary.completeness}%`, height: "100%", background: t.accent }} />
                      </div>
                      {[
                        [zh ? "描述符完整度" : "descriptor completeness", `${summary.completeness}%`],
                        [zh ? "已整理字段" : "curated fields", summary.curated],
                        [zh ? "待补充字段" : "pending fields", summary.pending],
                        [zh ? "需复核字段" : "needs review fields", summary.needsReview],
                        [zh ? "来源状态" : "source status", sourceStatus(candidate, lang)],
                        [zh ? "证据等级" : "evidence level", candidate.evidenceLevel || curationPendingLabel(lang)],
                      ].map(([label, value]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8, color: t.muted, fontSize: 11 }}>
                          <span>{label}</span>
                          <strong style={{ color: t.textStrong, fontWeight: 850, textAlign: "right" }}>{value}</strong>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </Section>

            <Section title={zh ? "待补充字段" : "Missing fields"} t={t}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                {selected.map(candidate => {
                  const missing = missingFieldsForFunction(candidate, compareFunction, lang, context[compareFunctionId])
                  return (
                    <div key={candidate.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
                      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 7 }}>{candidate.name}</div>
                      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.6, marginBottom: 5 }}>
                        {zh ? `${compareFunction.label.zh} 场景待补充：` : `Missing for ${compareFunction.label.en}:`}
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, color: t.muted, fontSize: 11, lineHeight: 1.7 }}>
                        {(missing.length ? missing : [zh ? "当前关键字段无明显缺失" : "No obvious key-field gaps"]).map(item => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </Section>

            <Section title={zh ? "完整描述符表" : "Full descriptor table"} t={t}>
              <button type="button" onClick={() => setShowFullTable(prev => !prev)} style={{ ...toolbarBtn(t), justifySelf: "start" }}>
                {showFullTable ? (zh ? "收起完整描述符表" : "Hide full descriptor table") : (zh ? "查看完整描述符表" : "Show full descriptor table")}
              </button>
              {showFullTable && (
                <Table t={t} minWidth={820}>
                  <thead>
                    <tr style={{ background: t.surface }}>
                      <th style={{ textAlign: "left", color: t.faint, padding: "8px 10px", borderBottom: `1px solid ${t.border}` }}>{zh ? "描述符" : "Descriptor"}</th>
                      {selected.map(candidate => (
                        <th key={candidate.id} style={{ textAlign: "left", color: t.textStrong, padding: "8px 10px", borderBottom: `1px solid ${t.border}` }}>{candidate.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CORE_FIELDS.map(field => (
                      <tr key={field.key}>
                        <td style={{ padding: "8px 10px", color: t.faint, borderTop: `1px solid ${t.border}` }}>{field.label[zh ? "zh" : "en"]}</td>
                        {selected.map(candidate => {
                          const status = fieldStatus(candidate, field.key)
                          return (
                            <td key={candidate.id} style={{ padding: "8px 10px", color: t.textStrong, borderTop: `1px solid ${t.border}`, verticalAlign: "top" }}>
                              <div style={{ display: "grid", gap: 5 }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, maxWidth: "100%" }}>
                                  <span style={{ overflowWrap: "anywhere" }}>{displayField(candidate, field.key, lang)}</span>
                                  <FieldProvenanceButton
                                    fieldKey={field.key}
                                    fieldLabel={field.label[zh ? "zh" : "en"]}
                                    source={fieldSource(candidate, field.key)}
                                    lang={lang}
                                  />
                                </span>
                                <BasisBadge tone={statusTone(status)}>{statusLabel(status, lang)}</BasisBadge>
                                <span style={{ color: t.faint, fontSize: 10 }}>{zh ? "来源状态" : "source status"}: {sourceStatus(candidate, lang)}</span>
                                <span style={{ color: t.faint, fontSize: 10 }}>{zh ? "证据状态" : "evidence status"}: {evidenceStatus(candidate, field.key, lang)}</span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Section>
          </div>
        )}

        </div>

        <div style={{
          color: t.faint,
          fontSize: 11,
          lineHeight: 1.6,
          borderTop: `1px solid ${t.border}`,
          padding: isMobile ? "10px 14px 14px" : "10px 18px 16px",
          flex: "0 0 auto",
          background: t.bg,
        }}>
          {zh ? "场景对比基于当前可用描述符、整理状态和条件语境。" : "Scenario comparison uses available descriptors, curation status, and condition context."}{" "}
          <DisclaimerLink />
        </div>
      </div>
    </div>
  )
}
