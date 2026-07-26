// @ts-nocheck
import { calculateIastSelectivity, fitBestIsothermModel } from "../gasIastSelectivity"

const GAS_CONSTANT = 8.314462618

function finite(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function normalizedId(value) {
  return String(value || "").trim().toLowerCase()
}

function normalizedDoi(record = {}) {
  const safeRecord = record || {}
  return normalizedId(safeRecord.recordProvenance?.doi || safeRecord.doi)
}

function recordTemperature(record = {}) {
  const safeRecord = record || {}
  return finite(safeRecord.temperatureK ?? safeRecord.condition?.temperatureK)
}

function recordIdentity(record = {}) {
  const safeRecord = record || {}
  return normalizedId(safeRecord.canonicalId || safeRecord.mofId || safeRecord.rawName || safeRecord.displayName)
}

function recordPrimaryGas(record = {}) {
  return String(record?.primaryGas || "").trim().toUpperCase()
}

function sourceRecordId(record = {}) {
  const safeRecord = record || {}
  return normalizedId(
    safeRecord.recordProvenance?.sourceRecordId
      || safeRecord.sourceRecordId
      || safeRecord.linkedIsotherms?.primary?.filename,
  )
}

export function cleanThermodynamicIsotherm(isotherm = []) {
  return (Array.isArray(isotherm) ? isotherm : [])
    .map(point => ({
      pressureBar: finite(point.pressureBar ?? point.pressure),
      uptake: finite(point.uptake ?? point.total_adsorption),
      gas: point.gas || null,
      uptakeUnit: point.uptakeUnit || "mmol/g",
    }))
    .filter(point => point.pressureBar !== null && point.pressureBar > 0 && point.uptake !== null && point.uptake >= 0)
    .sort((a, b) => a.pressureBar - b.pressureBar)
}

function expectedSecondaryId(record = {}) {
  return normalizedId(
    record.linkedIsotherms?.secondary?.filename
      || record.fieldSources?.selectivity?.sourceIsothermIds?.secondary
      || record.fieldSources?.iaSTSelectivity?.sourceIsothermIds?.secondary
      || record.iast?.sourceIsothermIds?.secondary,
  )
}

export function findLinkedIsothermRecord(records = [], filename = "") {
  const target = normalizedId(filename)
  if (!target) return null
  return (Array.isArray(records) ? records : []).find(record => {
    const primaryFilename = normalizedId(record.linkedIsotherms?.primary?.filename)
    return primaryFilename === target || sourceRecordId(record) === target
  }) || null
}

export function buildPairedIsothermBundle(selected = {}, records = []) {
  const primary = cleanThermodynamicIsotherm(selected.isotherm)
  const secondaryId = expectedSecondaryId(selected)
  const secondaryRecord = findLinkedIsothermRecord(records, secondaryId)
  const embeddedSecondary = cleanThermodynamicIsotherm(selected.secondaryIsotherm)
  const secondary = embeddedSecondary.length >= 3
    ? embeddedSecondary
    : cleanThermodynamicIsotherm(secondaryRecord?.isotherm)
  const primaryTemperatureK = recordTemperature(selected)
  const secondaryTemperatureK = embeddedSecondary.length >= 3
    ? finite(selected.secondaryIsothermTemperatureK) ?? primaryTemperatureK
    : recordTemperature(secondaryRecord)
  const sameTemperature = primaryTemperatureK !== null
    && secondaryTemperatureK !== null
    && Math.abs(primaryTemperatureK - secondaryTemperatureK) <= 1

  return {
    status: primary.length < 3
      ? "primary-isotherm-unavailable"
      : secondaryId && secondary.length < 3
        ? "secondary-isotherm-unavailable"
        : !secondaryId
          ? "secondary-isotherm-not-linked"
          : !sameTemperature
            ? "temperature-mismatch"
            : "paired-isotherms",
    primary,
    secondary,
    secondaryRecord,
    primarySourceId: selected.linkedIsotherms?.primary?.filename
      || selected.recordProvenance?.sourceRecordId
      || selected.sourceRecordId
      || null,
    secondarySourceId: secondaryId || null,
    primaryTemperatureK,
    secondaryTemperatureK,
    sameTemperature,
  }
}

export function estimateHenryAffinity(isotherm = []) {
  const fit = fitBestIsothermModel(isotherm)
  if (fit.status !== "fit-ok") {
    return { status: "henry-unavailable", reason: fit.status, fit }
  }
  const parameters = fit.parameters || {}
  let value = null
  if (fit.model === "langmuir") value = finite(parameters.qm) * finite(parameters.b)
  if (fit.model === "dual-langmuir") {
    value = finite(parameters.qm1) * finite(parameters.b1) + finite(parameters.qm2) * finite(parameters.b2)
  }
  if (!Number.isFinite(value) || value <= 0) {
    return {
      status: fit.model === "freundlich" ? "henry-undefined-for-freundlich" : "henry-unavailable",
      reason: fit.model === "freundlich" ? "finite zero-pressure slope is not defined by the selected Freundlich fit" : "invalid fitted slope",
      fit,
    }
  }
  return {
    status: "model-derived-henry",
    value: Number(value.toPrecision(6)),
    unit: "mmol g-1 bar-1",
    fit,
    boundary: "zero-pressure affinity extrapolated from a fitted isotherm; not a primary measurement",
  }
}

function monotonicLoadingPoints(isotherm = []) {
  const rows = cleanThermodynamicIsotherm(isotherm)
  let runningMax = -Infinity
  return rows.map(point => {
    runningMax = Math.max(runningMax, point.uptake)
    return { ...point, uptake: runningMax }
  })
}

function pressureAtLoading(isotherm = [], targetLoading) {
  const target = finite(targetLoading)
  const points = monotonicLoadingPoints(isotherm)
  if (target === null || points.length < 3) return null
  for (const point of points) {
    if (Math.abs(point.uptake - target) <= 1e-10) return point.pressureBar
  }
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const current = points[index]
    if (target < previous.uptake || target > current.uptake || current.uptake <= previous.uptake) continue
    const fraction = (target - previous.uptake) / (current.uptake - previous.uptake)
    const logPressure = Math.log(previous.pressureBar)
      + fraction * (Math.log(current.pressureBar) - Math.log(previous.pressureBar))
    return Math.exp(logPressure)
  }
  return null
}

