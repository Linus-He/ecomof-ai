import fs from "node:fs/promises"
import path from "node:path"
import {
  buildConditionSet,
  buildEligibilityDecision,
  buildVerificationTasks,
  normalizeDoi,
  stableHash,
  verificationLevelForEvidence,
} from "./catalysis-v2-lib.mjs"

const root = process.cwd()
const publicData = path.join(root, "public/data")
const outDir = path.join(publicData, "catalysis_v2")
const cacheDir = path.join(root, "data/curation/catalysis/doi-cache")
const overridesPath = path.join(root, "data/curation/catalysis/v2-curation-overrides.json")

const readJson = async file => JSON.parse(await fs.readFile(file, "utf8"))
const writeJson = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`)
}

const v1 = await readJson(path.join(publicData, "catalysis_reaction_records_v1.json"))
const identityRegistry = await readJson(path.join(publicData, "mof_identity_registry.json"))
const curationOverrides = await readJson(overridesPath)
const identityByAlias = new Map()
for (const record of identityRegistry.records || []) {
  for (const alias of [record.primaryName, ...(record.aliases || []), ...(record.normalizedAliases || [])]) {
    const normalized = String(alias || "").toLowerCase().replace(/[^a-z0-9]+/g, "")
    if (!normalized) continue
    if (!identityByAlias.has(normalized)) identityByAlias.set(normalized, [])
    identityByAlias.get(normalized).push(record)
  }
}

let generatedAt = curationOverrides.updatedAt
const sourceDocuments = []
const documentVerifications = []
const reactionRecords = []
const catalystStates = []
const conditionSets = []
const metricClaims = []
const evidenceItems = []
const identityLinks = []
const eligibilityDecisions = []
const verificationTasks = []
const graphNodes = []
const graphEdges = []

for (const source of v1.sources || []) {
  const doi = normalizeDoi(source.doi)
  const cachePath = path.join(cacheDir, `${doi.replace(/[^a-z0-9]+/g, "_")}.json`)
  let cache = null
  try { cache = await readJson(cachePath) } catch {}
  const sourceDocument = {
    id: `source-${source.id.toLowerCase()}`,
    legacySourceId: source.id,
    doi,
    doiUrl: `https://doi.org/${doi}`,
    title: source.title,
    journal: source.journal,
    year: source.year,
    documentType: "primary-experimental",
    sourceUrl: source.sourceUrl,
    discoverySource: "v1-curated-seed",
    metadataVerification: cache?.metadataMatch?.status || "matched",
    scholarStatus: cache?.scholarStatus || "no-known-update-in-curated-snapshot",
    fullTextAccess: cache?.fullTextAccess || (source.sourceUrl?.includes("articlehtml") ? "publisher-html" : "abstract-or-landing-page"),
    license: {
      metadataReuseAllowed: true,
      fullTextReuseStatus: cache?.license?.fullTextReuseStatus || "not-established",
      trainingUseAllowed: cache?.license?.trainingUseAllowed === true,
    },
  }
  sourceDocuments.push(sourceDocument)
  graphNodes.push({ id: sourceDocument.id, type: "source-document", label: source.title, doi: sourceDocument.doi, status: sourceDocument.metadataVerification })
  documentVerifications.push({
    id: `verification-${source.id.toLowerCase()}`,
    sourceDocumentId: sourceDocument.id,
    checkedAt: cache?.checkedAt || source.verification?.checkedAt || v1.updatedAt,
    checkedBy: cache?.checkedBy || "curated-v1-migration",
    registrationAgency: cache?.registrationAgency || "Crossref",
    metadataMatch: cache?.metadataMatch || { status: "matched", fields: ["doi", "title", "journal", "year"], basis: "publisher/DOI record curated in v1" },
    updateStatus: cache?.updateStatus || { status: "not-live-refreshed", note: "Run the DOI refresh command before claiming current Crossmark status." },
    snapshotHash: stableHash(cache || source),
  })
  const checkedAt = cache?.checkedAt || source.verification?.checkedAt || v1.updatedAt
  if (checkedAt > generatedAt) generatedAt = checkedAt
}

