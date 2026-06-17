// @ts-nocheck

export const ORGANIC_ACID_TASK_DEFINITION = {
  taskId: "organic_acid_formic_priority",
  targetProduct: "甲酸 / formic acid",
  primaryTarget: "CO2 conversion to formic acid priority",
  primaryTargetZh: "CO2 转化为甲酸 / formic acid priority",
  taskType: "organic_acid_formic_priority",
  preferredPathways: [
    "CO2 activation toward formate intermediate",
    "H-transfer / hydride-transfer compatible route",
    "aqueous organic-acid pathway with post-reaction scaffold retention",
  ],
  preferredPathwaysZh: [
    "CO2 活化并形成 formate 中间体",
    "兼容 H-transfer / hydride-transfer 的路径",
    "水相有机酸路径且反应后骨架保留",
  ],
  secondaryGoals: [
    "Suppress competing pathways",
    "Increase pathway evidence confidence",
    "Prioritize testable candidates",
    "Reduce structural collapse risk",
    "Preserve field-level provenance",
  ],
  secondaryGoalsZh: [
    "抑制竞争路径",
    "提高路径证据可信度",
    "优先选择可验证候选",
    "降低结构坍塌风险",
    "保留字段级溯源",
  ],
  excludedRisks: [
    "high collapseRisk",
    "high competingPathwayRisk",
    "syntheticFixtureFlag true",
    "missingCriticalFields present",
    "unverified mechanism support",
  ],
  requiredInputs: [
    "metalNode",
    "topology",
    "poreSizeA",
    "stabilityProxy",
    "collapseRisk",
    "formicAcidPathwayFit",
    "competingPathwayRisk",
    "evidenceLevel",
    "fieldProvenanceCoverage",
    "labTestability",
    "conditionCompatibility",
  ],
  optionalInputs: [
    "linker",
    "poreVolume",
    "surfaceArea",
    "pathwayCentrality",
    "nodeBetweenness",
    "edgeConfidence",
    "reactionStepCoverage",
    "graphConnectivity",
    "materialAvailability",
    "characterizationNeed",
  ],
  scoringDimensions: [
    "pathwayFitScore",
    "evidenceScore",
    "graphRelevanceScore",
    "structureSuitabilityScore",
    "validationReadinessScore",
    "dataQualityScore",
  ],
  validationConstraints: [
    "Priority validation candidates must not have high collapse risk.",
    "Priority validation candidates must not be synthetic fixtures.",
    "Evidence level very low cannot rank first without sanity warnings.",
    "Every scoring field must expose fieldSource or missingReason.",
    "Outputs are algorithmic suggestions and require experimental validation.",
  ],
}

export function getOrganicAcidTaskDefinition() {
  return { ...ORGANIC_ACID_TASK_DEFINITION }
}
