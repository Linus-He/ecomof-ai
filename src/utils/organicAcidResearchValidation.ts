// @ts-nocheck

function asArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.records)) return value.records
  if (Array.isArray(value?.labels)) return value.labels
  return []
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function number(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function clamp01(value) {
  return Math.max(0, Math.min(1, number(value, 0)))
}

function compactText(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim()
    if (text) return text
  }
  return ""
}

function uniqueCount(rows, selector) {
  return new Set(rows.map(selector).map(value => String(value || "").trim()).filter(Boolean)).size
}

export const ORGANIC_ACID_VALIDATION_EVIDENCE_TYPES = Object.freeze([
  "experimental",
  "literature",
  "simulation",
  "expert prior",
  "inferred",
])

export const ORGANIC_ACID_CONFIDENCE_LEVELS = Object.freeze(["high", "medium", "low"])

function labelRecordsFrom(input) {
  return asArray(input)
}

function normalizedEvidenceType(value, row = {}) {
  const text = String(value || row.evidenceType || row.sourceType || row.labelSource || row.datasetOrigin || row.dataStatus?.level || row.sourceDatabase || "").toLowerCase()
  if (text.includes("experimental") || text.includes("independent")) return "experimental"
  if (text.includes("literature")) return "literature"
  if (text.includes("simulation") || text.includes("dft") || text.includes("qmof")) return "simulation"
  if (text.includes("expert")) return "expert prior"
  if (text.includes("derived") || text.includes("proxy") || text.includes("demo") || text.includes("synthetic") || text.includes("pending")) return "inferred"
  return "inferred"
}

function evidenceTypeTitle(value) {
  const type = normalizedEvidenceType(value)
  if (type === "expert prior") return "Expert Prior"
  return `${type[0].toUpperCase()}${type.slice(1)}`
}

export function evidenceTierFor(value) {
  const text = String(value || "").toLowerCase()
  if (text.includes("experimental") || text.includes("independent")) return "experimental"
  if (text.includes("simulation") || text.includes("dft") || text.includes("qmof")) return "simulation"
  if (text.includes("expert")) return "expert_review"
  if (text.includes("literature")) return "literature"
  if (text.includes("derived")) return "derived"
  if (text.includes("proxy") || text.includes("demo") || text.includes("synthetic")) return "inferred"
  if (text.includes("pending")) return "pending"
  return "curated"
}

export function sourceForMetric({ value, sourceDatabase, sourceRecordId, sourceUrl, doi, evidenceTier, notes }) {
  return {
    value,
    sourceDatabase,
    sourceRecordId,
    sourceUrl,
    doi: doi || "",
    sourceDoi: doi || "",
    evidenceTier,
    curationStatus: evidenceTier === "pending" ? "pending_review" : "confirmed",
    confidence: evidenceTier === "pending" ? 0.5 : 1,
    note: notes || "",
  }
}

function labelRowsFrom(input) {
  return asArray(input)
}

function confidenceLevelFor(score) {
  const value = clamp01(score)
  if (value >= 0.72) return "high"
  if (value >= 0.5) return "medium"
  return "low"
}

function confidenceReason(row) {
  const reasons = []
  if (row.evidenceStrength < 0.5) reasons.push("insufficient evidence strength")
  if (row.dataQuality < 0.55) reasons.push("insufficient data quality")
  if (row.experimentalCoverage < 0.45) reasons.push("missing same-condition experiment")
  if (row.evidenceType === "literature") reasons.push("literature-only inference")
  if (row.evidenceType === "inferred") reasons.push("inferred proxy requires source verification")
  if (row.reactionLayer?.fallbackScope === "global-reaction-prior") reasons.push("non-comparable conditions")
  return reasons.length ? reasons : ["score supported by current evidence and data-quality fields"]
}

function candidateDisplayName(row = {}) {
  return compactText(row.candidateName, row.displayName, row.rawName, row.id, row.candidateId, row.sourceRecordId, "Organic Acid candidate")
}

