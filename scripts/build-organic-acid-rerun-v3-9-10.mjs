import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { build } from "vite"

const root = resolve(import.meta.dirname, "..")
const dataRoot = resolve(root, "public/data")
const bundleDir = resolve(root, "node_modules/.cache/organic-acid-rerun-v3-9-10")

const readJson = async file => JSON.parse(await readFile(resolve(dataRoot, file), "utf8"))
const round = (value, digits = 6) => Number(Number(value || 0).toFixed(digits))

function compactTuple(tuple = {}) {
  return {
    sourceDataset: tuple.sourceDataset,
    nRecords: tuple.nRecords,
    rawAggregate: tuple.rawAggregate,
    normalization: tuple.normalization,
    value: tuple.value,
    derivationLevel: tuple.derivationLevel,
    recordRefs: tuple.recordRefs,
    citations: tuple.citations,
    fallbackReason: tuple.fallbackReason,
  }
}

function compactRoute(route = {}) {
  return {
    ranking: route.ranking,
    routeId: route.routeId,
    routeName: route.routeName,
    hostMof: route.hostMof,
    guestMetal: route.guestMetal,
    finalHGCPS: route.finalHGCPS,
    scoreBreakdown: route.scoreBreakdown,
    participatingMofCount: route.participatingMofCount,
    participatingMofs: route.participatingMofs,
    structureAvailability: route.structureAvailability,
    routeFactorProvenance: Object.fromEntries(
      Object.entries(route.routeFactorProvenance || {}).map(([key, tuple]) => [key, compactTuple(tuple)]),
    ),
    derivationSummary: route.derivationSummary,
  }
}

function compactHost(host = {}) {
  return {
    ranking: host.ranking,
    hostMof: host.displayName,
    family: host.family,
    hostScore: host.hostScore,
    stabilityProxy: host.stabilityProxy,
    synthesizabilityScore: host.synthesizabilityScore,
    stabilityEvidenceConfidence: host.factorProvenance?.stabilityProxy?.rawAggregate?.evidenceConfidence ?? 0,
    synthesisEvidenceConfidence: host.factorProvenance?.synthesizabilityScore?.rawAggregate?.evidenceConfidence ?? 0,
    synthesisEffectiveUniqueConditions: host.factorProvenance?.synthesizabilityScore?.rawAggregate?.effectiveUniqueConditions ?? 0,
    factorProvenance: Object.fromEntries(
      Object.entries(host.factorProvenance || {}).map(([key, tuple]) => [key, compactTuple(tuple)]),
    ),
    derivationSummary: host.derivationSummary,
  }
}

function rankingStage(workbench, generatedAt) {
  return {
    stage: "abundance-neutral + FAIR-MOFs (V3.9.10)",
    version: "V3.9.10",
    generatedAt,
    descriptorSet: [
      "abundance-neutral CoRE stability properties",
      "FAIR-MOFs synthesis-condition accessibility",
      "structure",
      "ligand",
      "real-price economics",
      "guest activity",
      "evidence",
      "risk retention"
    ],
    model: "locked spec-v3 eight-factor weighted geometric mean",
    priceStatus: "June 2026 mixed-confidence screening values",
    top5Routes: workbench.complementarity.routeScores.slice(0, 5).map(route => ({
      routeId: route.routeId,
      route: route.routeName,
      hostMof: route.hostMof,
      guestMetal: route.guestMetal,
      score: route.finalHGCPS,
      rank: route.ranking,
    })),
    routeRankings: workbench.complementarity.routeScores.map(route => ({
      routeId: route.routeId,
      route: route.routeName,
      hostMof: route.hostMof,
      guestMetal: route.guestMetal,
      score: route.finalHGCPS,
      rank: route.ranking,
    })),
    notes: "Spec v3 keeps route weights fixed, removes direct same-family database-frequency scoring, derives stability from shrunk CoRE source properties, and replaces the old synthesis-frequency proxy with FAIR-MOFs reported-condition accessibility. Sample size controls shrinkage, confidence, and uncertainty only.",
    source: "organic_acid_rerun_v3_9_10.json + organic_acid_scoring_spec_v3.json + fair_mofs_family_synthesis_evidence.json",
  }
}

await mkdir(bundleDir, { recursive: true })

