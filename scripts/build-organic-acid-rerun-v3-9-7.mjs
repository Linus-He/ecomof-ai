import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { build } from "vite"

const root = resolve(import.meta.dirname, "..")
const bundleDir = resolve(root, "node_modules/.cache/organic-acid-rerun")

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, "public/data", path), "utf8"))
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
  const workbench = buildOrganicAcidHostGuestWorkbench(input)
  const artifact = {
    artifactId: "organic-acid-v3.9.7-preregistered-rerun",
    version: workbench.version,
    generatedAt: new Date().toISOString(),
    scoringSpec: {
      specId: workbench.scoringSpec.specId,
      lockedAt: workbench.scoringSpec.lockedAt,
      policy: workbench.scoringSpec.policy,
      formula: workbench.scoringSpec.hgcpsFormula,
    },
    auditReference: "organic_acid_audit_v3_9_7.json",
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
      derivationSummary: route.derivationSummary,
      factorDerivationLevels: Object.fromEntries(Object.entries(route.routeFactorProvenance).map(([key, tuple]) => [
        key,
        tuple.derivationLevel,
      ])),
    })),
    sensitivity: workbench.sensitivityAnalysis.summary,
    boundary: "This is a preregistered route-priority rerun, not experimental proof of catalytic performance. No post-hoc weight change was applied.",
  }
  await writeFile(
    resolve(root, "public/data/organic_acid_rerun_v3_9_7.json"),
    `${JSON.stringify(artifact, null, 2)}\n`,
    "utf8",
  )
} finally {
  await rm(bundleDir, { recursive: true, force: true })
}
