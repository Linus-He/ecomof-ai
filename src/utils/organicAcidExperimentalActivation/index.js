export const ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION = "V3.9.4"

const PENDING = "pending"

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function safeText(value, fallback = PENDING) {
  if (value === undefined || value === null) return fallback
  const next = String(value).trim()
  return next || fallback
}

function safeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback
}

function safeList(value) {
  return asArray(value).map(item => safeText(item)).filter(item => item !== PENDING)
}

function sourceMeta(row = {}, fallback = {}) {
  return {
    dataMode: safeText(row.dataMode || fallback.dataMode, "seed"),
    evidenceMode: safeText(row.evidenceMode || fallback.evidenceMode, "seed / curated / proxy"),
    provenance: safeList(row.provenance || fallback.provenance),
    curationStatus: safeText(row.curationStatus || fallback.curationStatus, "seed_curated_pending_experiment"),
    limitation: safeText(row.limitation || fallback.limitation, "Planning data only; no same-condition experimental result has been completed or claimed."),
  }
}

function recordsFrom(data, key) {
  if (Array.isArray(data)) return data
  return asArray(asObject(data)[key])
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

export function buildSpecificAlMofHostCandidates(data = {}) {
  const meta = sourceMeta(data)
  const all = recordsFrom(data, "hostCandidates").map((row, index) => ({
    ...sourceMeta(row, meta),
    hostCandidateId: safeText(row.hostCandidateId, `host-candidate-${index + 1}`),
    displayName: safeText(row.displayName),
    hostFamily: safeText(row.hostFamily),
    metalNodeDescription: safeText(row.metalNodeDescription),
    linkerDescription: safeText(row.linkerDescription),
    topologyOrStructureType: safeText(row.topologyOrStructureType),
    synthesisAccessibility: safeText(row.synthesisAccessibility),
    knownOrExpectedWaterStability: safeText(row.knownOrExpectedWaterStability),
    knownOrExpectedThermalStability: safeText(row.knownOrExpectedThermalStability),
    poreEnvironment: safeText(row.poreEnvironment),
    surfaceAreaOrProxy: safeText(row.surfaceAreaOrProxy),
    poreSizeOrProxy: safeText(row.poreSizeOrProxy),
    postModificationFeasibility: safeText(row.postModificationFeasibility),
    guestHostingFeasibility: safeText(row.guestHostingFeasibility),
    moIntroductionCompatibility: safeText(row.moIntroductionCompatibility),
    reasonForSelection: safeText(row.reasonForSelection),
    mainLimitation: safeText(row.mainLimitation),
    requiredPreExperimentCheck: safeText(row.requiredPreExperimentCheck),
    recommendedRole: safeText(row.recommendedRole),
    priorityTier: safeText(row.priorityTier, index === 0 ? "primary" : "backup"),
    evidenceType: safeText(row.evidenceType),
    confidenceLevel: safeText(row.confidenceLevel),
    sourceUrl: safeText(row.sourceUrl),
    citation: safeText(row.citation),
    retrievedAt: safeText(row.retrievedAt),
    notes: safeText(row.notes),
  }))
  const primary = all.find(row => row.priorityTier === "primary" && row.provenance.length) || all.find(row => row.provenance.length) || all[0] || null
  const backup = all.filter(row => row.hostCandidateId !== primary?.hostCandidateId && /backup|secondary/i.test(`${row.priorityTier} ${row.recommendedRole}`))
  const control = all.filter(row => /control/i.test(`${row.priorityTier} ${row.recommendedRole} ${row.displayName}`))
  return {
    version: ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION,
    meta,
    primary,
    backup,
    control,
    all,
    summary: {
      candidateCount: all.length,
      primaryHost: primary?.displayName || PENDING,
      backupCount: backup.length,
      controlCount: control.length,
      claimBoundary: "Specific Al-MOF host candidates are planning-ready choices, not final catalyst proof.",
    },
  }
}

export function buildMoIntroductionStrategies(data = {}) {
  const meta = sourceMeta(data)
  const all = recordsFrom(data, "strategies").map((row, index) => ({
    ...sourceMeta(row, meta),
    strategyId: safeText(row.strategyId, `mo-strategy-${index + 1}`),
    displayName: safeText(row.displayName),
    routeType: safeText(row.routeType),
    compatibleHostCandidateIds: safeList(row.compatibleHostCandidateIds),
    moPrecursorOptions: safeList(row.moPrecursorOptions),
    introductionMethod: safeText(row.introductionMethod),
    expectedMoState: safeText(row.expectedMoState),
    expectedCoordinationEnvironment: safeText(row.expectedCoordinationEnvironment),
    expectedFunction: safeText(row.expectedFunction),
    supportedPathwaySteps: safeList(row.supportedPathwaySteps),
    synthesisComplexity: safeText(row.synthesisComplexity),
    structureDamageRisk: safeText(row.structureDamageRisk),
    leachingRisk: safeText(row.leachingRisk),
    localCoordinationUncertainty: safeText(row.localCoordinationUncertainty),
    requiredCharacterization: safeList(row.requiredCharacterization),
    recommendedControl: safeText(row.recommendedControl),
    successCriterion: safeText(row.successCriterion),
    failureCriterion: safeText(row.failureCriterion),
    reasonForPriority: safeText(row.reasonForPriority),
    evidenceType: safeText(row.evidenceType),
    confidenceLevel: safeText(row.confidenceLevel),
    sourceUrl: safeText(row.sourceUrl),
    citation: safeText(row.citation),
    notes: safeText(row.notes),
  }))
  return {
    version: ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION,
    meta,
    postModification: all.find(row => /post/i.test(row.routeType)) || null,
    doping: all.find(row => /doping|synthesis/i.test(row.routeType)) || null,
    poreConfinement: all.find(row => /pore|impregnation|confinement/i.test(row.routeType)) || null,
    bimetallic: all.find(row => /bimetallic/i.test(row.routeType)) || null,
    all,
    summary: {
      strategyCount: all.length,
      firstLowRiskStrategy: (all.find(row => /post/i.test(row.routeType)) || all[0])?.displayName || PENDING,
      claimBoundary: "Mo strategies are route-planning options; Mo state and local coordination remain pending characterization.",
    },
  }
}

export function buildMoStrategyDecisionTree(strategies = []) {
  const rows = asArray(strategies)
  const find = pattern => rows.find(row => pattern.test(`${row.strategyId} ${row.routeType} ${row.displayName}`)) || rows[0] || {}
  return [
    {
      branchId: "low-risk-first",
      condition: "low synthesis risk / first activation",
      recommendation: find(/post/i).displayName || "Mo post-synthetic modification",
      strategyId: find(/post/i).strategyId || "mo-post-synthetic-modification",
      rationale: "Verify host phase and porosity before Mo introduction.",
    },
    {
      branchId: "stronger-synergy",
      condition: "stronger host-guest synergy required",
      recommendation: find(/bimetallic/i).displayName || "Al-Mo bimetallic construction",
      strategyId: find(/bimetallic/i).strategyId || "al-mo-bimetallic-node-construction",
      rationale: "Use only when stronger node-level interaction is worth higher structure-risk.",
    },
    {
      branchId: "fast-validation",
      condition: "fast validation / rapid Mo exposure check",
      recommendation: find(/pore|impregnation|confinement/i).displayName || "Mo pore confinement / impregnation",
      strategyId: find(/pore|impregnation|confinement/i).strategyId || "mo-pore-confinement-impregnation",
      rationale: "Run as a quick screen with leaching and pore-blocking controls.",
    },
  ]
}

export function buildMinimumExperimentalMatrix(data = {}) {
  const meta = sourceMeta(data)
  const all = recordsFrom(data, "experimentGroups").map((row, index) => ({
    ...sourceMeta(row, meta),
    experimentGroupId: safeText(row.experimentGroupId, `experiment-group-${index + 1}`),
    experimentName: safeText(row.experimentName),
    routeId: safeText(row.routeId),
    hostCandidateId: safeText(row.hostCandidateId),
    guestMetal: safeText(row.guestMetal),
    moIntroductionStrategyId: safeText(row.moIntroductionStrategyId),
    controlType: safeText(row.controlType),
    purpose: safeText(row.purpose),
    hypothesisTested: safeText(row.hypothesisTested),
    requiredMaterial: safeText(row.requiredMaterial),
    requiredPretreatment: safeText(row.requiredPretreatment),
    reactionConditionTemplateId: safeText(row.reactionConditionTemplateId),
    expectedOutcome: safeText(row.expectedOutcome),
    failureMeaning: safeText(row.failureMeaning),
    requiredCharacterizationBeforeReaction: safeList(row.requiredCharacterizationBeforeReaction),
    requiredCharacterizationAfterReaction: safeList(row.requiredCharacterizationAfterReaction),
    requiredProductAnalysis: safeList(row.requiredProductAnalysis),
    priority: Number.isFinite(Number(row.priority)) ? Number(row.priority) : index + 1,
    mustRun: safeBoolean(row.mustRun, false),
    notes: safeText(row.notes),
  })).sort((a, b) => a.priority - b.priority)
  const topRouteExperiment = all.find(row => row.routeId === "route-al-mof-mo") || all.find(row => row.mustRun) || all[0] || null
  return {
    version: ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION,
    meta,
    reactionConditionTemplates: asArray(data.reactionConditionTemplates),
    mustRunCoreExperiments: all.filter(row => row.mustRun),
    mechanismControlExperiments: all.filter(row => /control|blank|only/i.test(`${row.controlType} ${row.experimentName}`)),
    optionalBackupExperiments: all.filter(row => !row.mustRun),
    topRouteExperiment,
    all,
    coverage: {
      groupCount: all.length,
      includesBlank: all.some(row => /blank/i.test(row.controlType)),
      includesPristineAlMof: all.some(row => /pristine/i.test(row.experimentName)),
      includesAlMofMo: all.some(row => row.routeId === "route-al-mof-mo"),
      includesGuestControl: all.some(row => /W|Fe|Co/.test(row.guestMetal) && row.routeId !== "route-al-mof-mo"),
      includesZrMofMo: all.some(row => /zr/i.test(row.routeId)),
      includesMoOnly: all.some(row => /mo-only|moox/i.test(`${row.routeId} ${row.experimentName}`)),
    },
  }
}

export function buildSameConditionDataTemplate(data = {}) {
  const meta = sourceMeta(data)
  const categories = recordsFrom(data, "categories").map(category => ({
    category: safeText(category.category),
    displayName: safeText(category.displayName || category.category),
    fields: asArray(category.fields).map(field => ({
      ...sourceMeta(field, meta),
      category: safeText(field.category || category.category),
      fieldName: safeText(field.fieldName),
      label: safeText(field.label || field.fieldName),
      unit: safeText(field.unit, ""),
      required: safeBoolean(field.required, false),
      dataType: safeText(field.dataType, "string"),
      allowedValues: safeList(field.allowedValues),
      whyNeeded: safeText(field.whyNeeded),
      affectsAlgorithmFactor: safeText(field.affectsAlgorithmFactor),
    })),
  }))
  const fields = categories.flatMap(category => category.fields)
  return {
    version: ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION,
    meta,
    templateId: safeText(data.templateId, "same-condition-organic-acid-v394"),
    status: safeText(data.status, "template only / no real results yet"),
    categories,
    fields,
    requiredFields: fields.filter(field => field.required),
    summary: {
      categoryCount: categories.length,
      fieldCount: fields.length,
      requiredFieldCount: fields.filter(field => field.required).length,
      claimBoundary: "Template fields collect comparable same-condition data; pending fields must not be interpreted as results.",
    },
  }
}

export function buildExperimentalValidationResultTemplate(data = {}) {
  return {
    version: ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION,
    meta: sourceMeta(data),
    status: safeText(data.status, "template only / no real results yet"),
    schema: asObject(data.schema),
    examplePendingRecords: asArray(data.examplePendingRecords).map((row, index) => ({
      resultId: safeText(row.resultId, `pending-result-${index + 1}`),
      experimentGroupId: safeText(row.experimentGroupId),
      routeId: safeText(row.routeId),
      hostCandidateId: safeText(row.hostCandidateId),
      guestMetal: safeText(row.guestMetal),
      validationOutcome: safeText(row.validationOutcome, "pending"),
      algorithmUpdateAction: safeText(row.algorithmUpdateAction, "noUpdateYet"),
      notes: safeText(row.notes, "Template placeholder only; no real experiment has been completed."),
      raw: row,
    })),
    supportedOutcomes: ["supported", "contradicted", "inconclusive", "pending"],
    hasRealResults: false,
  }
}

export function buildExperimentalFeedbackRules(data = {}) {
  const meta = sourceMeta(data)
  const rules = recordsFrom(data, "rules").map((row, index) => ({
    ...sourceMeta(row, meta),
    ruleId: safeText(row.ruleId, `feedback-rule-${index + 1}`),
    triggerCondition: safeText(row.triggerCondition),
    requiredMeasurements: safeList(row.requiredMeasurements),
    updateTarget: safeText(row.updateTarget),
    updateAction: safeText(row.updateAction),
    factorAffected: safeList(row.factorAffected),
    scoreUpdateDirection: safeText(row.scoreUpdateDirection),
    confidenceUpdate: safeText(row.confidenceUpdate),
    recommendedNextStep: safeText(row.recommendedNextStep),
    explanation: safeText(row.explanation),
  }))
  return {
    version: ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION,
    meta,
    rules,
    supportedRules: rules.filter(row => /supported|increase/i.test(`${row.ruleId} ${row.scoreUpdateDirection}`)),
    contradictedRules: rules.filter(row => /contradict|decrease|collapse|leach|outperform/i.test(`${row.ruleId} ${row.scoreUpdateDirection} ${row.triggerCondition}`)),
    inconclusiveRules: rules.filter(row => /inconclusive|carbon|gap|noUpdate/i.test(`${row.ruleId} ${row.updateAction}`)),
  }
}

function resultText(result = {}) {
  return Object.entries(result).map(([key, value]) => `${key}:${value}`).join(" | ").toLowerCase()
}

export function evaluateExperimentalResultAgainstRules(result = {}, feedbackRules = []) {
  const rules = asArray(feedbackRules)
  const text = resultText(result)
  const outcome = safeText(result.validationOutcome, "pending")
  let matchedRules = []
  if (outcome === "supported" || (Number(result.measuredFormicAcidYield) > Number(result.pristineFormicAcidYield || 0) && result.structureRetained === true)) {
    matchedRules = rules.filter(rule => /supported|yield/i.test(rule.ruleId))
  } else if (text.includes("carbon") || Number(result.carbonBalance) < 0.8) {
    matchedRules = rules.filter(rule => /carbon|inconclusive/i.test(rule.ruleId))
  } else if (result.mofCollapsed === true || text.includes("collapse")) {
    matchedRules = rules.filter(rule => /collapse|framework/i.test(rule.ruleId))
  } else if (result.moLeachingDetected === true || text.includes("leaching")) {
    matchedRules = rules.filter(rule => /leach/i.test(rule.ruleId))
  } else if (text.includes("zr-mof") || result.alternativeHostOutperformed === true) {
    matchedRules = rules.filter(rule => /zr|host/i.test(rule.ruleId))
  } else if (outcome === "contradicted") {
    matchedRules = rules.filter(rule => /decrease|contradict/i.test(`${rule.scoreUpdateDirection} ${rule.ruleId}`))
  } else {
    matchedRules = rules.filter(rule => /pending|inconclusive|carbon/i.test(`${rule.ruleId} ${rule.updateAction}`)).slice(0, 1)
  }
  return {
    outcome,
    matchedRules,
    recommendedNextSteps: matchedRules.map(rule => rule.recommendedNextStep),
    factorUpdates: Array.from(new Set(matchedRules.flatMap(rule => rule.factorAffected))),
    updateBoundary: outcome === "inconclusive" || outcome === "pending"
      ? "Do not force reranking until comparable same-condition evidence is complete."
      : "Preview only; apply score changes only after data provenance review.",
  }
}

export function buildAlgorithmUpdatePreview(feedbackRules = []) {
  const rules = asArray(feedbackRules)
  const byDirection = direction => rules.filter(rule => String(rule.scoreUpdateDirection).toLowerCase().includes(direction))
  return {
    previewStatus: "pending results / no score mutation",
    supportedResult: {
      expectedAction: "increase evidence confidence or risk retention after structure-retained same-condition improvement",
      rules: byDirection("increase").map(rule => rule.ruleId),
    },
    contradictedResult: {
      expectedAction: "decrease relevant route factors when yield, structure, leaching, or host-control evidence contradicts the top route",
      rules: byDirection("decrease").map(rule => rule.ruleId),
    },
    inconclusiveResult: {
      expectedAction: "hold route score and collect missing carbon balance / repeat / characterization data",
      rules: rules.filter(rule => /inconclusive|noUpdate|carbon/i.test(`${rule.ruleId} ${rule.updateAction}`)).map(rule => rule.ruleId),
    },
  }
}

export function buildPostExperimentRouteRerankingPreview(feedbackRules = []) {
  return {
    rerankingStatus: "preview only / pending results",
    possibleTriggers: asArray(feedbackRules).map(rule => ({
      ruleId: rule.ruleId,
      triggerCondition: rule.triggerCondition,
      scoreUpdateDirection: rule.scoreUpdateDirection,
      factorAffected: rule.factorAffected,
      updateAction: rule.updateAction,
    })),
    boundary: "No formal reranking or machine learning update is allowed before same-condition experimental labels and provenance review exist.",
  }
}

export function buildActivationReadinessSummary(data = {}) {
  return {
    version: ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION,
    ...sourceMeta(data),
    currentStage: safeText(data.currentStage, "experimental planning ready"),
    readinessLevel: safeText(data.readinessLevel, "planning-ready / not performance-validated"),
    canUseForInternalDiscussion: safeBoolean(data.canUseForInternalDiscussion, true),
    canUseForExperimentPlanning: safeBoolean(data.canUseForExperimentPlanning, true),
    canUseForPerformanceClaim: safeBoolean(data.canUseForPerformanceClaim, false),
    canUseForMachineLearning: safeBoolean(data.canUseForMachineLearning, false),
    remainingBlockers: safeList(data.remainingBlockers),
    minimumActivationChecklist: safeList(data.minimumActivationChecklist),
    requiredBeforeFirstExperiment: safeList(data.requiredBeforeFirstExperiment),
    requiredBeforeAlgorithmValidation: safeList(data.requiredBeforeAlgorithmValidation),
    requiredBeforeMachineLearning: safeList(data.requiredBeforeMachineLearning),
    recommendedNextAction: safeText(data.recommendedNextAction),
  }
}

export function buildExperimentalActivationWorkbench(input = {}, routeContext = {}) {
  const hosts = buildSpecificAlMofHostCandidates(input.specificAlMofHosts)
  const moStrategies = buildMoIntroductionStrategies(input.moIntroductionStrategies)
  const matrix = buildMinimumExperimentalMatrix(input.minimumExperimentalMatrix)
  const template = buildSameConditionDataTemplate(input.sameConditionDataTemplate)
  const validationTemplate = buildExperimentalValidationResultTemplate(input.experimentalValidationResultsTemplate)
  const feedback = buildExperimentalFeedbackRules(input.experimentalFeedbackRules)
  const readiness = buildActivationReadinessSummary(input.activationReadinessSummary)
  const decisionTree = buildMoStrategyDecisionTree(moStrategies.all)
  const topRoute = routeContext.topRoute || {}
  const selectedMoStrategy = moStrategies.postModification || moStrategies.all[0] || null
  return {
    version: ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION,
    centerName: "Organic Acid Experimental Activation Center",
    centerNameZh: "有机酸实验启用中心",
    routeContext: {
      routeId: safeText(topRoute.routeId, "route-al-mof-mo"),
      topRouteName: safeText(topRoute.routeName || `${topRoute.hostMof || "Al-MOF"} + ${topRoute.guestMetal || "Mo"}`, "Al-MOF + Mo"),
      selectedHostFamily: safeText(hosts.primary?.hostFamily || routeContext.selectedHost?.hostFamily, "Al-MOF stable host framework candidate"),
      selectedHost: safeText(hosts.primary?.displayName || routeContext.selectedHost?.displayName, "Al-MOF"),
      selectedGuest: safeText(topRoute.guestMetal || routeContext.selectedGuestMetal?.guestMetal, "Mo"),
      selectedMoStrategy: safeText(selectedMoStrategy?.displayName, "Mo post-synthetic modification"),
      firstRecommendedExperiment: safeText(matrix.topRouteExperiment?.experimentName || topRoute.nextExperiment, "Al-MOF + Mo same-condition validation"),
      readinessLevel: readiness.readinessLevel,
      hgcps: Number.isFinite(Number(topRoute.finalHGCPS)) ? Number(topRoute.finalHGCPS) : PENDING,
    },
    hosts,
    moStrategies,
    moStrategyDecisionTree: decisionTree,
    minimumExperimentalMatrix: matrix,
    sameConditionDataTemplate: template,
    experimentalValidationResultTemplate: validationTemplate,
    feedbackRules: feedback,
    algorithmUpdatePreview: buildAlgorithmUpdatePreview(feedback.rules),
    postExperimentRouteRerankingPreview: buildPostExperimentRouteRerankingPreview(feedback.rules),
    readiness,
    boundaries: [
      "High-priority experimental hypothesis",
      "Not final catalytic proof",
      "Not ready for formal machine learning",
      "No same-condition experimental result has been completed or claimed",
    ],
  }
}

export function buildSpecificAlMofHostsCsv(hosts) {
  return toCsv(asArray(hosts?.all || hosts), [
    { key: "priorityTier", label: "priority tier" },
    { key: "displayName", label: "Al-MOF host candidate" },
    { key: "hostFamily", label: "host family" },
    { key: "metalNodeDescription", label: "metal node" },
    { key: "synthesisAccessibility", label: "synthesis accessibility" },
    { key: "knownOrExpectedWaterStability", label: "water stability proxy" },
    { key: "moIntroductionCompatibility", label: "Mo compatibility" },
    { key: "requiredPreExperimentCheck", label: "required pre-experiment check" },
    { key: "confidenceLevel", label: "confidence" },
    { key: "limitation", label: "limitation" },
  ])
}

export function buildMoIntroductionStrategiesCsv(strategies) {
  return toCsv(asArray(strategies?.all || strategies), [
    { key: "displayName", label: "Mo strategy" },
    { key: "routeType", label: "route type" },
    { key: "moPrecursorOptions", label: "Mo precursor options" },
    { key: "introductionMethod", label: "introduction method" },
    { key: "expectedMoState", label: "expected Mo state" },
    { key: "requiredCharacterization", label: "required characterization" },
    { key: "recommendedControl", label: "control" },
    { key: "successCriterion", label: "success criterion" },
    { key: "failureCriterion", label: "failure criterion" },
    { key: "reasonForPriority", label: "reason for priority" },
  ])
}

export function buildExperimentalMatrixCsv(matrix) {
  return toCsv(asArray(matrix?.all || matrix), [
    { key: "priority", label: "priority" },
    { key: "experimentName", label: "experiment group" },
    { key: "routeId", label: "route" },
    { key: "hostCandidateId", label: "host candidate" },
    { key: "guestMetal", label: "guest metal" },
    { key: "moIntroductionStrategyId", label: "Mo strategy" },
    { key: "controlType", label: "control type" },
    { key: "purpose", label: "purpose" },
    { key: "hypothesisTested", label: "hypothesis tested" },
    { key: "expectedOutcome", label: "expected outcome" },
    { key: "failureMeaning", label: "failure meaning" },
    { key: "mustRun", label: "must run" },
  ])
}

export function buildSameConditionTemplateCsv(template) {
  return toCsv(asArray(template?.fields || template), [
    { key: "category", label: "category" },
    { key: "fieldName", label: "field name" },
    { key: "label", label: "label" },
    { key: "unit", label: "unit" },
    { key: "required", label: "required" },
    { key: "dataType", label: "data type" },
    { key: "allowedValues", label: "allowed values" },
    { key: "whyNeeded", label: "why needed" },
    { key: "affectsAlgorithmFactor", label: "affects algorithm factor" },
  ])
}

export function buildSameConditionTemplateJsonSchema(template) {
  const fields = asArray(template?.fields || template)
  const properties = fields.reduce((acc, field) => {
    acc[field.fieldName] = {
      title: field.label,
      type: field.dataType === "number" ? "number" : field.dataType === "boolean" ? "boolean" : "string",
      unit: field.unit,
      enum: field.allowedValues?.length ? field.allowedValues : undefined,
      description: `${field.whyNeeded} Affects: ${field.affectsAlgorithmFactor}`,
    }
    return acc
  }, {})
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Organic Acid Same-Condition Experimental Data Template",
    schemaVersion: ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION,
    type: "object",
    required: fields.filter(field => field.required).map(field => field.fieldName),
    properties,
    additionalProperties: false,
  }
}

