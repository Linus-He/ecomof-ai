// @ts-nocheck

const NON_EMPTY = (value) => value !== null && value !== undefined && value !== ""

export const CATALYSIS_CONDITION_FIELDS = [
  { id: "cell", zh: "电解池", en: "Cell", missingTerms: ["cell type", "cell architecture"] },
  { id: "electrolyte", zh: "电解液", en: "Electrolyte", missingTerms: ["electrolyte"] },
  { id: "potential", zh: "电位", en: "Potential", missingTerms: ["potential"] },
  { id: "control", zh: "控制模式", en: "Control mode", missingTerms: ["current density", "current mode"] },
  { id: "duration", zh: "时长", en: "Duration", missingTerms: ["duration"] },
  { id: "loading", zh: "载量基准", en: "Loading basis", missingTerms: ["catalyst loading", "loading basis"] },
  { id: "quantification", zh: "产物定量", en: "Quantification", missingTerms: ["product quantification"] },
]

export const CATALYSIS_EVIDENCE_FIELDS = [
  { id: "preReaction", zh: "反应前", en: "Pre-reaction" },
  { id: "inSitu", zh: "原位 / 操作态", en: "In situ / operando" },
  { id: "postReaction", zh: "反应后", en: "Post-reaction" },
  { id: "computational", zh: "计算", en: "Computational" },
  { id: "intermediateEvidence", zh: "中间体", en: "Intermediate" },
]

export const CATALYSIS_METRIC_LABELS = {
  faradaic_efficiency: { zh: "法拉第效率", en: "Faradaic efficiency" },
  faradaic_efficiency_after_stability: { zh: "稳定性测试后法拉第效率", en: "FE after stability" },
  partial_current_density: { zh: "分电流密度", en: "Partial current density" },
  mass_specific_partial_current_density: { zh: "质量归一化分电流密度", en: "Mass-specific partial current density" },
  total_current_density: { zh: "总电流密度", en: "Total current density" },
  stability_duration: { zh: "稳定性时长", en: "Stability duration" },
  mass_activity: { zh: "质量活性", en: "Mass activity" },
  carbon_energy_efficiency: { zh: "碳能量效率", en: "Carbon energy efficiency" },
  turnover_frequency: { zh: "周转频率", en: "Turnover frequency" },
  electrical_conductivity: { zh: "电导率", en: "Electrical conductivity" },
  selective_potential_window: { zh: "选择性电位窗口", en: "Selective potential window" },
}

function firstMetricCondition(record, keys) {
  for (const metric of record?.performanceMetrics || []) {
    for (const key of keys) {
      if (NON_EMPTY(metric?.condition?.[key])) return metric.condition[key]
    }
  }
  return null
}

function firstCondition(record, keys) {
  for (const key of keys) {
    if (NON_EMPTY(record?.conditions?.[key])) return record.conditions[key]
  }
  return firstMetricCondition(record, keys)
}

function fieldWasExplicitlyMissing(record, terms) {
  const missing = (record?.conditions?.missingFields || []).map(field => String(field).toLowerCase())
  return terms.some(term => missing.some(field => field.includes(term)))
}

function fieldState(id, record) {
  const conditions = record?.conditions || {}
  const metricConditions = (record?.performanceMetrics || []).map(metric => metric?.condition || {})
  const directKeys = {
    cell: ["cellType"],
    electrolyte: ["electrolyte"],
    potential: ["potentialVsRheV", "potentialVsRheVApprox"],
    control: ["currentMode", "appliedCurrentDensity"],
    duration: ["durationH"],
    loading: ["catalystLoading", "catalystLoadingMgCm2", "loadingBasis"],
    quantification: ["productQuantificationProtocol", "quantificationMethod"],
  }[id] || []
  const directlyAvailable = directKeys.some(key => NON_EMPTY(conditions[key]))
  let value = null

  if (id === "cell") value = firstCondition(record, ["cellType"])
  if (id === "electrolyte") value = firstCondition(record, ["electrolyte"])
  if (id === "potential") value = firstCondition(record, ["potentialVsRheV", "potentialVsRheVApprox"])
  if (id === "control") {
    value = firstCondition(record, ["currentMode", "appliedCurrentDensity"])
    if (NON_EMPTY(conditions.appliedCurrentDensity)) {
      value = `${conditions.appliedCurrentDensity} ${conditions.appliedCurrentDensityUnit || ""}`.trim()
    }
  }
  if (id === "duration") value = firstCondition(record, ["durationH"])
  if (id === "loading") {
    value = firstCondition(record, ["catalystLoading", "catalystLoadingMgCm2", "loadingBasis"])
  }
  if (id === "quantification") {
    value = firstCondition(record, ["productQuantificationProtocol", "quantificationMethod"])
  }

  const field = CATALYSIS_CONDITION_FIELDS.find(item => item.id === id)
  const explicitMissing = fieldWasExplicitlyMissing(record, field?.missingTerms || [])
  const inferredFromMetric = !directlyAvailable && metricConditions.some(condition => {
    if (id === "cell") return NON_EMPTY(condition.cellType)
    if (id === "electrolyte") return NON_EMPTY(condition.electrolyte)
    if (id === "potential") return NON_EMPTY(condition.potentialVsRheV) || NON_EMPTY(condition.potentialVsRheVApprox)
    if (id === "duration") return NON_EMPTY(condition.durationH)
    return false
  })

  return {
    available: NON_EMPTY(value) && !explicitMissing,
    explicitMissing,
    inferredFromMetric,
    value,
  }
}