function candidateId(row = {}) {
  return compactText(row.candidateId, row.id, row.sourceRecordId, candidateDisplayName(row))
}

function evidenceIdsFor(source = {}, scoredRow = {}) {
  return Array.from(new Set([
    ...asArray(source.evidenceIds),
    ...asArray(source.organicAcidScore?.evidenceIds),
    ...asArray(source.waterStability?.evidenceIds),
    ...asArray(scoredRow.evidenceIds),
    ...asArray(scoredRow.scoreBreakdown?.evidenceIds),
  ].filter(Boolean)))
}

function sourceTraceForCandidate(row = {}, source = {}, scoreSource = null) {
  const evidenceIds = evidenceIdsFor(source, row)
  const traces = [
    {
      label: "candidate record",
      sourceDatabase: source.sourceDatabase || row.sourceDatabase || "Organic Acid Final Screening algorithm output",
      sourceRecordId: source.sourceRecordId || row.candidateId || row.id,
      sourceUrl: "public/data/organic_acid_final_screening/al_mof_framework_candidates.json",
      sourceDoi: source.waterStability?.source_doi || source.sourceDoi || "",
      evidenceTier: evidenceTierFor(source.dataStatus?.level || source.organicAcidScore?.evidenceLevel || row.recommendationClass),
    },
    {
      label: "score trace",
      sourceDatabase: "Organic Acid algorithm trace",
      sourceRecordId: row.scoreBreakdown?.equation || "organic_acid_score_equation",
      sourceUrl: "src/utils/organicAcid/scoreOrganicAcidCandidate.js",
      sourceDoi: "",
      evidenceTier: "algorithm_trace",
    },
  ]
  if (evidenceIds.length) {
    traces.push({
      label: "evidence ids",
      sourceDatabase: "Organic Acid evidence records",
      sourceRecordId: evidenceIds.slice(0, 5).join(", "),
      sourceUrl: "public/data/organic_acid_final_screening/organic_acid_evidence_records.json",
      sourceDoi: "",
      evidenceTier: "field_level_evidence",
    })
  }
  if (scoreSource) traces.push(scoreSource)
  return traces
}

