const INDICATORS = [
  { key: "d_stab", label: "Stability", shortLabel: "stab" },
  { key: "d_barrier", label: "Barrier", shortLabel: "barrier" },
  { key: "d_select", label: "Byproduct-risk", shortLabel: "select" },
]

export const CRITIC_INDICATORS = INDICATORS

export const CRITIC_SCORING_DEMO_CANDIDATES = [
  {
    id: "MOF-B",
    name: "MOF-B",
    libraryName: "UiO-66",
    metalCenter: "Zr",
    frameworkType: "MOF",
    d_stab: 1.0,
    d_barrier: 0.75,
    d_select: 0.8,
    G: 1,
    confidence_Q: 0.8,
    evidenceLevel: "B",
    evidenceSummary: "Literature-supported post-reaction characterization",
    exclusionReason: "",
    dataGaps: ["Need unified DFT barrier validation", "Need byproduct quantification"],
    sources: [
      { label: "Demo source", type: "literature / DFT / experiment / inferred", note: "Replace with real DOI or internal record later" },
    ],
  },
  {
    id: "MOF-808-DEMO",
    name: "MOF-808",
    metalCenter: "Zr",
    frameworkType: "MOF",
    d_stab: 0.92,
    d_barrier: 0.68,
    d_select: 0.74,
    G: 1,
    confidence_Q: 0.72,
    evidenceLevel: "B",
    evidenceSummary: "Illustrative Zr-cluster stability record with partial catalytic proxy evidence",
    exclusionReason: "",
    dataGaps: ["Need unified HCOO* barrier calculation", "Need hydrothermal post-reaction ICP"],
    sources: [
      { label: "Demo source", type: "literature / inferred", note: "Illustrative record; replace with curated source" },
    ],
  },
  {
    id: "NU-1000-DEMO",
    name: "NU-1000",
    metalCenter: "Zr",
    frameworkType: "MOF",
    d_stab: 0.86,
    d_barrier: 0.58,
    d_select: 0.7,
    G: 1,
    confidence_Q: 0.62,
    evidenceLevel: "C",
    evidenceSummary: "Framework stability is plausible; formate-pathway evidence remains incomplete",
    exclusionReason: "",
    dataGaps: ["Need comparable DFT pathway", "Need product distribution under identical conditions"],
    sources: [
      { label: "Demo source", type: "literature / inferred", note: "Illustrative record; replace with curated source" },
    ],
  },
  {
    id: "PCN-222-DEMO",
    name: "PCN-222",
    metalCenter: "Zr",
    frameworkType: "MOF",
    d_stab: 0.68,
    d_barrier: 0.64,
    d_select: 0.52,
    G: 1,
    confidence_Q: 0.55,
    evidenceLevel: "C",
    evidenceSummary: "Porphyrinic framework suggests catalytic handles, but selectivity evidence is thin",
    exclusionReason: "",
    dataGaps: ["Need byproduct quantification", "Need post-reaction framework integrity data"],
    sources: [
      { label: "Demo source", type: "literature / inferred", note: "Illustrative record; replace with curated source" },
    ],
  },
  {
    id: "UiO-66-NH2-DEMO",
    name: "UiO-66-NH2",
    metalCenter: "Zr",
    frameworkType: "MOF",
    d_stab: 0.88,
    d_barrier: 0.46,
    d_select: 0.66,
    G: 1,
    confidence_Q: 0.58,
    evidenceLevel: "C",
    evidenceSummary: "Stable framework with incomplete formate-step kinetic evidence",
    exclusionReason: "",
    dataGaps: ["Need unified DFT barrier validation", "Need measured formate selectivity"],
    sources: [
      { label: "Demo source", type: "literature / inferred", note: "Illustrative record; replace with curated source" },
    ],
  },
  {
    id: "ZIF-8-DEMO",
    name: "ZIF-8",
    metalCenter: "Zn",
    frameworkType: "MOF",
    d_stab: 0.42,
    d_barrier: 0.5,
    d_select: 0.56,
    G: 1,
    confidence_Q: 0.48,
    evidenceLevel: "D",
    evidenceSummary: "Hydrothermal formate-formation suitability is weakly supported in this demo set",
    exclusionReason: "",
    dataGaps: ["Need 170 C aqueous stability evidence", "Need DFT barrier and product distribution data"],
    sources: [
      { label: "Demo source", type: "inferred", note: "Illustrative record; replace with curated source" },
    ],
  },
  {
    id: "HKUST-1-DEMO",
    name: "HKUST-1",
    metalCenter: "Cu",
    frameworkType: "MOF",
    d_stab: 0.18,
    d_barrier: 0.56,
    d_select: 0.45,
    G: 0,
    confidence_Q: 0.65,
    evidenceLevel: "D",
    evidenceSummary: "Illustrative hard-screen exclusion due to hydrothermal stability concern",
    exclusionReason: "Excluded in demo because the framework is not treated as stable under the target 170 C aqueous screening constraint.",
    dataGaps: ["Need direct post-reaction XRD/BET/ICP under target condition"],
    sources: [
      { label: "Demo source", type: "inferred", note: "Illustrative exclusion; replace with curated evidence" },
    ],
  },
]