function linearRegression(xs = [], ys = []) {
  if (xs.length !== ys.length || xs.length < 3) return null
  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length
  const meanX = mean(xs)
  const meanY = mean(ys)
  const denominator = xs.reduce((sum, value) => sum + (value - meanX) ** 2, 0)
  if (denominator <= 1e-16) return null
  const slope = xs.reduce((sum, value, index) => sum + (value - meanX) * (ys[index] - meanY), 0) / denominator
  const intercept = meanY - slope * meanX
  const predicted = xs.map(value => intercept + slope * value)
  const ssTotal = ys.reduce((sum, value) => sum + (value - meanY) ** 2, 0)
  const ssResidual = ys.reduce((sum, value, index) => sum + (value - predicted[index]) ** 2, 0)
  const r2 = ssTotal <= 1e-16 ? null : 1 - ssResidual / ssTotal
  return { slope, intercept, r2 }
}

function uniqueTemperatureSeries(records = []) {
  const bySource = new Map()
  for (const record of records) {
    const temperatureK = recordTemperature(record)
    const sourceId = sourceRecordId(record) || normalizedId(record.id)
    const points = cleanThermodynamicIsotherm(record.isotherm)
    if (temperatureK === null || !sourceId || points.length < 3) continue
    if (!bySource.has(sourceId)) bySource.set(sourceId, { record, temperatureK, points, sourceId })
  }
  const byTemperature = new Map()
  for (const series of bySource.values()) {
    const existing = byTemperature.get(series.temperatureK)
    if (!existing || series.points.length > existing.points.length) byTemperature.set(series.temperatureK, series)
  }
  return [...byTemperature.values()].sort((a, b) => a.temperatureK - b.temperatureK)
}