function buildCandidateTaskRow(row = {}, rankFallback = null) {
  const candidateSource = asObject(row.sourceCandidate)
  const source = Object.keys(candidateSource).length ? candidateSource : row
  const id = candidateId(row) || candidateId(source)
  const name = candidateDisplayName(row) || candidateDisplayName(source)
  const evidenceStrength = clamp01(row.evidenceScore ?? row.finalScore ?? source.organicAcidScore?.oacs)
  const dataQuality = clamp01(row.dataQualityScore ?? source.dataQualityScore ?? source.descriptorScores?.evidenceConfidence ?? (source.hydrothermalGate?.status === "pass" ? 0.82 : source.hydrothermalGate?.status === "needs_review" ? 0.55 : 0.35))
  const experimentalCoverage = clamp01(row.validationReadinessScore ?? row.reactionLayer?.reactionQualityWeight ?? 0.35)
  const confidence = clamp01(row.finalScore ?? row.pathwayFitScore ?? source.organicAcidScore?.oacs ?? 0.5)
  const evidenceType = normalizedEvidenceType(row.evidenceType || source.evidenceType || source.dataStatus?.level || source.sourceDatabase, source)
  const confidenceComposite = (evidenceStrength * 0.35) + (dataQuality * 0.25) + (experimentalCoverage * 0.2) + (confidence * 0.2)
  const confidenceLevel = confidenceLevelFor(confidenceComposite)
  const missingInputs = asArray(row.missingInputs).map(item => item.field || item.missingReason || item).filter(Boolean)
  const missingData = missingInputs.length ? missingInputs : asArray(source.missingDescriptors).concat(asArray(source.dataStatus?.missingFields)).filter(Boolean)
  const keyRisks = [
    ...asArray(row.mainRisks),
    ...asArray(source.risk),
    ...asArray(source.risks),
  ].filter(Boolean)
  const pathway = compactText(
    row.pathway,
    source.pathway,
    source.relatedPathways?.[0],
    source.organicAcidRelevance?.possibleRoles?.[0]?.pathway,
    "CO2 / HCO3 to formic acid pathway",
  )
  const targetProduct = compactText(row.targetProduct, source.targetProduct, "formic acid / formate")
  const nextExperiment = compactText(row.nextExperiment, source.recommendation?.nextExperiment?.[0], source.recommendedAction, "same-condition CO2-to-formate validation with PXRD, ICP-OES, and product quantification")
  const scoreExplanation = compactText(
    row.scoreBreakdown?.equation,
    "Priority Score = Evidence Strength 35% + Data Quality 25% + Experimental Coverage 20% + Confidence 20%.",
  )
  const base = {
    id,
    candidate: name,
    name,
    mof: name,
    rank: row.rank || source.rank || rankFallback,
    pathway,
    targetProduct,
    evidenceStrength,
    dataQuality,
    experimentalCoverage,
    confidence,
    confidenceScore: confidenceComposite,
    confidenceLevel,
    evidenceType,
    evidenceTypeLabel: evidenceTypeTitle(evidenceType),
    recommendationClass: row.recommendationClass || source.hydrothermalGate?.status || "pending",
    keyRisks: keyRisks.length ? keyRisks : ["experimental validation pending"],
    missingData: missingData.length ? missingData : ["same-condition experiment", "post-reaction characterization"],
    suggestedNextExperiment: nextExperiment,
    nextExperiment,
    whyNow: compactText(
      asArray(row.mainReasons)[0],
      source.dataStatus?.description,
      `${name} is prioritized because current evidence strength, data quality, experimental coverage, and confidence are jointly inspectable.`,
    ),
    scoreExplanation,
    sourceTrace: [],
    source,
    reactionLayer: row.reactionLayer,
  }
  return {
    ...base,
    confidenceReason: confidenceReason(base).join("; "),
    lowConfidenceReasons: confidenceReason(base),
  }
}

export function diversityGrade(score) {
  if (score >= 85) return "Excellent"
  if (score >= 70) return "Good"
  if (score >= 50) return "Moderate"
  return "Weak"
}

export function buildLabelDiversityAudit({ labels, benchmarkDataset, evidenceRecords } = {}) {
  const labelRows = labelRowsFrom(labels)
  const benchmarkRows = asArray(benchmarkDataset)
  const evidenceRows = asArray(evidenceRecords)
  const rows = labelRows.length ? labelRows : benchmarkRows
  const total = Math.max(1, rows.length)
  const uniqueDoi = uniqueCount([...rows, ...evidenceRows], row => row.sourceDoi || row.doi || row.source?.doi)
  const uniquePapers = uniqueCount([...rows, ...evidenceRows], row => row.sourceCitation || row.sourceTitle || row.citation || row.claim)
  const uniqueCatalysts = uniqueCount(rows, row => row.catalystId || row.candidateId || row.targetFramework)
  const uniqueExperiments = uniqueCount(rows, row => row.experimentId || row.recordId || row.labelId)
  const doiComponent = Math.min(25, (uniqueDoi / Math.max(1, Math.ceil(total * 0.3))) * 25)
  const paperComponent = Math.min(20, (uniquePapers / 10) * 20)
  const catalystComponent = Math.min(25, (uniqueCatalysts / 50) * 25)
  const experimentComponent = Math.min(30, (uniqueExperiments / 80) * 30)
  const score = Math.round(doiComponent + paperComponent + catalystComponent + experimentComponent)
  const sourceUrl = labelRows.length
    ? "public/data/experimental_labels/experimental_labels_v2.json"
    : "public/data/benchmark_dataset_v3_6.json"
  return {
    totalRecords: rows.length,
    uniqueDoi,
    uniquePapers,
    uniqueCatalysts,
    uniqueExperiments,
    score,
    grade: diversityGrade(score),
    metrics: [
      ["uniqueDoi", "Unique DOI", uniqueDoi, "DOI coverage stays explicit; empty DOI fields are not fabricated."],
      ["uniquePapers", "Unique Papers", uniquePapers, "Paper/citation diversity from source citation or evidence claims."],
      ["uniqueCatalysts", "Unique Catalysts", uniqueCatalysts, "Distinct candidate or catalyst identifiers."],
      ["uniqueExperiments", "Unique Experiments", uniqueExperiments, "Distinct experiment, benchmark, or label records."],
      ["score", "Label Diversity Score", score, `Grade ${diversityGrade(score)}.`],
    ].map(([id, label, value, notes]) => ({
      id,
      label,
      value,
      source: sourceForMetric({
        value,
        sourceDatabase: labelRows.length ? "Experimental Label V2" : "Benchmark Dataset V3.6",
        sourceRecordId: id === "score" ? "computed.labelDiversityScore" : id,
        sourceUrl,
        evidenceTier: "field_level_summary",
        notes,
      }),
    })),
  }
}