export function buildExperimentalFeedbackRulesJson(feedbackRules) {
  return {
    version: ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION,
    generatedAt: "2026-06-22",
    rules: asArray(feedbackRules?.rules || feedbackRules),
    boundary: "Rules update algorithm factors only after provenance-reviewed same-condition results.",
  }
}

export function buildActivationReadinessJson(readiness) {
  return {
    version: ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION,
    readiness,
    claimBoundary: "planning-ready / not performance-validated",
  }
}

export function buildActivationReportMarkdown(workbench) {
  const wb = asObject(workbench)
  const hosts = asArray(wb.hosts?.all)
  const strategies = asArray(wb.moStrategies?.all)
  const matrix = asArray(wb.minimumExperimentalMatrix?.all)
  const fields = asArray(wb.sameConditionDataTemplate?.fields)
  return [
    "# Organic Acid Experimental Activation Report",
    "",
    `Version: ${ORGANIC_ACID_EXPERIMENTAL_ACTIVATION_VERSION}`,
    `Top route: ${wb.routeContext?.topRouteName || "Al-MOF + Mo"}`,
    `Readiness: ${wb.readiness?.readinessLevel || "planning-ready / not performance-validated"}`,
    "",
    "## Boundary",
    "- High-priority experimental hypothesis",
    "- Not final catalytic proof",
    "- Not ready for formal machine learning",
    "",
    "## Specific Al-MOF Hosts",
    ...hosts.map(row => `- ${row.priorityTier}: ${row.displayName} — ${row.reasonForSelection}`),
    "",
    "## Mo Introduction Strategies",
    ...strategies.map(row => `- ${row.displayName}: ${row.introductionMethod}`),
    "",
    "## Minimum Experimental Matrix",
    ...matrix.map(row => `- ${row.priority}. ${row.experimentName}: ${row.purpose}`),
    "",
    "## Same-Condition Data Template",
    ...fields.map(row => `- ${row.label} (${row.unit || "no unit"}): ${row.whyNeeded}`),
    "",
    "## Feedback Rules",
    ...asArray(wb.feedbackRules?.rules).map(row => `- ${row.ruleId}: ${row.updateAction}`),
    "",
    "## Next Action",
    wb.readiness?.recommendedNextAction || "Execute the minimum experimental matrix before validation claims.",
    "",
  ].join("\n")
}
