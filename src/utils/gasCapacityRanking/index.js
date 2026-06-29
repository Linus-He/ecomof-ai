// @ts-nocheck

function finite(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function sortedPoints(isotherm = []) {
  return (Array.isArray(isotherm) ? isotherm : [])
    .map(point => ({
      pressureBar: finite(point.pressureBar ?? point.pressure),
      uptake: finite(point.uptake ?? point.total_adsorption),
      gas: point.gas,
      uptakeUnit: point.uptakeUnit || "mmol/g",
    }))
    .filter(point => point.pressureBar !== null && point.uptake !== null)
    .sort((a, b) => a.pressureBar - b.pressureBar)
}

export function interpolateIsotherm(isotherm = [], pressureBar) {
  const pressure = finite(pressureBar)
  const points = sortedPoints(isotherm)
  if (pressure === null || points.length < 2) {
    return { value: null, status: "insufficient-isotherm" }
  }
  const first = points[0]
  const last = points[points.length - 1]
  if (pressure < first.pressureBar || pressure > last.pressureBar) {
    return { value: null, status: "outside-isotherm-range", range: [first.pressureBar, last.pressureBar] }
  }
  const exact = points.find(point => Math.abs(point.pressureBar - pressure) < 1e-9)
  if (exact) return { value: exact.uptake, status: "exact" }
  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1]
    const next = points[index]
    if (pressure >= prev.pressureBar && pressure <= next.pressureBar) {
      const fraction = (pressure - prev.pressureBar) / Math.max(1e-12, next.pressureBar - prev.pressureBar)
      return { value: prev.uptake + (next.uptake - prev.uptake) * fraction, status: "interpolated" }
    }
  }
  return { value: null, status: "not-interpolated" }
}

export function calculateWorkingCapacity(record = {}, options = {}) {
  const pAds = finite(options.adsorptionPressureBar ?? options.pressureBar ?? record.condition?.adsorptionPressureBar ?? record.adsorptionPressureBar)
  const pDes = finite(options.desorptionPressureBar ?? record.condition?.desorptionPressureBar ?? record.desorptionPressureBar)
  if (pAds === null || pDes === null) return { value: null, status: "missing-pressure-window" }
  const isotherm = Array.isArray(record.isotherm) ? record.isotherm : []
  if (isotherm.length < 2) {
    const fallback = finite(record.metrics?.workingCapacity ?? record.workingCapacity)
    return { value: fallback, status: fallback === null ? "single-point-no-capacity" : "single-point-static-capacity" }
  }
  const ads = interpolateIsotherm(isotherm, pAds)
  const des = interpolateIsotherm(isotherm, pDes)
  if (ads.value === null || des.value === null) {
    return {
      value: null,
      status: ads.value === null ? ads.status : des.status,
      adsorption: ads,
      desorption: des,
    }
  }
  return {
    value: Math.max(0, ads.value - des.value),
    status: "isotherm-derived",
    adsorption: ads,
    desorption: des,
  }
}

export function withRecomputedCapacity(record = {}, options = {}) {
  const capacity = calculateWorkingCapacity(record, options)
  const pAds = finite(options.adsorptionPressureBar ?? options.pressureBar ?? record.condition?.adsorptionPressureBar ?? record.adsorptionPressureBar)
  const pDes = finite(options.desorptionPressureBar ?? record.condition?.desorptionPressureBar ?? record.desorptionPressureBar)
  const primary = pAds === null ? { value: null } : interpolateIsotherm(record.isotherm, pAds)
  const primaryUptake = primary.value ?? finite(record.metrics?.primaryUptake ?? record.primaryUptake)
  const regenerability = primaryUptake && capacity.value !== null ? Math.min(100, Math.max(0, (capacity.value / primaryUptake) * 100)) : finite(record.metrics?.regenerability ?? record.regenerability)
  const capacityAdjustable = Array.isArray(record.isotherm) && record.isotherm.length >= 2 && capacity.status === "isotherm-derived"
  return {
    ...record,
    pressureWindow: { adsorptionPressureBar: pAds, desorptionPressureBar: pDes },
    capacityStatus: capacity.status,
    capacityAdjustable,
    primaryUptake: primaryUptake === null ? record.primaryUptake : Number(primaryUptake.toFixed(4)),
    workingCapacity: capacity.value === null ? null : Number(capacity.value.toFixed(4)),
    regenerability: regenerability === null ? null : Number(regenerability.toFixed(1)),
    metrics: {
      ...(record.metrics || {}),
      primaryUptake: primaryUptake === null ? record.metrics?.primaryUptake ?? null : Number(primaryUptake.toFixed(4)),
      workingCapacity: capacity.value === null ? null : Number(capacity.value.toFixed(4)),
      regenerability: regenerability === null ? record.metrics?.regenerability ?? null : Number(regenerability.toFixed(1)),
    },
    condition: {
      ...(record.condition || {}),
      pressureBar: pAds ?? record.condition?.pressureBar,
      adsorptionPressureBar: pAds ?? record.condition?.adsorptionPressureBar,
      desorptionPressureBar: pDes ?? record.condition?.desorptionPressureBar,
    },
  }
}

export function rankCapacityRecords(records = [], options = {}) {
  const gasPair = String(options.gasPair || "").toUpperCase()
  const sortBy = options.sortBy || "workingCapacity"
  const rows = records
    .filter(record => !gasPair || String(record.gasPair || "").toUpperCase() === gasPair)
    .map(record => withRecomputedCapacity(record, options))
  const dir = options.direction === "asc" ? 1 : -1
  return rows.sort((a, b) => {
    const av = finite(a[sortBy] ?? a.metrics?.[sortBy])
    const bv = finite(b[sortBy] ?? b.metrics?.[sortBy])
    if (av !== null && bv !== null) return (av - bv) * dir
    if (av !== null) return -1
    if (bv !== null) return 1
    return String(a.displayName || "").localeCompare(String(b.displayName || ""))
  })
}