function coverageBucket(row) {
  const evidenceType = normalizedEvidenceType(row.evidenceType || row.sourceType || row.labelSource || row.datasetOrigin, row)
  if (evidenceType === "literature") return "Literature"
  if (evidenceType === "experimental") return "Experimental"
  if (evidenceType === "expert prior") return "Expert Review"
  return "Derived"
}

export function buildEvidenceCoverageDashboard({ evidenceRecords, labels, benchmarkDataset } = {}) {
  const evidenceRows = asArray(evidenceRecords).map(row => ({ ...row, coverageType: coverageBucket(row), evidenceTier: evidenceTierFor(row.evidenceType || row.status) }))
  const labelRows = labelRowsFrom(labels).map(row => ({ ...row, id: row.labelId, claim: row.sourceCitation, coverageType: coverageBucket(row), evidenceTier: evidenceTierFor(row.sourceType) }))
  const benchmarkRows = asArray(benchmarkDataset).map(row => ({ ...row, id: row.recordId, claim: row.taskType, coverageType: coverageBucket(row), evidenceTier: evidenceTierFor(row.datasetOrigin) }))
  const rows = [...evidenceRows, ...labelRows, ...benchmarkRows]
  const total = Math.max(1, rows.length)
  const buckets = ["Literature", "Experimental", "Expert Review", "Derived"].map(type => {
    const records = rows.filter(row => row.coverageType === type)
    return {
      type,
      count: records.length,
      percent: records.length / total,
      records,
      source: sourceForMetric({
        value: records.length,
        sourceDatabase: "Organic Acid evidence + V3.6 labels/benchmark",
        sourceRecordId: `coverage.${type}`,
        sourceUrl: "public/data/organic_acid_final_screening/organic_acid_evidence_records.json",
        evidenceTier: evidenceTierFor(type),
        notes: "Coverage bucket computed from evidenceType, sourceType, labelSource, or datasetOrigin.",
      }),
    }
  })
  return { total: rows.length, buckets, rows }
}

function candidateRowsFrom(result = {}) {
  const algorithmRows = asArray(result?.organicAcidAlgorithm?.rankedCandidates)
  if (algorithmRows.length) {
    return algorithmRows.map((row, index) => buildCandidateTaskRow(row, index + 1))
  }
  return asArray(result?.rankedFrameworks).slice(0, 10).map((row, index) => buildCandidateTaskRow({
    ...row,
    candidateId: row.id || row.displayName,
    candidateName: row.displayName || row.id,
    rank: row.rank || index + 1,
    evidenceScore: row.organicAcidScore?.oacs,
    dataQualityScore: row.hydrothermalGate?.status === "pass" ? 0.82 : row.hydrothermalGate?.status === "needs_review" ? 0.55 : 0.35,
    validationReadinessScore: 0.35,
    finalScore: row.organicAcidScore?.oacs,
    recommendationClass: row.hydrothermalGate?.status || "pending",
    sourceCandidate: row,
  }, index + 1))
}

