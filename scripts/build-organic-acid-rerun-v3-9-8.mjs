import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { build } from "vite"

const root = resolve(import.meta.dirname, "..")
const dataRoot = resolve(root, "public/data")
const bundleDir = resolve(root, "node_modules/.cache/organic-acid-rerun-v3-9-8")

async function readJson(path) {
  return JSON.parse(await readFile(resolve(dataRoot, path), "utf8"))
}

function routeName(route = {}) {
  return route.route || route.routeName || `${route.hostMof || "Host"} + ${route.guestMetal || "guest"} ${route.routeType || "route"}`
}

function normalizedRanking(rows = [], routeLookup = new Map()) {
  return rows.map((row, index) => {
    const source = routeLookup.get(row.routeId) || {}
    return {
      routeId: row.routeId,
      route: routeName({ ...source, ...row }),
      hostMof: row.hostMof || source.hostMof || "pending",
      guestMetal: row.guestMetal || source.guestMetal || "pending",
      score: Number(row.finalHGCPS ?? row.score ?? 0),
      rank: Number(row.ranking ?? row.rank ?? index + 1),
    }
  }).sort((a, b) => a.rank - b.rank)
}

function stageRecord({ stage, version, descriptorSet, model, priceStatus, rows, notes, source }) {
  const routeRankings = normalizedRanking(rows)
  const alMofRank = routeRankings
    .filter(row => row.hostMof === "Al-MOF")
    .sort((a, b) => a.rank - b.rank)[0]?.rank ?? null
  return {
    stage,
    version,
    descriptorSet,
    model,
    priceStatus,
    top5Routes: routeRankings.slice(0, 5),
    alMofRank,
    routeRankings,
    notes,
    source,
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
  const { buildOrganicAcidHostGuestWorkbench } = await import(`${pathToFileURL(resolve(bundleDir, "rerun-bundle.mjs")).href}?t=${Date.now()}`)
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
  }
  const oldAudit = await readJson("organic_acid_audit_v3_9_7.json")
  const oldRerun = await readJson("organic_acid_rerun_v3_9_7.json")
  const costTable = await readJson("metal_precursor_cost_table.json")
  const workbench = buildOrganicAcidHostGuestWorkbench(input)
  const generatedAt = new Date().toISOString()
  const routeLookup = new Map(input.hostGuestRoutes.map(route => [route.routeId, route]))
  const compactAblation = {
    version: workbench.descriptorAblation.version,
    scoringSpecId: workbench.descriptorAblation.scoringSpecId,
    fixedWeights: workbench.descriptorAblation.fixedWeights,
    impactSummary: workbench.descriptorAblation.impactSummary,
    layers: workbench.descriptorAblation.layers.map(layer => ({
      id: layer.id,
      labelZh: layer.labelZh,
      labelEn: layer.labelEn,
      candidates: layer.candidates.map(row => ({
        routeId: row.routeId,
        routeName: row.routeName,
        hostMof: row.hostMof,
        guestMetal: row.guestMetal,
        score: row.score,
        rank: row.rank,
      })),
    })),
    boundary: workbench.descriptorAblation.boundary,
  }
  const compactProvenance = route => Object.fromEntries(Object.entries(route.routeFactorProvenance).map(([key, tuple]) => [
    key,
    {
      sourceDataset: tuple.sourceDataset,
      nRecords: tuple.nRecords,
      rawAggregate: tuple.rawAggregate,
      normalization: tuple.normalization,
      derivationLevel: tuple.derivationLevel,
      fallbackReason: tuple.fallbackReason,
    },
  ]))

  const artifact = {
    artifactId: "organic-acid-v3.9.8-real-price-rerun",
    version: workbench.version,
    generatedAt,
    scoringSpec: {
      specId: workbench.scoringSpec.specId,
      lockedAt: workbench.scoringSpec.lockedAt,
      policy: workbench.scoringSpec.policy,
      formula: workbench.scoringSpec.hgcpsFormula,
      dataRevision: "V3.9.8 replaces ten placeholder metal-price inputs; weights and descriptor definitions are unchanged.",
    },
    priceTable: {
      tableId: costTable.tableId,
      version: costTable.version,
      priceDate: costTable.priceDate,
      priceBasis: costTable.priceBasis,
      boundary: costTable.boundary,
    },
    auditReference: "organic_acid_audit_v3_9_8.json",
    recommendation: workbench.recommendation,
    hostRanking: workbench.hostSelection.rankedHosts.map(host => ({
      ranking: host.ranking,
      hostMof: host.displayName,
      hostScore: host.hostScore,
      ligandPathwaySupport: host.ligandPathwaySupport,
      synthesizabilityScore: host.synthesizabilityScore,
      derivationSummary: host.derivationSummary,
    })),
    routeRanking: workbench.complementarity.routeScores.map(route => ({
      ranking: route.ranking,
      routeId: route.routeId,
      routeName: route.routeName,
      hostMof: route.hostMof,
      guestMetal: route.guestMetal,
      finalHGCPS: route.finalHGCPS,
      scoreBreakdown: route.scoreBreakdown,
      computationCohort: route.computationCohort,
      participatingMofCount: route.participatingMofCount,
      participatingMofs: route.participatingMofs,
      structureAvailability: route.structureAvailability,
      routeFactorProvenance: compactProvenance(route),
      derivationSummary: route.derivationSummary,
      factorDerivationLevels: Object.fromEntries(Object.entries(route.routeFactorProvenance).map(([key, tuple]) => [
        key,
        tuple.derivationLevel,
      ])),
    })),
    descriptorAblation: compactAblation,
    sensitivity: workbench.sensitivityAnalysis.summary,
    boundary: "This is a locked-spec route-priority rerun with updated mixed-confidence price inputs, not experimental proof of catalytic performance. No post-hoc weight change was applied.",
  }

  const auditArtifact = {
    ...workbench.audit,
    version: "V3.9.8",
    generatedAt,
    scoringMutation: {
      applied: false,
      note: "V3.9.8 updates price data only. Spec-v2 weights and descriptor definitions remain locked.",
    },
    sourceVersions: {
      scoringSpec: workbench.scoringSpec.version,
      priceTable: costTable.version,
      rerun: workbench.version,
    },
  }

  const handAuthoredRows = input.hostGuestRoutes
    .map(route => ({
      ...route,
      finalHGCPS: Number([
        "hostStabilityScore",
        "hostPathwaySupportScore",
        "guestActivityCompensationScore",
        "hostGuestComplementarityScore",
        "evidenceConfidenceScore",
        "riskPenalty",
      ].reduce((product, key) => product * Number(route[key] ?? (key === "riskPenalty" ? 1 : 0)), 1).toFixed(3)),
    }))
    .sort((a, b) => b.finalHGCPS - a.finalHGCPS)
    .map((route, index) => ({ ...route, ranking: index + 1 }))
  const evolutionStages = [
    stageRecord({
      stage: "hand-authored proxy",
      version: "pre-V3.9.6",
      descriptorSet: ["hand-authored six route factors"],
      model: "unweighted six-factor product",
      priceStatus: "not included",
      rows: normalizedRanking(handAuthoredRows, routeLookup),
      notes: "Historical seed/proxy stage. Factors were hand-authored planning inputs and were not treated as real measurements.",
      source: "organic_acid_host_guest/host_guest_routes.json historical seed factors",
    }),
    stageRecord({
      stage: "real-data structural (V3.9.6)",
      version: "V3.9.6",
      descriptorSet: ["real-data structural host factors", "guest activity", "evidence", "risk retention"],
      model: "unweighted six-factor product",
      priceStatus: "not included",
      rows: normalizedRanking(oldAudit.rankingSensitivity?.baselineRanking || [], routeLookup),
      notes: "Preregistered real-data structural rerun. Sparse guest descriptors remain explicit fallback.",
      source: "organic_acid_audit_v3_9_7.json rankingSensitivity.baselineRanking",
    }),
    stageRecord({
      stage: "+ligand/synthesizability/economics (V3.9.7)",
      version: "V3.9.7",
      descriptorSet: ["structure", "ligand", "synthesizability", "placeholder economics", "guest activity", "evidence", "risk retention"],
      model: "eight-factor weighted geometric mean",
      priceStatus: "transparent placeholders",
      rows: normalizedRanking(oldRerun.routeRanking || [], routeLookup),
      notes: "Locked spec-v2 rerun before real-price replacement. Price rows were explicitly labeled TODO placeholders.",
      source: "organic_acid_rerun_v3_9_7.json",
    }),
    stageRecord({
      stage: "real prices (V3.9.8)",
      version: "V3.9.8",
      descriptorSet: ["structure", "ligand", "synthesizability", "real-price economics", "guest activity", "evidence", "risk retention"],
      model: "eight-factor weighted geometric mean",
      priceStatus: "June 2026 mixed-confidence screening values",
      rows: normalizedRanking(workbench.complementarity.routeScores, routeLookup),
      notes: "Ten named metal prices use the supplied June 2026 values. No weight or descriptor was changed after observing the rerun.",
      source: "organic_acid_rerun_v3_9_8.json + metal_precursor_cost_table.json",
    }),
  ]

  const rankingEvolution = {
    logId: "organic-acid-ranking-evolution-v3.9.8",
    version: "V3.9.8",
    generatedAt,
    appendPolicy: "Add a new stage record; never overwrite historical ranking snapshots.",
    stages: evolutionStages,
    descriptorAblation: compactAblation,
    boundary: "Ranking changes are methodological results. They are not experimental catalytic-performance proof.",
  }

  const derivedCache = {
    cacheId: "organic-acid-derived-factors-cache-v3.9.8",
    version: workbench.version,
    generatedAt,
    scoringSpecId: workbench.scoringSpec.specId,
    sourceVersions: auditArtifact.sourceVersions,
    hostRanking: artifact.hostRanking,
    routeRanking: artifact.routeRanking.map(({ routeFactorProvenance, ...route }) => route),
    descriptorAblation: compactAblation,
    audit: {
      proxyValidity: {
        descriptors: auditArtifact.proxyValidity?.descriptors,
        composite: auditArtifact.proxyValidity?.composite,
        lowValidityDescriptors: auditArtifact.proxyValidity?.lowValidityDescriptors,
      },
      familyFairness: {
        lowConfidenceFamilies: auditArtifact.familyFairness?.lowConfidenceFamilies,
      },
      rankingSensitivity: {
        summary: auditArtifact.rankingSensitivity?.summary,
        candidateRankDistributions: auditArtifact.rankingSensitivity?.candidateRankDistributions,
      },
      scoringMutation: auditArtifact.scoringMutation,
    },
    boundary: "Build-time artifact for report and UI reuse. Runtime builders still recompute for changed input data.",
  }

  const topRoute = artifact.routeRanking[0] || {}
  const methodologyShowcase = {
    artifactId: "organic-acid-methodology-showcase-v3.9.8",
    version: "V3.9.8",
    generatedAt,
    scoringSpec: artifact.scoringSpec,
    priceTable: artifact.priceTable,
    currentTopRoute: {
      routeId: topRoute.routeId,
      routeName: topRoute.routeName,
      finalHGCPS: topRoute.finalHGCPS,
      ranking: topRoute.ranking,
      factors: topRoute.scoreBreakdown,
      provenance: topRoute.routeFactorProvenance,
    },
    audit: {
      proxyValidity: auditArtifact.proxyValidity,
      familyFairness: {
        auditId: auditArtifact.familyFairness?.auditId,
        method: auditArtifact.familyFairness?.method,
        lowConfidenceFamilies: auditArtifact.familyFairness?.lowConfidenceFamilies,
        familyReports: (auditArtifact.familyFairness?.familyReports || []).map(row => ({
          family: row.family,
          structuralRecordCount: row.structuralRecordCount,
          outlierShare: row.outlierShare,
          confidence: row.confidence,
          confidenceReasons: row.confidenceReasons,
        })),
      },
      rankingSensitivity: auditArtifact.rankingSensitivity,
      scoringMutation: auditArtifact.scoringMutation,
    },
    descriptorAblation: {
      impactSummary: workbench.descriptorAblation.impactSummary,
      layers: workbench.descriptorAblation.layers.map(layer => ({
        id: layer.id,
        labelZh: layer.labelZh,
        labelEn: layer.labelEn,
        top5: layer.candidates.slice(0, 5).map(row => ({
          routeId: row.routeId,
          routeName: row.routeName,
          rank: row.rank,
          score: row.score,
        })),
      })),
    },
    boundary: artifact.boundary,
  }

  await Promise.all([
    writeFile(resolve(dataRoot, "organic_acid_rerun_v3_9_8.json"), `${JSON.stringify(artifact, null, 2)}\n`, "utf8"),
    writeFile(resolve(dataRoot, "organic_acid_audit_v3_9_8.json"), `${JSON.stringify(auditArtifact, null, 2)}\n`, "utf8"),
    writeFile(resolve(dataRoot, "organic_acid_ranking_evolution_log.json"), `${JSON.stringify(rankingEvolution, null, 2)}\n`, "utf8"),
    writeFile(resolve(dataRoot, "organic_acid_derived_factors_cache.json"), `${JSON.stringify(derivedCache, null, 2)}\n`, "utf8"),
    writeFile(resolve(dataRoot, "organic_acid_methodology_showcase_v3_9_8.json"), `${JSON.stringify(methodologyShowcase, null, 2)}\n`, "utf8"),
  ])
} finally {
  await rm(bundleDir, { recursive: true, force: true })
}