export function estimateIsostericHeat(selected = {}, records = []) {
  const sourceValue = finite(selected.heatOfAdsorption ?? selected.metrics?.heatOfAdsorption)
  if (sourceValue !== null) {
    const source = selected.fieldSources?.heatOfAdsorption || {}
    return {
      status: "source-reported-qst",
      value: sourceValue,
      unit: source.normalizedUnit || selected.units?.heatOfAdsorption || "kJ/mol",
      source,
      evidence: source.sourceType || selected.dataType || "source record",
    }
  }

  const identity = recordIdentity(selected)
  const gas = recordPrimaryGas(selected)
  const doi = normalizedDoi(selected)
  if (!identity || !gas || !doi) {
    return { status: "qst-unavailable", reason: "material identity, primary gas, or DOI is missing" }
  }

  const comparable = (Array.isArray(records) ? records : []).filter(record => (
    recordIdentity(record) === identity
    && recordPrimaryGas(record) === gas
    && normalizedDoi(record) === doi
  ))
  const series = uniqueTemperatureSeries(comparable)
  if (series.length < 3) {
    return {
      status: "qst-unavailable",
      reason: "at least three same-source temperatures are required",
      temperatureCount: series.length,
    }
  }

  const lowerLoading = Math.max(...series.map(item => Math.min(...item.points.map(point => point.uptake))))
  const upperLoading = Math.min(...series.map(item => Math.max(...item.points.map(point => point.uptake))))
  if (!Number.isFinite(lowerLoading) || !Number.isFinite(upperLoading) || upperLoading <= Math.max(0, lowerLoading)) {
    return {
      status: "qst-unavailable",
      reason: "multi-temperature isotherms do not share an overlapping loading interval",
      temperatureCount: series.length,
    }
  }
  const targetLoading = lowerLoading + (upperLoading - lowerLoading) * 0.35
  const rows = series.map(item => ({
    temperatureK: item.temperatureK,
    pressureBar: pressureAtLoading(item.points, targetLoading),
    sourceId: item.sourceId,
  })).filter(item => item.pressureBar !== null && item.pressureBar > 0)
  if (rows.length < 3) {
    return {
      status: "qst-unavailable",
      reason: "fixed-loading pressure could not be interpolated at three temperatures",
      temperatureCount: rows.length,
    }
  }
  const regression = linearRegression(
    rows.map(item => 1 / item.temperatureK),
    rows.map(item => Math.log(item.pressureBar)),
  )
  if (!regression) return { status: "qst-unavailable", reason: "Clausius-Clapeyron regression failed" }
  const qst = -GAS_CONSTANT * regression.slope / 1000
  if (!Number.isFinite(qst) || qst <= 0 || qst > 120) {
    return {
      status: "qst-implausible",
      reason: "derived value falls outside the bounded screening range",
      value: Number.isFinite(qst) ? Number(qst.toFixed(2)) : null,
      r2: regression.r2,
      temperatureCount: rows.length,
    }
  }
  return {
    status: "clausius-clapeyron-qst",
    value: Number(qst.toFixed(2)),
    unit: "kJ/mol",
    r2: regression.r2 === null ? null : Number(regression.r2.toFixed(4)),
    temperatureCount: rows.length,
    targetLoading: Number(targetLoading.toPrecision(5)),
    rows,
    sourceDoi: selected.recordProvenance?.doi || selected.doi,
    boundary: "derived at one common loading by ln(P) versus 1/T regression; model-sensitive screening estimate",
  }
}