export function buildPathwayConfidenceMatrix({ result } = {}) {
  return candidateRowsFrom(result).map(row => {
    const source = sourceForMetric({
      value: `${row.name}: ${row.evidenceStrength}/${row.dataQuality}`,
      sourceDatabase: "Organic Acid Final Screening algorithm output",
      sourceRecordId: row.id,
      sourceUrl: "public/data/organic_acid_final_screening/al_mof_framework_candidates.json",
      doi: row.source?.sourceDoi || row.source?.waterStability?.source_doi,
      evidenceTier: evidenceTierFor(row.evidenceType || row.recommendationClass),
      notes: "X = evidence strength; Y = data quality. Filters retain target product, evidence type, and confidence level.",
    })
    return {
      ...row,
      x: row.evidenceStrength,
      y: row.dataQuality,
      evidenceDetails: [
        `Target product: ${row.targetProduct}`,
        `Evidence type: ${row.evidenceType}`,
        `Confidence: ${row.confidenceLevel}`,
        `Reason: ${row.confidenceReason}`,
      ],
      source,
      sourceTrace: sourceTraceForCandidate(row, row.source, source),
    }
  })
}

export function buildValidationPriorityQueue({ result, labels } = {}) {
  const labelRows = labelRowsFrom(labels)
  const experimentByCandidate = labelRows.reduce((acc, row) => {
    const key = row.candidateId || row.catalystId
    if (!key) return acc
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  return candidateRowsFrom(result)
    .map(row => {
      const experiments = experimentByCandidate[row.id] || 0
      const experimentalCoverage = Math.max(row.experimentalCoverage, Math.min(1, experiments / 3))
      const priorityScore = Math.round(100 * (
        row.evidenceStrength * 0.35
        + row.dataQuality * 0.25
        + experimentalCoverage * 0.2
        + row.confidence * 0.2
      ))
      const confidenceScore = (row.evidenceStrength * 0.35) + (row.dataQuality * 0.25) + (experimentalCoverage * 0.2) + (row.confidence * 0.2)
      const confidenceLevel = confidenceLevelFor(confidenceScore)
      const scoreSource = sourceForMetric({
        value: priorityScore,
        sourceDatabase: "Organic Acid validation priority queue",
        sourceRecordId: `priority.${row.id}`,
        sourceUrl: "public/data/experimental_labels/experimental_labels_v2.json",
        doi: row.source?.sourceDoi || row.source?.waterStability?.source_doi,
        evidenceTier: evidenceTierFor(row.evidenceType || row.recommendationClass),
        notes: "Priority Score = Evidence Strength 35% + Data Quality 25% + Experimental Coverage 20% + Confidence 20%.",
      })
      return {
        ...row,
        experiments,
        evidenceCoverage: {
          score: experimentalCoverage,
          experiments,
          evidenceStrength: row.evidenceStrength,
          evidenceType: row.evidenceType,
        },
        experimentalCoverage,
        priorityScore,
        confidenceScore,
        confidenceLevel,
        confidenceSource: sourceForMetric({
          value: confidenceLevel,
          sourceDatabase: "Organic Acid validation confidence model",
          sourceRecordId: `confidence.${row.id}`,
          sourceUrl: "src/utils/organicAcidResearchValidation.ts",
          doi: row.source?.sourceDoi || row.source?.waterStability?.source_doi,
          evidenceTier: evidenceTierFor(row.evidenceType || row.recommendationClass),
          notes: "Confidence level is derived from evidence strength, data quality, experimental coverage, and confidence.",
        }),
        scoreExplanation: "Priority Score = Evidence Strength 35% + Data Quality 25% + Experimental Coverage 20% + Confidence 20%.",
        confidenceReason: confidenceReason({ ...row, experimentalCoverage, confidenceLevel }).join("; "),
        lowConfidenceReasons: confidenceReason({ ...row, experimentalCoverage, confidenceLevel }),
        source: scoreSource,
        sourceTrace: sourceTraceForCandidate(row, row.source, scoreSource),
      }
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 10)
}

export function buildValidationKnowledgeGraph({ result, evidenceRecords, labels } = {}) {
  const candidates = candidateRowsFrom(result).slice(0, 6)
  const evidenceRows = asArray(evidenceRecords).slice(0, 8)
  const labelRows = labelRowsFrom(labels).slice(0, 6)
  const nodes = [
    ...candidates.map(row => ({
      id: `candidate:${row.id}`,
      label: row.name,
      type: "Candidate",
      candidateId: row.id,
      sourceId: row.id,
      confidence: row.confidenceLevel,
      explanation: row.whyNow,
      relatedCandidates: [row.name],
      source: row.sourceTrace?.[0] || row.source,
    })),
    ...evidenceRows.map(row => ({
      id: `evidence:${row.id}`,
      label: row.targetDescriptor || row.claim || row.id,
      type: "Evidence",
      sourceId: row.id,
      confidence: row.confidence || "medium",
      explanation: row.claim || row.notes || "Evidence record linked to organic-acid validation.",
      relatedCandidates: candidates.map(candidate => candidate.name).slice(0, 2),
      source: sourceForMetric({
        value: row.claim || row.targetDescriptor || row.id,
        sourceDatabase: "Organic Acid evidence records",
        sourceRecordId: row.id,
        sourceUrl: "public/data/organic_acid_final_screening/organic_acid_evidence_records.json",
        doi: row.sourceDoi,
        evidenceTier: evidenceTierFor(row.evidenceType || row.status),
        notes: row.notes || "",
      }),
    })),
    ...labelRows.map(row => ({
      id: `experiment:${row.experimentId || row.labelId}`,
      label: row.experimentId || row.labelId,
      type: "Experiment",
      sourceId: row.labelId,
      candidateId: row.candidateId || row.catalystId,
      confidence: row.validationLevel || row.sourceType || "experimental",
      explanation: row.sourceCitation || "Experimental label record linked to validation queue.",
      relatedCandidates: [row.candidateId || row.catalystId].filter(Boolean),
      source: sourceForMetric({
        value: row.groundTruthClass || row.groundTruthValue || row.labelType,
        sourceDatabase: "Experimental labels V2",
        sourceRecordId: row.labelId,
        sourceUrl: "public/data/experimental_labels/experimental_labels_v2.json",
        doi: row.sourceDoi,
        evidenceTier: evidenceTierFor(row.sourceType),
        notes: row.sourceCitation || "",
      }),
    })),
    {
      id: "reaction:co2-formate",
      label: "CO2 / HCO3 -> formate",
      type: "Reaction",
      sourceId: "organic-acid-task",
      confidence: "hypothesis layer",
      explanation: "Target reaction node used to connect candidates, evidence records, and experiments.",
      relatedCandidates: candidates.map(row => row.name),
      source: sourceForMetric({
        value: "CO2 / HCO3 -> formate",
        sourceDatabase: "Organic Acid task definition",
        sourceRecordId: "targetProduct",
        sourceUrl: "src/utils/organicAcid/organicAcidTaskDefinition.js",
        evidenceTier: "hypothesis",
        notes: "Reaction node is a target-conditioned validation context.",
      }),
    },
  ]
  const edges = []
  candidates.forEach((candidate, index) => {
    const evidence = evidenceRows[index % Math.max(1, evidenceRows.length)]
    const experiment = labelRows[index % Math.max(1, labelRows.length)]
    if (evidence) {
      const relationType = candidate.evidenceStrength > 0.55 ? "supports" : "pending"
      edges.push({
        id: `supports:${candidate.id}:${evidence.id}`,
        from: `evidence:${evidence.id}`,
        to: `candidate:${candidate.id}`,
        type: relationType,
        relationType,
        candidateId: candidate.id,
        evidenceTier: evidenceTierFor(evidence.evidenceType || evidence.status),
        explanation: evidence.claim || "Evidence record linked to candidate.",
        source: sourceForMetric({
          value: evidence.claim || evidence.id,
          sourceDatabase: "Organic Acid evidence records",
          sourceRecordId: evidence.id,
          sourceUrl: "public/data/organic_acid_final_screening/organic_acid_evidence_records.json",
          doi: evidence.sourceDoi,
          evidenceTier: evidenceTierFor(evidence.evidenceType || evidence.status),
          notes: evidence.notes || "",
        }),
      })
    }
    edges.push({
      id: `path:${candidate.id}`,
      from: `candidate:${candidate.id}`,
      to: "reaction:co2-formate",
      type: candidate.confidence > 0.45 ? "supports" : "pending",
      relationType: candidate.confidence > 0.45 ? "supports" : "pending",
      candidateId: candidate.id,
      evidenceTier: evidenceTierFor(candidate.evidenceType || candidate.recommendationClass),
      explanation: candidate.whyNow,
      source: candidate.source,
    })
    if (experiment) {
      edges.push({
        id: `pending:${candidate.id}:${experiment.labelId}`,
        from: `experiment:${experiment.experimentId || experiment.labelId}`,
        to: `candidate:${candidate.id}`,
        type: "pending",
        relationType: "pending",
        candidateId: candidate.id,
        evidenceTier: evidenceTierFor(experiment.sourceType),
        explanation: experiment.sourceCitation || "Experiment record is linked as pending validation context.",
        source: sourceForMetric({
          value: experiment.groundTruthClass || experiment.groundTruthValue || experiment.labelType,
          sourceDatabase: "Experimental labels V2",
          sourceRecordId: experiment.labelId,
          sourceUrl: "public/data/experimental_labels/experimental_labels_v2.json",
          doi: experiment.sourceDoi,
          evidenceTier: evidenceTierFor(experiment.sourceType),
          notes: experiment.sourceCitation || "",
        }),
      })
    }
    if (candidate.dataQuality < 0.45) {
      edges.push({
        id: `contradicts:${candidate.id}`,
        from: "reaction:co2-formate",
        to: `candidate:${candidate.id}`,
        type: "contradicts",
        relationType: "contradicts",
        candidateId: candidate.id,
        evidenceTier: "data_quality_risk",
        explanation: candidate.lowConfidenceReasons.join("; "),
        source: candidate.confidenceSource || candidate.source,
      })
    }
  })
  return {
    nodes,
    edges,
    source: sourceForMetric({
      value: `${nodes.length} nodes / ${edges.length} edges`,
      sourceDatabase: "Organic Acid validation graph builder",
      sourceRecordId: "validationKnowledgeGraph",
      sourceUrl: "public/data/organic_acid_final_screening/organic_acid_evidence_records.json",
      evidenceTier: "graph_summary",
      notes: "Nodes = Candidate / Evidence / Reaction / Experiment; edges = supports / contradicts / pending.",
    }),
  }
}

export function buildResearchValidationSummary(input = {}) {
  return {
    labelDiversity: buildLabelDiversityAudit(input),
    evidenceCoverage: buildEvidenceCoverageDashboard(input),
    confidenceMatrix: buildPathwayConfidenceMatrix(input),
    validationQueue: buildValidationPriorityQueue(input),
    knowledgeGraph: buildValidationKnowledgeGraph(input),
  }
}