export function formatCatalysisValue(value) {
  if (!NON_EMPTY(value)) return "—"
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)))
  return String(value)
}

export function formatCatalysisMetric(metric, lang = "zh") {
  const zh = lang === "zh"
  const label = CATALYSIS_METRIC_LABELS[metric?.metric]?.[zh ? "zh" : "en"] || metric?.metric || (zh ? "未命名指标" : "Unnamed metric")
  if (!NON_EMPTY(metric?.value)) {
    return {
      label,
      value: zh ? "未提取" : "Not extracted",
      isMissing: true,
      condition: formatCatalysisMetricCondition(metric?.condition, lang),
    }
  }
  const operator = metric.operator && metric.operator !== "=" ? `${metric.operator} ` : ""
  return {
    label,
    value: `${operator}${formatCatalysisValue(metric.value)} ${metric.unit || ""}`.trim(),
    isMissing: false,
    condition: formatCatalysisMetricCondition(metric?.condition, lang),
  }
}

export function formatCatalysisMetricCondition(condition = {}, lang = "zh") {
  const zh = lang === "zh"
  const parts = []
  const potential = NON_EMPTY(condition.potentialVsRheV)
    ? condition.potentialVsRheV
    : condition.potentialVsRheVApprox
  if (NON_EMPTY(potential)) parts.push(`${condition.potentialVsRheVApprox != null ? "≈ " : ""}${potential} V vs RHE`)
  if (NON_EMPTY(condition.electrolyte)) parts.push(condition.electrolyte)
  if (NON_EMPTY(condition.cellType)) parts.push(condition.cellType)
  if (NON_EMPTY(condition.appliedCurrentDensity)) {
    parts.push(`${condition.appliedCurrentDensity} ${condition.appliedCurrentDensityUnit || ""}`.trim())
  }
  if (NON_EMPTY(condition.totalCurrentDensity)) parts.push(String(condition.totalCurrentDensity))
  if (NON_EMPTY(condition.durationH)) parts.push(`${condition.durationH} h`)
  return parts.length ? parts.join(" · ") : (zh ? "条件未提取" : "Condition not extracted")
}

function buildConditionSummary(record, lang = "zh") {
  const zh = lang === "zh"
  const cell = fieldState("cell", record).value
  const electrolyte = fieldState("electrolyte", record).value
  const potentialState = fieldState("potential", record)
  const potential = potentialState.value
  const parts = []
  if (NON_EMPTY(cell)) parts.push(String(cell))
  if (NON_EMPTY(electrolyte)) parts.push(String(electrolyte))
  if (NON_EMPTY(potential)) parts.push(`${potentialState.inferredFromMetric ? "≈ " : ""}${potential} V vs RHE`)
  return parts.length ? parts.join(" · ") : (zh ? "关键条件未提取" : "Critical conditions not extracted")
}