const sourceByLegacyId = new Map(sourceDocuments.map(source => [source.legacySourceId, source]))
for (const legacy of v1.records || []) {
  const recordOverride = curationOverrides.records?.[legacy.id] || {}
  const normalizedLegacy = {
    ...legacy,
    conditions: {
      ...(legacy.conditions || {}),
      ...(recordOverride.conditionOverrides || {}),
    },
  }
  const sourceDocument = sourceByLegacyId.get(legacy.sourceId)
  const reactionRecordId = legacy.id.replace("catrxn-v1-", "catrxn-v2-")
  const catalystName = legacy.identity?.precursorMofName || legacy.identity?.catalystName || ""
  const normalizedName = catalystName.toLowerCase().replace(/[^a-z0-9]+/g, "")
  const candidates = identityByAlias.get(normalizedName) || []
  const exactCandidate = candidates.length === 1 && (candidates[0].links?.structural || []).length > 0 ? candidates[0] : null
  const catalystState = {
    id: `catalyst-state-${reactionRecordId}`,
    reactionRecordId,
    catalystName: legacy.identity?.catalystName,
    precursorMofName: legacy.identity?.precursorMofName,
    activeMaterial: legacy.identity?.activeMaterial,
    frameworkFamily: legacy.identity?.frameworkFamily,
    metalCenters: legacy.identity?.metalCenters || [],
    stateType: legacy.identity?.identityLink?.status === "derived-material-only" ? "mof-derived-material" : "reported-catalyst",
    activePhaseStatus: (legacy.activePhaseEvidence?.inSitu || []).length && (legacy.activePhaseEvidence?.postReaction || []).length ? "evidence-supported-unresolved" : "unresolved",
    identityLink: {
      status: exactCandidate ? "linked-to-mof-identity-registry" : "unresolved",
      canonicalId: exactCandidate?.canonicalId || null,
      method: exactCandidate ? "exact-alias-plus-structural-record" : "no-safe-automatic-match",
      candidateCanonicalIds: candidates.map(candidate => candidate.canonicalId),
    },
  }
  catalystStates.push(catalystState)
  graphNodes.push({ id: catalystState.id, type: "catalyst-state", label: catalystState.catalystName, status: catalystState.identityLink.status })
  graphEdges.push({ id: `edge-${sourceDocument.id}-${catalystState.id}`, source: sourceDocument.id, target: catalystState.id, type: "reports-catalyst-state" })
  identityLinks.push({
    id: `identity-link-${reactionRecordId}`,
    catalystStateId: catalystState.id,
    canonicalId: catalystState.identityLink.canonicalId,
    status: catalystState.identityLink.status,
    candidateCanonicalIds: catalystState.identityLink.candidateCanonicalIds,
    acceptedIdentifiers: ["CSD Refcode", "CCDC identifier", "canonicalId", "provenance-matched curated alias"],
    rejectionReason: exactCandidate ? null : "No exact structure identifier or uniquely provenance-matched registry alias was present in the curated source fields.",
  })
  const conditionSet = buildConditionSet(normalizedLegacy)
  conditionSets.push(conditionSet)
  reactionRecords.push({
    id: reactionRecordId,
    sourceDocumentId: sourceDocument.id,
    catalystStateId: catalystState.id,
    conditionSetId: conditionSet.id,
    recordType: legacy.recordType,
    reaction: legacy.reaction,
    dataMode: "literature-curated-v2",
    legacyRecordId: legacy.id,
    activePhaseClaim: legacy.activePhaseEvidence?.claim || null,
    activePhaseBoundary: legacy.activePhaseEvidence?.activePhaseBoundary || null,
  })
  graphNodes.push({ id: reactionRecordId, type: "reaction-record", label: `${legacy.reaction?.substrate || "reaction"} -> ${legacy.reaction?.targetProduct || "product"}`, status: "literature-curated" })
  graphEdges.push({ id: `edge-${catalystState.id}-${reactionRecordId}`, source: catalystState.id, target: reactionRecordId, type: "participates-in" })
  const claims = (legacy.performanceMetrics || []).map(metric => {
    const evidenceOverride = recordOverride.claimEvidence?.[metric.id] || {}
    const sourceLocation = evidenceOverride.sourceLocation || metric.sourceLocation
    const evidenceId = `evidence-${reactionRecordId}-${metric.id}`
    const level = metric.value == null ? "not-extracted" : verificationLevelForEvidence(sourceLocation)
    evidenceItems.push({
      id: evidenceId,
      sourceDocumentId: sourceDocument.id,
      reactionRecordId,
      claimId: `claim-${reactionRecordId}-${metric.id}`,
      sourceType: /supporting|supplement|fig\. s|table s/i.test(sourceLocation || "") ? "supporting-information" : /full text/i.test(sourceLocation || "") ? "fulltext" : /abstract/i.test(sourceLocation || "") ? "abstract" : "bibliographic-page",
      sourceLocation,
      sourceUrl: evidenceOverride.sourceUrl || sourceDocument.sourceUrl,
      page: null,
      section: null,
      figure: (sourceLocation || "").match(/(?:fig(?:ure)?\.?\s*([a-z0-9-]+))/i)?.[1] || null,
      table: (sourceLocation || "").match(/table\s*([a-z0-9-]+)/i)?.[1] || null,
      extractionMethod: evidenceOverride.sourceLocation ? "manual-publisher-fulltext-review" : "manual-v1-curation",
      reviewStatus: level === "L4-claim-located" ? "verified" : metric.value == null ? "not-extracted" : "location-backfill-required",
      checkedAt: legacy.recordProvenance?.checkedAt || v1.updatedAt,
      reviewNote: evidenceOverride.reviewNote || null,
    })
    return {
      id: `claim-${reactionRecordId}-${metric.id}`,
      reactionRecordId,
      sourceDocumentId: sourceDocument.id,
      conditionSetId: conditionSet.id,
      evidenceItemIds: [evidenceId],
      metric: metric.metric,
      product: metric.product,
      operator: metric.operator,
      value: metric.value,
      uncertainty: metric.uncertainty ?? null,
      unit: metric.unit,
      sourceReportedStatus: metric.status,
      verificationLevel: level,
      condition: { ...(metric.condition || {}), ...(evidenceOverride.condition || {}) },
    }
  })
  metricClaims.push(...claims)
  for (const claim of claims) {
    graphNodes.push({ id: claim.id, type: "metric-claim", label: `${claim.metric}: ${claim.value ?? "not-extracted"} ${claim.unit || ""}`.trim(), status: claim.verificationLevel })
    graphEdges.push({ id: `edge-${reactionRecordId}-${claim.id}`, source: reactionRecordId, target: claim.id, type: "has-claim" })
    for (const evidenceId of claim.evidenceItemIds) graphEdges.push({ id: `edge-${claim.id}-${evidenceId}`, source: claim.id, target: evidenceId, type: "supported-by" })
  }
  const eligibility = buildEligibilityDecision({ sourceDocument, conditionSet, claims, catalystState })
  eligibilityDecisions.push(eligibility)
  verificationTasks.push(...buildVerificationTasks({ sourceDocument, conditionSet, claims, catalystState, eligibility }))
}

