/**
 * Organic Acid score uncertainty (V3.10.0 / B2).
 *
 * Adds an honest confidence band to each factor and propagates it through the
 * weighted-geometric HGCPS via a seeded Monte Carlo, then flags adjacent routes
 * whose intervals overlap as "statistically indistinguishable".
 *
 * Statistical honesty:
 *  - data-derived factors get a 1/sqrt(n) standard-error proxy band (n larger ->
 *    narrower). We expose n; this is an SE proxy, not a full bootstrap of the raw
 *    sample (the raw family sample is not carried to the route layer).
 *  - curated / fallback / expert-prior factors get a FIXED WIDE band (default
 *    +-0.15) labelled "expert-estimate (wide uncertainty)". We never give a point
 *    estimate a narrow band to fake precision.
 *
 * These constants are reporting-only: they do NOT change any point HGCPS score
 * or ranking, so no pre-registration is required (no weight/formula change).
 */

export const UNCERTAINTY_CONFIG = {
  mcSamples: 1000,
  seed: 0x9e3779b9,
  ciLowerPercentile: 5,
  ciUpperPercentile: 95,
  zeroFloor: 0.001,
  curatedBandHalfWidth: 0.15, // fixed wide half-band for curated / fallback / prior
  dataDerivedBaseSigma: 0.18, // SE proxy: sigma = base / sqrt(n)
  minSigma: 0.012,
}

const CI_Z = 1.645 // ~90% half-width factor for a normal band

function clamp01(value) {
  const next = Number(value)
  if (!Number.isFinite(next)) return 0
  return Math.max(0, Math.min(1, next))
}

function safeNum(value, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function round(value, digits = 3) {
  const factor = 10 ** digits
  return Math.round(safeNum(value, 0) * factor) / factor
}

function isDataDerived(level) {
  return /data-derived/i.test(String(level || ""))
}

// Deterministic PRNG (mulberry32) + Box-Muller normal sampler.
function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function normalSampler(rng) {
  let spare = null
  return function nextNormal() {
    if (spare !== null) {
      const value = spare
      spare = null
      return value
    }
    let u = 0
    let v = 0
    while (u <= 1e-12) u = rng()
    while (v <= 1e-12) v = rng()
    const mag = Math.sqrt(-2 * Math.log(u))
    spare = mag * Math.sin(2 * Math.PI * v)
    return mag * Math.cos(2 * Math.PI * v)
  }
}

function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return 0
  const rank = (p / 100) * (sortedAsc.length - 1)
  const low = Math.floor(rank)
  const high = Math.ceil(rank)
  if (low === high) return sortedAsc[low]
  return sortedAsc[low] + (sortedAsc[high] - sortedAsc[low]) * (rank - low)
}

/**
 * Build an honest band for one factor. data-derived -> SE ~ 1/sqrt(n); otherwise
 * a fixed wide expert-estimate band.
 */
export function buildFactorBand({ value, nRecords, derivationLevel } = {}, config = UNCERTAINTY_CONFIG) {
  const cfg = { ...UNCERTAINTY_CONFIG, ...config }
  const v = clamp01(value)
  const n = Math.max(0, Math.round(safeNum(nRecords, 0)))
  if (isDataDerived(derivationLevel) && n >= 2) {
    const sigma = Math.max(cfg.minSigma, cfg.dataDerivedBaseSigma / Math.sqrt(n))
    return {
      value: round(v, 3),
      sigma: round(sigma, 4),
      halfWidth: round(CI_Z * sigma, 4),
      kind: "data-derived-se",
      nRecords: n,
      wide: false,
      labelZh: `数据派生标准误（∝ 1/√n，n=${n}）`,
      labelEn: `data-derived SE (~ 1/sqrt(n), n=${n})`,
    }
  }
  const sigma = cfg.curatedBandHalfWidth / CI_Z
  return {
    value: round(v, 3),
    sigma: round(sigma, 4),
    halfWidth: round(cfg.curatedBandHalfWidth, 4),
    kind: "expert-estimate",
    nRecords: n,
    wide: true,
    labelZh: "专家估计（不确定度大）",
    labelEn: "expert-estimate (wide uncertainty)",
  }
}

function factorRowsFromProvenance(provenance, options = {}) {
  const rows = Array.isArray(provenance?.rows) ? provenance.rows : []
  const nByKey = options.nRecordsByKey || {}
  const levelByKey = options.derivationByKey || {}
  return rows.map(row => ({
    key: row.fieldKey,
    labelZh: row.labelZh,
    labelEn: row.labelEn,
    value: clamp01(row.normalizedValue),
    weight: safeNum(row.weightOrFactor, 0),
    dataGrade: row.dataGrade,
    nRecords: safeNum(nByKey[row.fieldKey], 0),
    derivationLevel: levelByKey[row.fieldKey] || (isDataDerived(row.dataGrade) ? "data-derived" : "curated"),
  }))
}

function geometricHgcps(factorValues, weightPairs, zeroFloor) {
  return weightPairs.reduce((product, [key, weight]) => {
    const factor = Math.max(zeroFloor, clamp01(factorValues[key]))
    return product * factor ** safeNum(weight, 0)
  }, 1)
}

