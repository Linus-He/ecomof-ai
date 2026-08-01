// @ts-nocheck

function finite(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function normalizeGasToken(value = "") {
  return String(value || "")
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, digit => "0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(digit)])
    .trim()
    .toUpperCase()
}

function parsePair(value = "") {
  const [primary, secondary] = String(value || "").split("/")
  return {
    primary: normalizeGasToken(primary),
    secondary: normalizeGasToken(secondary),
  }
}

function propertyMap(propertiesDoc = {}) {
  return new Map((Array.isArray(propertiesDoc.gases) ? propertiesDoc.gases : []).map(item => [normalizeGasToken(item.gas), item]))
}

function hasText(record = {}, patterns = []) {
  const haystack = [
    record.displayName,
    record.rawName,
    record.applicationScenario,
    record.descriptors?.metalNode,
    record.descriptors?.linker,
    record.descriptors?.topology,
    ...(Array.isArray(record.whyRecommended) ? record.whyRecommended : []),
    ...(Array.isArray(record.risks) ? record.risks : []),
    record.limitationNote,
  ].join(" ").toLowerCase()
  return patterns.some(pattern => haystack.includes(pattern))
}

function rowIdentity(row = {}) {
  return String(row.canonicalId || row.mofId || row.rawName || row.displayName || "").trim().toLowerCase()
}

function breakthroughRows(record = {}, rows = []) {
  const identity = rowIdentity(record)
  const pair = String(record.gasPair || "").toUpperCase()
  if (!identity || !pair) return []
  return (Array.isArray(rows) ? rows : [])
    .filter(row => rowIdentity(row) === identity && String(row.gasPair || "").toUpperCase() === pair)
    .map(row => ({
      temperatureK: finite(row.condition?.temperatureK ?? row.temperatureK),
      breakthroughTime: finite(row.metrics?.breakthroughTime ?? row.breakthroughTime),
      sourceRecordId: row.recordProvenance?.sourceRecordId || row.sourceRecordId || row.id,
    }))
    .filter(row => row.temperatureK !== null && row.breakthroughTime !== null)
    .sort((a, b) => a.temperatureK - b.temperatureK)
}

function temperatureResponse(record = {}, records = []) {
  const rows = breakthroughRows(record, records)
  if (rows.length < 2) {
    return {
      status: "temperature-series-missing",
      label: "temperature response pending",
      labelZh: "温度响应待补",
      rows,
      note: "At least two temperatures with dynamic breakthrough metrics are required.",
      noteZh: "至少需要两个温度下的动态穿透指标。",
    }
  }
  const first = rows[0]
  const last = rows[rows.length - 1]
  const ratio = first.breakthroughTime > 0 ? last.breakthroughTime / first.breakthroughTime : null
  if (ratio !== null && last.temperatureK > first.temperatureK && ratio >= 1.1) {
    return {
      status: "temperature-enhanced-breakthrough",
      label: "temperature-enhanced breakthrough",
      labelZh: "升温增强穿透表现",
      rows,
      ratio: Number(ratio.toPrecision(4)),
      note: "Dynamic performance increases at the higher-temperature endpoint; check for pore-gating or condition differences.",
      noteZh: "高温端动态表现增强；需检查孔门效应或工况差异。",
    }
  }
  return {
    status: "temperature-series-present",
    label: "temperature series available",
    labelZh: "已有温度序列",
    rows,
    ratio: ratio === null ? null : Number(ratio.toPrecision(4)),
    note: "Temperature-dependent dynamic evidence is present; interpret trend with identical feed and bed conditions.",
    noteZh: "已有温度相关动态证据；需在相同进料和床层条件下解释趋势。",
  }
}

function databaseSource(propertiesDoc = {}, id) {
  return (Array.isArray(propertiesDoc.sources) ? propertiesDoc.sources : []).find(source => source.id === id) || null
}

function lookupTarget(propertiesDoc = {}, id) {
  return (Array.isArray(propertiesDoc.databaseLookupTargets) ? propertiesDoc.databaseLookupTargets : []).find(target => target.id === id) || null
}

function layer(status, label, labelZh, detail, detailZh, evidence = "screening") {
  return { status, label, labelZh, detail, detailZh, evidence }
}

function statusTone(status = "") {
  const label = String(status).toLowerCase()
  if (label.includes("supported") || label.includes("present") || label.includes("available")) return "calc"
  if (label.includes("candidate") || label.includes("hypothesis")) return "info"
  if (label.includes("missing") || label.includes("absent") || label.includes("risk")) return "warn"
  return "proxy"
}

export function buildGasMechanismEvidence(record = {}, scenario = {}, propertiesDoc = {}, records = []) {
  const pairTokens = parsePair(scenario.gasPair || record.gasPair)
  const primaryGas = normalizeGasToken(record.primaryGas || pairTokens.primary)
  const secondaryGas = normalizeGasToken(record.secondaryGas || pairTokens.secondary)
  const gases = propertyMap(propertiesDoc)
  const primaryProperty = gases.get(primaryGas) || null
  const secondaryProperty = gases.get(secondaryGas) || null
  const primaryDiameter = finite(primaryProperty?.kineticDiameterA)
  const secondaryDiameter = finite(secondaryProperty?.kineticDiameterA)
  const diameterGap = primaryDiameter !== null && secondaryDiameter !== null
    ? Number(Math.abs(primaryDiameter - secondaryDiameter).toPrecision(4))
    : null
  const maxDiameter = primaryDiameter !== null && secondaryDiameter !== null ? Math.max(primaryDiameter, secondaryDiameter) : null
  const minDiameter = primaryDiameter !== null && secondaryDiameter !== null ? Math.min(primaryDiameter, secondaryDiameter) : null
  const poreSizeA = finite(record.poreSizeA ?? record.descriptors?.poreSizeA)
  const selectivity = finite(record.selectivity ?? record.metrics?.selectivity ?? record.iaSTSelectivity)
  const qst = finite(record.heatOfAdsorption ?? record.metrics?.heatOfAdsorption)
  const breakthroughTime = finite(record.breakthroughTime ?? record.metrics?.breakthroughTime)
  const evidence = record.evidence || {}
  const hasBreakthrough = Boolean(evidence.hasBreakthroughValidation) || breakthroughTime !== null
  const hasIast = Boolean(evidence.hasIASTValidation) || finite(record.iaSTSelectivity ?? record.metrics?.iaSTSelectivity) !== null
  const hasHumidity = Boolean(record.condition?.humidity && !["unknown", "not reported", "pending"].includes(String(record.condition.humidity).toLowerCase()))
  const hasCycle = Boolean(record.condition?.cycleType && !["unknown", "not specified", "pending"].includes(String(record.condition.cycleType).toLowerCase()))
  const closeSizePair = diameterGap !== null && diameterGap <= 0.45
  const tightWindow = poreSizeA !== null && maxDiameter !== null && poreSizeA <= maxDiameter + 1.1
  const openWindow = poreSizeA !== null && maxDiameter !== null && poreSizeA > maxDiameter + 2.5
  const flexibleHint = hasText(record, ["flex", "soft", "gate", "breath", "responsive", "dynamic", "temperature"])
  const temperature = temperatureResponse(record, records)

  const thermodynamicSupported = selectivity !== null || hasIast || qst !== null
  const kineticCandidate = closeSizePair || tightWindow
  const frameworkCandidate = flexibleHint || (kineticCandidate && tightWindow)

  const layers = [
    layer(
      thermodynamicSupported ? "supported-equilibrium-evidence" : "equilibrium-data-missing",
      "Equilibrium thermodynamics",
      "平衡热力学",
      thermodynamicSupported
        ? "Selectivity, IAST, uptake, or Qst can explain affinity and adsorbed-phase competition."
        : "Add single-component isotherms, Henry/IAST, or Qst before claiming affinity-driven separation.",
      thermodynamicSupported
        ? "选择性、IAST、吸附量或 Qst 可用于解释亲和与吸附相竞争。"
        : "需要补单组分等温线、Henry/IAST 或 Qst，才能声称亲和驱动分离。",
      thermodynamicSupported ? "condition-bound" : "missing",
    ),
    layer(
      kineticCandidate ? "kinetic-sieving-candidate" : "kinetic-evidence-pending",
      "Transport and kinetic sieving",
      "传质与动力学筛分",
      kineticCandidate
        ? "Gas sizes and/or pore aperture make diffusion-rate discrimination plausible; this is a hypothesis until diffusion or breakthrough data exists."
        : "Current size/pore context does not establish diffusion-rate selectivity.",
      kineticCandidate
        ? "气体尺寸和/或孔口尺寸使扩散速率差异具有可能性；在扩散或穿透数据前仍是机理假设。"
        : "当前尺寸/孔径语境不能建立扩散速率选择性。",
      kineticCandidate ? "hypothesis" : "pending",
    ),
    layer(
      frameworkCandidate ? "framework-response-hypothesis" : "framework-response-missing",
      "Framework response",
      "框架响应",
      frameworkCandidate
        ? "Flexible, gate-opening, or tight-aperture behavior should be checked with temperature/gas-loaded structural evidence."
        : "No current record-level evidence for gate opening, breathing, or temperature-responsive structure.",
      frameworkCandidate
        ? "柔性、孔门开启或窄孔口行为需要用温度/载气结构证据核查。"
        : "当前记录没有孔门开启、呼吸或温度响应结构证据。",
      frameworkCandidate ? "hypothesis" : "missing",
    ),
    layer(
      hasBreakthrough ? "process-evidence-present" : "breakthrough-evidence-missing",
      "Dynamic breakthrough",
      "动态穿透",
      hasBreakthrough
        ? "A breakthrough metric is present, so the candidate has process-level evidence that remains condition-bound."
        : "Equilibrium values do not establish packed-bed separation; add breakthrough time, flow rate, bed mass, and outlet concentration threshold.",
      hasBreakthrough
        ? "已有穿透指标，因此存在过程级证据，但仍绑定具体工况。"
        : "平衡数值不能证明固定床分离；需补穿透时间、流速、床层质量和出口浓度阈值。",
      hasBreakthrough ? "process" : "missing",
    ),
    layer(
      hasHumidity && hasCycle ? "robustness-context-present" : "robustness-context-missing",
      "Impurity, humidity, and cycling",
      "杂质、湿度与循环",
      hasHumidity && hasCycle
        ? "Humidity and cycle type are recorded; verify retention, impurities, and regeneration before deployment claims."
        : "Practical-feed robustness remains incomplete; add humidity, impurity, and cycling conditions.",
      hasHumidity && hasCycle
        ? "已记录湿度和循环类型；部署结论前仍需验证保持率、杂质和再生。"
        : "真实气源鲁棒性仍不完整；需补湿度、杂质和循环条件。",
      hasHumidity && hasCycle ? "context" : "missing",
    ),
  ]

  const supportedCount = layers.filter(item => item.status.includes("supported") || item.status.includes("present")).length
  const hypothesisCount = layers.filter(item => item.status.includes("candidate") || item.status.includes("hypothesis")).length
  const missingCount = layers.filter(item => item.status.includes("missing")).length
  const readiness = supportedCount >= 3 && missingCount <= 1
    ? "process-ready-evidence"
    : supportedCount >= 2 || hypothesisCount >= 2
      ? "mechanism-hypothesis-ready"
      : "screening-only"

  const databaseGaps = []
  if (!primaryProperty || !secondaryProperty) databaseGaps.push(lookupTarget(propertiesDoc, "molecular-property-gap"))
  if (!Array.isArray(record.isotherm) || record.isotherm.length < 3 || !hasIast) databaseGaps.push(lookupTarget(propertiesDoc, "isotherm-gap"))
  if (!hasBreakthrough) databaseGaps.push(lookupTarget(propertiesDoc, "breakthrough-gap"))
  if (frameworkCandidate && temperature.status === "temperature-series-missing") databaseGaps.push(lookupTarget(propertiesDoc, "framework-response-gap"))

  return {
    primaryGas,
    secondaryGas,
    primaryProperty,
    secondaryProperty,
    diameterGap,
    minDiameter,
    maxDiameter,
    poreSizeA,
    closeSizePair,
    tightWindow,
    openWindow,
    flexibleHint,
    kineticCandidate,
    frameworkCandidate,
    temperature,
    layers: layers.map(item => ({ ...item, tone: statusTone(item.status) })),
    readiness,
    readinessZh: readiness === "process-ready-evidence"
      ? "过程证据较完整"
      : readiness === "mechanism-hypothesis-ready"
        ? "机理假设可展开"
        : "仅适合早筛",
    supportedCount,
    hypothesisCount,
    missingCount,
    primaryMechanism: hasBreakthrough && kineticCandidate
      ? "kinetic sieving with process evidence"
      : thermodynamicSupported && !kineticCandidate
        ? "equilibrium-affinity dominated"
        : kineticCandidate
          ? "kinetic/dynamic sieving hypothesis"
          : "mechanism unresolved",
    primaryMechanismZh: hasBreakthrough && kineticCandidate
      ? "有过程证据的动力学筛分"
      : thermodynamicSupported && !kineticCandidate
        ? "平衡亲和主导"
        : kineticCandidate
          ? "动力学/动态筛分假设"
          : "机理未定",
    databaseGaps: databaseGaps.filter(Boolean).map(target => ({
      ...target,
      source: databaseSource(propertiesDoc, target.targetSourceId),
    })),
    sources: propertiesDoc.sources || [],
  }
}

export default buildGasMechanismEvidence