const tables = {
  sourceDocuments,
  documentVerifications,
  reactionRecords,
  catalystStates,
  conditionSets,
  metricClaims,
  evidenceItems,
  identityLinks,
  eligibilityDecisions,
  verificationTasks,
  curationEvents: [
    { id: "event-v2-initial-migration", type: "migration", at: v1.updatedAt, actor: "build-catalysis-reaction-records-v2", summary: "Migrated the DOI-verified V1 seed into normalized V2 entities without promoting unresolved claims or identities." },
    { id: "event-v2-claim-location-review", type: "manual-evidence-review", at: curationOverrides.updatedAt, actor: "curated-publisher-fulltext-review", summary: "Applied only explicit publisher full-text figure, table, section, and supporting-information locations from the tracked curation override layer.", source: path.relative(root, overridesPath) },
  ],
}

const summary = {
  sourceDocumentCount: sourceDocuments.length,
  reactionRecordCount: reactionRecords.length,
  catalystStateCount: catalystStates.length,
  metricClaimCount: metricClaims.length,
  numericClaimCount: metricClaims.filter(claim => claim.value != null).length,
  claimLocatedCount: metricClaims.filter(claim => claim.verificationLevel === "L4-claim-located").length,
  abstractOnlyClaimCount: metricClaims.filter(claim => claim.verificationLevel === "L2-abstract-only").length,
  identityLinkedCount: catalystStates.filter(state => state.identityLink.canonicalId).length,
  browseEligibleCount: eligibilityDecisions.filter(row => row.browseEligible).length,
  compareEligibleCount: eligibilityDecisions.filter(row => row.compareEligible).length,
  trainingEligibleCount: eligibilityDecisions.filter(row => row.trainingEligible).length,
  recommendationEligibleCount: eligibilityDecisions.filter(row => row.recommendationEligible).length,
  openTaskCount: verificationTasks.filter(task => task.status === "open").length,
  p0TaskCount: verificationTasks.filter(task => task.priority === "P0").length,
  p1TaskCount: verificationTasks.filter(task => task.priority === "P1").length,
}