export function clipScore(value, min = 0.01, max = 1) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return min
  return Math.max(min, Math.min(max, numeric))
}

export function computeStd(values) {
  const nums = values.map(Number).filter(Number.isFinite)
  if (!nums.length) return 0
  const mean = nums.reduce((sum, value) => sum + value, 0) / nums.length
  const variance = nums.reduce((sum, value) => sum + (value - mean) ** 2, 0) / nums.length
  return Math.sqrt(Math.max(0, variance))
}

export function computePearsonCorrelation(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length < 2) return 0
  const xs = a.map(Number)
  const ys = b.map(Number)
  if (xs.some(value => !Number.isFinite(value)) || ys.some(value => !Number.isFinite(value))) return 0
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length
  const numerator = xs.reduce((sum, value, index) => sum + (value - meanX) * (ys[index] - meanY), 0)
  const denomX = Math.sqrt(xs.reduce((sum, value) => sum + (value - meanX) ** 2, 0))
  const denomY = Math.sqrt(ys.reduce((sum, value) => sum + (value - meanY) ** 2, 0))
  const denominator = denomX * denomY
  if (!Number.isFinite(denominator) || denominator === 0) return 0
  const result = numerator / denominator
  return Number.isFinite(result) ? Math.max(-1, Math.min(1, result)) : 0
}

export function computeCriticWeights(candidates) {
  const rows = Array.isArray(candidates) ? candidates.filter(candidate => Number(candidate?.G) !== 0) : []
  const sourceRows = rows.length ? rows : Array.isArray(candidates) ? candidates : []
  const valuesByKey = Object.fromEntries(
    INDICATORS.map(indicator => [indicator.key, sourceRows.map(candidate => clipScore(candidate?.[indicator.key]))])
  )
  const correlationMatrix = Object.fromEntries(
    INDICATORS.map(row => [
      row.key,
      Object.fromEntries(INDICATORS.map(col => [
        col.key,
        row.key === col.key ? 1 : computePearsonCorrelation(valuesByKey[row.key] || [], valuesByKey[col.key] || []),
      ])),
    ])
  )
  const decomposition = INDICATORS.map(indicator => {
    const sigma = computeStd(valuesByKey[indicator.key] || [])
    const conflict = INDICATORS.reduce((sum, other) => {
      const r = correlationMatrix[indicator.key]?.[other.key]
      return sum + (1 - (Number.isFinite(r) ? r : 0))
    }, 0)
    const information = sigma * conflict
    return { ...indicator, sigma, conflict, information }
  })
  const infoSum = decomposition.reduce((sum, row) => sum + row.information, 0)
  const fallbackWeight = 1 / INDICATORS.length
  const weights = Object.fromEntries(
    decomposition.map(row => [row.key, infoSum > 0 ? row.information / infoSum : fallbackWeight])
  )
  return { weights, correlationMatrix, decomposition }
}

export function getCandidateStatus(score, G) {
  if (Number(G) === 0) return { label: "Excluded", zh: "已排除", tone: "warn" }
  if (score >= 0.75) return { label: "Likely useful", zh: "优先验证", tone: "calc" }
  if (score >= 0.5) return { label: "Promising but uncertain", zh: "有潜力但需补证据", tone: "info" }
  if (score >= 0.3) return { label: "Low priority", zh: "暂不优先", tone: "proxy" }
  return { label: "Unlikely useful", zh: "不建议优先", tone: "warn" }
}

export function computeCandidateScores(candidates, weights) {
  const safeWeights = weights && typeof weights === "object" ? weights : computeCriticWeights(candidates).weights
  const scored = (Array.isArray(candidates) ? candidates : []).map(candidate => {
    const G = Number(candidate.G) === 0 ? 0 : 1
    const dStab = clipScore(candidate.d_stab)
    const dBarrier = clipScore(candidate.d_barrier)
    const dSelect = clipScore(candidate.d_select)
    const raw = G === 0
      ? 0
      : (dStab ** safeWeights.d_stab) * (dBarrier ** safeWeights.d_barrier) * (dSelect ** safeWeights.d_select)
    const confidence = clipScore(candidate.confidence_Q, 0, 1)
    const expected = raw * confidence
    return {
      ...candidate,
      d_stab_clipped: dStab,
      d_barrier_clipped: dBarrier,
      d_select_clipped: dSelect,
      confidence_Q_clipped: confidence,
      D_raw: raw,
      D_expected: expected,
      status: getCandidateStatus(expected, G),
    }
  })
  const sorted = scored.sort((a, b) => {
    if (Number(a.G) === 0 && Number(b.G) !== 0) return 1
    if (Number(a.G) !== 0 && Number(b.G) === 0) return -1
    return b.D_expected - a.D_expected
  })
  let rank = 0
  return sorted.map(candidate => {
    if (Number(candidate.G) === 0) return { ...candidate, rank: null }
    rank += 1
    return { ...candidate, rank }
  })
}

