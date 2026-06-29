// @ts-nocheck

function finite(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function cleanPoints(isotherm = []) {
  return (Array.isArray(isotherm) ? isotherm : [])
    .map(point => ({
      pressureBar: finite(point.pressureBar ?? point.pressure),
      uptake: finite(point.uptake ?? point.total_adsorption),
    }))
    .filter(point => point.pressureBar !== null && point.pressureBar > 0 && point.uptake !== null && point.uptake >= 0)
    .sort((a, b) => a.pressureBar - b.pressureBar)
}

function rSquared(points, predict) {
  if (points.length < 2) return null
  const mean = points.reduce((sum, point) => sum + point.uptake, 0) / points.length
  const ssTot = points.reduce((sum, point) => sum + (point.uptake - mean) ** 2, 0)
  const ssRes = points.reduce((sum, point) => sum + (point.uptake - predict(point.pressureBar)) ** 2, 0)
  if (ssTot <= 1e-12) return ssRes <= 1e-12 ? 1 : 0
  return clamp(1 - ssRes / ssTot, -1, 1)
}

function logSpace(minExp = -4, maxExp = 2, count = 32) {
  return Array.from({ length: count }, (_, index) => 10 ** (minExp + (index / Math.max(1, count - 1)) * (maxExp - minExp)))
}

function fitLangmuir(points) {
  if (points.length < 3) return null
  let best = null
  for (const b of logSpace(-4, 2.2, 44)) {
    const xs = points.map(point => (b * point.pressureBar) / (1 + b * point.pressureBar))
    const numerator = points.reduce((sum, point, index) => sum + point.uptake * xs[index], 0)
    const denominator = xs.reduce((sum, value) => sum + value ** 2, 0)
    const qm = denominator > 1e-12 ? numerator / denominator : null
    if (!Number.isFinite(qm) || qm <= 0) continue
    const model = { model: "langmuir", qm, b }
    const r2 = rSquared(points, pressure => loadingAt(model, pressure))
    if (!best || r2 > best.r2) best = { ...model, r2 }
  }
  return best
}

function fitFreundlich(points) {
  const rows = points.filter(point => point.pressureBar > 0 && point.uptake > 0)
  if (rows.length < 3) return null
  const xs = rows.map(point => Math.log(point.pressureBar))
  const ys = rows.map(point => Math.log(point.uptake))
  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length
  const mx = mean(xs)
  const my = mean(ys)
  const denom = xs.reduce((sum, value) => sum + (value - mx) ** 2, 0)
  if (denom <= 1e-12) return null
  const a = xs.reduce((sum, value, index) => sum + (value - mx) * (ys[index] - my), 0) / denom
  const k = Math.exp(my - a * mx)
  if (!Number.isFinite(k) || !Number.isFinite(a) || k <= 0 || a <= 0 || a > 2.5) return null
  const model = { model: "freundlich", k, a }
  return { ...model, r2: rSquared(points, pressure => loadingAt(model, pressure)) }
}

function solveTwoByTwo(a11, a12, a21, a22, b1, b2) {
  const det = a11 * a22 - a12 * a21
  if (Math.abs(det) < 1e-12) return null
  return [(b1 * a22 - b2 * a12) / det, (a11 * b2 - a21 * b1) / det]
}

function fitDualLangmuir(points) {
  if (points.length < 5) return null
  let best = null
  const grid = logSpace(-4, 2.2, 24)
  for (let i = 0; i < grid.length; i += 1) {
    for (let j = i + 1; j < grid.length; j += 1) {
      const b1 = grid[i]
      const b2 = grid[j]
      let a11 = 0
      let a12 = 0
      let a22 = 0
      let y1 = 0
      let y2 = 0
      for (const point of points) {
        const f1 = (b1 * point.pressureBar) / (1 + b1 * point.pressureBar)
        const f2 = (b2 * point.pressureBar) / (1 + b2 * point.pressureBar)
        a11 += f1 * f1
        a12 += f1 * f2
        a22 += f2 * f2
        y1 += point.uptake * f1
        y2 += point.uptake * f2
      }
      const solution = solveTwoByTwo(a11, a12, a12, a22, y1, y2)
      if (!solution) continue
      const [qm1, qm2] = solution
      if (!Number.isFinite(qm1) || !Number.isFinite(qm2) || qm1 < 0 || qm2 < 0 || qm1 + qm2 <= 0) continue
      const model = { model: "dual-langmuir", qm1, b1, qm2, b2 }
      const r2 = rSquared(points, pressure => loadingAt(model, pressure))
      if (!best || r2 > best.r2) best = { ...model, r2 }
    }
  }
  return best
}

export function fitBestIsothermModel(isotherm = []) {
  const points = cleanPoints(isotherm)
  if (points.length < 3) {
    return { status: "insufficient-isotherm", pointCount: points.length, model: null }
  }
  const candidates = [fitLangmuir(points), fitDualLangmuir(points), fitFreundlich(points)]
    .filter(Boolean)
    .sort((a, b) => b.r2 - a.r2)
  const best = candidates[0] || null
  if (!best) return { status: "fit-failed", pointCount: points.length, model: null }
  return {
    status: "fit-ok",
    pointCount: points.length,
    model: best.model,
    r2: Number(best.r2.toFixed(5)),
    parameters: Object.fromEntries(Object.entries(best).filter(([key]) => !["model", "r2"].includes(key))),
  }
}

export function loadingAt(fit, pressureBar) {
  const p = Math.max(0, finite(pressureBar) ?? 0)
  if (!fit) return null
  const params = fit.parameters || fit
  const model = fit.model
  if (model === "langmuir") return params.qm * params.b * p / (1 + params.b * p)
  if (model === "dual-langmuir") {
    return (params.qm1 * params.b1 * p / (1 + params.b1 * p)) + (params.qm2 * params.b2 * p / (1 + params.b2 * p))
  }
  if (model === "freundlich") return params.k * (p ** params.a)
  return null
}

export function spreadingPressure(fit, pressureBar) {
  const p = Math.max(0, finite(pressureBar) ?? 0)
  if (!fit || p <= 0) return 0
  const params = fit.parameters || fit
  const model = fit.model
  if (model === "langmuir") return params.qm * Math.log1p(params.b * p)
  if (model === "dual-langmuir") {
    return params.qm1 * Math.log1p(params.b1 * p) + params.qm2 * Math.log1p(params.b2 * p)
  }
  if (model === "freundlich") return (params.k / Math.max(params.a, 1e-12)) * (p ** params.a)
  return null
}

export function parseMixtureRatio(value = "50/50") {
  const [a, b] = String(value || "").split("/").map(Number)
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null
  const total = a + b
  return { primaryFraction: a / total, secondaryFraction: b / total, label: `${a}/${b}` }
}

export function solveBinaryIast({ primaryFit, secondaryFit, pressureBar = 1, primaryFraction = 0.5 } = {}) {
  const pressure = finite(pressureBar)
  const y1 = finite(primaryFraction)
  if (!primaryFit || !secondaryFit || pressure === null || pressure <= 0 || y1 === null || y1 <= 0 || y1 >= 1) {
    return { status: "invalid-iast-input" }
  }
  const y2 = 1 - y1
  const f = x1 => {
    const bounded = clamp(x1, 1e-8, 1 - 1e-8)
    return spreadingPressure(primaryFit, (y1 * pressure) / bounded) - spreadingPressure(secondaryFit, (y2 * pressure) / (1 - bounded))
  }
  let lo = 1e-7
  let hi = 1 - 1e-7
  let flo = f(lo)
  let fhi = f(hi)
  if (!Number.isFinite(flo) || !Number.isFinite(fhi) || flo * fhi > 0) {
    return { status: "iast-not-bracketed" }
  }
  for (let index = 0; index < 90; index += 1) {
    const mid = (lo + hi) / 2
    const fm = f(mid)
    if (!Number.isFinite(fm)) return { status: "iast-nonfinite" }
    if (Math.abs(fm) < 1e-9) {
      lo = mid
      hi = mid
      break
    }
    if (flo * fm > 0) {
      lo = mid
      flo = fm
    } else {
      hi = mid
      fhi = fm
    }
  }
  const x1 = (lo + hi) / 2
  const x2 = 1 - x1
  const selectivity = (x1 / x2) / (y1 / y2)
  return {
    status: "computed-IAST",
    selectivity,
    adsorbedFractions: { primary: x1, secondary: x2 },
    gasFractions: { primary: y1, secondary: y2 },
    pureComponentPressures: {
      primary: (y1 * pressure) / x1,
      secondary: (y2 * pressure) / x2,
    },
    spreadingPressure: spreadingPressure(primaryFit, (y1 * pressure) / x1),
  }
}

export function calculateIastSelectivity({
  primaryIsotherm = [],
  secondaryIsotherm = [],
  mixtureRatio = "50/50",
  pressureBar = 1,
} = {}) {
  const ratio = parseMixtureRatio(mixtureRatio)
  if (!ratio) return { status: "invalid-mixture-ratio" }
  const primaryFit = fitBestIsothermModel(primaryIsotherm)
  const secondaryFit = fitBestIsothermModel(secondaryIsotherm)
  if (primaryFit.status !== "fit-ok" || secondaryFit.status !== "fit-ok") {
    return { status: "selectivity-unavailable", reason: "need both isotherms", primaryFit, secondaryFit }
  }
  const result = solveBinaryIast({
    primaryFit,
    secondaryFit,
    pressureBar,
    primaryFraction: ratio.primaryFraction,
  })
  if (result.status !== "computed-IAST" || !Number.isFinite(result.selectivity) || result.selectivity <= 0) {
    return { ...result, primaryFit, secondaryFit, mixtureRatio: ratio.label }
  }
  return {
    ...result,
    value: Number(result.selectivity.toPrecision(5)),
    mixtureRatio: ratio.label,
    pressureBar,
    primaryFit,
    secondaryFit,
    minFitR2: Math.min(primaryFit.r2, secondaryFit.r2),
  }
}