/**
 * Monte-Carlo the HGCPS interval for one route from its factor provenance.
 * The point estimate is recomputed from the same geometric formula, so it
 * reproduces the builder's HGCPS exactly.
 */
export function buildRouteUncertainty(provenance, options = {}) {
  const cfg = { ...UNCERTAINTY_CONFIG, ...(options.config || {}) }
  const factors = factorRowsFromProvenance(provenance, options)
  const weightPairs = factors.map(f => [f.key, f.weight])
  const bands = factors.map(f => ({ key: f.key, labelZh: f.labelZh, labelEn: f.labelEn, dataGrade: f.dataGrade, band: buildFactorBand(f, cfg) }))
  const pointValues = Object.fromEntries(factors.map(f => [f.key, f.value]))
  const point = round(geometricHgcps(pointValues, weightPairs, cfg.zeroFloor), 3)

  const rng = mulberry32(cfg.seed)
  const nextNormal = normalSampler(rng)
  const samples = new Array(cfg.mcSamples)
  for (let i = 0; i < cfg.mcSamples; i += 1) {
    const sampleValues = {}
    for (const entry of bands) {
      const sampled = entry.band.value + entry.band.sigma * nextNormal()
      sampleValues[entry.key] = Math.max(cfg.zeroFloor, Math.min(1, sampled))
    }
    samples[i] = geometricHgcps(sampleValues, weightPairs, cfg.zeroFloor)
  }
  samples.sort((a, b) => a - b)
  const mean = samples.reduce((sum, x) => sum + x, 0) / (samples.length || 1)
  const variance = samples.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (samples.length || 1)

  return {
    routeId: provenance?.routeId || "route-pending",
    routeLabel: provenance?.candidateLabel || "route pending",
    rank: Math.round(safeNum(provenance?.rank, 0)),
    point,
    mean: round(mean, 3),
    sd: round(Math.sqrt(variance), 4),
    ciLow: round(percentile(samples, cfg.ciLowerPercentile), 3),
    ciHigh: round(percentile(samples, cfg.ciUpperPercentile), 3),
    ciPercent: cfg.ciUpperPercentile - cfg.ciLowerPercentile,
    mcSamples: cfg.mcSamples,
    seed: cfg.seed,
    anyWideBand: bands.some(entry => entry.band.wide),
    bands,
  }
}

/**
 * Rank a set of route uncertainties and flag adjacent routes whose intervals
 * overlap as statistically indistinguishable.
 */
export function buildRankingUncertainty(routeUncertainties = []) {
  const rows = [...routeUncertainties].sort((a, b) => b.point - a.point)
  const ranked = rows.map((row, index) => {
    const prev = rows[index - 1]
    const indistinguishableFromPrev = Boolean(prev) && row.ciHigh >= prev.ciLow
    return {
      ...row,
      rank: index + 1,
      indistinguishableFromPrev,
    }
  })
  const indistinguishablePairs = []
  for (let i = 1; i < ranked.length; i += 1) {
    if (ranked[i].indistinguishableFromPrev) {
      indistinguishablePairs.push({
        higher: { routeId: ranked[i - 1].routeId, routeLabel: ranked[i - 1].routeLabel, rank: ranked[i - 1].rank },
        lower: { routeId: ranked[i].routeId, routeLabel: ranked[i].routeLabel, rank: ranked[i].rank },
      })
    }
  }
  return {
    titleZh: "排名置信带",
    titleEn: "Ranking confidence bands",
    rows: ranked,
    indistinguishablePairs,
    hasIndistinguishable: indistinguishablePairs.length > 0,
    noteZh: "误差棒由蒙特卡洛传导（固定随机种子）；相邻区间重叠记为统计上不可区分。",
    noteEn: "Error bars are Monte-Carlo propagated (fixed seed); overlapping adjacent intervals are statistically indistinguishable.",
  }
}

/**
 * Convenience: build per-route uncertainty + ranking from a list of route
 * provenances (each the output of buildRouteHgcpsScoreProvenance), plus optional
 * per-route { nRecordsByKey, derivationByKey } maps.
 */
export function buildScoreUncertaintyModel(routeProvenances = [], options = {}) {
  const list = Array.isArray(routeProvenances) ? routeProvenances : []
  const provenanceOptions = options.provenanceOptionsByRoute || {}
  const uncertainties = list.map(prov => buildRouteUncertainty(prov, {
    config: options.config,
    ...(provenanceOptions[prov?.routeId] || {}),
  }))
  const ranking = buildRankingUncertainty(uncertainties)
  return {
    titleZh: "HGCPS 不确定度",
    titleEn: "HGCPS uncertainty",
    routes: uncertainties,
    ranking,
    config: { ...UNCERTAINTY_CONFIG, ...(options.config || {}) },
    headerNoteZh: "data-derived 因子用 1/√n 标准误代理；curated / fallback / 专家先验用固定宽带，不假装精确。",
    headerNoteEn: "Data-derived factors use a 1/sqrt(n) SE proxy; curated / fallback / expert priors use a fixed wide band and do not fake precision.",
  }
}