export function getDataGapRecommendations(candidate) {
  if (!candidate) return []
  if (Number(candidate.G) === 0) {
    return [{
      limitation: candidate.exclusionReason || "Hard-screen exclusion",
      nextEvidence: "Re-check exclusion constraint before ranking this candidate.",
      priority: "High",
    }]
  }
  const gaps = []
  if (Number(candidate.d_stab) < 0.5) {
    gaps.push({
      limitation: "Hydrothermal stability score below 0.50",
      nextEvidence: "Add XRD/BET/ICP after 170 C aqueous exposure.",
      priority: "High",
    })
  }
  if (Number(candidate.d_barrier) < 0.5) {
    gaps.push({
      limitation: "Formate-pathway barrier score below 0.50",
      nextEvidence: "Run unified DFT for HCOO* formation or desorption barrier.",
      priority: "High",
    })
  }
  if (Number(candidate.d_select) <= 0.5) {
    gaps.push({
      limitation: "Byproduct-risk score at or below 0.50",
      nextEvidence: "Add HPLC/IC/NMR product distribution for acetate/lactate side paths.",
      priority: "Medium",
    })
  }
  if (Number(candidate.confidence_Q) < 0.6) {
    gaps.push({
      limitation: "Evidence confidence below 0.60",
      nextEvidence: "Add higher-level evidence with DOI, DFT record, or controlled experiment.",
      priority: "Medium",
    })
  }
  if (!gaps.length) {
    gaps.push({
      limitation: "No critical threshold failure in the demo descriptor set",
      nextEvidence: candidate.dataGaps?.[0] || "Add replicate validation and source-level provenance.",
      priority: "Review",
    })
  }
  return gaps
}

function rankWithWeights(candidates, weights) {
  return computeCandidateScores(candidates, weights).reduce((map, candidate) => {
    map[candidate.id] = Number(candidate.G) === 0 ? "Excluded" : candidate.rank
    return map
  }, {})
}

export function computeSensitivityRanks(candidates, criticWeights) {
  const schemes = [
    { id: "critic", label: "CRITIC weights", weights: criticWeights },
    { id: "equal", label: "Equal weights", weights: { d_stab: 0.333, d_barrier: 0.333, d_select: 0.334 } },
    { id: "stability", label: "Stability-prioritized", weights: { d_stab: 0.5, d_barrier: 0.3, d_select: 0.2 } },
    { id: "barrier", label: "Barrier-prioritized", weights: { d_stab: 0.25, d_barrier: 0.55, d_select: 0.2 } },
  ]
  const ranksByScheme = schemes.map(scheme => ({
    ...scheme,
    ranks: rankWithWeights(candidates, scheme.weights),
  }))
  const rows = (Array.isArray(candidates) ? candidates : []).map(candidate => {
    const ranks = Object.fromEntries(ranksByScheme.map(scheme => [scheme.id, scheme.ranks[candidate.id]]))
    const numericRanks = Object.values(ranks).filter(Number.isFinite)
    const topThreeCount = numericRanks.filter(rank => rank <= 3).length
    const spread = numericRanks.length ? Math.max(...numericRanks) - Math.min(...numericRanks) : 0
    let robustness = "Mixed"
    if (Number(candidate.G) === 0) robustness = "Excluded"
    else if (Number(candidate.confidence_Q) < 0.6) robustness = "Evidence-limited"
    else if (topThreeCount >= 3) robustness = "Robust"
    else if (spread >= 3) robustness = "Weight-sensitive"
    return { id: candidate.id, name: candidate.name, ranks, robustness }
  })
  return { schemes, rows }
}

export function buildCriticScoringModel(candidates = CRITIC_SCORING_DEMO_CANDIDATES) {
  const critic = computeCriticWeights(candidates)
  const scoredCandidates = computeCandidateScores(candidates, critic.weights)
  const sensitivity = computeSensitivityRanks(candidates, critic.weights)
  return { ...critic, candidates: scoredCandidates, sensitivity }
}

export function findCriticCandidateByName(name, model = buildCriticScoringModel()) {
  const key = String(name || "").trim().toLowerCase()
  if (!key) return null
  return model.candidates.find(candidate => (
    String(candidate.name || "").toLowerCase() === key ||
    String(candidate.libraryName || "").toLowerCase() === key ||
    String(candidate.id || "").toLowerCase() === key
  )) || null
}
