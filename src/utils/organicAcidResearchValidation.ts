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

export function evidenceTierFor(value) {
  const text = String(value || "").toLowerCase()
  if (text.includes("experimental") || text.includes("independent")) return "experimental"
  if (text.includes("expert")) return "expert_review"
  if (text.includes("literature")) return "literature"
  if (text.includes("derived")) return "derived"
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
  const evidenceType = String(row.evidenceType || row.sourceType || row.labelSource || row.datasetOrigin || "").toLowerCase()
  if (evidenceType.includes("literature")) return "Literature"
  if (evidenceType.includes("experimental") || evidenceType.includes("independent")) return "Experimental"
  if (evidenceType.includes("expert")) return "Expert Review"
  if (evidenceType.includes("derived")) return "Derived"
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
    return algorithmRows.map(row => ({
      id: row.candidateId || row.id || row.candidateName,
      name: row.candidateName || row.displayName || row.candidateId,
      rank: row.rank,
      evidenceStrength: clamp01(row.evidenceScore ?? row.finalScore),
      dataQuality: clamp01(row.dataQualityScore ?? row.sourceCandidate?.dataQualityScore ?? 0.72),
      experimentalCoverage: clamp01(row.validationReadinessScore ?? 0.55),
      confidence: clamp01(row.finalScore ?? row.pathwayFitScore ?? 0.5),
      recommendationClass: row.recommendationClass,
      nextExperiment: row.nextExperiment,
      source: row,
    }))
  }
  return asArray(result?.rankedFrameworks).slice(0, 10).map(row => ({
    id: row.id || row.displayName,
    name: row.displayName || row.id,
    rank: row.rank,
    evidenceStrength: clamp01(row.organicAcidScore?.oacs),
    dataQuality: row.hydrothermalGate?.status === "pass" ? 0.82 : row.hydrothermalGate?.status === "needs_review" ? 0.55 : 0.35,
    experimentalCoverage: 0.35,
    confidence: clamp01(row.organicAcidScore?.oacs),
    recommendationClass: row.hydrothermalGate?.status || "pending",
    nextExperiment: row.recommendation?.nextExperiment?.[0] || "same-condition validation",
    source: row,
  }))
}

export function buildPathwayConfidenceMatrix({ result } = {}) {
  return candidateRowsFrom(result).map(row => ({
    ...row,
    x: row.evidenceStrength,
    y: row.dataQuality,
    source: sourceForMetric({
      value: `${row.name}: ${row.evidenceStrength}/${row.dataQuality}`,
      sourceDatabase: "Organic Acid Final Screening algorithm output",
      sourceRecordId: row.id,
      sourceUrl: "public/data/organic_acid_final_screening/al_mof_framework_candidates.json",
      doi: row.source?.sourceDoi,
      evidenceTier: evidenceTierFor(row.source?.evidenceLevel || row.recommendationClass),
      notes: "X = evidence strength; Y = data quality.",
    }),
  }))
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
      return {
        ...row,
        experiments,
        experimentalCoverage,
        priorityScore,
        source: sourceForMetric({
          value: priorityScore,
          sourceDatabase: "Organic Acid validation priority queue",
          sourceRecordId: `priority.${row.id}`,
          sourceUrl: "public/data/experimental_labels/experimental_labels_v2.json",
          doi: row.source?.sourceDoi,
          evidenceTier: evidenceTierFor(row.recommendationClass),
          notes: "Priority Score = Evidence Strength 35% + Data Quality 25% + Experimental Coverage 20% + Confidence 20%.",
        }),
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
    ...candidates.map(row => ({ id: `candidate:${row.id}`, label: row.name, type: "Candidate", sourceId: row.id })),
    ...evidenceRows.map(row => ({ id: `evidence:${row.id}`, label: row.targetDescriptor || row.claim || row.id, type: "Evidence", sourceId: row.id })),
    ...labelRows.map(row => ({ id: `experiment:${row.experimentId || row.labelId}`, label: row.experimentId || row.labelId, type: "Experiment", sourceId: row.labelId })),
    { id: "reaction:co2-formate", label: "CO2 -> formate", type: "Reaction", sourceId: "organic-acid-task" },
  ]
  const edges = []
  candidates.forEach((candidate, index) => {
    const evidence = evidenceRows[index % Math.max(1, evidenceRows.length)]
    const experiment = labelRows[index % Math.max(1, labelRows.length)]
    if (evidence) edges.push({ id: `supports:${candidate.id}:${evidence.id}`, from: `evidence:${evidence.id}`, to: `candidate:${candidate.id}`, type: candidate.evidenceStrength > 0.55 ? "supports" : "pending" })
    edges.push({ id: `path:${candidate.id}`, from: `candidate:${candidate.id}`, to: "reaction:co2-formate", type: candidate.confidence > 0.45 ? "supports" : "pending" })
    if (experiment) edges.push({ id: `pending:${candidate.id}:${experiment.labelId}`, from: `experiment:${experiment.experimentId || experiment.labelId}`, to: `candidate:${candidate.id}`, type: "pending" })
    if (candidate.dataQuality < 0.45) edges.push({ id: `contradicts:${candidate.id}`, from: "reaction:co2-formate", to: `candidate:${candidate.id}`, type: "contradicts" })
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
