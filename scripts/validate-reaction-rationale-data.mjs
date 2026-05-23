import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const dataDir = path.join(root, "public", "data")

const allowedEvidenceLevels = new Set(["A", "B", "C", "D"])
const allowedRouteGroups = new Set([
  "Sugar activation",
  "C1-to-formate route",
  "C2/C3-to-formate route",
  "Bicarbonate role",
  "Byproduct / carbon-loss route",
])
const requiredPathwayFields = [
  "edgeId",
  "from",
  "to",
  "module",
  "routeGroup",
  "evidenceLevel",
  "status",
  "validationNeeded",
  "uncertainty",
]
const fingerprintKeys = [
  "A1_sugarActivation",
  "A2_precursorGeneration",
  "A3_intermediateToFormate",
  "A4_formateRelease",
  "B1_byproductRisk",
]

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8"))
}

function normalizeLabel(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim()
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const pathways = readJson("catalytic_pathways_demo.json")
const nodes = readJson("pathway_nodes_demo.json")
const fingerprints = readJson("reaction_fingerprint_demo.json")
const readinessRows = readJson("mof_reaction_screening_tags.json")

assert(Array.isArray(pathways) && pathways.length > 0, "catalytic_pathways_demo.json must contain pathway rows.")
assert(Array.isArray(nodes) && nodes.length > 0, "pathway_nodes_demo.json must contain node rows.")
assert(Array.isArray(fingerprints), "reaction_fingerprint_demo.json must be an array.")
assert(Array.isArray(readinessRows), "mof_reaction_screening_tags.json must be an array.")

const nodeLabels = new Set(nodes.map(node => normalizeLabel(node.label)))
const toleratedMissingNodeLabels = new Set([
  normalizeLabel("Adsorbed formate / decomposition"),
  normalizeLabel("Glucose fragments"),
])

for (const [index, pathway] of pathways.entries()) {
  for (const field of requiredPathwayFields) {
    assert(pathway[field] !== undefined && pathway[field] !== null && pathway[field] !== "", `Pathway ${index + 1} is missing ${field}.`)
  }
  assert(allowedEvidenceLevels.has(pathway.evidenceLevel), `${pathway.edgeId} has invalid evidenceLevel ${pathway.evidenceLevel}.`)
  assert(allowedRouteGroups.has(pathway.routeGroup), `${pathway.edgeId} has invalid routeGroup ${pathway.routeGroup}.`)
  assert(Array.isArray(pathway.validationNeeded) && pathway.validationNeeded.length > 0, `${pathway.edgeId} requires validationNeeded entries.`)
  for (const endpoint of [pathway.from, pathway.to]) {
    const normalized = normalizeLabel(endpoint)
    assert(nodeLabels.has(normalized) || toleratedMissingNodeLabels.has(normalized), `${pathway.edgeId} endpoint "${endpoint}" is not represented in pathway_nodes_demo.json.`)
  }
}

for (const [index, row] of fingerprints.entries()) {
  assert(row.mofId || row.displayName, `Fingerprint row ${index + 1} requires mofId or displayName.`)
  assert(row.fingerprint && typeof row.fingerprint === "object", `Fingerprint row ${index + 1} requires fingerprint object.`)
  for (const key of fingerprintKeys) {
    const value = row.fingerprint[key]
    assert(Number.isFinite(Number(value)), `${row.mofId || row.displayName} ${key} must be numeric.`)
    assert(Number(value) >= 0 && Number(value) <= 100, `${row.mofId || row.displayName} ${key} must be within 0-100.`)
  }
}

for (const [index, row] of readinessRows.entries()) {
  assert(row.mofId || row.displayName, `Readiness row ${index + 1} requires mofId or displayName.`)
  assert(row.reactionReadiness && typeof row.reactionReadiness === "object", `Readiness row ${index + 1} requires reactionReadiness object.`)
  for (const [key, value] of Object.entries(row.reactionReadiness)) {
    const normalized = String(value || "").toLowerCase()
    if (normalized.includes("unknown") || normalized.includes("pending")) {
      assert(!/(favorable|positive|validated|confirmed)/i.test(normalized), `${row.mofId || row.displayName} ${key} mixes unknown with positive language.`)
    }
  }
}

console.log(`Reaction rationale data validation passed: ${pathways.length} pathways, ${nodes.length} nodes, ${fingerprints.length} fingerprint rows.`)
