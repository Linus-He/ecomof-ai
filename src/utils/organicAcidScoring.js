import { clamp } from "./scoring"

const STABILITY_POINTS = {
  high: 18,
  medium: 10,
  low: 3,
  unknown: 6,
  unmarked: 6,
}

const TOXICITY_PENALTY = {
  low: 0,
  medium: 5,
  high: 10,
  unknown: 3,
  unmarked: 3,
}

const EVIDENCE_PENALTY = {
  computed: 0,
  "literature-derived": 3,
  literature: 3,
  demo: 6,
  hypothesis: 8,
  pending: 12,
  "needs-validation": 12,
}

export function mapEvidenceConfidence(status) {
  const text = String(status || "").toLowerCase()
  if (text.includes("experimental")) return 90
  if (text.includes("computed")) return 85
  if (text.includes("dft")) return 80
  if (text.includes("literature")) return 70
  if (text.includes("demo")) return 40
  if (text.includes("hypothesis")) return 30
  if (text.includes("pending")) return 15
  return 20
}

function normalizedText(value, fallback = "unknown") {
  if (Array.isArray(value)) return normalizedText(value[0], fallback)
  return String(value || fallback).trim().toLowerCase()
}

function relevanceRoles(candidate) {
  const roles = candidate?.organicAcidRelevance?.possibleRoles
  return Array.isArray(roles) ? roles : []
}

function hasRole(roles, pattern) {
  return roles.some(item => pattern.test(`${item.role || ""} ${item.label || ""} ${item.relatedPathwayNode || ""}`))
}

export function calculateFormicAcidPathwayScore(candidate = {}) {
  const roles = relevanceRoles(candidate)
  const graph = candidate.graphMetadata || {}
  const relevance = candidate.organicAcidRelevance || {}
  const waterScore = STABILITY_POINTS[normalizedText(candidate.waterStability)] ?? STABILITY_POINTS.unknown
  const thermalScore = STABILITY_POINTS[normalizedText(candidate.thermalStability)] ?? STABILITY_POINTS.unknown
  const graphMotifScore = Number(graph.graphMotifScore || 0)
  const activeMotifBonus = hasRole(roles, /active|c1_intermediate|motif/i) ? 8 : 0
  const hco3RoleBonus = hasRole(roles, /hco3|hcoo|formate/i) ? 7 : 0
  const diversityScore = Number(graph.diversityScore || 0)
  const diversityBonus = diversityScore >= 0.75 ? 5 : diversityScore >= 0.5 ? 3 : 0
  const roleCount = roles.length
  const roleBonus = Math.min(10, roleCount * 3)
  const toxicityPenalty = TOXICITY_PENALTY[normalizedText(candidate.toxicityConcern)] ?? TOXICITY_PENALTY.unknown
  const evidenceKey = normalizedText(relevance.scoreStatus || graph.graphConfidence || graph.graphStatus || candidate.evidenceLevel, "pending")
  const evidencePenalty = EVIDENCE_PENALTY[evidenceKey] ?? EVIDENCE_PENALTY.pending
  const finalScore = clamp(
    30 + waterScore + thermalScore + graphMotifScore + activeMotifBonus + hco3RoleBonus + diversityBonus + roleBonus - toxicityPenalty - evidencePenalty
  )

  return {
    finalScore: Number(finalScore.toFixed(1)),
    waterScore,
    thermalScore,
    graphMotifScore,
    activeMotifBonus,
    hco3RoleBonus,
    diversityBonus,
    roleCount,
    toxicityPenalty,
    evidencePenalty,
    status: relevance.scoreStatus || graph.graphConfidence || graph.graphStatus || "pending",
  }
}