export function buildCatalysisReactionRecordRows(dataset, lang = "zh") {
  const sourceEntries = (dataset?.sources || []).map((source, index) => [source.id, { ...source, sourceIndex: index }])
  const sourceById = new Map(sourceEntries)

  return (dataset?.records || []).map((record, recordIndex) => {
    const source = sourceById.get(record.sourceId) || {}
    const conditionCoverage = Object.fromEntries(
      CATALYSIS_CONDITION_FIELDS.map(field => [field.id, fieldState(field.id, record)]),
    )
    const evidenceCoverage = Object.fromEntries(
      CATALYSIS_EVIDENCE_FIELDS.map(field => [field.id, {
        available: Array.isArray(record?.activePhaseEvidence?.[field.id]) && record.activePhaseEvidence[field.id].length > 0,
        count: Array.isArray(record?.activePhaseEvidence?.[field.id]) ? record.activePhaseEvidence[field.id].length : 0,
        items: Array.isArray(record?.activePhaseEvidence?.[field.id]) ? record.activePhaseEvidence[field.id] : [],
      }]),
    )
    const metrics = record?.performanceMetrics || []
    const numericMetrics = metrics.filter(metric => Number.isFinite(metric?.value))
    const notExtractedMetrics = metrics.filter(metric => metric?.status === "not-extracted" || !NON_EMPTY(metric?.value))
    const faradaicEfficiencyMetrics = numericMetrics.filter(metric => metric.metric === "faradaic_efficiency")
    const availableConditionCount = Object.values(conditionCoverage).filter(field => field.available).length

    return {
      id: record.id,
      recordIndex,
      sourceIndex: source.sourceIndex ?? recordIndex,
      sourceId: record.sourceId,
      source,
      doi: source.doi || record?.recordProvenance?.doi,
      doiUrl: source.doiUrl || record?.recordProvenance?.doiUrl,
      year: source.year,
      catalyst: record?.identity?.catalystName || record.id,
      precursor: record?.identity?.precursorMofName,
      activeMaterial: record?.identity?.activeMaterial,
      frameworkFamily: record?.identity?.frameworkFamily,
      metalCenters: record?.identity?.metalCenters || [],
      identityStatus: record?.identity?.identityLink?.status || "unresolved",
      identityCanonicalId: record?.identity?.identityLink?.canonicalId || null,
      identityJoinRule: record?.identity?.identityLink?.joinRule,
      reaction: record?.reaction || {},
      conditions: record?.conditions || {},
      conditionCoverage,
      conditionSummary: buildConditionSummary(record, lang),
      availableConditionCount,
      conditionCoverageRatio: availableConditionCount / CATALYSIS_CONDITION_FIELDS.length,
      evidenceCoverage,
      activePhaseEvidence: record?.activePhaseEvidence || {},
      metrics,
      numericMetrics,
      numericMetricCount: numericMetrics.length,
      notExtractedMetrics,
      notExtractedMetricCount: notExtractedMetrics.length,
      faradaicEfficiencyMetrics,
      missingFields: record?.conditions?.missingFields || [],
      hasInSituEvidence: evidenceCoverage.inSitu.available,
      hasCriticalGaps: (record?.conditions?.missingFields || []).length >= 4,
      comparability: record?.comparability || {},
      fieldSources: record?.fieldSources || {},
      provenance: record?.recordProvenance || {},
      raw: record,
    }
  })
}

export function filterCatalysisReactionRows(rows, filters = {}) {
  const search = String(filters.search || "").trim().toLowerCase()
  return (rows || []).filter(row => {
    if (search) {
      const haystack = [
        row.catalyst,
        row.precursor,
        row.activeMaterial,
        row.frameworkFamily,
        row.doi,
        row.source?.title,
        row.reaction?.targetProduct,
        ...(row.metalCenters || []),
      ].filter(Boolean).join(" ").toLowerCase()
      if (!haystack.includes(search)) return false
    }
    if (filters.identityStatus && filters.identityStatus !== "all" && row.identityStatus !== filters.identityStatus) return false
    if (filters.coverage === "has-metrics" && row.numericMetricCount === 0) return false
    if (filters.coverage === "has-in-situ" && !row.hasInSituEvidence) return false
    if (filters.coverage === "missing-critical" && !row.hasCriticalGaps) return false
    return true
  })
}

export function buildCatalysisReactionSummary(dataset, rows = buildCatalysisReactionRecordRows(dataset)) {
  const allRows = rows || []
  return {
    sourceCount: dataset?.audit?.sourceCount ?? (dataset?.sources || []).length,
    recordCount: allRows.length,
    numericMetricCount: allRows.reduce((total, row) => total + row.numericMetricCount, 0),
    notExtractedMetricCount: allRows.reduce((total, row) => total + row.notExtractedMetricCount, 0),
    rankingEligibleCount: dataset?.audit?.sameConditionRankingEligibleCount
      ?? allRows.filter(row => row.comparability?.sameConditionComparable).length,
    identityLinkedCount: dataset?.audit?.identityRegistryLinkedCount
      ?? allRows.filter(row => row.identityCanonicalId).length,
    inSituEvidenceCount: allRows.filter(row => row.hasInSituEvidence).length,
  }
}

export function buildFaradaicEfficiencyRows(rows) {
  return (rows || [])
    .flatMap(row => row.faradaicEfficiencyMetrics.map((metric, metricIndex) => ({
      id: `${row.id}-${metric.id}`,
      rowId: row.id,
      catalyst: row.catalyst,
      doi: row.doi,
      doiUrl: row.doiUrl,
      year: row.year,
      sourceIndex: row.sourceIndex,
      metricIndex,
      value: metric.value,
      unit: metric.unit,
      operator: metric.operator,
      status: metric.status,
      sourceLocation: metric.sourceLocation,
      condition: metric.condition || {},
      conditionLabelZh: formatCatalysisMetricCondition(metric.condition, "zh"),
      conditionLabelEn: formatCatalysisMetricCondition(metric.condition, "en"),
      displayLabel: row.faradaicEfficiencyMetrics.length > 1
        ? `${row.catalyst} · ${metric.condition?.electrolyte || metric.id}`
        : row.catalyst,
    })))
    .sort((a, b) => (a.year || 0) - (b.year || 0) || a.sourceIndex - b.sourceIndex || a.metricIndex - b.metricIndex)
}
