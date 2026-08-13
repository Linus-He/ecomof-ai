// @ts-nocheck

export const CATALYSIS_VERIFICATION_LEVELS = [
  { id: "L1-source-identified", zh: "来源已确认", en: "Source identified" },
  { id: "L2-abstract-only", zh: "仅摘要核对", en: "Abstract only" },
  { id: "L3-fulltext-reviewed", zh: "全文已核对", en: "Full text reviewed" },
  { id: "L4-claim-located", zh: "声明精确定位", en: "Claim precisely located" },
]

export function buildCatalysisVerificationView(database, tasksDataset = null) {
  const tables = database?.tables || {}
  const documents = tables.sourceDocuments || []
  const records = tables.reactionRecords || []
  const states = tables.catalystStates || []
  const runs = tables.experimentRuns || []
  const conditions = tables.conditionSets || []
  const claims = tables.metricClaims || []
  const evidence = tables.evidenceItems || []
  const decisions = tables.eligibilityDecisions || []
  const runDecisions = tables.runEligibilityDecisions || []
  const tasks = tasksDataset?.tasks || tables.verificationTasks || []
  const stateById = new Map(states.map(state => [state.id, state]))
  const documentById = new Map(documents.map(document => [document.id, document]))
  const decisionByRecord = new Map(decisions.map(decision => [decision.reactionRecordId, decision]))
  const conditionById = new Map(conditions.map(condition => [condition.id, condition]))
  const runDecisionById = new Map(runDecisions.map(decision => [decision.experimentRunId, decision]))
  const evidenceByClaim = new Map()
  for (const item of evidence) {
    if (!evidenceByClaim.has(item.claimId)) evidenceByClaim.set(item.claimId, [])
    evidenceByClaim.get(item.claimId).push(item)
  }
  const recordRows = records.map(record => {
    const state = stateById.get(record.catalystStateId) || {}
    const document = documentById.get(record.sourceDocumentId) || {}
    const recordClaims = claims.filter(claim => claim.reactionRecordId === record.id)
    const recordTasks = tasks.filter(task => task.reactionRecordId === record.id)
    const recordRuns = runs.filter(run => run.reactionRecordId === record.id).map(run => ({
      ...run,
      condition: conditionById.get(run.conditionSetId) || {},
      claims: recordClaims.filter(claim => claim.experimentRunId === run.id),
      decision: runDecisionById.get(run.id) || {},
      tasks: recordTasks.filter(task => task.experimentRunId === run.id),
    }))
    return {
      ...record,
      catalyst: state.catalystName,
      precursor: state.precursorMofName,
      activeMaterial: state.activeMaterial,
      identityStatus: state.identityLink?.status || "unresolved",
      canonicalId: state.identityLink?.canonicalId || null,
      activeMaterialIdentity: state.activeMaterialIdentity || null,
      exactStructureIdentifier: state.identityLink?.exactStructureIdentifier || null,
      precursorIdentity: state.precursorIdentity || null,
      document,
      experimentRuns: recordRuns,
      claims: recordClaims.map(claim => ({ ...claim, evidence: evidenceByClaim.get(claim.id) || [] })),
      decision: decisionByRecord.get(record.id) || {},
      tasks: recordTasks,
    }
  })
  return { summary: database?.summary || {}, documents, recordRows, tasks, decisions, runDecisions }
}

export function filterCatalysisVerificationTasks(tasks, filters = {}) {
  return (tasks || []).filter(task => {
    if (filters.priority && filters.priority !== "all" && task.priority !== filters.priority) return false
    if (filters.type && filters.type !== "all" && task.type !== filters.type) return false
    if (filters.status && filters.status !== "all" && task.status !== filters.status) return false
    return true
  })
}

export function catalysisTrainingGate(database) {
  const summary = database?.summary || {}
  return {
    eligible: Number(summary.trainingEligibleCount || 0) > 0,
    eligibleCount: Number(summary.trainingEligibleCount || 0),
    reasonZh: Number(summary.trainingEligibleCount || 0) > 0
      ? "已有催化记录同时满足结构身份、实验条件、证据定位和使用许可要求，可按许可范围用于模型训练。"
      : "当前没有记录同时满足结构身份、同条件证据和模型训练许可要求，因此不会用于模型训练。",
    reasonEn: Number(summary.trainingEligibleCount || 0) > 0
      ? "Some catalysis records pass identity, condition, evidence, and license gates."
      : "No catalysis record currently passes identity, aligned-condition evidence, and training-license gates; literature records are excluded from model training.",
  }
}