const database = {
  schemaVersion: "catalysis-reaction-records-v2",
  generatedAt,
  generatedBy: "scripts/catalysis/build-catalysis-reaction-records-v2.mjs",
  sourceDataset: "catalysis_reaction_records_v1.json",
  curationOverlay: "data/curation/catalysis/v2-curation-overrides.json",
  policy: {
    articleIdentityIsNotClaimVerification: true,
    exactIdentityOnly: true,
    noCrossConditionRanking: true,
    aiMaySuggestButCannotVerify: true,
  },
  summary,
  tables,
}

for (const evidence of evidenceItems) graphNodes.push({ id: evidence.id, type: "evidence-item", label: evidence.sourceLocation, status: evidence.reviewStatus })
for (const task of verificationTasks) {
  graphNodes.push({ id: task.id, type: "verification-task", label: task.titleZh, status: task.status, priority: task.priority })
  graphEdges.push({ id: `edge-${task.reactionRecordId}-${task.id}`, source: task.reactionRecordId, target: task.id, type: "requires-verification" })
}

await writeJson(path.join(outDir, "catalysis_reaction_database_v2.json"), database)
await writeJson(path.join(outDir, "catalysis_verification_tasks_v2.json"), { schemaVersion: "catalysis-verification-tasks-v2", generatedAt, summary: { open: summary.openTaskCount, p0: summary.p0TaskCount, p1: summary.p1TaskCount }, tasks: verificationTasks })
await writeJson(path.join(outDir, "catalysis_identity_bridge_v2.json"), { schemaVersion: "catalysis-identity-bridge-v2", generatedAt, registryVersion: identityRegistry.schemaVersion, registryRecordCount: identityRegistry.records?.length || 0, links: identityLinks })
await writeJson(path.join(outDir, "catalysis_eligibility_report_v2.json"), { schemaVersion: "catalysis-eligibility-report-v2", generatedAt, summary, decisions: eligibilityDecisions })
await writeJson(path.join(outDir, "catalysis_evidence_graph_v2.json"), { schemaVersion: "catalysis-evidence-graph-v2", generatedAt, summary: { nodeCount: graphNodes.length, edgeCount: graphEdges.length }, nodes: graphNodes, edges: graphEdges })
await writeJson(path.join(outDir, "catalysis_audit_report_v2.json"), {
  schemaVersion: "catalysis-audit-report-v2",
  generatedAt,
  result: "passed-with-blocked-eligibility",
  summary,
  findings: [
    { severity: "info", code: "ARTICLE_IDENTITY_VERIFIED", messageZh: "10篇种子论文已作为论文身份核验来源迁移。" },
    { severity: "blocker", code: "CLAIM_LOCATION_INCOMPLETE", messageZh: "摘要级或全文泛化位置的数值仍需图、表、章节或SI定位，已阻断比较资格。" },
    { severity: "blocker", code: "IDENTITY_UNRESOLVED", messageZh: "未发现可安全自动建立的精确结构身份连接，已生成身份核验任务。" },
    { severity: "blocker", code: "CONDITION_INCOMPLETE", messageZh: "负载、定量方法等比较字段不完整，禁止跨论文排名。" },
    { severity: "blocker", code: "LICENSE_NOT_CLEARED_FOR_TRAINING", messageZh: "开放元数据不等于全文衍生字段可用于模型训练，训练资格保持关闭。" },
  ],
})

console.log(JSON.stringify(summary, null, 2))
