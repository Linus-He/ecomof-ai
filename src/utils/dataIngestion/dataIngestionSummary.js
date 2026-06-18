// @ts-nocheck
import { auditDatasetOrigin } from "./datasetOriginAudit.js"

export const V3_3_TARGETS = {
  total: 3000,
  totalMin: 2000,
  coreMof: 1200,
  qmof: 1200,
  literature: 500,
  verifiedMetadata: 500,
  goldDataset: 300,
  reactionDataset: 500,
  benchmarkDataset: 500,
}

const len = dataset => {
  if (!dataset) return 0
  if (Array.isArray(dataset)) return dataset.length
  if (Number.isFinite(dataset.count)) return dataset.count
  if (Array.isArray(dataset.records)) return dataset.records.length
  if (Number.isFinite(dataset.total)) return dataset.total
  if (Number.isFinite(dataset.verifiedCount)) return dataset.verifiedCount
  return 0
}

const cell = (current, target) => ({ current, target, gap: Math.max(0, target - current) })

// Single read model the UI uses for V3.3 data-source breakdown + growth.
export function dataIngestionSummary({ core, qmof, literature, gold, verified, reaction, benchmark, growth } = {}) {
  const coreCount = len(core)
  const qmofCount = len(qmof)
  const literatureCount = len(literature)
  const goldCount = len(gold)
  const reactionCount = len(reaction)
  const benchmarkCount = len(benchmark)
  const verifiedCount = Number(verified?.verifiedCount ?? verified?.total ?? len(verified)) || 0

  // Origin audit over the union of imported records.
  const unionRecords = [
    ...(Array.isArray(core?.records) ? core.records : Array.isArray(core) ? core : []),
    ...(Array.isArray(qmof?.records) ? qmof.records : Array.isArray(qmof) ? qmof : []),
    ...(Array.isArray(literature?.records) ? literature.records : Array.isArray(literature) ? literature : []),
    ...(Array.isArray(reaction?.records) ? reaction.records : Array.isArray(reaction) ? reaction : []),
  ]
  const originAudit = auditDatasetOrigin(unionRecords)

  const externalDatabaseCount = coreCount + qmofCount
  const derivedCount = originAudit.derived
  const experimentalCount = originAudit.experimental
  const totalRealRecords = externalDatabaseCount + literatureCount
  const totalRecords = totalRealRecords // synthetic fixtures excluded from the headline total

  const breakdown = {
    externalDatabase: totalRecords ? Number((externalDatabaseCount / totalRecords).toFixed(3)) : 0,
    literature: totalRecords ? Number((literatureCount / totalRecords).toFixed(3)) : 0,
    experimental: totalRecords ? Number((experimentalCount / totalRecords).toFixed(3)) : 0,
    derived: totalRecords ? Number((derivedCount / totalRecords).toFixed(3)) : 0,
  }

  return {
    version: "V3.3",
    totalRecords,
    totalRealRecords,
    externalDatabaseCount,
    coreCount,
    qmofCount,
    literatureCount,
    experimentalCount,
    derivedCount,
    verifiedMetadataCount: verifiedCount,
    goldCount,
    reactionCount,
    benchmarkCount,
    originAudit,
    breakdown,
    targets: V3_3_TARGETS,
    stats: {
      total: cell(totalRecords, V3_3_TARGETS.total),
      coreMof: cell(coreCount, V3_3_TARGETS.coreMof),
      qmof: cell(qmofCount, V3_3_TARGETS.qmof),
      literature: cell(literatureCount, V3_3_TARGETS.literature),
      verifiedMetadata: cell(verifiedCount, V3_3_TARGETS.verifiedMetadata),
      goldDataset: cell(goldCount, V3_3_TARGETS.goldDataset),
      reactionDataset: cell(reactionCount, V3_3_TARGETS.reactionDataset),
    },
    acceptance: {
      totalMin: totalRecords >= V3_3_TARGETS.totalMin,
      total: totalRecords >= V3_3_TARGETS.total,
      coreMof: coreCount >= V3_3_TARGETS.coreMof,
      qmof: qmofCount >= V3_3_TARGETS.qmof,
      literature: literatureCount >= V3_3_TARGETS.literature,
      verifiedMetadata: verifiedCount >= V3_3_TARGETS.verifiedMetadata,
      goldDataset: goldCount >= V3_3_TARGETS.goldDataset,
      reactionDataset: reactionCount >= V3_3_TARGETS.reactionDataset,
    },
    growth: growth || null,
  }
}
