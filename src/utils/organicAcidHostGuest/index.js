// @ts-nocheck

export const ORGANIC_ACID_HOST_GUEST_VERSION = "V3.9.2"
export const HOST_GUEST_ALGORITHM_NAME = "Host-Guest Complementary Pathway Screening Algorithm"

const HOST_SCORE_WEIGHTS = [
  ["stabilityProxy", 0.22],
  ["aqueousStabilityEvidence", 0.18],
  ["thermalStabilityEvidence", 0.10],
  ["poreEnvironmentScore", 0.12],
  ["co2EnrichmentSupport", 0.10],
  ["postModificationFeasibility", 0.10],
  ["guestHostingFeasibility", 0.10],
  ["provenanceQuality", 0.08],
]

const GUEST_SCORE_WEIGHTS = [
  ["co2ActivationScore", 0.22],
  ["formateStabilizationScore", 0.22],
  ["electronTransferSupport", 0.16],
  ["compatibilityWithAlMof", 0.16],
  ["dopingFeasibility", 0.08],
  ["postModificationFeasibility", 0.08],
  ["bimetallicConstructionFeasibility", 0.08],
]

const ROUTE_SCORE_KEYS = [
  "hostStabilityScore",
  "hostPathwaySupportScore",
  "guestActivityCompensationScore",
  "hostGuestComplementarityScore",
  "evidenceConfidenceScore",
  "riskPenalty",
]

const PIPELINE_STEP_LABELS = [
  "Pathway Step Analysis",
  "Descriptor Mapping",
  "Host MOF Selection",
  "Guest Metal Selection",
  "Complementary Scoring",
  "Experimental Route",
]

function asArray(value) {
  return Array.isArray(value) ? value : []
}