function supportedPressureRange(bundle = {}) {
  const all = [bundle.primary, bundle.secondary].filter(points => Array.isArray(points) && points.length)
  if (all.length < 2) return null
  const minimum = Math.max(...all.map(points => Math.min(...points.map(point => point.pressureBar))))
  const maximum = Math.min(...all.map(points => Math.max(...points.map(point => point.pressureBar))))
  return minimum <= maximum ? [minimum, maximum] : null
}

function iastFitRangeStatus(bundle = {}, iast = {}) {
  if (iast?.status !== "computed-IAST") return null
  const primaryMax = Math.max(...bundle.primary.map(point => point.pressureBar))
  const secondaryMax = Math.max(...bundle.secondary.map(point => point.pressureBar))
  const primaryPurePressure = finite(iast.pureComponentPressures?.primary)
  const secondaryPurePressure = finite(iast.pureComponentPressures?.secondary)
  if (primaryPurePressure === null || secondaryPurePressure === null) {
    return { status: "unknown", supported: false }
  }
  const tolerance = 1.02
  return {
    status: primaryPurePressure <= primaryMax * tolerance && secondaryPurePressure <= secondaryMax * tolerance
      ? "within-source-maximum"
      : "above-source-maximum",
    supported: primaryPurePressure <= primaryMax * tolerance && secondaryPurePressure <= secondaryMax * tolerance,
    primaryPurePressure,
    secondaryPurePressure,
    primaryMax,
    secondaryMax,
    lowPressureExtrapolation: primaryPurePressure < bundle.primary[0].pressureBar
      || secondaryPurePressure < bundle.secondary[0].pressureBar,
  }
}

export function buildThermodynamicInterpretation(selected = {}, records = [], scenario = {}) {
  const pair = buildPairedIsothermBundle(selected, records)
  const primaryHenry = estimateHenryAffinity(pair.primary)
  const secondaryHenry = estimateHenryAffinity(pair.secondary)
  const henryRatio = primaryHenry.status === "model-derived-henry" && secondaryHenry.status === "model-derived-henry"
    ? primaryHenry.value / secondaryHenry.value
    : null
  const qst = estimateIsostericHeat(selected, records)
  const scenarioTemperatureK = finite(scenario.temperatureK)
  const recordTempMatches = scenarioTemperatureK !== null
    && pair.primaryTemperatureK !== null
    && Math.abs(scenarioTemperatureK - pair.primaryTemperatureK) <= 1
  const pressureBar = finite(scenario.adsorptionPressureBar ?? scenario.pressureBar)
  const pressureRange = supportedPressureRange(pair)
  const pressureSupported = pressureBar !== null
    && pressureRange
    && pressureBar >= pressureRange[0]
    && pressureBar <= pressureRange[1]
  const rawIast = pair.status === "paired-isotherms" && recordTempMatches && pressureSupported
    ? calculateIastSelectivity({
        primaryIsotherm: pair.primary,
        secondaryIsotherm: pair.secondary,
        mixtureRatio: scenario.mixtureRatio,
        pressureBar,
      })
    : {
        status: "scenario-iast-unavailable",
        reason: pair.status !== "paired-isotherms"
          ? pair.status
          : !recordTempMatches
            ? "scenario-temperature-does-not-match-isotherm"
            : "scenario-pressure-outside-overlap",
      }
  const iastFitRange = iastFitRangeStatus(pair, rawIast)
  const iast = rawIast.status === "computed-IAST" && iastFitRange && !iastFitRange.supported
    ? {
        ...rawIast,
        status: "scenario-iast-unavailable",
        reason: "fitted-pure-pressure-outside-source-range",
      }
    : rawIast

  return {
    pair,
    primaryHenry,
    secondaryHenry,
    henryRatio: Number.isFinite(henryRatio) ? Number(henryRatio.toPrecision(6)) : null,
    qst,
    iast,
    iastFitRange,
    pressureRange,
    recordTempMatches,
    pressureSupported,
  }
}