try {
  await build({
    configFile: false,
    root,
    build: {
      ssr: resolve(root, "src/utils/organicAcidHostGuest/index.js"),
      outDir: bundleDir,
      emptyOutDir: true,
      minify: false,
      rollupOptions: {
        output: { entryFileNames: "rerun-bundle.mjs", format: "es" },
      },
    },
    logLevel: "silent",
  })

  const { buildOrganicAcidHostGuestWorkbench } = await import(
    `${pathToFileURL(resolve(bundleDir, "rerun-bundle.mjs")).href}?t=${Date.now()}`,
  )
  const input = {
    pathwaySteps: await readJson("organic_acid_host_guest/pathway_steps.json"),
    pathwayDescriptorMap: await readJson("organic_acid_host_guest/pathway_descriptor_map.json"),
    hostMofCandidates: await readJson("organic_acid_host_guest/host_mof_candidates.json"),
    guestMetalCandidates: await readJson("organic_acid_host_guest/guest_metal_candidates.json"),
    hostGuestRoutes: await readJson("organic_acid_host_guest/host_guest_routes.json"),
    evidenceRiskRecords: await readJson("organic_acid_host_guest/evidence_risk_records.json"),
    validationExperiments: await readJson("organic_acid_host_guest/validation_experiments.json"),
    coreMofImport: await readJson("data_ingestion/core_mof_import_v2.json"),
    qmofImport: await readJson("data_ingestion/qmof_import_v2.json"),
    reactionDataset: await readJson("data_ingestion/organic_acid_reaction_dataset_v1.json"),
    gasAdsorptionRecords: await readJson("gas_adsorption_records_v1.json"),
    literatureDataset: await readJson("organic_acid_literature_dataset_v2.json"),
    goldDataset: await readJson("organic_acid_gold_dataset_v2.json"),
    fairMofsFamilyEvidence: await readJson("fair_mofs_family_synthesis_evidence.json"),
  }
  const [costTable, previousEvolution, fairQuality] = await Promise.all([
    readJson("metal_precursor_cost_table.json"),
    readJson("organic_acid_ranking_evolution_log.json"),
    readJson("fair_mofs_quality_report.json"),
  ])
  const workbench = buildOrganicAcidHostGuestWorkbench(input)
  const duplicateCoreWorkbench = buildOrganicAcidHostGuestWorkbench({
    ...input,
    coreMofImport: {
      ...input.coreMofImport,
      records: [...(input.coreMofImport.records || []), ...(input.coreMofImport.records || [])],
    },
  })
  const duplicateHostByName = new Map(
    duplicateCoreWorkbench.hostSelection.rankedHosts.map(host => [host.displayName, host]),
  )
  const duplicateDeltas = workbench.hostSelection.rankedHosts.map(host => {
    const duplicate = duplicateHostByName.get(host.displayName)
    return {
      hostMof: host.displayName,
      stabilityDelta: round(Number(duplicate?.stabilityProxy || 0) - Number(host.stabilityProxy || 0)),
      synthesizabilityDelta: round(Number(duplicate?.synthesizabilityScore || 0) - Number(host.synthesizabilityScore || 0)),
    }
  })
  const maxDuplicatePointDelta = Math.max(
    0,
    ...duplicateDeltas.flatMap(row => [Math.abs(row.stabilityDelta), Math.abs(row.synthesizabilityDelta)]),
  )
  const generatedAt = new Date().toISOString()
  const topRoute = workbench.complementarity.topRoute
  const artifact = {
    artifactId: "organic-acid-v3.9.10-abundance-neutral-fair-mofs-rerun",
    version: workbench.version,
    generatedAt,
    scoringSpec: {
      specId: workbench.scoringSpec.specId,
      version: workbench.scoringSpec.version,
      lockedAt: workbench.scoringSpec.lockedAt,
      policy: workbench.scoringSpec.policy,
      formula: workbench.scoringSpec.hgcpsFormula,
      dataRevision: "V3.9.10 keeps all eight route weights fixed, removes direct family-frequency scoring, and replaces the old synthesis-frequency proxy with FAIR-MOFs synthesis-condition accessibility.",
    },
    fairMofs: {
      source: input.fairMofsFamilyEvidence.source,
      globalPrior: input.fairMofsFamilyEvidence.globalPrior,
      qualityStatus: fairQuality.status,
      checksumPassed: fairQuality.checks?.checksumPassed,
      familyEvidence: input.fairMofsFamilyEvidence.families,
    },
    priceTable: {
      tableId: costTable.tableId,
      version: costTable.version,
      priceDate: costTable.priceDate,
      boundary: costTable.boundary,
    },
    abundanceBiasAudit: {
      rawFamilyFrequencyUsedAsPointScore: false,
      duplicateCorePointInvariant: maxDuplicatePointDelta === 0,
      maxDuplicatePointDelta,
      duplicateDeltas,
      countUses: ["empirical-Bayes shrinkage", "evidence confidence", "uncertainty reporting", "coverage display"],
      note: "Duplicate test covers the stability and synthesis-condition accessibility point factors. Evidence confidence may change only when genuinely distinct evidence identities are added.",
    },
    recommendation: workbench.recommendation,
    hostRanking: workbench.hostSelection.rankedHosts.map(compactHost),
    routeRanking: workbench.complementarity.routeScores.map(compactRoute),
    sensitivity: workbench.sensitivityAnalysis.summary,
    descriptorAblation: workbench.descriptorAblation,
    boundary: "Route-priority research hypothesis only. FAIR-MOFs condition accessibility is not synthesis-success probability, and no Mo-modified structure is shown unless an exact experimental modified CIF exists.",
  }

  const auditArtifact = {
    ...workbench.audit,
    version: "V3.9.10",
    generatedAt,
    scoringMutation: {
      applied: true,
      preregistered: true,
      note: "Spec v3 kept route weights fixed, removed direct family-frequency scoring, changed stability aggregation to abundance-neutral shrunk source properties, and replaced synthesis frequency with FAIR-MOFs condition accessibility.",
    },
    abundanceBiasAudit: artifact.abundanceBiasAudit,
    sourceVersions: {
      scoringSpec: workbench.scoringSpec.version,
      fairMofs: input.fairMofsFamilyEvidence.version,
      coreMof: input.coreMofImport.sourceVersion || input.coreMofImport.version,
      priceTable: costTable.version,
      rerun: workbench.version,
    },
  }

  const existingStages = (previousEvolution.stages || []).filter(stage => stage.version !== "V3.9.10")
  const rankingEvolution = {
    ...previousEvolution,
    logId: "organic-acid-ranking-evolution-v3.9.10",
    version: "V3.9.10",
    generatedAt,
    appendPolicy: "Add a new stage record; never overwrite historical ranking snapshots.",
    stages: [...existingStages, rankingStage(workbench, generatedAt)],
    boundary: "Ranking changes are methodological results, not experimental catalytic-performance proof.",
  }

  const derivedCache = {
    cacheId: "organic-acid-derived-factors-cache-v3.9.10",
    version: workbench.version,
    generatedAt,
    scoringSpecId: workbench.scoringSpec.specId,
    sourceVersions: auditArtifact.sourceVersions,
    hostRanking: artifact.hostRanking,
    routeRanking: artifact.routeRanking,
    abundanceBiasAudit: artifact.abundanceBiasAudit,
    audit: {
      proxyValidity: auditArtifact.proxyValidity,
      familyFairness: auditArtifact.familyFairness,
      rankingSensitivity: auditArtifact.rankingSensitivity,
      scoringMutation: auditArtifact.scoringMutation,
    },
    boundary: "Build-time artifact for report and UI reuse. Runtime builders still recompute when source inputs change.",
  }

  const methodologyShowcase = {
    artifactId: "organic-acid-methodology-showcase-v3.9.10",
    version: "V3.9.10",
    generatedAt,
    scoringSpec: artifact.scoringSpec,
    fairMofs: artifact.fairMofs,
    currentTopRoute: {
      routeId: topRoute.routeId,
      routeName: topRoute.routeName,
      finalHGCPS: topRoute.finalHGCPS,
      ranking: topRoute.ranking,
      factors: topRoute.scoreBreakdown,
      provenance: Object.fromEntries(
        Object.entries(topRoute.routeFactorProvenance || {}).map(([key, tuple]) => [key, compactTuple(tuple)]),
      ),
    },
    audit: {
      proxyValidity: auditArtifact.proxyValidity,
      familyFairness: auditArtifact.familyFairness,
      rankingSensitivity: auditArtifact.rankingSensitivity,
      scoringMutation: auditArtifact.scoringMutation,
      abundanceBiasAudit: artifact.abundanceBiasAudit,
    },
    descriptorAblation: artifact.descriptorAblation,
    boundary: artifact.boundary,
  }

  await Promise.all([
    writeFile(resolve(dataRoot, "organic_acid_rerun_v3_9_10.json"), `${JSON.stringify(artifact, null, 2)}\n`, "utf8"),
    writeFile(resolve(dataRoot, "organic_acid_audit_v3_9_10.json"), `${JSON.stringify(auditArtifact, null, 2)}\n`, "utf8"),
    writeFile(resolve(dataRoot, "organic_acid_ranking_evolution_log.json"), `${JSON.stringify(rankingEvolution, null, 2)}\n`, "utf8"),
    writeFile(resolve(dataRoot, "organic_acid_derived_factors_cache.json"), `${JSON.stringify(derivedCache, null, 2)}\n`, "utf8"),
    writeFile(resolve(dataRoot, "organic_acid_methodology_showcase_v3_9_10.json"), `${JSON.stringify(methodologyShowcase, null, 2)}\n`, "utf8"),
  ])

  console.log(JSON.stringify({
    version: artifact.version,
    topRoute: {
      routeId: topRoute.routeId,
      routeName: topRoute.routeName,
      score: topRoute.finalHGCPS,
    },
    topHost: artifact.hostRanking[0],
    abundanceBiasAudit: artifact.abundanceBiasAudit,
  }, null, 2))
} finally {
  await rm(bundleDir, { recursive: true, force: true })
}