export function safeNumber(value, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function roundScore(value, digits = 3) {
  const factor = 10 ** digits
  return Math.round(safeNumber(value, 0) * factor) / factor
}

function scoreLabel(value) {
  const score = safeNumber(value, 0)
  if (score >= 0.78) return "medium-high"
  if (score >= 0.65) return "medium"
  if (score >= 0.50) return "medium-low"
  return "low"
}

function weightedScore(row, weights) {
  const totalWeight = weights.reduce((sum, [, weight]) => sum + weight, 0)
  const total = weights.reduce((sum, [key, weight]) => sum + safeNumber(row?.[key], 0) * weight, 0)
  return roundScore(total / totalWeight, 3)
}

function descriptorText(mapping) {
  return asArray(mapping?.descriptors).join(", ")
}

function routeName(route) {
  return `${route?.hostMof || "Host"} + ${route?.guestMetal || "guest"} ${route?.routeType || "route"}`
}

function sanitizeId(value) {
  return String(value || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function evidenceForRoute(route, evidenceRecords) {
  const refs = new Set(asArray(route?.evidenceRefs))
  return asArray(evidenceRecords).filter(record => record.linkedRouteId === route?.routeId || refs.has(record.evidenceId))
}

function riskBreakdown(route, evidenceRecords) {
  const rows = evidenceForRoute(route, evidenceRecords)
    .filter(record => safeNumber(record.penalty, 0) > 0 || record.riskType)
    .map(record => ({
      evidenceId: record.evidenceId,
      riskType: record.riskType || "risk pending",
      penalty: safeNumber(record.penalty, 0),
      reason: record.limitation || record.supports || "risk reason pending",
      confidenceLevel: record.confidenceLevel || "pending",
    }))
  if (rows.length) return rows
  return [{
    evidenceId: `${route?.routeId || "route"}-risk`,
    riskType: "route-level risk",
    penalty: roundScore(1 - safeNumber(route?.riskPenalty, 1), 3),
    reason: route?.mainRisk || "route risk pending",
    confidenceLevel: scoreLabel(route?.evidenceConfidenceScore),
  }]
}

function routeScore(route, evidenceRecords = []) {
  const product = ROUTE_SCORE_KEYS.reduce((total, key) => total * safeNumber(route?.[key], key === "riskPenalty" ? 1 : 0), 1)
  const finalHGCPS = roundScore(product, 3)
  return {
    ...route,
    routeName: routeName(route),
    finalHGCPS,
    scoreBreakdown: {
      hostStability: safeNumber(route?.hostStabilityScore, 0),
      hostPathwaySupport: safeNumber(route?.hostPathwaySupportScore, 0),
      guestActivityCompensation: safeNumber(route?.guestActivityCompensationScore, 0),
      complementarity: safeNumber(route?.hostGuestComplementarityScore, 0),
      evidence: safeNumber(route?.evidenceConfidenceScore, 0),
      riskPenalty: safeNumber(route?.riskPenalty, 0),
    },
    riskPenaltyBreakdown: riskBreakdown(route, evidenceRecords),
    evidenceConfidence: safeNumber(route?.evidenceConfidenceScore, 0),
    confidenceLevel: scoreLabel(route?.evidenceConfidenceScore),
    evidenceSources: evidenceForRoute(route, evidenceRecords),
    provenanceStatus: asArray(route?.provenance).join(" / ") || "provenance pending",
  }
}

export function buildOrganicAcidPathwaySteps(pathwaySteps = [], descriptorMap = []) {
  const mappingsByStep = asArray(descriptorMap).reduce((acc, mapping) => {
    const stepId = mapping.stepId || "unknown-step"
    acc[stepId] = acc[stepId] || []
    acc[stepId].push(mapping)
    return acc
  }, {})

  return asArray(pathwaySteps).map((step, index) => ({
    ...step,
    order: index + 1,
    mappedDescriptors: asArray(mappingsByStep[step.stepId]).flatMap(mapping => asArray(mapping.descriptors)),
    descriptorGroups: asArray(mappingsByStep[step.stepId]).map(mapping => mapping.descriptorGroup),
    evidenceStatus: `${safeNumber(step.evidenceCount, 0)} records / ${step.confidenceLevel || "pending"}`,
  }))
}

export function buildPathwayDescriptorMap(pathwaySteps = [], descriptorMap = []) {
  const stepsById = new Map(asArray(pathwaySteps).map(step => [step.stepId, step]))
  return asArray(descriptorMap).map((mapping, index) => ({
    ...mapping,
    order: index + 1,
    stepName: stepsById.get(mapping.stepId)?.stepName || mapping.stepId || "pathway step pending",
    descriptorSummary: descriptorText(mapping),
    evidenceBoundary: `${mapping.evidenceType || "evidence pending"} / ${mapping.confidenceLevel || "confidence pending"}`,
  }))
}

export function buildHostMofSelection(hostCandidates = []) {
  const rankedHosts = asArray(hostCandidates)
    .map(host => {
      const calculatedHostScore = weightedScore(host, HOST_SCORE_WEIGHTS)
      return {
        ...host,
        calculatedHostScore,
        hostScore: calculatedHostScore,
        hostScoreBreakdown: {
          stabilityProxy: safeNumber(host.stabilityProxy, 0),
          aqueousStabilityEvidence: safeNumber(host.aqueousStabilityEvidence, 0),
          thermalStabilityEvidence: safeNumber(host.thermalStabilityEvidence, 0),
          poreEnvironmentScore: safeNumber(host.poreEnvironmentScore, 0),
          co2EnrichmentSupport: safeNumber(host.co2EnrichmentSupport, 0),
          postModificationFeasibility: safeNumber(host.postModificationFeasibility, 0),
          guestHostingFeasibility: safeNumber(host.guestHostingFeasibility, 0),
          provenanceQuality: safeNumber(host.provenanceQuality, 0),
        },
      }
    })
    .sort((a, b) => b.hostScore - a.hostScore)
    .map((host, index) => ({ ...host, ranking: index + 1 }))

  const selectedHost = rankedHosts[0] || null
  return {
    rankedHosts,
    selectedHost,
    hostScoreBreakdown: selectedHost?.hostScoreBreakdown || {},
    hostRoleExplanation: selectedHost
      ? `${selectedHost.displayName} is selected as the stable host framework / stable scaffold. It is not treated as a standalone best catalyst.`
      : "No host selected.",
    hostLimitation: selectedHost?.limitation || "Host limitation pending.",
    evidenceRefs: asArray(selectedHost?.evidenceRefs),
    provenance: asArray(selectedHost?.provenance),
  }
}

export function buildGuestMetalSelection(guestMetalCandidates = [], selectedHost = null) {
  const rankedGuestMetals = asArray(guestMetalCandidates)
    .map(guest => {
      const calculatedGuestScore = weightedScore(guest, GUEST_SCORE_WEIGHTS)
      return {
        ...guest,
        calculatedGuestScore,
        guestScore: calculatedGuestScore,
        guestScoreBreakdown: {
          co2Activation: safeNumber(guest.co2ActivationScore, 0),
          formateStabilization: safeNumber(guest.formateStabilizationScore, 0),
          electronTransferSupport: safeNumber(guest.electronTransferSupport, 0),
          compatibilityWithSelectedHost: selectedHost?.displayName === "Al-MOF" ? safeNumber(guest.compatibilityWithAlMof, 0) : safeNumber(guest.compatibilityWithAlMof, 0) * 0.95,
          dopingFeasibility: safeNumber(guest.dopingFeasibility, 0),
          postModificationFeasibility: safeNumber(guest.postModificationFeasibility, 0),
          bimetallicConstructionFeasibility: safeNumber(guest.bimetallicConstructionFeasibility, 0),
        },
      }
    })
    .sort((a, b) => b.guestScore - a.guestScore)
    .map((guest, index) => ({ ...guest, ranking: index + 1 }))

  const selectedGuestMetal = rankedGuestMetals[0] || null
  return {
    rankedGuestMetals,
    selectedGuestMetal,
    guestScoreBreakdown: selectedGuestMetal?.guestScoreBreakdown || {},
    guestRoleExplanation: selectedGuestMetal
      ? `${selectedGuestMetal.guestMetal} is selected as the guest / dopant / activity compensation metal for ${selectedHost?.displayName || "the selected host"}. It complements the host instead of replacing it.`
      : "No guest metal selected.",
    compatibilityWithSelectedHost: selectedGuestMetal?.guestScoreBreakdown?.compatibilityWithSelectedHost || 0,
    mainRisk: selectedGuestMetal?.mainRisk || "Guest-metal risk pending.",
    evidenceRefs: asArray(selectedGuestMetal?.evidenceRefs),
    provenance: asArray(selectedGuestMetal?.provenance),
  }
}

export function buildHostGuestComplementarityScore(hostGuestRoutes = [], evidenceRiskRecords = []) {
  const routeScores = asArray(hostGuestRoutes)
    .map(route => routeScore(route, evidenceRiskRecords))
    .sort((a, b) => b.finalHGCPS - a.finalHGCPS)
    .map((route, index) => ({ ...route, ranking: index + 1 }))
  const topRoute = routeScores[0] || null
  return {
    routeScores,
    topRoute,
    scoreBreakdown: topRoute?.scoreBreakdown || {},
    riskPenaltyBreakdown: topRoute?.riskPenaltyBreakdown || [],
    evidenceConfidence: topRoute?.evidenceConfidence || 0,
    whyTopRanked: topRoute
      ? `${routeName(topRoute)} ranks first because host stability, pathway support, Mo activity compensation, host-guest complementarity, evidence coverage, and risk penalty remain jointly strongest.`
      : "No top route.",
    uncertainty: topRoute?.mainRisk || "Route uncertainty pending.",
    provenance: asArray(topRoute?.provenance),
  }
}

export function buildOrganicAcidRoutePriorityQueue(routeScores = []) {
  const rows = asArray(routeScores)
  const topPriority = rows.filter(route => route.ranking === 1 || route.recommendationTier === "Top Priority Route")
  const conditional = rows.filter(route => route.recommendationTier === "Conditional Routes" && route.ranking !== 1)
  const pending = rows.filter(route => route.recommendationTier === "Pending / Insufficient Evidence Routes")
  return {
    topPriority,
    conditionalRoutes: conditional,
    pendingRoutes: pending,
    flatRows: rows,
  }
}

export function buildHostGuestRouteExplanation(route, context = {}) {
  const selectedRoute = route || context?.topRoute || null
  const descriptorRows = asArray(context.descriptorMap).filter(mapping => {
    const evidenceRefs = new Set(asArray(selectedRoute?.evidenceRefs))
    return asArray(mapping.provenance).some(ref => evidenceRefs.has(ref)) || selectedRoute?.routeId === "route-al-mof-mo"
  })
  const evidenceSources = evidenceForRoute(selectedRoute, context.evidenceRecords)
  const validationExperiments = asArray(context.validationExperiments).filter(experiment => experiment.routeId === selectedRoute?.routeId)
  const host = asArray(context.hostSelection?.rankedHosts).find(row => row.displayName === selectedRoute?.hostMof) || context.hostSelection?.selectedHost
  const guest = asArray(context.guestSelection?.rankedGuestMetals).find(row => row.guestMetal === selectedRoute?.guestMetal) || context.guestSelection?.selectedGuestMetal

  return {
    routeId: selectedRoute?.routeId || "route-pending",
    routeName: routeName(selectedRoute),
    hostMof: selectedRoute?.hostMof || "host pending",
    guestMetal: selectedRoute?.guestMetal || "guest pending",
    targetProduct: selectedRoute?.targetProduct || "formic acid / organic acid",
    routeType: selectedRoute?.routeType || "route type pending",
    pathwayStepsSupported: asArray(guest?.supportsPathwaySteps),
    descriptorEvidence: descriptorRows.map(mapping => ({
      stepId: mapping.stepId,
      descriptorGroup: mapping.descriptorGroup,
      descriptors: asArray(mapping.descriptors),
      confidenceLevel: mapping.confidenceLevel || "pending",
    })),
    hostScoreBreakdown: host?.hostScoreBreakdown || context.hostSelection?.hostScoreBreakdown || {},
    guestScoreBreakdown: guest?.guestScoreBreakdown || context.guestSelection?.guestScoreBreakdown || {},
    complementarityScore: safeNumber(selectedRoute?.hostGuestComplementarityScore, 0),
    riskPenalty: safeNumber(selectedRoute?.riskPenalty, 0),
    riskPenaltyBreakdown: selectedRoute?.riskPenaltyBreakdown || riskBreakdown(selectedRoute, context.evidenceRecords),
    evidenceSources,
    provenanceTrace: asArray(selectedRoute?.provenance),
    missingEvidence: evidenceSources.filter(record => record.evidenceType === "missing" || record.curationStatus === "missing").map(record => record.limitation),
    nextValidationExperiment: validationExperiments[0]?.recommendedExperiment || selectedRoute?.nextExperiment || "validation experiment pending",
    validationExperiments,
    exportPayload: {
      version: ORGANIC_ACID_HOST_GUEST_VERSION,
      generatedAt: new Date().toISOString(),
      routeId: selectedRoute?.routeId || "route-pending",
      targetProduct: selectedRoute?.targetProduct || "formic acid / organic acid",
      hostMof: selectedRoute?.hostMof || "host pending",
      guestMetal: selectedRoute?.guestMetal || "guest pending",
      routeType: selectedRoute?.routeType || "route type pending",
      scoreBreakdown: selectedRoute?.scoreBreakdown || {},
      evidenceSources,
      riskReasons: selectedRoute?.riskPenaltyBreakdown || riskBreakdown(selectedRoute, context.evidenceRecords),
      provenance: asArray(selectedRoute?.provenance),
      nextValidationExperiment: validationExperiments[0]?.recommendedExperiment || selectedRoute?.nextExperiment || "validation experiment pending",
    },
  }
}

export function buildOrganicAcidAlgorithmTrace(input = {}) {
  const hostSelection = input.hostSelection || buildHostMofSelection(input.hostMofCandidates)
  const guestSelection = input.guestSelection || buildGuestMetalSelection(input.guestMetalCandidates, hostSelection.selectedHost)
  const complementarity = input.complementarity || buildHostGuestComplementarityScore(input.hostGuestRoutes, input.evidenceRiskRecords)
  const selectedHost = hostSelection.selectedHost
  const selectedGuest = guestSelection.selectedGuestMetal
  const topRoute = complementarity.topRoute
  const descriptorMap = buildPathwayDescriptorMap(input.pathwaySteps, input.pathwayDescriptorMap)
  const experimentalRoute = buildOrganicAcidExperimentalRoute(input.validationExperiments, topRoute)

  return [
    {
      id: "load-pathway-steps",
      title: "Load pathway steps",
      input: "pathway_steps.json",
      method: "Normalize CO2 to organic-acid pathway steps and retain bottlenecks.",
      output: `${asArray(input.pathwaySteps).length} pathway steps loaded`,
      evidence: "step evidence counts and confidence labels",
      uncertainty: "pathway steps remain early-stage mechanistic descriptors",
    },
    {
      id: "map-descriptors",
      title: "Map descriptors to each pathway step",
      input: "pathway_descriptor_map.json",
      method: "Attach descriptor groups to each route bottleneck instead of merging them into one table.",
      output: `${descriptorMap.length} descriptor mappings built`,
      evidence: "descriptor provenance and evidence type",
      uncertainty: "missing descriptors are explicit in each mapping",
    },
    {
      id: "screen-host-mof",
      title: "Screen host MOF candidates",
      input: "host_mof_candidates.json",
      method: "Weighted host score from stability, pore environment, modification feasibility, guest hosting, and provenance.",
      output: `${hostSelection.rankedHosts.length} host candidates ranked`,
      evidence: asArray(selectedHost?.evidenceRefs).join(", "),
      uncertainty: "host activity alone may be insufficient",
    },
    {
      id: "select-al-mof-host",
      title: "Select Al-MOF as host framework",
      input: "ranked host table",
      method: "Choose the highest host score as the stable framework candidate.",
      output: `${selectedHost?.displayName || "Host pending"} selected as ${selectedHost?.hostRole || "stable host framework"}`,
      evidence: hostSelection.hostRoleExplanation,
      uncertainty: hostSelection.hostLimitation,
    },
    {
      id: "screen-guest-metals",
      title: "Screen guest / dopant metals",
      input: "guest_metal_candidates.json + selected host",
      method: "Weighted guest score from CO2 activation, formate stabilization, electron support, Al-MOF compatibility, and synthesis feasibility.",
      output: `${guestSelection.rankedGuestMetals.length} guest metals ranked`,
      evidence: asArray(selectedGuest?.evidenceRefs).join(", "),
      uncertainty: "guest speciation must be verified experimentally",
    },
    {
      id: "select-mo-guest",
      title: "Select Mo as high-priority guest metal",
      input: "ranked guest-metal table",
      method: "Choose the highest guest score as the activity compensation metal.",
      output: `${selectedGuest?.guestMetal || "Guest pending"} selected as ${selectedGuest?.role || "guest / dopant"}`,
      evidence: guestSelection.guestRoleExplanation,
      uncertainty: guestSelection.mainRisk,
    },
    {
      id: "calculate-complementarity",
      title: "Calculate host-guest complementarity score",
      input: "host_guest_routes.json + evidence_risk_records.json",
      method: "HGCPS = host stability * host pathway support * guest compensation * complementarity * evidence confidence * risk penalty.",
      output: `${routeName(topRoute)} ranked #${topRoute?.ranking || "pending"} with HGCPS ${topRoute?.finalHGCPS || 0}`,
      evidence: complementarity.whyTopRanked,
      uncertainty: complementarity.uncertainty,
    },
    {
      id: "generate-experimental-route",
      title: "Generate Al-MOF + Mo experimental route",
      input: "validation_experiments.json",
      method: "Convert top route into validation experiments, controls, characterization, success criteria, and falsification checks.",
      output: `${experimentalRoute.experiments.length} validation experiments linked`,
      evidence: experimentalRoute.summary,
      uncertainty: "High-priority experimental route, not final catalytic proof",
    },
  ]
}

export function buildHostGuestKnowledgeGraph(input = {}) {
  const pathwaySteps = buildOrganicAcidPathwaySteps(input.pathwaySteps, input.pathwayDescriptorMap)
  const descriptorRows = buildPathwayDescriptorMap(input.pathwaySteps, input.pathwayDescriptorMap)
  const hostSelection = input.hostSelection || buildHostMofSelection(input.hostMofCandidates)
  const guestSelection = input.guestSelection || buildGuestMetalSelection(input.guestMetalCandidates, hostSelection.selectedHost)
  const complementarity = input.complementarity || buildHostGuestComplementarityScore(input.hostGuestRoutes, input.evidenceRiskRecords)
  const topRoute = complementarity.topRoute
  const routeEvidence = evidenceForRoute(topRoute, input.evidenceRiskRecords)
  const risks = routeEvidence.filter(record => record.riskType).map(record => record.riskType)
  const uniqueRisks = Array.from(new Set(risks))
  const validations = asArray(input.validationExperiments).filter(experiment => experiment.routeId === topRoute?.routeId)

  const nodes = [
    ...pathwaySteps.map(step => ({ id: step.stepId, type: "pathway step", label: step.stepName, confidence: step.confidenceLevel })),
    ...descriptorRows.flatMap(mapping => asArray(mapping.descriptors).map(descriptor => ({
      id: `descriptor-${sanitizeId(`${mapping.stepId}-${descriptor}`)}`,
      type: "descriptor",
      label: descriptor,
      stepId: mapping.stepId,
      confidence: mapping.confidenceLevel,
    }))),
    ...hostSelection.rankedHosts.map(host => ({ id: `host-${sanitizeId(host.displayName)}`, type: "host MOF", label: host.displayName, score: host.hostScore })),
    ...guestSelection.rankedGuestMetals.map(guest => ({ id: `guest-${sanitizeId(guest.guestMetal)}`, type: "guest metal", label: guest.guestMetal, score: guest.guestScore })),
    ...complementarity.routeScores.map(route => ({ id: route.routeId, type: "host-guest route", label: routeName(route), score: route.finalHGCPS })),
    ...routeEvidence.map(record => ({ id: record.evidenceId, type: "evidence", label: record.supports, confidence: record.confidenceLevel })),
    ...uniqueRisks.map(risk => ({ id: `risk-${sanitizeId(risk)}`, type: "risk", label: risk })),
    ...validations.map(experiment => ({ id: experiment.experimentId, type: "validation experiment", label: experiment.recommendedExperiment, priority: experiment.validationPriority })),
  ]

  const edges = [
    ...descriptorRows.flatMap(mapping => asArray(mapping.descriptors).map(descriptor => ({
      source: mapping.stepId,
      target: `descriptor-${sanitizeId(`${mapping.stepId}-${descriptor}`)}`,
      relation: "pathway step -> required descriptor",
    }))),
    ...descriptorRows.map(mapping => ({
      source: `descriptor-${sanitizeId(`${mapping.stepId}-${asArray(mapping.descriptors)[0] || mapping.descriptorGroup}`)}`,
      target: `host-${sanitizeId(hostSelection.selectedHost?.displayName)}`,
      relation: "descriptor -> host MOF selection",
    })),
    ...descriptorRows.map(mapping => ({
      source: `descriptor-${sanitizeId(`${mapping.stepId}-${asArray(mapping.descriptors)[0] || mapping.descriptorGroup}`)}`,
      target: `guest-${sanitizeId(guestSelection.selectedGuestMetal?.guestMetal)}`,
      relation: "descriptor -> guest metal selection",
    })),
    { source: `host-${sanitizeId(hostSelection.selectedHost?.displayName)}`, target: topRoute?.routeId, relation: "host MOF -> Al-MOF route" },
    { source: `guest-${sanitizeId(guestSelection.selectedGuestMetal?.guestMetal)}`, target: topRoute?.routeId, relation: "guest metal -> Mo route" },
    ...pathwaySteps.map(step => ({ source: topRoute?.routeId, target: step.stepId, relation: "Al-MOF + Mo route -> pathway support" })),
    ...routeEvidence.map(record => ({ source: record.evidenceId, target: topRoute?.routeId, relation: "evidence -> score contribution" })),
    ...routeEvidence.filter(record => record.riskType).map(record => ({ source: `risk-${sanitizeId(record.riskType)}`, target: topRoute?.routeId, relation: "risk -> penalty" })),
    ...validations.map(experiment => ({ source: topRoute?.routeId, target: experiment.experimentId, relation: "route -> validation experiment" })),
  ].filter(edge => edge.source && edge.target)

  return {
    nodes,
    edges,
    highlightedRouteId: topRoute?.routeId,
    highlightedPath: [
      ...pathwaySteps.map(step => step.stepId),
      ...descriptorRows.slice(0, 3).flatMap(mapping => asArray(mapping.descriptors).slice(0, 1).map(descriptor => `descriptor-${sanitizeId(`${mapping.stepId}-${descriptor}`)}`)),
      `host-${sanitizeId(hostSelection.selectedHost?.displayName)}`,
      `guest-${sanitizeId(guestSelection.selectedGuestMetal?.guestMetal)}`,
      topRoute?.routeId,
      ...routeEvidence.map(record => record.evidenceId),
      ...uniqueRisks.map(risk => `risk-${sanitizeId(risk)}`),
      ...validations.map(experiment => experiment.experimentId),
    ].filter(Boolean),
  }
}

export function buildOrganicAcidExperimentalRoute(validationExperiments = [], topRoute = null) {
  const routeId = topRoute?.routeId || "route-al-mof-mo"
  const experiments = asArray(validationExperiments).filter(experiment => experiment.routeId === routeId)
  return {
    routeId,
    routeName: routeName(topRoute),
    targetProduct: topRoute?.targetProduct || "formic acid / organic acid",
    experiments,
    summary: experiments.length
      ? `${experiments.length} experiments cover host synthesis, Mo introduction, structure verification, 170C stability, reaction comparison, Mo coordination, and C1 mechanism checks.`
      : "No experiments linked yet.",
    nextExperiment: experiments[0]?.recommendedExperiment || topRoute?.nextExperiment || "validation experiment pending",
  }
}

function buildEvidenceMatrix(routeScores, evidenceRiskRecords, pathwaySteps) {
  const stepById = new Map(asArray(pathwaySteps).map(step => [step.stepId, step.stepName]))
  return asArray(routeScores).flatMap(route => {
    const records = evidenceForRoute(route, evidenceRiskRecords)
    const rows = records.length ? records : [{ evidenceType: "missing", confidenceLevel: "low", linkedStepId: "missing", supports: "Missing evidence", linkedDescriptor: "Missing evidence" }]
    return rows.map(record => ({
      routeId: route.routeId,
      routeName: route.routeName,
      hostMof: route.hostMof,
      guestMetal: route.guestMetal,
      pathwayStep: stepById.get(record.linkedStepId) || record.linkedStepId || "Missing evidence",
      evidenceType: record.evidenceType || "missing",
      confidenceLevel: record.confidenceLevel || "low",
      sameCondition: record.sameCondition === true ? "same-condition experiment" : "not same-condition",
      descriptor: record.linkedDescriptor || "Missing evidence",
      status: record.curationStatus || "pending",
    }))
  })
}

function buildConfidenceMatrix(routeScores) {
  return asArray(routeScores).map(route => ({
    routeId: route.routeId,
    routeName: route.routeName,
    hostMof: route.hostMof,
    guestMetal: route.guestMetal,
    confidenceLevel: route.confidenceLevel,
    evidenceConfidence: route.evidenceConfidence,
    evidenceGrade: route.evidenceConfidence >= 0.75 ? "A/B proxy" : route.evidenceConfidence >= 0.65 ? "B/C proxy" : "C/D needs validation",
    riskPenalty: route.scoreBreakdown.riskPenalty,
    provenanceStatus: route.provenanceStatus,
  }))
}

export function buildOrganicAcidHostGuestWorkbench(input = {}) {
  const pathwaySteps = buildOrganicAcidPathwaySteps(input.pathwaySteps, input.pathwayDescriptorMap)
  const descriptorMap = buildPathwayDescriptorMap(input.pathwaySteps, input.pathwayDescriptorMap)
  const hostSelection = buildHostMofSelection(input.hostMofCandidates)
  const guestSelection = buildGuestMetalSelection(input.guestMetalCandidates, hostSelection.selectedHost)
  const complementarity = buildHostGuestComplementarityScore(input.hostGuestRoutes, input.evidenceRiskRecords)
  const priorityQueue = buildOrganicAcidRoutePriorityQueue(complementarity.routeScores)
  const routeExplanation = buildHostGuestRouteExplanation(complementarity.topRoute, {
    hostSelection,
    guestSelection,
    descriptorMap,
    evidenceRecords: input.evidenceRiskRecords,
    validationExperiments: input.validationExperiments,
  })
  const algorithmTrace = buildOrganicAcidAlgorithmTrace({
    ...input,
    hostSelection,
    guestSelection,
    complementarity,
  })
  const knowledgeGraph = buildHostGuestKnowledgeGraph({
    ...input,
    hostSelection,
    guestSelection,
    complementarity,
  })
  const experimentalRoute = buildOrganicAcidExperimentalRoute(input.validationExperiments, complementarity.topRoute)
  const evidenceMatrix = buildEvidenceMatrix(complementarity.routeScores, input.evidenceRiskRecords, input.pathwaySteps)
  const confidenceMatrix = buildConfidenceMatrix(complementarity.routeScores)

  const selectedHost = hostSelection.selectedHost
  const selectedGuestMetal = guestSelection.selectedGuestMetal
  const topRoute = complementarity.topRoute

  return {
    version: ORGANIC_ACID_HOST_GUEST_VERSION,
    algorithmName: HOST_GUEST_ALGORITHM_NAME,
    algorithmNameZh: "主客体互补路径筛选算法",
    workbenchName: "Organic Acid Host-Guest Pathway Screening Workbench",
    workbenchNameZh: "有机酸主客体路径筛选工作台",
    recommendation: {
      hostFramework: selectedHost?.displayName || "Host pending",
      guestDopantMetal: selectedGuestMetal?.guestMetal || "Guest pending",
      suggestedRoute: routeName(topRoute),
      algorithmBasis: "pathway-step descriptor screening + host-guest complementarity scoring",
      confidence: `derived from evidence coverage and provenance (${scoreLabel(topRoute?.evidenceConfidence)})`,
      mainUncertainty: topRoute?.mainRisk || "Mo introduction feasibility and 170C aqueous stability validation",
      note: "high-priority experimental route, not final proof of catalytic performance",
    },
    pathwaySteps,
    descriptorMap,
    hostSelection,
    guestSelection,
    complementarity,
    priorityQueue,
    selectedRouteExplanation: routeExplanation,
    algorithmTrace,
    knowledgeGraph,
    evidenceMatrix,
    confidenceMatrix,
    experimentalRoute,
    pipelineSteps: PIPELINE_STEP_LABELS.map((label, index) => {
      const commonEvidence = index < 2
        ? `${pathwaySteps.length} pathway steps / ${descriptorMap.length} descriptor maps`
        : index === 2
          ? asArray(selectedHost?.evidenceRefs).join(", ")
          : index === 3
            ? asArray(selectedGuestMetal?.evidenceRefs).join(", ")
            : index === 4
              ? `${complementarity.routeScores.length} routes scored`
              : `${experimentalRoute.experiments.length} validation experiments`
      const commonUncertainty = [
        "same-condition aqueous evidence is incomplete",
        "several descriptors are proxy or missing",
        hostSelection.hostLimitation,
        guestSelection.mainRisk,
        complementarity.uncertainty,
        "validation route is a hypothesis-testing plan, not proof",
      ][index]
      return {
        id: `pipeline-${index + 1}`,
        stepNumber: index + 1,
        title: label,
        input: [
          "CO2 -> organic acid pathway steps",
          "step-specific descriptor map",
          "host MOF candidates",
          "guest / dopant metal candidates + selected host",
          "host-guest routes + evidence-risk records",
          "top route + validation experiments",
        ][index],
        screeningLogic: [
          "Identify bottlenecks from CO2 adsorption through 170C aqueous stability.",
          "Map each bottleneck to descriptor groups instead of a single mixed descriptor table.",
          "Rank hosts by scaffold stability, pore environment, modification feasibility, guest hosting, and provenance.",
          "Rank guest metals by CO2 activation, HCOO* stabilization, electron support, Al-MOF compatibility, and synthesis feasibility.",
          "Compute HGCPS from host stability, host pathway support, guest compensation, complementarity, evidence confidence, and risk penalty.",
          "Translate the top route into experiments, controls, characterization, and success criteria.",
        ][index],
        output: [
          `${pathwaySteps.length} pathway steps with mapped capabilities`,
          `${descriptorMap.length} pathway descriptor mappings`,
          `${selectedHost?.displayName || "Host pending"} selected as stable host framework`,
          `${selectedGuestMetal?.guestMetal || "Guest pending"} selected as guest / dopant metal`,
          `${topRoute?.routeName || "Route pending"} ranked first by HGCPS`,
          experimentalRoute.nextExperiment,
        ][index],
        evidence: commonEvidence || "evidence pending",
        uncertainty: commonUncertainty || "uncertainty pending",
      }
    }),
  }
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join("; ") : String(value ?? "")
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toCsv(rows, columns) {
  const header = columns.map(column => csvEscape(column.label)).join(",")
  const body = asArray(rows).map(row => columns.map(column => csvEscape(row[column.key])).join(",")).join("\n")
  return `${header}\n${body}`
}

export function buildHostGuestRoutePriorityQueueCsv(priorityQueue) {
  return toCsv(asArray(priorityQueue?.flatRows), [
    { key: "ranking", label: "ranking" },
    { key: "hostMof", label: "host MOF" },
    { key: "guestMetal", label: "guest / dopant metal" },
    { key: "routeType", label: "route type" },
    { key: "targetProduct", label: "target product" },
    { key: "finalHGCPS", label: "final HGCPS" },
    { key: "confidenceLevel", label: "confidence level" },
    { key: "recommendationTier", label: "recommendation tier" },
    { key: "mainReason", label: "main reason" },
    { key: "mainRisk", label: "main risk" },
    { key: "nextExperiment", label: "next validation experiment" },
    { key: "provenanceStatus", label: "provenance" },
  ])
}

export function buildPathwayDescriptorMapCsv(descriptorMap) {
  return toCsv(asArray(descriptorMap), [
    { key: "stepName", label: "pathway step" },
    { key: "descriptorGroup", label: "descriptor group" },
    { key: "descriptorSummary", label: "descriptors" },
    { key: "descriptorDirection", label: "descriptor direction" },
    { key: "whyTheseDescriptorsMatter", label: "why descriptors matter" },
    { key: "dataAvailability", label: "data availability" },
    { key: "evidenceBoundary", label: "evidence boundary" },
  ])
}

export function buildHostGuestRouteExplanationJson(routeExplanation) {
  return {
    version: ORGANIC_ACID_HOST_GUEST_VERSION,
    generatedAt: new Date().toISOString(),
    targetProduct: routeExplanation?.targetProduct || "formic acid / organic acid",
    hostMof: routeExplanation?.hostMof || "host pending",
    guestMetal: routeExplanation?.guestMetal || "guest pending",
    routeType: routeExplanation?.routeType || "route type pending",
    scoreBreakdown: routeExplanation?.exportPayload?.scoreBreakdown || {},
    evidenceSources: routeExplanation?.evidenceSources || [],
    riskReasons: routeExplanation?.riskPenaltyBreakdown || [],
    provenance: routeExplanation?.provenanceTrace || [],
    nextValidationExperiment: routeExplanation?.nextValidationExperiment || "validation experiment pending",
  }
}

export function buildAlgorithmTraceJson(algorithmTrace) {
  return {
    version: ORGANIC_ACID_HOST_GUEST_VERSION,
    generatedAt: new Date().toISOString(),
    targetProduct: "formic acid / organic acid",
    hostMof: "Al-MOF",
    guestMetal: "Mo",
    routeType: "doping / post-modification / bimetallic construction",
    trace: asArray(algorithmTrace),
  }
}

export function buildOrganicAcidExperimentalRouteJson(experimentalRoute) {
  return {
    version: ORGANIC_ACID_HOST_GUEST_VERSION,
    generatedAt: new Date().toISOString(),
    targetProduct: experimentalRoute?.targetProduct || "formic acid / organic acid",
    hostMof: "Al-MOF",
    guestMetal: "Mo",
    routeType: "doping / post-modification / bimetallic construction",
    nextValidationExperiment: experimentalRoute?.nextExperiment || "validation experiment pending",
    validationExperiments: asArray(experimentalRoute?.experiments),
  }
}
